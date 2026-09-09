<template>
  <div class="app-container">
    <span>这是一个WebGIS展示系统</span>
    <div>
      <!-- 直接使用，无需导入 -->
      <el-button type="primary">这是一个按钮</el-button>
      <el-input v-model="inputValue" placeholder="请输入关键词" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'

const inputValue = ref('')

const props = defineProps({})
onMounted(() => {})
</script>
<style scoped>
.app-container {
  margin: 100px;
  font-size: 24px;
  font-weight: bold;
  color: red;
}
</style>
