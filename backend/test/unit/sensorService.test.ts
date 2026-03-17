import sensorService from '../../src/services/sensorService';
import sensorDataModel from '../../src/models/sensorData';

// 模拟数据库模型
jest.mock('../../src/models/sensorData');

const mockSensorDataModel = sensorDataModel as jest.Mocked<typeof sensorDataModel>;

// 模拟SensorData实例
const mockSensorDataInstance = {
  save: jest.fn(),
};

// 模拟Mongoose链式调用
const mockQuery = {
  sort: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  exec: jest.fn(),
} as any;

const mockDistinctQuery = {
  exec: jest.fn(),
} as any;

describe('SensorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 模拟SensorData构造函数
    (sensorDataModel as any).mockImplementation(() => mockSensorDataInstance);
    // 模拟findOne方法
    mockSensorDataModel.findOne.mockReturnValue(mockQuery);
    // 模拟find方法
    mockSensorDataModel.find.mockReturnValue(mockQuery);
    // 模拟distinct方法
    mockSensorDataModel.distinct.mockReturnValue(mockDistinctQuery);
  });

  describe('processSensorData', () => {
    it('should process and save sensor data', async () => {
      const mockData = {
        deviceId: 'test-device',
        temperature: 25,
        humidity: 50,
        timestamp: Date.now()
      };

      const mockSavedData = {
        _id: '123',
        deviceId: mockData.deviceId,
        temperature: mockData.temperature,
        humidity: mockData.humidity,
        status: 'normal',
        timestamp: mockData.timestamp,
        __v: 0
      };

      const mockSocket = {
        emit: jest.fn()
      };

      mockSensorDataInstance.save.mockResolvedValueOnce(mockSavedData);

      const result = await sensorService.processSensorData(mockData, mockSocket as any);

      expect(mockSensorDataInstance.save).toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalledWith('sensor-data', mockSavedData);
      expect(result).toEqual(mockSavedData);
    });

    it('should set status to high-temperature when temperature is above 30', async () => {
      const mockData = {
        deviceId: 'test-device',
        temperature: 35,
        humidity: 50,
        timestamp: Date.now()
      };

      const mockSavedData = {
        _id: '123',
        deviceId: mockData.deviceId,
        temperature: mockData.temperature,
        humidity: mockData.humidity,
        status: 'high-temperature',
        timestamp: mockData.timestamp,
        __v: 0
      };

      const mockSocket = {
        emit: jest.fn()
      };

      mockSensorDataInstance.save.mockResolvedValueOnce(mockSavedData);

      const result = await sensorService.processSensorData(mockData, mockSocket as any);

      expect(mockSensorDataInstance.save).toHaveBeenCalled();
      expect(result?.status).toBe('high-temperature');
    });

    it('should set status to high-humidity when humidity is above 80', async () => {
      const mockData = {
        deviceId: 'test-device',
        temperature: 25,
        humidity: 85,
        timestamp: Date.now()
      };

      const mockSavedData = {
        _id: '123',
        deviceId: mockData.deviceId,
        temperature: mockData.temperature,
        humidity: mockData.humidity,
        status: 'high-humidity',
        timestamp: mockData.timestamp,
        __v: 0
      };

      const mockSocket = {
        emit: jest.fn()
      };

      mockSensorDataInstance.save.mockResolvedValueOnce(mockSavedData);

      const result = await sensorService.processSensorData(mockData, mockSocket as any);

      expect(mockSensorDataInstance.save).toHaveBeenCalled();
      expect(result?.status).toBe('high-humidity');
    });
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

      mockQuery.exec.mockResolvedValueOnce(mockData);

      const result = await sensorService.getLatestData('test-device');

      expect(mockSensorDataModel.findOne).toHaveBeenCalledWith(
        { deviceId: 'test-device' },
        {
          _id: 1,
          deviceId: 1,
          temperature: 1,
          humidity: 1,
          status: 1,
          timestamp: 1
        }
      );
      expect(mockQuery.sort).toHaveBeenCalledWith({ timestamp: -1 });
      expect(mockQuery.exec).toHaveBeenCalled();
      expect(result).toEqual(mockData);
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

      mockQuery.exec.mockResolvedValueOnce(mockData);

      const result = await sensorService.getLatestData();

      expect(mockSensorDataModel.findOne).toHaveBeenCalledWith(
        {},
        {
          _id: 1,
          deviceId: 1,
          temperature: 1,
          humidity: 1,
          status: 1,
          timestamp: 1
        }
      );
      expect(mockQuery.sort).toHaveBeenCalledWith({ timestamp: -1 });
      expect(mockQuery.exec).toHaveBeenCalled();
      expect(result).toEqual(mockData);
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

      mockQuery.exec.mockResolvedValueOnce(mockData);

      const result = await sensorService.getHistoricalData('test-device', undefined, undefined, 2);

      expect(mockSensorDataModel.find).toHaveBeenCalledWith(
        { deviceId: 'test-device' },
        {
          _id: 1,
          deviceId: 1,
          temperature: 1,
          humidity: 1,
          status: 1,
          timestamp: 1
        }
      );
      expect(mockQuery.sort).toHaveBeenCalledWith({ timestamp: -1 });
      expect(mockQuery.limit).toHaveBeenCalledWith(2);
      expect(mockQuery.exec).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    it('should return historical data for all devices when no deviceId is provided', async () => {
      const mockData = [
        {
          _id: '123',
          deviceId: 'test-device',
          temperature: 25,
          humidity: 50,
          status: 'normal',
          timestamp: Date.now(),
          __v: 0
        }
      ];

      mockQuery.exec.mockResolvedValueOnce(mockData);

      const result = await sensorService.getHistoricalData(undefined, undefined, undefined, 10);

      expect(mockSensorDataModel.find).toHaveBeenCalledWith(
        {},
        {
          _id: 1,
          deviceId: 1,
          temperature: 1,
          humidity: 1,
          status: 1,
          timestamp: 1
        }
      );
      expect(mockQuery.sort).toHaveBeenCalledWith({ timestamp: -1 });
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(mockQuery.exec).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });
  });

  describe('getDevices', () => {
    it('should return unique device IDs', async () => {
      const mockDevices = ['device1', 'device2'];

      mockDistinctQuery.exec.mockResolvedValueOnce(mockDevices);

      const result = await sensorService.getDevices();

      expect(mockSensorDataModel.distinct).toHaveBeenCalledWith('deviceId');
      expect(mockDistinctQuery.exec).toHaveBeenCalled();
      expect(result).toEqual(mockDevices);
    });
  });
});
