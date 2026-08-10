const fs = require("fs");
const path = require("path");
const vm = require("vm");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const outputPath = process.argv[2] || path.join(root, "map-preview.png");
const requestedLevel = String(process.argv[3] || "world").toLowerCase();
const requestedRegion = String(process.argv[4] || "global").toLowerCase();
const validLevels = new Set(["world", "regional", "country"]);
const regionViewBoxes = {
  global: [0, 0, 1200, 600],
  "north-america": [15, 45, 430, 225],
  "south-america": [250, 220, 290, 285],
  europe: [530, 42, 250, 170],
  "southern-africa": [590, 275, 190, 165],
  "southeast-asia": [860, 170, 285, 205],
  caribbean: [270, 188, 190, 112],
  oceania: [920, 245, 280, 235],
};

if (!validLevels.has(requestedLevel)) {
  throw new Error(`Unbekannte LOD-Stufe "${requestedLevel}". Erlaubt sind world, regional und country.`);
}
if (!regionViewBoxes[requestedRegion]) {
  throw new Error(`Unbekannte Region "${requestedRegion}". Erlaubt sind ${Object.keys(regionViewBoxes).join(", ")}.`);
}

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, "data", "world-map.js"), "utf8"), context);
vm.runInContext(fs.readFileSync(path.join(root, "data", "countries.js"), "utf8"), context);

const { WORLD_GEOJSON, COUNTRIES, SMALL_COUNTRY_MARKERS = [] } = context.window;
const featureByIso3 = new Map(WORLD_GEOJSON.features.map((feature) => [feature.properties.iso3, feature]));
const worldRoadCountries = new Set([
  "USA", "CAN", "MEX",
  "BRA", "ARG",
  "ZAF",
  "NOR", "SWE", "FIN", "GBR", "ESP", "FRA", "DEU", "POL", "ITA", "UKR", "TUR",
  "AUS", "JPN",
]);

const palette = {
  ocean: "#09131a",
  border: "#17242c",
  left: "#315f78",
  right: "#7c4b49",
  asphalt: "#10171c",
  white: "#f5f6f2",
  yellow: "#f1c84a",
  green: "#4eb987",
};

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function project([longitude, latitude]) {
  return [((longitude + 180) / 360) * 1200, ((90 - latitude) / 180) * 600];
}

function ringToPath(ring) {
  let previousLongitude = null;
  return ring.map((coordinate, index) => {
    const [x, y] = project(coordinate);
    const jumpsDateline = previousLongitude !== null && Math.abs(coordinate[0] - previousLongitude) > 180;
    previousLongitude = coordinate[0];
    return `${index === 0 || jumpsDateline ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ") + " Z";
}

function geometryToPath(geometry) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.flatMap((polygon) => polygon.map(ringToPath)).join(" ");
}

function pointInRing([x, y], ring) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const [currentX, currentY] = ring[index];
    const [previousX, previousY] = ring[previous];
    const crosses = (currentY > y) !== (previousY > y)
      && x < ((previousX - currentX) * (y - currentY)) / (previousY - currentY) + currentX;
    if (crosses) inside = !inside;
  }
  return inside;
}

function pointInPolygon(point, rings) {
  return pointInRing(point, rings[0]) && rings.slice(1).every((hole) => !pointInRing(point, hole));
}

function horizontalSpanAt(ring, y, x) {
  const intersections = [];
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const [x1, y1] = ring[previous];
    const [x2, y2] = ring[index];
    if ((y1 > y) === (y2 > y)) continue;
    intersections.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
  }
  intersections.sort((left, right) => left - right);
  for (let index = 0; index + 1 < intersections.length; index += 2) {
    if (x >= intersections[index] && x <= intersections[index + 1]) return intersections[index + 1] - intersections[index];
  }
  return 0;
}

function polygonInteriorPoint(rings, bounds) {
  const outer = rings[0];
  let areaTwice = 0;
  let centroidX = 0;
  let centroidY = 0;
  for (let index = 0; index < outer.length - 1; index += 1) {
    const [x1, y1] = outer[index];
    const [x2, y2] = outer[index + 1];
    const cross = x1 * y2 - x2 * y1;
    areaTwice += cross;
    centroidX += (x1 + x2) * cross;
    centroidY += (y1 + y2) * cross;
  }
  if (Math.abs(areaTwice) > 0.001) {
    const centroid = [centroidX / (3 * areaTwice), centroidY / (3 * areaTwice)];
    if (pointInPolygon(centroid, rings)) return centroid;
  }

  const scanLines = [0.5, 0.42, 0.58, 0.34, 0.66].map((ratio) => bounds.minY + (bounds.maxY - bounds.minY) * ratio);
  for (const y of scanLines) {
    const intersections = [];
    for (let index = 0, previous = outer.length - 1; index < outer.length; previous = index++) {
      const [x1, y1] = outer[previous];
      const [x2, y2] = outer[index];
      if ((y1 > y) === (y2 > y)) continue;
      intersections.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
    }
    intersections.sort((left, right) => left - right);
    let best = null;
    for (let index = 0; index + 1 < intersections.length; index += 2) {
      const candidate = [(intersections[index] + intersections[index + 1]) / 2, y];
      const width = intersections[index + 1] - intersections[index];
      if (pointInPolygon(candidate, rings) && (!best || width > best.width)) best = { point: candidate, width };
    }
    if (best) return best.point;
  }
  return [(bounds.minX + bounds.maxX) / 2, (bounds.minY + bounds.maxY) / 2];
}

function geometryBounds(geometry, anchorCoordinates) {
  const [anchorLongitude] = anchorCoordinates;
  const [anchorX, anchorY] = project(anchorCoordinates);
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  const candidates = polygons.map((polygon) => {
    const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    const projectedRings = polygon.map((ring) => ring.map((coordinate) => {
        let longitude = coordinate[0];
        while (longitude - anchorLongitude > 180) longitude -= 360;
        while (longitude - anchorLongitude < -180) longitude += 360;
        const x = ((longitude + 180) / 360) * 1200;
        const y = ((90 - coordinate[1]) / 180) * 600;
        bounds.minX = Math.min(bounds.minX, x);
        bounds.minY = Math.min(bounds.minY, y);
        bounds.maxX = Math.max(bounds.maxX, x);
        bounds.maxY = Math.max(bounds.maxY, y);
        return [x, y];
      }));
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    const distanceX = Math.max(bounds.minX - anchorX, 0, anchorX - bounds.maxX);
    const distanceY = Math.max(bounds.minY - anchorY, 0, anchorY - bounds.maxY);
    const anchorInside = pointInPolygon([anchorX, anchorY], projectedRings);
    const [sampleX, sampleY] = anchorInside
      ? [anchorX, anchorY]
      : polygonInteriorPoint(projectedRings, bounds);
    const sampleHorizontalSpan = horizontalSpanAt(projectedRings[0], sampleY, sampleX);
    return {
      width,
      height,
      area: width * height,
      anchorDistance: Math.hypot(distanceX, distanceY),
      anchorInside,
      sampleX,
      sampleY,
      sampleHorizontalSpan,
    };
  });

  return candidates.sort((left, right) => Number(right.anchorInside) - Number(left.anchorInside)
    || left.anchorDistance - right.anchorDistance
    || right.area - left.area)[0];
}

function markingColor(name) {
  return { white: palette.white, yellow: palette.yellow, green: palette.green }[name] || "transparent";
}

function patternLines(offset, length, definition, role, originX, originY) {
  if (!definition || definition.style === "none" || definition.color === "none") return "";
  const stroke = markingColor(definition.color);
  if (stroke === "transparent") return "";
  const strokeWidth = role === "edge" ? 1.35 : 1.7;
  const dashPattern = length < 18 ? "3.5 2.5" : "6 4";
  const line = (lineOffset, dashed) => `<line x1="${originX - length / 2}" y1="${originY + lineOffset}" x2="${originX + length / 2}" y2="${originY + lineOffset}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round"${dashed ? ` stroke-dasharray="${dashPattern}"` : ""}/>`;

  if (definition.style === "double-solid" || definition.style === "double-dashed") {
    const spacing = Math.min(definition.spacing || 0.95, 1.15);
    const dashed = definition.style === "double-dashed";
    return line(offset - spacing, dashed) + line(offset + spacing, dashed);
  }
  if (definition.style === "solid-dashed") return line(offset - 0.95, false) + line(offset + 0.95, true);
  return line(offset, definition.style === "dashed");
}

function patternBand(length, bandColor, originX, originY) {
  if (!bandColor) return "";
  const stroke = markingColor(bandColor);
  if (stroke === "transparent") return "";
  return `<line x1="${originX - length / 2}" y1="${originY}" x2="${originX + length / 2}" y2="${originY}" stroke="${stroke}" stroke-width="4.5" stroke-linecap="butt"/>`;
}

function roadDisplayMode(country, bounds) {
  if (!bounds || !country.roadMapPattern || country.roadMapPattern.confidence === "unknown") return null;
  const pattern = country.roadMapPattern;
  const verified = country.roadVerification?.status === "cross-checked";
  const highConfidence = pattern.confidence === "high" || pattern.confidence === "medium-high";
  const scope = pattern.scope || "marked-main-road";
  const hasVisibleLines = [pattern.center, pattern.leftEdge, pattern.rightEdge]
    .some((part) => part?.color !== "none" && part?.style !== "none");
  if (!hasVisibleLines) return null;

  if (requestedLevel === "world") {
    const worldScope = scope === "national-default" || scope === "marked-main-road";
    return verified
      && highConfidence
      && worldScope
      && pattern.showOnWorld !== false
      && worldRoadCountries.has(country.iso3)
      && bounds.width >= 10
      && bounds.height >= 6
      ? "verified"
      : null;
  }
  if (requestedLevel === "regional") {
    const regionalScope = scope !== "road-class" && scope !== "special-variant";
    if (bounds.width < 16 || bounds.height < 8 || bounds.area < 150) return null;
    if (verified && regionalScope) return "verified";
    return country.detailLevel === "priorität" ? "neutral" : null;
  }
  if (bounds.width < 4 || bounds.height < 3 || bounds.area < 18) return null;
  if (verified) return "verified";
  return "neutral";
}

const definitions = [];
const fills = [];
const overlays = [];
const borders = [];
const markers = [];

WORLD_GEOJSON.features.forEach((feature) => {
  const country = COUNTRIES[feature.properties.iso3];
  if (!country) return;
  const d = geometryToPath(feature.geometry);
  definitions.push(`<clipPath id="clip-${country.iso3}" clipPathUnits="userSpaceOnUse"><path d="${d}"/></clipPath>`);
  fills.push(`<path d="${d}" fill="${country.traffic === "left" ? palette.left : palette.right}"/>`);
  borders.push(`<path d="${d}" fill="none" stroke="${palette.border}" stroke-width="0.7"/>`);
});

Object.values(COUNTRIES).forEach((country) => {
  const feature = featureByIso3.get(country.iso3);
  if (!feature || !country.coordinates) return;
  const bounds = geometryBounds(feature.geometry, country.coordinates);
  const displayMode = roadDisplayMode(country, bounds);
  if (!displayMode) return;

  const pattern = country.roadMapPattern;
  const anchorX = bounds.sampleX;
  const anchorY = bounds.sampleY;
  const minimumSurfaceWidth = requestedLevel === "world" && country.continent === "Europa" ? 8 : requestedLevel === "country" ? 8 : 10;
  const maximumFittedWidth = bounds.sampleHorizontalSpan * 0.82;
  const minimumVisibleWidth = requestedLevel === "world" ? 6 : requestedLevel === "regional" ? 5 : 3.5;
  if (maximumFittedWidth < minimumVisibleWidth) return;
  const surfaceWidth = Math.min(44, maximumFittedWidth, Math.max(minimumSurfaceWidth, bounds.width * 0.24));
  const lineLength = Math.max(5, surfaceWidth - 3);
  const stripHeight = clamp(bounds.height * 0.16, 5.5, 9);
  const edgeOffset = stripHeight * 0.3;
  const radius = Math.min(2.4, stripHeight * 0.3);
  const surface = `<rect x="${anchorX - surfaceWidth / 2}" y="${anchorY - stripHeight / 2}" width="${surfaceWidth}" height="${stripHeight}" rx="${radius}" fill="${palette.asphalt}" fill-opacity="0.26"/>`;
  if (displayMode === "neutral") {
    const neutral = `<line x1="${anchorX - lineLength * 0.28}" y1="${anchorY}" x2="${anchorX + lineLength * 0.28}" y2="${anchorY}" stroke="#d9e1e5" stroke-opacity="0.72" stroke-width="1.35" stroke-linecap="round" stroke-dasharray="3 3"/>`;
    overlays.push(`<g clip-path="url(#clip-${country.iso3})">${surface}${neutral}</g>`);
    return;
  }
  const band = patternBand(lineLength, pattern.center.bandColor, anchorX, anchorY);
  const leftEdge = patternLines(-edgeOffset, lineLength, pattern.leftEdge, "edge", anchorX, anchorY);
  const center = patternLines(0, lineLength, pattern.center, "center", anchorX, anchorY);
  const centerInner = pattern.center.inner ? patternLines(0, lineLength, pattern.center.inner, "center", anchorX, anchorY) : "";
  const rightEdge = patternLines(edgeOffset, lineLength, pattern.rightEdge, "edge", anchorX, anchorY);
  overlays.push(`<g clip-path="url(#clip-${country.iso3})">${surface}${band}${leftEdge}${center}${centerInner}${rightEdge}</g>`);
});

SMALL_COUNTRY_MARKERS.forEach((marker) => {
  if (featureByIso3.has(marker.iso3)) return;
  const country = COUNTRIES[marker.iso3];
  if (!country) return;
  const [x, y] = project([marker.lon, marker.lat]);
  const fill = country.traffic === "left" ? palette.left : palette.right;
  markers.push(`<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="1.2" fill="${fill}" stroke="#9aa6ad" stroke-width="0.35"/>`);
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="${regionViewBoxes[requestedRegion].join(" ")}"><rect width="1200" height="600" fill="${palette.ocean}"/><defs>${definitions.join("")}</defs><g>${fills.join("")}</g><g>${overlays.join("")}</g><g>${borders.join("")}</g><g>${markers.join("")}</g></svg>`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
sharp(Buffer.from(svg)).png().toFile(outputPath).then(() => {
  console.log(`${outputPath} (${requestedLevel}, ${requestedRegion}, ${overlays.length} Straßenmuster insgesamt)`);
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
