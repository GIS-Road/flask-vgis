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
import { LineString } from 'ol/geom'
import { getLength } from 'ol/sphere'
import Style from 'ol/style/Style'
import { Stroke } from 'ol/style'

const props = defineProps<{
  map: Map | null
  active: boolean
  clearTick?: number
  toolbarActive?: string | null
}>()

const MEASURE_LAYER_NAME = 'measureDistanceLayer'

let drawInteraction: Draw | null = null
let measureSource: VectorSource | null = null
let measureLayer: VectorLayer | null = null

// 距离格式化
function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return (meters / 1000).toFixed(2) + ' km'
  }
  return meters.toFixed(2) + ' m'
}

// 创建距离标签 Overlay（放在线的最后一个点位置）
function createDistanceOverlay(line: LineString, distText: string): Overlay {
  const coords = line.getCoordinates()
  const lastPoint = coords[coords.length - 1]

  const el = document.createElement('div')
  el.className = 'measure-label'
  el.innerHTML = `距离: <b>${distText}</b>`

  const overlay = new Overlay({
    element: el,
    positioning: 'center-right',
    offset: [10, 0],
    stopEvent: false,
  } as any)
  overlay.set('layerName', 'measureDistanceOverlay')
  overlay.setPosition(lastPoint)
  return overlay
}

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
    if (ol && typeof (ol as any).get === 'function' && ol.get('layerName') === 'measureDistanceOverlay') {
      map.removeOverlay(ol)
    }
  })
}

function startMeasure() {
  if (!props.map) return
  const map = props.map

  measureLayer =
    (map.getLayers().getArray().find(
      (l) => (l as any).get('layerName') === MEASURE_LAYER_NAME
    ) as VectorLayer | undefined) ?? null

  if (!measureLayer) {
    measureSource = new VectorSource()
    measureLayer = new VectorLayer({
      source: measureSource,
      style: new Style({
        stroke: new Stroke({ color: '#4096FF', width: 2.5 }),
      }),
    })
    measureLayer.set('layerName', MEASURE_LAYER_NAME)
    map.addLayer(measureLayer)
  } else {
    measureSource = measureLayer.getSource() as VectorSource
  }

  drawInteraction = new Draw({
    source: measureSource,
    type: 'LineString',
    style: new Style({
      stroke: new Stroke({
        color: '#4096FF',
        width: 2.5,
        lineDash: [5, 5],
      }),
    }),
  })

  drawInteraction.on('drawend', (evt) => {
    const geom = evt.feature.getGeometry() as LineString
    if (!geom) return

    const lengthMeters = getLength(geom, { projection: map.getView().getProjection() })
    const distText = formatDistance(lengthMeters)

    const overlay = createDistanceOverlay(geom, distText)
    map.addOverlay(overlay)

    // 给 feature 打标记，供 Toolbar Select 识别
    evt.feature.set('isMeasure', true)
    evt.feature.set('measureType', 'distance')
    evt.feature.set('measureOverlay', overlay)

    // 监听几何变化（Modify 拖拽节点时触发），实时更新距离值和 Overlay 位置
    const onGeomChange = () => {
      const g = evt.feature.getGeometry() as LineString
      if (!g) return
      const newLen = getLength(g, { projection: map.getView().getProjection() })
      const newText = formatDistance(newLen)
      overlay.getElement()!.innerHTML = `距离: <b>${newText}</b>`
      const coords = g.getCoordinates()
      overlay.setPosition(coords[coords.length - 1])
    }
    geom.on('change', onGeomChange)
    evt.feature.set('measureGeomChangeListener', onGeomChange)
  })

  map.addInteraction(drawInteraction)
  // 标记交互归属，便于退出测量时精准清理
  drawInteraction.set('measureTool', 'distance')
  const target = map.getTargetElement() as HTMLElement
  target.style.cursor = 'crosshair'
}

function stopMeasure() {
  if (!props.map) return
  if (drawInteraction) {
    props.map.removeInteraction(drawInteraction)
    drawInteraction = null
  }
  // 兜底：移除所有距离测量的 Draw 交互，避免残留交互继续响应鼠标
  props.map.getInteractions().getArray().slice().forEach((i) => {
    if ((i as any).get && (i as any).get('measureTool') === 'distance') {
      props.map!.removeInteraction(i)
    }
  })
  const target = props.map.getTargetElement() as HTMLElement
  target.style.cursor = ''
}

watch(
  () => props.active,
  (val) => {
    if (val) startMeasure()
    else stopMeasure()
    // 切换工具类型时保留已有测量结果，不清空
  }
)

// 绘制工具条点击“清除”时，同步清空距离测量结果
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
  if (props.map) {
    props.map.getOverlays().getArray().slice().forEach((ol) => {
      if (ol && typeof (ol as any).get === 'function' && ol.get('layerName') === 'measureDistanceOverlay') {
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
