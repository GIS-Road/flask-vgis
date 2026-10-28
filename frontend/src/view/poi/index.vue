<template>
  <div class="poi-container">
    <div class="poi-search">
      <el-input
        v-model="searchValue"
        placeholder="请输入餐馆名称（如：火锅店）"
        clearable
        style="width: 250px"
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
        <el-pagination
          size="small"
          background
          layout="prev, pager, next"
          :total="total"
          :page-size="size"
          :current-page="page"
          class="mt-4"
          @current-change="pageChange"
        />
      </ul>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { Close } from '@element-plus/icons-vue'
import VectorLayer from 'ol/layer/Vector'
import { createPulseEffect } from '@/utils/openLayers/olTools'

const searchValue = ref('')
const page = ref(1)
const size = ref(10)
const total = ref(0)

const tableData = ref([])

const searchPoi = () => {
  if (!searchValue.value) {
    ElMessage.warning('请输入搜索内容')
    return
  }
  axios
    .get(
      '/dev-api/poi/list?page=' + page.value + '&size=' + size.value + '&name=' + searchValue.value
    )
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

const pageChange = (currentPage: number) => {
  page.value = currentPage
  searchPoi()
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
  // console.log('json数据·1：', geomJson)
  // const source = new VectorSource({
  //   features: new GeoJSON().readFeatures(geomJson),
  // })
  // const layer = new VectorLayer({
  //   source,
  // })
  // layer.set('layerName', 'poiLayer')
  // window._map.addLayer(layer)
  // const coords = [geomJson[0], geomJson[1]]
  createPulseEffect(window._map, geomJson.coordinates)

  // 获取图层范围
  // const layerExtent = layer.getSource()?.getExtent()
  // window._map.getView().fit(layerExtent)
  window._map.getView().setZoom(15)
}
</script>
<style scoped lang="scss">
.poi-container {
  position: absolute;
  top: 30px;
  right: 20px;
  z-index: 999;
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
  background: #008de0b8;
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
  padding: 2px;
  &:hover {
    cursor: pointer;
    color: #ffffff;
    filter: brightness(150%);
    background: rgba(255, 0, 0, 0.44);
    border-radius: 50%;
    transform: rotate(180deg) scale(1);
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
