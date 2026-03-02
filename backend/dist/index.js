"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const sensorController_1 = __importDefault(require("./controllers/sensorController"));
const mqttService_1 = __importDefault(require("./services/mqttService"));
const config_1 = require("./config");
const errorHandler_1 = require("./middleware/errorHandler");
// 创建Express应用
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// 初始化Socket.io
const io = new socket_io_1.Server(server, {
    cors: {
        origin: config_1.CONFIG.IS_PRODUCTION ? 'http://localhost' : '*', // 在生产环境中设置具体的域名
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }
});
// 请求限流中间件
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 每个IP在windowMs时间内最多100个请求
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'error',
        message: '请求过于频繁，请稍后再试'
    }
});
// 中间件
app.use((0, cors_1.default)({
    origin: config_1.CONFIG.IS_PRODUCTION ? 'http://localhost' : '*', // 在生产环境中设置具体的域名
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(limiter); // 应用请求限流
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// 路由
app.get('/api/sensor/latest', (0, errorHandler_1.asyncHandler)(sensorController_1.default.getLatestData));
app.get('/api/sensor/historical', (0, errorHandler_1.asyncHandler)(sensorController_1.default.getHistoricalData));
app.get('/api/sensor/devices', (0, errorHandler_1.asyncHandler)(sensorController_1.default.getDevices));
app.post('/api/sensor/data', (0, errorHandler_1.asyncHandler)((req, res) => sensorController_1.default.receiveData(req, res, io)));
// 健康检查
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
// 全局错误处理
app.use(errorHandler_1.errorHandler);
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
        await mongoose_1.default.connect(config_1.CONFIG.MONGODB_URI);
        console.log('MongoDB connected');
        // 初始化MQTT服务
        mqttService_1.default.init(io);
        // 启动服务器
        server.listen(config_1.CONFIG.PORT, () => {
            console.log(`Server running on port ${config_1.CONFIG.PORT}`);
            console.log(`Health check: http://localhost:${config_1.CONFIG.PORT}/health`);
        });
    }
    catch (error) {
        console.error('Initialization error:', error);
        process.exit(1);
    }
}
// 启动应用
init();
// 优雅关闭
process.on('SIGINT', async () => {
    try {
        await mongoose_1.default.disconnect();
        mqttService_1.default.disconnect();
        server.close();
        console.log('Server gracefully stopped');
        process.exit(0);
    }
    catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});
