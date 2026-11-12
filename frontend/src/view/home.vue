<template>
  <div class="main-container">
    <div class="header">
      <div class="header-title">
        <header>WebGIS 基础信息系统</header>
      </div>
      <div class="header-user">
        <div>
          <Avatar class="user-icon" style="width: 1em; height: 1em; margin-right: 8px" />
          <el-dropdown placement="bottom-end">
            <el-button> {{ user.username }} </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>用户中心</el-dropdown-item>
                <el-dropdown-item @click="logout">退出</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>
    <div class="middle-container">
      <Measurebar v-model:active="measureType" />
      <POI inline />
    </div>
    <Map :measure-type="measureType"></Map>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Map from './map/index.vue'
import POI from './poi/index.vue'
import Measurebar from '@/components/GIS/2d/Measurebar/index.vue'
import { removeToken } from '@/utils/auth'
import { Avatar } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
const router = useRouter()

const user = ref({})

// 当前测量工具（'area' | 'distance' | null），由中部工具条按钮控制
const measureType = ref<'area' | 'distance' | null>(null)

const logout = () => {
  ElMessageBox.confirm('是否要退出系统？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      ElMessage({
        type: 'success',
        message: '退出成功',
      })
      removeToken()
      router.push('/login')
    })
    .catch((err) => {
      // ElMessage({
      //   type: 'info',
      //   message: '取消退出登录',
      // })
    })
}
// 获取当前用户信息
const getCurrentUser = () => {
  axios.get('/dev-api/me').then((res) => {
    user.value = res.data.data
  })
}

onMounted(() => {
  getCurrentUser()
})
</script>
<style scoped lang="scss">
.main-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.header {
  display: flex;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  //background: #0da6ff;
  //background: linear-gradient(to right, rgb(18, 194, 233), rgb(196, 113, 237), rgb(246, 79, 89));
  //background: linear-gradient(to right, rgb(33, 147, 176), rgb(109, 213, 237));
  //background: linear-gradient(135deg, #0080FF 0%, #00FFFF 100%);
  //background: linear-gradient(135deg, #00bfff 0%, #87ceeb 100%);

  background: linear-gradient(90deg, #204080, #2a70b8);
  color: #fff;
  .header-title {
    font-size: 30px;
  }
}

.header-user {
  position: absolute;
  right: 20px;
}
.user-icon {
  vertical-align: middle;
  font-size: 30px;
}
.middle-container {
  position: relative;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 0 20px;
  background: linear-gradient(90deg, #1a3670, #204080);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  overflow: visible;
  z-index: 10;
}
</style>
