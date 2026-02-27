import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import sensorController from './controllers/sensorController';
import mqttService from './services/mqttService';
import { CONFIG } from './config';
import { errorHandler, asyncHandler } from './middleware/errorHandler';

// 创建Express应用
const app = express();
const server = http.createServer(app);

// 初始化Socket.io
const io = new Server(server, {
  cors: {
    origin: '*', // 在生产环境中应该设置具体的域名
    methods: ['GET', 'POST']
  }
});

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.get('/api/sensor/latest', asyncHandler(sensorController.getLatestData));
app.get('/api/sensor/historical', asyncHandler(sensorController.getHistoricalData));
app.get('/api/sensor/devices', asyncHandler(sensorController.getDevices));
app.post('/api/sensor/data', asyncHandler((req: express.Request, res: express.Response) => sensorController.receiveData(req, res, io)));

// 健康检查
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 全局错误处理
app.use(errorHandler);

// Socket.io事件
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// 初始化函数
async function init() {
  try {
    // 连接MongoDB
    await mongoose.connect(CONFIG.MONGODB_URI);
    console.log('MongoDB connected');

    // 初始化MQTT服务
    mqttService.init(io);

    // 启动服务器
    server.listen(CONFIG.PORT, () => {
      console.log(`Server running on port ${CONFIG.PORT}`);
      console.log(`Health check: http://localhost:${CONFIG.PORT}/health`);
    });

  } catch (error) {
    console.error('Initialization error:', error);
    process.exit(1);
  }
}

// 启动应用
init();

// 优雅关闭
process.on('SIGINT', async () => {
  try {
    await mongoose.disconnect();
    mqttService.disconnect();
    server.close();
    console.log('Server gracefully stopped');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});
