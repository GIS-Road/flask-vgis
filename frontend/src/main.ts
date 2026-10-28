import App from './App.vue'

import { createApp } from 'vue'
import router from './router/router'

import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import 'ol/ol.css'

// 注入 SVG 雪碧图（symbol sprite）到 DOM，供 <svg-icon> 的 <use> 引用
import 'virtual:svg-icons-register'
import './permissions'

const app = createApp(App)

// 注册ElementPlusIconsVue图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(router)
app.mount('#app')
