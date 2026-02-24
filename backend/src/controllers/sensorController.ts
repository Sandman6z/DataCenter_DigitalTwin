import { Request, Response } from 'express';
import SensorData from '../models/sensorData';

// 传感器数据控制器
class SensorController {
  // 获取最新的传感器数据
  async getLatestData(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.query;
      
      const query: any = {};
      if (deviceId) {
        query.deviceId = deviceId;
      }

      const data = await SensorData.findOne(query)
        .sort({ timestamp: -1 })
        .exec();

      if (data) {
        res.status(200).json(data);
      } else {
        res.status(404).json({ message: 'No sensor data found' });
      }
    } catch (error) {
      console.error('Error getting latest sensor data:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // 获取历史传感器数据
  async getHistoricalData(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId, startTime, endTime, limit = 100 } = req.query;
      
      const query: any = {};
      if (deviceId) {
        query.deviceId = deviceId;
      }
      if (startTime) {
        query.timestamp = { ...query.timestamp, $gte: parseInt(startTime as string) };
      }
      if (endTime) {
        query.timestamp = { ...query.timestamp, $lte: parseInt(endTime as string) };
      }

      const data = await SensorData.find(query)
        .sort({ timestamp: -1 })
        .limit(parseInt(limit as string))
        .exec();

      res.status(200).json(data);
    } catch (error) {
      console.error('Error getting historical sensor data:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // 获取设备列表
  async getDevices(_req: Request, res: Response): Promise<void> {
    try {
      const devices = await SensorData.distinct('deviceId').exec();
      res.status(200).json(devices);
    } catch (error) {
      console.error('Error getting devices:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // 接收HTTP POST的传感器数据（备用方案）
  async receiveData(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body;
      
      // 验证数据格式
      if (!data.deviceId || typeof data.temperature !== 'number' || typeof data.humidity !== 'number') {
        res.status(400).json({ message: 'Invalid data format' });
        return;
      }

      // 保存数据到数据库
      const sensorData = new SensorData({
        deviceId: data.deviceId,
        timestamp: data.timestamp || Date.now(),
        temperature: data.temperature,
        humidity: data.humidity,
        status: this.getStatus(data.temperature, data.humidity)
      });

      await sensorData.save();
      console.log('Sensor data saved via HTTP:', data);

      // 广播数据到前端（如果需要）
      // 注意：这里需要在路由中注入socket.io实例

      res.status(201).json({ message: 'Sensor data received', data: sensorData });
    } catch (error) {
      console.error('Error receiving sensor data:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
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
}

// 导出控制器实例
export default new SensorController();
