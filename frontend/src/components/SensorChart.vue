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
const initChart = () => {
  if (chartRef.value) {
    chart = echarts.init(chartRef.value)
    updateChart()
  }
}

// 更新图表数据
const updateChart = () => {
  if (!chart) return

  const data = [...sensorStore.historicalData].reverse()
  const time = data.map(d => new Date(d.timestamp).toLocaleTimeString())
  const temperature = data.map(d => d.temperature)
  const humidity = data.map(d => d.humidity)

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['温度', '湿度']
    },
    xAxis: {
      type: 'category',
      data: time
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
        itemStyle: { color: '#ff7675' }
      },
      {
        name: '湿度',
        type: 'line',
        yAxisIndex: 1,
        data: humidity,
        smooth: true,
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
const handleResize = () => {
  if (chart) chart.resize()
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
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
