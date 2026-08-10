const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const source = JSON.parse(
  fs.readFileSync(path.join(root, "assets", "natural-earth-countries.geojson"), "utf8"),
);

function roundCoordinates(value) {
  if (typeof value === "number") return Math.round(value * 1000) / 1000;
  return value.map(roundCoordinates);
}

const features = source.features.map((feature) => {
  const properties = feature.properties;
  return {
    type: "Feature",
    properties: {
      iso3: properties.ISO_A3 !== "-99" ? properties.ISO_A3 : properties.ADM0_A3,
      iso2: properties.ISO_A2 !== "-99" ? properties.ISO_A2 : "",
      name: properties.NAME_EN || properties.ADMIN,
      nameDe: properties.NAME_DE || properties.NAME_EN || properties.ADMIN,
      continent: properties.CONTINENT,
      subregion: properties.SUBREGION,
      labelX: properties.LABEL_X,
      labelY: properties.LABEL_Y,
    },
    geometry: {
      type: feature.geometry.type,
      coordinates: roundCoordinates(feature.geometry.coordinates),
    },
  };
});

const output = `// Generated from Natural Earth 1:110m public-domain country boundaries.\nwindow.WORLD_GEOJSON = ${JSON.stringify({ type: "FeatureCollection", features })};\n`;
fs.writeFileSync(path.join(root, "data", "world-map.js"), output, "utf8");
console.log(`Generated ${features.length} individually addressable country geometries.`);
