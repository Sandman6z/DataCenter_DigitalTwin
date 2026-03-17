import mongoose, { Schema, Document } from 'mongoose';

// 传感器数据接口
export interface ISensorData extends Document {
  deviceId: string;
  timestamp: number;
  temperature: number;
  humidity: number;
  status: string;
  createdAt: Date;
}

// 传感器数据模式
const SensorDataSchema: Schema = new Schema({
  deviceId: {
    type: String,
    required: true
  },
  timestamp: {
    type: Number,
    required: true
  },
  temperature: {
    type: Number,
    required: true
  },
  humidity: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    required: true,
    default: 'normal'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 添加复合索引以优化按设备和时间段的查询性能
SensorDataSchema.index({ deviceId: 1, timestamp: -1 });

// 添加 TTL 索引，自动删除 30 天前的数据，防止数据库无限增长
SensorDataSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// 导出模型
export default mongoose.model<ISensorData>('SensorData', SensorDataSchema);
