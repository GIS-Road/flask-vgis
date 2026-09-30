<template>
  <div class="map-container">
    <div :id="defaultId"></div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Map, View } from 'ol'
import { addTDTCvaLayer, addTDTImageLayer } from '../../utils/olLayer'

const defaultId = ref('map-default')

const initMap = () => {
  const map = new Map({
    target: defaultId.value,
    view: new View({
      center: [102.839443, 24.886272],
      zoom: 12,
      projection: 'EPSG:4326',
    }),
  })
  addTDTImageLayer(map)
  addTDTCvaLayer(map)
}

onMounted(() => {
  initMap()
})
</script>
<style scoped lang="scss">
.map-container {
  width: 100%;
  height: 100%;
}
#map-default {
  position: absolute;
  width: 100%;
  height: 100%;
}
</style>
