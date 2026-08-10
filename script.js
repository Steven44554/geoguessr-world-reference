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
    filters: document.getElementById("filters"),
    browser: document.getElementById("countryBrowser"),
    browserButton: document.getElementById("browserButton"),
    closeBrowser: document.getElementById("closeBrowser"),
    browserList: document.getElementById("browserList"),
    compareButton: document.getElementById("compareButton"),
    compareCount: document.getElementById("compareCount"),
    modal: document.getElementById("comparisonModal"),
    comparisonGrid: document.getElementById("comparisonGrid"),
    compareSelects: [
      document.getElementById("compareSelect1"),
      document.getElementById("compareSelect2"),
      document.getElementById("compareSelect3"),
    ],
    matcherButton: document.getElementById("matcherButton"),
    roadMatcher: document.getElementById("roadMatcher"),
    roadScreenshot: document.getElementById("roadScreenshot"),
    matcherPreview: document.getElementById("matcherPreview"),
    matcherPreviewImage: document.getElementById("matcherPreviewImage"),
    removeScreenshot: document.getElementById("removeScreenshot"),
    matcherTraffic: document.getElementById("matcherTraffic"),
    matcherCenterColor: document.getElementById("matcherCenterColor"),
    matcherCenterStyle: document.getElementById("matcherCenterStyle"),
    matcherEdgeColor: document.getElementById("matcherEdgeColor"),
    matcherEdgeStyle: document.getElementById("matcherEdgeStyle"),
    matcherPlateColor: document.getElementById("matcherPlateColor"),
    matcherSurface: document.getElementById("matcherSurface"),
    matcherStopOnly: document.getElementById("matcherStopOnly"),
    matcherStopText: document.getElementById("matcherStopText"),
    matcherWarningSign: document.getElementById("matcherWarningSign"),
    matcherPlateLayout: document.getElementById("matcherPlateLayout"),
    matcherBollard: document.getElementById("matcherBollard"),
    matcherPole: document.getElementById("matcherPole"),
    matcherShoulder: document.getElementById("matcherShoulder"),
    matcherSignBack: document.getElementById("matcherSignBack"),
    matcherCamera: document.getElementById("matcherCamera"),
    stopOnlyFilterChip: document.getElementById("stopOnlyFilterChip"),
    matcherReset: document.getElementById("matcherReset"),
    matcherSummary: document.getElementById("matcherSummary"),
    matcherRoadPreview: document.getElementById("matcherRoadPreview"),
    matcherCandidates: document.getElementById("matcherCandidates"),
    matcherExcludedSummary: document.getElementById("matcherExcludedSummary"),
    updateNotice: document.getElementById("updateNotice"),
    dismissUpdateNotice: document.getElementById("dismissUpdateNotice"),
    updateNoticeTime: document.getElementById("updateNoticeTime"),
  };

  const UPDATE_STORAGE_KEY = "geoguessr-atlas-seen-update-id";

  const state = {
    selectedIso: null,
    searchQuery: "",
    activeFilters: new Set(),
    browserGroup: "alphabet",
    favorites: loadFavorites(),
    compareSelection: [],
    transform: { x: 0, y: 0, scale: 1 },
    pointer: null,
    dragged: false,
    mapSelectionActive: false,
    matcher: {
      active: false,
      results: new Map(),
      roadCandidates: new Set(),
      manualExcluded: new Set(),
      previewUrl: null,
      imageName: "",
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
        JSON.stringify(country.roadMapPattern),
        JSON.stringify(country.roads),
        JSON.stringify(country.geoGuessrClues),
        JSON.stringify(country.bollards),
        JSON.stringify(country.signs),
        JSON.stringify(country.stopSign),
        JSON.stringify(country.visualEvidence),
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
    if (type === "center") return normalize(country.roadMarkings.centerColor).includes(valueNormalized);
    if (type === "edge") return normalize(`${country.roadMarkings.leftEdgeColor} ${country.roadMarkings.rightEdgeColor}`).includes(valueNormalized);
    if (type === "plates") return normalize(country.licensePlates.description).includes(valueNormalized);
    if (type === "terrain") return normalize(country.landscape).includes(valueNormalized);
    if (type === "continent") return normalize(country.continent) === valueNormalized;
    if (type === "favorites") return state.favorites.has(country.iso3);
    return true;
  }

  function updateMapMatches() {
    const tokens = normalize(state.searchQuery).split(" ").filter(Boolean);
    let matchCount = 0;
    elements.map.classList.toggle("has-matcher", state.matcher.active);

    countryList.forEach((country) => {
      const queryMatches = tokens.length === 0 || tokens.every((token) => searchIndexes.get(country.iso3)?.includes(token));
      const filterMatches = [...state.activeFilters].every((filter) => matchesFilter(country, filter));
      const matches = queryMatches && filterMatches;
      const matcherStatus = state.matcher.active ? state.matcher.results.get(country.iso3)?.status : null;
      const matcherExcluded = matcherStatus === "excluded";
      const node = countryElements.get(country.iso3);
      const border = countryBorderElements.get(country.iso3);
      const roadGlyph = roadLineElements.get(country.iso3);
      const matcherTargets = [node, border, roadGlyph].filter(Boolean);
      if (matches) matchCount += 1;
      matcherTargets.forEach((target) => {
        target.classList.toggle("is-matcher-match", matcherStatus === "match");
        target.classList.toggle("is-matcher-possible", matcherStatus === "possible");
        target.classList.toggle("is-matcher-excluded", matcherExcluded);
      });
      roadGlyph?.classList.toggle("is-dimmed", !matches || matcherExcluded);
      border?.classList.toggle("is-dimmed", !matches || matcherExcluded);
      border?.classList.toggle("is-match", matches && (tokens.length > 0 || state.activeFilters.size > 0));
      if (!node) return;
      node.classList.toggle("is-dimmed", !matches || matcherExcluded);
      node.classList.toggle("is-match", matches && (tokens.length > 0 || state.activeFilters.size > 0));
    });

    if (tokens.length === 0 && state.activeFilters.size === 0) {
      elements.searchSummary.textContent = `Alle ${countryList.length} Länder und Gebiete werden angezeigt.`;
    } else {
      const parts = [];
      if (state.searchQuery.trim()) parts.push(`Suche „${state.searchQuery.trim()}“`);
      if (state.activeFilters.size) parts.push(`${state.activeFilters.size} aktive Filter`);
      elements.searchSummary.textContent = `${matchCount} Treffer für ${parts.join(" · ")}.`;
    }
  }

  const matcherInputs = [
    elements.matcherTraffic,
    elements.matcherCenterColor,
    elements.matcherCenterStyle,
    elements.matcherEdgeColor,
    elements.matcherEdgeStyle,
    elements.matcherPlateColor,
    elements.matcherSurface,
    elements.matcherStopOnly,
    elements.matcherStopText,
    elements.matcherWarningSign,
    elements.matcherPlateLayout,
    elements.matcherBollard,
    elements.matcherPole,
    elements.matcherShoulder,
    elements.matcherSignBack,
    elements.matcherCamera,
  ].filter(Boolean);

  function readMatcherCriteria() {
    return {
      traffic: elements.matcherTraffic?.value || "",
      centerColor: elements.matcherCenterColor?.value || "",
      centerStyle: elements.matcherCenterStyle?.value || "",
      edgeColor: elements.matcherEdgeColor?.value || "",
      edgeStyle: elements.matcherEdgeStyle?.value || "",
      plateColor: elements.matcherPlateColor?.value || "",
      surface: elements.matcherSurface?.value || "",
      stopOnly: Boolean(elements.matcherStopOnly?.checked),
      stopText: elements.matcherStopText?.value || "",
      warningSign: elements.matcherWarningSign?.value || "",
      plateLayout: elements.matcherPlateLayout?.value || "",
      bollard: elements.matcherBollard?.value || "",
      pole: elements.matcherPole?.value || "",
      shoulder: elements.matcherShoulder?.value || "",
      signBack: elements.matcherSignBack?.value || "",
      camera: elements.matcherCamera?.value || "",
    };
  }

  function syncStopOnlyFilterChip() {
    const active = Boolean(elements.matcherStopOnly?.checked);
    elements.stopOnlyFilterChip?.classList.toggle("active", active);
    elements.stopOnlyFilterChip?.setAttribute("aria-pressed", String(active));
    const allButton = elements.filters?.querySelector('[data-filter="all"]');
    if (allButton) {
      const showAll = state.activeFilters.size === 0 && !active;
      allButton.classList.toggle("active", showAll);
      allButton.setAttribute("aria-pressed", String(showAll));
    }
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
    stopSign: "Stoppschild-Text",
    roadMarking: "Straßenmarkierung",
  };

  const confidenceLabels = {
    high: "hoch",
    medium: "mittel",
    low: "niedrig",
    unknown: "unbekannt",
  };

  function evidenceValueLabel(value) {
    return evidenceValueLabels[value] || value;
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
    const variants = countryRoadVariants(country);
    if (!variants.length) return { outcome: "unknown", count, reliable: false };
    const comparisons = variants.map((variant) => compareRoadVariant(variant, criteria));
    const matched = comparisons.includes("match");
    const crossChecked = country.roadVerification?.status === "cross-checked";
    const reliable = crossChecked || (matched && country.detailLevel === "priorität" && country.roadVerification?.status === "partial");
    if (matched) return { outcome: "match", count, reliable };
    if (comparisons.includes("unknown")) return { outcome: "unknown", count, reliable: false };
    return { outcome: "mismatch", count, reliable: crossChecked };
  }

  function plateProfile(country) {
    const text = normalize(country.licensePlates?.description);
    const colors = new Set();
    const yellowBackground = /(?:gelbe|gelben|gelber).{0,40}(?:kennzeichen|platten)|(?:vorn|hinten).{0,18}gelb|(?:kennzeichen|[a-z-]*platten)(?: sind|:)?(?:.{0,35})? gelb|reflektierend gelb/.test(text);
    const whiteBackground = /(?:weiße|weisse|weißen|weissen).{0,40}(?:kennzeichen|platten)|(?:vorn|hinten).{0,18}(?:weiß|weiss)|(?:kennzeichen|[a-z-]*platten)(?: sind|:)? (?:weiß|weiss)|helle? platten|überwiegend hell/.test(text);
    const darkBackground = /(?:schwarze|schwarzen|dunkle|dunklen).{0,32}(?:kennzeichen|platten)|(?:kennzeichen|[a-z-]*platten)(?: sind|:)? (?:schwarz|dunkel)/.test(text);
    if (yellowBackground) colors.add("yellow");
    if (whiteBackground) colors.add("white");
    if (darkBackground) colors.add("dark");
    const strong = country.detailLevel === "priorität"
      && colors.size > 0
      && !text.includes("nicht verlasslich")
      && !text.includes("nicht zuverlässig");
    return { colors, strong };
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
      if (roadResult.outcome === "match") {
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
        reliableMatches += 1;
        score += 22;
        reasons.push("Kennzeichenfarbe passt");
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
    if (!state.matcher.active || !hasMatcherCriteria(criteria)) {
      elements.matcherCandidates.innerHTML = '<p class="matcher-empty-result">Wähle oben Merkmale aus, um Länder ein- und auszuschließen.</p>';
      return;
    }

    const candidates = countryList
      .map((country) => ({ country, result: state.matcher.results.get(country.iso3) }))
      .filter((entry) => entry.result && entry.result.status !== "excluded")
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
    const excluded = countryList
      .map((country) => ({ country, result: state.matcher.results.get(country.iso3) }))
      .filter((entry) => entry.result?.status === "excluded");
    const manual = excluded.filter((entry) => entry.result.manual);
    const automatic = excluded.filter((entry) => !entry.result.manual);
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
    if (!state.matcher.active || !hasMatcherCriteria(criteria)) {
      elements.matcherSummary.textContent = "Noch keine Merkmale ausgewählt. Alle Länder bleiben möglich.";
      return;
    }
    const results = [...state.matcher.results.values()];
    const matchCount = results.filter((result) => result.status === "match").length;
    const possibleCount = results.filter((result) => result.status === "possible").length;
    const excludedCount = results.filter((result) => result.status === "excluded").length;
    elements.matcherSummary.textContent = matchCount + (matchCount === 1 ? " passt gut · " : " passen gut · ")
      + possibleCount + " noch möglich · "
      + excludedCount + " eher ausgeschlossen. Unsichere Daten bleiben absichtlich in „noch möglich“.";
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

  function recomputeMatcher() {
    const criteria = readMatcherCriteria();
    syncStopOnlyFilterChip();
    state.matcher.active = hasMatcherCriteria(criteria) || state.matcher.manualExcluded.size > 0;
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
    updateMatcherRoadPreview(criteria);
    renderMatcherSummary(criteria);
    renderMatcherCandidates(criteria);
    renderMatcherExcluded();
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
  }

  function showMatcherScreenshot() {
    const file = elements.roadScreenshot?.files?.[0];
    if (!file) {
      clearMatcherScreenshot();
      return;
    }
    if (file.type && !file.type.startsWith("image/")) {
      clearMatcherScreenshot();
      return;
    }
    if (state.matcher.previewUrl) URL.revokeObjectURL(state.matcher.previewUrl);
    state.matcher.previewUrl = URL.createObjectURL(file);
    state.matcher.imageName = file.name || "Straßen-Screenshot";
    elements.matcherPreviewImage.src = state.matcher.previewUrl;
    elements.matcherPreviewImage.setAttribute("src", state.matcher.previewUrl);
    elements.matcherPreviewImage.alt = "Lokale Vorschau: " + state.matcher.imageName;
    elements.matcherPreview.hidden = false;
  }

  function setMatcherOpen(open) {
    elements.roadMatcher.hidden = !open;
    elements.roadMatcher.classList.toggle("open", open);
    elements.roadMatcher.setAttribute("aria-hidden", String(!open));
    elements.matcherButton.setAttribute("aria-expanded", String(open));
  }

  function resetMatcher() {
    matcherInputs.forEach((input) => {
      if (input.type === "checkbox") input.checked = false;
      else input.value = "";
    });
    state.matcher.manualExcluded.clear();
    clearMatcherScreenshot();
    recomputeMatcher();
  }

  function bindMatcher() {
    if (!elements.matcherButton || !elements.roadMatcher) return;
    setMatcherOpen(false);
    elements.matcherButton.addEventListener("click", () => {
      setMatcherOpen(elements.roadMatcher.getAttribute("aria-hidden") === "true");
    });
    elements.stopOnlyFilterChip?.addEventListener("click", () => {
      elements.matcherStopOnly.checked = !elements.matcherStopOnly.checked;
      recomputeMatcher();
    });
    matcherInputs.forEach((input) => input.addEventListener("change", recomputeMatcher));
    elements.roadScreenshot?.addEventListener("change", showMatcherScreenshot);
    elements.removeScreenshot?.addEventListener("click", clearMatcherScreenshot);
    elements.matcherReset?.addEventListener("click", resetMatcher);
    elements.matcherCandidates?.addEventListener("click", (event) => {
      const exclude = event.target.closest("[data-matcher-exclude]");
      if (exclude) {
        state.matcher.manualExcluded.add(exclude.dataset.matcherExclude);
        recomputeMatcher();
        return;
      }
      const open = event.target.closest("[data-matcher-open]");
      if (open) selectCountry(open.dataset.matcherOpen);
    });
    elements.matcherExcludedSummary?.addEventListener("click", (event) => {
      const restore = event.target.closest("[data-matcher-restore]");
      if (restore) {
        state.matcher.manualExcluded.delete(restore.dataset.matcherRestore);
        recomputeMatcher();
        return;
      }
      const open = event.target.closest("[data-matcher-open]");
      if (open) selectCountry(open.dataset.matcherOpen);
    });
    updateMatcherRoadPreview(readMatcherCriteria());
    renderMatcherExcluded();
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
    const updatedAt = country.visualEvidence?.updatedAt || country.stopSign?.updatedAt || "nicht einzeln datiert";
    const entryMarkup = entries.map((entry) => {
      const values = entry.key === "stopSign" || entry.key === "roadMarking"
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
    const isCompared = state.compareSelection.includes(country.iso3);
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

          <div class="panel-actions">
            <button id="toggleCompareCountry" class="panel-action" type="button">${isCompared ? "Aus Vergleich entfernen" : "Zum Vergleich hinzufügen"}</button>
            <button id="openCompareFromPanel" class="panel-action" type="button">Vergleich öffnen</button>
          </div>
        </div>
      </div>`;

    document.getElementById("favoriteCountry")?.addEventListener("click", toggleFavorite);
    document.getElementById("toggleCompareCountry")?.addEventListener("click", () => toggleCompare(country.iso3));
    document.getElementById("openCompareFromPanel")?.addEventListener("click", () => openComparison(country.iso3));
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
    closeBrowser();
    if (scrollPanel) elements.panel.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleFavorite() {
    if (!state.selectedIso) return;
    if (state.favorites.has(state.selectedIso)) state.favorites.delete(state.selectedIso);
    else state.favorites.add(state.selectedIso);
    saveFavorites();
    renderPanel(countries[state.selectedIso]);
    updateMapMatches();
    renderBrowser();
  }

  function toggleCompare(iso3) {
    const index = state.compareSelection.indexOf(iso3);
    if (index >= 0) state.compareSelection.splice(index, 1);
    else if (state.compareSelection.length < 3) state.compareSelection.push(iso3);
    else state.compareSelection[2] = iso3;
    updateCompareCount();
    if (state.selectedIso) renderPanel(countries[state.selectedIso]);
  }

  function updateCompareCount() {
    elements.compareCount.textContent = String(state.compareSelection.length);
  }

  function populateComparisonSelects() {
    const options = countryList.map((country) => `<option value="${country.iso3}">${escapeHtml(country.name)}</option>`).join("");
    elements.compareSelects[0].innerHTML = options;
    elements.compareSelects[1].innerHTML = options;
    elements.compareSelects[2].innerHTML = `<option value="">Kein drittes Land</option>${options}`;
    elements.compareSelects.forEach((select) => select.addEventListener("change", syncComparisonFromSelects));
  }

  function syncComparisonFromSelects() {
    state.compareSelection = [...new Set(elements.compareSelects.map((select) => select.value).filter(Boolean))].slice(0, 3);
    updateCompareCount();
    renderComparison();
  }

  function setComparisonSelection(selection) {
    state.compareSelection = [...new Set(selection.filter((iso3) => countries[iso3]))].slice(0, 3);
    while (state.compareSelection.length < 2) {
      const fallback = countryList.find((country) => !state.compareSelection.includes(country.iso3));
      if (!fallback) break;
      state.compareSelection.push(fallback.iso3);
    }
    elements.compareSelects[0].value = state.compareSelection[0] || countryList[0]?.iso3 || "";
    elements.compareSelects[1].value = state.compareSelection[1] || countryList[1]?.iso3 || "";
    elements.compareSelects[2].value = state.compareSelection[2] || "";
    updateCompareCount();
    renderComparison();
  }

  function openComparison(preferredIso) {
    let selection = [...state.compareSelection];
    if (preferredIso && !selection.includes(preferredIso)) selection.unshift(preferredIso);
    if (selection.length < 2 && preferredIso) {
      const similar = countries[preferredIso]?.confusedWith.find((iso3) => countries[iso3]);
      if (similar) selection.push(similar);
    }
    if (selection.length < 2) selection = ["ZAF", "BWA", "LSO"];
    setComparisonSelection(selection);
    elements.modal.hidden = false;
    document.body.style.overflow = "hidden";
    elements.compareSelects[0].focus();
  }

  function closeComparison() {
    elements.modal.hidden = true;
    document.body.style.overflow = "";
  }

  function comparisonCell(country, title, text) {
    return `<div class="comparison-item"><h4>${escapeHtml(title)}</h4><p>${escapeHtml(text || "Noch nicht zuverlässig erfasst")}</p></div>`;
  }

  function renderComparison() {
    elements.comparisonGrid.innerHTML = state.compareSelection.map((iso3) => {
      const country = countries[iso3];
      const strongest = [...country.geoGuessrClues].sort((a, b) => importanceOrder[a.importance] - importanceOrder[b.importance]).slice(0, 3).map((clue) => clue.text).join(" · ");
      const direct = state.compareSelection
        .filter((otherIso) => otherIso !== iso3)
        .map((otherIso) => country.distinguish?.[otherIso])
        .filter(Boolean)
        .join(" ");
      return `<article class="comparison-column">
        <header class="comparison-country-head ${country.traffic}">
          <span>${flagEmoji(country.iso2)} ${escapeHtml(country.iso3)}</span>
          <h3>${escapeHtml(country.name)}</h3>
          <span>${country.traffic === "left" ? "Linksverkehr" : "Rechtsverkehr"}</span>
        </header>
        ${comparisonCell(country, "Stärkste Hinweise", strongest)}
        ${comparisonCell(country, "Straßen", `${country.roads.asphalt}. ${country.roads.shoulders}`)}
        ${comparisonCell(country, "Markierungen", `Mitte: ${country.roadMarkings.centerColor}. Rand: ${country.roadMarkings.leftEdgeColor} / ${country.roadMarkings.rightEdgeColor}. ${country.roadMarkings.prevalence}.`)}
        ${comparisonCell(country, "Leitpfosten", country.bollards.description)}
        ${comparisonCell(country, "Schilder", country.signs.description)}
        ${comparisonCell(country, "Landschaft", country.landscape)}
        ${comparisonCell(country, "Strommasten", country.utilityPoles.description)}
        ${comparisonCell(country, "Kennzeichen", country.licensePlates.description)}
        ${comparisonCell(country, "GeoGuessr Meta", country.meta)}
        ${direct ? comparisonCell(country, "Genau unterscheiden", direct) : ""}
      </article>`;
    }).join("");
  }

  function groupCountries(mode) {
    const grouped = new Map();
    countryList.forEach((country) => {
      let key = country.name[0]?.toLocaleUpperCase("de") || "#";
      if (mode === "continent") key = country.continent;
      if (mode === "traffic") key = country.traffic === "left" ? "Linksverkehr" : "Rechtsverkehr";
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(country);
    });
    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b, "de"));
  }

  function renderBrowser() {
    elements.browserList.innerHTML = groupCountries(state.browserGroup).map(([group, entries]) => `
      <section class="browser-group">
        <h3>${escapeHtml(group)}</h3>
        ${entries.map((country) => `<button class="browser-country" type="button" data-select-country="${country.iso3}">${state.favorites.has(country.iso3) ? "★ " : ""}${escapeHtml(country.name)}<span>${country.traffic === "left" ? "LINKS" : "RECHTS"}</span></button>`).join("")}
      </section>`).join("");
  }

  function openBrowser() {
    elements.browser.classList.add("open");
    elements.browser.setAttribute("aria-hidden", "false");
    elements.browserButton.setAttribute("aria-expanded", "true");
    renderBrowser();
  }

  function closeBrowser() {
    elements.browser.classList.remove("open");
    elements.browser.setAttribute("aria-hidden", "true");
    elements.browserButton.setAttribute("aria-expanded", "false");
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

  function bindInterface() {
    elements.search.addEventListener("input", () => {
      state.searchQuery = elements.search.value;
      updateMapMatches();
    });

    elements.filters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      const filter = button.dataset.filter;
      if (filter === "all") {
        state.activeFilters.clear();
        const stopFilterWasActive = Boolean(elements.matcherStopOnly?.checked);
        if (elements.matcherStopOnly) elements.matcherStopOnly.checked = false;
        elements.filters.querySelectorAll(".filter-chip").forEach((chip) => {
          const isAll = chip.dataset.filter === "all";
          chip.classList.toggle("active", isAll);
          chip.setAttribute("aria-pressed", String(isAll));
        });
        if (stopFilterWasActive) recomputeMatcher();
      } else {
        if (state.activeFilters.has(filter)) state.activeFilters.delete(filter);
        else state.activeFilters.add(filter);
        button.classList.toggle("active", state.activeFilters.has(filter));
        button.setAttribute("aria-pressed", String(state.activeFilters.has(filter)));
        const allButton = elements.filters.querySelector('[data-filter="all"]');
        const showAll = state.activeFilters.size === 0 && !elements.matcherStopOnly?.checked;
        allButton.classList.toggle("active", showAll);
        allButton.setAttribute("aria-pressed", String(showAll));
      }
      updateMapMatches();
    });

    elements.browserButton.addEventListener("click", () => elements.browser.classList.contains("open") ? closeBrowser() : openBrowser());
    elements.closeBrowser.addEventListener("click", closeBrowser);
    document.querySelectorAll(".browser-tab").forEach((tab) => tab.addEventListener("click", () => {
      document.querySelectorAll(".browser-tab").forEach((item) => {
        const active = item === tab;
        item.classList.toggle("active", active);
        item.setAttribute("aria-selected", String(active));
      });
      state.browserGroup = tab.dataset.group;
      renderBrowser();
    }));

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
        else if (!elements.modal.hidden) closeComparison();
        else closeBrowser();
      }
    });

    elements.compareButton.addEventListener("click", () => openComparison(state.selectedIso));
    elements.modal.querySelectorAll("[data-close-modal]").forEach((node) => node.addEventListener("click", closeComparison));
    elements.modal.querySelectorAll("[data-preset]").forEach((button) => button.addEventListener("click", () => setComparisonSelection(button.dataset.preset.split(","))));
  }

  drawGraticule();
  drawCountries();
  drawRoadLineOverlays();
  buildSearchIndexes();
  populateComparisonSelects();
  bindMapControls();
  bindInterface();
  bindMatcher();
  initializeUpdateNotice();
  renderBrowser();
  updateMapMatches();
  updateCompareCount();
})();
