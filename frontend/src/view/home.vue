<template>
  <div class="main-container">
    <div class="header">
      <div class="header-title">
        <header>WebGIS 演示系统</header>
      </div>
      <div class="header-user">
        <div>
          <Avatar class="user-icon" style="width: 1em; height: 1em; margin-right: 8px" />
          <el-dropdown placement="bottom-end">
            <el-button> 山海经 </el-button>
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
    <Map></Map>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Map from './map/index.vue'
import { removeToken } from '../utils/auth'
import { Avatar } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
const router = useRouter()

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

onMounted(() => {})
</script>
<style scoped lang="scss">
.main-container {
  width: 100%;
  height: 100%;
}
.header {
  display: flex;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  background: #0da6ff;
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
</style>
