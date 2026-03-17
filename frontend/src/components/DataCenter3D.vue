<template>
  <div class="view-3d" ref="containerRef">
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
const containerRef = ref<HTMLElement>()

let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let controls: OrbitControls | null = null
let rackInstances: THREE.InstancedMesh | null = null
let lightInstances: THREE.InstancedMesh | null = null
let animationId: number | null = null
let isVisible = true

// 机柜位置类型
type Position = {
  x: number
  z: number
}

// 机柜位置
const rackPositions: Position[] = [
  { x: -2, z: -2 },
  { x: 0, z: -2 },
  { x: 2, z: -2 },
  { x: -2, z: 0 },
  { x: 0, z: 0 },
  { x: 2, z: 0 },
  { x: -2, z: 2 },
  { x: 0, z: 2 },
  { x: 2, z: 2 }
]

// 创建机房模型
const createDataCenterModel = (): void => {
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

  // 使用InstancedMesh创建机柜
  const rackGeometry = new THREE.BoxGeometry(0.8, 1.8, 0.8)
  const rackMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 })
  rackInstances = new THREE.InstancedMesh(rackGeometry, rackMaterial, rackPositions.length)
  
  // 使用InstancedMesh创建状态灯
  const lightGeometry = new THREE.SphereGeometry(0.05, 16, 16)
  const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff })
  lightInstances = new THREE.InstancedMesh(lightGeometry, lightMaterial, rackPositions.length)

  // 设置实例矩阵
  const rackMatrix = new THREE.Matrix4()
  const lightMatrix = new THREE.Matrix4()
  
  rackPositions.forEach((position, index) => {
    // 设置机柜位置
    rackMatrix.makeTranslation(position.x, 0.9, position.z)
    rackInstances?.setMatrixAt(index, rackMatrix)
    
    // 设置状态灯位置
    lightMatrix.makeTranslation(position.x, 1.6, position.z + 0.41)
    lightInstances?.setMatrixAt(index, lightMatrix)
  })

  if (rackInstances) {
    rackInstances.instanceMatrix.needsUpdate = true
  }
  if (lightInstances) {
    lightInstances.instanceMatrix.needsUpdate = true
  }

  scene.add(rackInstances)
  scene.add(lightInstances)
}

// 初始化3D场景
const initThreeScene = (): void => {
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
  startAnimation()
  
  // 监听可见性变化
  const observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
    isVisible = entries[0].isIntersecting
    if (isVisible) {
      startAnimation()
    } else {
      stopAnimation()
    }
  })
  
  if (containerRef.value) {
    observer.observe(containerRef.value)
  }
}

// 启动动画
const startAnimation = (): void => {
  if (animationId !== null) return
  animate()
}

// 停止动画
const stopAnimation = (): void => {
  if (animationId !== null) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

// 动画循环
const animate = (): void => {
  if (!isVisible || !renderer || !scene || !camera) {
    animationId = null
    return
  }
  
  animationId = requestAnimationFrame(animate)
  if (controls) controls.update()
  renderer.render(scene, camera)
}

// 更新状态灯颜色
const updateStatusLights = (status: string): void => {
  if (!lightInstances) return
  
  let color = 0x00ff00 // 正常
  if (status === 'high-temperature') color = 0xff0000 // 高温
  else if (status === 'high-humidity') color = 0xffff00 // 高湿

  const tempColor = new THREE.Color(color)
  
  // 更新所有实例的颜色 (实际应用中可以根据设备ID分别更新对应机柜)
  for (let i = 0; i < rackPositions.length; i++) {
    lightInstances.setColorAt(i, tempColor)
  }
  if (lightInstances.instanceColor) {
    lightInstances.instanceColor.needsUpdate = true
  }
}

// 监听窗口大小变化
let resizeTimeout: number | null = null
const handleResize = (): void => {
  if (resizeTimeout) clearTimeout(resizeTimeout)
  resizeTimeout = window.setTimeout(() => {
    if (!threeRef.value || !camera || !renderer) return
    camera.aspect = threeRef.value.clientWidth / threeRef.value.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(threeRef.value.clientWidth, threeRef.value.clientHeight)
  }, 100)
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
  if (resizeTimeout) clearTimeout(resizeTimeout)
  stopAnimation()
  if (renderer) {
    renderer.dispose()
    renderer.forceContextLoss()
  }
  // 清理场景资源，防止内存泄漏
  if (scene) {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.InstancedMesh) {
        if (object.geometry) {
          object.geometry.dispose()
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(m => m.dispose())
          } else {
            object.material.dispose()
          }
        }
      }
    })
    scene.clear()
  }
  rackInstances = null
  lightInstances = null
  scene = null
  camera = null
  renderer = null
  controls = null
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
