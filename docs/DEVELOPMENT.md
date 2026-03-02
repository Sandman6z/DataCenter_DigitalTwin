# 开发指南

## 1. 开发环境搭建

### 1.1 系统要求

- **操作系统**：Windows 10/11、macOS、Linux
- **Node.js**：v20.0.0 或更高版本
- **npm**：v10.0.0 或更高版本
- **Docker**：v20.0.0 或更高版本
- **Docker Compose**：v1.29.0 或更高版本
- **Git**：v2.20.0 或更高版本

### 1.2 安装步骤

#### 1.2.1 克隆项目

```bash
git clone <项目仓库地址>
cd DataCenter_DT
```

#### 1.2.2 安装依赖

```bash
# 安装所有依赖
npm run install:all

# 或者分别安装前端和后端依赖
npm install --prefix frontend
npm install --prefix backend
```

#### 1.2.3 启动开发环境

```bash
# 启动前端开发服务器
npm run dev:frontend

# 启动后端开发服务器
npm run dev:backend

# 或者使用Docker Compose启动所有服务
docker-compose up -d
```

#### 1.2.4 访问开发环境

- **前端**：http://localhost:5173
- **后端**：http://localhost:3000
- **健康检查**：http://localhost:3000/health

### 1.3 环境配置

#### 1.3.1 前端配置

前端使用 Vite 作为构建工具，配置文件位于 `frontend/vite.config.ts`。

**开发环境变量**：
- 在 `frontend/.env.development` 文件中配置开发环境变量

#### 1.3.2 后端配置

后端配置文件位于 `backend/src/config/index.ts`。

**环境变量**：
- `PORT`：服务端口，默认3000
- `MONGODB_URI`：MongoDB连接字符串
- `MQTT_BROKER`：MQTT broker地址
- `MQTT_TOPIC`：MQTT主题
- `NODE_ENV`：运行环境（development/production/test）

## 2. 代码风格和命名规范

### 2.1 前端代码规范

#### 2.1.1 Vue组件

- **文件命名**：使用 PascalCase，如 `DataCenter3D.vue`
- **组件命名**：使用 PascalCase，与文件名保持一致
- **props命名**：使用 camelCase
- **事件命名**：使用 kebab-case
- **方法命名**：使用 camelCase

**示例**：
```vue
<template>
  <div class="data-center-3d">
    <!-- 组件内容 -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const initThreeScene = () => {
  // 初始化3D场景
}

onMounted(() => {
  initThreeScene()
})
</script>

<style scoped>
.data-center-3d {
  /* 样式 */
}
</style>
```

#### 2.1.2 TypeScript

- **接口命名**：使用 PascalCase，如 `SensorData`
- **类型命名**：使用 PascalCase
- **变量命名**：使用 camelCase
- **常量命名**：使用 UPPER_SNAKE_CASE
- **函数命名**：使用 camelCase

**示例**：
```typescript
interface SensorData {
  deviceId: string
  temperature: number
  humidity: number
  status: string
  timestamp: number
}

const MAX_TEMPERATURE = 30

const calculateStatus = (temperature: number, humidity: number): string => {
  if (temperature > MAX_TEMPERATURE) {
    return 'high-temperature'
  }
  // 其他逻辑
  return 'normal'
}
```

### 2.2 后端代码规范

#### 2.2.1 TypeScript

- **类命名**：使用 PascalCase，如 `SensorController`
- **接口命名**：使用 PascalCase，如 `ISensorData`
- **变量命名**：使用 camelCase
- **常量命名**：使用 UPPER_SNAKE_CASE
- **函数命名**：使用 camelCase
- **方法命名**：使用 camelCase

**示例**：
```typescript
class SensorService {
  private validateData(data: any): data is SensorPayload {
    return (
      data &&
      typeof data.deviceId === 'string' &&
      typeof data.temperature === 'number' &&
      typeof data.humidity === 'number'
    )
  }

  async processSensorData(data: any, io?: Server): Promise<ISensorData | null> {
    // 处理逻辑
  }
}
```

#### 2.2.2 Express路由

- **路由路径**：使用 kebab-case，如 `/api/sensor/latest`
- **路由处理函数**：使用 camelCase
- **中间件命名**：使用 camelCase

**示例**：
```typescript
app.get('/api/sensor/latest', asyncHandler(sensorController.getLatestData))
app.post('/api/sensor/data', asyncHandler((req, res) => sensorController.receiveData(req, res, io)))
```

### 2.3 通用规范

- **缩进**：使用 2 个空格
- **分号**：使用分号
- **引号**：使用单引号（JavaScript/TypeScript），使用双引号（HTML/JSON）
- **行长度**：每行不超过 120 个字符
- **空行**：在逻辑块之间使用空行
- **注释**：为复杂逻辑添加注释

## 3. 项目结构

### 3.1 前端结构

```
frontend/
├── src/
│   ├── components/        # 组件
│   │   ├── DataCenter3D.vue
│   │   └── SensorChart.vue
│   ├── store/             # 状态管理
│   │   └── sensorStore.ts
│   ├── App.vue            # 主应用组件
│   ├── main.ts            # 应用入口
│   ├── style.css          # 全局样式
│   └── vite-env.d.ts      # Vite类型声明
├── public/                # 静态资源
├── dist/                  # 构建产物
├── package.json           # 依赖配置
├── tsconfig.json          # TypeScript配置
├── vite.config.ts         # Vite配置
└── Dockerfile             # Docker构建文件
```

### 3.2 后端结构

```
backend/
├── src/
│   ├── config/            # 配置
│   │   └── index.ts
│   ├── controllers/       # 控制器
│   │   └── sensorController.ts
│   ├── middleware/        # 中间件
│   │   └── errorHandler.ts
│   ├── models/            # 数据模型
│   │   └── sensorData.ts
│   ├── services/          # 服务
│   │   ├── mqttService.ts
│   │   └── sensorService.ts
│   └── index.ts           # 应用入口
├── dist/                  # 构建产物
├── package.json           # 依赖配置
├── tsconfig.json          # TypeScript配置
└── Dockerfile             # Docker构建文件
```

## 4. 贡献指南

### 4.1 分支管理

- **main**：主分支，用于发布生产版本
- **develop**：开发分支，用于集成功能
- **feature/**：功能分支，用于开发新功能
- **bugfix/**：bug修复分支，用于修复bug
- **hotfix/**：热修复分支，用于紧急修复生产问题

### 4.2 开发流程

1. **创建分支**：从 develop 分支创建新的功能分支
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/your-feature-name
   ```

2. **开发功能**：实现功能，编写代码

3. **提交代码**：
   ```bash
   git add .
   git commit -m "feat: 描述你的功能"
   ```

4. **推送分支**：
   ```bash
   git push origin feature/your-feature-name
   ```

5. **创建PR**：在GitHub上创建Pull Request，从功能分支到develop分支

6. **代码审查**：等待代码审查和测试

7. **合并分支**：代码审查通过后，合并到develop分支

### 4.3 提交规范

使用以下提交消息格式：

```
<类型>: <描述>

<详细描述>

<可选的关联issue>
```

**类型**：
- **feat**：新功能
- **fix**：bug修复
- **docs**：文档更新
- **style**：代码风格修改
- **refactor**：代码重构
- **test**：测试代码
- **chore**：构建或依赖更新

**示例**：
```
feat: 添加设备状态监控功能

- 实现设备状态的实时监控
- 添加状态变化的WebSocket通知
- 更新3D模型的状态显示

关联 #123
```

## 5. 代码审查流程

### 5.1 审查标准

1. **代码质量**：
   - 代码是否符合命名规范和风格指南
   - 代码是否清晰易读
   - 是否有适当的注释

2. **功能完整性**：
   - 功能是否完整实现
   - 是否处理了边界情况
   - 是否有适当的错误处理

3. **性能**：
   - 代码是否高效
   - 是否有性能瓶颈
   - 是否考虑了大数据量的情况

4. **安全性**：
   - 是否有安全漏洞
   - 是否处理了输入验证
   - 是否有适当的访问控制

### 5.2 审查流程

1. **PR创建**：开发者创建Pull Request
2. **自动检查**：CI/CD系统运行自动检查（如测试、 lint）
3. **代码审查**：至少有一名其他开发者进行代码审查
4. **反馈**：审查者提供反馈和建议
5. **修改**：开发者根据反馈进行修改
6. **批准**：审查者批准PR
7. **合并**：PR被合并到目标分支

### 5.3 审查工具

- **GitHub Pull Requests**：用于代码审查和讨论
- **ESLint**：用于代码风格检查
- **Prettier**：用于代码格式化
- **TypeScript**：用于类型检查

## 6. 测试指南

### 6.1 前端测试

**工具**：
- **Vitest**：单元测试
- **Cypress**：端到端测试

**测试命令**：
```bash
# 运行单元测试
npm run test --prefix frontend

# 运行端到端测试
npm run e2e --prefix frontend
```

### 6.2 后端测试

**工具**：
- **Jest**：单元测试
- **Supertest**：API测试

**测试命令**：
```bash
# 运行单元测试
npm run test --prefix backend

# 运行API测试
npm run test:api --prefix backend
```

## 7. 部署指南

### 7.1 开发环境部署

```bash
# 启动开发环境
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 7.2 生产环境部署

1. **构建镜像**：
   ```bash
   docker-compose build
   ```

2. **启动服务**：
   ```bash
   docker-compose up -d
   ```

3. **配置域名**：
   - 配置反向代理（如Nginx）
   - 启用HTTPS

4. **监控**：
   - 配置Prometheus + Grafana监控
   - 设置告警机制

## 8. 常见问题

### 8.1 依赖安装失败

- 检查网络连接
- 尝试使用镜像源
- 清理node_modules并重新安装

### 8.2 构建失败

- 检查TypeScript类型错误
- 检查代码语法错误
- 检查依赖版本冲突

### 8.3 服务启动失败

- 检查端口是否被占用
- 检查环境变量配置
- 检查数据库连接

### 8.4 数据不更新

- 检查MQTT连接
- 检查WebSocket连接
- 检查数据库操作

## 9. 联系信息

- **项目维护者**：[维护者名称]
- **邮箱**：[维护者邮箱]
- **GitHub Issues**：用于报告问题和提出功能请求

## 10. 许可证

本项目使用 [MIT](LICENSE) 许可证。