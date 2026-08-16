(function initializeAtlas() {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const countries = window.COUNTRIES || {};
  const countryList = Object.values(countries).sort((a, b) => a.name.localeCompare(b.name, "de"));
  const importanceOrder = window.COUNTRY_IMPORTANCE_ORDER || { "VERY HIGH": 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

  const elements = {
    map: document.getElementById("worldMap"),
    viewport: document.getElementById("mapViewport"),
    graticule: document.getElementById("graticule"),
    clipPaths: document.getElementById("countryClipPaths"),
    paths: document.getElementById("countryPaths"),
    roadLines: document.getElementById("roadLineOverlays"),
    borders: document.getElementById("countryBorders"),
    markers: document.getElementById("smallCountryMarkers"),
    tooltip: document.getElementById("mapTooltip"),
    panel: document.getElementById("countryPanel"),
    search: document.getElementById("searchInput"),
    searchSummary: document.getElementById("searchSummary"),
    filterDashboard: document.getElementById("filterDashboard"),
    filterPanel: document.getElementById("filterPanel"),
    filterResultCount: document.getElementById("filterResultCount"),
    activeFilterCount: document.getElementById("activeFilterCount"),
    activeFilterSummary: document.getElementById("activeFilterSummary"),
    filterScrollHint: document.getElementById("filterScrollHint"),
    filterCategoryPosition: document.getElementById("filterCategoryPosition"),
    allFilterChip: document.getElementById("allFilterChip"),
    filters: document.getElementById("filters"),
    matcherButton: document.getElementById("matcherButton"),
    roadMatcher: document.getElementById("roadMatcher"),
    roadScreenshot: document.getElementById("roadScreenshot"),
    matcherPreview: document.getElementById("matcherPreview"),
    matcherPreviewImage: document.getElementById("matcherPreviewImage"),
    removeScreenshot: document.getElementById("removeScreenshot"),
    stopOnlyFilterChip: document.getElementById("stopOnlyFilterChip"),
    stopOtherFilterChip: document.getElementById("stopOtherFilterChip"),
    whiteEdgeFilterChip: document.getElementById("whiteEdgeFilterChip"),
    whitePlateFilterChip: document.getElementById("whitePlateFilterChip"),
    carMetaFilters: document.getElementById("carMetaFilters"),
    roofRackFilterChip: document.getElementById("roofRackFilterChip"),
    mirrorFilterChip: document.getElementById("mirrorFilterChip"),
    snorkelFilterChip: document.getElementById("snorkelFilterChip"),
    equipmentFilterChip: document.getElementById("equipmentFilterChip"),
    tapeFilterChip: document.getElementById("tapeFilterChip"),
    motorcycleFilterChip: document.getElementById("motorcycleFilterChip"),
    trekkerFilterChip: document.getElementById("trekkerFilterChip"),
    boatFilterChip: document.getElementById("boatFilterChip"),
    aiHelperCard: document.getElementById("aiHelperCard"),
    aiHelperStatus: document.getElementById("aiHelperStatus"),
    analyzeScreenshotButton: document.getElementById("analyzeScreenshotButton"),
    resetAiAnalysisButton: document.getElementById("resetAiAnalysisButton"),
    aiAnalysisResult: document.getElementById("aiAnalysisResult"),
    downloadAiHelper: document.getElementById("downloadAiHelper"),
    updateNotice: document.getElementById("updateNotice"),
    dismissUpdateNotice: document.getElementById("dismissUpdateNotice"),
    updateNoticeTime: document.getElementById("updateNoticeTime"),
  };

  const UPDATE_STORAGE_KEY = "geoguessr-atlas-seen-update-id";
  const AI_HELPER_BASE_URL = "http://127.0.0.1:43117";
  const AI_HELPER_HEADER = { "X-GeoGuessr-Helper": "1" };
  const AI_HELPER_HEALTH_TIMEOUT_MS = 5000;
  const AI_HELPER_ANALYSIS_TIMEOUT_MS = 60000;
  const AI_MAX_IMAGE_BYTES = 12 * 1024 * 1024;
  const AI_ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
  const AI_LIKELY_CONFIDENCE = 0.6;
  const AI_EXCLUDED_CONFIDENCE = 0.72;
  const AI_COUNTRY_LIMITS = Object.freeze({ likely: 5, possible: 10, excluded: 12 });
  const AI_CLUE_LABELS = Object.freeze({
    vegetation: "Vegetation",
    climate: "Klimaeindruck",
    landscape: "Landschaft",
    bollards: "Leitpfosten / Bollards",
    road: "Straße und Markierungen",
    signs: "Verkehrsschilder",
    language: "Sprache und Schrift",
    plates: "Kennzeichen",
    architecture: "Architektur",
    "utility-poles": "Masten und Leitungen",
    traffic: "Verkehrsseite",
    camera: "Kamera-Hinweis",
    "vehicle-meta": "Google-Car / Fahrzeug-Meta",
    other: "Weiterer Bildhinweis",
  });
  const AI_ROBUST_EXCLUSION_CATEGORIES = new Set([
    "bollards",
    "road",
    "signs",
    "language",
    "plates",
    "architecture",
    "utility-poles",
    "traffic",
  ]);
  const AI_FILTER_CONTEXT_LABELS = Object.freeze({
    "traffic:left": "Linksverkehr",
    "traffic:right": "Rechtsverkehr",
    "centerColor:yellow": "gelbe Mittellinie",
    "centerColor:white": "weiße Mittellinie",
    "edgeColor:yellow": "gelbe Randlinie",
    "edgeColor:white": "weiße Randlinie",
    "plateColor:yellow": "gelbe Kennzeichen",
    "plateColor:white": "weiße Kennzeichen",
    "terrain:tropical": "tropische Landschaft",
    "terrain:desert": "Wüstenlandschaft",
    "terrain:mountain": "Gebirge",
    "terrain:flat": "sehr flache Landschaft",
    "terrain:forest": "waldreiche Landschaft",
    "terrain:coast": "Insel- oder Küstenlandschaft",
    "language:english": "sichtbares Englisch",
    "language:spanish": "sichtbares Spanisch",
    "language:portuguese": "sichtbares Portugiesisch",
    "language:french": "sichtbares Französisch",
    "language:german": "sichtbares Deutsch",
    "language:dutch": "sichtbares Niederländisch",
    "continent:europe": "Europa",
    "continent:africa": "Afrika",
    "continent:asia": "Asien",
    "continent:north-america": "Nordamerika",
    "continent:south-america": "Südamerika",
    "continent:oceania": "Ozeanien",
    "stopSign:stop-only": "Stoppschild nur mit STOP",
    "stopSign:other-text": "Stoppschild mit anderem oder zusätzlichem Text",
    "vehicleFeature:roof-rack": "Dachträger",
    "vehicleFeature:mirrors": "sichtbare Seitenspiegel",
    "vehicleFeature:snorkel": "Schnorchel",
    "vehicleFeature:equipment": "Zelt oder Gepäck am Aufnahmefahrzeug",
    "vehicleFeature:tape": "Klebeband oder markante Streifen am Aufnahmefahrzeug",
    "captureType:motorcycle": "Motorradkamera",
    "captureType:trekker": "Trekker- oder Fußkamera",
    "captureType:boat": "Bootskamera",
    "warningSign:diamond-yellow": "gelbes rautenförmiges Warnschild",
    "warningSign:triangle-white": "weißes Warndreieck mit rotem Rand",
    "warningSign:triangle-yellow": "gelbes Warndreieck mit rotem Rand",
    "plateLayout:white-yellow": "Kennzeichen vorn weiß und hinten gelb",
    "plateLayout:yellow-yellow": "gelbe Kennzeichen vorn und hinten",
    "bollard:white-black": "weiße Leitpfosten mit schwarzem Feld",
    "bollard:painted-black-white": "schwarz-weiß bemalte Leitpfosten",
    "bollard:black-yellow": "schwarz-gelbe Leitpfosten oder Schutzobjekte",
    "pole:wood": "Holzmasten",
    "pole:concrete": "Betonmasten",
    "shoulder:paved": "befestigte Straßenschulter",
    "shoulder:gravel": "Kies- oder Sandschulter",
    "shoulder:none": "keine nutzbare Straßenschulter",
    "shoulder:drainage": "offene Betonrinne am Straßenrand",
    "signBack:dark": "dunkle Schildrückseiten",
    "camera:low": "auffällig niedrige Kamera",
  });
  const AI_BASE_FILTER_CONTEXT = Object.freeze({
    "traffic:left": { key: "traffic", value: "left" },
    "traffic:right": { key: "traffic", value: "right" },
    "center:gelb": { key: "centerColor", value: "yellow" },
    "center:weiß": { key: "centerColor", value: "white" },
    "edge:gelb": { key: "edgeColor", value: "yellow" },
    "plates:gelb": { key: "plateColor", value: "yellow" },
    "terrain:trop": { key: "terrain", value: "tropical" },
    "terrain:wüste": { key: "terrain", value: "desert" },
    "terrain:berg": { key: "terrain", value: "mountain" },
    "terrain:flach": { key: "terrain", value: "flat" },
    "terrain:wald": { key: "terrain", value: "forest" },
    "terrain:insel": { key: "terrain", value: "coast" },
    "language:Englisch": { key: "language", value: "english" },
    "language:Spanisch": { key: "language", value: "spanish" },
    "language:Portugiesisch": { key: "language", value: "portuguese" },
    "language:Französisch": { key: "language", value: "french" },
    "language:Deutsch": { key: "language", value: "german" },
    "language:Niederländisch": { key: "language", value: "dutch" },
    "continent:Europa": { key: "continent", value: "europe" },
    "continent:Afrika": { key: "continent", value: "africa" },
    "continent:Asien": { key: "continent", value: "asia" },
    "continent:Nordamerika": { key: "continent", value: "north-america" },
    "continent:Südamerika": { key: "continent", value: "south-america" },
    "continent:Ozeanien": { key: "continent", value: "oceania" },
  });

  function createEmptyQuickCriteria() {
    return {
      stopOnly: false,
      stopOther: false,
      centerColor: "",
      edgeColor: "",
      plateColor: "",
      roofRack: false,
      mirrors: false,
      snorkel: false,
      equipment: false,
      tape: false,
      captureType: "",
      warningSign: "",
      plateLayout: "",
      bollard: "",
      pole: "",
      shoulder: "",
      signBack: "",
      camera: "",
    };
  }

  const state = {
    selectedIso: null,
    searchQuery: "",
    activeFilters: new Set(),
    favorites: loadFavorites(),
    transform: { x: 0, y: 0, scale: 1 },
    pointer: null,
    dragged: false,
    mapSelectionActive: false,
    matcher: {
      active: false,
      source: null,
      results: new Map(),
      roadCandidates: new Set(),
      manualExcluded: new Set(),
      quickCriteria: createEmptyQuickCriteria(),
      previewUrl: null,
      imageName: "",
      ai: {
        analyzing: false,
        healthRequestId: 0,
        analysisRequestId: 0,
        controller: null,
        countryGroups: { likely: [], possible: [], excluded: [] },
        imageClues: [],
        bestGuessIso: "",
        filterContext: { version: 1, activeFilters: [] },
        analysis: null,
      },
    },
  };

  const countryElements = new Map();
  const countryBorderElements = new Map();
  const roadLineElements = new Map();
  const countryGeometryBounds = new Map();
  const searchIndexes = new Map();
  const worldRoadCountries = new Set([
    "USA", "CAN", "MEX",
    "BRA", "ARG",
    "ZAF",
    "NOR", "SWE", "FIN", "GBR", "ESP", "FRA", "DEU", "POL", "ITA", "UKR", "TUR",
    "AUS", "JPN",
  ]);

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalize(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("de")
      .replace(/[–—]/g, "-")
      .replace(/left[- ]hand traffic|left hand driving|linksverkehr/g, "linksverkehr")
      .replace(/right[- ]hand traffic|right hand driving|rechtsverkehr/g, "rechtsverkehr")
      .replace(/yellow/g, "gelb")
      .replace(/white/g, "weiss")
      .replace(/outer road lines?|outer lines?|edge lines?|aussenlinien?|aussere randlinien?/g, "randlinie")
      .replace(/cent(?:er|re) lines?|mittellinien?/g, "mittellinie")
      .replace(/license plates?|number plates?/g, "kennzeichen")
      .replace(/concrete utility poles?|concrete poles?/g, "betonmasten")
      .replace(/\s+/g, " ")
      .trim();
  }

  function flagEmoji(iso2) {
    if (!iso2 || iso2.length !== 2) return "◈";
    return [...iso2.toUpperCase()].map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0))).join("");
  }

  function flagAssetCode(country) {
    const code = String(country?.iso2 || "").toLocaleLowerCase("en");
    return /^[a-z]{2}$/.test(code) ? code : "";
  }

  function countryFlagMarkup(country) {
    const code = flagAssetCode(country);
    if (!code) {
      return `<span class="country-flag-fallback" aria-hidden="true">${escapeHtml(country.iso3)}</span>`;
    }
    return `<img src="assets/flags/4x3/${code}.svg" alt="" aria-hidden="true" width="96" height="72">`;
  }

  function loadFavorites() {
    try {
      const stored = JSON.parse(localStorage.getItem("geoguessr-atlas-favorites") || "[]");
      return new Set(Array.isArray(stored) ? stored : []);
    } catch {
      return new Set();
    }
  }

  function saveFavorites() {
    localStorage.setItem("geoguessr-atlas-favorites", JSON.stringify([...state.favorites]));
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
    if (!geometry) return "";
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
        x: bounds.minX,
        y: bounds.minY,
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

  function createSvgElement(name, attributes = {}) {
    const node = document.createElementNS(SVG_NS, name);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  }

  function drawGraticule() {
    for (let longitude = -150; longitude <= 150; longitude += 30) {
      const [x] = project([longitude, 0]);
      elements.graticule.appendChild(createSvgElement("path", {
        d: `M${x},0 L${x},600`, class: "graticule-line",
      }));
    }
    for (let latitude = -60; latitude <= 60; latitude += 30) {
      const [, y] = project([0, latitude]);
      elements.graticule.appendChild(createSvgElement("path", {
        d: `M0,${y} L1200,${y}`, class: "graticule-line",
      }));
    }
  }

  function attachCountryInteractions(node, iso3) {
    node.addEventListener("pointerenter", (event) => {
      countryBorderElements.get(iso3)?.classList.add("is-hovered");
      showTooltip(event, iso3);
    });
    node.addEventListener("pointermove", (event) => positionTooltip(event));
    node.addEventListener("pointerleave", () => {
      countryBorderElements.get(iso3)?.classList.remove("is-hovered");
      hideTooltip();
    });
    node.addEventListener("click", () => {
      if (!state.dragged) selectCountry(iso3);
    });
    node.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectCountry(iso3);
      }
    });
  }

  function drawCountries() {
    (window.WORLD_GEOJSON?.features || []).forEach((feature) => {
      const iso3 = feature.properties.iso3;
      const country = countries[iso3];
      if (!country || !iso3) return;
      const path = createSvgElement("path", {
        id: `country-${iso3}`,
        d: geometryToPath(feature.geometry),
        class: `country-shape traffic-${country.traffic}`,
        role: "button",
        tabindex: "0",
        "aria-label": `${country.name}, ${country.traffic === "left" ? "Linksverkehr" : "Rechtsverkehr"}`,
        "data-iso": iso3,
      });
      attachCountryInteractions(path, iso3);
      elements.paths.appendChild(path);
      countryElements.set(iso3, path);
      countryGeometryBounds.set(iso3, geometryBounds(feature.geometry, country.coordinates));

      const clipPath = createSvgElement("clipPath", {
        id: `country-clip-${iso3}`,
        clipPathUnits: "userSpaceOnUse",
      });
      clipPath.appendChild(createSvgElement("path", { d: path.getAttribute("d") }));
      elements.clipPaths.appendChild(clipPath);

      const border = createSvgElement("path", {
        d: path.getAttribute("d"),
        class: "country-border",
        "data-iso": iso3,
      });
      elements.borders.appendChild(border);
      countryBorderElements.set(iso3, border);
    });

    (window.SMALL_COUNTRY_MARKERS || []).forEach((marker) => {
      if (countryElements.has(marker.iso3) || !countries[marker.iso3]) return;
      const [x, y] = project([marker.lon, marker.lat]);
      const country = countries[marker.iso3];
      const group = createSvgElement("g", {
        id: `country-${marker.iso3}`,
        class: `country-marker traffic-${country.traffic}`,
        role: "button",
        tabindex: "0",
        "aria-label": `${country.name}, kleiner Staat, ${country.traffic === "left" ? "Linksverkehr" : "Rechtsverkehr"}`,
        "data-iso": marker.iso3,
        transform: `translate(${x.toFixed(2)} ${y.toFixed(2)})`,
      });
      group.appendChild(createSvgElement("circle", { class: "marker-halo", r: "4.5" }));
      group.appendChild(createSvgElement("circle", { class: "marker-core", r: "2.1" }));
      attachCountryInteractions(group, marker.iso3);
      elements.markers.appendChild(group);
      countryElements.set(marker.iso3, group);
    });
  }

  function mapPatternColor(color) {
    if (color === "yellow") return "#ffd84f";
    if (color === "white") return "#ffffff";
    if (color === "green") return "#51d49a";
    return "transparent";
  }

  function addPatternStroke(group, offset, length, definition, role, originX, originY) {
    if (!definition || definition.style === "none" || definition.color === "none") return;
    const color = mapPatternColor(definition.color);
    if (color === "transparent") return;

    const createLine = (lineOffset, dashed) => {
      const line = createSvgElement("line", {
        class: `map-road-line ${role}`,
        x1: String(originX - length / 2),
        y1: String(originY + lineOffset),
        x2: String(originX + length / 2),
        y2: String(originY + lineOffset),
        stroke: color,
      });
      if (dashed) line.setAttribute("stroke-dasharray", length < 18 ? "3.5 2.5" : "6 4");
      group.appendChild(line);
    };

    if (definition.style === "double-solid" || definition.style === "double-dashed") {
      const dashed = definition.style === "double-dashed";
      const spacing = Math.min(definition.spacing || 1.45, 1.65);
      createLine(offset - spacing, dashed);
      createLine(offset + spacing, dashed);
    } else if (definition.style === "solid-dashed") {
      createLine(offset - 1.45, false);
      createLine(offset + 1.45, true);
    } else {
      createLine(offset, definition.style === "dashed");
    }
  }

  function addPatternBand(group, length, colorName, originX, originY) {
    const color = mapPatternColor(colorName);
    if (color === "transparent") return;
    group.appendChild(createSvgElement("line", {
      class: "map-road-band",
      x1: String(originX - length / 2),
      y1: String(originY),
      x2: String(originX + length / 2),
      y2: String(originY),
      stroke: color,
    }));
  }

  function zoomLevelForScale(scale) {
    if (scale >= 3) return "country";
    if (scale >= 1.5) return "regional";
    return "world";
  }

  function roadDisplayMode(country, bounds) {
    if (!bounds || !country.roadMapPattern || country.roadMapPattern.confidence === "unknown") return null;
    const level = zoomLevelForScale(state.transform.scale);
    const pattern = country.roadMapPattern;
    const verified = country.roadVerification?.status === "cross-checked";
    const highConfidence = ["high", "medium-high"].includes(pattern.confidence);
    const scope = pattern.scope || "marked-main-road";
    const hasVisibleLines = [pattern.center, pattern.leftEdge, pattern.rightEdge]
      .some((part) => part?.color !== "none" && part?.style !== "none");
    if (!hasVisibleLines) return null;

    const matcherResult = state.matcher.results.get(country.iso3);
    if (state.matcher.active && matcherResult?.status !== "excluded" && state.matcher.roadCandidates.has(country.iso3)) {
      const fitsMatcherSample = level === "world"
        ? bounds.width >= 8 && bounds.height >= 5 && bounds.area >= 55
        : level === "regional"
          ? bounds.width >= 6 && bounds.height >= 4 && bounds.area >= 28
          : bounds.width >= 4 && bounds.height >= 3 && bounds.area >= 18;
      if (fitsMatcherSample) return verified ? "verified" : "neutral";
    }

    if (state.mapSelectionActive && country.iso3 === state.selectedIso && bounds.width >= 4 && bounds.height >= 3 && bounds.area >= 18) {
      if (verified) return "verified";
      return "neutral";
    }

    if (level === "world") {
      const worldScope = scope === "national-default" || scope === "marked-main-road";
      return verified && highConfidence && worldScope && pattern.showOnWorld !== false
        && worldRoadCountries.has(country.iso3) && bounds.width >= 10 && bounds.height >= 6
        ? "verified"
        : null;
    }
    if (level === "regional") {
      const regionalScope = scope !== "road-class" && scope !== "special-variant";
      if (bounds.width < 16 || bounds.height < 8 || bounds.area < 150) return null;
      if (verified && regionalScope) return "verified";
      return country.detailLevel === "priorität" ? "neutral" : null;
    }
    if (bounds.width < 4 || bounds.height < 3 || bounds.area < 18) return null;
    if (verified) return "verified";
    return "neutral";
  }

  function renderRoadPattern(country, bounds) {
    const pattern = country.roadMapPattern;
    const displayMode = roadDisplayMode(country, bounds);
    if (!pattern || !country.coordinates || !displayMode) return;
    const anchorX = bounds.sampleX;
    const anchorY = bounds.sampleY;
    const level = zoomLevelForScale(state.transform.scale);
    const minimumSurfaceWidth = level === "world" && country.continent === "Europa" ? 8 : level === "country" ? 8 : 10;
    const maximumFittedWidth = bounds.sampleHorizontalSpan * 0.82;
    const minimumVisibleWidth = level === "world" ? 6 : level === "regional" ? 5 : 3.5;
    if (maximumFittedWidth < minimumVisibleWidth) return;
    const surfaceWidth = Math.min(44, maximumFittedWidth, Math.max(minimumSurfaceWidth, bounds.width * 0.24));
    const length = Math.max(5, surfaceWidth - 3);
    const stripHeight = Math.min(9, Math.max(5.5, bounds.height * 0.16));
    const edgeOffset = stripHeight * 0.3;
    const group = createSvgElement("g", {
      class: `road-map-pattern traffic-${country.traffic}${displayMode === "neutral" ? " is-neutral" : ""}`,
      "data-iso": country.iso3,
      "data-confidence": pattern.confidence,
      "data-display-mode": displayMode,
      "clip-path": `url(#country-clip-${country.iso3})`,
    });
    group.appendChild(createSvgElement("rect", {
      class: "map-road-surface",
      x: String(anchorX - surfaceWidth / 2),
      y: String(anchorY - stripHeight / 2),
      width: String(surfaceWidth),
      height: String(stripHeight),
      rx: String(stripHeight / 2),
    }));

    if (displayMode === "neutral") {
      group.appendChild(createSvgElement("line", {
        class: "map-road-neutral-line",
        x1: String(anchorX - length * 0.28),
        y1: String(anchorY),
        x2: String(anchorX + length * 0.28),
        y2: String(anchorY),
      }));
    } else {
      if (pattern.center.bandColor) addPatternBand(group, length, pattern.center.bandColor, anchorX, anchorY);
      addPatternStroke(group, -edgeOffset, length, pattern.leftEdge, "edge", anchorX, anchorY);
      addPatternStroke(group, 0, length, pattern.center, "center", anchorX, anchorY);
      if (pattern.center.inner) addPatternStroke(group, 0, length, pattern.center.inner, "center", anchorX, anchorY);
      addPatternStroke(group, edgeOffset, length, pattern.rightEdge, "edge", anchorX, anchorY);
    }

    if (state.mapSelectionActive && country.iso3 === state.selectedIso) group.classList.add("is-selected");
    elements.roadLines.appendChild(group);
    roadLineElements.set(country.iso3, group);
  }

  function drawRoadLineOverlays() {
    elements.roadLines.replaceChildren();
    roadLineElements.clear();
    countryList.forEach((country) => renderRoadPattern(country, countryGeometryBounds.get(country.iso3)));
  }

  function roadPatternSummary(country) {
    const pattern = country.roadMapPattern;
    if (!pattern || pattern.confidence === "unknown") return "Straßenmuster noch nicht verifiziert";
    const color = { white: "weiß", yellow: "gelb", green: "grün", none: "keine" };
    const style = {
      solid: "durchgezogen", dashed: "gestrichelt", "double-solid": "doppelt durchgezogen",
      "double-dashed": "doppelt gestrichelt", "solid-dashed": "durchgezogen + gestrichelt", none: "ohne Linie",
    };
    const part = (definition) => `${color[definition.color] || definition.color}, ${style[definition.style] || definition.style}`;
    const inner = pattern.center.inner ? ` · innen ${part(pattern.center.inner)}` : "";
    return `Mitte: ${part(pattern.center)}${inner} · Außen: ${part(pattern.leftEdge)} / ${part(pattern.rightEdge)}`;
  }

  function compactRoadClue(country) {
    if (country.roadVerification?.status !== "cross-checked") return "Markierungen variieren nach Straßentyp";
    const pattern = country.roadMapPattern;
    const color = { white: "weiße", yellow: "gelbe", green: "grüne", none: "keine" };
    const style = {
      solid: "durchgezogene", dashed: "gestrichelte", "double-solid": "doppelte durchgezogene",
      "double-dashed": "doppelte gestrichelte", "solid-dashed": "kombinierte", none: "fehlende",
    };
    const center = `${color[pattern.center.color] || pattern.center.color} ${style[pattern.center.style] || pattern.center.style} Mittellinie`;
    const sameEdges = pattern.leftEdge.color === pattern.rightEdge.color && pattern.leftEdge.style === pattern.rightEdge.style;
    if (!sameEdges || pattern.leftEdge.color === "none") return center;
    const edgeStyle = pattern.leftEdge.style === "dashed" ? "gestrichelte " : "";
    const summary = `${center} · ${color[pattern.leftEdge.color] || pattern.leftEdge.color} ${edgeStyle}Außenlinien`;
    if (country.iso3 === "ARG") return `${summary} · Standard seit 2025`;
    if (country.iso3 === "FIN") return `${summary} · aktuelle Regelung`;
    return summary;
  }

  function showTooltip(event, iso3) {
    const country = countries[iso3];
    if (!country) return;
    elements.tooltip.innerHTML = `
      <strong>${flagEmoji(country.iso2)} ${escapeHtml(country.name)}</strong>
      <span>${country.traffic === "left" ? "Linksverkehr" : "Rechtsverkehr"}</span>
      <span class="tooltip-clue">${escapeHtml(compactRoadClue(country))}</span>
    `;
    elements.tooltip.hidden = false;
    positionTooltip(event);
  }

  function positionTooltip(event) {
    if (elements.tooltip.hidden) return;
    const padding = 14;
    const rect = elements.tooltip.getBoundingClientRect();
    let left = event.clientX + 15;
    let top = event.clientY + 15;
    if (left + rect.width > window.innerWidth - padding) left = event.clientX - rect.width - 15;
    if (top + rect.height > window.innerHeight - padding) top = event.clientY - rect.height - 15;
    elements.tooltip.style.left = `${Math.max(padding, left)}px`;
    elements.tooltip.style.top = `${Math.max(padding, top)}px`;
  }

  function hideTooltip() {
    elements.tooltip.hidden = true;
  }

  function buildSearchIndexes() {
    countryList.forEach((country) => {
      const searchable = [
        country.name,
        country.nameEnglish,
        country.iso3,
        country.iso2,
        country.continent,
        country.subregion,
        country.traffic === "left" ? "Linksverkehr linke Fahrseite" : "Rechtsverkehr rechte Fahrseite",
        country.domain,
        JSON.stringify(country.roadMarkings),
        JSON.stringify(country.roadLineFilterVariants),
        JSON.stringify(country.roadMapPattern),
        JSON.stringify(country.roads),
        JSON.stringify(country.geoGuessrClues),
        JSON.stringify(country.bollards),
        JSON.stringify(country.signs),
        JSON.stringify(country.stopSign),
        JSON.stringify(country.visualEvidence),
        JSON.stringify(country.captureMeta),
        JSON.stringify(country.utilityPoles),
        JSON.stringify(country.licensePlates),
        country.languages.join(" "),
        country.landscape,
        country.architecture,
        country.meta,
      ].join(" ");
      searchIndexes.set(country.iso3, normalize(searchable));
    });
  }

  function matchesFilter(country, filter) {
    const [type, value] = filter.split(":");
    const valueNormalized = normalize(value);
    if (type === "traffic") return country.traffic === value;
    if (type === "center") {
      const variantColor = matcherColor(value);
      return country.roadLineFilterVariants?.centerColors?.includes(variantColor)
        || normalize(country.roadMarkings.centerColor).includes(valueNormalized);
    }
    if (type === "edge") {
      const variantColor = matcherColor(value);
      return country.roadLineFilterVariants?.edgeColors?.includes(variantColor)
        || normalize(`${country.roadMarkings.leftEdgeColor} ${country.roadMarkings.rightEdgeColor}`).includes(valueNormalized);
    }
    if (type === "plates") return normalize(country.licensePlates.description).includes(valueNormalized);
    if (type === "terrain") {
      const landscape = normalize(country.landscape);
      const terrainTerms = {
        trop: ["trop", "uppig", "palmen", "regenwald"],
        wuste: ["wuste", "trocken", "sand", "durre", "steppe", "atacama"],
        berg: ["berg", "anden", "gebirge", "alpin", "hochland", "hugel", "fjord"],
        flach: ["flach", "ebene", "pampa", "tiefland", "prarie"],
        wald: ["wald", "bewald", "nadel", "birken", "regenwald"],
        insel: ["insel", "kuste", "fjord", "archipel"],
      };
      return (terrainTerms[valueNormalized] || [valueNormalized]).some((term) => landscape.includes(term));
    }
    if (type === "language") return normalize(country.languages.join(" ")).includes(valueNormalized);
    if (type === "continent") return normalize(country.continent) === valueNormalized;
    if (type === "favorites") return state.favorites.has(country.iso3);
    return true;
  }

  function currentSearchTokens() {
    return normalize(state.searchQuery).split(" ").filter(Boolean);
  }

  function matchesSearchAndBaseFilters(country, tokens = currentSearchTokens()) {
    const queryMatches = tokens.length === 0
      || tokens.every((token) => searchIndexes.get(country.iso3)?.includes(token));
    const filterMatches = [...state.activeFilters].every((filter) => matchesFilter(country, filter));
    return queryMatches && filterMatches;
  }

  function matchesSearchAndQuickFilters(country, tokens = currentSearchTokens()) {
    const baseMatches = matchesSearchAndBaseFilters(country, tokens);
    const quickCriteria = readMatcherCriteria();
    const quickMatches = !hasMatcherCriteria(quickCriteria)
      || evaluateMatcherCountry(country, quickCriteria).status !== "excluded";
    return baseMatches && quickMatches;
  }

  function updateMapMatches() {
    const tokens = currentSearchTokens();
    const matcherCriteriaCount = selectedMatcherCount(readMatcherCriteria());
    const manualExclusionCount = state.matcher.manualExcluded.size;
    const aiAnalysisActive = state.matcher.active && state.matcher.source === "ai";
    let matchCount = 0;
    let strongQuickMatches = 0;
    let possibleQuickMatches = 0;
    let excludedQuickMatches = 0;
    elements.map.classList.toggle("has-matcher", state.matcher.active);
    elements.map.classList.toggle("has-ai-analysis", aiAnalysisActive);

    countryList.forEach((country) => {
      const matches = matchesSearchAndQuickFilters(country, tokens);
      const matcherStatus = state.matcher.active
        ? (state.matcher.results.get(country.iso3)?.status || (aiAnalysisActive ? "unassessed" : null))
        : null;
      const matcherExcluded = matcherStatus === "excluded";
      const aiLikely = aiAnalysisActive && matcherStatus === "match";
      const aiPossible = aiAnalysisActive && matcherStatus === "possible";
      const aiExcluded = aiAnalysisActive && matcherExcluded;
      const aiUnassessed = aiAnalysisActive && matcherStatus === "unassessed";
      const aiBestGuess = aiAnalysisActive && state.matcher.ai.bestGuessIso === country.iso3;
      const includedByAnalysis = aiLikely || aiPossible;
      if (!aiAnalysisActive && matcherCriteriaCount > 0 && matchesSearchAndBaseFilters(country, tokens)) {
        if (matcherStatus === "match") strongQuickMatches += 1;
        else if (matcherStatus === "excluded") excludedQuickMatches += 1;
        else possibleQuickMatches += 1;
      }
      const node = countryElements.get(country.iso3);
      const border = countryBorderElements.get(country.iso3);
      const roadGlyph = roadLineElements.get(country.iso3);
      const matcherTargets = [node, border, roadGlyph].filter(Boolean);
      if (matches && (aiAnalysisActive ? includedByAnalysis : !matcherExcluded)) matchCount += 1;
      matcherTargets.forEach((target) => {
        target.classList.toggle("is-matcher-match", matcherStatus === "match");
        target.classList.toggle("is-matcher-possible", matcherStatus === "possible");
        target.classList.toggle("is-matcher-excluded", matcherExcluded);
        target.classList.toggle("is-ai-likely", aiLikely);
        target.classList.toggle("is-ai-possible", aiPossible);
        target.classList.toggle("is-ai-excluded", aiExcluded);
        target.classList.toggle("is-ai-unassessed", aiUnassessed);
        target.classList.toggle("is-ai-best-guess", aiBestGuess);
      });
      const dimForAnalysis = aiAnalysisActive ? aiUnassessed : matcherExcluded;
      roadGlyph?.classList.toggle("is-dimmed", !matches || dimForAnalysis);
      border?.classList.toggle("is-dimmed", !matches || dimForAnalysis);
      border?.classList.toggle("is-match", matches && !aiExcluded && !aiUnassessed && (tokens.length > 0 || state.activeFilters.size > 0));
      if (!node) return;
      node.classList.toggle("is-dimmed", !matches || dimForAnalysis);
      node.classList.toggle("is-match", matches && !aiExcluded && !aiUnassessed && (tokens.length > 0 || state.activeFilters.size > 0));
    });

    if (elements.filterResultCount) {
      elements.filterResultCount.textContent = `${matchCount} Treffer`;
    }

    if (aiAnalysisActive) {
      const { likely, possible, excluded } = state.matcher.ai.countryGroups;
      const scopedCount = (candidates) => candidates.filter((candidate) => {
        const country = countries[candidate.iso3];
        return country && matchesSearchAndQuickFilters(country, tokens);
      }).length;
      const likelyCount = scopedCount(likely);
      const possibleCount = scopedCount(possible);
      const excludedCount = scopedCount(excluded);
      const bestGuessCountry = countries[state.matcher.ai.bestGuessIso];
      const bestGuessText = bestGuessCountry ? `Bester Tipp: ${bestGuessCountry.name} · ` : "";
      const baseFilterText = [];
      if (state.searchQuery.trim()) baseFilterText.push(`Suche „${state.searchQuery.trim()}“`);
      if (state.activeFilters.size) baseFilterText.push(`${state.activeFilters.size} aktive Filter`);
      if (matcherCriteriaCount) baseFilterText.push(`${matcherCriteriaCount} Merkmalsfilter`);
      const intersection = baseFilterText.length ? `${matchCount} sichtbare KI-Treffer für ${baseFilterText.join(" · ")} · ` : "";
      elements.searchSummary.textContent = bestGuessText + intersection
        + `${likelyCount} ${likelyCount === 1 ? "KI-Kandidat" : "KI-Kandidaten"} · `
        + `${possibleCount} möglich · ${excludedCount} ausdrücklich ausgeschlossen. `
        + "Nicht bewertete Länder sind nicht automatisch ausgeschlossen.";
      return;
    }

    if (
      tokens.length === 0
      && state.activeFilters.size === 0
      && matcherCriteriaCount === 0
      && manualExclusionCount === 0
    ) {
      elements.searchSummary.textContent = `Alle ${countryList.length} Länder und Gebiete werden angezeigt.`;
    } else if (matcherCriteriaCount > 0 && state.matcher.source === "quick") {
      const scope = [];
      if (state.searchQuery.trim()) scope.push(`Suche „${state.searchQuery.trim()}“`);
      if (state.activeFilters.size) scope.push(`${state.activeFilters.size} weitere Filter`);
      const scopeText = scope.length ? ` innerhalb ${scope.join(" · ")}` : "";
      elements.searchSummary.textContent = `${strongQuickMatches} gut belegte ${strongQuickMatches === 1 ? "Übereinstimmung" : "Übereinstimmungen"}${scopeText} · `
        + `${possibleQuickMatches} weitere Länder bleiben möglich · ${excludedQuickMatches} eher ausgeschlossen.`;
    } else {
      const parts = [];
      if (state.searchQuery.trim()) parts.push(`Suche „${state.searchQuery.trim()}“`);
      if (state.activeFilters.size) parts.push(`${state.activeFilters.size} aktive Filter`);
      if (matcherCriteriaCount) {
        parts.push(`${matcherCriteriaCount} ${matcherCriteriaCount === 1 ? "Haupt-Schnellfilter" : "Haupt-Schnellfilter"}`);
      }
      if (manualExclusionCount) {
        parts.push(`${manualExclusionCount} ${manualExclusionCount === 1 ? "manuell ausgeschlossenes Land" : "manuell ausgeschlossene Länder"}`);
      }
      elements.searchSummary.textContent = `${matchCount} Treffer für ${parts.join(" · ")}.`;
    }
  }

  function readMatcherCriteria() {
    const quick = state.matcher.quickCriteria;
    return {
      traffic: "",
      centerColor: quick.centerColor,
      centerStyle: "",
      edgeColor: quick.edgeColor,
      edgeStyle: "",
      plateColor: quick.plateColor,
      surface: "",
      stopOnly: quick.stopOnly,
      stopOther: quick.stopOther,
      stopText: "",
      warningSign: quick.warningSign,
      plateLayout: quick.plateLayout,
      bollard: quick.bollard,
      pole: quick.pole,
      shoulder: quick.shoulder,
      signBack: quick.signBack,
      camera: quick.camera,
      roofRack: quick.roofRack,
      mirrors: quick.mirrors,
      snorkel: quick.snorkel,
      equipment: quick.equipment,
      tape: quick.tape,
      captureType: quick.captureType,
    };
  }

  function buildAiFilterContext() {
    const activeFilters = [];
    const seen = new Set();
    const add = (key, value) => {
      const identity = `${key}:${value}`;
      if (!AI_FILTER_CONTEXT_LABELS[identity] || seen.has(identity)) return;
      seen.add(identity);
      activeFilters.push({ key, value });
    };

    state.activeFilters.forEach((filter) => {
      const contextFilter = AI_BASE_FILTER_CONTEXT[filter];
      if (contextFilter) add(contextFilter.key, contextFilter.value);
    });

    const quick = state.matcher.quickCriteria;
    if (quick.stopOnly) add("stopSign", "stop-only");
    if (quick.stopOther) add("stopSign", "other-text");
    if (quick.centerColor) add("centerColor", quick.centerColor);
    if (quick.edgeColor) add("edgeColor", quick.edgeColor);
    if (quick.plateColor === "white") add("plateColor", "white");
    if (quick.roofRack) add("vehicleFeature", "roof-rack");
    if (quick.mirrors) add("vehicleFeature", "mirrors");
    if (quick.snorkel) add("vehicleFeature", "snorkel");
    if (quick.equipment) add("vehicleFeature", "equipment");
    if (quick.tape) add("vehicleFeature", "tape");
    if (["motorcycle", "trekker", "boat"].includes(quick.captureType)) {
      add("captureType", quick.captureType);
    }
    ["warningSign", "plateLayout", "bollard", "pole", "shoulder", "signBack", "camera"].forEach((criterion) => {
      if (quick[criterion]) add(criterion, quick[criterion]);
    });

    return { version: 1, activeFilters };
  }

  function displayAiFilterContext(filterContext) {
    const activeFilters = Array.isArray(filterContext?.activeFilters)
      ? filterContext.activeFilters
      : [];
    return {
      version: 1,
      activeFilters: activeFilters.map(({ key, value }) => ({
        key,
        value,
        label: AI_FILTER_CONTEXT_LABELS[`${key}:${value}`] || "",
      })).filter((filter) => filter.label),
    };
  }

  function aiFilterContextSignature(filterContext) {
    return displayAiFilterContext(filterContext).activeFilters
      .map(({ key, value }) => `${key}:${value}`)
      .sort()
      .join("|");
  }

  function updateFilterDashboard() {
    const filterCount = state.activeFilters.size + selectedMatcherCount(readMatcherCriteria());
    const activeButtons = elements.filterPanel
      ? Array.from(elements.filterPanel.querySelectorAll('.filter-chip[aria-pressed="true"]'))
      : [];
    const labels = activeButtons
      .map((button) => button.textContent.replace(/\s+/g, " ").trim())
      .filter(Boolean);
    const manualCount = state.matcher.manualExcluded.size;
    const hasAiResult = Boolean(state.matcher.ai.analysis);
    const isAiAnalyzing = state.matcher.ai.analyzing;

    if (elements.activeFilterCount) {
      elements.activeFilterCount.textContent = String(filterCount);
      elements.activeFilterCount.setAttribute(
        "aria-label",
        filterCount === 1 ? "1 aktiver Filter" : `${filterCount} aktive Filter`,
      );
    }

    if (elements.activeFilterSummary) {
      const visibleLabels = labels.slice(0, 4);
      const hiddenLabelCount = Math.max(0, labels.length - visibleLabels.length);
      let summary = "Keine Filter aktiv. Ausgewählte Merkmale werden gemeinsam angewendet.";
      if (filterCount > 0) {
        summary = `Gemeinsam aktiv: ${visibleLabels.join(" · ")}`;
        if (hiddenLabelCount) summary += ` · + ${hiddenLabelCount} weitere`;
      }
      if (isAiAnalyzing) summary += `${summary.endsWith(".") ? " " : " · "}KI-Analyse läuft.`;
      else if (hasAiResult) summary += `${summary.endsWith(".") ? " " : " · "}Mit KI-Ergebnis kombiniert.`;
      if (manualCount) {
        summary += `${summary.endsWith(".") ? " " : " · "}${manualCount} ${manualCount === 1 ? "Land" : "Länder"} manuell ausgeschlossen.`;
      }
      elements.activeFilterSummary.textContent = summary;
      elements.activeFilterSummary.title = labels.length ? labels.join(" · ") : summary;
    }

    if (elements.allFilterChip) {
      elements.allFilterChip.disabled = filterCount === 0 && manualCount === 0 && !hasAiResult && !isAiAnalyzing;
    }

    elements.filterDashboard?.querySelectorAll("[data-filter-tab]").forEach((tab) => {
      const panel = elements.filterDashboard.querySelector(`[data-filter-panel="${tab.dataset.filterTab}"]`);
      const categoryCount = panel?.querySelectorAll('.filter-chip[aria-pressed="true"]').length || 0;
      const countNode = tab.querySelector("[data-tab-count]");
      if (countNode) countNode.textContent = String(categoryCount);
      tab.classList.toggle("has-active", categoryCount > 0);
    });
  }

  function syncMatcherFilterChips() {
    const {
      stopOnly: stopOnlyActive,
      stopOther: stopOtherActive,
      edgeColor,
      plateColor,
      roofRack,
      mirrors,
      snorkel,
      equipment,
      tape,
      captureType,
    } = state.matcher.quickCriteria;
    const whiteEdgeActive = edgeColor === "white";
    const whitePlateActive = plateColor === "white";
    elements.filters?.querySelectorAll("[data-filter]").forEach((chip) => {
      const active = state.activeFilters.has(chip.dataset.filter);
      chip.classList.toggle("active", active);
      chip.setAttribute("aria-pressed", String(active));
    });
    elements.stopOnlyFilterChip?.classList.toggle("active", stopOnlyActive);
    elements.stopOnlyFilterChip?.setAttribute("aria-pressed", String(stopOnlyActive));
    elements.stopOtherFilterChip?.classList.toggle("active", stopOtherActive);
    elements.stopOtherFilterChip?.setAttribute("aria-pressed", String(stopOtherActive));
    elements.whiteEdgeFilterChip?.classList.toggle("active", whiteEdgeActive);
    elements.whiteEdgeFilterChip?.setAttribute("aria-pressed", String(whiteEdgeActive));
    elements.whitePlateFilterChip?.classList.toggle("active", whitePlateActive);
    elements.whitePlateFilterChip?.setAttribute("aria-pressed", String(whitePlateActive));
    [
      [elements.roofRackFilterChip, roofRack],
      [elements.mirrorFilterChip, mirrors],
      [elements.snorkelFilterChip, snorkel],
      [elements.equipmentFilterChip, equipment],
      [elements.tapeFilterChip, tape],
      [elements.motorcycleFilterChip, captureType === "motorcycle"],
      [elements.trekkerFilterChip, captureType === "trekker"],
      [elements.boatFilterChip, captureType === "boat"],
    ].forEach(([chip, active]) => {
      chip?.classList.toggle("active", active);
      chip?.setAttribute("aria-pressed", String(active));
    });
    elements.filters?.querySelectorAll("[data-quick-criterion]").forEach((chip) => {
      const active = state.matcher.quickCriteria[chip.dataset.quickCriterion] === chip.dataset.quickValue;
      chip.classList.toggle("active", active);
      chip.setAttribute("aria-pressed", String(active));
    });
    updateFilterDashboard();
  }

  function removeBaseFiltersByType(type) {
    [...state.activeFilters].forEach((filter) => {
      if (filter.startsWith(`${type}:`)) state.activeFilters.delete(filter);
    });
  }

  function applyFilterSelection(button) {
    if (!button) return false;
    const quick = state.matcher.quickCriteria;
    const baseFilter = button.dataset.filter;

    if (baseFilter) {
      const [type] = baseFilter.split(":");
      const activating = !state.activeFilters.has(baseFilter);
      if (activating) {
        if (["traffic", "center", "edge", "plates", "continent", "language"].includes(type)) {
          removeBaseFiltersByType(type);
        }
        if (type === "edge") quick.edgeColor = "";
        if (type === "plates") quick.plateColor = "";
        state.activeFilters.add(baseFilter);
      } else {
        state.activeFilters.delete(baseFilter);
      }
      return true;
    }

    if (button.hasAttribute("data-matcher-stop-only")) {
      quick.stopOnly = !quick.stopOnly;
      if (quick.stopOnly) quick.stopOther = false;
      return true;
    }
    if (button.hasAttribute("data-matcher-stop-other")) {
      quick.stopOther = !quick.stopOther;
      if (quick.stopOther) quick.stopOnly = false;
      return true;
    }
    if (button.hasAttribute("data-matcher-edge-white")) {
      quick.edgeColor = quick.edgeColor === "white" ? "" : "white";
      if (quick.edgeColor) removeBaseFiltersByType("edge");
      return true;
    }
    if (button.hasAttribute("data-matcher-plate-white")) {
      quick.plateColor = quick.plateColor === "white" ? "" : "white";
      if (quick.plateColor) removeBaseFiltersByType("plates");
      return true;
    }

    const quickCriterion = button.dataset.quickCriterion;
    const quickValue = button.dataset.quickValue;
    if (quickCriterion && Object.hasOwn(quick, quickCriterion) && quickValue) {
      if (quickCriterion === "centerColor") removeBaseFiltersByType("center");
      if (quickCriterion === "edgeColor") removeBaseFiltersByType("edge");
      quick[quickCriterion] = quick[quickCriterion] === quickValue ? "" : quickValue;
      return true;
    }

    const captureFeature = button.dataset.captureFeature;
    if (captureFeature) {
      const criterionByFeature = {
        "roof-rack": "roofRack",
        mirrors: "mirrors",
        snorkel: "snorkel",
        equipment: "equipment",
        tape: "tape",
      };
      const criterion = criterionByFeature[captureFeature];
      if (!criterion) return false;
      quick[criterion] = !quick[criterion];
      if (quick[criterion]) quick.captureType = "";
      return true;
    }

    const captureType = button.dataset.captureType;
    if (captureType) {
      const activating = quick.captureType !== captureType;
      quick.captureType = activating ? captureType : "";
      if (activating) {
        quick.roofRack = false;
        quick.mirrors = false;
        quick.snorkel = false;
        quick.equipment = false;
        quick.tape = false;
      }
      return true;
    }

    return false;
  }

  function clearAllFilters() {
    state.activeFilters.clear();
    state.matcher.quickCriteria = createEmptyQuickCriteria();
    state.matcher.manualExcluded.clear();
    clearAiAnalysisResult();
    recomputeMatcher();
    refreshMatcherResultViews();
  }

  const evidenceCriterionSpecs = [
    { criterion: "warningSign", profile: "warningSign", label: "Warnschild" },
    { criterion: "plateLayout", profile: "plateLayout", label: "Kennzeichenanordnung" },
    { criterion: "bollard", profile: "bollard", label: "Leitpfosten" },
    { criterion: "pole", profile: "pole", label: "Mastmaterial" },
    { criterion: "shoulder", profile: "shoulder", label: "Straßenrand" },
    { criterion: "signBack", profile: "signBack", label: "Schildrückseite" },
    { criterion: "camera", profile: "camera", label: "Kameraposition" },
  ];

  const evidenceValueLabels = {
    "diamond-yellow": "gelbe Raute",
    "triangle-white": "weißes Dreieck mit rotem Rand",
    "triangle-yellow": "gelbes Dreieck mit rotem Rand",
    "white-white": "weiß vorn und hinten",
    "white-yellow": "weiß vorn, gelb hinten",
    "yellow-yellow": "gelb vorn und hinten",
    "dark-dark": "dunkel vorn und hinten",
    "white-black": "weiß mit schwarzem Feld",
    "painted-black-white": "schwarz-weiß bemalt",
    "black-yellow": "schwarz-gelbe Schutzobjekte",
    wood: "Holzmasten",
    concrete: "Betonmasten",
    paved: "befestigte Schulter",
    gravel: "Kies- oder Sandschulter",
    none: "keine nutzbare Schulter",
    drainage: "offene Betonrinne",
    dark: "dunkle Schildrückseite",
    low: "auffällig niedrige Kamera",
  };

  const evidenceProfileLabels = {
    warningSign: "Warnschild-Grundform",
    plateLayout: "Kennzeichen vorn / hinten",
    bollard: "Leitpfosten-Muster",
    pole: "Mastmaterial",
    shoulder: "Straßenrand / Schulter",
    signBack: "Schildrückseite",
    camera: "Kamera-Hinweis",
    captureMeta: "Google-Car / Aufnahmemeta",
    stopSign: "Stoppschild-Text",
    roadMarking: "Straßenmarkierung",
  };

  const confidenceLabels = {
    high: "hoch",
    medium: "mittel",
    low: "niedrig",
    unknown: "unbekannt",
  };

  const captureFeatureCriteria = [
    ["roofRack", "roof-rack", "Dachträger"],
    ["mirrors", "mirrors", "sichtbare Seitenspiegel"],
    ["snorkel", "snorkel", "Schnorchel"],
    ["equipment", "equipment", "Zelt, Gepäck oder Ersatzrad"],
    ["tape", "tape", "Klebeband oder schwarze Streifen"],
  ];

  const captureFeatureLabels = Object.freeze({
    "roof-rack": "Dachträger",
    mirrors: "sichtbare Seitenspiegel",
    snorkel: "Schnorchel",
    equipment: "Zelt / Gepäck / Ersatzrad",
    tape: "Klebeband / schwarze Streifen",
  });

  const captureTypeLabels = Object.freeze({
    car: "Google-Auto",
    motorcycle: "Motorradkamera",
    trekker: "Trekker / Fußkamera",
    boat: "Bootskamera",
  });

  const captureTypicalityLabels = Object.freeze({
    typical: "typische Variante",
    variant: "regionale oder generationsabhängige Variante",
    rare: "seltene Sonderabdeckung",
  });

  function evidenceValueLabel(value) {
    return evidenceValueLabels[value] || value;
  }

  function selectedCaptureFeatures(criteria) {
    return captureFeatureCriteria
      .filter(([criterion]) => Boolean(criteria[criterion]))
      .map(([, value]) => value);
  }

  function captureVariantDescription(variant) {
    const parts = [captureTypeLabels[variant.captureType] || variant.captureType || "Aufnahme"];
    if (variant.features?.length) {
      parts.push(variant.features.map((feature) => captureFeatureLabels[feature] || feature).join(" + "));
    }
    return parts.join(" · ");
  }

  function evaluateCaptureMeta(country, criteria) {
    const features = selectedCaptureFeatures(criteria);
    const captureType = criteria.captureType || "";
    const selected = features.length + Number(Boolean(captureType));
    const outcome = {
      selected,
      reliableMatches: 0,
      score: 0,
      uncertain: false,
      reasons: [],
      sources: new Set(),
      updatedAt: country.captureMeta?.updatedAt || "",
    };
    if (!selected) return outcome;

    const variants = Array.isArray(country.captureMeta?.variants) ? country.captureMeta.variants : [];
    if (!variants.length) {
      outcome.uncertain = true;
      outcome.reasons.push("Google-Car- und Aufnahmemeta ist für dieses Land noch nicht sicher erfasst");
      return outcome;
    }

    const relevantVariants = variants.filter((variant) => {
      if (captureType) return variant.captureType === captureType;
      if (features.length) return variant.captureType === "car";
      return true;
    });
    const exactVariants = relevantVariants.filter((variant) => {
      const documentedFeatures = new Set(variant.features || []);
      return features.every((feature) => documentedFeatures.has(feature));
    });

    if (exactVariants.length) {
      const rank = { high: 3, medium: 2, low: 1 };
      const typicalityRank = { typical: 3, variant: 2, rare: 1 };
      const best = [...exactVariants].sort((left, right) =>
        (rank[right.confidence] || 0) - (rank[left.confidence] || 0)
        || (typicalityRank[right.typicality] || 0) - (typicalityRank[left.typicality] || 0))[0];
      const verified = best.confidence === "high" && best.sources?.length > 0;
      const typicalityScore = best.typicality === "typical" ? 18 : best.typicality === "variant" ? 11 : 6;
      outcome.score += selected * 18 + typicalityScore;
      best.sources?.forEach((source) => outcome.sources.add(source));
      if (verified) outcome.reliableMatches = selected;
      else outcome.uncertain = true;
      outcome.reasons.push(`${captureVariantDescription(best)} ist dokumentiert (${captureTypicalityLabels[best.typicality] || "Abdeckungsvariante"})`);
      if (best.scope) outcome.reasons.push(best.scope);
      return outcome;
    }

    const documentedFeatures = new Set(relevantVariants.flatMap((variant) => variant.features || []));
    const partialFeatureCount = features.filter((feature) => documentedFeatures.has(feature)).length;
    const typeDocumented = captureType && variants.some((variant) => variant.captureType === captureType);
    outcome.score += partialFeatureCount * 3 + (typeDocumented ? 3 : 0);
    outcome.uncertain = true;
    outcome.reasons.push(partialFeatureCount || typeDocumented
      ? "Einzelne Fahrzeugmerkmale sind belegt, diese genaue Kombination jedoch nicht"
      : "Diese Fahrzeug- oder Aufnahmevariante ist hier noch nicht dokumentiert");
    return outcome;
  }

  function evaluateVisualEvidence(country, criteria) {
    const outcome = {
      selected: 0,
      reliableMatches: 0,
      score: 0,
      uncertain: false,
      excludedReason: "",
      reasons: [],
      sources: new Set(),
      updatedAt: country.visualEvidence?.updatedAt || "",
    };

    evidenceCriterionSpecs.forEach((spec) => {
      const selectedValue = criteria[spec.criterion];
      if (!selectedValue || outcome.excludedReason) return;
      outcome.selected += 1;
      const profile = country.visualEvidence?.profiles?.[spec.profile];
      if (!profile?.values?.length) {
        outcome.uncertain = true;
        outcome.reasons.push(`${spec.label} ist nicht sicher erfasst`);
        return;
      }
      const matched = profile.values.includes(selectedValue);
      const verified = profile.confidence === "high" && profile.sources?.length > 0;
      if (matched) {
        outcome.score += profile.confidence === "high" ? 20 : profile.confidence === "medium" ? 11 : 5;
        profile.sources?.forEach((source) => outcome.sources.add(source));
        if (verified) outcome.reliableMatches += 1;
        else outcome.uncertain = true;
        outcome.reasons.push(`${spec.label} passt${verified ? " (amtlich belegt)" : " als Zusatzhinweis"}`);
      } else if (verified && profile.exclusion === "strong") {
        outcome.excludedReason = `${spec.label} weicht vom belegten nationalen Grundtyp ab`;
      } else {
        outcome.uncertain = true;
        outcome.score -= profile.confidence === "high" ? 4 : 2;
        outcome.reasons.push(`${spec.label} kann regional oder nach Fahrzeugklasse abweichen`);
      }
    });

    return outcome;
  }

  function stopTextMatches(profile, value) {
    const text = `${profile?.displayedText || ""}`.toLocaleLowerCase("de");
    if (value === "alto") return text.includes("alto");
    if (value === "pare") return text.includes("pare");
    if (value === "berhenti") return text.includes("berhenti");
    if (value === "tomare-stop") return text.includes("止まれ");
    return false;
  }

  function stopTextLabel(value) {
    if (value === "tomare-stop") return "止まれ beziehungsweise 止まれ + STOP";
    return value.toLocaleUpperCase("de");
  }

  function hasMatcherCriteria(criteria) {
    return Object.values(criteria).some(Boolean);
  }

  function matcherColor(value) {
    const text = normalize(value);
    if (text.includes("gelb")) return "yellow";
    if (text.includes("grun")) return "green";
    if (text.includes("weiss") || text.includes("weiß") || text.includes("hell")) return "white";
    if (text === "none" || text.includes("keine") || text.includes("ohne")) return "none";
    return "";
  }

  function matcherStyle(value) {
    const text = normalize(value);
    if (!text) return "";
    if (text === "none" || text.includes("keine") || text.includes("ohne")) return "none";
    if (text.includes("solid-dashed") || text.includes("solid-left") || (text.includes("durchgezogen") && text.includes("gestrichelt"))) return "solid-dashed";
    if (text.includes("double-dashed") || (text.includes("doppelt") && text.includes("gestrichelt"))) return "double-dashed";
    if (text === "double" || text.includes("double-solid") || (text.includes("doppelt") && text.includes("durchgezogen"))) return "double-solid";
    if (text.includes("dashed") || text.includes("gestrichelt") || text.includes("unterbrochen")) return "dashed";
    if (text.includes("solid") || text.includes("durchgezogen")) return "solid";
    return "";
  }

  function matcherSurface(value) {
    const text = normalize(value);
    if (text.includes("concrete") || text.includes("beton")) return "concrete";
    if (text.includes("gravel") || text.includes("schotter")) return "gravel";
    if (text.includes("unpaved") || text.includes("unbefestigt") || text.includes("erd")) return "unpaved";
    if (text.includes("asphalt")) return "asphalt";
    return "";
  }

  function roadVariantFromStyle(style) {
    if (!style) return null;
    const centerColor = matcherColor(style.centerColor);
    const leftEdgeColor = matcherColor(style.leftEdgeColor);
    const rightEdgeColor = matcherColor(style.rightEdgeColor);
    const centerOptions = [{
      color: centerColor,
      style: centerColor === "none" ? "none" : matcherStyle(style.centerStyle),
    }];
    if (style.centerBandColor) {
      centerOptions.push({
        color: matcherColor(style.centerBandColor),
        style: matcherStyle(style.centerStyle),
      });
    }
    if (style.centerInnerColor) {
      centerOptions.push({
        color: matcherColor(style.centerInnerColor),
        style: matcherStyle(style.centerInnerStyle || style.centerStyle),
      });
    }
    return {
      centerOptions,
      edges: [
        {
          color: leftEdgeColor,
          style: leftEdgeColor === "none"
            ? "none"
            : matcherStyle(style.leftEdgeStyle || style.edgeStyle || (leftEdgeColor ? "solid" : "")),
        },
        {
          color: rightEdgeColor,
          style: rightEdgeColor === "none"
            ? "none"
            : matcherStyle(style.rightEdgeStyle || style.edgeStyle || (rightEdgeColor ? "solid" : "")),
        },
      ],
      surface: matcherSurface(style.surface || "asphalt"),
      source: "road-style",
    };
  }

  function roadVariantFromPattern(pattern) {
    if (!pattern || pattern.confidence === "unknown") return null;
    const centerOptions = [{
      color: matcherColor(pattern.center?.color),
      style: matcherStyle(pattern.center?.style),
    }];
    if (pattern.center?.bandColor) {
      centerOptions.push({
        color: matcherColor(pattern.center.bandColor),
        style: matcherStyle(pattern.center.style),
      });
    }
    if (pattern.center?.inner) {
      centerOptions.push({
        color: matcherColor(pattern.center.inner.color),
        style: matcherStyle(pattern.center.inner.style),
      });
    }
    return {
      centerOptions,
      edges: [
        {
          color: matcherColor(pattern.leftEdge?.color),
          style: matcherStyle(pattern.leftEdge?.style),
        },
        {
          color: matcherColor(pattern.rightEdge?.color),
          style: matcherStyle(pattern.rightEdge?.style),
        },
      ],
      surface: "",
      source: "map-pattern",
    };
  }

  function countryRoadVariants(country) {
    const variants = (country.roadStyles || []).map(roadVariantFromStyle).filter(Boolean);
    const mapPattern = roadVariantFromPattern(country.roadMapPattern);
    if (mapPattern) variants.push(mapPattern);
    const surfaceText = normalize(country.roads?.asphalt);
    const addSurfaceVariant = (surface) => variants.push({
      centerOptions: [],
      edges: [],
      surface,
      source: "surface-profile",
    });
    if (surfaceText.includes("schotter")) addSurfaceVariant("gravel");
    if (surfaceText.includes("unbefestigt") || surfaceText.includes("erdstrasse") || surfaceText.includes("erdstraße") || surfaceText.includes("piste")) {
      addSurfaceVariant("unpaved");
    }
    return variants;
  }

  function roadCriteriaCount(criteria) {
    return ["centerColor", "centerStyle", "edgeColor", "edgeStyle", "surface"]
      .filter((key) => criteria[key]).length;
  }

  function roadStructureSelected(criteria) {
    return Boolean(criteria.centerColor || criteria.centerStyle || criteria.edgeColor || criteria.edgeStyle);
  }

  function compareRoadVariant(variant, criteria) {
    let unknown = false;
    if (criteria.centerColor || criteria.centerStyle) {
      const knownCenterOptions = variant.centerOptions.filter((option) => option.color || option.style);
      if (!knownCenterOptions.length) {
        unknown = true;
      } else {
        const centerMatches = knownCenterOptions.some((option) => (
          (!criteria.centerColor || option.color === criteria.centerColor)
          && (!criteria.centerStyle || option.style === criteria.centerStyle)
        ));
        if (!centerMatches) return "mismatch";
      }
    }

    if (criteria.edgeColor || criteria.edgeStyle) {
      const knownEdges = variant.edges.filter((edge) => edge.color || edge.style);
      if (!knownEdges.length) {
        unknown = true;
      } else {
        const edgeMatches = knownEdges.some((edge) => (
          (!criteria.edgeColor || edge.color === criteria.edgeColor)
          && (!criteria.edgeStyle || edge.style === criteria.edgeStyle)
        ));
        if (!edgeMatches) return "mismatch";
      }
    }

    if (criteria.surface) {
      if (!variant.surface) unknown = true;
      else if (variant.surface !== criteria.surface) return "mismatch";
    }
    return unknown ? "unknown" : "match";
  }

  function evaluateRoadCriteria(country, criteria) {
    const count = roadCriteriaCount(criteria);
    if (!count) return null;
    const variableLines = country.roadLineFilterVariants;
    const variableCenterColor = Boolean(
      variableLines?.policy === "possible"
        && criteria.centerColor
        && variableLines.centerColors?.includes(criteria.centerColor),
    );
    const variableEdgeColor = Boolean(
      variableLines?.policy === "possible"
        && criteria.edgeColor
        && variableLines.edgeColors?.includes(criteria.edgeColor),
    );
    const variableColorMatch = variableCenterColor || variableEdgeColor;
    const variants = countryRoadVariants(country);
    if (!variants.length) return { outcome: "unknown", count, reliable: false };
    const comparedCriteria = variableColorMatch
      ? {
        ...criteria,
        centerColor: variableCenterColor ? "" : criteria.centerColor,
        centerStyle: variableCenterColor ? "" : criteria.centerStyle,
        edgeColor: variableEdgeColor ? "" : criteria.edgeColor,
        edgeStyle: variableEdgeColor ? "" : criteria.edgeStyle,
      }
      : criteria;
    if (variableColorMatch && !roadCriteriaCount(comparedCriteria)) {
      return { outcome: "possible", count, reliable: false, variable: true };
    }
    const comparisons = variants.map((variant) => compareRoadVariant(variant, comparedCriteria));
    const matched = comparisons.includes("match");
    const crossChecked = country.roadVerification?.status === "cross-checked";
    const reliable = crossChecked || (matched && country.detailLevel === "priorität" && country.roadVerification?.status === "partial");
    if (variableColorMatch && (matched || comparisons.includes("unknown"))) {
      return { outcome: "possible", count, reliable: false, variable: true };
    }
    if (matched) return { outcome: "match", count, reliable };
    if (comparisons.includes("unknown")) return { outcome: "unknown", count, reliable: false };
    return { outcome: "mismatch", count, reliable: crossChecked };
  }

  function plateProfile(country) {
    const text = normalize(country.licensePlates?.description);
    const descriptionColors = new Set();
    const yellowBackground = /(?:gelbe|gelben|gelber).{0,40}(?:kennzeichen|platten)|(?:vorn|hinten).{0,18}gelb|(?:kennzeichen|[a-z-]*platten)(?: sind|:)?(?:.{0,35})? gelb|reflektierend gelb/.test(text);
    const whiteBackground = /(?:weiße|weisse|weißen|weissen).{0,40}(?:kennzeichen|platten)|(?:vorn|hinten).{0,18}(?:weiß|weiss)|(?:kennzeichen|[a-z-]*platten)(?: sind|:)? (?:weiß|weiss)|helle? platten|überwiegend hell/.test(text);
    const darkBackground = /(?:schwarze|schwarzen|dunkle|dunklen).{0,32}(?:kennzeichen|platten)|(?:kennzeichen|[a-z-]*platten)(?: sind|:)? (?:schwarz|dunkel)/.test(text);
    if (yellowBackground) descriptionColors.add("yellow");
    if (whiteBackground) descriptionColors.add("white");
    if (darkBackground) descriptionColors.add("dark");

    const colors = new Set(descriptionColors);
    const layoutColors = new Set();
    const layout = country.visualEvidence?.profiles?.plateLayout;
    const layoutValues = new Set(layout?.values || []);
    if (layoutValues.has("white-white") || layoutValues.has("white-yellow")) layoutColors.add("white");
    if (layoutValues.has("yellow-yellow") || layoutValues.has("white-yellow")) layoutColors.add("yellow");
    if (layoutValues.has("dark-dark")) layoutColors.add("dark");
    layoutColors.forEach((color) => colors.add(color));

    const descriptionStrong = country.detailLevel === "priorität"
      && descriptionColors.size > 0
      && !text.includes("nicht verlasslich")
      && !text.includes("nicht zuverlässig");
    const evidenceStrong = layout?.confidence === "high" && layout?.exclusion === "strong";
    const reliableColors = new Set();
    if (descriptionStrong) descriptionColors.forEach((color) => reliableColors.add(color));
    if (evidenceStrong) layoutColors.forEach((color) => reliableColors.add(color));
    return { colors, reliableColors, strong: descriptionStrong || evidenceStrong };
  }

  function selectedMatcherCount(criteria) {
    return Object.values(criteria).filter(Boolean).length;
  }

  function evaluateMatcherCountry(country, criteria) {
    const reasons = [];
    const selectedCount = selectedMatcherCount(criteria);
    let reliableMatches = 0;
    let score = 0;
    let uncertain = false;
    let excludedReason = "";
    let roadMatched = false;
    const evidenceSources = new Set();
    let evidenceUpdatedAt = country.visualEvidence?.updatedAt || country.stopSign?.updatedAt || "";

    if (criteria.traffic) {
      if (country.traffic === criteria.traffic) {
        reliableMatches += 1;
        score += 40;
        reasons.push(criteria.traffic === "left" ? "Linksverkehr passt" : "Rechtsverkehr passt");
      } else {
        excludedReason = criteria.traffic === "left"
          ? "Das Land fährt rechts"
          : "Das Land fährt links";
      }
    }

    const roadResult = evaluateRoadCriteria(country, criteria);
    if (!excludedReason && roadResult) {
      if (roadResult.outcome === "possible") {
        uncertain = true;
        reasons.push("Straßenmarkierung variiert nach Straßentyp, Region oder Aufnahmestand");
      } else if (roadResult.outcome === "match") {
        roadMatched = true;
        score += roadResult.count * 14 + (roadResult.reliable ? 12 : 2);
        if (roadResult.reliable) reliableMatches += roadResult.count;
        else uncertain = true;
        if (roadResult.reliable) country.roadVerification?.sources?.forEach((source) => evidenceSources.add(source));
        reasons.push(roadResult.reliable
          ? "Dokumentiertes Linienmuster passt"
          : "Linienmuster ist möglich, aber nicht vollständig belegt");
      } else if (
        roadResult.outcome === "mismatch"
        && roadResult.reliable
        && roadStructureSelected(criteria)
        && ["national-default", "marked-main-road"].includes(country.roadMapPattern?.scope || "marked-main-road")
      ) {
        excludedReason = "Das dokumentierte Hauptmuster weicht ab";
      } else {
        uncertain = true;
        score -= roadResult.outcome === "mismatch" ? 5 : 0;
        reasons.push(roadResult.outcome === "mismatch"
          ? "Andere Straßentypen bleiben möglich"
          : "Straßendaten sind dafür unvollständig");
      }
    }

    if (!excludedReason && criteria.plateColor) {
      const plates = plateProfile(country);
      if (plates.colors.has(criteria.plateColor)) {
        const reliable = plates.reliableColors.has(criteria.plateColor);
        if (reliable) reliableMatches += 1;
        else uncertain = true;
        score += reliable ? 22 : 10;
        reasons.push(reliable
          ? "Kennzeichenfarbe passt"
          : "Kennzeichenfarbe ist möglich, aber nicht sicher genug für einen Ausschluss");
      } else if (plates.strong) {
        excludedReason = "Die dokumentierte Kennzeichenfarbe weicht ab";
      } else {
        uncertain = true;
        reasons.push("Kennzeichenfarbe ist nicht sicher erfasst");
      }
    }

    if (!excludedReason && criteria.stopOnly) {
      const stopSign = country.stopSign || { format: "unknown" };
      if (stopSign.format === "stop-only") {
        reliableMatches += 1;
        score += 24;
        stopSign.sources?.forEach((source) => evidenceSources.add(source));
        reasons.push("STOP-Schild zeigt nur „STOP“");
      } else if (stopSign.format === "local-or-multilingual") {
        excludedReason = stopSign.exclusionReason || "Das übliche Stoppschild enthält eine andere Beschriftung";
      } else {
        uncertain = true;
        reasons.push(stopSign.format === "variable"
          ? "STOP-Schildtext ist regional unterschiedlich"
          : "STOP-Schildtext ist nicht sicher erfasst");
      }
    }

    if (!excludedReason && criteria.stopOther) {
      const stopSign = country.stopSign || { format: "unknown" };
      if (stopSign.format === "local-or-multilingual") {
        reliableMatches += 1;
        score += 24;
        stopSign.sources?.forEach((source) => evidenceSources.add(source));
        reasons.push("STOP-Schild zeigt einen anderen oder zusätzlichen Text");
      } else if (stopSign.format === "stop-only") {
        excludedReason = "Das übliche Stoppschild zeigt ausschließlich „STOP“";
      } else {
        uncertain = true;
        reasons.push(stopSign.format === "variable"
          ? "STOP-Schildtext ist regional unterschiedlich"
          : "STOP-Schildtext ist nicht sicher erfasst");
      }
    }

    if (!excludedReason && criteria.stopText) {
      const stopSign = country.stopSign || { format: "unknown", confidence: "unknown", sources: [] };
      if (stopTextMatches(stopSign, criteria.stopText)) {
        const verified = stopSign.confidence === "high" && stopSign.sources?.length > 0;
        score += verified ? 24 : 10;
        if (verified) reliableMatches += 1;
        else uncertain = true;
        stopSign.sources?.forEach((source) => evidenceSources.add(source));
        evidenceUpdatedAt = stopSign.updatedAt || evidenceUpdatedAt;
        reasons.push(`Stoppschild-Text ${stopTextLabel(criteria.stopText)} passt${verified ? " (amtlich belegt)" : ""}`);
      } else if (stopSign.confidence === "high" && stopSign.sources?.length && stopSign.format !== "variable") {
        excludedReason = `Das belegte Stoppschild zeigt „${stopSign.displayedText}“`;
      } else {
        uncertain = true;
        reasons.push("Stoppschild-Text ist nicht sicher oder regional einheitlich erfasst");
      }
    }

    if (!excludedReason) {
      const visualResult = evaluateVisualEvidence(country, criteria);
      score += visualResult.score;
      reliableMatches += visualResult.reliableMatches;
      uncertain ||= visualResult.uncertain;
      visualResult.reasons.forEach((reason) => reasons.push(reason));
      visualResult.sources.forEach((source) => evidenceSources.add(source));
      evidenceUpdatedAt = visualResult.updatedAt || evidenceUpdatedAt;
      if (visualResult.excludedReason) excludedReason = visualResult.excludedReason;
    }

    if (!excludedReason) {
      const captureResult = evaluateCaptureMeta(country, criteria);
      score += captureResult.score;
      reliableMatches += captureResult.reliableMatches;
      uncertain ||= captureResult.uncertain;
      captureResult.reasons.forEach((reason) => reasons.push(reason));
      captureResult.sources.forEach((source) => evidenceSources.add(source));
      evidenceUpdatedAt = captureResult.updatedAt || evidenceUpdatedAt;
    }

    if (state.matcher.manualExcluded.has(country.iso3)) {
      excludedReason = "Manuell ausgeschlossen";
    }

    if (excludedReason) {
      return {
        status: "excluded",
        score: -1000,
        reasons: [excludedReason],
        roadMatched: false,
        manual: state.matcher.manualExcluded.has(country.iso3),
        verifiedMatches: reliableMatches,
        selectedCount,
        sourceCount: evidenceSources.size,
        sources: [...evidenceSources],
        updatedAt: evidenceUpdatedAt,
      };
    }

    const status = !uncertain && reliableMatches === selectedCount ? "match" : "possible";
    return {
      status,
      score,
      reasons: reasons.length ? reasons : ["Keine widersprechenden Daten"],
      roadMatched,
      manual: false,
      verifiedMatches: reliableMatches,
      selectedCount,
      sourceCount: evidenceSources.size,
      sources: [...evidenceSources],
      updatedAt: evidenceUpdatedAt,
    };
  }

  function matcherStatusLabel(status) {
    if (status === "match") return "Passt gut";
    if (status === "possible") return "Noch möglich";
    return "Eher ausgeschlossen";
  }

  function renderMatcherCandidates(criteria) {
    if (!elements.matcherCandidates) return;
    if (!state.matcher.active || !hasMatcherCriteria(criteria)) {
      elements.matcherCandidates.innerHTML = '<p class="matcher-empty-result">Wähle oben Merkmale aus, um Länder ein- und auszuschließen.</p>';
      return;
    }

    const candidates = countryList
      .map((country) => ({ country, result: state.matcher.results.get(country.iso3) }))
      .filter((entry) => entry.result
        && entry.result.status !== "excluded"
        && matchesSearchAndQuickFilters(entry.country))
      .sort((left, right) => {
        const statusOrder = { match: 0, possible: 1 };
        return statusOrder[left.result.status] - statusOrder[right.result.status]
          || right.result.score - left.result.score
          || left.country.name.localeCompare(right.country.name, "de");
      });
    const exactMatches = candidates.filter((entry) => entry.result.status === "match");
    const possibleMatches = candidates.filter((entry) => entry.result.status === "possible");
    const visible = [...exactMatches, ...possibleMatches.slice(0, Math.max(0, 36 - exactMatches.length))].slice(0, 48);

    if (!visible.length) {
      elements.matcherCandidates.innerHTML = '<p class="matcher-empty-result">Keine belastbaren Treffer. Entferne ein unsicheres Merkmal und prüfe erneut.</p>';
      return;
    }

    const cards = visible.map(({ country, result }) => {
      const bestClass = result.status === "match" ? " is-best-match" : "";
      const reason = result.reasons.slice(0, 2).join(" · ");
      const quality = result.verifiedMatches > 0
        ? '<span class="is-verified">' + result.verifiedMatches + "/" + result.selectedCount + ' belastbar</span>'
        : '<span>Daten vorsichtig werten</span>';
      const sources = result.sourceCount
        ? '<span>' + result.sourceCount + (result.sourceCount === 1 ? ' Quelle' : ' Quellen') + '</span>'
        : '';
      return '<article class="matcher-candidate-card ' + (result.status === "match" ? "is-match" : "is-possible") + bestClass + '" data-iso="' + country.iso3 + '">'
        + '<button class="matcher-result-button" type="button" data-matcher-open="' + country.iso3 + '">'
        + '<strong>' + flagEmoji(country.iso2) + " " + escapeHtml(country.name) + '</strong>'
        + '<span>' + country.iso3 + " · " + matcherStatusLabel(result.status) + '</span>'
        + '</button>'
        + '<p class="matcher-reason">' + escapeHtml(reason) + '</p>'
        + '<p class="matcher-evidence">' + quality + sources + '</p>'
        + '<button class="matcher-exclude-button" type="button" data-matcher-exclude="' + country.iso3 + '">Ausschließen</button>'
        + '</article>';
    }).join("");
    const hiddenCount = candidates.length - visible.length;
    const more = hiddenCount > 0
      ? '<p class="matcher-overflow-note"><strong>+' + hiddenCount + ' weitere</strong><span>Alle bleiben auf der Karte markiert. Wähle mehr Merkmale, um einzugrenzen.</span></p>'
      : "";
    elements.matcherCandidates.innerHTML = cards + more;
  }

  function renderMatcherExcluded() {
    if (!elements.matcherExcludedSummary) return;
    const excluded = countryList
      .map((country) => ({ country, result: state.matcher.results.get(country.iso3) }))
      .filter((entry) => entry.result?.status === "excluded");
    const manual = excluded.filter((entry) => entry.result.manual);
    const automatic = excluded.filter((entry) => !entry.result.manual && matchesSearchAndQuickFilters(entry.country));
    const automaticCount = automatic.length;
    if (!excluded.length) {
      elements.matcherExcludedSummary.innerHTML = "";
      elements.matcherExcludedSummary.textContent = "Noch keine Länder ausgeschlossen.";
      return;
    }
    const automaticText = automaticCount
      ? '<details class="matcher-auto-excluded">'
        + '<summary>' + automaticCount + (automaticCount === 1 ? ' Land' : ' Länder') + ' eher ausgeschlossen – Namen anzeigen</summary>'
        + '<div class="matcher-auto-excluded-list">'
        + automatic.map(({ country }) => (
          '<button type="button" data-matcher-open="' + country.iso3 + '">' + escapeHtml(country.name) + ' <span>' + country.iso3 + '</span></button>'
        )).join("")
        + '</div>'
        + '<p>Diese Gruppe folgt den ausgewählten Merkmalen. Ändere oben ein Merkmal, um Länder wieder automatisch einzuschließen.</p>'
        + '</details>'
      : '<strong>Keine Länder automatisch ausgeschlossen.</strong>';
    const manualMarkup = manual.length
      ? '<span class="matcher-excluded-label">Manuell:</span><span class="matcher-excluded-list">'
        + manual.map(({ country }) => (
          '<span class="matcher-excluded-item">'
          + '<button type="button" data-matcher-open="' + country.iso3 + '">' + escapeHtml(country.name) + " (" + country.iso3 + ')</button>'
          + '<button type="button" data-matcher-restore="' + country.iso3 + '">Wieder einschließen</button>'
          + '</span>'
        )).join("")
        + '</span>'
      : "";
    elements.matcherExcludedSummary.innerHTML = automaticText + manualMarkup;
  }

  function renderMatcherSummary(criteria) {
    if (!elements.matcherSummary) return;
    if (!state.matcher.active) {
      elements.matcherSummary.textContent = "Noch keine Merkmale ausgewählt. Alle Länder bleiben möglich.";
      return;
    }
    if (!hasMatcherCriteria(criteria)) {
      const count = state.matcher.manualExcluded.size;
      elements.matcherSummary.textContent = count
        ? `${count} ${count === 1 ? "Land wurde" : "Länder wurden"} manuell ausgeschlossen. Alle übrigen Länder bleiben möglich.`
        : "Noch keine Merkmale ausgewählt. Alle Länder bleiben möglich.";
      return;
    }
    const results = countryList
      .filter((country) => matchesSearchAndQuickFilters(country))
      .map((country) => state.matcher.results.get(country.iso3))
      .filter(Boolean);
    const matchCount = results.filter((result) => result.status === "match").length;
    const possibleCount = results.filter((result) => result.status === "possible").length;
    const excludedCount = results.filter((result) => result.status === "excluded").length;
    elements.matcherSummary.textContent = matchCount + (matchCount === 1 ? " passt gut · " : " passen gut · ")
      + possibleCount + " noch möglich · "
      + excludedCount + " eher ausgeschlossen. Unsichere Daten bleiben absichtlich in „noch möglich“.";
  }

  function refreshMatcherResultViews() {
    if (!state.matcher.active) return;
    if (state.matcher.source === "ai") {
      if (state.matcher.ai.analysis) renderAiCountryAnalysis(state.matcher.ai.analysis);
      return;
    }
    const criteria = readMatcherCriteria();
    renderMatcherSummary(criteria);
    renderMatcherCandidates(criteria);
    renderMatcherExcluded();
  }

  function updateMatcherRoadPreview(criteria) {
    if (!elements.matcherRoadPreview) return;
    const road = elements.matcherRoadPreview.querySelector(".matcher-preview-road");
    const band = elements.matcherRoadPreview.querySelector(".matcher-preview-band");
    const centers = elements.matcherRoadPreview.querySelectorAll(".matcher-preview-center");
    const leftEdge = elements.matcherRoadPreview.querySelector(".matcher-preview-edge.left");
    const rightEdge = elements.matcherRoadPreview.querySelector(".matcher-preview-edge.right");
    const colors = {
      white: "#f1f2ed",
      yellow: "#ffd84f",
      green: "#51d49a",
      none: "transparent",
    };
    const surfaceColors = {
      asphalt: "#353a3d",
      concrete: "#777b7b",
      gravel: "#85755e",
      unpaved: "#775b3f",
    };
    if (road) road.setAttribute("fill", surfaceColors[criteria.surface] || "#495056");

    const applyLine = (line, color, style, visible = true, opacity = 1) => {
      if (!line) return;
      line.style.display = visible ? "" : "none";
      line.style.opacity = String(opacity);
      line.setAttribute("stroke", colors[color] || "#87939a");
      line.setAttribute("stroke-dasharray", style === "unspecified"
        ? "2 6"
        : ["dashed", "double-dashed"].includes(style) ? "12 9" : "");
    };

    const edgeColor = criteria.edgeColor;
    const edgeStyle = criteria.edgeStyle || "unspecified";
    const edgeHasSelection = Boolean(criteria.edgeColor || criteria.edgeStyle);
    const showEdges = edgeHasSelection && criteria.edgeColor !== "none" && criteria.edgeStyle !== "none";
    const edgeOpacity = criteria.edgeColor && criteria.edgeStyle ? 1 : 0.58;
    applyLine(leftEdge, edgeColor, edgeStyle, showEdges, edgeOpacity);
    applyLine(rightEdge, edgeColor, edgeStyle, showEdges, edgeOpacity);

    const centerColor = criteria.centerColor;
    const centerStyle = criteria.centerStyle || (centerColor === "green" ? "double-solid" : "unspecified");
    const centerHasSelection = Boolean(criteria.centerColor || criteria.centerStyle);
    const showCenter = centerHasSelection && criteria.centerColor !== "none" && criteria.centerStyle !== "none";
    const doubleCenter = ["double-solid", "double-dashed", "solid-dashed"].includes(centerStyle) || centerColor === "green";
    const centerOpacity = centerColor && (criteria.centerStyle || centerColor === "green") ? 1 : 0.58;
    const centerLines = Array.from(centers);
    centerLines.forEach((line, index) => {
      const visible = showCenter && (index === 0 || doubleCenter);
      const lineStyle = centerStyle === "solid-dashed"
        ? (index === 0 ? "solid" : "dashed")
        : centerStyle;
      applyLine(line, centerColor === "green" ? "white" : centerColor, lineStyle, visible, centerOpacity);
      if (line) {
        line.setAttribute("d", doubleCenter
          ? (index === 0 ? "M145 118 L148 20" : "M155 118 L152 20")
          : "M150 118 L150 20");
      }
    });
    if (band) {
      band.style.display = centerColor === "green" && showCenter ? "" : "none";
      band.setAttribute("stroke", colors.green);
    }
  }

  function recomputeMatcher({ preserveAi = false } = {}) {
    const criteria = readMatcherCriteria();
    syncMatcherFilterChips();
    if (preserveAi && state.matcher.source === "ai" && state.matcher.ai.analysis) {
      drawRoadLineOverlays();
      updateMapMatches();
      renderAiCountryAnalysis(state.matcher.ai.analysis);
      return;
    }
    state.matcher.active = hasMatcherCriteria(criteria) || state.matcher.manualExcluded.size > 0;
    state.matcher.source = state.matcher.active ? "quick" : null;
    state.matcher.results.clear();
    state.matcher.roadCandidates.clear();
    if (state.matcher.active) {
      const roadMatches = [];
      countryList.forEach((country) => {
        const result = evaluateMatcherCountry(country, criteria);
        state.matcher.results.set(country.iso3, result);
        if (result.status !== "excluded" && result.roadMatched) roadMatches.push({ country, result });
      });
      roadMatches
        .sort((left, right) => Number(right.result.status === "match") - Number(left.result.status === "match")
          || right.result.score - left.result.score
          || left.country.name.localeCompare(right.country.name, "de"))
        .slice(0, 12)
        .forEach(({ country }) => state.matcher.roadCandidates.add(country.iso3));
    }
    drawRoadLineOverlays();
    updateMapMatches();
  }

  function setAiHelperStatus(status, message) {
    if (!elements.aiHelperStatus) return;
    const indicator = document.createElement("span");
    indicator.setAttribute("aria-hidden", "true");
    elements.aiHelperStatus.dataset.state = status;
    elements.aiHelperStatus.replaceChildren(indicator, document.createTextNode(message));
    elements.aiHelperCard?.setAttribute("data-helper-state", status);
  }

  function validateAiImageFile(file) {
    if (!file) return "Wähle zuerst einen Straßen-Screenshot aus.";
    if (!AI_ALLOWED_IMAGE_TYPES.has(file.type)) {
      return "Bitte verwende ein Bild im Format PNG, JPEG oder WebP.";
    }
    if (!Number.isFinite(file.size) || file.size <= 0) {
      return "Die ausgewählte Bilddatei ist leer oder konnte nicht gelesen werden.";
    }
    if (file.size > AI_MAX_IMAGE_BYTES) {
      return "Das Bild ist größer als 12 MB. Wähle bitte einen kleineren Screenshot.";
    }
    return "";
  }

  function updateAiAnalyzeButton() {
    if (!elements.analyzeScreenshotButton) return;
    const file = elements.roadScreenshot?.files?.[0];
    const hasValidImage = Boolean(file) && !validateAiImageFile(file);
    elements.analyzeScreenshotButton.disabled = !hasValidImage || state.matcher.ai.analyzing;
    elements.analyzeScreenshotButton.textContent = state.matcher.ai.analyzing
      ? "KI analysiert …"
      : "Mit KI analysieren";
    if (elements.resetAiAnalysisButton) {
      elements.resetAiAnalysisButton.disabled = !state.matcher.ai.analysis || state.matcher.ai.analyzing;
    }
  }

  function cancelAiAnalysis() {
    const wasAnalyzing = state.matcher.ai.analyzing;
    state.matcher.ai.analysisRequestId += 1;
    state.matcher.ai.controller?.abort();
    state.matcher.ai.controller = null;
    state.matcher.ai.analyzing = false;
    if (wasAnalyzing) {
      setAiHelperStatus("checking", "Analyse abgebrochen · Helfer wird geprüft …");
      void checkAiHelperHealth();
    }
  }

  function clearAiAnalysisResult() {
    if (state.matcher.ai.analyzing) cancelAiAnalysis();
    const wasAiActive = state.matcher.source === "ai";
    state.matcher.ai.analysis = null;
    state.matcher.ai.countryGroups = { likely: [], possible: [], excluded: [] };
    state.matcher.ai.imageClues = [];
    state.matcher.ai.bestGuessIso = "";
    state.matcher.ai.filterContext = { version: 1, activeFilters: [] };
    if (wasAiActive) {
      state.matcher.results.clear();
      state.matcher.roadCandidates.clear();
      state.matcher.active = false;
      state.matcher.source = null;
    }
    if (elements.aiAnalysisResult) {
      elements.aiAnalysisResult.replaceChildren();
      elements.aiAnalysisResult.hidden = true;
      delete elements.aiAnalysisResult.dataset.state;
    }
    if (wasAiActive) recomputeMatcher();
    else updateMapMatches();
    updateAiAnalyzeButton();
    syncMatcherFilterChips();
  }

  function showAiAnalysisMessage(status, title, message) {
    if (!elements.aiAnalysisResult) return;
    const heading = document.createElement("strong");
    const copy = document.createElement("p");
    heading.textContent = title;
    copy.textContent = message;
    elements.aiAnalysisResult.dataset.state = status;
    elements.aiAnalysisResult.replaceChildren(heading, copy);
    elements.aiAnalysisResult.hidden = false;
  }

  async function readHelperResponse(response) {
    const raw = await response.text();
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return { message: raw.slice(0, 300) };
    }
  }

  function helperErrorMessage(response, payload) {
    const code = String(payload?.error?.code || payload?.code || "").toUpperCase();
    const knownMessages = {
      API_KEY_MISSING: "Im lokalen Helfer ist noch kein Groq-Key gespeichert. Öffne den Helfer und trage dort deinen Key ein.",
      MISSING_API_KEY: "Im lokalen Helfer ist noch kein Groq-Key gespeichert. Öffne den Helfer und trage dort deinen Key ein.",
      INVALID_API_KEY: "Der gespeicherte Groq-Key wurde abgelehnt. Öffne den lokalen Helfer und prüfe den Key.",
      RATE_LIMITED: "Das kostenlose Groq-Limit ist gerade erreicht. Warte kurz und versuche es erneut.",
      RATE_LIMIT: "Das kostenlose Groq-Limit ist gerade erreicht. Warte kurz und versuche es erneut.",
      IMAGE_TOO_LARGE: "Der Screenshot ist für die Analyse zu groß. Wähle bitte ein kleineres Bild.",
      UNSUPPORTED_IMAGE: "Dieses Bildformat wird nicht unterstützt. Verwende PNG, JPEG oder WebP.",
      INVALID_IMAGE: "Der Screenshot konnte nicht als gültiges Bild gelesen werden. Speichere ihn erneut als PNG, JPEG oder WebP.",
      UPSTREAM_ERROR: "Groq konnte die Analyse gerade nicht abschließen. Warte kurz und versuche es erneut.",
      UPSTREAM_TIMEOUT: "Groq hat nicht rechtzeitig geantwortet. Versuche die Analyse bitte erneut.",
    };
    if (knownMessages[code]) return knownMessages[code];
    if (response.status === 401 || response.status === 403) {
      return "Der Groq-Key fehlt oder wurde abgelehnt. Öffne den lokalen Helfer und prüfe ihn dort.";
    }
    if (response.status === 413) return "Der Screenshot ist für die Analyse zu groß.";
    if (response.status === 429) return "Das kostenlose Groq-Limit ist gerade erreicht. Warte kurz und versuche es erneut.";
    const serverMessage = payload?.error?.message || payload?.error || payload?.message;
    if (typeof serverMessage === "string" && serverMessage.trim()) return serverMessage.trim().slice(0, 300);
    return `Der lokale Helfer konnte die Analyse nicht abschließen (Fehler ${response.status}).`;
  }

  async function checkAiHelperHealth() {
    if (!elements.aiHelperStatus) return false;
    const requestId = ++state.matcher.ai.healthRequestId;
    const controller = new AbortController();
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, AI_HELPER_HEALTH_TIMEOUT_MS);
    setAiHelperStatus("checking", "Lokaler Helfer wird geprüft …");
    try {
      const response = await fetch(`${AI_HELPER_BASE_URL}/health`, {
        method: "GET",
        headers: { ...AI_HELPER_HEADER, Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      });
      const payload = await readHelperResponse(response);
      if (!response.ok || payload.ok === false) throw new Error(helperErrorMessage(response, payload));
      if (requestId !== state.matcher.ai.healthRequestId) return false;
      const configured = payload.groqConfigured ?? payload.apiKeyConfigured ?? payload.configured;
      if (configured === false) {
        setAiHelperStatus("needs-key", "Helfer läuft · Groq-Key fehlt");
      } else {
        setAiHelperStatus("connected", "Lokaler Helfer verbunden");
      }
      return true;
    } catch (error) {
      if (requestId !== state.matcher.ai.healthRequestId) return false;
      const message = timedOut
        ? "Helfer antwortet nicht"
        : "Lokaler Helfer nicht erreichbar";
      setAiHelperStatus("offline", message);
      return false;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function cleanAiText(value, maxLength = 500) {
    if (typeof value !== "string") return "";
    return value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
  }

  function cleanAiTextList(value, limit = 5, maxLength = 320) {
    const source = Array.isArray(value) ? value : (typeof value === "string" ? [value] : []);
    return [...new Set(source.map((item) => cleanAiText(item, maxLength)).filter(Boolean))].slice(0, limit);
  }

  function parseAiConfidence(value) {
    return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1 ? value : null;
  }

  function parseAiCountryCandidate(raw, sourceGroup, visibleEvidenceCategories) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    let iso3 = cleanAiText(raw.iso3, 8).toUpperCase();
    if (iso3 === "XKX") iso3 = "KOS";
    if (!/^[A-Z]{3}$/.test(iso3) || !countries[iso3]) return null;
    const confidence = parseAiConfidence(raw.confidence);
    if (confidence === null) return null;
    const reasons = cleanAiTextList(raw.reasons);
    const evidence = cleanAiTextList(raw.evidence);
    const evidenceCategories = cleanAiTextList(raw.evidenceCategories, 14, 40)
      .map((category) => category.toLowerCase())
      .filter((category) => AI_CLUE_LABELS[category] && visibleEvidenceCategories.has(category));
    if (!reasons.length && !evidence.length) return null;

    let group = sourceGroup;
    let downgraded = false;
    if (sourceGroup === "likely" && confidence < AI_LIKELY_CONFIDENCE) {
      group = "possible";
      downgraded = true;
    }
    if (sourceGroup === "excluded" && confidence < AI_EXCLUDED_CONFIDENCE) {
      group = "possible";
      downgraded = true;
    }
    const hasRobustVisibleExclusion = evidenceCategories.some((category) => AI_ROBUST_EXCLUSION_CATEGORIES.has(category));
    if (sourceGroup === "excluded" && !hasRobustVisibleExclusion) {
      group = "possible";
      downgraded = true;
    }
    if (downgraded) {
      if (sourceGroup === "excluded" && confidence < AI_EXCLUDED_CONFIDENCE) {
        reasons.push("Der vorgeschlagene Ausschluss war zu unsicher und bleibt deshalb nur eine offene Möglichkeit.");
      } else if (sourceGroup === "excluded") {
        reasons.push("Ohne robuste sichtbare Widerspruchskategorie bleibt dieses Land möglich.");
      } else {
        reasons.push("Die Sicherheit war für einen starken Kandidaten zu niedrig.");
      }
    }
    return { iso3, confidence, reasons: reasons.slice(0, 6), evidence, evidenceCategories, group, sourceGroup };
  }

  function parseAiCountryAnalysis(payload, filterContext = { version: 1, activeFilters: [] }) {
    const raw = payload?.countryAnalysis;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const warnings = cleanAiTextList(payload.warnings, 8, 400);
    const requestedFilterContext = displayAiFilterContext(filterContext);
    const appliedFilterContext = displayAiFilterContext(payload.appliedFilterContext);
    const requestedFilterSignature = aiFilterContextSignature(requestedFilterContext);
    const appliedFilterSignature = aiFilterContextSignature(appliedFilterContext);
    const filterContextApplied = !requestedFilterSignature || requestedFilterSignature === appliedFilterSignature;
    if (requestedFilterSignature && !filterContextApplied) {
      warnings.push("Der lokale Helfer hat die ausgewählten Filter nicht bestätigt. Lade die aktuelle Helfer-Version herunter und analysiere das Bild erneut.");
    }
    const imageClues = [];
    const clueKeys = new Set();
    const rawClues = Array.isArray(raw.imageClues) ? raw.imageClues : [];
    rawClues.slice(0, 40).forEach((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return;
      const category = cleanAiText(item.category, 40).toLowerCase();
      const observation = cleanAiText(item.observation, 420);
      const confidence = parseAiConfidence(item.confidence);
      if (!AI_CLUE_LABELS[category] || !observation || confidence === null) return;
      const key = `${category}\n${observation.toLocaleLowerCase("de")}`;
      if (clueKeys.has(key)) return;
      clueKeys.add(key);
      imageClues.push({ category, observation, confidence });
    });
    const visibleEvidenceCategories = new Set(imageClues.map((clue) => clue.category));
    let bestGuess = parseAiCountryCandidate(raw.bestGuess, "possible", visibleEvidenceCategories);
    if (raw.bestGuess && !bestGuess) {
      warnings.push("Der beste Ländertipp des Helfers war ungültig und wurde sicher ignoriert.");
    }

    const candidatesByIso = new Map();
    let ignoredCountries = 0;
    (["likely", "possible", "excluded"]).forEach((sourceGroup) => {
      const list = Array.isArray(raw[sourceGroup]) ? raw[sourceGroup] : [];
      list.slice(0, 40).forEach((item) => {
        const candidate = parseAiCountryCandidate(item, sourceGroup, visibleEvidenceCategories);
        if (!candidate) {
          ignoredCountries += 1;
          return;
        }
        const existing = candidatesByIso.get(candidate.iso3);
        if (!existing) {
          candidatesByIso.set(candidate.iso3, candidate);
          return;
        }
        const mergedReasons = [...new Set([...existing.reasons, ...candidate.reasons])].slice(0, 6);
        const mergedEvidence = [...new Set([...existing.evidence, ...candidate.evidence])].slice(0, 6);
        const mergedEvidenceCategories = [...new Set([...existing.evidenceCategories, ...candidate.evidenceCategories])].slice(0, 14);
        if (existing.sourceGroup === candidate.sourceGroup) {
          candidatesByIso.set(candidate.iso3, {
            ...(candidate.confidence > existing.confidence ? candidate : existing),
            confidence: Math.max(existing.confidence, candidate.confidence),
            reasons: mergedReasons,
            evidence: mergedEvidence,
            evidenceCategories: mergedEvidenceCategories,
          });
          return;
        }
        candidatesByIso.set(candidate.iso3, {
          ...(candidate.confidence > existing.confidence ? candidate : existing),
          confidence: Math.max(existing.confidence, candidate.confidence),
          group: "possible",
          reasons: [...mergedReasons, "Die KI hat dieses Land widersprüchlich eingeordnet; es bleibt deshalb nur möglich."].slice(0, 7),
          evidence: mergedEvidence,
          evidenceCategories: mergedEvidenceCategories,
          sourceGroup: "possible",
        });
      });
    });

    if (bestGuess) {
      const existing = candidatesByIso.get(bestGuess.iso3);
      const mergedReasons = [...new Set([...(existing?.reasons || []), ...bestGuess.reasons])].slice(0, 7);
      const mergedEvidence = [...new Set([...(existing?.evidence || []), ...bestGuess.evidence])].slice(0, 6);
      const mergedEvidenceCategories = [...new Set([
        ...(existing?.evidenceCategories || []),
        ...bestGuess.evidenceCategories,
      ])].slice(0, 14);
      const contradicted = existing?.group === "excluded";
      const group = contradicted
        ? "possible"
        : (Math.max(existing?.confidence || 0, bestGuess.confidence) >= AI_LIKELY_CONFIDENCE ? "likely" : "possible");
      bestGuess = {
        ...(existing || bestGuess),
        iso3: bestGuess.iso3,
        confidence: Math.max(existing?.confidence || 0, bestGuess.confidence),
        reasons: contradicted
          ? [...mergedReasons, "Der beste Tipp war zugleich als ausgeschlossen markiert und bleibt deshalb nur eine unsichere Möglichkeit."].slice(0, 7)
          : mergedReasons,
        evidence: mergedEvidence,
        evidenceCategories: mergedEvidenceCategories,
        group,
        sourceGroup: group,
      };
      if (contradicted) warnings.push("Ein widersprüchlich ausgeschlossener bester Tipp wurde zu „möglich“ zurückgestuft.");
      candidatesByIso.set(bestGuess.iso3, bestGuess);
    } else {
      const fallbackCandidates = [...candidatesByIso.values()]
        .filter((candidate) => candidate.group !== "excluded")
        .sort((left, right) => right.confidence - left.confidence);
      if (!fallbackCandidates.length) {
        const excludedFallback = [...candidatesByIso.values()]
          .sort((left, right) => right.confidence - left.confidence)[0];
        if (excludedFallback) {
          bestGuess = {
            ...excludedFallback,
            group: "possible",
            sourceGroup: "possible",
            reasons: [...excludedFallback.reasons, "Mangels positiver Kandidaten ist dies nur der am wenigsten widersprüchliche Tipp."].slice(0, 7),
          };
          candidatesByIso.set(bestGuess.iso3, bestGuess);
        }
      } else {
        [bestGuess] = fallbackCandidates;
      }
      if (bestGuess) warnings.push("Der Helfer lieferte keinen eigenen besten Tipp; er wurde aus den Kandidaten abgeleitet.");
    }

    if (!bestGuess) return null;

    const countryGroups = { likely: [], possible: [], excluded: [] };
    candidatesByIso.forEach((candidate) => countryGroups[candidate.group].push(candidate));
    Object.keys(countryGroups).forEach((group) => {
      countryGroups[group] = countryGroups[group]
        .sort((left, right) => right.confidence - left.confidence
          || countries[left.iso3].name.localeCompare(countries[right.iso3].name, "de"))
        .slice(0, AI_COUNTRY_LIMITS[group]);
    });
    const bestGuessGroup = bestGuess.group === "likely" ? "likely" : "possible";
    if (!countryGroups[bestGuessGroup].some((candidate) => candidate.iso3 === bestGuess.iso3)) {
      if (countryGroups[bestGuessGroup].length >= AI_COUNTRY_LIMITS[bestGuessGroup]) {
        countryGroups[bestGuessGroup].pop();
      }
      countryGroups[bestGuessGroup].push(bestGuess);
      countryGroups[bestGuessGroup].sort((left, right) => right.confidence - left.confidence
        || countries[left.iso3].name.localeCompare(countries[right.iso3].name, "de"));
    }
    if (ignoredCountries) {
      warnings.push(`${ignoredCountries} ungültige oder unbekannte Ländereinträge wurden sicher ignoriert.`);
    }
    return {
      summary: cleanAiText(raw.summary, 1000)
        || cleanAiText(payload.summary, 1000)
        || "Die KI hat das gesamte sichtbare Straßenbild ausgewertet.",
      model: cleanAiText(payload.model, 100),
      imageClues: imageClues.slice(0, 24),
      bestGuess,
      filterContext: filterContextApplied ? appliedFilterContext : { version: 1, activeFilters: [] },
      filterContextApplied,
      countryGroups,
      warnings: [...new Set(warnings)].slice(0, 10),
    };
  }

  function applyAiCountryAnalysis(analysis) {
    state.matcher.results.clear();
    state.matcher.roadCandidates.clear();
    state.matcher.ai.analysis = analysis;
    state.matcher.ai.imageClues = analysis.imageClues;
    state.matcher.ai.countryGroups = analysis.countryGroups;
    state.matcher.ai.bestGuessIso = analysis.bestGuess.iso3;
    state.matcher.ai.filterContext = analysis.filterContext;
    const statusByGroup = { likely: "match", possible: "possible", excluded: "excluded" };
    let resultCount = 0;
    Object.entries(analysis.countryGroups).forEach(([group, candidates]) => {
      candidates.forEach((candidate) => {
        resultCount += 1;
        state.matcher.results.set(candidate.iso3, {
          status: statusByGroup[group],
          score: Math.round(candidate.confidence * 100),
          reasons: candidate.reasons,
          roadMatched: group !== "excluded",
          manual: false,
        });
        if (group !== "excluded") state.matcher.roadCandidates.add(candidate.iso3);
      });
    });
    state.matcher.active = resultCount > 0;
    state.matcher.source = resultCount > 0 ? "ai" : null;
    syncMatcherFilterChips();
    drawRoadLineOverlays();
    updateMapMatches();
    updateAiAnalyzeButton();
  }

  function appendAiCountryGroup(container, group, title, description) {
    const allCandidates = state.matcher.ai.countryGroups[group] || [];
    if (!allCandidates.length) return;
    const candidates = allCandidates.filter((candidate) => matchesSearchAndQuickFilters(countries[candidate.iso3]));
    const section = document.createElement("section");
    const heading = document.createElement("div");
    const headingText = document.createElement("h4");
    const count = document.createElement("span");
    heading.className = "ai-country-group-heading";
    headingText.textContent = title;
    count.textContent = candidates.length === allCandidates.length
      ? String(allCandidates.length)
      : `${candidates.length} von ${allCandidates.length}`;
    heading.append(headingText, count);
    section.className = `ai-country-group is-${group}`;
    section.append(heading);
    const intro = document.createElement("p");
    intro.className = "ai-country-group-copy";
    intro.textContent = description;
    section.append(intro);

    const list = document.createElement("div");
    list.className = "ai-country-list";
    candidates.forEach((candidate) => {
      const country = countries[candidate.iso3];
      const button = document.createElement("button");
      const topLine = document.createElement("span");
      const name = document.createElement("strong");
      const confidence = document.createElement("span");
      const reasons = document.createElement("ul");
      button.type = "button";
      button.className = "ai-country-card";
      button.dataset.selectCountry = candidate.iso3;
      button.setAttribute("aria-label", `${country.name} öffnen, ${Math.round(candidate.confidence * 100)} Prozent KI-Konfidenz`);
      topLine.className = "ai-country-card-heading";
      name.textContent = `${flagEmoji(country.iso2)} ${country.name}`;
      confidence.textContent = `${Math.round(candidate.confidence * 100)} %`;
      topLine.append(name, confidence);
      reasons.className = "ai-country-reasons";
      candidate.reasons.slice(0, 3).forEach((reason) => {
        const item = document.createElement("li");
        item.textContent = reason;
        reasons.append(item);
      });
      if (candidate.evidence.length) {
        const evidence = document.createElement("small");
        evidence.textContent = `Sichtbar: ${candidate.evidence.slice(0, 3).join(" · ")}`;
        button.append(topLine, reasons, evidence);
      } else {
        button.append(topLine, reasons);
      }
      list.append(button);
    });
    if (!candidates.length) {
      const empty = document.createElement("p");
      empty.className = "ai-filtered-empty";
      empty.textContent = "Diese KI-Ergebnisse werden durch die aktuelle Suche oder einen Haupt-Schnellfilter ausgeblendet.";
      list.append(empty);
    }
    section.append(list);
    container.append(section);
  }

  function appendAiBestGuess(container, analysis) {
    const bestGuess = analysis.bestGuess;
    const country = bestGuess ? countries[bestGuess.iso3] : null;
    if (!bestGuess || !country) return;
    const confidencePercent = Math.round(bestGuess.confidence * 100);
    const confidenceLevel = bestGuess.confidence >= AI_LIKELY_CONFIDENCE ? "plausibel" : "unsicher";
    const section = document.createElement("section");
    const heading = document.createElement("div");
    const headingCopy = document.createElement("div");
    const eyebrow = document.createElement("span");
    const title = document.createElement("h3");
    const confidence = document.createElement("span");
    const button = document.createElement("button");
    const countryName = document.createElement("strong");
    const explanation = document.createElement("p");
    const reasons = document.createElement("ul");

    section.id = "aiBestGuess";
    section.className = "ai-best-guess";
    section.dataset.confidence = confidenceLevel;
    heading.className = "ai-best-guess-heading";
    eyebrow.className = "eyebrow";
    eyebrow.textContent = "KI-ENDTIPP";
    title.textContent = "Mein bester Ländertipp";
    confidence.className = "ai-best-guess-confidence";
    confidence.textContent = `${confidencePercent} % · ${confidenceLevel}`;
    headingCopy.append(eyebrow, title);
    heading.append(headingCopy, confidence);

    button.type = "button";
    button.className = "ai-best-guess-country";
    button.dataset.selectCountry = bestGuess.iso3;
    button.setAttribute("aria-label", `${country.name} als besten KI-Tipp öffnen, ${confidencePercent} Prozent Konfidenz`);
    countryName.textContent = `${flagEmoji(country.iso2)} ${country.name}`;
    explanation.textContent = "Die KI muss sich auf genau ein Land festlegen. Dieser Tipp ist auch bei niedriger Konfidenz keine Gewissheit.";
    button.append(countryName, explanation);

    reasons.className = "ai-best-guess-reasons";
    bestGuess.reasons.slice(0, 4).forEach((reason) => {
      const item = document.createElement("li");
      item.textContent = reason;
      reasons.append(item);
    });
    section.append(heading, button);
    if (reasons.childElementCount) section.append(reasons);
    if (bestGuess.evidence.length) {
      const evidence = document.createElement("small");
      evidence.className = "ai-best-guess-evidence";
      evidence.textContent = `Direkt sichtbar: ${bestGuess.evidence.slice(0, 4).join(" · ")}`;
      section.append(evidence);
    }
    container.append(section);
  }

  function appendAiAppliedFilters(container, analysis) {
    const activeFilters = analysis.filterContext?.activeFilters || [];
    if (!analysis.filterContextApplied || !activeFilters.length) return;
    const section = document.createElement("section");
    const copy = document.createElement("div");
    const title = document.createElement("h4");
    const description = document.createElement("p");
    const list = document.createElement("div");
    section.className = "ai-applied-filters";
    title.textContent = "Von der KI berücksichtigte Filter";
    description.textContent = "Diese Beobachtungen stammen aus deiner Auswahl. Sie ergänzen das Bild, gelten aber nicht automatisch als sichtbarer Beweis.";
    copy.append(title, description);
    list.className = "ai-applied-filter-list";
    activeFilters.forEach((filter) => {
      const chip = document.createElement("span");
      chip.textContent = filter.label;
      list.append(chip);
    });
    section.append(copy, list);
    container.append(section);
  }

  function renderAiCountryAnalysis(analysis) {
    if (!elements.aiAnalysisResult || !analysis) return;
    const fragment = document.createDocumentFragment();
    const header = document.createElement("div");
    const title = document.createElement("strong");
    const model = document.createElement("span");
    const summary = document.createElement("p");
    header.className = "ai-analysis-heading";
    title.textContent = "KI-Länderanalyse abgeschlossen";
    model.textContent = analysis.model ? `Modell: ${analysis.model}` : "Lokale Helfer-Verbindung";
    header.append(title, model);
    summary.className = "ai-analysis-summary";
    summary.textContent = analysis.summary;
    fragment.append(header, summary);
    appendAiBestGuess(fragment, analysis);
    appendAiAppliedFilters(fragment, analysis);

    if (analysis.imageClues.length) {
      const clueSection = document.createElement("section");
      const clueTitle = document.createElement("h4");
      const clueGrid = document.createElement("div");
      clueTitle.textContent = "Im Gesamtbild erkannte Hinweise";
      clueGrid.className = "ai-clue-grid";
      analysis.imageClues.forEach((clue) => {
        const card = document.createElement("article");
        const top = document.createElement("div");
        const label = document.createElement("strong");
        const confidence = document.createElement("span");
        const observation = document.createElement("p");
        card.className = "ai-clue-card";
        top.className = "ai-clue-card-heading";
        label.textContent = AI_CLUE_LABELS[clue.category];
        confidence.textContent = `${Math.round(clue.confidence * 100)} %`;
        observation.textContent = clue.observation;
        top.append(label, confidence);
        card.append(top, observation);
        clueGrid.append(card);
      });
      clueSection.append(clueTitle, clueGrid);
      fragment.append(clueSection);
    }

    const groups = document.createElement("div");
    groups.className = "ai-country-groups";
    appendAiCountryGroup(groups, "likely", "Wahrscheinlich / einschließen", "Mehrere sichtbare Hinweise sprechen gemeinsam für diese Länder.");
    appendAiCountryGroup(groups, "possible", "Noch möglich", "Diese Länder bleiben plausible Alternativen oder wurden wegen niedriger Sicherheit zurückgestuft.");
    appendAiCountryGroup(groups, "excluded", "Ausdrücklich ausgeschlossen", "Nur Länder mit einem konkret genannten, ausreichend sicheren Widerspruch stehen hier.");
    if (groups.childElementCount) fragment.append(groups);

    const total = Object.values(analysis.countryGroups).reduce((sum, list) => sum + list.length, 0);
    if (!total) {
      const empty = document.createElement("p");
      empty.className = "ai-analysis-empty";
      empty.textContent = "Die sichtbaren Hinweise reichen für keine belastbare Ländereinordnung. Wähle möglichst ein schärferes Bild mit Straße und Umgebung.";
      fragment.append(empty);
    }
    const unassessed = document.createElement("p");
    unassessed.className = "ai-unassessed-note";
    unassessed.textContent = "Nicht bewertete Länder sind nicht automatisch ausgeschlossen. Vegetation oder Klima allein führen nie zu einem harten Ausschluss.";
    fragment.append(unassessed);

    if (analysis.warnings.length) {
      const warningTitle = document.createElement("h5");
      const warningList = document.createElement("ul");
      warningTitle.textContent = "Hinweise und Unsicherheiten";
      warningList.className = "ai-warning-list";
      analysis.warnings.forEach((warning) => {
        const item = document.createElement("li");
        item.textContent = warning;
        warningList.append(item);
      });
      fragment.append(warningTitle, warningList);
    }
    elements.aiAnalysisResult.dataset.state = "success";
    elements.aiAnalysisResult.replaceChildren(fragment);
    elements.aiAnalysisResult.hidden = false;
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        if (typeof reader.result === "string") resolve(reader.result);
        else reject(new Error("Der Screenshot konnte nicht gelesen werden."));
      }, { once: true });
      reader.addEventListener("error", () => reject(new Error("Der Screenshot konnte nicht gelesen werden.")), { once: true });
      reader.addEventListener("abort", () => reject(new Error("Das Einlesen des Screenshots wurde abgebrochen.")), { once: true });
      reader.readAsDataURL(file);
    });
  }

  async function analyzeMatcherScreenshot() {
    if (state.matcher.ai.analyzing) return;
    const file = elements.roadScreenshot?.files?.[0];
    const validationError = validateAiImageFile(file);
    if (validationError) {
      showAiAnalysisMessage("error", "Bild kann nicht analysiert werden", validationError);
      updateAiAnalyzeButton();
      return;
    }

    clearAiAnalysisResult();
    const filterContext = buildAiFilterContext();
    const filterContextSignature = aiFilterContextSignature(filterContext);
    state.matcher.ai.analyzing = true;
    const requestId = ++state.matcher.ai.analysisRequestId;
    updateAiAnalyzeButton();
    syncMatcherFilterChips();
    setAiHelperStatus("checking", "KI-Analyse läuft …");
    showAiAnalysisMessage("loading", "Screenshot wird analysiert", "Der lokale Helfer überträgt das Bild jetzt an Groq. Das kann einige Sekunden dauern.");
    const controller = new AbortController();
    state.matcher.ai.controller = controller;
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, AI_HELPER_ANALYSIS_TIMEOUT_MS);

    try {
      const helperAvailable = await checkAiHelperHealth();
      if (requestId !== state.matcher.ai.analysisRequestId) return;
      if (!helperAvailable) throw new TypeError("Lokaler KI-Helfer nicht erreichbar");
      setAiHelperStatus("checking", "KI-Analyse läuft …");
      const imageDataUrl = await fileToDataUrl(file);
      const response = await fetch(`${AI_HELPER_BASE_URL}/analyze`, {
        method: "POST",
        headers: {
          ...AI_HELPER_HEADER,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageDataUrl,
          fileName: file.name || "strassen-screenshot",
          filterContext,
        }),
        cache: "no-store",
        signal: controller.signal,
      });
      const payload = await readHelperResponse(response);
      if (!response.ok || payload.ok !== true) throw new Error(helperErrorMessage(response, payload));
      if (requestId !== state.matcher.ai.analysisRequestId || elements.roadScreenshot?.files?.[0] !== file) return;
      if (aiFilterContextSignature(buildAiFilterContext()) !== filterContextSignature) {
        showAiAnalysisMessage("stale", "Filter wurden geändert", "Starte die KI-Analyse erneut, damit der beste Ländertipp die aktuelle Filterauswahl berücksichtigt.");
        return;
      }
      if (filterContextSignature && aiFilterContextSignature(payload.appliedFilterContext) !== filterContextSignature) {
        throw new Error("Der lokale Helfer hat die ausgewählten Filter nicht verarbeitet. Lade bitte die aktuelle Helfer-Version herunter.");
      }
      const analysis = parseAiCountryAnalysis(payload, filterContext);
      if (!analysis) {
        throw new Error("Der lokale Helfer hat keine direkte Länderanalyse geliefert. Lade bitte die aktuelle Helfer-Version herunter.");
      }
      applyAiCountryAnalysis(analysis);
      renderAiCountryAnalysis(analysis);
      setAiHelperStatus("connected", "Lokaler Helfer verbunden · Analyse fertig");
    } catch (error) {
      if (requestId !== state.matcher.ai.analysisRequestId) return;
      const isNetworkError = error instanceof TypeError;
      const message = timedOut
        ? "Die Analyse hat länger als 60 Sekunden gedauert und wurde beendet. Versuche es mit einem kleineren Screenshot erneut."
        : (isNetworkError
          ? "Der lokale KI-Helfer ist nicht erreichbar. Starte die heruntergeladene Datei und versuche es erneut."
          : (error.message || "Die KI-Analyse konnte nicht abgeschlossen werden."));
      setAiHelperStatus(isNetworkError || timedOut ? "offline" : "error", isNetworkError || timedOut ? "Lokaler Helfer nicht erreichbar" : "Analyse fehlgeschlagen");
      showAiAnalysisMessage("error", "KI-Analyse fehlgeschlagen", message);
    } finally {
      window.clearTimeout(timeout);
      if (requestId === state.matcher.ai.analysisRequestId) {
        state.matcher.ai.controller = null;
        state.matcher.ai.analyzing = false;
        updateAiAnalyzeButton();
        syncMatcherFilterChips();
      }
    }
  }

  function clearMatcherScreenshot() {
    if (state.matcher.previewUrl) {
      URL.revokeObjectURL(state.matcher.previewUrl);
      state.matcher.previewUrl = null;
    }
    state.matcher.imageName = "";
    if (elements.matcherPreviewImage) {
      elements.matcherPreviewImage.src = "";
      elements.matcherPreviewImage.removeAttribute("src");
    }
    if (elements.matcherPreview) elements.matcherPreview.hidden = true;
    if (elements.roadScreenshot) elements.roadScreenshot.value = "";
    clearAiAnalysisResult();
    updateAiAnalyzeButton();
  }

  function showMatcherScreenshot() {
    const file = elements.roadScreenshot?.files?.[0];
    if (!file) {
      clearMatcherScreenshot();
      return;
    }
    const validationError = validateAiImageFile(file);
    if (validationError) {
      clearMatcherScreenshot();
      showAiAnalysisMessage("error", "Bild kann nicht verwendet werden", validationError);
      return;
    }
    if (state.matcher.previewUrl) URL.revokeObjectURL(state.matcher.previewUrl);
    state.matcher.previewUrl = URL.createObjectURL(file);
    state.matcher.imageName = file.name || "Straßen-Screenshot";
    elements.matcherPreviewImage.src = state.matcher.previewUrl;
    elements.matcherPreviewImage.setAttribute("src", state.matcher.previewUrl);
    elements.matcherPreviewImage.alt = "Lokale Vorschau: " + state.matcher.imageName;
    elements.matcherPreview.hidden = false;
    clearAiAnalysisResult();
    updateAiAnalyzeButton();
    checkAiHelperHealth();
  }

  function setMatcherOpen(open) {
    elements.roadMatcher.hidden = !open;
    elements.roadMatcher.classList.toggle("open", open);
    elements.roadMatcher.setAttribute("aria-hidden", String(!open));
    elements.matcherButton.setAttribute("aria-expanded", String(open));
  }

  function bindMatcher() {
    if (!elements.matcherButton || !elements.roadMatcher) return;
    setMatcherOpen(false);
    elements.matcherButton.addEventListener("click", () => {
      const open = elements.roadMatcher.getAttribute("aria-hidden") === "true";
      setMatcherOpen(open);
      if (open) checkAiHelperHealth();
    });
    elements.roadScreenshot?.addEventListener("change", showMatcherScreenshot);
    elements.removeScreenshot?.addEventListener("click", clearMatcherScreenshot);
    elements.analyzeScreenshotButton?.addEventListener("click", analyzeMatcherScreenshot);
    elements.resetAiAnalysisButton?.addEventListener("click", clearAiAnalysisResult);
    syncMatcherFilterChips();
    updateAiAnalyzeButton();
  }

  function importanceClass(importance) {
    return importance.toLowerCase().replaceAll(" ", "-");
  }

  function roadColor(value) {
    const normalized = normalize(value);
    if (normalized.includes("grun")) return "#50b98c";
    if (normalized.includes("gelb")) return "#efc34e";
    if (normalized.includes("weiß")) return "#f1f3ed";
    if (normalized.includes("rot")) return "#d55550";
    return "transparent";
  }

  function lineMarkup(y, color, style, width = 3) {
    if (color === "transparent" || style === "none") return "";
    const dash = style === "dashed" ? ' stroke-dasharray="20 12"' : "";
    if (style === "double" || style === "double-solid" || style === "double-dashed") {
      const doubleDash = style === "double-dashed" ? ' stroke-dasharray="20 12"' : "";
      return `<line x1="0" y1="${y - 3}" x2="420" y2="${y - 3}" stroke="${color}" stroke-width="2.4"${doubleDash}></line>
        <line x1="0" y1="${y + 3}" x2="420" y2="${y + 3}" stroke="${color}" stroke-width="2.4"${doubleDash}></line>`;
    }
    if (style === "solid-dashed") {
      return `<line x1="0" y1="${y - 3}" x2="420" y2="${y - 3}" stroke="${color}" stroke-width="2.4"></line>
        <line x1="0" y1="${y + 3}" x2="420" y2="${y + 3}" stroke="${color}" stroke-width="2.4" stroke-dasharray="20 12"></line>`;
    }
    return `<line x1="0" y1="${y}" x2="420" y2="${y}" stroke="${color}" stroke-width="${width}"${dash}></line>`;
  }

  function roadDiagram(country, style) {
    const surface = style.surface === "gravel" ? "#85755e" : style.surface === "concrete" ? "#777b7b" : "#353a3d";
    const edgeColorLeft = roadColor(style.leftEdgeColor);
    const edgeColorRight = roadColor(style.rightEdgeColor);
    const centerColor = roadColor(style.centerColor);
    const leftEdgeStyle = style.leftEdgeStyle || style.edgeStyle || "solid";
    const rightEdgeStyle = style.rightEdgeStyle || style.edgeStyle || "solid";
    const centerBand = style.centerBandColor ? lineMarkup(54, roadColor(style.centerBandColor), "solid", 9) : "";
    const centerInner = style.centerInnerColor ? lineMarkup(54, roadColor(style.centerInnerColor), style.centerInnerStyle || "dashed", 2.4) : "";
    const laneDivider = style.lanes > 2 ? lineMarkup(78, roadColor(style.laneDividerColor || "weiß"), "dashed", 2.4) : "";
    const leftArrow = country.traffic === "left" ? "←" : "→";
    const rightArrow = country.traffic === "left" ? "→" : "←";
    return `
      <div class="road-card">
        <div class="road-card-header"><strong>${escapeHtml(style.label)}</strong><span>${escapeHtml(style.note || "straßentypabhängig")}</span></div>
        <svg class="road-diagram" viewBox="0 0 420 108" role="img" aria-label="${escapeHtml(style.label)}: ${escapeHtml(style.centerColor)}e Mitte, ${escapeHtml(style.leftEdgeColor)}e und ${escapeHtml(style.rightEdgeColor)}e Randlinie">
          <rect width="420" height="108" fill="#273129"></rect>
          <rect y="12" width="420" height="84" fill="${surface}"></rect>
          ${style.surface === "gravel" ? '<path d="M0 28 C80 18 150 39 230 25 S340 40 420 24 M0 79 C90 90 160 70 260 84 S350 70 420 82" fill="none" stroke="#a08f72" stroke-width="2" opacity=".45"></path>' : ""}
          ${style.surfaceDetail === "concrete-slabs" ? '<path class="road-slab-joints" d="M52 12V96 M104 12V96 M156 12V96 M208 12V96 M260 12V96 M312 12V96 M364 12V96 M0 54H420"></path>' : ""}
          ${lineMarkup(18, edgeColorLeft, leftEdgeStyle, 3)}
          ${centerBand}
          ${lineMarkup(54, centerColor, style.centerStyle, 3)}
          ${centerInner}
          ${laneDivider}
          ${lineMarkup(90, edgeColorRight, rightEdgeStyle, 3)}
          <text x="72" y="42" class="road-label">${leftArrow} FAHRTRICHTUNG</text>
          <text x="246" y="70" class="road-label">${rightArrow} FAHRTRICHTUNG</text>
        </svg>
      </div>`;
  }

  function visualClueCards(country) {
    const plateText = normalize(country.licensePlates.description);
    const plateClass = plateText.includes("schwarz") ? "dark" : plateText.includes("gelb") ? "yellow" : "";
    return `
      <div class="visual-clue-grid" aria-label="Visuelle Hinweis-Kategorien">
        <div class="visual-clue-card" title="${escapeHtml(country.bollards.description)}"><div class="clue-icon bollard"></div><span>Leitpfosten</span></div>
        <div class="visual-clue-card" title="${escapeHtml(country.signs.description)}"><div class="clue-icon sign"></div><span>Schildform</span></div>
        <div class="visual-clue-card" title="${escapeHtml(country.utilityPoles.description)}"><div class="clue-icon pole"></div><span>Strommast</span></div>
        <div class="visual-clue-card" title="${escapeHtml(country.licensePlates.description)}"><div class="clue-icon plate ${plateClass}"></div><span>Kennzeichen</span></div>
      </div>`;
  }

  function renderSimilarCountries(country) {
    if (!country.confusedWith.length) {
      return "<p>Noch keine belastbaren Direktvergleiche hinterlegt.</p>";
    }
    return `<div class="similar-grid">${country.confusedWith.map((iso3) => {
      const other = countries[iso3];
      const name = other?.name || iso3;
      const difference = country.distinguish?.[iso3] || "Straßenmarkierung, Sprache, Leitpfosten und Landschaft gemeinsam prüfen.";
      return `<article class="similar-card">
        <button type="button" data-select-country="${escapeHtml(iso3)}">${escapeHtml(country.name)} vs. ${escapeHtml(name)}</button>
        <p>${escapeHtml(difference)}</p>
      </article>`;
    }).join("")}</div>`;
  }

  function captureMetaSummaryText(country) {
    const meta = country.captureMeta;
    if (!meta?.variants?.length) return "Noch kein belastbares Google-Car- oder Aufnahmemeta hinterlegt.";
    const variants = meta.variants.map((variant) => {
      const generation = variant.generation ? ` · ${variant.generation}` : "";
      return `${captureVariantDescription(variant)}${generation} · ${variant.scope}`;
    }).join("; ");
    return `${meta.summary} ${variants}`;
  }

  function renderCaptureMeta(country) {
    const meta = country.captureMeta;
    if (!meta?.variants?.length) {
      return '<p>Noch kein belastbares Google-Car- oder Aufnahmemeta hinterlegt. Fehlende Daten sind kein Ausschluss.</p>';
    }
    const variants = meta.variants.map((variant) => {
      const sources = (variant.sources || [])
        .filter((source) => /^https:\/\/[^\s]+$/i.test(source))
        .map((source, index) => `<a href="${escapeHtml(source)}" target="_blank" rel="noopener noreferrer">Quelle ${index + 1} ↗</a>`)
        .join(" · ");
      return `<li>
        <strong>${escapeHtml(captureVariantDescription(variant))}</strong>
        <span>${escapeHtml(variant.generation || "Generation nicht festgelegt")} · ${escapeHtml(captureTypicalityLabels[variant.typicality] || variant.typicality)}</span>
        <small>${escapeHtml(variant.scope)} · ${escapeHtml(variant.note)}</small>
        ${sources ? `<small class="capture-meta-sources">${sources}</small>` : ""}
      </li>`;
    }).join("");
    return `<p class="capture-meta-summary">${escapeHtml(meta.summary)}</p>
      <p class="capture-meta-caution">Aufnahmegeneration, Ort und neue Street-View-Abdeckung können das Fahrzeug verändern. Dieses Meta nie allein verwenden.</p>
      <ul class="capture-meta-list">${variants}</ul>`;
  }

  function renderDataQuality(country) {
    const entries = [];
    const sources = new Set();
    const stopSign = country.stopSign;
    if (stopSign && stopSign.confidence !== "unknown") {
      stopSign.sources?.forEach((source) => sources.add(source));
      entries.push({
        key: "stopSign",
        values: [stopSign.displayedText],
        confidence: stopSign.confidence,
        scope: stopSign.scope || "regional variabel",
        note: stopSign.format === "variable" ? "Die Beschriftung ist regional nicht einheitlich." : "Amtlich dokumentierter Grundtyp.",
        sources: stopSign.sources || [],
      });
    }
    Object.entries(country.visualEvidence?.profiles || {}).forEach(([key, profile]) => {
      profile.sources?.forEach((source) => sources.add(source));
      entries.push({ key, ...profile });
    });
    (country.captureMeta?.variants || []).forEach((variant) => {
      variant.sources?.forEach((source) => sources.add(source));
      entries.push({
        key: "captureMeta",
        values: [captureVariantDescription(variant)],
        confidence: variant.confidence,
        scope: variant.scope,
        note: `${variant.generation ? `${variant.generation} · ` : ""}${variant.note}`,
        sources: variant.sources || [],
      });
    });
    if (country.roadVerification?.status === "cross-checked") {
      country.roadVerification.sources?.forEach((source) => sources.add(source));
      entries.push({
        key: "roadMarking",
        values: [roadPatternSummary(country)],
        confidence: "high",
        scope: country.roadMapPattern?.scope || "straßentypabhängig",
        note: country.roadMapPattern?.notes || "Amtlich beziehungsweise quellenübergreifend geprüft.",
        sources: country.roadVerification.sources || [],
      });
    }

    if (!entries.length) {
      return '<p class="data-quality-summary">Für dieses Land liegen noch keine einzeln strukturierten visuellen Belege vor. Es bleibt bei unklaren Filtern deshalb absichtlich „noch möglich“.</p>';
    }

    const verifiedCount = entries.filter((entry) => entry.confidence === "high" && entry.sources?.length).length;
    const updatedAt = country.captureMeta?.updatedAt || country.visualEvidence?.updatedAt || country.stopSign?.updatedAt || "nicht einzeln datiert";
    const entryMarkup = entries.map((entry) => {
      const values = entry.key === "stopSign" || entry.key === "roadMarking" || entry.key === "captureMeta"
        ? entry.values.join(" · ")
        : entry.values.map(evidenceValueLabel).join(" · ");
      return '<li><strong>' + escapeHtml(evidenceProfileLabels[entry.key] || entry.key) + '</strong>'
        + '<span>' + escapeHtml(values) + '</span>'
        + '<small>Zuverlässigkeit: ' + escapeHtml(confidenceLabels[entry.confidence] || entry.confidence)
        + ' · ' + escapeHtml(entry.scope || "regional variabel") + ' · ' + escapeHtml(entry.note || "") + '</small></li>';
    }).join("");
    const sourceMarkup = [...sources]
      .filter((source) => /^https:\/\/[^\s]+$/i.test(source))
      .map((source, index) => '<li><a href="' + escapeHtml(source) + '" target="_blank" rel="noopener noreferrer">Quelle ' + (index + 1) + ' ↗</a></li>')
      .join("");

    return '<p class="data-quality-summary"><strong>' + verifiedCount + ' amtlich oder quellenübergreifend belegte Profile</strong>'
      + ' · ' + sources.size + (sources.size === 1 ? ' Quelle' : ' Quellen')
      + ' · Datenstand ' + escapeHtml(updatedAt) + '. Schwächere Beobachtungshinweise führen allein zu keinem harten Ausschluss.</p>'
      + '<ul class="evidence-profile-list">' + entryMarkup + '</ul>'
      + (sourceMarkup ? '<ul class="source-list" aria-label="Quellen">' + sourceMarkup + '</ul>' : '');
  }

  function renderPanel(country) {
    const clues = [...country.geoGuessrClues].sort((a, b) => importanceOrder[a.importance] - importanceOrder[b.importance]);
    const roadStyles = country.roadStyles.length ? country.roadStyles : [{
      label: "Kein verifiziertes Straßenprofil",
      centerColor: "none",
      centerStyle: "none",
      leftEdgeColor: "none",
      rightEdgeColor: "none",
      lanes: 2,
      note: "Daten noch nicht kuratiert",
    }];
    const isFavorite = state.favorites.has(country.iso3);
    const roadVerificationStatus = country.roadVerification?.status;
    const roadVerificationText = roadVerificationStatus === "cross-checked"
      ? `Quellengeprüft (${country.roadVerification.sources.length} ${country.roadVerification.sources.length === 1 ? "Quelle" : "Quellen"})`
      : roadVerificationStatus === "partial"
        ? "Teilweise geprüft; die häufigste Strichart ist nicht landesweit belegt"
        : "Noch nicht länderspezifisch quellengeprüft";
    const roadMapDisplayText = roadVerificationStatus === "cross-checked"
      ? `${roadPatternSummary(country)}. ${country.roadMapPattern.notes}`
      : "Variiert nach Straßentyp – auf der Karte nur bei Nahzoom neutral dargestellt.";

    elements.panel.innerHTML = `
      <div class="country-content">
        <header class="country-hero">
          <div class="country-title-row">
            <div class="country-flag" role="img" aria-label="${flagAssetCode(country) ? `Flagge von ${escapeHtml(country.name)}` : `Keine eindeutige lokale Flagge für ${escapeHtml(country.name)} hinterlegt`}">
              ${countryFlagMarkup(country)}
            </div>
            <div class="country-title">
              <span class="eyebrow">${country.detailLevel === "priorität" ? "KURATIERTES PRIORITÄTSPROFIL" : "TRANSPARENTE BASISDATEN"}</span>
              <h2>${escapeHtml(country.name)}</h2>
              <span class="country-code">${escapeHtml(country.iso3)} · ${escapeHtml(country.continent)} · ${escapeHtml(country.domain)}</span>
            </div>
            <button id="favoriteCountry" class="favorite-button ${isFavorite ? "active" : ""}" type="button" aria-pressed="${isFavorite}" aria-label="${isFavorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}">★</button>
          </div>
          <div class="traffic-banner ${country.traffic === "right" ? "right" : ""}">
            <strong>${country.traffic === "left" ? "LINKSVERKEHR" : "RECHTSVERKEHR"}</strong>
            <span>nationaler Verkehrsstandard</span>
          </div>
        </header>

        <div class="country-body">
          <section>
            <h3 class="section-kicker">TOP GEOGUESSR-HINWEISE</h3>
            <div class="top-clues">
              ${clues.map((clue) => `
                <div class="clue-row">
                  <span class="importance ${importanceClass(clue.importance)}">${escapeHtml(clue.importance)}</span>
                  <div class="clue-copy"><strong>${escapeHtml(clue.text)}</strong><span>${escapeHtml(clue.category)} · ${escapeHtml(clue.reliability)}</span></div>
                </div>`).join("")}
            </div>
          </section>

          <section class="road-visuals">
            <h3 class="section-kicker">STRAẞEN-SCHEMATA</h3>
            ${roadStyles.map((style) => roadDiagram(country, style)).join("")}
            <p class="data-warning"><strong>Kartenanzeige (${escapeHtml(country.roadMapPattern.confidence)}):</strong> ${escapeHtml(roadMapDisplayText)}</p>
            <p class="data-warning"><strong>Datenprüfung:</strong> ${escapeHtml(roadVerificationText)}</p>
            <p class="data-warning"><strong>Variation:</strong> ${escapeHtml(country.roadMarkings.uncertainty)}</p>
          </section>

          ${visualClueCards(country)}

          <div class="details-stack">
            <details open>
              <summary>Straßen und Markierungen</summary>
              <div class="details-content">
                <ul class="fact-list">
                  <li><strong>Mitte:</strong> ${escapeHtml(country.roadMarkings.centerColor)} · ${escapeHtml(country.roadMarkings.centerStyle)}</li>
                  <li><strong>Linker Rand:</strong> ${escapeHtml(country.roadMarkings.leftEdgeColor)}</li>
                  <li><strong>Rechter Rand:</strong> ${escapeHtml(country.roadMarkings.rightEdgeColor)}</li>
                  <li><strong>Verbreitung:</strong> ${escapeHtml(country.roadMarkings.prevalence)}</li>
                  <li><strong>Asphalt:</strong> ${escapeHtml(country.roads.asphalt)}</li>
                  <li><strong>Breite:</strong> ${escapeHtml(country.roads.roadWidth)}</li>
                  <li><strong>Schulter:</strong> ${escapeHtml(country.roads.shoulders)}</li>
                </ul>
              </div>
            </details>
            <details>
              <summary>Leitpfosten und Straßenobjekte</summary>
              <div class="details-content"><p>${escapeHtml(country.bollards.description)}</p><p><strong>Wichtigkeit:</strong> ${escapeHtml(country.bollards.importance)}</p></div>
            </details>
            <details>
              <summary>Verkehrsschilder</summary>
              <div class="details-content"><p>${escapeHtml(country.signs.description)}</p><p><strong>Wichtigkeit:</strong> ${escapeHtml(country.signs.importance)}</p></div>
            </details>
            <details>
              <summary>Strom- und Telefonmasten</summary>
              <div class="details-content"><p>${escapeHtml(country.utilityPoles.description)}</p><p><strong>Wichtigkeit:</strong> ${escapeHtml(country.utilityPoles.importance)}</p></div>
            </details>
            <details>
              <summary>Kennzeichen</summary>
              <div class="details-content"><p>${escapeHtml(country.licensePlates.description)}</p><p><strong>Wichtigkeit:</strong> ${escapeHtml(country.licensePlates.importance)}</p></div>
            </details>
            <details>
              <summary>Sprache</summary>
              <div class="details-content"><p>${country.languages.length ? country.languages.map(escapeHtml).join(" · ") : "Noch keine verlässlichen Sprachhinweise erfasst."}</p></div>
            </details>
            <details>
              <summary>Landschaft und Vegetation</summary>
              <div class="details-content"><p>${escapeHtml(country.landscape)}</p></div>
            </details>
            <details>
              <summary>Architektur</summary>
              <div class="details-content"><p>${escapeHtml(country.architecture)}</p></div>
            </details>
            <details ${country.captureMeta?.variants?.length ? "open" : ""}>
              <summary>Google-Car und Kamera-Meta</summary>
              <div class="details-content">${renderCaptureMeta(country)}</div>
            </details>
            <details>
              <summary>GeoGuessr Meta</summary>
              <div class="details-content"><p>${escapeHtml(country.meta)}</p><p><strong>Hinweis:</strong> Meta kann sich mit neuer Abdeckung ändern und sollte nie einen widersprechenden realen Hinweis überstimmen.</p></div>
            </details>
            <details>
              <summary>Datenqualität und Quellen</summary>
              <div class="details-content">${renderDataQuality(country)}</div>
            </details>
            <details open>
              <summary>Oft verwechselt mit</summary>
              <div class="details-content">${renderSimilarCountries(country)}</div>
            </details>
            <details>
              <summary>Zusätzliche Länderinformation</summary>
              <div class="details-content">
                <ul class="fact-list">
                  <li><strong>Kontinent:</strong> ${escapeHtml(country.continent)}</li>
                  <li><strong>Subregion:</strong> ${escapeHtml(country.subregion || "Nicht erfasst")}</li>
                  <li><strong>Domain:</strong> ${escapeHtml(country.domain)}</li>
                  <li><strong>Datenstand:</strong> ${country.detailLevel === "priorität" ? "Kuratiertes GeoGuessr-Prioritätsprofil" : "Konservative Basis; Details ausdrücklich unvollständig"}</li>
                </ul>
              </div>
            </details>
          </div>

        </div>
      </div>`;

    document.getElementById("favoriteCountry")?.addEventListener("click", toggleFavorite);
  }

  function selectCountry(iso3, scrollPanel = true, emphasizeMap = true) {
    const country = countries[iso3];
    if (!country) return;
    if (state.selectedIso) {
      countryElements.get(state.selectedIso)?.classList.remove("is-selected");
      countryBorderElements.get(state.selectedIso)?.classList.remove("is-selected");
      roadLineElements.get(state.selectedIso)?.classList.remove("is-selected");
    }
    state.selectedIso = iso3;
    state.mapSelectionActive = emphasizeMap;
    elements.map.classList.toggle("has-selection", emphasizeMap);
    if (emphasizeMap) {
      countryElements.get(iso3)?.classList.add("is-selected");
      countryBorderElements.get(iso3)?.classList.add("is-selected");
    }
    drawRoadLineOverlays();
    updateMapMatches();
    renderPanel(country);
    if (scrollPanel) elements.panel.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleFavorite() {
    if (!state.selectedIso) return;
    if (state.favorites.has(state.selectedIso)) state.favorites.delete(state.selectedIso);
    else state.favorites.add(state.selectedIso);
    saveFavorites();
    renderPanel(countries[state.selectedIso]);
    updateMapMatches();
    refreshMatcherResultViews();
  }

  function dismissUpdateNotice() {
    if (!elements.updateNotice || elements.updateNotice.hidden) return;
    elements.updateNotice.hidden = true;
    const updateId = elements.updateNotice.dataset.updateId || "";
    if (!updateId) return;
    try {
      localStorage.setItem(UPDATE_STORAGE_KEY, updateId);
    } catch {
      // Der Hinweis bleibt auch ohne verfügbaren Browserspeicher bedienbar.
    }
  }

  function initializeUpdateNotice() {
    if (!elements.updateNotice || !elements.dismissUpdateNotice) return;
    const updateId = elements.updateNotice.dataset.updateId || "";
    const publishedAt = elements.updateNotice.dataset.publishedAt || "";
    if (elements.updateNoticeTime && publishedAt) {
      const publishedDate = new Date(publishedAt);
      if (!Number.isNaN(publishedDate.getTime())) {
        const formatted = new Intl.DateTimeFormat("de-DE", {
          dateStyle: "long",
          timeStyle: "short",
          timeZone: "Europe/Luxembourg",
        }).format(publishedDate);
        elements.updateNoticeTime.textContent = `${formatted} Uhr`;
        elements.updateNoticeTime.setAttribute("datetime", publishedAt);
      }
    }
    let seenUpdateId = "";
    try {
      seenUpdateId = localStorage.getItem(UPDATE_STORAGE_KEY) || "";
    } catch {
      seenUpdateId = "";
    }
    elements.updateNotice.hidden = !updateId || seenUpdateId === updateId;
    elements.dismissUpdateNotice.addEventListener("click", dismissUpdateNotice);
  }

  function applyTransform() {
    const { x, y, scale } = state.transform;
    const nextZoomLevel = zoomLevelForScale(scale);
    const levelChanged = elements.map.dataset.zoomLevel !== nextZoomLevel;
    const transform = `translate(${x} ${y}) scale(${scale})`;
    elements.viewport.setAttribute("transform", transform);
    elements.graticule.setAttribute("transform", transform);
    elements.map.dataset.zoomLevel = nextZoomLevel;
    if (levelChanged) {
      drawRoadLineOverlays();
      updateMapMatches();
    }
  }

  function zoomAt(factor, clientX, clientY) {
    const current = state.transform;
    const newScale = Math.max(1, Math.min(10, current.scale * factor));
    if (newScale === current.scale) return;
    const rect = elements.map.getBoundingClientRect();
    const pointX = ((clientX - rect.left) / rect.width) * 1200;
    const pointY = ((clientY - rect.top) / rect.height) * 600;
    const worldX = (pointX - current.x) / current.scale;
    const worldY = (pointY - current.y) / current.scale;
    current.x = pointX - worldX * newScale;
    current.y = pointY - worldY * newScale;
    current.scale = newScale;
    constrainTransform();
    applyTransform();
  }

  function constrainTransform() {
    const current = state.transform;
    if (current.scale <= 1) {
      current.x = 0;
      current.y = 0;
      current.scale = 1;
      return;
    }
    current.x = Math.min(0, Math.max(1200 - 1200 * current.scale, current.x));
    current.y = Math.min(0, Math.max(600 - 600 * current.scale, current.y));
  }

  function resetZoom() {
    state.transform = { x: 0, y: 0, scale: 1 };
    applyTransform();
  }

  function bindMapControls() {
    elements.map.addEventListener("wheel", (event) => {
      event.preventDefault();
      zoomAt(event.deltaY < 0 ? 1.18 : 0.84, event.clientX, event.clientY);
    }, { passive: false });

    elements.map.addEventListener("pointerdown", (event) => {
      elements.map.setPointerCapture(event.pointerId);
      const countryTarget = event.target.closest?.("[data-iso]");
      state.pointer = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        originX: state.transform.x,
        originY: state.transform.y,
        selectionIso: event.button === 0 ? countryTarget?.dataset.iso || "" : "",
      };
      state.dragged = false;
    });

    elements.map.addEventListener("pointermove", (event) => {
      if (!state.pointer || event.pointerId !== state.pointer.id) return;
      const distanceX = event.clientX - state.pointer.x;
      const distanceY = event.clientY - state.pointer.y;
      if (Math.hypot(distanceX, distanceY) > 4) state.dragged = true;
      if (!state.dragged) return;
      const rect = elements.map.getBoundingClientRect();
      state.transform.x = state.pointer.originX + (distanceX / rect.width) * 1200;
      state.transform.y = state.pointer.originY + (distanceY / rect.height) * 600;
      constrainTransform();
      applyTransform();
      hideTooltip();
    });

    const endPointer = (event) => {
      if (!state.pointer || event.pointerId !== state.pointer.id) return;
      const selectedIso = event.type === "pointerup" && !state.dragged ? state.pointer.selectionIso : "";
      state.pointer = null;
      if (selectedIso) selectCountry(selectedIso);
      window.setTimeout(() => {
        state.dragged = false;
      }, 0);
    };
    elements.map.addEventListener("pointerup", endPointer);
    elements.map.addEventListener("pointercancel", endPointer);

    document.getElementById("zoomIn").addEventListener("click", () => {
      const rect = elements.map.getBoundingClientRect();
      zoomAt(1.25, rect.left + rect.width / 2, rect.top + rect.height / 2);
    });
    document.getElementById("zoomOut").addEventListener("click", () => {
      const rect = elements.map.getBoundingClientRect();
      zoomAt(0.8, rect.left + rect.width / 2, rect.top + rect.height / 2);
    });
    document.getElementById("resetZoom").addEventListener("click", resetZoom);
  }

  const FILTER_WHEEL_THRESHOLD = 48;
  const FILTER_WHEEL_GESTURE_GAP = 220;
  const filterWheelGesture = { delta: 0, direction: 0, lastEventAt: null, switched: false, releasedAtBoundary: false };

  function selectFilterTab(tabKey, moveFocus = false) {
    const tabs = Array.from(elements.filterDashboard?.querySelectorAll("[data-filter-tab]") || []);
    const panels = Array.from(elements.filterDashboard?.querySelectorAll("[data-filter-panel]") || []);
    const selectedTab = tabs.find((tab) => tab.dataset.filterTab === tabKey) || tabs[0];
    if (!selectedTab) return;
    tabs.forEach((tab) => {
      const active = tab === selectedTab;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach((panel) => {
      const active = panel.dataset.filterPanel === selectedTab.dataset.filterTab;
      panel.hidden = !active;
      panel.classList.toggle("active", active);
    });
    const selectedIndex = tabs.indexOf(selectedTab);
    if (elements.filterCategoryPosition) elements.filterCategoryPosition.textContent = `${selectedIndex + 1} / ${tabs.length}`;
    elements.filterScrollHint?.setAttribute("data-category-position", String(selectedIndex + 1));
    elements.filters?.setAttribute("data-active-filter-tab", selectedTab.dataset.filterTab);
    if (moveFocus) selectedTab.focus();
  }

  function filterWheelDelta(event) {
    if (event.deltaMode === 1) return event.deltaY * 16;
    if (event.deltaMode === 2) return event.deltaY * 100;
    return event.deltaY;
  }

  function switchFilterTabWithWheel(event) {
    const rawDeltaY = Number(event.deltaY) || 0;
    if (!rawDeltaY || event.ctrlKey || event.shiftKey || Math.abs(rawDeltaY) <= Math.abs(event.deltaX || 0)) return;
    if (event.target.closest?.('input[type="range"], textarea, select')) return;

    const tabs = Array.from(elements.filterDashboard?.querySelectorAll("[data-filter-tab]") || []);
    const currentIndex = tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true");
    if (currentIndex < 0) return;

    const now = Number.isFinite(event.timeStamp) ? event.timeStamp : Date.now();
    if (filterWheelGesture.lastEventAt === null
      || now < filterWheelGesture.lastEventAt
      || now - filterWheelGesture.lastEventAt > FILTER_WHEEL_GESTURE_GAP) {
      filterWheelGesture.delta = 0;
      filterWheelGesture.direction = 0;
      filterWheelGesture.switched = false;
      filterWheelGesture.releasedAtBoundary = false;
    }
    filterWheelGesture.lastEventAt = now;

    if (filterWheelGesture.releasedAtBoundary) return;
    if (filterWheelGesture.switched) {
      event.preventDefault();
      return;
    }

    const delta = filterWheelDelta(event);
    const direction = delta > 0 ? 1 : -1;
    const atOuterBoundary = (currentIndex === 0 && direction < 0)
      || (currentIndex === tabs.length - 1 && direction > 0);
    if (atOuterBoundary) {
      filterWheelGesture.delta = 0;
      filterWheelGesture.direction = 0;
      filterWheelGesture.releasedAtBoundary = true;
      return;
    }

    event.preventDefault();
    if (filterWheelGesture.direction && filterWheelGesture.direction !== direction) filterWheelGesture.delta = 0;
    filterWheelGesture.direction = direction;
    filterWheelGesture.delta += delta;
    if (Math.abs(filterWheelGesture.delta) < FILTER_WHEEL_THRESHOLD) return;

    const activePanel = elements.filterDashboard?.querySelector(`[data-filter-panel="${tabs[currentIndex].dataset.filterTab}"]`);
    const moveFocus = Boolean(activePanel?.contains(document.activeElement) || tabs.includes(document.activeElement));
    selectFilterTab(tabs[currentIndex + direction].dataset.filterTab, moveFocus);
    filterWheelGesture.delta = 0;
    filterWheelGesture.switched = true;
  }

  function bindInterface() {
    elements.search.addEventListener("input", () => {
      state.searchQuery = elements.search.value;
      updateMapMatches();
      refreshMatcherResultViews();
    });

    selectFilterTab("basis");
    elements.filters?.addEventListener("wheel", switchFilterTabWithWheel, { passive: false });
    elements.filterDashboard?.addEventListener("click", (event) => {
      const categoryTab = event.target.closest?.("[data-filter-tab]");
      if (categoryTab) {
        selectFilterTab(categoryTab.dataset.filterTab);
        return;
      }

      const resetButton = event.target.closest?.("#allFilterChip");
      if (resetButton) {
        clearAllFilters();
        return;
      }

      const filterButton = event.target.closest?.(".filter-chip");
      if (!filterButton || !applyFilterSelection(filterButton)) return;
      const invalidatesAiResult = state.matcher.ai.analyzing || Boolean(state.matcher.ai.analysis);
      if (invalidatesAiResult) {
        clearAiAnalysisResult();
        showAiAnalysisMessage(
          "stale",
          "Filterauswahl geändert",
          "Starte die KI-Analyse erneut, damit der beste Ländertipp alle aktuell ausgewählten Filter berücksichtigt.",
        );
      }
      recomputeMatcher();
      refreshMatcherResultViews();
    });

    elements.filterDashboard?.addEventListener("keydown", (event) => {
      const currentTab = event.target.closest?.("[data-filter-tab]");
      if (!currentTab || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
      const tabs = Array.from(elements.filterDashboard.querySelectorAll("[data-filter-tab]"));
      const currentIndex = tabs.indexOf(currentTab);
      let nextIndex = currentIndex;
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (currentIndex + 1) % tabs.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = tabs.length - 1;
      event.preventDefault();
      selectFilterTab(tabs[nextIndex].dataset.filterTab, true);
    });

    document.addEventListener("click", (event) => {
      const selector = event.target.closest("[data-select-country]");
      if (selector) selectCountry(selector.dataset.selectCountry);
    });

    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        elements.search.focus();
      }
      if (event.key === "Escape") {
        if (elements.updateNotice && !elements.updateNotice.hidden) dismissUpdateNotice();
      }
    });
  }

  drawGraticule();
  drawCountries();
  drawRoadLineOverlays();
  buildSearchIndexes();
  bindMapControls();
  bindInterface();
  bindMatcher();
  initializeUpdateNotice();
  updateMapMatches();
})();
