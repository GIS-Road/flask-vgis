<template>
  <aside class="layer-panel">
    <!-- 面板头部 -->
    <div class="panel-header">
      <div class="panel-title">
        <svg viewBox="0 0 16 16" width="16" height="16">
          <rect x="1" y="1" width="14" height="14" rx="2" fill="none" stroke="#4096FF" stroke-width="1.2" />
          <line x1="1" y1="5.5" x2="15" y2="5.5" stroke="#4096FF" stroke-width="0.8" opacity="0.5" />
          <rect x="3" y="2.5" width="3" height="2" rx="0.5" fill="#4096FF" opacity="0.6" />
          <rect x="10" y="8" width="4" height="1.5" rx="0.5" fill="#69b1ff" opacity="0.4" />
          <rect x="3" y="8" width="5" height="1.5" rx="0.5" fill="#69b1ff" opacity="0.4" />
          <rect x="3" y="10.5" width="3" height="1.5" rx="0.5" fill="#69b1ff" opacity="0.3" />
        </svg>
        <span>图层管理</span>
      </div>
      <div class="panel-toggle" title="关闭" @click="$emit('close')">
        <svg viewBox="0 0 12 12" width="12" height="12">
          <path d="M2 2 L10 10 M10 2 L2 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      </div>
    </div>

    <!-- 搜索过滤 -->
    <div class="layer-search-wrapper">
      <svg class="layer-search-icon" viewBox="0 0 16 16" width="14" height="14">
        <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" stroke-width="1.3" />
        <line x1="11" y1="11" x2="14.5" y2="14.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
      </svg>
      <input v-model="filterText" class="layer-search-input" type="text" placeholder="搜索图层..." />
      <span v-if="filterText" class="layer-search-clear" @click="filterText = ''">
        <svg viewBox="0 0 12 12" width="10" height="10">
          <path d="M2 2 L10 10 M10 2 L2 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </span>
    </div>

    <!-- 图层列表 -->
    <div class="layer-tree-container">
      <div
        v-for="layer in filteredLayers"
        :key="layer.olUid"
        class="layer-item"
        :class="{ 'is-selected': selectedUid === layer.olUid }"
        @click="selectedUid = layer.olUid"
      >
        <!-- 类型图标 -->
        <span class="layer-icon" :class="layer.iconClass">
          <template v-if="layer.isBaseMap">
            <svg viewBox="0 0 16 16" width="16" height="16">
              <rect x="1" y="3" width="14" height="10" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2" />
              <path d="M1 5 L15 5 M4 3 L4 13 M9 3 L9 13 M13 3 L13 13" stroke="currentColor" stroke-width="0.8" opacity="0.5" />
            </svg>
          </template>
          <template v-else-if="layer.isVector">
            <svg viewBox="0 0 16 16" width="16" height="16">
              <circle cx="5" cy="11" r="1.5" fill="currentColor" />
              <circle cx="11" cy="4" r="1.5" fill="currentColor" />
              <circle cx="13" cy="11" r="1.5" fill="currentColor" />
              <path d="M5 11 L11 4 L13 11 Z" fill="none" stroke="currentColor" stroke-width="1" />
            </svg>
          </template>
          <template v-else>
            <svg viewBox="0 0 16 16" width="16" height="16">
              <rect x="2" y="4" width="12" height="8" rx="1" fill="none" stroke="currentColor" stroke-width="1.2" />
              <path d="M2 8 L14 8" stroke="currentColor" stroke-width="0.8" opacity="0.5" />
            </svg>
          </template>
        </span>

        <!-- 图层名称 -->
        <span class="layer-label">{{ layer.name }}</span>

        <!-- 类型标签 -->
        <span v-if="layer.isBaseMap" class="layer-tag tag-base">底图</span>

        <!-- 眼睛图标 -->
        <span
          class="eye-icon"
          :class="{ 'eye-visible': layer.visible, 'eye-hidden': !layer.visible }"
          @click.stop="toggleVisibility(layer)"
          :title="layer.visible ? '隐藏图层' : '显示图层'"
        >
          <svg v-if="layer.visible" viewBox="0 0 16 16" width="14" height="14">
            <path d="M8 4C4.5 4 1.5 7 0.5 8c1 1 4 4 7.5 4S14.5 9 15.5 8c-1-1-4-4-7.5-4z" fill="none" stroke="currentColor" stroke-width="1.2" />
            <circle cx="8" cy="8" r="2.5" fill="none" stroke="currentColor" stroke-width="1.2" />
            <circle cx="8" cy="8" r="0.8" fill="currentColor" />
          </svg>
          <svg v-else viewBox="0 0 16 16" width="14" height="14">
            <path d="M8 4C4.5 4 1.5 7 0.5 8c1 1 4 4 7.5 4S14.5 9 15.5 8c-1-1-4-4-7.5-4z" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.4" />
            <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" stroke-width="1.2" />
          </svg>
        </span>

        <!-- 透明度图标 -->
        <span
          class="opacity-icon"
          :class="{ 'opacity-active': activeOpacityUid === layer.olUid }"
          @click.stop="openOpacitySlider(layer, $event)"
          title="透明度"
        >
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path d="M8 5.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z" fill="none" stroke="currentColor" stroke-width="1.2" />
            <path d="M8 1.5l-.6 1.8a4.8 4.8 0 00-1.3.5L4.4 2.8 2.8 4.4l1 1.7a4.8 4.8 0 00-.5 1.3L1.5 8l1.8.6c.1.5.3.9.5 1.3l-1 1.7 1.6 1.6 1.7-1c.4.2.8.4 1.3.5L8 14.5l.6-1.8c.5-.1.9-.3 1.3-.5l1.7 1 1.6-1.6-1-1.7c.2-.4.4-.8.5-1.3l1.8-.6-1.8-.6a4.8 4.8 0 00-.5-1.3l1-1.7-1.6-1.6-1.7 1a4.8 4.8 0 00-1.3-.5L8 1.5z" fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round" />
          </svg>
        </span>
      </div>

      <div v-if="filteredLayers.length === 0" class="empty-tip">暂无图层</div>
    </div>

    <!-- 透明度滑条 -->
    <div v-if="activeOpacityLayer" class="opacity-bar">
      <span class="opacity-label">{{ activeOpacityLayer.name }}</span>
      <input
        type="range"
        class="opacity-slider"
        min="0"
        max="1"
        step="0.05"
        :value="activeOpacityLayer.opacity"
        @input="onOpacityChange($event)"
      />
      <span class="opacity-value">{{ Math.round(activeOpacityLayer.opacity * 100) }}%</span>
      <span class="opacity-close" @click="activeOpacityUid = null">
        <svg viewBox="0 0 12 12" width="10" height="10">
          <path d="M2 2 L10 10 M10 2 L2 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </span>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import type { Map } from 'ol'

const props = defineProps<{ map: Map | null }>()
defineEmits(['close'])

const filterText = ref('')
const selectedUid = ref<number | null>(null)
const activeOpacityUid = ref<number | null>(null)

interface LayerInfo {
  olUid: number
  name: string
  visible: boolean
  opacity: number
  isBaseMap: boolean
  isVector: boolean
  iconClass: string
  olLayer: any
}

const layers = ref<LayerInfo[]>([])

// 从 map 收集所有图层
function refreshLayers() {
  if (!props.map) return
  const collection = props.map.getLayers()
  const arr: LayerInfo[] = []

  collection.forEach((layer: any) => {
    const uid = (layer as any).get?.('ol_uid') ?? Math.random() * 1e9
    const name =
      layer.get?.('layerName') ||
      layer.get?.('name') ||
      `图层 ${uid}`
    const isBaseMap = !!layer.get?.('isBaseMap')
    const layerClassName = layer.getClassName?.() || ''
    const isVector = layerClassName.includes('ol-layer-vector')

    arr.push({
      olUid: uid,
      name,
      visible: layer.getVisible(),
      opacity: layer.getOpacity() ?? 1,
      isBaseMap,
      isVector,
      iconClass: isVector ? 'icon-vector' : isBaseMap ? 'icon-basemap' : 'icon-tile',
      olLayer: layer,
    })
  })

  // 按 zIndex 排序（底图在底层）
  layers.value = arr.sort((a, b) => {
    const za = a.olLayer.getZIndex?.() ?? 0
    const zb = b.olLayer.getZIndex?.() ?? 0
    return za - zb
  })
}

const filteredLayers = computed(() => {
  if (!filterText.value) return layers.value
  const kw = filterText.value.toLowerCase()
  return layers.value.filter((l) => l.name.toLowerCase().includes(kw))
})

const activeOpacityLayer = computed(() => {
  return layers.value.find((l) => l.olUid === activeOpacityUid.value) || null
})

function toggleVisibility(layer: LayerInfo) {
  const newVal = !layer.visible
  layer.visible = newVal
  layer.olLayer.setVisible(newVal)
}

function openOpacitySlider(layer: LayerInfo, _e: Event) {
  if (activeOpacityUid.value === layer.olUid) {
    activeOpacityUid.value = null
  } else {
    activeOpacityUid.value = layer.olUid
  }
}

function onOpacityChange(e: Event) {
  const val = parseFloat((e.target as HTMLInputElement).value)
  if (activeOpacityLayer.value) {
    activeOpacityLayer.value.opacity = val
    activeOpacityLayer.value.olLayer.setOpacity(val)
  }
}

function bindLayerListeners() {
  if (!props.map) return
  const collection = props.map.getLayers()
  // 监听 layers 集合变化
  collection.on('add', refreshLayers)
  collection.on('remove', refreshLayers)
  // 监听每个图层的 change:visible 和 change:opacity
  collection.forEach((layer) => {
    layer.on('change:visible', refreshLayers)
    layer.on('change:opacity', refreshLayers)
  })
}

function unbindLayerListeners() {
  if (!props.map) return
  const collection = props.map.getLayers()
  collection.un('add', refreshLayers)
  collection.un('remove', refreshLayers)
  collection.forEach((layer) => {
    layer.un('change:visible', refreshLayers)
    layer.un('change:opacity', refreshLayers)
  })
}

watch(
  () => props.map,
  (newMap, oldMap) => {
    if (oldMap) unbindLayerListeners()
    if (newMap) {
      bindLayerListeners()
      refreshLayers()
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (props.map) {
    bindLayerListeners()
    refreshLayers()
  }
})

onBeforeUnmount(() => {
  unbindLayerListeners()
})
</script>

<style scoped lang="scss">
.layer-panel {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 350px;
  background-color: #255b9f;
  border-right: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 900;
  box-shadow: 4px 0 16px rgba(0, 0, 0, 0.3);
}

.panel-header {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  flex-shrink: 0;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
}

.panel-toggle {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.6);
  border-radius: 4px;
  transition: all 0.2s;
  flex-shrink: 0;
  &:hover {
    background: rgba(245, 34, 45, 0.2);
    color: #ffcccc;
  }
}

// 搜索框
.layer-search-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 10px 12px 6px;
  padding: 0 8px;
  height: 30px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 6px;
  transition: border-color 0.2s;
  &:focus-within { border-color: rgba(255, 255, 255, 0.5); }
}
.layer-search-icon { flex-shrink: 0; color: rgba(255, 255, 255, 0.6); }
.layer-search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 12px;
  color: #ffffff;
  min-width: 0;
}
.layer-search-input::placeholder { color: rgba(255, 255, 255, 0.4); }
.layer-search-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 16px; height: 16px;
  border-radius: 3px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.5);
  &:hover { color: #fff; background: rgba(255, 255, 255, 0.2); }
}

// 图层列表
.layer-tree-container {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.15s;
  margin-bottom: 2px;
  &:hover { background: rgba(255, 255, 255, 0.1); }
  &.is-selected {
    background: rgba(255, 255, 255, 0.2);
    .layer-label { color: #ffffff; font-weight: 500; }
  }
}

.layer-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.8);
}

.layer-label {
  flex: 1;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s;
}

.layer-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 3px;
  flex-shrink: 0;
  &.tag-base {
    background: rgba(255, 255, 255, 0.2);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
}

// 眼睛图标
.eye-icon, .opacity-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px; height: 20px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  color: rgba(255, 255, 255, 0.5);
  &:hover { background: rgba(255, 255, 255, 0.15); }
}
.eye-visible { color: rgba(255, 255, 255, 0.9); }
.eye-hidden { color: rgba(255, 255, 255, 0.35); }
.eye-hidden:hover { color: rgba(255, 255, 255, 0.7); }
.opacity-icon.opacity-active { color: #ffffff; background: rgba(255, 255, 255, 0.25); }

.empty-tip {
  text-align: center;
  padding: 32px 0;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
}

// 透明度滑条固定底栏
.opacity-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}
.opacity-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
}
.opacity-slider {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}
.opacity-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px; height: 14px;
  border-radius: 50%;
  background: #ffffff;
  cursor: pointer;
  border: 2px solid #255b9f;
}
.opacity-value {
  font-size: 12px;
  color: #ffffff;
  font-weight: 600;
  min-width: 32px;
  text-align: right;
  flex-shrink: 0;
}
.opacity-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px; height: 18px;
  border-radius: 4px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.5);
  &:hover { background: rgba(255, 255, 255, 0.2); color: #fff; }
}
</style>
