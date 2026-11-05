<template>
  <div class="measure-distance">
    <div class="measure-tip" v-if="active">
      <span>单击地图添加节点，双击结束绘制</span>
      <span class="measure-clear" @click="clearAll" title="清除所有测量">
        <svg viewBox="0 0 14 14" width="12" height="12">
          <path d="M3 3 L11 11 M11 3 L3 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
        清除
      </span>
      <span class="measure-close" @click="$emit('close')" title="关闭测量">
        <svg viewBox="0 0 12 12" width="12" height="12">
          <path d="M2 2 L10 10 M10 2 L2 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      </span>
    </div>
  </div>
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
}>()

defineEmits(['close'])

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
  const target = map.getTargetElement() as HTMLElement
  target.style.cursor = 'crosshair'
}

function stopMeasure() {
  if (!props.map) return
  if (drawInteraction) {
    props.map.removeInteraction(drawInteraction)
    drawInteraction = null
  }
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
.measure-distance {
  pointer-events: none;
}

.measure-tip {
  position: absolute;
  top: 140px;
  right: 10px;
  z-index: 1100;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  background: rgba(82, 196, 26, 0.92);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  font-size: 12px;
  color: #ffffff;
  pointer-events: auto;
  user-select: none;

  .measure-clear,
  .measure-close {
    display: flex;
    align-items: center;
    gap: 3px;
    padding: 3px 6px;
    border-radius: 3px;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.95);
    transition: background 0.15s;
  }
  .measure-clear:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  .measure-close:hover {
    background: rgba(245, 34, 45, 0.3);
  }
}
</style>
