import SensorData, { ISensorData } from '../models/sensorData';
import { Server } from 'socket.io';

export interface SensorPayload {
  deviceId: string;
  temperature: number;
  humidity: number;
  timestamp?: number;
}

class SensorService {
  /**
   * 验证并处理传感器数据
   */
  async processSensorData(data: any, io?: Server): Promise<ISensorData | null> {
    if (!this.validateData(data)) {
      throw new Error('Invalid sensor data format');
    }

    const status = this.calculateStatus(data.temperature, data.humidity);
    
    const sensorData = new SensorData({
      deviceId: data.deviceId,
      timestamp: data.timestamp || Date.now(),
      temperature: data.temperature,
      humidity: data.humidity,
      status: status
    });

    const savedData = await sensorData.save();

    // 如果提供了 io，则广播数据
    if (io) {
      io.emit('sensor-data', savedData);
    }

    return savedData;
  }

  /**
   * 获取最新数据
   */
  async getLatestData(deviceId?: string) {
    const query: any = {};
    if (deviceId) {
      query.deviceId = deviceId;
    }
    return await SensorData.findOne(query).sort({ timestamp: -1 }).exec();
  }

  /**
   * 获取历史数据
   */
  async getHistoricalData(deviceId?: string, startTime?: number, endTime?: number, limit: number = 100) {
    const query: any = {};
    if (deviceId) {
      query.deviceId = deviceId;
    }
    if (startTime || endTime) {
      query.timestamp = {};
      if (startTime) query.timestamp.$gte = startTime;
      if (endTime) query.timestamp.$lte = endTime;
    }

    return await SensorData.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * 获取设备列表
   */
  async getDevices() {
    return await SensorData.distinct('deviceId').exec();
  }

  /**
   * 验证数据格式
   */
  private validateData(data: any): data is SensorPayload {
    return (
      data &&
      typeof data.deviceId === 'string' &&
      typeof data.temperature === 'number' &&
      typeof data.humidity === 'number'
    );
  }

  /**
   * 根据温湿度计算状态
   */
  private calculateStatus(temperature: number, humidity: number): string {
    if (temperature > 30) {
      return 'high-temperature';
    } else if (humidity > 80) {
      return 'high-humidity';
    }
    return 'normal';
  }
}

export default new SensorService();
