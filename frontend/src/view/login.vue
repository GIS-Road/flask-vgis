<template>
  <div class="login-container">这里是登陆页面</div>

  <el-button type="success" @click="goHome">返回首页</el-button>
</template>
<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>
<style scoped></style>
