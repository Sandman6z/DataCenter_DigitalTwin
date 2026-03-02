# API文档

## 1. 概述

本文档描述了机房温湿度数字孪生系统的API接口，包括端点、参数和响应格式。系统提供了一系列RESTful API，用于获取传感器数据、设备列表和接收传感器数据。

## 2. 基础信息

- **API基础路径**：`/api`
- **请求方法**：GET、POST
- **响应格式**：JSON
- **错误处理**：统一的错误响应格式

## 3. API端点

### 3.1 获取最新传感器数据

**端点**：`GET /api/sensor/latest`

**参数**：
| 参数名 | 类型 | 必选 | 描述 |
|--------|------|------|------|
| deviceId | string | 否 | 设备ID，不指定则返回所有设备的最新数据 |

**响应**：
- **成功**：`200 OK`
  ```json
  {
    "_id": "60f7e3b3e4b0e3b3e4b0e3b3",
    "deviceId": "sensor-001",
    "temperature": 25.5,
    "humidity": 60.2,
    "status": "normal",
    "timestamp": 1626934707000,
    "__v": 0
  }
  ```
- **失败**：`404 Not Found`
  ```json
  {
    "message": "No sensor data found"
  }
  ```

### 3.2 获取历史传感器数据

**端点**：`GET /api/sensor/historical`

**参数**：
| 参数名 | 类型 | 必选 | 描述 |
|--------|------|------|------|
| deviceId | string | 否 | 设备ID，不指定则返回所有设备的历史数据 |
| startTime | number | 否 | 开始时间戳（毫秒） |
| endTime | number | 否 | 结束时间戳（毫秒） |
| limit | number | 否 | 返回数据条数，默认100 |

**响应**：
- **成功**：`200 OK`
  ```json
  [
    {
      "_id": "60f7e3b3e4b0e3b3e4b0e3b3",
      "deviceId": "sensor-001",
      "temperature": 25.5,
      "humidity": 60.2,
      "status": "normal",
      "timestamp": 1626934707000,
      "__v": 0
    },
    {
      "_id": "60f7e3b3e4b0e3b3e4b0e3b4",
      "deviceId": "sensor-001",
      "temperature": 25.3,
      "humidity": 60.5,
      "status": "normal",
      "timestamp": 1626934607000,
      "__v": 0
    }
  ]
  ```

### 3.3 获取设备列表

**端点**：`GET /api/sensor/devices`

**参数**：无

**响应**：
- **成功**：`200 OK`
  ```json
  ["sensor-001", "sensor-002", "sensor-003"]
  ```

### 3.4 接收传感器数据（HTTP POST）

**端点**：`POST /api/sensor/data`

**请求体**：
```json
{
  "deviceId": "sensor-001",
  "temperature": 25.5,
  "humidity": 60.2,
  "timestamp": 1626934707000
}
```

**参数**：
| 参数名 | 类型 | 必选 | 描述 |
|--------|------|------|------|
| deviceId | string | 是 | 设备ID |
| temperature | number | 是 | 温度值 |
| humidity | number | 是 | 湿度值 |
| timestamp | number | 否 | 时间戳（毫秒），不指定则使用当前时间 |

**响应**：
- **成功**：`201 Created`
  ```json
  {
    "message": "Data received and processed",
    "data": {
      "_id": "60f7e3b3e4b0e3b3e4b0e3b3",
      "deviceId": "sensor-001",
      "temperature": 25.5,
      "humidity": 60.2,
      "status": "normal",
      "timestamp": 1626934707000,
      "__v": 0
    }
  }
  ```

### 3.5 健康检查

**端点**：`GET /health`

**参数**：无

**响应**：
- **成功**：`200 OK`
  ```json
  {
    "status": "ok",
    "timestamp": "2026-03-02T03:59:00.000Z"
  }
  ```

## 4. WebSocket接口

系统还提供了WebSocket接口，用于实时接收传感器数据。

**连接地址**：`ws://<服务器地址>/socket.io`

**事件**：
- **sensor-data**：接收传感器数据
  ```json
  {
    "deviceId": "sensor-001",
    "temperature": 25.5,
    "humidity": 60.2,
    "status": "normal",
    "timestamp": 1626934707000
  }
  ```

## 5. API使用示例

### 5.1 使用curl获取最新数据

```bash
# 获取所有设备的最新数据
curl http://localhost:3000/api/sensor/latest

# 获取特定设备的最新数据
curl http://localhost:3000/api/sensor/latest?deviceId=sensor-001
```

### 5.2 使用curl获取历史数据

```bash
# 获取最近100条数据
curl http://localhost:3000/api/sensor/historical

# 获取特定设备的历史数据
curl http://localhost:3000/api/sensor/historical?deviceId=sensor-001&limit=50

# 获取指定时间范围的数据
curl http://localhost:3000/api/sensor/historical?startTime=1626934707000&endTime=1626935707000
```

### 5.3 使用curl获取设备列表

```bash
curl http://localhost:3000/api/sensor/devices
```

### 5.4 使用curl发送传感器数据

```bash
curl -X POST http://localhost:3000/api/sensor/data \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "sensor-001", "temperature": 25.5, "humidity": 60.2}'
```

### 5.5 使用JavaScript连接WebSocket

```javascript
const socket = io('http://localhost:3000');

socket.on('sensor-data', (data) => {
  console.log('Received sensor data:', data);
});
```

## 6. 最佳实践

1. **速率限制**：避免频繁调用API，建议每30秒最多调用一次获取最新数据的API
2. **错误处理**：妥善处理API返回的错误，尤其是404错误
3. **数据验证**：发送数据前验证数据格式，确保符合API要求
4. **WebSocket使用**：对于实时数据需求，优先使用WebSocket接口
5. **参数使用**：合理使用查询参数，减少返回数据量

## 7. 版本控制

- **当前版本**：v1.0.0
- **版本变更记录**：
  - v1.0.0 (2026-03-02)：初始版本，包含基本API端点

## 8. 更新机制

API文档将随着系统的更新而定期更新。当API发生变化时，会：
1. 更新文档内容
2. 增加版本号
3. 在版本变更记录中添加变更说明

建议开发者定期查看API文档，以了解最新的API变化。