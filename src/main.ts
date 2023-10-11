import { style } from './assets'

const main = async () => {
  // @ts-ignore
  const map = new window.geolonia.Map({ container: '#map', style })
  await map.once('load')
  map.on('click', (e:any) => {
    console.log(`lat: ${e.lngLat.lat},\n    lng: ${e.lngLat.lng},`)
  })
}
main()
