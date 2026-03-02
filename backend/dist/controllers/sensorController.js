"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sensorService_1 = __importDefault(require("../services/sensorService"));
// 传感器数据控制器
class SensorController {
    // 获取最新的传感器数据
    async getLatestData(req, res) {
        const { deviceId } = req.query;
        const data = await sensorService_1.default.getLatestData(deviceId);
        if (data) {
            res.status(200).json(data);
        }
        else {
            res.status(404).json({ message: 'No sensor data found' });
        }
    }
    // 获取历史传感器数据
    async getHistoricalData(req, res) {
        const { deviceId, startTime, endTime, limit = 100 } = req.query;
        const data = await sensorService_1.default.getHistoricalData(deviceId, startTime ? parseInt(startTime) : undefined, endTime ? parseInt(endTime) : undefined, parseInt(limit));
        res.status(200).json(data);
    }
    // 获取设备列表
    async getDevices(_req, res) {
        const devices = await sensorService_1.default.getDevices();
        res.status(200).json(devices);
    }
    // 接收HTTP POST的传感器数据（备用方案）
    async receiveData(req, res, io) {
        const data = await sensorService_1.default.processSensorData(req.body, io);
        res.status(201).json({ message: 'Data received and processed', data });
    }
}
// 导出控制器实例
exports.default = new SensorController();
