<template>
  <div class="login-container">
    <div class="login-main">
      <h1>用户登录</h1>
      <el-divider />
      <el-form class="login-form">
        <el-form-item label="用户账号">
          <el-input v-model="loginForm.username" placeholder="请输入用户名"></el-input>
        </el-form-item>
        <el-form-item label="用户密码">
          <el-input v-model="loginForm.password" placeholder="请输入用户密码"></el-input>
        </el-form-item>
        <el-form-item style="width: 100%">
          <el-button type="primary" class="login-btn" @click="login">登录</el-button>
        </el-form-item>
      </el-form>
      <el-text class="login-register" type="primary">还没有账号？立即注册</el-text>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
// 按需引入时，样式也得手动带（全量引入 element-plus 的不需要）
import 'element-plus/es/components/message/style/css'

const router = useRouter()

const loginForm = ref({
  username: '',
  password: '',
})

const login = () => {
  axios
    .post('/dev-api/login', {
      username: loginForm.value.username,
    })
    .then((res) => {
      console.log(res)
      if (res.data.code !== 200) {
        ElMessage.error('请输入正确的用户名和密码')
        return
      }
      ElMessage.success('登录成功')

      router.push('/')
    })
    .catch((err) => {
      console.log(err)
    })
}
</script>
<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f5f5;
}
.login-main {
  padding: 0 50px;
  width: 350px;
  height: 500px;
  background: #fff;
  border: 1px solid white;
  box-shadow: 0 0 10px 5px #e9e9e9;
  border-radius: 5px;
  h1 {
    margin: 50px 0;
    text-align: center;
  }
  .login-form {
    margin-top: 50px;
  }
  .login-btn {
    width: 100%;
    margin: 10px 0;
  }
  .login-register {
    float: right;
  }
}
</style>
