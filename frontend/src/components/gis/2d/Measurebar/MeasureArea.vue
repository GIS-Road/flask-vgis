<template>
  <!-- 无界面组件：仅负责在图上绘制与标注 -->
  <span style="display: none"></span>
</template>

<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue'
import type { Map } from 'ol'
import Draw from 'ol/interaction/Draw'
import VectorSource from 'ol/source/Vector'
import VectorLayer from 'ol/layer/Vector'
import Overlay from 'ol/Overlay'
import { Polygon } from 'ol/geom'
import { getArea } from 'ol/sphere'
import Style from 'ol/style/Style'
import { Fill, Stroke } from 'ol/style'

const props = defineProps<{
  map: Map | null
  active: boolean
  clearTick?: number
  toolbarActive?: string | null
}>()

const MEASURE_LAYER_NAME = 'measureAreaLayer'

let drawInteraction: Draw | null = null
let measureSource: VectorSource | null = null
let measureLayer: VectorLayer | null = null

// 面积格式化：自动选择 m² / km² / 公顷
function formatArea(sqMeters: number): string {
  if (sqMeters >= 1_000_000) {
    return (sqMeters / 1_000_000).toFixed(2) + ' km²'
  } else if (sqMeters >= 10_000) {
    return (sqMeters / 10_000).toFixed(2) + ' 公顷'
  }
  return sqMeters.toFixed(2) + ' m²'
}

// 创建面积标签 Overlay
function createAreaOverlay(polygon: Polygon, areaText: string): Overlay {
  const center = polygon.getInteriorPoint().getCoordinates()
  const el = document.createElement('div')
  el.className = 'measure-label'
  el.innerHTML = `面积: <b>${areaText}</b>`

  const overlay = new Overlay({
    element: el,
    positioning: 'bottom-center',
    offset: [0, -10],
    stopEvent: false,
  })
  overlay.set('layerName', 'measureAreaOverlay')
  overlay.setPosition(center)
  return overlay
}

// 清除所有测量图层和 Overlay
function clearAll() {
  if (!props.map) return
  const map = props.map

  // 先解绑所有 feature 的几何 change 监听（source.clear() 不会自动解绑）
  const layer = map.getLayers().getArray().find(
    (l) => (l as any).get('layerName') === MEASURE_LAYER_NAME
  ) as VectorLayer | undefined
  const src = layer?.getSource() as VectorSource | null | undefined
  if (src) {
    src.getFeatures().forEach((f) => {
      const listener = f.get('measureGeomChangeListener')
      const geom = f.getGeometry()
      if (listener && geom) geom.un('change', listener)
    })
    src.clear()
  }

  // 清除 Overlays
  map.getOverlays().getArray().slice().forEach((ol) => {
    if (ol && typeof (ol as any).get === 'function' && ol.get('layerName') === 'measureAreaOverlay') {
      map.removeOverlay(ol)
    }
  })
}

// 初始化
function startMeasure() {
  if (!props.map) return
  const map = props.map

  // 1. 创建/获取测量图层
  measureLayer =
    (map.getLayers().getArray().find(
      (l) => (l as any).get('layerName') === MEASURE_LAYER_NAME
    ) as VectorLayer | undefined) ?? null

  if (!measureLayer) {
    measureSource = new VectorSource()
    measureLayer = new VectorLayer({
      source: measureSource,
      style: new Style({
        fill: new Fill({ color: 'rgba(64, 150, 255, 0.2)' }),
        stroke: new Stroke({ color: '#4096FF', width: 2 }),
      }),
    })
    measureLayer.set('layerName', MEASURE_LAYER_NAME)
    map.addLayer(measureLayer)
  } else {
    measureSource = measureLayer.getSource() as VectorSource
  }

  // 2. 创建 Draw 交互
  drawInteraction = new Draw({
    source: measureSource,
    type: 'Polygon',
    // 样式：绘制时的虚线预览
    style: new Style({
      fill: new Fill({ color: 'rgba(64, 150, 255, 0.15)' }),
      stroke: new Stroke({
        color: '#4096FF',
        width: 2,
        lineDash: [5, 5],
      }),
    }),
  })

  // 3. 绘制完成回调
  drawInteraction.on('drawend', (evt) => {
    const geom = evt.feature.getGeometry() as Polygon
    if (!geom) return

    // 用球面算法计算真实面积（米²）
    const areaSqMeters = getArea(geom, { projection: map.getView().getProjection() })
    const areaText = formatArea(areaSqMeters)

    // 添加 Overlay 标签
    const overlay = createAreaOverlay(geom, areaText)
    map.addOverlay(overlay)

    // 给 feature 打标记，供 Toolbar Select 识别
    evt.feature.set('isMeasure', true)
    evt.feature.set('measureType', 'area')
    evt.feature.set('measureOverlay', overlay)

    // 监听几何变化（Modify 拖拽节点时触发），实时更新面积值和 Overlay 位置
    const onGeomChange = () => {
      const g = evt.feature.getGeometry() as Polygon
      if (!g) return
      const newArea = getArea(g, { projection: map.getView().getProjection() })
      const newText = formatArea(newArea)
      overlay.getElement()!.innerHTML = `面积: <b>${newText}</b>`
      overlay.setPosition(g.getInteriorPoint().getCoordinates())
    }
    geom.on('change', onGeomChange)
    evt.feature.set('measureGeomChangeListener', onGeomChange)
  })

  map.addInteraction(drawInteraction)
  // 标记交互归属，便于退出测量时精准清理
  drawInteraction.set('measureTool', 'area')

  // 4. 设置鼠标样式
  const target = map.getTargetElement() as HTMLElement
  target.style.cursor = 'crosshair'
}

function stopMeasure() {
  if (!props.map) return
  const map = props.map

  if (drawInteraction) {
    map.removeInteraction(drawInteraction)
    drawInteraction = null
  }

  // 兜底：移除所有面积测量的 Draw 交互，避免残留交互继续响应鼠标
  map.getInteractions().getArray().slice().forEach((i) => {
    if ((i as any).get && (i as any).get('measureTool') === 'area') {
      map.removeInteraction(i)
    }
  })

  // 恢复鼠标样式
  const target = map.getTargetElement() as HTMLElement
  target.style.cursor = ''
}

watch(
  () => props.active,
  (val) => {
    if (val) startMeasure()
    else stopMeasure()
    // 切换工具类型（面积 ↔ 距离）时，保留已有测量结果，不清空
    // 只有 Toolbar 清除按钮或 toggle off 最后一个工具时才全清
  }
)

// 绘制工具条点击“清除”时，同步清空面积测量结果
watch(
  () => props.clearTick,
  () => clearAll()
)

// Toolbar 激活工具时，暂停测量 Draw 交互，避免和 Select/Draw 抢 pointerdown
watch(
  () => props.toolbarActive,
  (tbActive) => {
    if (!drawInteraction) return
    if (tbActive) {
      drawInteraction.setActive(false)
    } else if (props.active) {
      drawInteraction.setActive(true)
    }
  }
)

onBeforeUnmount(() => {
  stopMeasure()
  // 组件销毁时清除测量图层（用 .slice() 复制集合 + dispose 防护）
  if (props.map) {
    props.map.getOverlays().getArray().slice().forEach((ol) => {
      if (ol && typeof (ol as any).get === 'function' && ol.get('layerName') === 'measureAreaOverlay') {
        props.map!.removeOverlay(ol)
      }
    })
    props.map.getLayers().getArray().slice().forEach((l) => {
      if (l && typeof (l as any).get === 'function' && (l as any).get('layerName') === MEASURE_LAYER_NAME) {
        props.map!.removeLayer(l)
      }
    })
  }
})
</script>

<style scoped lang="scss">
</style>

<!-- Overlay 里的标签样式（非 scoped） -->
<style lang="scss">
.measure-label {
  background: rgba(37, 91, 159, 0.92);
  color: #ffffff;
  padding: 3px 8px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  pointer-events: none;
  transform: translateX(-50%);
  border-top: 2px solid #5fa8ff;

  b {
    font-weight: 700;
    color: #ffd666;
  }
}
</style>
