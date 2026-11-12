<template>
  <div class="map-container" :class="{ 'panel-open': activePanel !== null }">
    <div :id="defaultId"></div>

    <!--左侧工具按钮（面板打开时隐藏） -->
    <div v-show="activePanel === null" class="side-bar">
      <div
        v-for="(tool, i) in tools"
        :key="i"
        class="tool-item"
        :class="{ 'is-active': activePanel === tool.name }"
        @click="togglePanel(tool.name)"
      >
        <el-button type="primary">{{ tool.label }}</el-button>
      </div>
    </div>

    <!-- 图层管理面板 -->
    <LayerManager
      v-if="activePanel === 'LayerManager'"
      :map="mapInstance"
      @close="activePanel = null"
    />
    <!-- 空间查询面板 -->
    <SpatialQuery
      v-if="activePanel === 'SpatialQuery'"
      :map="mapInstance"
      :toolbar-active="toolbarActive"
      @close="activePanel = null"
    />
    <!-- 其他面板占位 -->
    <div v-else-if="activePanel" class="placeholder-panel" @click="activePanel = null">
      <div class="placeholder-header">
        <span>{{ tools.find((t) => t.name === activePanel)?.label }}</span>
        <span class="placeholder-close">
          <svg viewBox="0 0 12 12" width="12" height="12">
            <path
              d="M2 2 L10 10 M10 2 L2 10"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            />
          </svg>
        </span>
      </div>
      <div class="placeholder-body">功能开发中...</div>
    </div>

    <!--缩放工具-->
    <Zoombar :map="mapInstance" />
    <!-- 面积/距离测量（按钮位于中部工具条） -->
    <MeasureArea
      :map="mapInstance"
      :active="measureType === 'area'"
      :clear-tick="clearTick"
      :toolbar-active="toolbarActive"
    />
    <MeasureDistance
      :map="mapInstance"
      :active="measureType === 'distance'"
      :clear-tick="clearTick"
      :toolbar-active="toolbarActive"
    />
    <!-- 绘制工具栏（右侧） -->
    <Toolbar :map="mapInstance" @clear="handleClear" @tool-active-change="handleToolActive" />
    <!-- 底部状态栏 -->
    <Statusbar :map="mapInstance" />
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Map, View } from 'ol'
import { addTDTCvaLayer, addTDTImageLayer } from '@/utils/olLayer'
import Toolbar from '@/components/GIS/2d/Toolbar/index.vue'
import Zoombar from '@/components/GIS/2d/Zoombar/index.vue'
import MeasureArea from '@/components/GIS/2d/Measurebar/MeasureArea.vue'
import MeasureDistance from '@/components/GIS/2d/Measurebar/MeasureDistance.vue'
import LayerManager from '@/components/GIS/2d/LayerManager/index.vue'
import SpatialQuery from '@/components/GIS/2d/SpatialQuery/index.vue'
import Statusbar from '@/components/GIS/2d/Statusbar/index.vue'
import { defaults } from 'ol/control'

type MeasureType = 'area' | 'distance' | null

defineProps<{ measureType?: MeasureType }>()

// 点击绘制工具条“清除”按钮时自增，触发测量组件清空结果
const clearTick = ref(0)
// Toolbar 当前激活的工具类型（'Select'/'Point'/...）或 null
// 用来通知测量组件暂停 Draw，避免和 Select/Draw 交互抢事件
const toolbarActive = ref<string | null>(null)

function handleClear() {
  clearTick.value++
}

function handleToolActive(type: string | null) {
  toolbarActive.value = type
}

const defaultId = ref('map-default')

// 将地图实例暴露为响应式引用，供绘制工具栏（及后续组件）按 prop 接入。
// 子组件 onMounted 早于父组件，故通过响应式 prop 在地图创建完成后自动触发工具栏初始化。
const mapInstance = ref<Map | null>(null)

const tools = ref([
  { name: 'LayerManager', label: '图层管理' },
  { name: 'SpatialQuery', label: '空间查询' },
  { name: 'SpatialAnalysis', label: '空间分析' },
  { name: 'SpatialVisualize', label: '空间可视化' },
])

// 当前打开的左侧面板（null 表示全部关闭）
const activePanel = ref<string | null>(null)

function togglePanel(name: string) {
  activePanel.value = activePanel.value === name ? null : name
}

const initMap = () => {
  const map = new Map({
    target: defaultId.value,
    view: new View({
      center: [106.640431, 26.650764],
      zoom: 12,
      projection: 'EPSG:4326',
    }),
    controls: defaults({
      zoom: false,
      rotate: false,
      attribution: false,
    }),
  })
  window._map = map
  addTDTImageLayer(map)
  addTDTCvaLayer(map)
  mapInstance.value = map
}

onMounted(() => {
  initMap()
})
</script>
<style scoped lang="scss">
$panel-width: 350px;

.map-container {
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow: hidden;

  // 面板打开时，状态栏和 zoombar 等左定位组件整体右移
  &.panel-open {
    :deep(.status-bar) {
      left: $panel-width;
      transition: left 0.25s ease;
    }
    :deep(.zoombar) {
      left: calc(#{$panel-width} + 10px);
      transition: left 0.25s ease;
    }
    :deep(.layer-panel) {
      animation: slide-in 0.25s ease-out;
    }
  }
}

@keyframes slide-in {
  from {
    transform: translateX(-10px);
    opacity: 0.85;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

#map-default {
  position: absolute;
  width: 100%;
  height: 100%;
}

.side-bar {
  position: absolute;
  top: 0;
  left: 0;
  margin: 10px;
  z-index: 950;

  .tool-item {
    margin: 10px 0;
  }

  .tool-item.is-active {
    :deep(.el-button) {
      background-color: #1d4a85;
      border-color: #4096ff;
      box-shadow:
        0 0 0 1px #4096ff inset,
        0 0 8px rgba(64, 150, 255, 0.35);
    }
  }
}

// 其他面板占位
.placeholder-panel {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: $panel-width;
  background-color: #255b9f;
  border-right: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 900;
  box-shadow: 4px 0 16px rgba(0, 0, 0, 0.3);

  .placeholder-header {
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    font-size: 13px;
    font-weight: 600;
    color: #ffffff;
  }
  .placeholder-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    &:hover {
      background: rgba(245, 34, 45, 0.2);
      color: #ffcccc;
    }
  }
  .placeholder-body {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.5);
    font-size: 13px;
  }
}
</style>
