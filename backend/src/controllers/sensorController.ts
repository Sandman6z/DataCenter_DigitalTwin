import { Request, Response } from 'express';
import sensorService from '../services/sensorService';

// 传感器数据控制器
class SensorController {
  // 获取最新的传感器数据
  async getLatestData(req: Request, res: Response): Promise<void> {
    const { deviceId } = req.query;
    const data = await sensorService.getLatestData(deviceId as string);

    if (data) {
      res.status(200).json(data);
    } else {
      res.status(404).json({ message: 'No sensor data found' });
    }
  }

  // 获取历史传感器数据
  async getHistoricalData(req: Request, res: Response): Promise<void> {
    const { deviceId, startTime, endTime, limit = 100 } = req.query;
    
    const data = await sensorService.getHistoricalData(
      deviceId as string,
      startTime ? parseInt(startTime as string) : undefined,
      endTime ? parseInt(endTime as string) : undefined,
      parseInt(limit as string)
    );

    res.status(200).json(data);
  }

  // 获取设备列表
  async getDevices(_req: Request, res: Response): Promise<void> {
    const devices = await sensorService.getDevices();
    res.status(200).json(devices);
  }

  // 接收HTTP POST的传感器数据（备用方案）
  async receiveData(req: Request, res: Response, io: any): Promise<void> {
    const data = await sensorService.processSensorData(req.body, io);
    res.status(201).json({ message: 'Data received and processed', data });
  }
}

// 导出控制器实例
export default new SensorController();
