# 机房温湿度数字孪生系统

## 项目简介

本项目是一个基于数字孪生技术的机房温湿度监控系统，通过实时采集、处理和可视化机房内的温湿度数据，实现对机房环境的全方位监控和管理。

## 系统架构

### 1. 数据采集层
- 接收下位机发送的温湿度数据
- 支持多种传输协议：MQTT、HTTP、WebSocket
- 数据格式：JSON

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

### 9. 常见问题

#### 端口冲突

如果遇到端口冲突，可以修改 `docker-compose.yml` 文件中的端口映射配置，使用其他可用端口。

#### 容器启动失败

使用以下命令查看容器日志，了解启动失败的原因：

```bash
docker compose logs -f
```

#### MQTT 连接失败

确保 Mosquitto 容器已经正常启动，并且后端配置的 `MQTT_BROKER` 地址为 `mqtt://mosquitto:1883`。

#### MongoDB 连接失败

确保 MongoDB 容器已经正常启动，并且后端配置的 `MONGODB_URI` 地址为 `mongodb://mongo:27017/datacenter-dt`。

#### 前端无法连接到后端

确保后端容器已经正常启动，并且前端代码中的 Socket 连接使用相对路径。

#### 构建镜像失败

确保您的网络连接正常，并且 Docker 环境配置正确。如果构建过程中遇到依赖安装失败，可以尝试修改 Dockerfile 中的镜像源。