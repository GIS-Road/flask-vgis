/**
 * @name: olLayer.js
 * @description: ol工具类
 * @author: GIS散修
 * @date: 2026/9/30
 */
import { XYZ } from 'ol/source.js'
import TileLayer from 'ol/layer/Tile.js'


const EPSGCODE = 4490
const TDTTOKEN = "1d109683f4d84198e37a38c442d68311"

/**
 * 天地图影像服务
 * @param
 */

// 天地图瓦片服务的URL模板
// const tdTileLayer = 'http://{s}.tianditu.gov.cn/vec_c/wmts?service=WMTS&request=GetTile&version=1.0.0&LAYER={layer}&tilematrixset=c&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=fa7ec9766b2c00747e3dd60ab3d05892';
export function addTdtImageLayer() {
  // const layer = new Tile({
  //   source: new Tianditu({
  //     key: "1d109683f4d84198e37a38c442d68311",
  //     projection: OlSRS[4490],
  //     // projection: projection,
  //     layerType: "img"
  //   })
  // })
  // window._map.addLayer(layer)
}

/**
 * 天地图影像服务
 * @param map：地图对象
 */
export function addTDTImageLayer(map = window._map){
  // 添加地图
  const url = "http://t{0-7}.tianditu.com/DataServer?x={x}&y={y}&l={z}&T=img_c&tk=" + TDTTOKEN;
  const source = new XYZ({
    url: url,
    projection: "EPSG:4326"
  });
  const tdtLayer = new TileLayer({
    source: source,
    isBaseMap: true
  });
  tdtLayer.set("layerName","天地图影像")
  map.addLayer(tdtLayer)
}
/**
 * 天地图矢量服务
 * @param map：地图对象
 */
export function addTDTVecLayer(map = window._map){
  // 添加地图
  const url = "http://t{0-7}.tianditu.com/DataServer?x={x}&y={y}&l={z}&T=vec_c&tk=" + TDTTOKEN;
  // let url = "https://wx.zrzyfw.cn/tdt/DataServer?x={x}&y={y}&l={z}&T=vec_c&tk="+TDTTOKEN;
  const source = new XYZ({
    url: url,
    projection: "EPSG:4326"
  });
  const tdtLayer = new TileLayer({
    source: source,
    isBaseMap: true
  });
  tdtLayer.set("layerName","天地图矢量")
  map.addLayer(tdtLayer)
}


/**
 * 天地图注记服务
 * @param map：地图对象
 */
export function addTDTCvaLayer(map = window._map){
  // 添加地图
  const url = "http://t{0-7}.tianditu.com/DataServer?x={x}&y={y}&l={z}&T=cva_c&tk=" + TDTTOKEN;
  // let url = "https://wx.zrzyfw.cn/tdt/DataServer?x={x}&y={y}&l={z}&T=cva_c&tk="+TDTTOKEN;
  const source = new XYZ({
    url: url,
    projection: "EPSG:4326"
  });
  const tdtLayer = new TileLayer({
    source: source,
    zIndex: 999,
    isBaseMap: true
  });
  tdtLayer.set("layerName","天地图注记")
  map.addLayer(tdtLayer)
}

