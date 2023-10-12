import { style, maxBounds, center } from './assets'

const main = async () => {
  // @ts-ignore
  const map = new window.geolonia.Map({
    container: '#map',
    style,
    maxBounds,
    maxZoom: 8,
    zoom: 4.5,
    center,
    localIdeographFontFamily: ['serif'],
  })
  await map.once('load')
}
main()

