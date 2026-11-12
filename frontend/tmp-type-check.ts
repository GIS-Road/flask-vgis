import GeoJSON from 'ol/format/GeoJSON'
import { Polygon } from 'ol/geom'

export function toGeoJson(p: Polygon) {
  return new GeoJSON().writeGeometryObject(p, {
    featureProjection: 'EPSG:4326',
    dataProjection: 'EPSG:4326',
  })
}
