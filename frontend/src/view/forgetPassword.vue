<template>
  <div class="register-container">
    <div class="register-main">
      <h1>重置密码</h1>
      <el-divider />
      <el-form ref="registerFormRef" class="register-form" :rules="rules" :model="registerForm">
        <el-form-item label="用户账号" prop="username">
          <el-input v-model="registerForm.username" placeholder="请输入用户名"></el-input>
        </el-form-item>
        <el-form-item label="用户密码" prop="password">
          <el-input
            v-model="registerForm.password"
            placeholder="请输入用户密码"
            type="password"
            show-password
          ></el-input>
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            placeholder="请再次输入用户密码"
            type="password"
            show-password
          ></el-input>
        </el-form-item>
        <el-form-item style="width: 100%">
          <el-button type="primary" class="register-btn" @click="updatePassword">确认</el-button>
        </el-form-item>
        <el-text class="back-login" type="primary" @click="goLogin">已有账号，转去登录</el-text>
      </el-form>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'
// 按需引入时，样式也得手动带（全量引入 element-plus 的不需要）
import 'element-plus/es/components/message/style/css'
import { ref } from 'vue'

const router = useRouter()

const registerFormRef = ref('registerFormRef')
const registerForm = ref({
  username: '',
  password: '',
  confirmPassword: '',
})
// 二次密码校验
const validateConfirmPassword = async (rule: any, value: any, callback: any): Promise<void> => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.value.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}
const rules = ref({
  username: [{ required: true, message: '用户名不能为空！', trigger: 'blur' }],
  password: [
    { required: true, message: '密码不能为空！', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度不能少于6位！', trigger: 'blur' },
  ],
  confirmPassword: [{ required: true, validator: validateConfirmPassword, trigger: 'blur' }],
})

const updatePassword = () => {
  if (!registerFormRef.value) return
  registerFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      console.log('registerForm.value.username：', registerForm.value.username)
      axios.get('/dev-api/user/' + registerForm.value.username).then((res) => {
        if (res.data.code !== 200) {
          ElMessage.error(res.data.msg)
          return
        }
        console.log(res)
        const user = res.data.data
        const updatedUser = { ...user }
        updatedUser['password'] = registerForm.value.password
        axios
          .put('/dev-api/user/' + user.id, updatedUser)
          .then((res) => {
            ElMessage.success(`用户密码修改成功`)
            router.push('/login')
          })
          .catch((err) => {
            console.log(err)
            ElMessage.error('用户密码重置失败!')
          })
      })
    }
  })
}

const goLogin = () => {
  router.push('/login')
}
</script>
<style scoped lang="scss">
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f5f5;
}
.register-main {
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
  .register-form {
    margin-top: 50px;
  }
  .register-btn {
    width: 100%;
    margin: 10px 0;
  }
  .back-login {
    float: right;
    &:hover {
      cursor: pointer;
    }
  }
}
</style>
