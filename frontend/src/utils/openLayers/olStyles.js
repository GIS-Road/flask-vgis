import Style from 'ol/style/Style';
import { Fill, Stroke } from "ol/style";
import CircleStyle from "ol/style/Circle";

/**
 * 图形默认样式
 * @type {Style}
 */
const defaultStyle = new Style({
  // 填充色
  fill: new Fill({
    color: "rgba(251, 33, 2, 0.10)"
  }),
  // 边线色
  stroke: new Stroke({
    color: "rgba(251, 33, 2, 0.5)",
    width: 2.5
  })
})

/**
 * 行政区默认样式
 * @type {Style}
 */
const defaultRegionStyle = new Style({
  // 填充色
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.2)'
  }),
  // 边线色
  stroke: new Stroke({
    color: "#fffcc3",
    width: 2
  })
})
/**
 * 几何对象默认样式
 * @type {{Circle: Style, MultiPolygon: Style, LineString: Style, Box: Style, Point: Style, Polygon: Style}}
 */
const geometryDefaultStyle = {
  // 多边形
  "MultiPolygon": new Style({
    fill: new Fill({
      color: "rgba(251, 33, 2, 0.10)"
    }),
    stroke: new Stroke({
      color: "rgba(251, 33, 2, 0.85)",
      width: 2.5
    })
  }),
  // 面
  "Polygon": new Style({
    fill: new Fill({
      color: "rgba(251, 33, 2, 0.10)"
    }),
    stroke: new Stroke({
      color: "rgba(251, 33, 2, 0.85)",
      width: 2.5
    })
  }),
  // 线
  "LineString": new Style({
    stroke: new Stroke({
      color: "rgba(251, 33, 2, 0.85)",
      width: 2.5
    })
  }),
  // 点
  "Point": new Style({
    image: new CircleStyle({
      fill: new Fill({
        color: "rgba(251, 33, 2, 0.5)"
      }),
      radius: 8
    })
  }),
  // 圆形
  "Circle": new Style({
    fill: new Fill({
      color: "rgba(251, 33, 2, 0.10)"
    }),
    stroke: new Stroke({
      color: "rgba(251, 33, 2, 0.85)",
      width: 2
    })
  }),
  // 矩形
  "Box": new Style({
    fill: new Fill({
      color: "rgba(251, 33, 2, 0.10)"
    }),
    stroke: new Stroke({
      color: "rgba(251, 33, 2, 0.85)",
      width: 2
    })
  })
}
/**
 * 几何对象选中样式
 * @type {{MultiPolygon: Style, LineString: Style, Point: Style, Polygon: Style}}
 */
const geometrySelectStyle = {
  // 多边形
  "MultiPolygon": new Style({
    fill: new Fill({
      color: "rgba(251, 33, 2, 0.10)"
    }),
    stroke: new Stroke({
      color: "rgba(0,255,255,0.9)",
      lineDash: [4],
      width: 4.5
    })
  }),
  // 面
  "Polygon": new Style({
    fill: new Fill({
      color: "rgba(251, 33, 2, 0.10)"
    }),
    stroke: new Stroke({
      color: "rgba(0,255,255,0.85)",
      lineDash: [4],
      width: 3.5
    })
  }),
  // 线
  "LineString": new Style({
    stroke: new Stroke({
      color: "rgba(0,255,255,0.85)",
      lineDash: [4],
      width: 3.5
    })
  }),
  // 点
  "Point": new Style({
    image: new CircleStyle({
      fill: new Fill({
        color: "rgba(10,213,253)"
      }),
      radius: 8
    })
  })
}

export {
  geometryDefaultStyle,
  geometrySelectStyle,
  defaultStyle,
  defaultRegionStyle
}
