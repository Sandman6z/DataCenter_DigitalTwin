import mqtt from 'mqtt';
import SensorData from '../models/sensorData';
import { Server } from 'socket.io';

// MQTT配置
const MQTT_CONFIG = {
  host: 'mqtt://localhost', // 替换为实际的MQTT broker地址
  port: 1883,
  topic: 'sensor/data', // 替换为实际的MQTT主题
  clientId: `mqtt-client-${Math.random().toString(16).substr(2, 8)}`
};

// MQTT服务类
class MqttService {
  private client: mqtt.MqttClient | null = null;
  private io: Server | null = null;

  // 初始化MQTT连接
  init(io: Server) {
    this.io = io;
    
    try {
      this.client = mqtt.connect(MQTT_CONFIG.host, {
        port: MQTT_CONFIG.port,
        clientId: MQTT_CONFIG.clientId,
        clean: true
      });

      this.client.on('connect', () => {
        console.log('MQTT connected');
        this.client?.subscribe(MQTT_CONFIG.topic, (err) => {
          if (err) {
            console.error('MQTT subscribe error:', err);
          } else {
            console.log('MQTT subscribed to topic:', MQTT_CONFIG.topic);
          }
        });
      });

      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message);
      });

      this.client.on('error', (err) => {
        console.error('MQTT error:', err);
      });

      this.client.on('close', () => {
        console.log('MQTT connection closed');
      });

    } catch (error) {
      console.error('MQTT initialization error:', error);
    }
  }

  // 处理MQTT消息
  private async handleMessage(_topic: string, message: Buffer) {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received MQTT message:', data);

      // 验证数据格式
      if (this.validateData(data)) {
        // 保存数据到数据库
        const sensorData = new SensorData({
          deviceId: data.deviceId,
          timestamp: data.timestamp,
          temperature: data.temperature,
          humidity: data.humidity,
          status: this.getStatus(data.temperature, data.humidity)
        });

        await sensorData.save();
        console.log('Sensor data saved to database');

        // 广播数据到前端
        if (this.io) {
          this.io.emit('sensor-data', data);
          console.log('Sensor data broadcasted to clients');
        }
      } else {
        console.error('Invalid data format:', data);
      }
    } catch (error) {
      console.error('Error handling MQTT message:', error);
    }
  }

  // 验证数据格式
  private validateData(data: any): boolean {
    return (
      data.deviceId &&
      typeof data.timestamp === 'number' &&
      typeof data.temperature === 'number' &&
      typeof data.humidity === 'number'
    );
  }

  // 根据温湿度获取状态
  private getStatus(temperature: number, humidity: number): string {
    if (temperature > 30) {
      return 'high-temperature';
    } else if (humidity > 80) {
      return 'high-humidity';
    } else {
      return 'normal';
    }
  }

  // 发布消息
  publish(topic: string, message: any) {
    if (this.client && this.client.connected) {
      this.client.publish(topic, JSON.stringify(message), (err) => {
        if (err) {
          console.error('MQTT publish error:', err);
        }
      });
    }
  }

  // 断开连接
  disconnect() {
    if (this.client) {
      this.client.end();
      this.client = null;
    }
  }
}

// 导出单例
export default new MqttService();
