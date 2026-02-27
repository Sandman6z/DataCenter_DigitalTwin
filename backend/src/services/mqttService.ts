import mqtt from 'mqtt';
import { Server } from 'socket.io';
import sensorService from './sensorService';

// MQTT配置
const MQTT_CONFIG = {
  host: process.env.MQTT_BROKER || 'mqtt://localhost',
  port: parseInt(process.env.MQTT_PORT || '1883'),
  topic: process.env.MQTT_TOPIC || 'datacenter/sensors',
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

      // 使用 SensorService 处理数据
      await sensorService.processSensorData(data, this.io || undefined);
      console.log('Sensor data processed successfully');
    } catch (error) {
      console.error('Error handling MQTT message:', error instanceof Error ? error.message : error);
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
