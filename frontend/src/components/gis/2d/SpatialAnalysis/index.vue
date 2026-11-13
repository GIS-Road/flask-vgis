<template>
  <aside class="analysis-panel">
    <!-- 面板头部 -->
    <div class="panel-header">
      <div class="panel-title">
        <svg viewBox="0 0 16 16" width="16" height="16">
          <circle cx="8" cy="8" r="6" fill="none" stroke="#4096FF" stroke-width="1.2" />
          <circle cx="8" cy="8" r="2.5" fill="none" stroke="#4096FF" stroke-width="1.2" />
          <circle cx="8" cy="8" r="0.8" fill="#4096FF" />
        </svg>
        <span>缓冲区分析</span>
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

    <!-- 几何选择 -->
    <div class="section">
      <div class="section-title">绘制分析要素</div>
      <div class="geom-buttons">
        <button
          class="geom-btn"
          :class="{ 'is-active': activeGeom === 'point' }"
          @click="startDraw('point')"
        >
          <svg viewBox="0 0 20 20" width="16" height="16">
            <circle cx="10" cy="10" r="3" fill="currentColor" />
          </svg>
          <span>点</span>
        </button>
        <button
          class="geom-btn"
          :class="{ 'is-active': activeGeom === 'line' }"
          @click="startDraw('line')"
        >
          <svg viewBox="0 0 20 20" width="16" height="16">
            <path
              d="M3 15 L8 6 L13 12 L17 4"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span>线</span>
        </button>
        <button
          class="geom-btn"
          :class="{ 'is-active': activeGeom === 'polygon' }"
          @click="startDraw('polygon')"
        >
          <svg viewBox="0 0 20 20" width="16" height="16">
            <path
              d="M10 3 L17 8 L14 16 L6 16 L3 8 Z"
              fill="none"
              stroke="currentColor"
              stroke-width="1.3"
              stroke-linejoin="round"
            />
          </svg>
          <span>面</span>
        </button>
      </div>

      <!-- 缓冲距离 -->
      <div class="section-title">缓冲距离（米）</div>
      <el-input-number
        v-model="bufferDistance"
        :min="1"
        :max="20000"
        :step="100"
        size="small"
        class="distance-input"
      />

      <!-- 当前状态提示 -->
      <div v-if="activeGeom" class="draw-hint">
        <svg viewBox="0 0 12 12" width="12" height="12">
          <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" stroke-width="1.2" />
          <line
            x1="6"
            y1="3"
            x2="6"
            y2="6"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linecap="round"
          />
          <circle cx="6" cy="9" r="0.8" fill="currentColor" />
        </svg>
        <span v-if="activeGeom === 'point'">在地图上点击选取点位</span>
        <span v-else-if="activeGeom === 'line'">在地图上点击绘制，双击结束</span>
        <span v-else>在地图上点击绘制，双击结束</span>
      </div>
    </div>

    <!-- 执行分析按钮 -->
    <button class="analysis-btn" :disabled="!drawnGeom || analyzing" @click="runAnalysis">
      <template v-if="analyzing">分析中...</template>
      <template v-else>
        <svg viewBox="0 0 16 16" width="14" height="14">
          <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" stroke-width="1.3" />
          <line
            x1="11"
            y1="11"
            x2="14.5"
            y2="14.5"
            stroke="currentColor"
            stroke-width="1.3"
            stroke-linecap="round"
          />
        </svg>
        生成缓冲并查询 POI
      </template>
    </button>

    <!-- 清除范围 -->
    <div v-if="drawnGeom" class="clear-row">
      <span class="clear-hint">已绘制要素（{{ drawnGeomType }}）</span>
      <button class="clear-link" @click="clearDrawn">清除要素</button>
    </div>

    <!-- 分析结果 -->
    <div v-if="total > 0" class="result-section">
      <div class="result-header">
        <span>缓冲范围内 POI（共 {{ total }} 条）</span>
        <button class="clear-link" @click="clearResults">清空</button>
      </div>
      <ul class="result-list">
        <li v-for="item in results" :key="item.ogc_fid" class="result-item" @click="focusPoi(item)">
          <span class="poi-name">{{ item.name }}</span>
        </li>
      </ul>
      <div v-if="totalPages > 1" class="pagination">
        <button class="page-btn" :disabled="page <= 1 || analyzing" @click="fetchResults(page - 1)">
          上一页
        </button>
        <span class="page-info">{{ page }} / {{ totalPages }}</span>
        <button
          class="page-btn"
          :disabled="page >= totalPages || analyzing"
          @click="fetchResults(page + 1)"
        >
          下一页
        </button>
      </div>
    </div>
    <div v-else-if="analyzed && !analyzing" class="empty-result">缓冲范围内未找到 POI</div>
  </aside>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import type { Map } from 'ol'
import Draw from 'ol/interaction/Draw'
import DoubleClickZoom from 'ol/interaction/DoubleClickZoom'
import VectorSource from 'ol/source/Vector'
import VectorLayer from 'ol/layer/Vector'
import GeoJSON from 'ol/format/GeoJSON'
import { Point as OlPoint } from 'ol/geom'
import type { LineString, Polygon } from 'ol/geom'
import Style from 'ol/style/Style'
import { Fill, Stroke, Circle as CircleStyle } from 'ol/style'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import {
  createPulseEffect,
  poiPopupColumns,
  removeOverlayByName,
  setPopup,
  stopPulseEffect,
} from '@/utils/openLayers/olTools'

interface PoiItem {
  ogc_fid: number
  name: string
  geom_json: any
}

const props = defineProps<{
  map: Map | null
  toolbarActive?: string | null
}>()

const emit = defineEmits(['close'])

const DRAW_LAYER_NAME = 'bufferDrawLayer'
const BUFFER_LAYER_NAME = 'bufferLayer'
const RESULT_LAYER_NAME = 'bufferResultLayer'

const PAGE_SIZE = 10
// 缓冲距离（米），与后端上限保持一致
const bufferDistance = ref(500)

const activeGeom = ref<'point' | 'line' | 'polygon' | null>(null)
const drawnGeom = ref<OlPoint | LineString | Polygon | null>(null)
const drawnGeomType = ref('')
const analyzing = ref(false)
const analyzed = ref(false)
const results = ref<PoiItem[]>([])
const page = ref(1)
const total = ref(0)
const totalPages = ref(0)

let drawInteraction: Draw | null = null
let drawSource: VectorSource | null = null
let drawLayer: VectorLayer | null = null
let bufferLayer: VectorLayer | null = null
let resultSource: VectorSource | null = null
let resultLayer: VectorLayer | null = null
let dblClickZoomRestoreTimer: number | null = null

// ==================== 双击缩放禁用（防止结束绘制时放大地图） ====================

function setDblClickZoom(active: boolean) {
  if (!props.map) return
  props.map.getInteractions().forEach((int) => {
    if (int instanceof DoubleClickZoom) int.setActive(active)
  })
}

function disableDblClickZoom() {
  if (dblClickZoomRestoreTimer !== null) {
    clearTimeout(dblClickZoomRestoreTimer)
    dblClickZoomRestoreTimer = null
  }
  setDblClickZoom(false)
}

function restoreDblClickZoom() {
  // 延迟恢复：等结束绘制产生的 dblclick 派发完成；期间若又开始绘制则不恢复
  if (dblClickZoomRestoreTimer !== null) clearTimeout(dblClickZoomRestoreTimer)
  dblClickZoomRestoreTimer = window.setTimeout(() => {
    dblClickZoomRestoreTimer = null
    if (!drawInteraction) setDblClickZoom(true)
  }, 200)
}

// ==================== Draw 交互 ====================

function startDraw(type: 'point' | 'line' | 'polygon') {
  if (!props.map) return

  stopDraw()
  clearDrawLayer()

  // 绘制期间禁用双击缩放
  disableDblClickZoom()

  activeGeom.value = type

  drawSource = new VectorSource()
  drawLayer = new VectorLayer({
    source: drawSource,
    style: new Style({
      fill: new Fill({ color: 'rgba(250, 173, 20, 0.2)' }),
      stroke: new Stroke({ color: '#faad14', width: 2 }),
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({ color: '#faad14' }),
        stroke: new Stroke({ color: '#ffffff', width: 2 }),
      }),
    }),
  })
  drawLayer.set('layerName', DRAW_LAYER_NAME)
  props.map.addLayer(drawLayer)

  const drawType = type === 'point' ? 'Point' : type === 'line' ? 'LineString' : 'Polygon'
  drawInteraction = new Draw({
    source: drawSource,
    type: drawType,
    style: new Style({
      fill: new Fill({ color: 'rgba(250, 173, 20, 0.2)' }),
      stroke: new Stroke({ color: '#ffc53d', width: 2, lineDash: [4, 3] }),
      image: new CircleStyle({
        radius: 5,
        fill: new Fill({ color: '#ffc53d' }),
        stroke: new Stroke({ color: '#ffffff', width: 2 }),
      }),
    }),
  })
  drawInteraction.set('component', 'bufferDraw')
  props.map.addInteraction(drawInteraction)

  drawInteraction.on('drawend', (evt) => {
    const geom = evt.feature.getGeometry()
    if (!geom) return
    drawnGeom.value = geom as OlPoint | LineString | Polygon
    drawnGeomType.value = type === 'point' ? '点' : type === 'line' ? '线' : '面'
    activeGeom.value = null
    stopDraw()
  })
}

function stopDraw() {
  if (!props.map) return
  const interactions = props.map.getInteractions().getArray().slice()
  for (const int of interactions) {
    if (int.get && int.get('component') === 'bufferDraw') {
      props.map.removeInteraction(int)
    }
  }
  drawInteraction = null
  activeGeom.value = null
  // 延迟恢复双击缩放
  restoreDblClickZoom()
}

function clearDrawLayer() {
  if (!props.map) return
  const layers = props.map.getLayers().getArray().slice()
  for (const layer of layers) {
    if (layer.get && layer.get('layerName') === DRAW_LAYER_NAME) {
      props.map.removeLayer(layer)
    }
  }
  drawLayer = null
  drawSource = null
}

function clearDrawn() {
  stopDraw()
  clearDrawLayer()
  drawnGeom.value = null
}

function clearBufferLayer() {
  if (!props.map) return
  const layers = props.map.getLayers().getArray().slice()
  for (const layer of layers) {
    if (layer.get && layer.get('layerName') === BUFFER_LAYER_NAME) {
      props.map.removeLayer(layer)
    }
  }
  bufferLayer = null
}

function clearResultLayer() {
  if (!props.map) return
  const layers = props.map.getLayers().getArray().slice()
  for (const layer of layers) {
    if (layer.get && layer.get('layerName') === RESULT_LAYER_NAME) {
      props.map.removeLayer(layer)
    }
  }
  resultLayer = null
  resultSource = null
}

// ==================== 缓冲分析 ====================

// 把绘制要素转成 4326 的 GeoJSON（后端按 4326 接收，内部转 3857 做米制缓冲）
function toGeoJson() {
  if (!props.map || !drawnGeom.value) return null
  const geom4326 = drawnGeom.value.clone()
  geom4326.transform(props.map.getView().getProjection(), 'EPSG:4326')
  return new GeoJSON().writeGeometryObject(geom4326)
}

// 生成缓冲并查询（重新从第 1 页开始）
async function runAnalysis() {
  if (!drawnGeom.value) return

  analyzing.value = true
  analyzed.value = true

  try {
    const geometry = toGeoJson()
    if (!geometry) return

    const res = await axios.post('/dev-api/poi/bufferQuery', {
      geometry,
      distance: bufferDistance.value,
      page: 1,
      size: PAGE_SIZE,
    })
    if (res.data.code !== 200) {
      analyzed.value = false
      ElMessage.error(res.data.msg || '缓冲分析失败')
      return
    }

    const data = res.data.data || {}
    results.value = data.rows || []
    total.value = data.total || 0
    page.value = data.pagination?.page || 1
    totalPages.value = data.pagination?.total_pages || 0

    // 渲染缓冲图形，并把地图缩放到缓冲范围
    renderBufferLayer(data.buffer)
    renderResultLayer(results.value)

    if (total.value === 0) {
      ElMessage.info(`缓冲 ${bufferDistance.value} 米范围内未找到 POI`)
    } else {
      ElMessage.success(`缓冲范围内找到 ${total.value} 个 POI`)
    }
  } catch (e: any) {
    analyzed.value = false
    ElMessage.error('分析异常：' + (e?.message || e))
  } finally {
    analyzing.value = false
  }
}

// 翻页：复用同一缓冲几何，仅拉取指定页结果
async function fetchResults(targetPage: number) {
  if (!drawnGeom.value) return

  analyzing.value = true

  try {
    const geometry = toGeoJson()
    if (!geometry) return

    const res = await axios.post('/dev-api/poi/bufferQuery', {
      geometry,
      distance: bufferDistance.value,
      page: targetPage,
      size: PAGE_SIZE,
    })
    if (res.data.code !== 200) {
      ElMessage.error(res.data.msg || '查询失败')
      return
    }

    const data = res.data.data || {}
    results.value = data.rows || []
    total.value = data.total || 0
    page.value = data.pagination?.page || targetPage
    totalPages.value = data.pagination?.total_pages || 0

    // 翻页只刷新结果点，不重建缓冲图形，地图不跳动
    renderResultLayer(results.value)
  } catch (e: any) {
    ElMessage.error('查询异常：' + (e?.message || e))
  } finally {
    analyzing.value = false
  }
}

function renderBufferLayer(bufferGeoJson: any) {
  if (!props.map) return
  clearBufferLayer()
  if (!bufferGeoJson) return

  const source = new VectorSource()
  source.addFeatures(
    new GeoJSON().readFeatures(bufferGeoJson, {
      featureProjection: props.map.getView().getProjection(),
    })
  )
  bufferLayer = new VectorLayer({
    source,
    style: new Style({
      fill: new Fill({ color: 'rgba(250, 173, 20, 0.18)' }),
      stroke: new Stroke({ color: '#faad14', width: 1.5, lineDash: [6, 4] }),
    }),
  })
  bufferLayer.set('layerName', BUFFER_LAYER_NAME)
  props.map.addLayer(bufferLayer)

  // 缩放到缓冲图形范围（略大于绘制要素，能看到完整缓冲带）
  const extent = source.getExtent()
  if (extent) {
    props.map.getView().fit(extent, { padding: [60, 60, 60, 60], maxZoom: 15 })
  }
}

function renderResultLayer(list: PoiItem[]) {
  if (!props.map) return
  clearResultLayer()
  resultSource = new VectorSource()
  const features = list
    .map((poi) => {
      try {
        const gj = typeof poi.geom_json === 'string' ? JSON.parse(poi.geom_json) : poi.geom_json
        if (!gj) return null
        return new GeoJSON().readFeature(gj, {
          featureProjection: props.map.getView().getProjection(),
        })
      } catch {
        return null
      }
    })
    .filter(Boolean) as any[]

  resultSource.addFeatures(features)
  resultLayer = new VectorLayer({
    source: resultSource,
    style: new Style({
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({ color: '#ff7a45' }),
        stroke: new Stroke({ color: '#ffffff', width: 2 }),
      }),
    }),
  })
  resultLayer.set('layerName', RESULT_LAYER_NAME)
  props.map.addLayer(resultLayer)
}

function focusPoi(poi: PoiItem) {
  if (!props.map) return
  const gj = typeof poi.geom_json === 'string' ? JSON.parse(poi.geom_json) : poi.geom_json
  if (!gj?.coordinates) return
  const coords = gj.coordinates

  createPulseEffect(props.map, coords)
  props.map.getView().animate({ center: coords, zoom: 16, duration: 500 })
  setPopup(poi, poiPopupColumns, new OlPoint(coords), props.map)
}

function clearResults() {
  results.value = []
  total.value = 0
  page.value = 1
  totalPages.value = 0
  analyzed.value = false
  clearResultLayer()
  clearBufferLayer()
  if (props.map) {
    removeOverlayByName('overLay', props.map)
    stopPulseEffect(props.map)
  }
}

// ==================== toolbarActive 互斥 ====================

watch(
  () => props.toolbarActive,
  (tb) => {
    if (tb && drawInteraction) {
      drawInteraction.setActive(false)
    } else if (!tb && drawInteraction && activeGeom.value) {
      drawInteraction.setActive(true)
    }
  }
)

// ==================== 生命周期 ====================

function cleanup() {
  stopDraw()
  clearDrawLayer()
  clearResultLayer()
  clearBufferLayer()
  results.value = []
  total.value = 0
  page.value = 1
  totalPages.value = 0
  analyzed.value = false
  drawnGeom.value = null
  if (props.map) {
    removeOverlayByName('overLay', props.map)
    stopPulseEffect(props.map)
  }
}

onBeforeUnmount(cleanup)

defineExpose({ cleanup })
</script>

<style scoped lang="scss">
$analysis-panel-bg: #255b9f;

.analysis-panel {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 350px;
  background-color: $analysis-panel-bg;
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

.geom-buttons {
  display: flex;
  gap: 10px;
}

.geom-btn {
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
    background: rgba(250, 173, 20, 0.25);
    border-color: #faad14;
    color: #ffc53d;
    box-shadow:
      0 0 0 1px #faad14 inset,
      0 0 8px rgba(250, 173, 20, 0.3);
  }
}

.distance-input {
  width: 100%;
}

.draw-hint {
  margin-top: 10px;
  padding: 6px 8px;
  background: rgba(250, 173, 20, 0.15);
  border: 1px solid rgba(250, 173, 20, 0.4);
  border-radius: 4px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  gap: 6px;
}

.analysis-btn {
  margin: 14px;
  height: 38px;
  border: none;
  border-radius: 6px;
  background: linear-gradient(135deg, #faad14, #ffc53d);
  color: #212121;
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
    filter: brightness(110%);
    box-shadow: 0 4px 12px rgba(250, 173, 20, 0.4);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.clear-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 14px 10px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}

.clear-link {
  background: none;
  border: none;
  color: #69b1ff;
  font-size: 11px;
  cursor: pointer;
  padding: 2px 4px;
  &:hover {
    text-decoration: underline;
    color: #ffffff;
  }
}

.result-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.result-list {
  flex: 1;
  overflow-y: auto;
  list-style: none;
  padding: 4px 8px;
  margin: 0;
}

.result-item {
  padding: 7px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  transition: background 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
  }

  .poi-name {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.page-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 11px;
  padding: 4px 10px;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s;

  &:hover:not(:disabled) {
    background: rgba(250, 173, 20, 0.25);
    border-color: #faad14;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.page-info {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.65);
}

.empty-result {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}
</style>
