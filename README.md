# 机房温湿度数字孪生系统

## 项目简介

本项目是一个基于数字孪生技术的机房温湿度监控系统，通过实时采集、处理和可视化机房内的温湿度数据，实现对机房环境的全方位监控和管理。

## 系统架构

### 1. 数据采集层
- 接收下位机发送的温湿度数据
- 支持多种传输协议：MQTT、HTTP、WebSocket
- 数据格式：JSON

#### MQTT 配置和格式

##### MQTT 端口
- **默认端口**：1883（Docker 部署时映射到主机的 1883 端口）
- **协议**：MQTT v3.1.1 或 v5.0
- **连接地址**：
  - 本地开发：`mqtt://localhost:1883`
  - Docker 部署：`mqtt://mosquitto:1883`（容器内部）或 `mqtt://localhost:1883`（主机访问）

##### MQTT 主题格式
- **数据上报主题**：`datacenter/sensors`
- **说明**：所有传感器数据都发布到同一个主题，设备ID通过消息体中的`deviceId`字段区分

##### MQTT 消息格式
```json
{
  "deviceId": "sensor-001",
  "temperature": 25.5,
  "humidity": 45.2,
  "status": "online"
}
```

- **字段说明**：
  - `deviceId`：设备唯一标识符
  - `timestamp`：数据采集时间戳（ISO 8601 格式）
  - `temperature`：温度值（摄氏度）
  - `humidity`：湿度值（百分比）
  - `status`：设备状态（online/offline）

##### 调试建议
- 使用 MQTT 客户端工具（如 MQTTX、Mosquitto CLI）连接到 MQTT broker
- 订阅 `datacenter/sensors` 主题以接收所有传感器数据
- 发布测试消息到 `datacenter/sensors` 主题进行功能验证
- 检查 Mosquitto 容器日志以排查连接问题：`docker compose logs mosquitto`
- 检查后端日志以确认数据处理情况：`docker compose logs backend`

### 2. 数据处理层
- 实时数据处理和存储
- 历史数据查询和分析
- 异常数据检测和告警

### 3. 可视化层
- 3D机房环境展示
- 温湿度实时监控
- 设备状态可视化
- 历史数据趋势分析

### 4. 实时更新机制
- WebSocket实时数据推送
- 数据同步和状态更新


## 功能特性

- **实时温湿度监控**：实时展示机房内的温湿度数据
- **3D机房环境可视化**：通过3D模型直观展示机房环境
- **历史数据趋势分析**：通过图表展示历史数据变化趋势
- **异常数据告警**：当温湿度超出阈值时产生告警
- **设备状态管理**：监控和管理设备的运行状态
- **多设备支持**：支持同时监控多个温湿度设备

## 扩展能力

- **支持添加更多传感器类型**：可扩展支持其他类型的传感器数据
- **支持多机房管理**：可扩展为多机房的集中监控系统
- **支持与其他系统集成**：提供API接口与其他系统集成
- **支持移动端访问**：可扩展为支持移动端访问的响应式设计


## 技术选型说明

### 前端技术选型
- **Vue 3**：采用最新的组合式API，提供更好的TypeScript支持和性能优化
- **Three.js**：轻量级3D库，适合构建简单的3D可视化场景
- **ECharts**：功能强大的图表库，适合展示各种数据图表
- **Socket.io-client**：实现与后端的实时通信
- **Vite**：快速的前端构建工具，提供更好的开发体验

### 后端技术选型
- **Node.js**：轻量级的JavaScript运行时，适合构建实时应用
- **Express**：简洁高效的Web框架，适合构建RESTful API
- **MongoDB**：文档型数据库，适合存储和查询传感器数据
- **MQTT.js**：轻量级的MQTT客户端，适合处理物联网设备数据
- **Socket.io**：实现与前端的实时通信


## 从源码到部署的操作指南

### 1. 所需软件和组件

在开始部署之前，确保您的系统已经安装了以下软件：

- **Docker**：版本 20.0 或更高
- **Docker Compose**：版本 1.29 或更高
- **Git**：用于克隆项目源码
- **浏览器**：推荐使用 Chrome 或 Firefox

### 2. 项目克隆

使用 Git 克隆项目源码：

```bash
git clone <项目仓库地址>
cd DataCenter_DT
```

### 3. 部署到生产环境

#### Docker 部署（生产环境推荐）

本项目支持使用 Docker 进行部署，提供了完整的 Docker 配置文件，适合生产环境使用。

##### 前提条件

- 安装 Docker 和 Docker Compose
- 确保 80、3000、27017 和 1883 端口未被占用

##### 构建 Docker 镜像

在项目根目录执行以下命令：

```bash
docker compose build
```

##### 启动 Docker 容器

```bash
docker compose up -d
```

##### 访问系统

Docker 容器启动后，在浏览器中访问：

```
http://localhost
```

##### 查看容器状态

```bash
docker compose ps
```

##### 查看日志

```bash
docker compose logs -f
```

##### 停止 Docker 容器

```bash
docker compose down
```

##### Docker 配置说明

- **前端**：使用 Nginx 作为静态文件服务器，映射端口 80
- **后端**：使用 Node.js 运行环境，映射端口 3000
- **MongoDB**：使用官方 MongoDB 6.0 镜像，映射端口 27017
- **Mosquitto**：使用官方 Mosquitto 2.0 镜像，映射端口 1883

所有服务都通过 Docker 网络进行通信，确保了服务之间的隔离和安全性。

##### 环境变量配置

在 `docker-compose.yml` 文件中，已经配置了以下环境变量：

- **后端**：
  - `MONGODB_URI`: `mongodb://mongo:27017/datacenter-dt`（连接到 Docker 网络中的 MongoDB 服务）
  - `MQTT_BROKER`: `mqtt://mosquitto:1883`（连接到 Docker 网络中的 Mosquitto 服务）
  - `PORT`: `3000`（后端服务端口）
  - `NODE_ENV`: `production`（生产环境模式）

##### 数据持久化

- **MongoDB**：使用 Docker 卷 `mongo-db-data` 持久化数据
- **Mosquitto**：使用 Docker 卷 `mosquitto-data` 和 `mosquitto-log` 持久化数据和日志

##### 生产环境建议

1. **修改 Mosquitto 配置**：在生产环境中，建议将 `mosquitto/config/mosquitto.conf` 文件中的 `allow_anonymous` 设置为 `false` 并配置密码文件

2. **配置域名**：在生产环境中，建议配置域名并启用 HTTPS

3. **调整资源限制**：根据实际部署环境，调整 Docker 容器的资源限制

4. **备份策略**：定期备份 MongoDB 数据卷

5. **监控**：部署监控工具，监控容器状态和系统性能

## 7. 系统使用指南

### 7.1 系统功能介绍

#### 实时温湿度监控
- 实时展示当前机房的温度和湿度数据
- 提供精确到小数点后一位的数值显示
- 自动检测并显示设备状态（正常/告警）

#### 3D机房环境可视化
- 通过 Three.js 构建的 3D 机房模型
- 机柜状态灯实时反映设备状态（绿色：正常，红色：高温告警，黄色：高湿告警）
- 支持鼠标拖动旋转视角，滚轮缩放场景

#### 历史数据趋势分析
- 使用 ECharts 展示温度和湿度的历史变化趋势
- 支持查看不同设备的历史数据
- 图表自动更新，反映最新数据变化

#### 设备状态管理
- 支持选择特定设备查看其详细数据
- 设备列表自动更新，显示所有已连接的设备
- 实时监控设备连接状态

### 7.2 用户操作指南

#### 访问系统
1. 在浏览器中输入 `http://localhost`（或配置的域名）
2. 等待系统加载完成，进入主界面

#### 查看实时数据
1. 系统主界面左侧面板会显示当前温度、湿度和设备状态
2. 右侧 3D 模型会实时反映设备状态
3. 连接状态指示器会显示系统是否正常连接

#### 切换设备
1. 在左侧面板的 "选择设备" 下拉菜单中选择特定设备
2. 系统会自动更新该设备的实时数据和历史趋势
3. 3D 模型会更新为该设备的状态

#### 查看历史趋势
1. 系统会自动显示最近的历史数据趋势
2. 图表会实时更新，反映最新的数据变化
3. 鼠标悬停在图表上可以查看具体时间点的数据

#### 识别告警状态
1. 当温度超过 30°C 时，设备状态会显示 "高温告警"，3D 模型中的状态灯变为红色
2. 当湿度超过 80% 时，设备状态会显示 "高湿告警"，3D 模型中的状态灯变为黄色
3. 正常状态下，设备状态显示 "正常"，3D 模型中的状态灯为绿色

### 7.3 常见问题和故障排除

#### 系统无法访问
- 检查 Docker 容器是否正常运行：`docker compose ps`
- 检查端口是否被占用：`netstat -ano | findstr :80`
- 检查防火墙是否阻止了访问

#### 数据不更新
- 检查 MQTT 服务是否正常运行：`docker compose logs mosquitto`
- 检查后端服务是否正常运行：`docker compose logs backend`
- 检查前端连接状态是否显示 "已连接"

#### 3D 模型不显示
- 检查浏览器是否支持 WebGL
- 尝试刷新页面
- 检查浏览器控制台是否有错误信息

#### 历史数据不显示
- 检查 MongoDB 服务是否正常运行：`docker compose logs mongo`
- 检查数据库连接配置是否正确
- 确认设备是否已经发送了数据

#### 告警状态不显示
- 检查温湿度阈值设置是否正确
- 确认设备发送的数据是否超过了阈值
- 检查后端服务日志是否有相关错误

## 8. 部署文档

### 8.1 生产环境部署指南

#### 准备工作
1. 确保服务器满足以下要求：
   - CPU：至少 2 核
   - 内存：至少 4GB
   - 磁盘：至少 20GB 可用空间
   - 网络：稳定的网络连接

2. 安装必要的软件：
   - Docker：版本 20.0 或更高
   - Docker Compose：版本 1.29 或更高
   - Git：用于克隆项目源码

#### 部署步骤
1. 克隆项目源码：
   ```bash
   git clone <项目仓库地址>
   cd DataCenter_DT
   ```

2. 配置环境变量：
   - 根据实际环境修改 `docker-compose.yml` 文件中的配置
   - 确保端口映射和资源限制设置合理

3. 构建并启动容器：
   ```bash
   docker compose build
   docker compose up -d
   ```

4. 验证部署：
   - 检查容器状态：`docker compose ps`
   - 访问系统：`http://服务器IP`
   - 检查服务日志：`docker compose logs -f`

#### 安全配置
1. **MQTT 安全**：
   - 修改 `mosquitto/config/mosquitto.conf` 文件
   - 设置 `allow_anonymous false`
   - 配置密码文件：`mosquitto_passwd -c /mosquitto/config/passwd <username>`

2. **网络安全**：
   - 配置防火墙，只开放必要的端口
   - 考虑使用反向代理并启用 HTTPS
   - 定期更新系统和依赖包

### 8.2 不同环境的配置示例

#### 开发环境配置
```yaml
# docker-compose.dev.yml
services:
  backend:
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongo:27017/datacenter-dt-dev
    volumes:
      - ./backend/src:/app/src
    command: npm run dev

  frontend:
    ports:
      - "3001:80"

  mongo:
    ports:
      - "27018:27017"
```

#### 测试环境配置
```yaml
# docker-compose.test.yml
services:
  backend:
    environment:
      - NODE_ENV=test
      - MONGODB_URI=mongodb://mongo:27017/datacenter-dt-test

  frontend:
    environment:
      - VITE_API_URL=http://localhost:3000/api

  mongo:
    volumes:
      - mongo-test-data:/data/db

volumes:
  mongo-test-data:
```

#### 生产环境配置
```yaml
# docker-compose.prod.yml
services:
  backend:
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/datacenter-dt
      - PORT=3000

  frontend:
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl

  mongo:
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: "4G"
```

### 8.3 监控和维护的最佳实践

#### 监控方案
1. **容器监控**：
   - 使用 Docker Desktop 或 Portainer 监控容器状态
   - 配置 Prometheus + Grafana 监控系统性能

2. **应用监控**：
   - 实现健康检查端点：`/health`
   - 配置日志收集和分析系统
   - 设置告警机制，当服务异常时及时通知

3. **数据监控**：
   - 监控 MongoDB 数据增长情况
   - 定期检查数据备份状态
   - 监控 MQTT 消息传输状态

#### 维护策略
1. **定期备份**：
   - 配置 MongoDB 定期备份：
     ```bash
     docker exec -it <mongo-container> mongodump --out /backup
     ```
   - 定期备份配置文件和重要数据

2. **更新策略**：
   - 定期更新依赖包，修复安全漏洞
   - 定期更新 Docker 镜像，保持系统安全
   - 制定更新计划，避免业务中断

3. **故障排查**：
   - 建立详细的故障排查流程
   - 维护常见问题和解决方案文档
   - 定期进行灾难恢复演练

4. **性能优化**：
   - 监控系统性能指标，识别瓶颈
   - 根据实际负载调整资源分配
   - 优化数据库查询和索引

5. **安全审计**：
   - 定期进行安全扫描，发现潜在漏洞
   - 检查系统日志，识别异常行为
   - 定期更新安全策略和访问控制