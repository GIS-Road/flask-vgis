<template>
  <div class="main-container">
    <div class="logout">
      <el-button class="logout-btn" type="primary" @click="logout">退出</el-button>
    </div>
    <Map></Map>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Map from './map/index.vue'
import { removeToken } from '../utils/auth'
const router = useRouter()

const logout = () => {
  removeToken()
  router.push('/login')
}

onMounted(() => {})
</script>
<style scoped lang="scss">
.main-container {
  width: 100%;
  height: 100%;
}

.logout {
  position: absolute;
  top: 50px;
  right: 16px;
  z-index: 99;
}
</style>
