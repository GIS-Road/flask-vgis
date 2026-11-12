<template>
  <aside class="query-panel">
    <!-- 面板头部 -->
    <div class="panel-header">
      <div class="panel-title">
        <svg viewBox="0 0 16 16" width="16" height="16">
          <circle
            cx="8"
            cy="8"
            r="6"
            fill="none"
            stroke="#4096FF"
            stroke-width="1.2"
            stroke-dasharray="2 1.5"
          />
          <circle cx="8" cy="8" r="2" fill="#4096FF" />
        </svg>
        <span>空间查询</span>
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
      <div class="section-title">绘制查询范围</div>
      <div class="geom-buttons">
        <button
          class="geom-btn"
          :class="{ 'is-active': activeGeom === 'polygon' }"
          @click="startDraw('polygon')"
        >
          <svg viewBox="0 0 20 20" width="16" height="16">
            <path
              d="M10 2 L18 8 L15 18 L5 18 L2 8 Z"
              fill="none"
              stroke="currentColor"
              stroke-width="1.3"
              stroke-linejoin="round"
            />
          </svg>
          <span>多边形</span>
        </button>
        <button
          class="geom-btn"
          :class="{ 'is-active': activeGeom === 'rectangle' }"
          @click="startDraw('rectangle')"
        >
          <svg viewBox="0 0 20 20" width="16" height="16">
            <rect
              x="3"
              y="5"
              width="14"
              height="10"
              rx="1"
              fill="none"
              stroke="currentColor"
              stroke-width="1.3"
            />
          </svg>
          <span>矩形</span>
        </button>
      </div>

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
        <span v-if="activeGeom === 'polygon'">在地图上点击绘制，双击结束</span>
        <span v-else>在地图上按住拖拽，松开结束</span>
      </div>
    </div>

    <!-- 查询按钮 -->
    <button class="query-btn" :disabled="!drawnGeom || querying" @click="runQuery">
      <template v-if="querying">查询中...</template>
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
        查询范围 POI
      </template>
    </button>

    <!-- 清除范围 -->
    <div v-if="drawnGeom" class="clear-row">
      <span class="clear-hint">已绘制查询范围（{{ drawnGeomType }}）</span>
      <button class="clear-link" @click="clearDrawn">清除范围</button>
    </div>

    <!-- 查询结果 -->
    <div v-if="total > 0" class="result-section">
      <div class="result-header">
        <span>查询结果（共 {{ total }} 条）</span>
        <button class="clear-link" @click="clearResults">清空</button>
      </div>
      <ul class="result-list">
        <li v-for="item in results" :key="item.ogc_fid" class="result-item" @click="focusPoi(item)">
          <span class="poi-name">{{ item.name }}</span>
        </li>
      </ul>
      <div v-if="totalPages > 1" class="pagination">
        <button class="page-btn" :disabled="page <= 1 || querying" @click="fetchResults(page - 1)">
          上一页
        </button>
        <span class="page-info">{{ page }} / {{ totalPages }}</span>
        <button
          class="page-btn"
          :disabled="page >= totalPages || querying"
          @click="fetchResults(page + 1)"
        >
          下一页
        </button>
      </div>
    </div>
    <div v-else-if="queried && !querying" class="empty-result">未找到范围内 POI</div>
  </aside>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import type { Map } from 'ol'
import Draw, { createBox } from 'ol/interaction/Draw'
import DoubleClickZoom from 'ol/interaction/DoubleClickZoom'
import VectorSource from 'ol/source/Vector'
import VectorLayer from 'ol/layer/Vector'
import GeoJSON from 'ol/format/GeoJSON'
import { Point, Polygon } from 'ol/geom'
import Style from 'ol/style/Style'
import { Fill, Stroke, Circle as CircleStyle } from 'ol/style'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import {
  createPulseEffect,
  poiPopupColumns,
  removeOverlayByName,
  setPopup,
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

const LAYER_NAME = 'spatialQueryLayer'

const activeGeom = ref<'polygon' | 'rectangle' | null>(null)
const drawnGeom = ref<Polygon | null>(null)
const drawnGeomType = ref('')
const querying = ref(false)
const queried = ref(false)
const results = ref<PoiItem[]>([])

// 结果分页（后端 /poi/spatialQuery 已支持 page/size/total_pages）
const PAGE_SIZE = 10
const page = ref(1)
const total = ref(0)
const totalPages = ref(0)

let drawInteraction: Draw | null = null
let drawSource: VectorSource | null = null
let drawLayer: VectorLayer | null = null
let resultSource: VectorSource | null = null
let resultLayer: VectorLayer | null = null
let dblClickZoomRestoreTimer: number | null = null

// 绘制期间禁用双击缩放：多边形在第二次 pointerup 就结束，随后浏览器才派发 dblclick，
// 若此时双击缩放仍激活，会触发地图放大。OL 事件按"后注册先处理"分发，
// DoubleClickZoom 在 Draw 之前收到 dblclick，所以必须提前禁用。
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

function startDraw(type: 'polygon' | 'rectangle') {
  if (!props.map) return

  // 清理所有 spatialQuery 相关的旧交互和图层（遍历式，防累积）
  stopDraw()
  clearDrawLayer()

  // 绘制期间禁用双击缩放，避免结束绘制时地图放大
  disableDblClickZoom()

  activeGeom.value = type

  drawSource = new VectorSource()
  drawLayer = new VectorLayer({
    source: drawSource,
    style: new Style({
      fill: new Fill({ color: 'rgba(64, 150, 255, 0.25)' }),
      stroke: new Stroke({ color: '#4096FF', width: 2 }),
    }),
  })
  drawLayer.set('layerName', LAYER_NAME)
  props.map.addLayer(drawLayer)

  const drawOpts: any = {
    source: drawSource,
    style: new Style({
      fill: new Fill({ color: 'rgba(64, 150, 255, 0.2)' }),
      stroke: new Stroke({ color: '#69b1ff', width: 2, lineDash: [4, 3] }),
    }),
  }
  if (type === 'polygon') {
    drawOpts.type = 'Polygon'
  } else {
    // 矩形：Circle 模式拖拽绘制，createBox 把起止两点转成外接矩形 Polygon
    // 注意：Circle 模式下 geometryFunction 收到的是坐标数组 [[起点],[终点]]，不是 Circle 几何
    drawOpts.type = 'Circle'
    drawOpts.geometryFunction = createBox()
  }

  drawInteraction = new Draw(drawOpts)
  drawInteraction.set('component', 'spatialQuery')
  props.map.addInteraction(drawInteraction)

  drawInteraction.on('drawend', (evt) => {
    const geom = evt.feature.getGeometry()
    if (!geom) return
    if (type === 'polygon') {
      drawnGeom.value = geom as Polygon
    } else {
      // geometryFunction 已经把 Circle 转成 extent Polygon 了
      drawnGeom.value = geom as Polygon
    }
    drawnGeomType.value = type === 'polygon' ? '多边形' : '矩形'
    activeGeom.value = null
    stopDraw()
  })
}

function stopDraw() {
  if (!props.map) return
  // 遍历移除所有带 component='spatialQuery' 的交互
  const interactions = props.map.getInteractions().getArray().slice()
  let removed = false
  for (const int of interactions) {
    if (int.get && int.get('component') === 'spatialQuery') {
      props.map.removeInteraction(int)
      removed = true
    }
  }
  drawInteraction = null
  activeGeom.value = null
  // 延迟恢复双击缩放，避免结束绘制的双击放大地图
  restoreDblClickZoom()
}

function clearDrawLayer() {
  if (!props.map) return
  // 遍历移除所有带 spatialQueryLayer 的图层
  const layers = props.map.getLayers().getArray().slice()
  for (const layer of layers) {
    if (layer.get && layer.get('layerName') === LAYER_NAME) {
      props.map.removeLayer(layer)
    }
  }
  drawLayer = null
  drawSource = null
}

function clearResultLayer() {
  if (!props.map) return
  const layers = props.map.getLayers().getArray().slice()
  for (const layer of layers) {
    if (layer.get && layer.get('layerName') === 'spatialQueryResultLayer') {
      props.map.removeLayer(layer)
    }
  }
  resultLayer = null
  resultSource = null
}

// ==================== 查询 ====================

// 重新从第 1 页查询（绘制范围变化后调用）
async function runQuery() {
  if (!drawnGeom.value) return

  // 查询时先把地图缩放到绘制的多边形范围
  if (props.map) {
    const extent = drawnGeom.value.getExtent()
    if (extent) {
      props.map.getView().fit(extent, { padding: [60, 60, 60, 60], maxZoom: 15 })
    }
  }

  await fetchResults(1)
}

// 分页拉取范围内 POI；页码变化时复用同一个绘制范围
async function fetchResults(targetPage: number) {
  if (!props.map || !drawnGeom.value) return
  querying.value = true
  queried.value = true

  try {
    // 把绘制的范围投影到 4326，组装成后端需要的 GeoJSON 几何
    const geom4326 = drawnGeom.value.clone()
    geom4326.transform(props.map.getView().getProjection(), 'EPSG:4326')
    const geometry = {
      type: 'Polygon',
      coordinates: geom4326.getCoordinates(),
    }

    const res = await axios.post('/dev-api/poi/spatialQuery', {
      geometry,
      page: targetPage,
      size: PAGE_SIZE,
    })
    if (res.data.code !== 200) {
      queried.value = false
      ElMessage.error(res.data.msg || '查询失败')
      return
    }

    const data = res.data.data || {}
    const matched: PoiItem[] = data.rows || []
    const pagination = data.pagination || {}

    results.value = matched
    total.value = data.total || 0
    page.value = pagination.page || targetPage
    totalPages.value = pagination.total_pages || 0

    // 结果点位只渲染当前页；地图缩放由 runQuery 按绘制范围执行，翻页不跳动
    renderResultLayer(matched)

    if (targetPage === 1) {
      if (total.value === 0) {
        ElMessage.info('范围内未找到 POI')
      } else {
        ElMessage.success(`找到 ${total.value} 个 POI`)
      }
    }
  } catch (e: any) {
    queried.value = false
    ElMessage.error('查询异常：' + (e?.message || e))
  } finally {
    querying.value = false
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
        // 后端返回的坐标如果是 Web Mercator 需转换（当前项目是 EPSG:4326，直接用）
        return new GeoJSON().readFeature(gj, {
          featureProjection: props.map!.getView().getProjection(),
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
  resultLayer.set('layerName', 'spatialQueryResultLayer')
  props.map.addLayer(resultLayer)
}

function focusPoi(poi: PoiItem) {
  if (!props.map) return
  const gj = typeof poi.geom_json === 'string' ? JSON.parse(poi.geom_json) : poi.geom_json
  if (!gj?.coordinates) return
  const coords = gj.coordinates

  createPulseEffect(props.map, coords)
  props.map.getView().animate({ center: coords, zoom: 16, duration: 500 })
  // 弹出 POI 详细信息（geom_json 坐标即视图投影 4326 下的经纬度）
  setPopup(poi, poiPopupColumns, new Point(coords), props.map)
}

function clearDrawn() {
  stopDraw()
  clearDrawLayer()
  drawnGeom.value = null
}

function clearResults() {
  results.value = []
  total.value = 0
  page.value = 1
  totalPages.value = 0
  queried.value = false
  clearResultLayer()
  if (props.map) removeOverlayByName('overLay', props.map)
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
  results.value = []
  total.value = 0
  page.value = 1
  totalPages.value = 0
  queried.value = false
  drawnGeom.value = null
}

onBeforeUnmount(cleanup)

// 面板关闭时需要清理（父组件 v-if 切换会触发 onBeforeUnmount，这里保留 expose 供手动调用）
defineExpose({ cleanup })
</script>

<style scoped lang="scss">
$query-panel-bg: #255b9f;

.query-panel {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 350px;
  background-color: $query-panel-bg;
  border-right: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 900;
  box-shadow: 4px 0 16px rgba(0, 0, 0, 0.3);
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
    background: rgba(64, 150, 255, 0.3);
    border-color: #4096ff;
    color: #ffffff;
    box-shadow:
      0 0 0 1px #4096ff inset,
      0 0 8px rgba(64, 150, 255, 0.35);
  }
}

.draw-hint {
  margin-top: 10px;
  padding: 6px 8px;
  background: rgba(64, 150, 255, 0.15);
  border: 1px solid rgba(64, 150, 255, 0.4);
  border-radius: 4px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  gap: 6px;
}

.query-btn {
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
    background: rgba(64, 150, 255, 0.35);
    border-color: #4096ff;
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
