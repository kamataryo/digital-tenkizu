import proj4 from 'proj4'
import { mat3 } from 'gl-matrix'

type Point = { x: number, y: number }
type GCP = { src: Point, dest: Point }

class Affine {
  public matrix: mat3

  constructor(gcps: GCP[]) {
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

  transform(point: Point, option = { inverse: false }) {
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

proj4.defs("ESRI:54009","+proj=moll +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs +type=crs");
const bbox_epsg3857 = {
  minX: -20037508.34,
  minY: -20048966.1,
  maxX: 20037508.34,
  maxY: 20048966.1,
  width: NaN,
  height: NaN,
}
const bbox_esri54009 = {
  minX: -18040095.7,
  minY: -9020047.85,
  maxX: 18040095.7,
  maxY: 9020047.85,
  width: NaN,
  height: NaN,
}
bbox_epsg3857.width = bbox_epsg3857.maxX - bbox_epsg3857.minX
bbox_epsg3857.height = bbox_epsg3857.maxY - bbox_epsg3857.minY
bbox_esri54009.width = bbox_esri54009.maxX - bbox_esri54009.minX
bbox_esri54009.height = bbox_esri54009.maxY - bbox_esri54009.minY
const gcps = []

if(bbox_esri54009.width > bbox_esri54009.height) {
  const aspectRatio = bbox_esri54009.height / bbox_esri54009.width
  gcps.push(...[
    { src: { x: bbox_esri54009.minX, y: bbox_esri54009.minY }, dest: { x: bbox_epsg3857.minX, y: bbox_epsg3857.minY + (bbox_epsg3857.height - bbox_epsg3857.width * aspectRatio) / 2 } },
    { src: { x: bbox_esri54009.maxX, y: bbox_esri54009.minY }, dest: { x: bbox_epsg3857.maxX, y: bbox_epsg3857.minY + (bbox_epsg3857.height - bbox_epsg3857.width * aspectRatio) / 2 } },
    { src: { x: bbox_esri54009.maxX, y: bbox_esri54009.maxY }, dest: { x: bbox_epsg3857.maxX, y: bbox_epsg3857.maxY - (bbox_epsg3857.height - bbox_epsg3857.width * aspectRatio) / 2 } },
  ])
} else {
  const aspectRatio = bbox_esri54009.width / bbox_esri54009.height
  gcps.push(...[
    { src: { x: bbox_esri54009.minX, y: bbox_esri54009.minY }, dest: { x: bbox_epsg3857.minX + (bbox_epsg3857.width - bbox_epsg3857.height * aspectRatio) / 2, y: bbox_epsg3857.minY } },
    { src: { x: bbox_esri54009.maxX, y: bbox_esri54009.minY }, dest: { x: bbox_epsg3857.minX + (bbox_epsg3857.width - bbox_epsg3857.height * aspectRatio) / 2, y: bbox_epsg3857.minY } },
    { src: { x: bbox_esri54009.maxX, y: bbox_esri54009.maxY }, dest: { x: bbox_epsg3857.maxX - (bbox_epsg3857.width - bbox_epsg3857.height * aspectRatio) / 2, y: bbox_epsg3857.maxY } },
  ])
}

const affine = new Affine(gcps)


const transform = ([ x, y ]: number[], x_shift = 0) => {
  const shifted_coord = [x + x_shift, y]
  const [src_x, src_y] = proj4('EPSG:4326', 'ESRI:54009', shifted_coord)
  const { x: dest_x, y: dest_y } = affine.transform({ x: src_x, y: src_y })
  const projected_coord = proj4('EPSG:3857', 'EPSG:4326', [dest_x, dest_y])
  return [projected_coord[0], projected_coord[1]]
}

const latLines = Array.from({ length: 180 / 2 }, (_, degree) => ({
  type: 'Feature',
  properties: {
    isLat: true,
    isLng: false,
    degree: degree * 2 - 90,
  },
  geometry: {
    type: 'LineString',
    coordinates: [
      transform([-180, degree * 2 - 90]),
      transform([180, degree * 2 - 90]),
    ],
  },
}))
const lngLines = Array.from({ length: 1 + 360 / 2 }, (_, degree) => ({
  type: 'Feature',
  properties: {
    isLat: false,
    isLng: true,
    degree: degree * 2 - 180,
  },
  geometry: {
    type: 'LineString',
    coordinates: Array.from(
      { length: 180 },
      // 地球を回って変にならないように気持ちオフセットする
      (_, interpolate) => (transform([degree * 2 - 180 + (degree * 2 - 180 > 0 ? 0.0001 : -0.0001), interpolate - 90], -135)),
    )
  },
}))

const latlngLines = {
  type: 'FeatureCollection',
  features: [...latLines, ...lngLines],
}

const observatories = {
  石垣島: {
    address: "沖縄県石垣市",
    lat: 24.502184650952103,
    lng: 124.2156142178602,
  },
  那覇: {
    address: "沖縄県那覇市",
    lat: 26.43498095633204,
    lng: 127.7472308717056,
  },
  南大東島: {
    address: "沖縄県島尻郡南大東村",
    lat: 25.973688361523187,
    lng: 130.91701862516067,
  },
  名瀬: {
    address: "鹿児島県奄美市（奄美大島）",
    lat: 28.234847988593287,
    lng: 129.28130457117481,
  },
  鹿児島: {
    address: "鹿児島県鹿児島市",
    lat: 31.73262855645457,
    lng: 130.60635696535354,
  },
  福江: {
    address: "長崎県五島市（五島列島・福江島）",
    lat: 32.88860359373204,
    lng: 128.87524012779664,
  },
  厳原: {
    address: "長崎県対馬市（対馬）",
    lat: 34.277294968814914,
    lng: 129.23856094555464,
  },
  足摺岬: {
    address: "高知県土佐清水市",
    lat: 32.88860359373204,
    lng: 132.87176912314425,
  },
  室戸岬: {
    address: "高知県室戸市",
    lat: 33.38967716968405,
    lng: 134.19682151732542,
  },
  松山: {
    address: "愛媛県松山市",
    lat: 33.83463823467079,
    lng: 132.70079462067088,
  },
  浜田: {
    address: "島根県浜田市",
    lat: 34.8580492342052,
    lng: 132.10238386200814,
  },
  西郷: {
    address: "島根県隠岐郡隠岐の島町（隠岐島島後島）",
    lat: 36.2489821780695,
    lng: 133.12823087685786,
  },
  大阪: {
    address: "大阪府大阪市",
    lat: 34.70006419255519,
    lng: 135.41501484745743,
  },
  潮岬: {
    address: "和歌山県東牟婁郡串本町",
    lat: 33.62134359648279,
    lng: 135.71422022678883,
  },
  八丈島: {
    address: "東京都八丈町",
    lat: 33.157391691855665,
    lng: 139.81760828618314,
  },
  大島: {
    address: "東京都大島町",
    lat: 34.82296759662793,
    lng: 139.39017202999617,
  },
  御前崎: {
    address: "静岡県御前崎市",
    lat: 34.73519811909274,
    lng: 138.1506068870553,
  },
  銚子: {
    address: "千葉県銚子市",
    lat: 35.730212612327094,
    lng: 140.77933986260393,
  },
  前橋: {
    address: "群馬県前橋市",
    lat: 36.610086426308314,
    lng: 139.04822302504704,
  },
  小名浜: {
    address: "福島県いわき市",
    lat: 37.05193359385008,
    lng: 140.98275297409828,
  },
  輪島: {
    address: "石川県輪島市",
    lat: 37.40819294673679,
    lng: 136.75689237076864,
  },
  相川: {
    address: "新潟県佐渡市（佐渡島）",
    lat: 38.09608771054377,
    lng: 138.34780459790454,
  },
  仙台: {
    address: "宮城県仙台市",
    lat: 38.34995975527883,
    lng: 140.85846295635332,
  },
  宮古: {
    address: "岩手県宮古市",
    lat: 39.60598184043687,
    lng: 141.95221511250804,
  },
  秋田: {
    address: "秋田県秋田市",
    lat: 39.77813312676864,
    lng: 140.08786484633384,
  },
  函館: {
    address: "北海道函館市",
    lat: 41.976857708757706,
    lng: 140.70931493505856,
  },
  浦河: {
    address: "北海道浦河郡浦河町",
    lat: 42.19822927653874,
    lng: 142.59852320478262,
  },
  根室: {
    address: "北海道根室市",
    lat: 43.25728820454006,
    lng: 145.3577615987199,
  },
  稚内: {
    address: "北海道稚内市",
    lat: 45.44328227615645,
    lng: 141.72849308056794,
  },
  ポロナイスク: {
    address: "ロシア連邦サハリン州、南樺太地域",
    lat: 46.770242790021626,
    lng: 142.67309721542927,
  },
  セベロクリリスク: {
    address: "ロシア連邦サハリン州、千島列島",
    lat: 50.843629394732716,
    lng: 156.0964191319136,
  },
  ハバロフスク: {
    address: "ロシア連邦ハバロフスク地方",
    lat: 48.85651334735263,
    lng: 134.94225811171953,
  },
  ルドナヤプリスタニ: {
    address: "ロシア連邦沿海地方",
    lat: 44.66744285290855,
    lng: 136.17188341331018,
  },
  ウラジオストク: {
    address: "ロシア連邦沿海地方",
    lat: 43.288250447019635,
    lng: 131.9152713540576,
  },
  ソウル: {
    address: "大韓民国ソウル特別市",
    lat: 37.611191378295686,
    lng: 126.56339069478355,
  },
  ウルルン島: {
    address: "大韓民国慶尚北道",
    lat: 37.453271526567335,
    lng: 130.84489522221975,
  },
  プサン: {
    address: "大韓民国釜山広域市",
    lat: 35.653774130281946,
    lng: 129.32645466307014,
  },
  モッポ: {
    address: "大韓民国全羅南道",
    lat: 34.67702579394532,
    lng: 126.28957354477222,
  },
  チェジュ島: {
    address: "大韓民国済州特別自治道",
    lat: 33.46048525685087,
    lng: 126.6878530356974,
  },
  台北: {
    address: "台湾",
    lat: 25.160435215074358,
    lng: 121.54034331198778,
  },
  恒春: {
    address: "台湾",
    lat: 22.160466342288288,
    lng: 120.72703918816114,
  },
  長春: {
    address: "中華人民共和国吉林省",
    lat: 44.017894314122316,
    lng: 124.9291104945957,
  },
  北京: {
    address: "中華人民共和国北京市",
    lat: 39.4697703209452,
    lng: 115.96017335129324,
  },
  大連: {
    address: "中華人民共和国遼寧省",
    lat: 39.19017191077086,
    lng: 121.56293509320466,
  },
  チンタオ: {
    address: "中華人民共和国山東省",
    lat: 36.20567930528162,
    lng: 120.36557068868348,
  },
  上海: {
    address: "中華人民共和国上海市",
    lat: 31.035501319127675,
    lng: 121.83403646781358,
  },
  武漢: {
    address: "中華人民共和国湖北省",
    lat: 30.84172756597421,
    lng: 113.99468838540093,
  },
  アモイ: {
    address: "中華人民共和国福建省",
    lat: 24.55995264364435,
    lng: 118.05065468763581,
  },
  香港: {
    address: "中華人民共和国香港特別行政区",
    lat: 22.317483498946032,
    lng: 114.25059934599591,
  },
  バスコ: {
    address: "フィリピン共和国",
    lat: 20.597022867633314,
    lng: 121.97395506738258,
  },
  マニラ: {
    address: "フィリピン共和国",
    lat: 14.390372114282286,
    lng: 120.90583140372979,
  },
  父島: {
    address: "東京都小笠原村",
    lat: 27.250797245177665,
    lng: 142.1491727120793,
  },
  南鳥島: {
    address: "東京都小笠原村",
    lat: 24.342917119931585,
    lng: 153.926803466308,
  },
}

const subLocations = {
  ラワーグ: {
    lat: 18.195278,
    lng: 120.591944,
  },
  バグァン島: {
    lat: 18.133333,
    lng: 145.8,
  },
  サイパン島: {
    lat: 15.180833,
    lng: 145.755833
  },
  南昌: {
    lat: 28.683333,
    lng: 115.883333,
  },
  スワトワ: {
    lat: 23.366667,
    lng: 116.7},
  温州: {
    lat: 27.999167,
    lng: 120.656111,
  },
  台中: {
    lat: 24.15,
    lng: 120.666667,
  },
  沖の鳥島: {
    lat: 20.425549,
    lng: 136.081151,
  },
  硫黄島: {
    lat: 24.758056,
    lng: 141.287222,
  },
  天津: {
    lat: 39.123611,
    lng: 117.198056
  },
  徐州: {
    lat: 34.266667,
    lng: 117.166667,
  },
  南京: {
    lat: 32.05,
    lng: 118.766667,
  },
  煙台: {
    lat: 37.4,
    lng: 121.266667,
  },
  杭州: {
    lat: 30.25,
    lng: 120.166667,
  },
  インチョン: {
    lat: 37.483333,
    lng: 126.633333,
  },
  ポハン: {
    lat: 36.019,
    lng: 129.343472,
  },
  鳥島: {
    lat: 30.483889,
    lng: 140.303056,
  },
  ハイラル: {
    lat: 49.2115,
    lng: 119.730164,
  },
  瀋陽: {
    lat: 41.795556,
    lng: 123.448056,
  },
  営口: {
    lat: 40.6723064,
    lng: 122.2467506,
  },
  チタ: {
    lat: 52.05,
    lng: 113.466667,
  },
  アレクサンドロフコフ: {
    lat: 50.9,
    lng: 142.15,
  },
  オゼルナヤ: {
    lat: 51.4789404,
    lng: 156.5052645
  },
}

const observatoryPoints = {
  type: 'FeatureCollection',
  features: Object.entries(observatories).map(([name, { address, lat, lng }]) => ({
    type: 'Feature',
    properties: {
      name,
      address,
    },
    geometry: {
      type: 'Point',
      coordinates: transform([lng, lat], -135),
    },
  })),
}

const subLocationPoints = {
  type: 'FeatureCollection',
  features: Object.entries(subLocations).map(([name, { lat, lng }]) => ({
    type: 'Feature',
    properties: {
      name,
    },
    geometry: {
      type: 'Point',
      coordinates: transform([lng, lat], -135),
    },
  })),
}

export const style = {
  version: 8,
  name: "digital-tenkizu",
  sprite: "https://api.geolonia.com/v1/sprites/basic-v1",
  glyphs: "https://glyphs.geolonia.com/{fontstack}/{range}.pbf",
  sources: {
    ne: { type: 'vector', tiles: ['http://127.0.0.1:8080/tiles/{z}/{x}/{y}.pbf'], maxzoom: 5 },
    'latlng-lines': { type: 'geojson', data: latlngLines },
    'observatory-points': { type: 'geojson', data: observatoryPoints },
    'sub-location-points': { type: 'geojson', data: subLocationPoints },
  },
  layers: [
    {
      id: 'ne-land',
      source: "ne",
      "source-layer": "ne_land",
      type: "fill",
      paint: {
        "fill-color": "rgb(248, 221, 203)",
        "fill-opacity": 1,
      },
    },
    {
      id: 'ne-land-outline',
      source: "ne",
      "source-layer": "ne_land",
      type: "line",
      paint: {
        "line-color": "rgb(225, 111, 76)",
        "line-opacity": 1,
      },
    },
    {
      id: 'ne-river',
      source: "ne",
      "source-layer": "ne_river",
      type: "line",
      filter: [
        "any",
        ["==", ["get", "name_ja"], "長江"],
        ["==", ["get", "name_ja"], "黄河"],
        ["==", ["get", "name_ja"], "贛江"],
        ["==", ["get", "name_ja"], "漢江"],
        ["==", ["get", "name_ja"], "遼河"],
        ["==", ["get", "name_ja"], "西遼河"],
        ["==", ["get", "name_ja"], "シラムレン川"],
        ["==", ["get", "name_ja"], "アムール川"],
        ["==", ["get", "name_ja"], "松花江"],
        ["==", ["get", "name_ja"], "インゴダ川"],
        ["==", ["get", "name_ja"], "シルカ川"],
        ["==", ["get", "name_ja"], "オノン川"],
      ],
      paint: {
        "line-color": "rgb(225, 111, 76)",
        "line-opacity": 1,
      },
    },
    {
      id: 'latlng-lines',
      type: 'line',
      source: 'latlng-lines',
      paint: {
        "line-color": "rgb(225, 111, 76)",
        'line-width': [
          'case',
          [
            '==',
            ['%', ['get', 'degree'], 10],
            0,
          ],
          2,
          1,
        ],
      },
    },
    {
      id: 'observatory-points-halo',
      type: 'circle',
      source: 'observatory-points',
      paint: {
        'circle-radius': 10,
        'circle-color': 'rgb(225, 111, 76)',
      },
    },
    {
      id: 'observatory-points',
      type: 'circle',
      source: 'observatory-points',
      paint: {
        'circle-radius': 8,
        'circle-color': 'white',
      },
    },
    {
      id: 'observatory-points-name',
      type: 'symbol',
      source: 'observatory-points',
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 16,
        'text-offset': [0, 1],
        'text-variable-anchor': ['bottom', 'top', 'left', 'right'],
      },
      paint: {
        'text-color': 'rgb(225, 111, 76)',
        'text-halo-color': 'white',
        'text-halo-width': 1,
      }
    },
    {
      id: 'sub-location-points',
      type: 'circle',
      source: 'sub-location-points',
      paint: {
        'circle-radius': 4,
        'circle-color': 'rgb(225, 111, 76)',
      },
    },
    {
      id: 'sub-location-points-name',
      type: 'symbol',
      source: 'sub-location-points',
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 16,
        'text-offset': [0, 1],
        'text-variable-anchor': ['bottom', 'top', 'left', 'right'],
      },
      paint: {
        'text-color': 'rgb(225, 111, 76)',
        'text-halo-color': 'white',
        'text-halo-width': 1,
      }
    },
  ],
}

export const maxBounds = [
  [100, 8],
  [187, 58],
].map(([x, y]) => transform([x, y], -135))

export const center = transform([135, 35], -135)
