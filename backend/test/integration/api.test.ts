import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../src/index';
import sensorDataModel from '../../src/models/sensorData';

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
  console.log('Connected to in-memory MongoDB');
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
  console.log('Disconnected from in-memory MongoDB');
});

beforeEach(async () => {
  // 清空测试数据
  await sensorDataModel.deleteMany({});
});

describe('API Integration Tests', () => {
  describe('/api/sensor/devices', () => {
    it('should return empty array when no devices exist', async () => {
      const response = await request(app).get('/api/sensor/devices');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return unique device IDs', async () => {
      // Create test data
      await sensorDataModel.create([
        { deviceId: 'device1', temperature: 25, humidity: 50, status: 'normal', timestamp: Date.now() },
        { deviceId: 'device2', temperature: 26, humidity: 51, status: 'normal', timestamp: Date.now() }
      ]);

      const response = await request(app).get('/api/sensor/devices');
      expect(response.status).toBe(200);
      expect(response.body).toContain('device1');
      expect(response.body).toContain('device2');
      expect(response.body.length).toBe(2);
    });
  });

  describe('/api/sensor/latest', () => {
    it('should return latest sensor data', async () => {
      const testData = {
        deviceId: 'test-device',
        temperature: 25,
        humidity: 50,
        status: 'normal',
        timestamp: Date.now()
      };

      await sensorDataModel.create(testData);

      const response = await request(app).get('/api/sensor/latest');
      expect(response.status).toBe(200);
      expect(response.body.deviceId).toBe(testData.deviceId);
      expect(response.body.temperature).toBe(testData.temperature);
      expect(response.body.humidity).toBe(testData.humidity);
    });

    it('should return latest data for specific device', async () => {
      const testData1 = {
        deviceId: 'device1',
        temperature: 25,
        humidity: 50,
        status: 'normal',
        timestamp: Date.now() - 3600000
      };

      const testData2 = {
        deviceId: 'device2',
        temperature: 26,
        humidity: 51,
        status: 'normal',
        timestamp: Date.now()
      };

      await sensorDataModel.create([testData1, testData2]);

      const response = await request(app).get('/api/sensor/latest?deviceId=device1');
      expect(response.status).toBe(200);
      expect(response.body.deviceId).toBe('device1');
    });
  });

  describe('/api/sensor/historical', () => {
    it('should return historical sensor data', async () => {
      const testData = [
        {
          deviceId: 'test-device',
          temperature: 25,
          humidity: 50,
          status: 'normal',
          timestamp: Date.now() - 3600000
        },
        {
          deviceId: 'test-device',
          temperature: 26,
          humidity: 51,
          status: 'normal',
          timestamp: Date.now()
        }
      ];

      await sensorDataModel.create(testData);

      const response = await request(app).get('/api/sensor/historical?limit=2');
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      expect(response.body[0].timestamp).toBeGreaterThan(response.body[1].timestamp);
    });

    it('should return historical data for specific device', async () => {
      const testData1 = {
        deviceId: 'device1',
        temperature: 25,
        humidity: 50,
        status: 'normal',
        timestamp: Date.now()
      };

      const testData2 = {
        deviceId: 'device2',
        temperature: 26,
        humidity: 51,
        status: 'normal',
        timestamp: Date.now()
      };

      await sensorDataModel.create([testData1, testData2]);

      const response = await request(app).get('/api/sensor/historical?deviceId=device1');
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].deviceId).toBe('device1');
    });
  });

  describe('/api/sensor/data', () => {
    it('should receive and process sensor data', async () => {
      const testData = {
        deviceId: 'test-device',
        temperature: 25,
        humidity: 50,
        timestamp: Date.now()
      };

      const response = await request(app)
        .post('/api/sensor/data')
        .send(testData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Data received and processed');

      // Verify data was saved to database
      const savedData = await sensorDataModel.findOne({ deviceId: 'test-device' });
      expect(savedData).toBeTruthy();
      expect(savedData?.temperature).toBe(testData.temperature);
      expect(savedData?.humidity).toBe(testData.humidity);
    });

    it('should set status to high-temperature when temperature is above 30', async () => {
      const testData = {
        deviceId: 'test-device',
        temperature: 35,
        humidity: 50,
        timestamp: Date.now()
      };

      await request(app)
        .post('/api/sensor/data')
        .send(testData);

      const savedData = await sensorDataModel.findOne({ deviceId: 'test-device' });
      expect(savedData?.status).toBe('high-temperature');
    });

    it('should set status to high-humidity when humidity is above 80', async () => {
      const testData = {
        deviceId: 'test-device',
        temperature: 25,
        humidity: 85,
        timestamp: Date.now()
      };

      await request(app)
        .post('/api/sensor/data')
        .send(testData);

      const savedData = await sensorDataModel.findOne({ deviceId: 'test-device' });
      expect(savedData?.status).toBe('high-humidity');
    });
  });

  describe('/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeTruthy();
    });
  });
});
