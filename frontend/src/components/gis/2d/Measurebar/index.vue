<template>
  <div class="measurebar">
    <!-- 测量按钮组 -->
    <div class="measure-btns">
      <el-button
        :class="{ active: activeType === 'area' }"
        size="small"
        @click="toggleMeasure('area')"
      >
        <svg viewBox="0 0 16 16" width="13" height="13" style="margin-right:4px;vertical-align:-2px">
          <polygon points="3,13 8,3 13,6 12,13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          <rect x="6" y="7" width="5" height="4" fill="currentColor" opacity="0.35"/>
        </svg>
        面积测量
      </el-button>
      <el-button
        :class="{ active: activeType === 'distance' }"
        size="small"
        @click="toggleMeasure('distance')"
      >
        <svg viewBox="0 0 16 16" width="13" height="13" style="margin-right:4px;vertical-align:-2px">
          <line x1="2" y1="4" x2="14" y2="12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <circle cx="2" cy="4" r="1.5" fill="currentColor"/>
          <circle cx="14" cy="12" r="1.5" fill="currentColor"/>
        </svg>
        距离测量
      </el-button>
    </div>

    <!-- 面积测量组件 -->
    <MeasureArea
      :map="map"
      :active="activeType === 'area'"
      @close="activeType = null"
    />

    <!-- 距离测量组件 -->
    <MeasureDistance
      :map="map"
      :active="activeType === 'distance'"
      @close="activeType = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Map } from 'ol'
import MeasureArea from './MeasureArea.vue'
import MeasureDistance from './MeasureDistance.vue'

const props = defineProps<{ map: Map | null }>()

type MeasureType = 'area' | 'distance' | null

const activeType = ref<MeasureType>(null)

function toggleMeasure(type: Exclude<MeasureType, null>) {
  // 互斥：切换类型时先关旧的再开新的
  activeType.value = activeType.value === type ? null : type
}
</script>

<style scoped lang="scss">
.measurebar {
  position: absolute;
  top: 56px;
  right: 10px;
  z-index: 1000;
}

.measure-btns {
  display: flex;
  flex-direction: column;
  gap: 6px;

  :deep(.el-button) {
    background: rgba(37, 91, 159, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #fff;
    font-size: 12px;
    padding: 4px 12px;

    &:hover {
      background: #255b9f;
      border-color: rgba(255, 255, 255, 0.3);
    }

    &.active {
      background: #ff7a45 !important;
      border-color: #ff9c6e !important;
      color: #fff !important;
      box-shadow: 0 0 0 1px #ff7a45 inset, 0 0 8px rgba(255, 122, 69, 0.4);
    }
  }
}
</style>
