<template>
  <div class="chart-card">
    <h3>历史趋势</h3>
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import { useSensorStore } from '../store/sensorStore'

const sensorStore = useSensorStore()
const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

// 初始化图表
const initChart = (): void => {
  if (chartRef.value) {
    chart = echarts.init(chartRef.value)
    updateChart()
  }
}

// 更新图表数据
const updateChart = (): void => {
  if (!chart) return

  const data = [...sensorStore.historicalData].reverse()
  // 将数据转换为 [时间戳, 值] 的二维数组，对于错误或无数据状态，设置值为 null 以实现折线断开
  const temperature = data.map(d => [
    new Date(d.timestamp).getTime(), 
    (d.status === 'error' || d.temperature == null) ? null : d.temperature
  ])
  const humidity = data.map(d => [
    new Date(d.timestamp).getTime(), 
    (d.status === 'error' || d.humidity == null) ? null : d.humidity
  ])

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['温度', '湿度']
    },
    xAxis: {
      type: 'time', // 改为时间轴，自动根据绝对时间间隔渲染
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
        data: temperature,
        smooth: true,
        connectNulls: false, // 遇到 null 值断开连接
        sampling: 'lttb', // 降采样策略，优化大数据量渲染
        itemStyle: { color: '#ff7675' }
      },
      {
        name: '湿度',
        type: 'line',
        yAxisIndex: 1,
        data: humidity,
        smooth: true,
        connectNulls: false, // 遇到 null 值断开连接
        sampling: 'lttb', // 降采样策略，优化大数据量渲染
        itemStyle: { color: '#74b9ff' }
      }
    ]
  }
  chart.setOption(option)
}

// 监听数据变化
watch(() => sensorStore.historicalData, () => {
  updateChart()
}, { deep: true })

// 监听窗口大小变化
let resizeTimeout: number | null = null
const handleResize = (): void => {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }
  resizeTimeout = window.setTimeout(() => {
    if (chart) chart.resize()
  }, 100)
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (resizeTimeout) clearTimeout(resizeTimeout)
  if (chart) chart.dispose()
})
</script>

<style scoped>
.chart-card {
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
}

.chart-container {
  height: 300px;
  width: 100%;
}

h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #333;
}
</style>
