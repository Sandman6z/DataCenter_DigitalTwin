import SensorData, { ISensorData } from '../models/sensorData';
import { Server } from 'socket.io';

export interface SensorPayload {
  deviceId: string;
  temperature: number;
  humidity: number;
  timestamp?: number;
}

class SensorService {
  private buffer: any[] = [];
  private readonly BATCH_SIZE = 100;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    // 定期刷新缓冲区，防止数据滞留
    this.flushTimer = setInterval(() => this.flushBuffer(), 1000);
  }

  /**
   * 验证并处理传感器数据
   */
  async processSensorData(data: any, io?: Server): Promise<ISensorData | null> {
    if (!this.validateData(data)) {
      throw new Error('Invalid sensor data format');
    }

    const status = this.calculateStatus(data.temperature, data.humidity);
    
    // 创建文档对象但不立即保存
    const sensorDoc = {
      deviceId: data.deviceId,
      timestamp: data.timestamp || Date.now(),
      temperature: data.temperature,
      humidity: data.humidity,
      status: status,
      createdAt: new Date()
    };

    // 添加到缓冲区
    this.buffer.push(sensorDoc);

    // 如果缓冲区达到阈值，执行批量写入
    if (this.buffer.length >= this.BATCH_SIZE) {
      await this.flushBuffer();
    }

    // 如果提供了 io，则广播数据（实时性要求高，不缓冲）
    if (io) {
      // 构造临时对象用于广播，避免等待数据库返回
      const broadcastData = new SensorData(sensorDoc);
      io.emit('sensor-data', broadcastData);
    }

    // 返回最新的一条数据（注意：这里不再是已保存的 Document，而是普通对象，调用方需注意）
    return new SensorData(sensorDoc);
  }

  /**
   * 刷新缓冲区数据到数据库
   */
  private async flushBuffer() {
    if (this.buffer.length === 0) return;

    const dataToSave = [...this.buffer];
    this.buffer = []; // 清空缓冲区

    try {
      await SensorData.insertMany(dataToSave);
      console.log(`Successfully batch saved ${dataToSave.length} records.`);
    } catch (error) {
      console.error('Error batch saving sensor data:', error);
      // 失败后尝试重新放回缓冲区（可选，视数据重要性而定，这里简单记录日志）
    }
  }

  /**
   * 优雅关闭时刷新剩余数据
   */
  async cleanup() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flushBuffer();
  }


  /**
   * 获取最新数据
   */
  async getLatestData(deviceId?: string) {
    const query: any = {};
    if (deviceId) {
      query.deviceId = deviceId;
    }
    return await SensorData.findOne(query, {
      _id: 1,
      deviceId: 1,
      temperature: 1,
      humidity: 1,
      status: 1,
      timestamp: 1
    }).sort({ timestamp: -1 }).exec();
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

    return await SensorData.find(query, {
      _id: 1,
      deviceId: 1,
      temperature: 1,
      humidity: 1,
      status: 1,
      timestamp: 1
    })
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
