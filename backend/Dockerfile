# 第一阶段：构建后端应用
FROM node:20-alpine as build

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 第二阶段：运行后端应用
FROM node:20-alpine

# 安装 curl 用于健康检查
RUN apk add --no-cache curl

# 设置工作目录
WORKDIR /app

# 复制package.json（只需要生产依赖）
COPY package*.json ./

# 安装生产依赖
RUN npm install --production

# 复制构建产物
COPY --from=build /app/dist ./dist

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "dist/index.js"]
