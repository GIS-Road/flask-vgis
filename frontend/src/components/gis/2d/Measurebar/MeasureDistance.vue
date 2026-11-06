<template>
  <!-- 无界面组件：仅负责在图上绘制与标注 -->
  <span style="display: none"></span>
</template>

<script setup lang="ts">
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
  props.map.getOverlays().forEach((ol) => {
    if (ol.get('layerName') === 'measureDistanceOverlay') {
      props.map!.removeOverlay(ol)
    }
  })
  measureSource?.clear()
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
        stroke: new Stroke({ color: '#52c41a', width: 2.5 }),
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
        color: '#52c41a',
        width: 2.5,
        lineDash: [5, 5],
      }),
      image: undefined as any,
    }),
  })

  drawInteraction.on('drawend', (evt) => {
    const geom = evt.feature.getGeometry() as LineString
    if (!geom) return

    const lengthMeters = getLength(geom, { projection: map.getView().getProjection() })
    const distText = formatDistance(lengthMeters)

    const overlay = createDistanceOverlay(geom, distText)
    map.addOverlay(overlay)
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

import { watch, onBeforeUnmount } from 'vue'

watch(
  () => props.active,
  (val) => {
    if (val) startMeasure()
    else stopMeasure()
  }
)

// 绘制工具条点击“清除”时，同步清空距离测量结果
watch(
  () => props.clearTick,
  () => clearAll()
)

onBeforeUnmount(() => {
  stopMeasure()
  if (props.map) {
    props.map.getOverlays().forEach((ol) => {
      if (ol.get('layerName') === 'measureDistanceOverlay') {
        props.map!.removeOverlay(ol)
      }
    })
    props.map.getLayers().forEach((l) => {
      if ((l as any).get('layerName') === MEASURE_LAYER_NAME) {
        props.map!.removeLayer(l)
      }
    })
  }
})
</script>

<style scoped lang="scss">
</style>
