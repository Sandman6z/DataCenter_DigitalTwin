<template>
  <div class="app-container">
    <header class="app-header">
      <h1>机房温湿度数字孪生系统</h1>
    </header>
    <main class="app-main">
      <div class="dashboard">
        <div class="left-panel">
          <div class="stats-card">
            <h3>实时数据</h3>
            <div class="stat-item">
              <span class="label">温度</span>
              <span class="value">{{ temperature }} °C</span>
            </div>
            <div class="stat-item">
              <span class="label">湿度</span>
              <span class="value">{{ humidity }} %</span>
            </div>
            <div class="stat-item">
              <span class="label">设备状态</span>
              <span class="value" :class="statusClass">{{ status }}</span>
            </div>
          </div>
          <div class="chart-card">
            <h3>历史趋势</h3>
            <div ref="chartRef" class="chart-container"></div>
          </div>
        </div>
        <div class="right-panel">
          <div class="3d-view">
            <h3>3D机房模型</h3>
            <div ref="threeRef" class="three-container"></div>
          </div>
        </div>
      </div>
    </main>
    <footer class="app-footer">
      <p>© 2026 机房温湿度数字孪生系统</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import * as echarts from 'echarts'
import { io, Socket } from 'socket.io-client'

// 状态数据
const temperature = ref(25.5)
const humidity = ref(60.2)
const status = ref('正常')
const statusClass = ref('normal')

// DOM引用
const chartRef = ref<HTMLElement>()
const threeRef = ref<HTMLElement>()

// 图表和3D场景
let chart: echarts.ECharts | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let socket: Socket | null = null

// 历史数据
const historyData = {
  time: [] as string[],
  temperature: [] as number[],
  humidity: [] as number[]
}

// 计算状态类
const updateStatusClass = () => {
  if (temperature.value > 30) {
    status.value = '高温告警'
    statusClass.value = 'warning'
  } else if (humidity.value > 80) {
    status.value = '高湿告警'
    statusClass.value = 'warning'
  } else {
    status.value = '正常'
    statusClass.value = 'normal'
  }
}

// 初始化图表
const initChart = () => {
  if (chartRef.value) {
    chart = echarts.init(chartRef.value)
    const option = {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['温度', '湿度']
      },
      xAxis: {
        type: 'category',
        data: historyData.time
      },
      yAxis: [
        {
          type: 'value',
          name: '温度 (°C)',
          position: 'left'
        },
        {
          type: 'value',
          name: '湿度 (%)',
          position: 'right'
        }
      ],
      series: [
        {
          name: '温度',
          type: 'line',
          data: historyData.temperature
        },
        {
          name: '湿度',
          type: 'line',
          yAxisIndex: 1,
          data: historyData.humidity
        }
      ]
    }
    chart.setOption(option)
  }
}

// 初始化3D场景
const initThreeScene = () => {
  if (threeRef.value) {
    // 创建场景
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f0f0)

    // 创建相机
    camera = new THREE.PerspectiveCamera(75, threeRef.value.clientWidth / threeRef.value.clientHeight, 0.1, 1000)
    camera.position.set(5, 5, 5)
    camera.lookAt(0, 0, 0)

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(threeRef.value.clientWidth, threeRef.value.clientHeight)
    threeRef.value.appendChild(renderer.domElement)

    // 添加光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(1, 1, 1)
    scene.add(directionalLight)

    // 创建机房模型
    createDataCenterModel()

    // 动画循环
    animate()
  }
}

// 创建机房模型
const createDataCenterModel = () => {
  if (!scene) return

  // 创建机房主体
  const roomGeometry = new THREE.BoxGeometry(10, 3, 8)
  const roomMaterial = new THREE.MeshPhongMaterial({ color: 0xd0d0d0, transparent: true, opacity: 0.3 })
  const room = new THREE.Mesh(roomGeometry, roomMaterial)
  scene.add(room)

  // 创建服务器机柜
  for (let i = -3; i <= 3; i += 2) {
    for (let j = -3; j <= 3; j += 2) {
      const cabinetGeometry = new THREE.BoxGeometry(0.8, 2, 0.8)
      const cabinetMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 })
      const cabinet = new THREE.Mesh(cabinetGeometry, cabinetMaterial)
      cabinet.position.set(i, 1, j)
      scene.add(cabinet)

      // 创建状态指示灯
      const lightGeometry = new THREE.SphereGeometry(0.1, 16, 16)
      const lightMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
      const light = new THREE.Mesh(lightGeometry, lightMaterial)
      light.position.set(i, 2.1, j)
      scene.add(light)
    }
  }
}

// 动画循环
const animate = () => {
  if (!scene || !camera || !renderer) return

  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}

// 更新图表数据
const updateChartData = (temp: number, hum: number) => {
  const now = new Date()
  const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`

  historyData.time.push(timeStr)
  historyData.temperature.push(temp)
  historyData.humidity.push(hum)

  // 保持数据点数量
  if (historyData.time.length > 20) {
    historyData.time.shift()
    historyData.temperature.shift()
    historyData.humidity.shift()
  }

  if (chart) {
    chart.setOption({
      xAxis: {
        data: historyData.time
      },
      series: [
        {
          data: historyData.temperature
        },
        {
          data: historyData.humidity
        }
      ]
    })
  }
}

// 初始化Socket连接
const initSocket = () => {
  socket = io('http://localhost:8080')

  socket.on('connect', () => {
    console.log('Socket connected')
  })

  socket.on('sensor-data', (data: any) => {
    temperature.value = data.temperature
    humidity.value = data.humidity
    updateStatusClass()
    updateChartData(data.temperature, data.humidity)
  })

  socket.on('disconnect', () => {
    console.log('Socket disconnected')
  })
}

// 模拟数据（临时）
const simulateData = () => {
  setInterval(() => {
    temperature.value = 25 + Math.random() * 5
    humidity.value = 55 + Math.random() * 10
    updateStatusClass()
    updateChartData(temperature.value, humidity.value)
  }, 2000)
}

// 生命周期
onMounted(() => {
  initChart()
  initThreeScene()
  initSocket()
  simulateData() // 临时模拟数据
})

onUnmounted(() => {
  if (socket) {
    socket.disconnect()
  }
  if (chart) {
    chart.dispose()
  }
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.app-header {
  background-color: #333;
  color: white;
  padding: 1rem;
  text-align: center;
}

.app-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.app-main {
  flex: 1;
  padding: 1rem;
}

.dashboard {
  display: flex;
  gap: 1rem;
  height: 100%;
}

.left-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.right-panel {
  flex: 1;
}

.stats-card,
.chart-card,
.3d-view {
  background-color: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stats-card {
  flex: 1;
}

.chart-card {
  flex: 2;
}

.3d-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #333;
  font-size: 1rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.label {
  font-weight: 500;
  color: #666;
}

.value {
  font-weight: 600;
}

.value.normal {
  color: #4caf50;
}

.value.warning {
  color: #ff9800;
}

.value.error {
  color: #f44336;
}

.chart-container {
  width: 100%;
  height: calc(100% - 2rem);
}

.three-container {
  width: 100%;
  height: calc(100% - 2rem);
  border-radius: 4px;
  overflow: hidden;
}

.app-footer {
  background-color: #333;
  color: white;
  padding: 0.5rem;
  text-align: center;
  font-size: 0.8rem;
}
</style>
