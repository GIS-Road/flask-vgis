<template>
  <div class="map-container">
    <div :id="defaultId"></div>
    <!--缩放工具-->
    <Zoombar :map="mapInstance"></Zoombar>
    <!-- 绘制工具栏（右侧） -->
    <Toolbar :map="mapInstance" />
    <POI></POI>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Map, View } from 'ol'
import { addTDTCvaLayer, addTDTImageLayer } from '@/utils/olLayer'
import POI from '@/view/poi/index.vue'
import Toolbar from '@/components/Gis/2d/Toolbar/index.vue'
import Zoombar from '@/components/Gis/2d/Zoombar/index.vue'
import { defaults } from 'ol/control'
const defaultId = ref('map-default')

// 将地图实例暴露为响应式引用，供绘制工具栏（及后续组件）按 prop 接入。
// 子组件 onMounted 早于父组件，故通过响应式 prop 在地图创建完成后自动触发工具栏初始化。
const mapInstance = ref<Map | null>(null)

const initMap = () => {
  const map = new Map({
    target: defaultId.value,
    view: new View({
      // center: [102.839443, 24.886272],
      center: [106.640431, 26.650764],
      zoom: 12,
      projection: 'EPSG:4326',
    }),
    controls: defaults({
      zoom: false,
      rotate: false,
      attribution: false,
    }),
  })
  window._map = map
  addTDTImageLayer(map)
  // addTDTCvaLayer(map)
  mapInstance.value = map
}

onMounted(() => {
  initMap()
})
</script>
<style scoped lang="scss">
.map-container {
  position: relative;
  width: 100%;
  height: 100%;
}
#map-default {
  position: absolute;
  width: 100%;
  height: 100%;
}
</style>
