import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { io, Socket } from 'socket.io-client'

export interface SensorData {
  deviceId: string
  temperature: number
  humidity: number
  status: string
  timestamp: number
}

export const useSensorStore = defineStore('sensor', () => {
  const latestData = ref<SensorData | null>(null)
  const historicalData = ref<SensorData[]>([])
  const devices = ref<string[]>([])
  const isConnected = ref(false)
  let socket: Socket | null = null

  const currentStatus = computed(() => latestData.value?.status || 'normal')
  const currentTemp = computed(() => latestData.value?.temperature || 25)
  const currentHumidity = computed(() => latestData.value?.humidity || 50)

  // API 基础路径
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api'
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'

  // 初始化 Socket 连接
  const initSocket = () => {
    if (socket) return

    socket = io(SOCKET_URL)

    socket.on('connect', () => {
      isConnected.value = true
      console.log('Socket connected')
    })

    socket.on('disconnect', () => {
      isConnected.value = false
      console.log('Socket disconnected')
    })

    socket.on('sensor-data', (data: SensorData) => {
      latestData.value = data
      // 将新数据添加到历史记录开头
      historicalData.value = [data, ...historicalData.value].slice(0, 100)
    })
  }

  // 获取设备列表
  const fetchDevices = async () => {
    try {
      const res = await axios.get(`${API_BASE}/sensor/devices`)
      devices.value = res.data
    } catch (err) {
      console.error('Fetch devices error:', err)
    }
  }

  // 获取最新数据
  const fetchLatestData = async (deviceId?: string) => {
    try {
      const res = await axios.get(`${API_BASE}/sensor/latest`, {
        params: { deviceId }
      })
      latestData.value = res.data
    } catch (err) {
      console.error('Fetch latest data error:', err)
    }
  }

  // 获取历史数据
  const fetchHistoricalData = async (deviceId?: string, limit = 20) => {
    try {
      const res = await axios.get(`${API_BASE}/sensor/historical`, {
        params: { deviceId, limit }
      })
      historicalData.value = res.data
    } catch (err) {
      console.error('Fetch historical data error:', err)
    }
  }

  return {
    latestData,
    historicalData,
    devices,
    isConnected,
    currentStatus,
    currentTemp,
    currentHumidity,
    initSocket,
    fetchDevices,
    fetchLatestData,
    fetchHistoricalData
  }
})
