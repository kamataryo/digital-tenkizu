
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
      [-180, degree * 2 - 90],
      [180, degree * 2 - 90],
    ],
  },
}))
const lngLines = Array.from({ length: 360 / 2 }, (_, degree) => ({
  type: 'Feature',
  properties: {
    isLat: false,
    isLng: true,
    degree: degree * 2 - 180,
  },
  geometry: {
    type: 'LineString',
    coordinates: [
      [degree * 2 - 180, -90],
      [degree * 2 - 180, 90],
    ],
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
      coordinates: [lng, lat],
    },
  })),
}

export const style = {
  version: 8,
  name: "digital-tenkizu",
  sprite: "https://api.geolonia.com/v1/sprites/basic-v1",
  glyphs: "https://glyphs.geolonia.com/{fontstack}/{range}.pbf",
  sources: {
    ne: { type: 'vector', tiles: ['http://127.0.0.1:8080/tiles/{z}/{x}/{y}.pbf'] },
    'latlng-lines': { type: 'geojson', data: latlngLines },
    'observatory-points': { type: 'geojson', data: observatoryPoints },
  },
  layers: [
    {
      id: 'ne-land',
      source: "ne",
      "source-layer": "ne_10m_land",
      type: "fill",
      paint: {
        "fill-color": "rgb(248, 221, 203)",
        "fill-opacity": 1,
      },
    },
    {
      id: 'ne-land-outline',
      source: "ne",
      "source-layer": "ne_10m_land",
      type: "line",
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
        'text-offset': [0, 1.3],
      },
      paint: {
        'text-color': 'rgb(225, 111, 76)',
      }
    }
  ],
}
