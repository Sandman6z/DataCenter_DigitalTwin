# 第一阶段：构建前端应用
FROM node:20-alpine as build

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 清理并重新构建，解决Rollup依赖问题
RUN rm -rf node_modules && npm install && npm run build

# 第二阶段：使用Nginx部署静态资源
FROM nginx:alpine

# 复制构建产物到Nginx的html目录
COPY --from=build /app/dist /usr/share/nginx/html

# 复制Nginx配置文件
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]
