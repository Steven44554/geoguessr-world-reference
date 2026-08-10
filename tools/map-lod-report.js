const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, "data", "world-map.js"), "utf8"), context);
vm.runInContext(fs.readFileSync(path.join(root, "data", "countries.js"), "utf8"), context);

function project([longitude, latitude]) {
  return [((longitude + 180) / 360) * 1200, ((90 - latitude) / 180) * 600];
}

function bounds(geometry, anchorCoordinates) {
  const [anchorLongitude] = anchorCoordinates;
  const [anchorX, anchorY] = project(anchorCoordinates);
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  const candidates = polygons.map((polygon) => {
    const result = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    polygon.flat().forEach((coordinate) => {
      let longitude = coordinate[0];
      while (longitude - anchorLongitude > 180) longitude -= 360;
      while (longitude - anchorLongitude < -180) longitude += 360;
      const [x, y] = project([longitude, coordinate[1]]);
      result.minX = Math.min(result.minX, x);
      result.minY = Math.min(result.minY, y);
      result.maxX = Math.max(result.maxX, x);
      result.maxY = Math.max(result.maxY, y);
    });
    const width = result.maxX - result.minX;
    const height = result.maxY - result.minY;
    const distanceX = Math.max(result.minX - anchorX, 0, anchorX - result.maxX);
    const distanceY = Math.max(result.minY - anchorY, 0, anchorY - result.maxY);
    return { width, height, area: width * height, anchorDistance: Math.hypot(distanceX, distanceY) };
  });
  return candidates.sort((left, right) => left.anchorDistance - right.anchorDistance || right.area - left.area)[0];
}

const rows = context.window.WORLD_GEOJSON.features.map((feature) => {
  const country = context.window.COUNTRIES[feature.properties.iso3];
  const size = bounds(feature.geometry, country.coordinates);
  return {
    iso3: country.iso3,
    name: country.name,
    continent: country.continent,
    width: Number(size.width.toFixed(1)),
    height: Number(size.height.toFixed(1)),
    minDimension: Number(Math.min(size.width, size.height).toFixed(1)),
    area: Math.round(size.width * size.height),
  };
});

for (const continent of ["Europa", "Nordamerika", "Südamerika", "Afrika", "Asien", "Ozeanien"]) {
  console.log(`\n${continent}`);
  console.log(rows
    .filter((row) => row.continent === continent)
    .sort((left, right) => right.area - left.area)
    .slice(0, 30)
    .map((row) => `${row.iso3}:${row.width}x${row.height}/a${row.area}`)
    .join(" "));
}
