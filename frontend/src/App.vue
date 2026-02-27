<template>
  <div class="app-container">
    <header class="app-header">
      <h1>机房温湿度数字孪生系统</h1>
      <div class="connection-status" :class="{ connected: sensorStore.isConnected }">
        {{ sensorStore.isConnected ? '已连接' : '未连接' }}
      </div>
    </header>
    <main class="app-main">
      <div class="dashboard">
        <div class="left-panel">
          <div class="stats-card">
            <h3>实时数据</h3>
            <div class="stat-item">
              <span class="label">当前温度</span>
              <span class="value">{{ sensorStore.currentTemp.toFixed(1) }} °C</span>
            </div>
            <div class="stat-item">
              <span class="label">当前湿度</span>
              <span class="value">{{ sensorStore.currentHumidity.toFixed(1) }} %</span>
            </div>
            <div class="stat-item">
              <span class="label">设备状态</span>
              <span class="value" :class="statusClass">{{ statusLabel }}</span>
            </div>
            <div class="stat-item device-select">
              <label>选择设备：</label>
              <select v-model="selectedDevice" @change="handleDeviceChange">
                <option value="">全部设备</option>
                <option v-for="device in sensorStore.devices" :key="device" :value="device">
                  {{ device }}
                </option>
              </select>
            </div>
          </div>
          <SensorChart />
        </div>
        <div class="right-panel">
          <DataCenter3D />
        </div>
      </div>
    </main>
    <footer class="app-footer">
      <p>© 2026 机房温湿度数字孪生系统 - 已优化架构</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useSensorStore } from './store/sensorStore'
import SensorChart from './components/SensorChart.vue'
import DataCenter3D from './components/DataCenter3D.vue'

const sensorStore = useSensorStore()
const selectedDevice = ref('')

const statusLabel = computed(() => {
  switch (sensorStore.currentStatus) {
    case 'high-temperature': return '高温告警'
    case 'high-humidity': return '高湿告警'
    default: return '正常'
  }
})

const statusClass = computed(() => {
  switch (sensorStore.currentStatus) {
    case 'high-temperature':
    case 'high-humidity': return 'warning'
    default: return 'normal'
  }
})

const handleDeviceChange = () => {
  sensorStore.fetchLatestData(selectedDevice.value)
  sensorStore.fetchHistoricalData(selectedDevice.value)
}

onMounted(() => {
  sensorStore.initSocket()
  sensorStore.fetchDevices()
  sensorStore.fetchLatestData()
  sensorStore.fetchHistoricalData()
})
</script>

<style>
:root {
  --primary-color: #2c3e50;
  --bg-color: #f5f7fa;
  --card-bg: #ffffff;
  --text-color: #2c3e50;
  --warning-color: #e74c3c;
  --normal-color: #2ecc71;
}

body {
  margin: 0;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background-color: var(--primary-color);
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.connection-status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  background-color: #95a5a6;
}

.connection-status.connected {
  background-color: var(--normal-color);
}

.app-main {
  flex-grow: 1;
  padding: 2rem;
}

.dashboard {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.stats-card {
  background-color: var(--card-bg);
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.stat-item:last-child {
  margin-bottom: 0;
}

.label {
  color: #666;
}

.value {
  font-size: 1.2rem;
  font-weight: bold;
}

.value.normal {
  color: var(--normal-color);
}

.value.warning {
  color: var(--warning-color);
}

.device-select {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
  flex-direction: column;
  align-items: flex-start;
}

.device-select select {
  margin-top: 0.5rem;
  width: 100%;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.app-footer {
  text-align: center;
  padding: 1rem;
  color: #666;
  font-size: 0.9rem;
}

@media (max-width: 1024px) {
  .dashboard {
    grid-template-columns: 1fr;
  }
}
</style>
