<template>
  <aside class="viz-panel">
    <!-- 面板头部 -->
    <div class="panel-header">
      <div class="panel-title">
        <svg viewBox="0 0 16 16" width="16" height="16">
          <rect x="2" y="2" width="5" height="5" fill="#4096ff" opacity="0.9" />
          <rect x="8" y="2" width="5" height="5" fill="#7ddc5a" opacity="0.9" />
          <rect x="2" y="8" width="5" height="5" fill="#faad14" opacity="0.9" />
          <rect x="8" y="8" width="5" height="5" fill="#f5222d" opacity="0.9" />
        </svg>
        <span>空间可视化</span>
      </div>
      <div class="panel-toggle" title="关闭" @click="$emit('close')">
        <svg viewBox="0 0 12 12" width="12" height="12">
          <path
            d="M2 2 L10 10 M10 2 L2 10"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
        </svg>
      </div>
    </div>

    <!-- 图层类型 -->
    <div class="section">
      <div class="section-title">表达方式</div>
      <div class="type-buttons">
        <button
          class="type-btn"
          :class="{ 'is-active': vizType === 'heatmap' }"
          @click="vizType = 'heatmap'"
        >
          <svg viewBox="0 0 20 20" width="16" height="16">
            <circle cx="10" cy="10" r="8" fill="#f5222d" opacity="0.25" />
            <circle cx="10" cy="10" r="5" fill="#f5222d" opacity="0.5" />
            <circle cx="10" cy="10" r="2.5" fill="#f5222d" opacity="0.9" />
          </svg>
          <span>热力图</span>
        </button>
        <button
          class="type-btn"
          :class="{ 'is-active': vizType === 'density' }"
          @click="vizType = 'density'"
        >
          <svg viewBox="0 0 20 20" width="16" height="16">
            <rect x="2" y="10" width="7" height="7" fill="#fadb14" opacity="0.8" />
            <rect x="10" y="10" width="7" height="7" fill="#f5222d" opacity="0.8" />
            <rect x="2" y="2" width="7" height="7" fill="#7ddc5a" opacity="0.8" />
            <rect x="10" y="2" width="7" height="7" fill="#fa8c16" opacity="0.8" />
          </svg>
          <span>密度图</span>
        </button>
      </div>

      <!-- 半径参数 -->
      <div class="section-title">
        {{ vizType === 'heatmap' ? '热力半径（像素，1~50）' : '密度半径（米，100~10000）' }}
      </div>
      <el-input-number
        v-model="radius"
        :min="vizType === 'heatmap' ? 1 : 100"
        :max="vizType === 'heatmap' ? 50 : 10000"
        :step="vizType === 'heatmap' ? 1 : 100"
        size="small"
        class="radius-input"
      />
    </div>

    <!-- 生成图层 -->
    <button class="generate-btn" :disabled="generating" @click="generate">
      <template v-if="generating">生成中...</template>
      <template v-else>
        <svg viewBox="0 0 16 16" width="14" height="14">
          <path
            d="M8 2 L14 13 L2 13 Z"
            fill="none"
            stroke="currentColor"
            stroke-width="1.3"
            stroke-linejoin="round"
          />
        </svg>
        生成{{ vizType === 'heatmap' ? '热力图' : '密度图' }}
      </template>
    </button>

    <!-- 状态与清除 -->
    <div v-if="statusText" class="status-row">
      <span class="status-text">{{ statusText }}</span>
      <button class="clear-link" @click="clearViz">清除图层</button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, computed } from 'vue'
import type { Map } from 'ol'
import VectorSource from 'ol/source/Vector'
import VectorLayer from 'ol/layer/Vector'
import HeatmapLayer from 'ol/layer/Heatmap'
import Feature from 'ol/Feature'
import { Point as OlPoint, Polygon } from 'ol/geom'
import Style from 'ol/style/Style'
import { Fill, Stroke } from 'ol/style'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  map: Map | null
  toolbarActive?: string | null
}>()

const emit = defineEmits(['close'])

const HEATMAP_LAYER_NAME = 'poiHeatmapLayer'
const DENSITY_LAYER_NAME = 'poiDensityLayer'

// 表达方式：heatmap 热力图 / density 密度图
const vizType = ref<'heatmap' | 'density'>('heatmap')
// 热力半径（像素）/ 密度半径（米，作为格网边长），随类型切换共用一个输入框
const radius = ref(15)
const generating = ref(false)
const statusText = ref('')

// 全量坐标缓存：首次生成时拉取，之后调参重新生成无需再请求
let pointsCache: [number, number][] | null = null
let heatFeaturesCache: Feature<OlPoint>[] | null = null

let heatLayer: HeatmapLayer | null = null
let densityLayer: VectorLayer | null = null

const radiusLabel = computed(() =>
  vizType.value === 'heatmap' ? '热力半径（像素）' : '密度半径（米）'
)
void radiusLabel.value
// ==================== 数据加载 ====================

async function ensureData(): Promise<[number, number][]> {
  if (pointsCache) return pointsCache
  const res = await axios.get('/dev-api/poi/geoPoints')
  if (res.data.code !== 200) {
    throw new Error(res.data.msg || '获取 POI 坐标失败')
  }
  const fc = res.data.data.geojson
  pointsCache = (fc.features || [])
    .map((f: any) => f.geometry?.coordinates as [number, number])
    .filter((c: any) => Array.isArray(c) && c.length >= 2)
  return pointsCache
}

function getHeatFeatures(): Feature<OlPoint>[] {
  if (heatFeaturesCache) return heatFeaturesCache
  const features: Feature<OlPoint>[] = pointsCache!.map((coords) => {
    const f = new Feature(new OlPoint(coords))
    f.set('weight', 1)
    return f
  })
  heatFeaturesCache = features
  return features
}

// ==================== 图层清理 ====================

function clearVizLayers() {
  if (!props.map) return
  const layers = props.map.getLayers().getArray().slice()
  for (const layer of layers) {
    const name = layer.get && layer.get('layerName')
    if (name === HEATMAP_LAYER_NAME || name === DENSITY_LAYER_NAME) {
      props.map.removeLayer(layer)
    }
  }
  heatLayer = null
  densityLayer = null
}

function clearViz() {
  clearVizLayers()
  statusText.value = ''
}

// ==================== 热力图 ====================

function buildHeatmap() {
  if (!props.map) return
  const source = new VectorSource()
  source.addFeatures(getHeatFeatures() as any[])
  heatLayer = new HeatmapLayer({
    source,
    radius: radius.value,
    blur: Math.round(radius.value * 0.6),
    // 低密度透明、高密度暗红：色相冷→暖单向递进，越密集颜色越深
    gradient: [
      'rgba(0, 0, 255, 0)', // 极稀疏：完全透明
      'rgba(0, 120, 255, 0.35)', // 稀疏：淡蓝
      '#00c8ff', // 青
      '#00ff7f', // 绿
      '#fadb14', // 黄
      '#ff7a45', // 橙
      '#d4380d', // 红
      '#820014', // 最密：暗红
    ],
    weight: 'weight',
  })
  heatLayer.set('layerName', HEATMAP_LAYER_NAME)
  props.map.addLayer(heatLayer)

  // 生成后带过渡动画缩放到热力数据范围
  const extent = source.getExtent()
  if (extent) {
    props.map.getView().fit(extent, { padding: [60, 60, 60, 60], duration: 800 })
  }

  statusText.value = `热力图已生成（半径 ${radius.value}px，共 ${pointsCache!.length} 个 POI）`
}

// ==================== 密度图（网格点密度） ====================

// 顺序色带：浅黄（稀疏）→ 深红棕（密集），与热力图语义一致——颜色越深表示 POI 越多
const DENSITY_RAMP = [
  '#fff7bc',
  '#fee391',
  '#fec44f',
  '#fe9929',
  '#ec7014',
  '#cc4c02',
  '#8c2d04',
]

function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

// t ∈ [0,1]，沿色带线性插值
function rampColor(t: number): string {
  const pos = Math.min(1, Math.max(0, t)) * (DENSITY_RAMP.length - 1)
  const i = Math.floor(pos)
  const f = pos - i
  const a = hexToRgb(DENSITY_RAMP[i])
  const b = hexToRgb(DENSITY_RAMP[Math.min(i + 1, DENSITY_RAMP.length - 1)])
  const mix = (x: number, y: number) => Math.round(x + (y - x) * f)
  return `rgba(${mix(a[0], b[0])}, ${mix(a[1], b[1])}, ${mix(a[2], b[2])}, 0.8)`
}

// 按密度半径（米）划分格网，统计每格 POI 数量，渲染为按数量着色的网格多边形
function buildDensity() {
  if (!props.map) return

  // 米 → 度（纬向固定 111320m/deg，经向按视图中心纬度近似换算）
  const view = props.map.getView()
  const center = view.getCenter() || [108, 26.5]
  const midLat = center[1]
  const metersPerDegLat = 111320
  const metersPerDegLon = 111320 * Math.cos((midLat * Math.PI) / 180)
  const cellLat = radius.value / metersPerDegLat
  const cellLon = radius.value / metersPerDegLon

  const counts = new Map<string, { ix: number; iy: number; n: number }>()
  for (const [lon, lat] of pointsCache!) {
    const ix = Math.floor(lon / cellLon)
    const iy = Math.floor(lat / cellLat)
    const key = `${ix}_${iy}`
    const cell = counts.get(key)
    if (cell) cell.n++
    else counts.set(key, { ix, iy, n: 1 })
  }

  if (counts.size === 0) {
    statusText.value = '没有可统计的 POI 数据'
    return
  }

  let maxCount = 1
  const features: Feature<Polygon>[] = []
  for (const { ix, iy, n } of counts.values()) {
    if (n > maxCount) maxCount = n
    const x0 = ix * cellLon
    const y0 = iy * cellLat
    const ring = [
      [x0, y0],
      [x0 + cellLon, y0],
      [x0 + cellLon, y0 + cellLat],
      [x0, y0 + cellLat],
      [x0, y0],
    ]
    const f = new Feature(new Polygon([ring]))
    f.set('count', n)
    features.push(f)
  }

  // 按数量占最大值的比例取色：数量越多，颜色越深
  const styleFn = (feature: any) => {
    const n = feature.get('count') || 1
    const t = Math.min(1, n / maxCount)
    return new Style({
      fill: new Fill({ color: rampColor(t) }),
      stroke: new Stroke({ color: 'rgba(255, 255, 255, 0.25)', width: 1 }),
    })
  }

  const source = new VectorSource()
  source.addFeatures(features as any[])
  densityLayer = new VectorLayer({
    source,
    style: styleFn as any,
  })
  densityLayer.set('layerName', DENSITY_LAYER_NAME)
  props.map.addLayer(densityLayer)

  // 缩放到有数据的格网范围（带过渡动画，与热力图一致）
  const extent = source.getExtent()
  if (extent) {
    props.map.getView().fit(extent, { padding: [60, 60, 60, 60], duration: 800 })
  }

  statusText.value = `密度图已生成（格网边长 ${radius.value} 米，${counts.size} 个网格，单格最多 ${maxCount} 个 POI）`
}

// ==================== 分析按钮 ====================

async function generate() {
  if (!props.map) return
  generating.value = true
  try {
    await ensureData()
    clearVizLayers()
    if (vizType.value === 'heatmap') {
      buildHeatmap()
    } else {
      buildDensity()
    }
  } catch (e: any) {
    ElMessage.error('生成失败：' + (e?.message || e))
  } finally {
    generating.value = false
  }
}

// ==================== 生命周期 ====================

function cleanup() {
  clearVizLayers()
  statusText.value = ''
}

onBeforeUnmount(cleanup)

defineExpose({ cleanup })
</script>

<style scoped lang="scss">
$panel-bg: #255b9f;

.viz-panel {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 350px;
  background-color: $panel-bg;
  border-right: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 900;
  box-shadow: 4px 0 16px rgba(0, 0, 0, 0.3);
  color: #ffffff;
}

.panel-header {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  flex-shrink: 0;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
}

.panel-toggle {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.6);
  border-radius: 4px;
  transition: all 0.2s;
  flex-shrink: 0;
  &:hover {
    background: rgba(245, 34, 45, 0.2);
    color: #ffcccc;
  }
}

.section {
  padding: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.section-title {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 10px;
}

.type-buttons {
  display: flex;
  gap: 10px;
}

.type-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 0;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;

  &:hover {
    background: rgba(255, 255, 255, 0.14);
    border-color: rgba(255, 255, 255, 0.4);
  }

  &.is-active {
    background: rgba(64, 150, 255, 0.3);
    border-color: #4096ff;
    color: #ffffff;
    box-shadow:
      0 0 0 1px #4096ff inset,
      0 0 8px rgba(64, 150, 255, 0.35);
  }
}

.radius-input {
  width: 100%;
}

.generate-btn {
  margin: 14px;
  height: 38px;
  border: none;
  border-radius: 6px;
  background: linear-gradient(135deg, #1677ff, #4096ff);
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #4096ff, #69b1ff);
    box-shadow: 0 4px 12px rgba(64, 150, 255, 0.4);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 14px 12px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
}

.status-text {
  flex: 1;
  line-height: 1.5;
}

.clear-link {
  background: none;
  border: none;
  color: #69b1ff;
  font-size: 11px;
  cursor: pointer;
  padding: 2px 4px;
  flex-shrink: 0;
  &:hover {
    text-decoration: underline;
    color: #ffffff;
  }
}
</style>
