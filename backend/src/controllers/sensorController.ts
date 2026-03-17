import { Request, Response } from 'express';
import sensorService from '../services/sensorService';

// 传感器数据控制器
class SensorController {
  // 获取最新的传感器数据
  async getLatestData(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.query;
      const data = await sensorService.getLatestData(deviceId as string);

      if (data) {
        res.status(200).json(data);
      } else {
        res.status(404).json({ message: 'No sensor data found' });
      }
    } catch (error) {
      res.status(500).json({ error: '获取最新数据失败' });
    }
  }

  // 获取历史传感器数据
  async getHistoricalData(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId, startTime, endTime, limit = 100 } = req.query;
      
      const data = await sensorService.getHistoricalData(
        deviceId as string,
        startTime ? parseInt(startTime as string) : undefined,
        endTime ? parseInt(endTime as string) : undefined,
        parseInt(limit as string)
      );

      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: '获取历史数据失败' });
    }
  }

  // 获取设备列表
  async getDevices(_req: Request, res: Response): Promise<void> {
    try {
      const devices = await sensorService.getDevices();
      res.status(200).json(devices);
    } catch (error) {
      res.status(500).json({ error: '获取设备列表失败' });
    }
  }

  // 接收HTTP POST的传感器数据（备用方案）
  async receiveData(req: Request, res: Response, io: any): Promise<void> {
    try {
      const data = await sensorService.processSensorData(req.body, io);
      res.status(201).json({ message: 'Data received and processed', data });
    } catch (error) {
      res.status(500).json({ error: '数据处理失败' });
    }
  }
}

// 导出控制器实例
export default new SensorController();
