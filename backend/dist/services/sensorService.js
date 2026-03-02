"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sensorData_1 = __importDefault(require("../models/sensorData"));
class SensorService {
    /**
     * 验证并处理传感器数据
     */
    async processSensorData(data, io) {
        if (!this.validateData(data)) {
            throw new Error('Invalid sensor data format');
        }
        const status = this.calculateStatus(data.temperature, data.humidity);
        const sensorData = new sensorData_1.default({
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
    async getLatestData(deviceId) {
        const query = {};
        if (deviceId) {
            query.deviceId = deviceId;
        }
        return await sensorData_1.default.findOne(query, {
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
    async getHistoricalData(deviceId, startTime, endTime, limit = 100) {
        const query = {};
        if (deviceId) {
            query.deviceId = deviceId;
        }
        if (startTime || endTime) {
            query.timestamp = {};
            if (startTime)
                query.timestamp.$gte = startTime;
            if (endTime)
                query.timestamp.$lte = endTime;
        }
        return await sensorData_1.default.find(query, {
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
        return await sensorData_1.default.distinct('deviceId').exec();
    }
    /**
     * 验证数据格式
     */
    validateData(data) {
        return (data &&
            typeof data.deviceId === 'string' &&
            typeof data.temperature === 'number' &&
            typeof data.humidity === 'number');
    }
    /**
     * 根据温湿度计算状态
     */
    calculateStatus(temperature, humidity) {
        if (temperature > 30) {
            return 'high-temperature';
        }
        else if (humidity > 80) {
            return 'high-humidity';
        }
        return 'normal';
    }
}
exports.default = new SensorService();
