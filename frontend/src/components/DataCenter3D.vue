<template>
  <div class="view-3d">
    <h3>3D机房模型</h3>
    <div ref="threeRef" class="three-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useSensorStore } from '../store/sensorStore'

const sensorStore = useSensorStore()
const threeRef = ref<HTMLElement>()

let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let controls: OrbitControls | null = null
let statusLights: THREE.Mesh[] = []

// 创建机柜模型
const createRack = (x: number, z: number) => {
  const group = new THREE.Group()

  // 机柜主体
  const bodyGeometry = new THREE.BoxGeometry(0.8, 1.8, 0.8)
  const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 })
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  body.position.y = 0.9
  group.add(body)

  // 状态灯
  const lightGeometry = new THREE.SphereGeometry(0.05, 16, 16)
  const lightMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  const light = new THREE.Mesh(lightGeometry, lightMaterial)
  light.position.set(0, 1.6, 0.41)
  group.add(light)
  statusLights.push(light)

  group.position.set(x, 0, z)
  return group
}

// 创建机房模型
const createDataCenterModel = () => {
  if (!scene) return

  // 地板
  const floorGeometry = new THREE.PlaneGeometry(10, 10)
  const floorMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc, side: THREE.DoubleSide })
  const floor = new THREE.Mesh(floorGeometry, floorMaterial)
  floor.rotation.x = Math.PI / 2
  scene.add(floor)

  // 网格辅助
  const gridHelper = new THREE.GridHelper(10, 10)
  scene.add(gridHelper)

  // 放置机柜
  for (let i = -2; i <= 2; i += 2) {
    for (let j = -2; j <= 2; j += 2) {
      scene.add(createRack(i, j))
    }
  }
}

// 初始化3D场景
const initThreeScene = () => {
  if (!threeRef.value) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf0f0f0)

  camera = new THREE.PerspectiveCamera(75, threeRef.value.clientWidth / threeRef.value.clientHeight, 0.1, 1000)
  camera.position.set(5, 5, 5)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(threeRef.value.clientWidth, threeRef.value.clientHeight)
  threeRef.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(1, 1, 1)
  scene.add(directionalLight)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05

  createDataCenterModel()
  animate()
}

// 动画循环
const animate = () => {
  if (!renderer || !scene || !camera) return
  requestAnimationFrame(animate)
  if (controls) controls.update()
  renderer.render(scene, camera)
}

// 更新状态灯颜色
const updateStatusLights = (status: string) => {
  let color = 0x00ff00 // 正常
  if (status === 'high-temperature') color = 0xff0000 // 高温
  else if (status === 'high-humidity') color = 0xffff00 // 高湿

  statusLights.forEach(light => {
    if (light.material instanceof THREE.MeshBasicMaterial) {
      light.material.color.setHex(color)
    }
  })
}

// 监听窗口大小变化
const handleResize = () => {
  if (!threeRef.value || !camera || !renderer) return
  camera.aspect = threeRef.value.clientWidth / threeRef.value.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(threeRef.value.clientWidth, threeRef.value.clientHeight)
}

// 监听状态变化
watch(() => sensorStore.currentStatus, (newStatus) => {
  updateStatusLights(newStatus)
})

onMounted(() => {
  initThreeScene()
  window.addEventListener('resize', handleResize)
  // 初始化时更新灯光
  updateStatusLights(sensorStore.currentStatus)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (renderer) {
    renderer.dispose()
    renderer.forceContextLoss()
  }
})
</script>

<style scoped>
.view-3d {
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.three-container {
  flex-grow: 1;
  min-height: 400px;
  border-radius: 4px;
  overflow: hidden;
}

h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #333;
}
</style>
