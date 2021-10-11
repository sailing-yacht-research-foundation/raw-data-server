/* eslint-disable no-undef */
const path = require('path');
const puppeteer = require('puppeteer');
const Jimp = require('jimp');

// Need to have the file:// to work
const htmlPath = `file://${path.resolve(
  __dirname,
  '../assets/html/mapView.html',
)}`;
const OG_WIDTH = 1200;
const OG_HEIGHT = 627;
const LOGO_MARGIN_PERCENTAGE = 0.05;
const LOGO_SIZE_PERCENTAGE = 0.1;

exports.createMapScreenshot = async (centerPosition) => {
  const mapboxId = process.env.MAPBOX_ID;
  const accessToken = process.env.MAPBOX_API_KEY;
  if (mapboxId === undefined || accessToken === undefined) {
    throw new Error(
      'Mapbox ID or Access Token is undefined, please set it in environment variables',
    );
  }
  const latLon = [centerPosition[1], centerPosition[0]];
  const browser = await puppeteer.launch({
    // headless: false, // open this for testing
    ignoreHTTPSErrors: true,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      `--window-size=${OG_WIDTH},${OG_HEIGHT}`,
    ],
    defaultViewport: {
      width: OG_WIDTH,
      height: OG_HEIGHT,
    },
  });
  const page = await browser.newPage();

  await page.goto(htmlPath);
  await page.evaluate(initMap, {
    center: latLon,
    zoom: 8,
    tileLayerUrl: `https://api.mapbox.com/styles/v1/${mapboxId}/tiles/{z}/{x}/{y}?access_token=${accessToken}`,
  });

  await page.evaluate(addMarker, latLon);
  await page.waitForNetworkIdle({
    idleTime: 1000, // Need to have at least 1sec, 0ms still show some not fully loaded white tiles
  });
  const imageBuffer = await page.screenshot();

  // Must use supported image type, can't use syrf svg logo
  const [image, logo] = await Promise.all([
    Jimp.read(imageBuffer),
    Jimp.read(path.resolve(__dirname, '../assets/images/logo-light.png')),
  ]);
  logo.resize(image.bitmap.width * LOGO_SIZE_PERCENTAGE, Jimp.AUTO);

  const xMargin = image.bitmap.width * LOGO_MARGIN_PERCENTAGE;
  const yMargin = image.bitmap.height * LOGO_MARGIN_PERCENTAGE;
  const x = image.bitmap.width - logo.bitmap.width - xMargin;
  const y = image.bitmap.height - logo.bitmap.height - yMargin;

  image.composite(logo, x, y, [
    {
      mode: Jimp.BLEND_SCREEN,
      opacitySource: 0.1,
      opacityDest: 1,
    },
  ]);
  const finalImageBuffer = image.getBufferAsync(Jimp.MIME_PNG);

  await browser.close();
  return finalImageBuffer;
};

// Browser run functions, we're not going to test this browser functions
/* istanbul ignore next */
function initMap(config) {
  return new Promise((resolve) => {
    const map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
    }).setView(config.center, config.zoom);
    const tileLayer = L.tileLayer(config.tileLayerUrl).addTo(map);

    window.map = map;

    tileLayer.on('load', resolve);
  });
}

/* istanbul ignore next */
function addMarker(coordinates) {
  L.marker(coordinates, {
    icon: L.divIcon({
      html: '<span style="font-size: 35px; color: #FFF;"><i class="fas fa-map-marker-alt"></i></span>',
      className: 'my-race',
      iconSize: [20, 20],
      iconAnchor: [18, 42],
    }),
  }).addTo(map);
}
