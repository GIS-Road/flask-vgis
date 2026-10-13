/**
 * @name: router.ts
 * @description: 路由配置
 * @author: GIS散修
 * @date: 2026/9/10
 */

import { createRouter, createWebHistory } from 'vue-router'

import Login from '../view/login.vue'
import Home from '../view/home.vue'
import Register from '../view/register.vue'
import ForgetPassword from '../view/forgetPassword.vue'
const routes = [
  {
    path: '/',
    component: Home,
    name: 'Home',
  },
  {
    path: '/login',
    component: Login,
    name: 'Login',
  },
  {
    path: '/register',
    component: Register,
    name: 'Register',
  },
  {
    path: '/forgetPassword',
    component: ForgetPassword,
    name: 'ForgetPassword',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes: routes,
})

export default router
