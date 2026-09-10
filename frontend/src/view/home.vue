<template>
  <span>这是一个WebGIS展示系统</span>
  <div>
    <!-- 直接使用，无需导入 -->
    <el-button type="primary">这是一个按钮</el-button>
    <el-button type="success" @click="goLogin">登录页面</el-button>
    <el-input v-model="inputValue" placeholder="请输入关键词" />
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const inputValue = ref('')

const props = defineProps({})

const goLogin = () => {
  router.push('/login')
}

onMounted(() => {})
</script>
<style scoped></style>
