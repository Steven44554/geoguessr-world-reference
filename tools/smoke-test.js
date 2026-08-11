const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const initialCountryPanelMarkup = html.match(/<aside\b[^>]*id=["']countryPanel["'][^>]*>([\s\S]*?)<\/aside>/i)?.[1] || "";

class ClassList {
  constructor(node) {
    this.node = node;
    this.values = new Set();
  }

  setFromString(value) {
    this.values = new Set(String(value || "").split(/\s+/).filter(Boolean));
  }

  sync() {
    this.node.attributes.class = [...this.values].join(" ");
  }

  add(...names) {
    names.forEach((name) => this.values.add(name));
    this.sync();
  }

  remove(...names) {
    names.forEach((name) => this.values.delete(name));
    this.sync();
  }

  contains(name) {
    return this.values.has(name);
  }

  toggle(name, force) {
    const enabled = force === undefined ? !this.values.has(name) : Boolean(force);
    if (enabled) this.values.add(name);
    else this.values.delete(name);
    this.sync();
    return enabled;
  }
}

class TestNode {
  constructor(tagName, id = "") {
    this.tagName = tagName;
    this.id = id;
    this.attributes = {};
    this.children = [];
    this.dataset = {};
    this.style = {};
    this.listeners = {};
    this.classList = new ClassList(this);
    this.hidden = false;
    this.innerHTML = "";
    this.textContent = "";
    this.value = "";
    this.files = [];
    this.src = "";
    this.checked = false;
  }

  get value() {
    return this._value;
  }

  set value(nextValue) {
    this._value = String(nextValue ?? "");
    if (this.type === "file" && this._value === "") this.files = [];
  }

  setAttribute(name, value) {
    const stringValue = String(value);
    this.attributes[name] = stringValue;
    if (name === "class") this.classList.setFromString(stringValue);
    if (name === "src") this.src = stringValue;
    if (name.startsWith("data-")) {
      const key = name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      this.dataset[key] = stringValue;
    }
  }

  getAttribute(name) {
    return this.attributes[name] ?? null;
  }

  hasAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attributes, name);
  }

  removeAttribute(name) {
    delete this.attributes[name];
    if (name === "class") this.classList.setFromString("");
    if (name === "src") this.src = "";
  }

  appendChild(child) {
    this.children.push(child);
    child.parentNode = this;
    return child;
  }

  replaceChildren(...children) {
    this.children = [];
    children.forEach((child) => this.appendChild(child));
  }

  addEventListener(type, handler) {
    (this.listeners[type] ||= []).push(handler);
  }

  dispatchEvent(event) {
    const normalizedEvent = {
      preventDefault() {},
      stopPropagation() {},
      target: this,
      currentTarget: this,
      ...event,
    };
    (this.listeners[normalizedEvent.type] || []).forEach((handler) => handler(normalizedEvent));
    return true;
  }

  click() {
    this.dispatchEvent({ type: "click" });
  }

  closest(selector) {
    let node = this;
    while (node) {
      if (selector.startsWith(".")) {
        if (node.classList.contains(selector.slice(1))) return node;
      } else {
        const dataMatch = selector.match(/^\[data-([a-z0-9-]+)\]$/i);
        if (dataMatch) {
          const key = dataMatch[1].replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
          if (node.dataset[key] !== undefined) return node;
        }
      }
      node = node.parentNode;
    }
    return null;
  }

  querySelectorAll(selector) {
    const classes = selector.startsWith(".") ? selector.slice(1).split(".") : null;
    const dataSelector = selector.match(/^\[data-([a-z0-9-]+)(?:=(?:"([^"]*)"|'([^']*)'))?\]$/i);
    const dataKey = dataSelector?.[1].replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const expectedDataValue = dataSelector ? (dataSelector[2] ?? dataSelector[3]) : undefined;
    const results = [];
    const visit = (node) => {
      if (classes && classes.every((className) => node.classList.contains(className))) results.push(node);
      if (dataSelector && node.dataset[dataKey] !== undefined && (expectedDataValue === undefined || node.dataset[dataKey] === expectedDataValue)) results.push(node);
      node.children.forEach(visit);
    };
    this.children.forEach(visit);
    return results;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  getBoundingClientRect() {
    return this.id === "worldMap"
      ? { left: 0, top: 0, width: 1200, height: 600 }
      : { left: 0, top: 0, width: 220, height: 90 };
  }

  scrollTo() {}
  scrollIntoView() {}
  setPointerCapture() {}
  focus() {}
}

const requiredIds = [
  "worldMap", "mapViewport", "graticule", "countryClipPaths", "countryPaths", "roadLineOverlays", "countryBorders",
  "smallCountryMarkers", "mapTooltip", "countryPanel", "searchInput", "searchSummary", "filters", "countryBrowser",
  "browserButton", "closeBrowser", "browserList", "compareButton", "compareCount", "comparisonModal", "comparisonGrid",
  "compareSelect1", "compareSelect2", "compareSelect3", "zoomIn", "zoomOut", "resetZoom",
  "matcherButton", "roadMatcher", "roadScreenshot", "matcherPreview", "matcherPreviewImage", "removeScreenshot",
  "matcherTraffic", "matcherCenterColor", "matcherCenterStyle", "matcherEdgeColor", "matcherEdgeStyle",
  "matcherPlateColor", "matcherSurface", "matcherStopOnly", "matcherStopOther", "stopOnlyFilterChip", "stopOtherFilterChip",
  "whiteEdgeFilterChip", "whitePlateFilterChip", "allFilterChip", "leftTrafficFilterChip", "matcherReset", "matcherSummary", "matcherRoadPreview", "matcherCandidates",
  "matcherStopText", "matcherWarningSign", "matcherPlateLayout", "matcherBollard", "matcherPole", "matcherShoulder", "matcherSignBack", "matcherCamera",
  "matcherExcludedSummary",
  "updateNotice", "dismissUpdateNotice", "updateNoticeHeading", "updateNoticeText", "updateNoticeTime",
];
const nodesById = new Map(requiredIds.map((id) => [id, new TestNode("div", id)]));
nodesById.get("countryPanel").innerHTML = initialCountryPanelMarkup;
nodesById.get("roadMatcher").hidden = true;
nodesById.get("roadMatcher").setAttribute("aria-hidden", "true");
nodesById.get("matcherButton").setAttribute("aria-expanded", "false");
nodesById.get("matcherPreview").hidden = true;
nodesById.get("roadScreenshot").type = "file";
nodesById.get("matcherStopOnly").type = "checkbox";
nodesById.get("matcherStopOther").type = "checkbox";
nodesById.get("updateNotice").hidden = true;
nodesById.get("updateNotice").dataset.updateId = "2026-08-11-kleinere-stoppschild-filter-v1";
nodesById.get("updateNotice").dataset.publishedAt = "2026-08-11T12:47:00+02:00";
const filtersNode = nodesById.get("filters");
const allFilterChipNode = nodesById.get("allFilterChip");
allFilterChipNode.tagName = "button";
allFilterChipNode.classList.add("filter-chip", "active");
allFilterChipNode.dataset.filter = "all";
allFilterChipNode.setAttribute("aria-pressed", "true");
filtersNode.appendChild(allFilterChipNode);

function configureMatcherFilterChip(id, dataKey, controlId) {
  const chip = nodesById.get(id);
  chip.tagName = "button";
  chip.classList.add("filter-chip");
  chip.dataset[dataKey] = "";
  chip.setAttribute("aria-controls", controlId);
  chip.setAttribute("aria-pressed", "false");
  filtersNode.appendChild(chip);
  return chip;
}

configureMatcherFilterChip("stopOnlyFilterChip", "matcherStopOnly", "matcherStopOnly");
configureMatcherFilterChip("stopOtherFilterChip", "matcherStopOther", "matcherStopOther");
configureMatcherFilterChip("whiteEdgeFilterChip", "matcherEdgeWhite", "matcherEdgeColor");
configureMatcherFilterChip("whitePlateFilterChip", "matcherPlateWhite", "matcherPlateColor");
const leftTrafficFilterChipNode = nodesById.get("leftTrafficFilterChip");
leftTrafficFilterChipNode.tagName = "button";
leftTrafficFilterChipNode.classList.add("filter-chip");
leftTrafficFilterChipNode.dataset.filter = "traffic:left";
leftTrafficFilterChipNode.setAttribute("aria-pressed", "false");
filtersNode.appendChild(leftTrafficFilterChipNode);
for (const classes of [
  ["matcher-preview-ground"],
  ["matcher-preview-road"],
  ["matcher-preview-edge", "left"],
  ["matcher-preview-edge", "right"],
  ["matcher-preview-band"],
  ["matcher-preview-center"],
]) {
  const previewPart = new TestNode(classes[0] === "matcher-preview-ground" ? "rect" : "path");
  previewPart.classList.add(...classes);
  nodesById.get("matcherRoadPreview").appendChild(previewPart);
}
const matcherSelectIds = [
  "matcherTraffic", "matcherCenterColor", "matcherCenterStyle", "matcherEdgeColor", "matcherEdgeStyle", "matcherPlateColor", "matcherSurface",
  "matcherStopText", "matcherWarningSign", "matcherPlateLayout", "matcherBollard", "matcherPole", "matcherShoulder", "matcherSignBack", "matcherCamera",
];
const documentListeners = {};
const document = {
  getElementById: (id) => nodesById.get(id) || null,
  createElement: (name) => new TestNode(name),
  createElementNS: (_namespace, name) => new TestNode(name),
  querySelectorAll: (selector) => {
    const requestedSelectors = String(selector).split(",").map((part) => part.trim());
    const matches = [];
    if (requestedSelectors.includes(".matcher-observations select")) {
      matches.push(...matcherSelectIds.map((id) => nodesById.get(id)));
    }
    if (requestedSelectors.includes(".matcher-advanced select")) {
      matches.push(...matcherSelectIds.slice(7).map((id) => nodesById.get(id)));
    }
    if (requestedSelectors.some((part) => [
      ".matcher-observations input",
      ".matcher-observations input[type=\"checkbox\"]",
      ".matcher-observations input[type='checkbox']",
      "#matcherStopOnly",
      "#matcherStopOther",
    ].includes(part))) {
      matches.push(nodesById.get("matcherStopOnly"), nodesById.get("matcherStopOther"));
    }
    return [...new Set(matches)];
  },
  addEventListener(type, handler) {
    (documentListeners[type] ||= []).push(handler);
  },
  dispatchEvent(event) {
    const normalizedEvent = {
      preventDefault() {},
      stopPropagation() {},
      target: null,
      currentTarget: document,
      ...event,
    };
    (documentListeners[normalizedEvent.type] || []).forEach((handler) => handler(normalizedEvent));
    return true;
  },
};
const stored = new Map();
const localStorage = {
  getItem: (key) => stored.get(key) ?? null,
  setItem: (key, value) => stored.set(key, String(value)),
};

const objectUrls = new Set();
const revokedObjectUrls = [];
const urlObject = {
  createObjectURL(file) {
    const objectUrl = `blob:local-test/${encodeURIComponent(file?.name || "screenshot")}/${objectUrls.size + 1}`;
    objectUrls.add(objectUrl);
    return objectUrl;
  },
  revokeObjectURL(objectUrl) {
    objectUrls.delete(objectUrl);
    revokedObjectUrls.push(objectUrl);
  },
};
const windowObject = { innerWidth: 1600, innerHeight: 900, setTimeout, URL: urlObject };
const context = { window: windowObject, document, localStorage, console, setTimeout, URL: urlObject };
vm.createContext(context);
for (const relativePath of ["data/world-map.js", "data/countries.js", "script.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, relativePath), "utf8"), context, { filename: relativePath });
}

assert(nodesById.get("matcherRoadPreview").querySelector(".matcher-preview-center").style.display === "none", "Unselected center markings must stay hidden in the live road preview");
assert(nodesById.get("matcherRoadPreview").querySelector(".matcher-preview-edge.left").style.display === "none", "Unselected edge markings must stay hidden in the live road preview");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function fire(id, type, additions = {}) {
  const node = nodesById.get(id);
  assert(node, `Missing test node: ${id}`);
  node.dispatchEvent({ type, ...additions });
}

function clickWithBubble(id, parentId) {
  const target = nodesById.get(id);
  fire(id, "click", { target });
  fire(parentId, "click", { target });
}

function setMatcherValue(id, value) {
  nodesById.get(id).value = value;
  fire(id, "change");
}

function countryShape(iso3) {
  return nodesById.get("countryPaths").children.find((node) => node.dataset.iso === iso3);
}

function countryMapNode(iso3) {
  return countryShape(iso3)
    || nodesById.get("smallCountryMarkers").children.find((node) => node.dataset.iso === iso3);
}

function allCountryMapNodes() {
  return [
    ...nodesById.get("countryPaths").children,
    ...nodesById.get("smallCountryMarkers").children,
  ];
}

function assertPanelCountry(iso3, name) {
  const markup = nodesById.get("countryPanel").innerHTML;
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert(new RegExp(`<h2>[^<]*${escapedName}\\s*<\\/h2>`).test(markup), `Country panel heading does not show ${name}`);
  assert(new RegExp(`<span class=["']country-code["']>\\s*${iso3}\\s*·`).test(markup), `Country panel code does not show ${iso3}`);
  assert((markup.match(/class=["']country-content["']/g) || []).length === 1, "Country panel must contain exactly one selected-country profile");
}

function hasMatcherResultClass(node) {
  return ["is-matcher-match", "is-matcher-possible"].some((className) => node?.classList.contains(className));
}

const updateNotice = nodesById.get("updateNotice");
const updateNoticeId = updateNotice.dataset.updateId;
assert(updateNotice.hidden === false, "A newly published version must reveal the update notice");
assert(/11\. August 2026/.test(nodesById.get("updateNoticeTime").textContent) && /12:47/.test(nodesById.get("updateNoticeTime").textContent), "Update notice must format its current Luxembourg publication date and time");
document.dispatchEvent({ type: "keydown", key: "Escape" });
assert(updateNotice.hidden === true, "Escape must dismiss a visible update notice");
assert(stored.get("geoguessr-atlas-seen-update-id") === updateNoticeId, "Dismissing the update notice must persist the current version ID");
stored.delete("geoguessr-atlas-seen-update-id");
updateNotice.hidden = false;
fire("dismissUpdateNotice", "click");
assert(updateNotice.hidden === true, "Clicking the update notice button must dismiss the popup");
assert(stored.get("geoguessr-atlas-seen-update-id") === updateNoticeId, "Click dismissal must persist the current update version");

const paths = nodesById.get("countryPaths");
const clips = nodesById.get("countryClipPaths");
const borders = nodesById.get("countryBorders");
const overlays = nodesById.get("roadLineOverlays");
assert(paths.children.length === 177, `Expected 177 country paths, found ${paths.children.length}`);
assert(clips.children.length === 177, `Expected 177 clip paths, found ${clips.children.length}`);
assert(borders.children.length === 177, `Expected 177 top borders, found ${borders.children.length}`);
const worldCount = overlays.children.length;
const initialPanel = nodesById.get("countryPanel").innerHTML;
assert(/\bempty-state\b/.test(initialPanel), "Country panel must retain its neutral empty state on startup");
assert(/Wähle ein Land/i.test(initialPanel), "Country panel must show a neutral German selection heading on startup");
assert(/Karte/i.test(initialPanel) && /Länderbrowser/i.test(initialPanel), "Country panel must explain the map and browser selection routes on startup");
assert(!/Südafrika/i.test(initialPanel), "South Africa must not be displayed in the country panel on startup");
assert(!nodesById.get("worldMap").classList.contains("has-selection"), "Map must start without an active country selection");
assert(!paths.querySelectorAll(".is-selected").length && !borders.querySelectorAll(".is-selected").length, "No country shape or border may start selected");
assert(worldCount >= 12 && worldCount <= 25, `World view should stay curated and sparse, found ${worldCount} road samples`);
assert(!overlays.querySelectorAll(".road-map-pattern.is-badge").length, "Floating road badges must not exist");
assert(!overlays.children.some((node) => !node.getAttribute("clip-path")), "Every world road sample must be clipped inside a country");
assert(!overlays.children.some((node) => ["SGP", "LUX", "MLT", "BRB"].includes(node.dataset.iso)), "Small marker countries must not receive ocean road samples");
assert(!overlays.children.some((node) => ["BOL", "GRC", "IDN"].includes(node.dataset.iso)), "Partial, generic, or road-class patterns must stay out of the world view");

const surfaceWidths = overlays.querySelectorAll(".map-road-surface").map((surface) => Number(surface.getAttribute("width")));
assert(surfaceWidths.length === worldCount, "Every road sample must contain exactly one subtle asphalt surface");
assert(Math.max(...surfaceWidths) <= 44, "World road samples must respect the 44-unit width cap");
const southAfrica = overlays.children.find((node) => node.dataset.iso === "ZAF");
assert(southAfrica && southAfrica.getAttribute("clip-path") === "url(#country-clip-ZAF)", "South Africa must use a clipped road sample");
assert(southAfrica.children[0]?.classList.contains("map-road-surface"), "South Africa must integrate its lines into a compact asphalt strip");

const russiaPointerTarget = countryShape("RUS");
fire("worldMap", "pointerdown", { pointerId: 77, button: 0, clientX: 720, clientY: 160, target: russiaPointerTarget });
fire("worldMap", "pointerup", { pointerId: 77, button: 0, clientX: 720, clientY: 160, target: nodesById.get("worldMap") });
assertPanelCountry("RUS", "Russland");
assert(russiaPointerTarget.classList.contains("is-selected"), "A non-drag pointer release must select the original country even when SVG pointer capture retargets pointerup");

const zoomIn = nodesById.get("zoomIn");
zoomIn.listeners.click[0]();
zoomIn.listeners.click[0]();
assert(nodesById.get("worldMap").dataset.zoomLevel === "regional", "Two zoom steps must enter the regional LOD");
const regionalCount = overlays.children.length;
assert(regionalCount >= 10 && regionalCount <= 60, `Regional view has an implausible road-sample count: ${regionalCount}`);
assert(overlays.children.some((node) => node.dataset.iso === "CAN"), "Canada's verified medium-confidence pattern should appear at regional zoom");

zoomIn.listeners.click[0]();
zoomIn.listeners.click[0]();
zoomIn.listeners.click[0]();
assert(nodesById.get("worldMap").dataset.zoomLevel === "country", "Five zoom steps must enter the country LOD");
const countryCount = overlays.children.length;
assert(countryCount > regionalCount, "Country LOD should reveal more verified or neutral road samples");
const netherlandsClose = overlays.children.find((node) => node.dataset.iso === "NLD");
assert(netherlandsClose?.children.some((child) => child.classList.contains("map-road-band")), "Netherlands must show its green-band road-class sample at close zoom");
const boliviaClose = overlays.children.find((node) => node.dataset.iso === "BOL");
assert(boliviaClose?.dataset.displayMode === "neutral", "Bolivia's partially verified pattern must render neutrally at close zoom");
assert(boliviaClose.children.some((child) => child.classList.contains("map-road-neutral-line")), "Neutral samples need an uncertainty line instead of precise markings");

nodesById.get("resetZoom").listeners.click[0]();
const netherlandsPath = paths.children.find((node) => node.dataset.iso === "NLD");
netherlandsPath.listeners.click[0]();
assert(nodesById.get("worldMap").classList.contains("has-selection"), "Selecting a country must activate selection dimming");
assert(netherlandsPath.classList.contains("is-selected"), "Selected country shape must be highlighted");
assert(overlays.children.some((node) => node.dataset.iso === "NLD"), "A selected small country must reveal its clipped road sample");
netherlandsPath.listeners.pointerenter[0]({ clientX: 400, clientY: 250 });
const tooltipMarkup = nodesById.get("mapTooltip").innerHTML;
assert((tooltipMarkup.match(/<span/g) || []).length === 2 && (tooltipMarkup.match(/<strong/g) || []).length === 1, "Map tooltip must stay at exactly three compact lines");
assertPanelCountry("NLD", "Niederlande");

fire("browserButton", "click");
assert(nodesById.get("countryBrowser").classList.contains("open"), "Country browser must open before browser selection");
const japanBrowserCountry = new TestNode("button");
japanBrowserCountry.dataset.selectCountry = "JPN";
document.dispatchEvent({ type: "click", target: japanBrowserCountry });
assertPanelCountry("JPN", "Japan");
assert(countryShape("JPN").classList.contains("is-selected"), "Country selected through the browser must be highlighted");
const japanPanelMarkup = nodesById.get("countryPanel").innerHTML;
assert(/Datenqualität und Quellen/.test(japanPanelMarkup), "Selected-country panel must expose data quality and sources");
assert(/Zuverlässigkeit/.test(japanPanelMarkup) && /Quelle 1/.test(japanPanelMarkup), "Country data-quality panel must label confidence and at least one source");
assert(/target="_blank" rel="noopener noreferrer"/.test(japanPanelMarkup), "Country source links must open safely in a new tab");
assert((japanPanelMarkup.match(/class="country-flag"/g) || []).length === 1 && /aria-label="Flagge von Japan"/.test(japanPanelMarkup), "Japan's selected-country profile must show exactly one prominent accessible flag");
assert(/src="assets\/flags\/4x3\/jp\.svg"/.test(japanPanelMarkup), "Japan's selected-country profile must use its local SVG flag");
assert(!netherlandsPath.classList.contains("is-selected"), "Previous map selection must be cleared after browser selection");
assert(!nodesById.get("countryBrowser").classList.contains("open"), "Country browser must close after selecting a country");

countryShape("RUS").listeners.click[0]();
assertPanelCountry("RUS", "Russland");
const russiaPanelMarkup = nodesById.get("countryPanel").innerHTML;
assert(/aria-label="Flagge von Russland"/.test(russiaPanelMarkup) && /src="assets\/flags\/4x3\/ru\.svg"/.test(russiaPanelMarkup), "Selecting Russia must replace the previous flag with Russia's local SVG flag");
assert(!/assets\/flags\/4x3\/jp\.svg/.test(russiaPanelMarkup), "Changing countries must not leave the previous flag in the panel");

countryShape("PHL").listeners.click[0]();
assertPanelCountry("PHL", "Philippinen");
const philippinesPanelMarkup = nodesById.get("countryPanel").innerHTML;
assert(/aria-label="Flagge von Philippinen"/.test(philippinesPanelMarkup) && /src="assets\/flags\/4x3\/ph\.svg"/.test(philippinesPanelMarkup), "Selecting the Philippines must show the Philippine local SVG flag");
assert((philippinesPanelMarkup.match(/class="road-slab-joints"/g) || []).length === 2, "Both Philippine concrete road diagrams must show rectangular slab joints");
assert(!/assets\/flags\/4x3\/ru\.svg/.test(philippinesPanelMarkup), "The Philippine panel must not retain Russia's flag");

// The matcher uses a locally shown screenshot as a visual reference. The actual
// country filtering is deterministic and driven only by the selected clues.
const matcher = nodesById.get("roadMatcher");
const allFilterChip = nodesById.get("allFilterChip");
const mainStopOnlyChip = nodesById.get("stopOnlyFilterChip");
const mainStopOtherChip = nodesById.get("stopOtherFilterChip");
const mainWhiteEdgeChip = nodesById.get("whiteEdgeFilterChip");
const mainWhitePlateChip = nodesById.get("whitePlateFilterChip");
const stopOnlyCheckbox = nodesById.get("matcherStopOnly");
const stopOtherCheckbox = nodesById.get("matcherStopOther");
assert(stopOnlyCheckbox.checked === false, "STOP-only matcher checkbox must start disabled");
assert(stopOtherCheckbox.checked === false, "Other-text stop-sign matcher checkbox must start disabled");
assert(mainStopOnlyChip.getAttribute("aria-pressed") === "false" && !mainStopOnlyChip.classList.contains("active"), "Main STOP-only filter chip must start inactive");
assert(mainStopOtherChip.getAttribute("aria-pressed") === "false" && !mainStopOtherChip.classList.contains("active"), "Main other-text stop-sign filter chip must start inactive");
assert(mainWhiteEdgeChip.getAttribute("aria-pressed") === "false" && !mainWhiteEdgeChip.classList.contains("active"), "Main white-edge filter chip must start inactive");
assert(mainWhitePlateChip.getAttribute("aria-pressed") === "false" && !mainWhitePlateChip.classList.contains("active"), "Main white-plate filter chip must start inactive");
assert(allFilterChip.getAttribute("aria-pressed") === "true" && allFilterChip.classList.contains("active"), "All must start active while no matcher clues are selected");

clickWithBubble("stopOnlyFilterChip", "filters");
assert(stopOnlyCheckbox.checked === true, "Clicking the visible STOP-only filter chip must enable the matcher checkbox");
assert(stopOtherCheckbox.checked === false, "Enabling STOP-only must leave the opposite stop-sign criterion disabled");
assert(mainStopOnlyChip.getAttribute("aria-pressed") === "true" && mainStopOnlyChip.classList.contains("active"), "Active STOP-only filter chip must synchronize its ARIA and visual states");
assert(mainStopOtherChip.getAttribute("aria-pressed") === "false" && !mainStopOtherChip.classList.contains("active"), "STOP-only activation must leave the other-text chip inactive");
assert(allFilterChip.getAttribute("aria-pressed") === "false" && !allFilterChip.classList.contains("active"), "All must deactivate when a matcher-backed main chip is active");
assert(!countryShape("USA").classList.contains("is-matcher-excluded"), "The visible STOP-only filter chip must run the matcher and retain the USA");
assert(countryShape("MEX").classList.contains("is-matcher-excluded"), "The visible STOP-only filter chip must run the matcher and exclude Mexico's ALTO sign");

clickWithBubble("stopOtherFilterChip", "filters");
assert(stopOnlyCheckbox.checked === false, "Enabling other-text stop signs from the main chip must disable STOP-only");
assert(stopOtherCheckbox.checked === true, "Clicking the other-text stop-sign chip must enable its matcher checkbox");
assert(mainStopOnlyChip.getAttribute("aria-pressed") === "false" && !mainStopOnlyChip.classList.contains("active"), "Other-text activation must deactivate the STOP-only chip");
assert(mainStopOtherChip.getAttribute("aria-pressed") === "true" && mainStopOtherChip.classList.contains("active"), "Other-text stop-sign chip must synchronize its ARIA and visual states");
for (const iso3 of ["MEX", "BRA", "JPN", "MYS"]) {
  assert(countryShape(iso3).classList.contains("is-matcher-match"), `${iso3} must exactly match the sourced other-text stop-sign filter`);
}
for (const iso3 of ["USA", "GBR", "FRA"]) {
  assert(countryShape(iso3).classList.contains("is-matcher-excluded"), `${iso3} must be excluded because its sourced sign shows only STOP`);
}
assert(countryShape("CAN").classList.contains("is-matcher-possible"), "Canada's regionally variable stop-sign text must remain possible");
assert(countryShape("ATA").classList.contains("is-matcher-possible"), "Unknown stop-sign text must remain possible for the other-text filter");

clickWithBubble("stopOtherFilterChip", "filters");
assert(stopOtherCheckbox.checked === false, "Clicking the active other-text stop-sign chip again must disable it");
assert(mainStopOtherChip.getAttribute("aria-pressed") === "false" && !mainStopOtherChip.classList.contains("active"), "Disabled other-text stop-sign chip must synchronize its ARIA and visual states");
assert(allFilterChip.getAttribute("aria-pressed") === "true" && allFilterChip.classList.contains("active"), "All must reactivate after the final matcher-backed chip is switched off");

stopOtherCheckbox.checked = true;
fire("matcherStopOther", "change");
stopOnlyCheckbox.checked = true;
fire("matcherStopOnly", "change");
assert(stopOnlyCheckbox.checked === true && stopOtherCheckbox.checked === false, "Changing the STOP-only checkbox directly must disable the other-text checkbox");
assert(mainStopOnlyChip.classList.contains("active") && !mainStopOtherChip.classList.contains("active"), "Direct checkbox changes must synchronize both stop-sign chips");
fire("matcherReset", "click");
assert(stopOnlyCheckbox.checked === false, "Matcher reset must disable the checkbox activated by the main STOP-only filter chip");
assert(stopOtherCheckbox.checked === false, "Matcher reset must disable the other-text stop-sign checkbox");
assert(mainStopOnlyChip.getAttribute("aria-pressed") === "false" && !mainStopOnlyChip.classList.contains("active"), "Matcher reset must also deactivate the main STOP-only filter chip");
assert(mainStopOtherChip.getAttribute("aria-pressed") === "false" && !mainStopOtherChip.classList.contains("active"), "Matcher reset must also deactivate the main other-text filter chip");

clickWithBubble("whiteEdgeFilterChip", "filters");
assert(nodesById.get("matcherEdgeColor").value === "white", "Clicking the white-edge chip must select matcherEdgeColor=white");
assert(mainWhiteEdgeChip.getAttribute("aria-pressed") === "true" && mainWhiteEdgeChip.classList.contains("active"), "White-edge chip must synchronize its ARIA and visual states");
assert(countryShape("USA").classList.contains("is-matcher-match"), "The USA must exactly match its sourced white edge lines");
assert(countryShape("ZAF").classList.contains("is-matcher-excluded"), "South Africa's sourced yellow edge lines must be excluded by the white-edge filter");
assert(countryShape("BWA").classList.contains("is-matcher-excluded"), "Botswana's sourced yellow edge lines must be excluded by the white-edge filter");
assert(countryShape("ATA").classList.contains("is-matcher-possible"), "Unknown road-line data must remain possible for the white-edge filter");
clickWithBubble("whiteEdgeFilterChip", "filters");
assert(nodesById.get("matcherEdgeColor").value === "", "Clicking the active white-edge chip again must clear matcherEdgeColor");
assert(mainWhiteEdgeChip.getAttribute("aria-pressed") === "false" && !mainWhiteEdgeChip.classList.contains("active"), "Cleared white-edge chip must synchronize its ARIA and visual states");
setMatcherValue("matcherEdgeColor", "white");
assert(mainWhiteEdgeChip.classList.contains("active") && mainWhiteEdgeChip.getAttribute("aria-pressed") === "true", "Selecting white edges in the matcher must activate the main chip");
setMatcherValue("matcherEdgeColor", "yellow");
assert(!mainWhiteEdgeChip.classList.contains("active") && mainWhiteEdgeChip.getAttribute("aria-pressed") === "false", "Changing the matcher away from white edges must deactivate the main chip");
fire("matcherReset", "click");

clickWithBubble("whitePlateFilterChip", "filters");
assert(nodesById.get("matcherPlateColor").value === "white", "Clicking the white-plate chip must select matcherPlateColor=white");
assert(mainWhitePlateChip.getAttribute("aria-pressed") === "true" && mainWhitePlateChip.classList.contains("active"), "White-plate chip must synchronize its ARIA and visual states");
assert(countryShape("DEU").classList.contains("is-matcher-match"), "Germany must exactly match its documented white plates");
assert(countryShape("NLD").classList.contains("is-matcher-excluded"), "The Netherlands' documented yellow plates must be excluded by the white-plate filter");
assert(countryShape("LUX").classList.contains("is-matcher-excluded"), "Luxembourg's documented yellow plates must be excluded by the white-plate filter");
assert(countryShape("MYS").classList.contains("is-matcher-excluded"), "Malaysia's white characters on dark plates must not be mistaken for a white plate background");
assert(countryShape("USA").classList.contains("is-matcher-possible"), "Variable US plate data must remain possible for the white-plate filter");
assert(countryShape("ATA").classList.contains("is-matcher-possible"), "Unknown plate data must remain possible for the white-plate filter");
clickWithBubble("whitePlateFilterChip", "filters");
assert(nodesById.get("matcherPlateColor").value === "", "Clicking the active white-plate chip again must clear matcherPlateColor");
assert(mainWhitePlateChip.getAttribute("aria-pressed") === "false" && !mainWhitePlateChip.classList.contains("active"), "Cleared white-plate chip must synchronize its ARIA and visual states");
setMatcherValue("matcherPlateColor", "white");
assert(mainWhitePlateChip.classList.contains("active") && mainWhitePlateChip.getAttribute("aria-pressed") === "true", "Selecting white plates in the matcher must activate the main chip");
setMatcherValue("matcherPlateColor", "yellow");
assert(!mainWhitePlateChip.classList.contains("active") && mainWhitePlateChip.getAttribute("aria-pressed") === "false", "Changing the matcher away from white plates must deactivate the main chip");
fire("matcherReset", "click");

clickWithBubble("stopOtherFilterChip", "filters");
clickWithBubble("whiteEdgeFilterChip", "filters");
clickWithBubble("whitePlateFilterChip", "filters");
assert(stopOtherCheckbox.checked && nodesById.get("matcherEdgeColor").value === "white" && nodesById.get("matcherPlateColor").value === "white", "Three matcher-backed main chips must be combinable");
clickWithBubble("allFilterChip", "filters");
assert(!stopOnlyCheckbox.checked && !stopOtherCheckbox.checked, "All must clear both stop-sign matcher checkboxes");
assert(nodesById.get("matcherEdgeColor").value === "" && nodesById.get("matcherPlateColor").value === "", "All must clear matcher values set by the white clue chips");
for (const chip of [mainStopOnlyChip, mainStopOtherChip, mainWhiteEdgeChip, mainWhitePlateChip]) {
  assert(!chip.classList.contains("active") && chip.getAttribute("aria-pressed") === "false", "All must deactivate every matcher-backed main chip");
}
assert(allFilterChip.classList.contains("active") && allFilterChip.getAttribute("aria-pressed") === "true", "All must synchronize its active and ARIA states after clearing matcher chips");
for (const layer of [paths, borders, overlays]) {
  assert(!layer.querySelectorAll(".is-matcher-match").length && !layer.querySelectorAll(".is-matcher-possible").length && !layer.querySelectorAll(".is-matcher-excluded").length, "All must clear every matcher result class");
}

// Quick filters and matcher clues must produce one shared intersection in the
// map, result cards, and numerical matcher summary.
clickWithBubble("whitePlateFilterChip", "filters");
clickWithBubble("leftTrafficFilterChip", "filters");
const mixedFilterCandidates = nodesById.get("matcherCandidates").innerHTML;
assert(/data-iso=["']GBR["']/.test(mixedFilterCandidates), "Left-hand traffic plus white plates must retain Great Britain in the candidate list");
assert(!/data-iso=["']DEU["']/.test(mixedFilterCandidates), "A right-driving white-plate country must not remain in the mixed-filter candidate list");
assert(!countryMapNode("GBR").classList.contains("is-dimmed"), "Great Britain must remain visible on the map for the mixed filter intersection");
assert(countryMapNode("DEU").classList.contains("is-dimmed"), "Germany must be dimmed on the map by the left-traffic quick filter");

const mixedCandidateIso3 = [...mixedFilterCandidates.matchAll(/<article\b[^>]*data-iso=["']([A-Z]{3})["']/g)].map((match) => match[1]);
assert(mixedCandidateIso3.length > 0, "Mixed quick and matcher filters must render at least one candidate card");
mixedCandidateIso3.forEach((iso3) => {
  const node = countryMapNode(iso3);
  assert(node && node.classList.contains("is-match") && !node.classList.contains("is-dimmed") && !node.classList.contains("is-matcher-excluded"), `${iso3} candidate card must belong to the same visible map intersection`);
});

const mixedMapNodes = allCountryMapNodes().filter((node) => node.classList.contains("is-match"));
const mixedMapCounts = {
  match: mixedMapNodes.filter((node) => node.classList.contains("is-matcher-match")).length,
  possible: mixedMapNodes.filter((node) => node.classList.contains("is-matcher-possible")).length,
  excluded: mixedMapNodes.filter((node) => node.classList.contains("is-matcher-excluded")).length,
};
const mixedSummaryText = nodesById.get("matcherSummary").textContent;
const mixedSummaryCounts = mixedSummaryText.match(/^(\d+) (?:passt|passen) gut · (\d+) noch möglich · (\d+) eher ausgeschlossen/);
assert(mixedSummaryCounts, "Mixed-filter matcher summary must expose exact match, possible, and excluded counts");
assert(Number(mixedSummaryCounts[1]) === mixedMapCounts.match, "Matcher summary exact matches must use the quick-filter map intersection");
assert(Number(mixedSummaryCounts[2]) === mixedMapCounts.possible, "Matcher summary possible matches must use the quick-filter map intersection");
assert(Number(mixedSummaryCounts[3]) === mixedMapCounts.excluded, "Matcher summary exclusions must use the quick-filter map intersection");
clickWithBubble("allFilterChip", "filters");

// A manual exclusion is itself an active restriction even when no matcher
// criteria or quick filters are selected.
const manualOnlyExclude = new TestNode("button");
manualOnlyExclude.dataset.matcherExclude = "ZAF";
fire("matcherCandidates", "click", { target: manualOnlyExclude });
const manualOnlySearchSummary = nodesById.get("searchSummary").textContent;
assert(countryMapNode("ZAF").classList.contains("is-matcher-excluded"), "A manual-only exclusion must reach the map");
assert(!/^Alle\b.*werden angezeigt/i.test(manualOnlySearchSummary), "Search summary must not claim that all countries are displayed during a manual-only exclusion");
assert(/1 manuell ausgeschlossenes Land/i.test(manualOnlySearchSummary), "Search summary must name the single manual-only exclusion");
assert(manualOnlySearchSummary.includes(`${allCountryMapNodes().length - 1} Treffer`), "Search summary hit count must omit the manually excluded country");
assert(!allFilterChip.classList.contains("active") && allFilterChip.getAttribute("aria-pressed") === "false", "A manual-only exclusion must deactivate All");

const manualOnlyRestore = new TestNode("button");
manualOnlyRestore.dataset.matcherRestore = "ZAF";
fire("matcherExcludedSummary", "click", { target: manualOnlyRestore });
assert(!countryMapNode("ZAF").classList.contains("is-matcher-excluded"), "Restoring a manual-only exclusion must return the country to the map");
assert(/^Alle\b.*werden angezeigt/i.test(nodesById.get("searchSummary").textContent), "Restoring the sole manual exclusion must restore the neutral search summary");

if (matcher.hidden && !matcher.classList.contains("open")) fire("matcherButton", "click");
assert(!matcher.hidden || matcher.classList.contains("open"), "Matcher button must reveal the road-screenshot matcher");

const screenshotInput = nodesById.get("roadScreenshot");
screenshotInput.files = [{ name: "street-reference.png", type: "image/png", size: 4096 }];
fire("roadScreenshot", "change");
const screenshotObjectUrl = nodesById.get("matcherPreviewImage").src;
assert(screenshotObjectUrl.startsWith("blob:local-test/"), "Screenshot preview must use a local object URL");
assert(!nodesById.get("matcherPreview").hidden, "Choosing a screenshot must reveal the local preview");
fire("removeScreenshot", "click");
assert(nodesById.get("matcherPreview").hidden, "Removing a screenshot must hide its preview");
assert(revokedObjectUrls.includes(screenshotObjectUrl), "Removing a screenshot must revoke its object URL");

setMatcherValue("matcherCenterColor", "yellow");
setMatcherValue("matcherCenterStyle", "dashed");
setMatcherValue("matcherEdgeColor", "white");
setMatcherValue("matcherEdgeStyle", "solid");
const yellowDashedCandidates = nodesById.get("matcherCandidates").innerHTML;
for (const iso3 of ["USA", "MEX", "BRA"]) {
  const shape = countryShape(iso3);
  assert(shape && !shape.classList.contains("is-matcher-excluded"), `${iso3} must not be excluded by yellow dashed centers with white solid edges`);
  assert(hasMatcherResultClass(shape), `${iso3} must remain a matching or possible candidate for the selected road pattern`);
  assert(yellowDashedCandidates.includes(iso3), `${iso3} must appear in the matcher candidate list`);
}
assert(/Treffer|möglich|Mögliche Länder/i.test(nodesById.get("matcherSummary").textContent + nodesById.get("matcherSummary").innerHTML), "Matcher summary must report candidate results");
assert(overlays.children.length <= 32, `Matcher must keep the world map readable; found ${overlays.children.length} road samples`);

// Traffic-side isolation is a separate screenshot observation. Clear the line
// pattern first so valid left-driving alternatives are not rejected for having
// their own country-specific markings.
fire("matcherReset", "click");
setMatcherValue("matcherTraffic", "left");
assert(countryShape("USA").classList.contains("is-matcher-excluded"), "Left-hand traffic must exclude the USA");
assert(/USA/.test(nodesById.get("matcherExcludedSummary").innerHTML), "Automatically excluded countries must be visible by name in the exclusion group");
for (const iso3 of ["ZAF", "AUS"]) {
  const shape = countryShape(iso3);
  assert(hasMatcherResultClass(shape), `${iso3} must remain possible or matching with left-hand traffic`);
  assert(!shape.classList.contains("is-matcher-excluded"), `${iso3} must not be excluded by left-hand traffic`);
}
const southAfricaBorder = borders.children.find((node) => node.dataset.iso === "ZAF");
assert(hasMatcherResultClass(southAfricaBorder), "Matcher result classes must also reach country borders");
const southAfricaMatcherRoad = overlays.children.find((node) => node.dataset.iso === "ZAF");
assert(southAfricaMatcherRoad && hasMatcherResultClass(southAfricaMatcherRoad), "Matcher result classes must also reach visible road samples");

const excludeSouthAfrica = new TestNode("button");
excludeSouthAfrica.dataset.matcherExclude = "ZAF";
fire("matcherCandidates", "click", { target: excludeSouthAfrica });
assert(countryShape("ZAF").classList.contains("is-matcher-excluded"), "Manual exclusion must override a matching country");
assert(!hasMatcherResultClass(countryShape("ZAF")), "A manually excluded country must not retain a matcher result class");
assert(/ZAF|Südafrika/.test(nodesById.get("matcherExcludedSummary").textContent + nodesById.get("matcherExcludedSummary").innerHTML), "Manual exclusions must be visible in the exclusion summary");

const restoreSouthAfrica = new TestNode("button");
restoreSouthAfrica.dataset.matcherRestore = "ZAF";
fire("matcherExcludedSummary", "click", { target: restoreSouthAfrica });
assert(!countryShape("ZAF").classList.contains("is-matcher-excluded"), "Restoring a country must remove the manual exclusion");
assert(hasMatcherResultClass(countryShape("ZAF")), "A restored country must return to its calculated matcher group");

fire("matcherCandidates", "click", { target: excludeSouthAfrica });
assert(countryShape("ZAF").classList.contains("is-matcher-excluded"), "A restored country must remain manually excludable");

const selectedBeforeMatcherReset = nodesById.get("worldMap").classList.contains("has-selection");
fire("matcherReset", "click");
for (const id of matcherSelectIds) {
  assert(nodesById.get(id).value === "", `Matcher reset must clear ${id}`);
}
assert(!stopOnlyCheckbox.checked && !stopOtherCheckbox.checked, "Matcher reset must clear both stop-sign checkboxes");
for (const chip of [mainStopOnlyChip, mainStopOtherChip, mainWhiteEdgeChip, mainWhitePlateChip]) {
  assert(!chip.classList.contains("active") && chip.getAttribute("aria-pressed") === "false", "Matcher reset must deactivate all matcher-backed main chips");
}
assert(allFilterChip.classList.contains("active") && allFilterChip.getAttribute("aria-pressed") === "true", "Matcher reset must reactivate All when no other filters remain");
for (const layer of [paths, borders, overlays]) {
  assert(!layer.querySelectorAll(".is-matcher-match").length, "Matcher reset must remove exact-match classes");
  assert(!layer.querySelectorAll(".is-matcher-possible").length, "Matcher reset must remove possible-match classes");
  assert(!layer.querySelectorAll(".is-matcher-excluded").length, "Matcher reset must remove exclusion classes");
}
assert(nodesById.get("matcherPreview").hidden, "Matcher reset must clear the screenshot preview");
assert(nodesById.get("worldMap").classList.contains("has-selection") === selectedBeforeMatcherReset, "Matcher reset must preserve the current country selection");
assert(/Noch keine Länder ausgeschlossen/i.test(nodesById.get("matcherExcludedSummary").textContent + nodesById.get("matcherExcludedSummary").innerHTML), "Matcher reset must clear manual exclusions");

setMatcherValue("matcherTraffic", "left");
setMatcherValue("matcherCenterColor", "white");
setMatcherValue("matcherCenterStyle", "dashed");
setMatcherValue("matcherEdgeColor", "yellow");
setMatcherValue("matcherEdgeStyle", "solid");
assert(hasMatcherResultClass(countryShape("ZAF")), "South Africa's left-driving white-center/yellow-edge pattern must remain a matcher result");
assert(!countryShape("ZAF").classList.contains("is-matcher-excluded"), "South Africa must not be excluded by its documented road pattern");
fire("matcherReset", "click");

setMatcherValue("matcherCenterColor", "green");
setMatcherValue("matcherPlateColor", "yellow");
assert(hasMatcherResultClass(countryShape("NLD")), "A green center band plus yellow plates must keep the Netherlands as a candidate");
assert(!countryShape("NLD").classList.contains("is-matcher-excluded"), "Dutch screenshot clues must not exclude the Netherlands");
assert(nodesById.get("matcherRoadPreview").querySelector(".matcher-preview-band").style.display === "", "The green-band option must reveal a green center band in the live preview");
assert(nodesById.get("matcherRoadPreview").querySelector(".matcher-preview-center").getAttribute("stroke-dasharray") === "", "The Dutch green-band preview must default to solid white boundary lines");
fire("matcherReset", "click");
assert(!hasMatcherResultClass(countryShape("NLD")) && !countryShape("NLD").classList.contains("is-matcher-excluded"), "The final matcher reset must clear the Netherlands test state");

stopOnlyCheckbox.checked = true;
fire("matcherStopOnly", "change");
assert(stopOtherCheckbox.checked === false, "Direct STOP-only checkbox activation must keep other-text stop signs disabled");
assert(mainStopOnlyChip.getAttribute("aria-pressed") === "true" && mainStopOnlyChip.classList.contains("active"), "Changing the matcher checkbox must activate the visible STOP-only filter chip");
assert(hasMatcherResultClass(countryShape("USA")), "A country with STOP-only signs must remain a matcher candidate");
assert(!countryShape("USA").classList.contains("is-matcher-excluded"), "The STOP-only clue must not exclude the USA");
assert(countryShape("JPN").classList.contains("is-matcher-excluded"), "STOP-only signs must exclude Japan's Japanese stop-sign text");
assert(countryShape("MEX").classList.contains("is-matcher-excluded"), "STOP-only signs must exclude Mexico's ALTO stop-sign text");
assert(!countryShape("ATA").classList.contains("is-matcher-excluded"), "Countries without stop-sign text data must remain possible instead of being hard-excluded");
fire("matcherReset", "click");
assert(stopOnlyCheckbox.checked === false, "Matcher reset must disable the STOP-only checkbox");
assert(stopOtherCheckbox.checked === false, "Matcher reset must keep the other-text stop-sign checkbox disabled");
assert(mainStopOnlyChip.getAttribute("aria-pressed") === "false" && !mainStopOnlyChip.classList.contains("active"), "Matcher reset must keep the main STOP-only filter chip synchronized");
assert(mainStopOtherChip.getAttribute("aria-pressed") === "false" && !mainStopOtherChip.classList.contains("active"), "Matcher reset must keep the other-text stop-sign chip synchronized");

setMatcherValue("matcherStopText", "pare");
assert(hasMatcherResultClass(countryShape("BRA")) && !countryShape("BRA").classList.contains("is-matcher-excluded"), "PARE must retain Brazil as a sourced stop-sign candidate");
assert(countryShape("MEX").classList.contains("is-matcher-excluded"), "PARE must exclude Mexico's sourced ALTO sign");
assert(!countryShape("ATA").classList.contains("is-matcher-excluded"), "Unknown stop-sign data must stay possible for a PARE observation");
assert(/BRA/.test(nodesById.get("matcherCandidates").innerHTML) && /belastbar/.test(nodesById.get("matcherCandidates").innerHTML), "PARE results must show Brazil with an evidence-quality badge");
fire("matcherReset", "click");

setMatcherValue("matcherWarningSign", "diamond-yellow");
assert(hasMatcherResultClass(countryShape("USA")) && !countryShape("USA").classList.contains("is-matcher-excluded"), "A yellow warning diamond must retain the sourced USA profile");
assert(countryShape("GBR").classList.contains("is-matcher-excluded"), "A yellow warning diamond must exclude Great Britain's sourced white-triangle standard");
assert(!countryShape("ATA").classList.contains("is-matcher-excluded"), "Missing warning-sign data must remain possible");
assert(/amtlich belegt/.test(nodesById.get("matcherCandidates").innerHTML) && /Quelle/.test(nodesById.get("matcherCandidates").innerHTML), "Verified visual matches must show evidence and source indicators");
fire("matcherReset", "click");

setMatcherValue("matcherWarningSign", "triangle-yellow");
assert(hasMatcherResultClass(countryShape("SWE")) && !countryShape("SWE").classList.contains("is-matcher-excluded"), "A yellow warning triangle must retain Sweden");
assert(countryShape("USA").classList.contains("is-matcher-excluded"), "A yellow warning triangle must exclude the USA's sourced yellow-diamond standard");
fire("matcherReset", "click");

setMatcherValue("matcherPlateLayout", "white-yellow");
assert(hasMatcherResultClass(countryShape("GBR")) && !countryShape("GBR").classList.contains("is-matcher-excluded"), "White-front/yellow-rear plates must retain Great Britain");
assert(countryShape("NLD").classList.contains("is-matcher-excluded"), "White-front/yellow-rear plates must exclude the Netherlands' sourced yellow/yellow layout");
assert(hasMatcherResultClass(countryShape("BWA")) && !countryShape("BWA").classList.contains("is-matcher-excluded"), "Botswana's medium-confidence white/yellow layout must stay possible");
fire("matcherReset", "click");

for (const [control, value, expectedIso] of [
  ["matcherBollard", "white-black", "DEU"],
  ["matcherPole", "concrete", "JPN"],
  ["matcherShoulder", "drainage", "JPN"],
  ["matcherSignBack", "dark", "BRA"],
  ["matcherCamera", "low", "JPN"],
]) {
  setMatcherValue(control, value);
  assert(hasMatcherResultClass(countryShape(expectedIso)) && !countryShape(expectedIso).classList.contains("is-matcher-excluded"), `${control} must retain its documented example country`);
  assert(!countryShape("ATA").classList.contains("is-matcher-excluded"), `${control} must not hard-exclude a country with unknown data`);
  assert(!countryShape("USA").classList.contains("is-matcher-excluded") || expectedIso === "USA", `${control} must remain a soft clue instead of hard-excluding the USA`);
  fire("matcherReset", "click");
}

setMatcherValue("matcherSurface", "unpaved");
assert(hasMatcherResultClass(countryShape("BOL")), "An unpaved-road clue must retain Bolivia through its documented surface profile");
fire("matcherReset", "click");
setMatcherValue("matcherEdgeColor", "none");
setMatcherValue("matcherEdgeStyle", "none");
setMatcherValue("matcherSurface", "concrete");
assert(hasMatcherResultClass(countryShape("PHL")), "A concrete-road clue must retain the Philippines through its documented road variant");
fire("matcherReset", "click");

setMatcherValue("matcherPlateColor", "dark");
assert(hasMatcherResultClass(countryShape("MYS")), "Dark license plates must retain Malaysia as a candidate");
assert(countryShape("LUX").classList.contains("is-matcher-excluded"), "Black lettering on yellow plates must not classify Luxembourg as having dark plate backgrounds");
fire("matcherReset", "click");

console.log(JSON.stringify({
  status: "OK",
  countryPaths: paths.children.length,
  clipPaths: clips.children.length,
  topBorders: borders.children.length,
  worldRoadSamples: worldCount,
  regionalRoadSamples: regionalCount,
  countryRoadSamples: countryCount,
  floatingRoadBadges: 0,
  maxWorldSurfaceWidth: Math.max(...surfaceWidths),
  selectedSmallCountrySample: true,
  neutralInitialCountryPanel: true,
  countryPanelSelectionRouting: true,
  pointerCapturedCountrySelection: true,
  matcherLocalScreenshotPreview: true,
  matcherRoadCandidates: true,
  matcherManualExclusion: true,
  matcherManualRestore: true,
  matcherAutomaticExclusionList: true,
  matcherNeutralPreview: true,
  matcherUnmarkedRoadVariants: true,
  matcherSurfaceProfiles: true,
  matcherSouthAfricaPattern: true,
  matcherPlateBackgrounds: true,
  matcherStopSignText: true,
  matcherStopMainFilterSync: true,
  matcherOtherStopTextFilter: true,
  matcherWhiteEdgeMainFilter: true,
  matcherWhitePlateMainFilter: true,
  matcherMainFilterAllReset: true,
  matcherQuickFilterIntersection: true,
  manualOnlyExclusionSummary: true,
  matcherExpandedVisualFilters: true,
  matcherEvidenceConservativeExclusion: true,
  countryPanelEvidenceSources: true,
  selectedCountryLocalFlags: true,
  philippineConcreteSlabs: true,
  versionedDismissibleUpdateNotice: true,
  matcherResetPreservesSelection: true,
}, null, 2));
