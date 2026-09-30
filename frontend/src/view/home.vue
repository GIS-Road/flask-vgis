<template>
  <div class="main-container">
    <Map></Map>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Map from './map/index.vue'
const router = useRouter()

onMounted(() => {})
</script>
<style scoped lang="scss">
.main-container {
  width: 100%;
  height: 100%;
}
</style>
