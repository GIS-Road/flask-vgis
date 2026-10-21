<template>
  <div class="poi-container">
    <div class="poi-search">
      <el-input
        v-model="searchValue"
        placeholder="请输入餐馆名称（如：火锅店）"
        clearable
      ></el-input>
      <el-button type="primary" icon="Search" @click="searchPoi">搜索</el-button>
    </div>
    <div v-show="tableData.length" class="poi-result">
      <div class="result-header">
        <div>
          <span>总数：</span>
          <span>{{ total }}</span>
        </div>
        <div class="close-panel" @click="closePanel"><Close></Close></div>
      </div>
      <ul class="poi-panel">
        <li v-for="item in tableData" :key="item.ogc_fid" class="poi-item" @click="addToMap(item)">
          {{ item.name }}
        </li>
      </ul>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { Close } from '@element-plus/icons-vue'
import { Vector as VectorSource } from 'ol/source'
import { GeoJSON } from 'ol/format'
import VectorLayer from 'ol/layer/Vector'

const searchValue = ref('')
const page = 1
const size = 20
const total = ref(0)

const tableData = ref([])

const searchPoi = () => {
  if (!searchValue.value) {
    ElMessage.warning('请输入搜索内容')
    return
  }
  axios
    .get('/dev-api/poi/list?page=' + page + '&size=' + size + '&name=' + searchValue.value)
    .then((res) => {
      console.log('请求响应：', res)
      if (res.data.code !== 200) {
        ElMessage.error(res.data.msg)
        return
      }
      tableData.value = res.data.data.rows
      total.value = res.data.data.total
    })
}

// 关闭结果面板
const closePanel = () => {
  tableData.value = []
  const layers = window._map
    .getLayers()
    .getArray()
    .filter((layer: VectorLayer) => layer.getProperties().layerName === 'poiLayer')
  layers.forEach((layer: VectorLayer) => {
    window._map.removeLayer(layer)
  })
}

const addToMap = (poi: object) => {
  const geomJson = typeof poi.geom_json === 'string' ? JSON.parse(poi.geom_json) : poi.geom_json
  const source = new VectorSource({
    features: new GeoJSON().readFeatures(geomJson),
  })
  const layer = new VectorLayer({
    source,
  })
  layer.set('layerName', 'poiLayer')
  window._map.addLayer(layer)
  // 获取图层范围
  const layerExtent = layer.getSource()?.getExtent()
  window._map.getView().fit(layerExtent)
}
</script>
<style scoped lang="scss">
.poi-container {
  position: absolute;
  top: 80px;
  right: 20px;
}
.poi-search {
  display: flex;
}
:deep(.el-button--primary) {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
:deep(.el-input__wrapper) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.poi-result {
  margin-top: 10px;
  background: #008de08f;
  color: #ffffff;
  border-radius: 2.5px;
}
.result-header {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: #0da6ff;
  font-weight: bold;
  font-size: 16px;
}
.close-panel {
  width: 1.5rem;
  height: 1.5rem;
  color: #ddd;
  &:hover {
    cursor: pointer;
    color: #ffffff;
    filter: brightness(150%);
    transition: all 0.25s ease-in-out;
  }
}
.poi-panel {
  padding: 5px 0;
}
.poi-item {
  list-style-type: none;
  padding: 5px;
  &:hover {
    cursor: pointer;
    background: #008de08f;
    filter: brightness(120%);
    transition: all 0.25s ease-in-out;
  }
}
</style>
