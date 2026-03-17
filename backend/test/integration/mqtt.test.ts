import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mqttService from '../../src/services/mqttService';
import sensorService from '../../src/services/sensorService';
import sensorDataModel from '../../src/models/sensorData';

// 模拟mqtt库
jest.mock('mqtt', () => {
  const mockClient = {
    connect: jest.fn(() => mockClientInstance),
    on: jest.fn(),
    subscribe: jest.fn(),
    publish: jest.fn(),
    end: jest.fn(),
    connected: true
  };

  const mockClientInstance = {
    on: jest.fn(),
    subscribe: jest.fn(),
    publish: jest.fn(),
    end: jest.fn(),
    connected: true
  };

  return mockClient;
});

// 模拟socket.io
const mockSocket = {
  emit: jest.fn()
};

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // 停止可能正在运行的MongoDB连接
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  // 创建内存中的MongoDB服务器
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // 连接到内存中的MongoDB
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  // 断开MongoDB连接
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  // 停止内存中的MongoDB服务器
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  // 清空测试数据
  await sensorDataModel.deleteMany({});
  // 清除所有模拟调用
  jest.clearAllMocks();
});

describe('MQTT Integration Tests', () => {
  it('should initialize MQTT service', () => {
    // 初始化MQTT服务
    mqttService.init(mockSocket as any);
    
    // 验证MQTT服务已初始化
    expect(mqttService).toBeDefined();
  });

  it('should publish MQTT message', () => {
    // 初始化MQTT服务
    mqttService.init(mockSocket as any);
    
    // 测试发布消息
    const testTopic = 'test/topic';
    const testMessage = { deviceId: 'test-device', temperature: 25, humidity: 50 };
    
    mqttService.publish(testTopic, testMessage);
    
    // 验证消息发布调用
    const mqtt = require('mqtt');
    expect(mqtt.connect().publish).toHaveBeenCalled();
  });

  it('should disconnect MQTT service', () => {
    // 初始化MQTT服务
    mqttService.init(mockSocket as any);
    
    // 测试断开连接
    mqttService.disconnect();
    
    // 验证断开连接调用
    const mqtt = require('mqtt');
    expect(mqtt.connect().end).toHaveBeenCalled();
  });

  it('should process sensor data from MQTT message', async () => {
    // 模拟sensorService.processSensorData
    const mockProcessedData = {
      _id: '123',
      deviceId: 'test-device',
      temperature: 25,
      humidity: 50,
      status: 'normal',
      timestamp: Date.now(),
      __v: 0
    };
    
    jest.spyOn(sensorService, 'processSensorData').mockResolvedValueOnce(mockProcessedData as any);
    
    // 初始化MQTT服务
    mqttService.init(mockSocket as any);
    
    // 模拟MQTT消息处理
    const mqtt = require('mqtt');
    const mockMessageHandler = mqtt.connect().on.mock.calls.find((call: any) => call[0] === 'message');
    
    if (mockMessageHandler) {
      const messageHandler = mockMessageHandler[1];
      const testMessage = JSON.stringify({ deviceId: 'test-device', temperature: 25, humidity: 50, timestamp: Date.now() });
      
      // 调用消息处理函数
      await messageHandler('datacenter/sensors', Buffer.from(testMessage));
      
      // 验证sensorService.processSensorData被调用
      expect(sensorService.processSensorData).toHaveBeenCalledWith(
        JSON.parse(testMessage),
        mockSocket
      );
    }
  });

  it('should handle MQTT message parsing error', async () => {
    // 模拟console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // 初始化MQTT服务
    mqttService.init(mockSocket as any);
    
    // 模拟MQTT消息处理
    const mqtt = require('mqtt');
    const mockMessageHandler = mqtt.connect().on.mock.calls.find((call: any) => call[0] === 'message');
    
    if (mockMessageHandler) {
      const messageHandler = mockMessageHandler[1];
      const invalidMessage = 'invalid json';
      
      // 调用消息处理函数
      await messageHandler('datacenter/sensors', Buffer.from(invalidMessage));
      
      // 验证错误被记录
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error handling MQTT message:', expect.any(String));
    }
    
    consoleErrorSpy.mockRestore();
  });
});
