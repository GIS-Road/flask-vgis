/**
 * @name: olTool
 * @description: ol库工具类
 * @author: GIS散修（gis_road）
 * @date: 2026/10/23
 **/

import Overlay from 'ol/Overlay'
import { getCenter } from 'ol/extent'
import GeoJSON from 'ol/format/GeoJSON'
import { defaultStyle, geometrySelectStyle } from '@/utils/openLayers/olStyles'
import VectorSource from 'ol/source/Vector'
import VectorLayer from 'ol/layer/Vector'
import { Feature } from 'ol'
import { Point } from 'ol/geom.js'
import Style from 'ol/style/Style'
import CircleStyle from 'ol/style/Circle'
import { Fill, Stroke } from 'ol/style'

/**
 * @description：动画飞到指定地点
 * @param point
 * @param zoomNum
 */
export function flyToPoint(point, zoomNum = 15) {
  if (window._map) {
    const view = window._map.getView()
    view.animate({ center: point }, { zoom: zoomNum })
  }
}
/**
 * @description：动画飞到图层中心点
 */
export function flyToLayerCenter() {}

/**
 * @description：设置鼠标指针类型
 * @param cursor：鼠标指针类型
 * default(箭头)、help（箭头带问号）
 * wait（转圈）、crosshair（十字）
 * text（文本选择）、move（移动）
 * pointer（点击手势）、grab（抓取手势）
 */
export function setCursor(cursor) {
  if (window._map) {
    const map = window._map
    const targetEle = map.getTargetElement()
    targetEle.style.cursor = cursor
  }
}

/**
 * @description：清除指定图层
 * @param map：地图对象，默认为全局地图对象
 * @param layerName：图层名
 */
export function removeLayerByName(layerName, map = window._map) {
  const layers = map.getLayers().getArray()
  layers.forEach((targetLayer) => {
    const props = targetLayer.getProperties()
    if (layerName === props['layerName']) {
      map.removeLayer(targetLayer)
    }
  })
}

/**
 * @description：清除Overlay(叠加图层)
 * @param map：地图对象，默认为全局地图对象
 * @param overName：覆盖对象名称
 */
export function removeOverlayByName(overName, map = window._map) {
  const layers = map.getOverlays().getArray()
  layers.forEach((targetLayer) => {
    const props = targetLayer.getProperties()
    if (overName === props['layerName']) {
      map.removeOverlay(targetLayer)
    }
  })
}

/**
 * @description：清除除了底图的所有图层
 * @param map：地图对象，默认为全局地图对象
 */
export function removeAllLayer(map = window._map) {
  // 清除图层
  const layers = map.getLayers().getArray()
  const tarLayers = layers.map((layer) => {
    const props = layer.getProperties()
    if (!props.isBaseMap && !props.isTileLayer) {
      return layer
    }
  })
  tarLayers.forEach((tar) => {
    map.removeLayer(tar)
  })

  // 清除Overlay
  const overLayers = map.getOverlays().getArray()
  overLayers.forEach((overLayer) => map.removeOverlay(overLayer))
}

/**
 * 设置 Popup 信息弹窗
 * @param property：要素属性
 * @param popupColumns：信息弹窗字段
 * @param polygonGeometry：信息弹窗几何对象【Geometry】
 * @param map：信息弹窗显示地图
 */
export function setPopup(property, popupColumns, polygonGeometry, map) {
  removeOverlayByName('overLay', map)
  //  自定义popup容器
  const popupDiv = document.createElement('div')
  popupDiv.setAttribute('class', 'custom-popup')
  // 自定义popup头部
  const headerDiv = document.createElement('div')
  headerDiv.setAttribute('class', 'custom-popup-header')
  const titleSpan = document.createElement('span')
  titleSpan.setAttribute('class', 'custom-popup-title')
  titleSpan.textContent = '属性信息'
  const closeSpan = document.createElement('span')
  closeSpan.setAttribute('class', 'custom-popup-close')
  closeSpan.textContent = 'X'
  headerDiv.appendChild(titleSpan)
  headerDiv.appendChild(closeSpan)
  // 自定义头部定位角标
  const headerAngleIcon = document.createElement('span')
  headerAngleIcon.setAttribute('class', 'custom-header-angle')
  // 自定义popup表格
  const tableEle = document.createElement('table')
  tableEle.className = 'popup-table'
  tableEle.setAttribute('border', '1')
  tableEle.setAttribute('cellpadding', '0')
  tableEle.setAttribute('cellspacing', '0')

  Object.values(popupColumns).forEach((prop, index) => {
    if (prop['name'] === 'id' || prop['name'] === 'import_oid') return
    const trEle = document.createElement('tr')
    trEle.className = 'table-tr'
    const firstTdEle = document.createElement('td')
    const secondTdEle = document.createElement('td')
    // firstTdEle.innerText = popupColumns[index].name //popupColumns[index].comment
    firstTdEle.innerText = popupColumns[index].comment
    secondTdEle.innerText = property[popupColumns[index].name] || '暂无'

    trEle.appendChild(firstTdEle)
    trEle.appendChild(secondTdEle)
    tableEle.appendChild(trEle)
  })
  popupDiv.appendChild(headerAngleIcon)
  popupDiv.appendChild(headerDiv)
  popupDiv.appendChild(tableEle)
  const extent = polygonGeometry.getExtent()
  const center = getCenter(extent)

  // 创建Overlay popup
  const overlay = new Overlay({
    id: 'temp-polygon',
    position: center,
    element: popupDiv,
    offset: [0, 20],
    autoPan: false,
    autoPanMargin: 1.25,
    positioning: 'top-center',
  })
  overlay.setProperties({ layerName: 'overLay' })
  map.addOverlay(overlay)

  // 监听popup移除事件
  closeSpan.addEventListener('click', (evt) => {
    removeOverlayByName('overLay', map)
  })
}

/**
 * 设置 Popup 数据查询信息弹窗
 * @param results：分析结果数据
 * @param map：信息弹窗显示地图
 */
export function openPopupOfQueryLayer(results, map) {
  removeOverlayByName('overLay', map)
  //  自定义popup容器
  const queryWrap = document.createElement('div')
  queryWrap.setAttribute('class', 'custom-popup')
  // 自定义popup头部
  const headerDiv = document.createElement('header')
  headerDiv.setAttribute('class', 'custom-popup-header')
  const titleSpan = document.createElement('span')
  titleSpan.setAttribute('class', 'custom-popup-title')
  titleSpan.textContent = '属性信息'
  const closeSpan = document.createElement('span')
  closeSpan.setAttribute('class', 'custom-popup-close')
  closeSpan.textContent = 'X'
  headerDiv.appendChild(titleSpan)
  headerDiv.appendChild(closeSpan)
  // 自定义属性内容区域
  const queryBody = document.createElement('div')
  queryBody.setAttribute('class', 'query-body')
  // 自定义头部定位角标
  const headerAngleIcon = document.createElement('span')
  headerAngleIcon.setAttribute('class', 'custom-header-angle')
  // 自定义popup表格
  const tableEle = document.createElement('table')
  tableEle.className = 'popup-table'
  tableEle.setAttribute('border', '1')
  tableEle.setAttribute('cellpadding', '0')
  tableEle.setAttribute('cellspacing', '0')

  // 自定义查询图层标题
  const queryTabs = document.createElement('div')
  queryTabs.setAttribute('class', 'query-tabs')
  const queryTabContent = document.createElement('div')
  queryTabContent.setAttribute('class', 'query-tab-content')

  results.forEach((feature) => {
    if (!feature.geometry) {
      return
    }
    const queryTabSpan = document.createElement('span')
    queryTabSpan.textContent = feature.label
    queryTabSpan.setAttribute('class', 'query-tab-span')
    queryTabContent.appendChild(queryTabSpan)
  })
  queryTabs.appendChild(queryTabContent)
  // 添加默认选中样式
  const firstChild = queryTabContent.firstChild
  firstChild.classList.add('query-tab-active')
  // 添加要素默认样式
  let popupInfo = results[0]
  // 事件委托，展示目标选项,筛选显示图层
  const tabArr = queryTabContent.childNodes
  queryTabContent.addEventListener('click', (evt) => {
    const targetElement = evt.target
    if (targetElement.tagName.toUpperCase() !== 'SPAN') {
      return
    }
    removeOverlayByName('overLay', map)
    tabArr.forEach((tab) => {
      tab.classList.remove('query-tab-active')
    })
    targetElement.classList.add('query-tab-active')
    const layerName = targetElement.textContent

    popupInfo = results.find((result) => {
      const defaultPolygon = popupInfo['polygon']
      defaultPolygon.setStyle(defaultStyle)
      return result.label === layerName
    })
    tableEle.innerHTML = ''
    showOverlay(popupInfo)
  })

  const showOverlay = (popupInfo) => {
    if (!popupInfo) {
      console.log('信息弹窗：', popupInfo)
      tableEle.innerHTML = '<span>暂无数据</span>'
    }
    const popupColumns = popupInfo['popupColumns']
    const property = popupInfo['properties']

    const defaultPolygon = popupInfo['polygon']
    defaultPolygon.setStyle(geometrySelectStyle['Polygon'])

    Object.values(popupColumns).forEach((prop, index) => {
      if (prop['name'] === 'id' || prop['name'] === 'import_oid') return
      const trEle = document.createElement('tr')
      trEle.className = 'table-tr'
      const firstTdEle = document.createElement('td')
      const secondTdEle = document.createElement('td')
      // firstTdEle.innerText = popupColumns[index].name //popupColumns[index].comment
      firstTdEle.innerText = popupColumns[index].comment
      secondTdEle.innerText = property[popupColumns[index].name] || '暂无'

      trEle.appendChild(firstTdEle)
      trEle.appendChild(secondTdEle)
      tableEle.appendChild(trEle)
    })
    const geometry = popupInfo['geometry']
    const geom = new GeoJSON().readGeometry(geometry)
    const extent = geom.getExtent()
    const center = getCenter(extent)
    map.getView().fit(extent)
    // 创建Overlay popup
    const overlay = new Overlay({
      id: 'temp-polygon',
      position: center,
      element: queryWrap,
      offset: [0, 20],
      autoPan: false,
      autoPanMargin: 1.25,
      positioning: 'top-center',
    })
    overlay.setProperties({ layerName: 'overLay' })
    map.addOverlay(overlay)

    queryWrap.appendChild(headerAngleIcon)
    queryWrap.appendChild(headerDiv)
    queryWrap.appendChild(queryTabs)
    queryWrap.appendChild(tableEle)
  }
  showOverlay(popupInfo)
  // 监听popup移除事件
  closeSpan.addEventListener('click', (evt) => {
    removeOverlayByName('overLay', map)
  })
}

/**
 * @description：创建 OpenLayers 闪烁点
 * @param map {Map}：地图对象
 * @param coordinate {Coordinate [x,y]}：地图坐标点对象
 **/
export function createPulseEffect(map, coordinate) {
  removeLayerByName('poiLayer')
  const pulseFeatures = []
  const source = new VectorSource()
  const layer = new VectorLayer({ source })
  layer.setProperties({ layerName: 'poiLayer' })
  map.addLayer(layer)

  for (let i = 0; i < 3; i++) {
    const feature = new Feature(new Point(coordinate))
    pulseFeatures.push(feature)
    source.addFeature(feature)
  }

  map.getView().fit(pulseFeatures[0].getGeometry())

  let radius = 5
  const animate = () => {
    radius = radius >= 20 ? 5 : radius + 0.1

    pulseFeatures.forEach((feature, i) => {
      const r = radius + i * 3
      const opacity = 0.7 - i * 0.2

      feature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: r,
            fill: new Fill({
              // color: `rgba(255, 0, 0, ${opacity})`
              color: `rgba(34, 255, 136, ${opacity})`,
            }),
            stroke: new Stroke({ color: `rgba(255, 255, 255, ${opacity})`, width: 1 }),
          }),
          fill: new Fill({}),
        })
      )
    })

    requestAnimationFrame(animate)
  }
  animate()
  // 返回清除函数
  return () => map.removeLayer(layer)
}
