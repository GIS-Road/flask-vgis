<template>
  <div class="measure-btns">
    <el-button
      :class="{ active: active === 'area' }"
      size="small"
      @click="toggle('area')"
    >
      <svg viewBox="0 0 16 16" width="13" height="13" style="margin-right:4px;vertical-align:-2px">
        <polygon points="3,13 8,3 13,6 12,13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        <rect x="6" y="7" width="5" height="4" fill="currentColor" opacity="0.35"/>
      </svg>
      面积测量
    </el-button>
    <el-button
      :class="{ active: active === 'distance' }"
      size="small"
      @click="toggle('distance')"
    >
      <svg viewBox="0 0 16 16" width="13" height="13" style="margin-right:4px;vertical-align:-2px">
        <line x1="2" y1="4" x2="14" y2="12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="2" cy="4" r="1.5" fill="currentColor"/>
        <circle cx="14" cy="12" r="1.5" fill="currentColor"/>
      </svg>
      距离测量
    </el-button>
  </div>
</template>

<script setup lang="ts">
type MeasureType = 'area' | 'distance' | null

const props = defineProps<{ active: MeasureType }>()
const emit = defineEmits<{ (e: 'update:active', value: MeasureType): void }>()

function toggle(type: Exclude<MeasureType, null>) {
  // 互斥：再次点击同一工具则关闭
  emit('update:active', props.active === type ? null : type)
}
</script>

<style scoped lang="scss">
.measure-btns {
  display: flex;
  align-items: center;
  gap: 6px;

  :deep(.el-button) {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #ffffff;
    font-size: 12px;
    height: 28px;
    padding: 4px 12px;

    &:hover {
      background: rgba(255, 255, 255, 0.16);
      border-color: rgba(255, 255, 255, 0.35);
    }

    &.active {
      background: #ff7a45 !important;
      border-color: #ff9c6e !important;
      color: #ffffff !important;
      box-shadow: 0 0 0 1px #ff7a45 inset, 0 0 8px rgba(255, 122, 69, 0.4);
    }
  }
}
</style>
