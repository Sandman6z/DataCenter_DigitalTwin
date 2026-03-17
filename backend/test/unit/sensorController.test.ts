import { Request, Response } from 'express';
import sensorController from '../../src/controllers/sensorController';
import sensorService from '../../src/services/sensorService';

// 模拟服务层
jest.mock('../../src/services/sensorService');

const mockSensorService = sensorService as jest.Mocked<typeof sensorService>;

describe('SensorController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockSocket: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {};
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    mockSocket = {
      emit: jest.fn()
    };
  });

  describe('getLatestData', () => {
    it('should return latest sensor data', async () => {
      const mockData = {
        _id: '123',
        deviceId: 'test-device',
        temperature: 25,
        humidity: 50,
        status: 'normal',
        timestamp: Date.now(),
        __v: 0
      };

      mockRequest.query = { deviceId: 'test-device' };
      mockSensorService.getLatestData.mockResolvedValueOnce(mockData as any);

      await sensorController.getLatestData(mockRequest as Request, mockResponse as Response);

      expect(mockSensorService.getLatestData).toHaveBeenCalledWith('test-device');
      expect(mockResponse.json).toHaveBeenCalledWith(mockData);
    });

    it('should return latest data for all devices when no deviceId is provided', async () => {
      const mockData = {
        _id: '123',
        deviceId: 'test-device',
        temperature: 25,
        humidity: 50,
        status: 'normal',
        timestamp: Date.now(),
        __v: 0
      };

      mockRequest.query = {};
      mockSensorService.getLatestData.mockResolvedValueOnce(mockData as any);

      await sensorController.getLatestData(mockRequest as Request, mockResponse as Response);

      expect(mockSensorService.getLatestData).toHaveBeenCalledWith(undefined);
      expect(mockResponse.json).toHaveBeenCalledWith(mockData);
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      mockRequest.query = {};
      mockSensorService.getLatestData.mockRejectedValueOnce(error);

      await sensorController.getLatestData(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '获取最新数据失败'
      });
    });
  });

  describe('getHistoricalData', () => {
    it('should return historical sensor data', async () => {
      const mockData = [
        {
          _id: '123',
          deviceId: 'test-device',
          temperature: 25,
          humidity: 50,
          status: 'normal',
          timestamp: Date.now() - 3600000,
          __v: 0
        },
        {
          _id: '124',
          deviceId: 'test-device',
          temperature: 26,
          humidity: 51,
          status: 'normal',
          timestamp: Date.now(),
          __v: 0
        }
      ];

      mockRequest.query = { deviceId: 'test-device', limit: '2' };
      mockSensorService.getHistoricalData.mockResolvedValueOnce(mockData as any);

      await sensorController.getHistoricalData(mockRequest as Request, mockResponse as Response);

      expect(mockSensorService.getHistoricalData).toHaveBeenCalledWith('test-device', undefined, undefined, 2);
      expect(mockResponse.json).toHaveBeenCalledWith(mockData);
    });

    it('should use default limit when no limit is provided', async () => {
      const mockData: any[] = [];

      mockRequest.query = {};
      mockSensorService.getHistoricalData.mockResolvedValueOnce(mockData);

      await sensorController.getHistoricalData(mockRequest as Request, mockResponse as Response);

      expect(mockSensorService.getHistoricalData).toHaveBeenCalledWith(undefined, undefined, undefined, 100);
      expect(mockResponse.json).toHaveBeenCalledWith(mockData);
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      mockRequest.query = {};
      mockSensorService.getHistoricalData.mockRejectedValueOnce(error);

      await sensorController.getHistoricalData(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '获取历史数据失败'
      });
    });
  });

  describe('getDevices', () => {
    it('should return device list', async () => {
      const mockDevices = ['device1', 'device2'];

      mockSensorService.getDevices.mockResolvedValueOnce(mockDevices);

      await sensorController.getDevices(mockRequest as Request, mockResponse as Response);

      expect(mockSensorService.getDevices).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(mockDevices);
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      mockSensorService.getDevices.mockRejectedValueOnce(error);

      await sensorController.getDevices(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '获取设备列表失败'
      });
    });
  });

  describe('receiveData', () => {
    it('should process received sensor data', async () => {
      const mockData = {
        deviceId: 'test-device',
        temperature: 25,
        humidity: 50,
        timestamp: Date.now()
      };

      const mockProcessedData = {
        _id: '123',
        deviceId: 'test-device',
        temperature: 25,
        humidity: 50,
        status: 'normal',
        timestamp: Date.now(),
        __v: 0
      };

      mockRequest.body = mockData;
      mockSensorService.processSensorData.mockResolvedValueOnce(mockProcessedData as any);

      await sensorController.receiveData(mockRequest as Request, mockResponse as Response, mockSocket);

      expect(mockSensorService.processSensorData).toHaveBeenCalledWith(mockData, mockSocket);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Data received and processed',
        data: mockProcessedData
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      mockRequest.body = { deviceId: 'test-device', temperature: 25, humidity: 50 };
      mockSensorService.processSensorData.mockRejectedValueOnce(error);

      await sensorController.receiveData(mockRequest as Request, mockResponse as Response, mockSocket);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '数据处理失败'
      });
    });
  });
});
