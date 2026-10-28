<template>
  <div class="zoom-bar-container">
    <button class="zoom-bar-item" title="放大" @click="zoomIn">
      <svg-icon icon-class="tabler:zoom-in" />
    </button>
    <button class="zoom-bar-item" title="缩放到起始位置" @click="resetPosition">
      <svg-icon icon-class="ri:home-4-fill" />
    </button>
    <button class="zoom-bar-item" title="缩小" @click="zoomOut">
      <svg-icon icon-class="tabler:zoom-out" />
    </button>
  </div>
</template>

<script setup name="ZoomBar">
const props = defineProps({
  map: { type: Object, default: null },
})
/**
 * 放大
 */
const zoomIn = () => {
  if (props.map) {
    const view = props.map.getView()
    const zoom = view.getZoom()
    view.setZoom(zoom + 1)
  }
}

/**
 * 缩小
 */
const zoomOut = () => {
  if (props.map) {
    const view = props.map.getView()
    const zoom = view.getZoom()
    view.setZoom(zoom - 1)
  }
}
/**
 * 复位
 */
const resetPosition = () => {
  if (props.map) {
    const view = props.map.getView()
    view.animate({ center: [106.640431, 26.650764], zoom: 12 })
  }
}
</script>

<style scoped lang="scss">
.zoom-bar-container {
  position: absolute;
  z-index: 99;
  left: 10px;
  top: 20px;
  width: 40px;
  border-radius: 5px;
  background-color: #255b9f;
}
.zoom-bar-item {
  position: relative;
  width: 100%;
  height: 40px;
  line-height: 40px;
  color: #ffff;
  cursor: pointer;
  transition: all 0.25s; /* 定义过渡效果 */
  border: none;
  border-bottom: 1px solid #cccccc61;
  background-color: #255b9f;
  &:hover {
    transition-delay: 0.25s;
    filter: brightness(120%);
    color: #bae0ff;
    background: rgba(64, 150, 255, 0.15);
  }
  .svg-icon {
    width: 1.25em;
    height: 1.25em;
  }
}
.active {
  background: #002549d9;
  color: #00d2ff;
}
</style>
