const fs = require('node:fs/promises')
const proj4 = require('proj4')
const { mat3 } = require('gl-matrix')
const turf = require('@turf/turf')

class Affine {
  constructor(gcps) {
    if(gcps.length < 3) {
      throw new Error('GCPs must be more than 3')
    }
    const A = mat3.create()
    const B = mat3.create()

    mat3.set(A, ...[
      gcps[0].dest.x, gcps[1].dest.x, gcps[2].dest.x,
      gcps[0].dest.y, gcps[1].dest.y, gcps[2].dest.y,
      1,              1,              1,
    ])
    mat3.transpose(A, A)
    mat3.set(B, ...[
      gcps[0].src.x, gcps[1].src.x, gcps[2].src.x,
      gcps[0].src.y, gcps[1].src.y, gcps[2].src.y,
      1,             1,             1,
    ]);
    mat3.transpose(B, B)
    mat3.invert(B, B)

    const out = mat3.create()
    mat3.multiply(out, A, B)
    this.matrix = out
  }

  transform(point, option = {}) {
    const inputMat3 = mat3.create()
    const outputMat3 = mat3.create()
    mat3.set(inputMat3, ...[
      point.x, 0, 0,
      point.y, 0, 0,
      1,       0, 0,
    ])
    mat3.transpose(inputMat3, inputMat3)

    const lefter_multiplier = mat3.create()
    mat3.copy(lefter_multiplier, this.matrix)
    if(option.inverse) {
      mat3.invert(lefter_multiplier, lefter_multiplier)
    }
    mat3.multiply(outputMat3, lefter_multiplier, inputMat3)
    const x = outputMat3[0]
    const y = outputMat3[1]
    return { x, y }
  }
}

// モルワイデ図法
proj4.defs("ESRI:54009","+proj=moll +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs +type=crs");

// ランベルト
// proj4.defs("lcc","+proj=lcc +lat_0=0 +lon_0=0 +lat_1=30 +lat_2=60 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs +type=crs");

const bbox_epsg3857 = {
  minX: -20037508.34,
  minY: -20048966.1,
  maxX: 20037508.34,
  maxY: 20048966.1,
}
const bbox_esri54009 = {
  minX: -18040095.7,
  minY: -9020047.85,
  maxX: 18040095.7,
  maxY: 9020047.85,
}
// const bbox_esri102012 = {
//   minX: -10910377.01,
//   minY: -1529725.04,
//   maxX: 10910377.01,
//   maxY: 10680818.01,
// }

bbox_epsg3857.width = bbox_epsg3857.maxX - bbox_epsg3857.minX
bbox_epsg3857.height = bbox_epsg3857.maxY - bbox_epsg3857.minY
bbox_esri54009.width = bbox_esri54009.maxX - bbox_esri54009.minX
bbox_esri54009.height = bbox_esri54009.maxY - bbox_esri54009.minY
// bbox_esri102012.width = bbox_esri102012.maxX - bbox_esri102012.minX
// bbox_esri102012.height = bbox_esri102012.maxY - bbox_esri102012.minY
const gcps = []

const bbox_origin = bbox_esri54009

if(bbox_origin.width > bbox_origin.height) {
  const aspectRatio = bbox_origin.height / bbox_origin.width
  gcps.push(...[
    { src: { x: bbox_origin.minX, y: bbox_origin.minY }, dest: { x: bbox_epsg3857.minX, y: bbox_epsg3857.minY + (bbox_epsg3857.height - bbox_epsg3857.width * aspectRatio) / 2 } },
    { src: { x: bbox_origin.maxX, y: bbox_origin.minY }, dest: { x: bbox_epsg3857.maxX, y: bbox_epsg3857.minY + (bbox_epsg3857.height - bbox_epsg3857.width * aspectRatio) / 2 } },
    { src: { x: bbox_origin.maxX, y: bbox_origin.maxY }, dest: { x: bbox_epsg3857.maxX, y: bbox_epsg3857.maxY - (bbox_epsg3857.height - bbox_epsg3857.width * aspectRatio) / 2 } },
  ])
} else {
  const aspectRatio = bbox_origin.width / bbox_origin.height
  gcps.push(...[
    { src: { x: bbox_origin.minX, y: bbox_origin.minY }, dest: { x: bbox_epsg3857.minX + (bbox_epsg3857.width - bbox_epsg3857.height * aspectRatio) / 2, y: bbox_epsg3857.minY } },
    { src: { x: bbox_origin.maxX, y: bbox_origin.minY }, dest: { x: bbox_epsg3857.minX + (bbox_epsg3857.width - bbox_epsg3857.height * aspectRatio) / 2, y: bbox_epsg3857.minY } },
    { src: { x: bbox_origin.maxX, y: bbox_origin.maxY }, dest: { x: bbox_epsg3857.maxX - (bbox_epsg3857.width - bbox_epsg3857.height * aspectRatio) / 2, y: bbox_epsg3857.maxY } },
  ])
}

const affine = new Affine(gcps)



const main = async () => {

  const ne_geojson = JSON.parse(await fs.readFile(process.argv[2], 'utf8'))

  const result = {
    type: 'FeatureCollection',
    features: [],
  }

  for (const feature of ne_geojson.features) {

    const { geometry: { type: geometryType, coordinates }, properties } = feature

    const projected_feature = {
      type: 'Feature',
      properties: { ...properties },
      geometry: {
        type: geometryType,
        coordinates: [],
      },
    }

    switch (geometryType) {
      case 'LineString': {
        for (const coord of coordinates) {
          const shifted_coord = [coord[0] - 135, coord[1]]
          const [src_x, src_y] = proj4('EPSG:4326', 'ESRI:54009', shifted_coord)
          const { x: dest_x, y: dest_y } = affine.transform({ x: src_x, y: src_y })
          const projected_coord = proj4('EPSG:3857', 'EPSG:4326', [dest_x, dest_y])
          projected_feature.geometry.coordinates.push(projected_coord)
        }
        break;
      }
      case 'MultiLineString': {
        for (const coords of coordinates) {
          const projected_coordinates = []
          for (const coord of coords) {
            const shifted_coord = [coord[0] - 135, coord[1]]
            const [src_x, src_y] = proj4('EPSG:4326', 'ESRI:54009', shifted_coord)
            const { x: dest_x, y: dest_y } = affine.transform({ x: src_x, y: src_y })
            const projected_coord = proj4('EPSG:3857', 'EPSG:4326', [dest_x, dest_y])
            projected_coordinates.push(projected_coord)
          }
          projected_feature.geometry.coordinates.push(projected_coordinates)
        }
        break;
      }
      case 'Polygon': {
        for (const coord of coordinates[0]) {
          const shifted_coord = [coord[0] - 135, coord[1]]
          const [src_x, src_y] = proj4('EPSG:4326', 'ESRI:54009', shifted_coord)
          const { x: dest_x, y: dest_y } = affine.transform({ x: src_x, y: src_y })
          const projected_coord = proj4('EPSG:3857', 'EPSG:4326', [dest_x, dest_y])
          projected_feature.geometry.coordinates.push([projected_coord])
        }
        break;
      }

      case 'MultiPolygon': {
        for (const coordinate of coordinates) {
          const projected_coordinates = []
          for (const coords of coordinate) {
            const projected_coords = []
            for (const coord of coords) {
              const shifted_coord = [coord[0] - 135, coord[1]]
              const [src_x, src_y] = proj4('EPSG:4326', 'ESRI:54009', shifted_coord)
              const { x: dest_x, y: dest_y } = affine.transform({ x: src_x, y: src_y })
              const projected_coord = proj4('EPSG:3857', 'EPSG:4326', [dest_x, dest_y])
              projected_coords.push(projected_coord)
            }
            projected_coordinates.push(projected_coords)
          }
          projected_feature.geometry.coordinates.push(projected_coordinates)
        }
        break;
      }
    }

    result.features.push(projected_feature)
  }
  console.log(JSON.stringify(result, null, 2))
}
main()
