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
  async receiveData(req: Request, res: Response, io: any): Promise<void> {
    try {
      const data = req.body;
      
      // 验证数据格式
      if (!data.deviceId || typeof data.temperature !== 'number' || typeof data.humidity !== 'number') {
        res.status(400).json({ message: 'Invalid data format' });
        return;
      }

      // 计算状态
      let status = 'normal';
      if (data.temperature > 30) {
        status = 'high-temperature';
      } else if (data.humidity > 80) {
        status = 'high-humidity';
      }

      // 保存数据到数据库
      const sensorData = new SensorData({
        deviceId: data.deviceId,
        timestamp: data.timestamp || Date.now(),
        temperature: data.temperature,
        humidity: data.humidity,
        status: status
      });

      await sensorData.save();
      console.log('Sensor data saved via HTTP:', data);

      // 广播数据到前端
      io.emit('sensor-data', data);
      console.log('Sensor data broadcasted to clients');

      res.status(201).json({ message: 'Sensor data received', data: sensorData });
    } catch (error) {
      console.error('Error receiving sensor data:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }


}

// 导出控制器实例
export default new SensorController();
