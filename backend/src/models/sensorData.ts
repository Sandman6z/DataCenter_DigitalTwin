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
    required: true,
    index: true
  },
  timestamp: {
    type: Number,
    required: true,
    index: true
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

// 导出模型
export default mongoose.model<ISensorData>('SensorData', SensorDataSchema);
