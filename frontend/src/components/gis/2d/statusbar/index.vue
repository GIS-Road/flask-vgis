<template>
  <div class="status-bar" @click.stop>
    <span class="info-item">经纬度: {{ lonLatText }}</span>
    <span class="divider">|</span>
    <span class="info-item">缩放等级: {{ zoomLevel }}</span>
    <span class="divider">|</span>
    <div class="scale-wrap">
      <span class="info-item">比例尺:</span>
      <!-- 细线条样式 -->
      <div class="scale-bar">
        <div class="scale-bar-line"></div>
        <div class="scale-bar-labels">
          <span>0</span>
          <span>{{ scaleDistance }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import type { Map } from 'ol'

const SCALE_BAR_PX = 120

// 地球近似参数：纬度 1° ≈ 110.574 km，经度 1° ≈ 111.32 × cos(φ) km
const METERS_PER_DEG_LAT = 110574
const METERS_PER_DEG_LON_EQUATOR = 111320

const props = defineProps<{ map: Map | null }>()

const zoomLevel = ref(0)
const centerLon = ref(0)
const centerLat = ref(0)
const metersPerPixel = ref(0)

/**
 * 计算米/像素：取经纬度方向平均值
 * 适用于 EPSG:4326 等地理坐标系
 */
function calcMetersPerPixel(resolutionDeg: number, latDeg: number): number {
  const latRad = (latDeg * Math.PI) / 180
  const avgMetersPerDeg =
    (METERS_PER_DEG_LAT + METERS_PER_DEG_LON_EQUATOR * Math.cos(latRad)) / 2
  return resolutionDeg * avgMetersPerDeg
}

const lonLatText = computed(() => {
  if (!centerLon.value || !centerLat.value) return '--,--'
  return `${centerLon.value.toFixed(6)},${centerLat.value.toFixed(6)}`
})

const scaleDistance = computed(() => {
  if (!metersPerPixel.value) return '--'
  return niceDistance(metersPerPixel.value * SCALE_BAR_PX)
})

function niceDistance(meters: number): string {
  if (meters <= 0) return '0'
  let value = meters
  let unit = 'm'
  if (value >= 1000) { value = value / 1000; unit = 'km' }
  const pow10 = Math.pow(10, Math.floor(Math.log10(value)))
  const normalized = value / pow10
  let nice: number
  if (normalized < 1.5) nice = 1
  else if (normalized < 3.5) nice = 2
  else if (normalized < 7.5) nice = 5
  else nice = 10
  const result = nice * pow10
  if (unit === 'km') return (Math.round(result * 10) / 10).toString() + ' ' + unit
  return Math.round(result).toString() + ' ' + unit
}

function updateStatus() {
  if (!props.map) return
  const view = props.map.getView()

  const zoom = view.getZoom()
  if (zoom !== undefined && zoom !== null) {
    zoomLevel.value = Math.round(zoom)
  }

  const center = view.getCenter()
  if (center && center.length === 2) {
    centerLon.value = center[0]
    centerLat.value = center[1]
  }

  const resolution = view.getResolution()
  if (resolution && center) {
    metersPerPixel.value = calcMetersPerPixel(resolution, center[1])
  }
}

let moveendHandler: (() => void) | null = null

function bindMapEvents() {
  if (!props.map) return
  if (moveendHandler) props.map.un('moveend', moveendHandler)
  moveendHandler = () => updateStatus()
  props.map.on('moveend', moveendHandler)
  updateStatus()
}

function unbindMapEvents() {
  if (props.map && moveendHandler) {
    props.map.un('moveend', moveendHandler)
    moveendHandler = null
  }
}

watch(
  () => props.map,
  (newMap, oldMap) => {
    if (oldMap) unbindMapEvents()
    if (newMap) bindMapEvents()
  },
  { immediate: true }
)

onMounted(() => { if (props.map) bindMapEvents() })
onUnmounted(() => { unbindMapEvents() })
</script>

<style scoped lang="scss">
.status-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 32px;
  padding: 0 16px;
  background-color: #255b9f;
  color: #ffffff;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  z-index: 1000;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.15);
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  .info-item {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .divider {
    color: rgba(255, 255, 255, 0.5);
    user-select: none;
  }

  .scale-wrap {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  // 比例尺图示：细线条 + 两端刻度 + 标签（标签在上，线条在下，互不干扰）
  .scale-bar {
    position: relative;
    width: 120px;
    height: 28px;

    .scale-bar-labels {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.9);
      line-height: 1;
    }

    .scale-bar-line {
      position: absolute;
      bottom: 2px;
      left: 0;
      right: 0;
      height: 2px;
      background: rgba(255, 255, 255, 0.9);

      // 两端刻度线（向上延伸）
      &::before,
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        width: 2px;
        height: 10px;
        background: rgba(255, 255, 255, 0.95);
      }
      &::before { left: 0; }
      &::after { right: 0; }
    }
  }
}
</style>
