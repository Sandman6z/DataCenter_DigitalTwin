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
          <div class="view-3d">
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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
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
let controls: any | null = null
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

    // 添加轨道控制器
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.enableZoom = true
    controls.enablePan = true
    controls.minDistance = 3
    controls.maxDistance = 15

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

  // 创建两列服务器机柜
  const cabinetPositions = [
    // 第一列（前面）
    [0, 0, 2], [1, 0, 2], [2, 0, 2],
    // 第二列（后面）
    [0, 0, -2], [1, 0, -2], [2, 0, -2]
  ]

  cabinetPositions.forEach(([x, y, z]) => {
    // 创建机柜主体
    const cabinetWidth = 1.6 // 原来的两倍宽
    const cabinetHeight = 1.5 // 原来的3/4高度
    const cabinetDepth = 0.8
    const blackBarHeight = 0.15 // 最上面黑色条的高度，比急停按钮直径略大
    const blueHeight = cabinetHeight - blackBarHeight // 蓝色部分的高度
    
    // 主体部分：浅蓝色
    const blueCabinetGeometry = new THREE.BoxGeometry(cabinetWidth, blueHeight, cabinetDepth)
    const blueCabinetMaterial = new THREE.MeshPhongMaterial({ color: 0x3498db })
    const blueCabinet = new THREE.Mesh(blueCabinetGeometry, blueCabinetMaterial)
    blueCabinet.position.set(x, y + blueHeight / 2, z)
    scene?.add(blueCabinet)
    
    // 最上面的黑色条
    const blackBarGeometry = new THREE.BoxGeometry(cabinetWidth, blackBarHeight, cabinetDepth)
    const blackBarMaterial = new THREE.MeshPhongMaterial({ color: 0x2c3e50 })
    const blackBar = new THREE.Mesh(blackBarGeometry, blackBarMaterial)
    blackBar.position.set(x, y + blueHeight + blackBarHeight / 2, z)
    scene?.add(blackBar)
    
    // 添加急停开关（红色）
    const emergencyStopGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 32)
    const emergencyStopMaterial = new THREE.MeshPhongMaterial({ color: 0xe74c3c })
    const emergencyStop = new THREE.Mesh(emergencyStopGeometry, emergencyStopMaterial)
    emergencyStop.position.set(x + cabinetWidth / 2 - 0.2, y + blueHeight + blackBarHeight / 2, z + cabinetDepth / 2 - 0.1)
    emergencyStop.rotation.x = Math.PI / 2
    scene?.add(emergencyStop)
    
    // 添加急停开关旁边的指示灯（绿色）
    const indicatorLightGeometry = new THREE.SphereGeometry(0.05, 16, 16)
    const indicatorLightMaterial = new THREE.MeshBasicMaterial({ color: 0x2ecc71 })
    const indicatorLight = new THREE.Mesh(indicatorLightGeometry, indicatorLightMaterial)
    indicatorLight.position.set(x + cabinetWidth / 2 - 0.4, y + blueHeight + blackBarHeight / 2, z + cabinetDepth / 2 - 0.1)
    scene?.add(indicatorLight)

    // 添加机柜细节
    const detailWidth = 1.5
    const detailHeight = 0.1
    const detailDepth = 0.7
    const detailGeometry = new THREE.BoxGeometry(detailWidth, detailHeight, detailDepth)
    const detailMaterial = new THREE.MeshPhongMaterial({ color: 0x34495e })
    const detailCount = 4
    const detailSpacing = (blueHeight - 0.4) / (detailCount - 1)
    for (let i = 0; i < detailCount; i++) {
      const detail = new THREE.Mesh(detailGeometry, detailMaterial)
      detail.position.set(x, y + 0.2 + i * detailSpacing, z)
      scene?.add(detail)
    }

    // 创建状态指示灯
    const lightGeometry = new THREE.SphereGeometry(0.08, 16, 16)
    const lightMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    const light = new THREE.Mesh(lightGeometry, lightMaterial)
    light.position.set(x, y + blueHeight + blackBarHeight + 0.1, z)
    scene?.add(light)

    // 为前一列的中间机柜添加温湿度下位机安装位置指示
    if (z === 2 && x === 0) {
      // 添加温湿度传感器
      const sensorGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.05)
      const sensorMaterial = new THREE.MeshPhongMaterial({ color: 0xff6b6b })
      const sensor = new THREE.Mesh(sensorGeometry, sensorMaterial)
      sensor.position.set(x, y + blueHeight / 2, z + cabinetDepth / 2 + 0.02)
      scene?.add(sensor)

      // 创建箭头指向传感器
      const arrowDir = new THREE.Vector3(1, 0, 0)
      arrowDir.normalize()
      const arrowOrigin = new THREE.Vector3(x + cabinetWidth / 2 + 0.2, y + blueHeight / 2, z + cabinetDepth / 2 + 0.02)
      const arrowLength = 1.5
      const arrowColor = 0xffff00

      const arrowHelper = new THREE.ArrowHelper(arrowDir, arrowOrigin, arrowLength, arrowColor, 0.3, 0.2)
      scene?.add(arrowHelper)

      // 添加数据显示面板
      const panelGeometry = new THREE.PlaneGeometry(1, 0.6)
      const panelMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x2c3e50, 
        side: THREE.DoubleSide 
      })
      const panel = new THREE.Mesh(panelGeometry, panelMaterial)
      panel.position.set(x + cabinetWidth / 2 + arrowLength + 0.5, y + blueHeight / 2, z + cabinetDepth / 2 + 0.02)
      panel.rotation.y = Math.PI / 2
      scene?.add(panel)
    }
  })
}

// 动画循环
const animate = () => {
  if (!scene || !camera || !renderer) return

  // 更新轨道控制器
  controls?.update()

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
  // 直接使用相对路径，让Nginx代理处理
  const socketUrl = '/' 
  socket = io(socketUrl)

  socket.on('connect', () => {
    console.log('Socket connected')
  })

  socket.on('sensor-data', (data: any) => {
    console.log('Received sensor data:', data)
    temperature.value = data.temperature
    humidity.value = data.humidity
    updateStatusClass()
    updateChartData(data.temperature, data.humidity)
  })

  socket.on('disconnect', () => {
    console.log('Socket disconnected')
  })

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error)
  })
}

// 模拟数据函数已移除，现在使用真实MQTT数据

// 生命周期
onMounted(() => {
  initChart()
  initThreeScene()
  initSocket()
  // simulateData() // 注释掉模拟数据，使用真实MQTT数据
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
.view-3d {
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

.view-3d {
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
