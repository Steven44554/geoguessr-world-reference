const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const initialCountryPanelMarkup = html.match(/<aside\b[^>]*id=["']countryPanel["'][^>]*>([\s\S]*?)<\/aside>/i)?.[1] || "";

async function main() {

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

  get className() {
    return this.attributes.class || "";
  }

  set className(nextValue) {
    this.setAttribute("class", nextValue);
  }

  setAttribute(name, value) {
    const stringValue = String(value);
    this.attributes[name] = stringValue;
    if (name === "id") this.id = stringValue;
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

  append(...children) {
    children.forEach((child) => this.appendChild(child));
  }

  replaceChildren(...children) {
    this.children = [];
    children.forEach((child) => this.appendChild(child));
  }

  get childElementCount() {
    return this.children.length;
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

  matches(selector) {
    return String(selector).split(",").some((selectorPart) => {
      const part = selectorPart.trim();
      if (!part || /\s/.test(part)) return false;
      const tagName = part.match(/^[a-z][a-z0-9-]*/i)?.[0];
      if (tagName && this.tagName.toLowerCase() !== tagName.toLowerCase()) return false;
      const idMatches = [...part.matchAll(/#([a-z0-9_-]+)/gi)];
      if (idMatches.some((match) => this.id !== match[1])) return false;
      const classMatches = [...part.matchAll(/\.([a-z0-9_-]+)/gi)];
      if (classMatches.some((match) => !this.classList.contains(match[1]))) return false;
      const attributeMatches = [...part.matchAll(/\[([a-z0-9_-]+)(?:=(?:"([^"]*)"|'([^']*)'))?\]/gi)];
      for (const match of attributeMatches) {
        const [, attributeName, doubleQuotedValue, singleQuotedValue] = match;
        let actualValue = this.getAttribute(attributeName);
        if (actualValue === null && attributeName.startsWith("data-")) {
          const dataKey = attributeName.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
          actualValue = this.dataset[dataKey] ?? null;
        }
        if (actualValue === null) return false;
        const expectedValue = doubleQuotedValue ?? singleQuotedValue;
        if (expectedValue !== undefined && actualValue !== expectedValue) return false;
      }
      return true;
    });
  }

  closest(selector) {
    let node = this;
    while (node) {
      if (node.matches(selector)) return node;
      node = node.parentNode;
    }
    return null;
  }

  querySelectorAll(selector) {
    const results = [];
    const visit = (node) => {
      if (node.matches(selector)) results.push(node);
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
  contains(node) {
    let current = node;
    while (current) {
      if (current === this) return true;
      current = current.parentNode;
    }
    return false;
  }
  focus() {
    document.activeElement = this;
  }
}

const requiredIds = [
  "worldMap", "mapViewport", "graticule", "countryClipPaths", "countryPaths", "roadLineOverlays", "countryBorders",
  "smallCountryMarkers", "mapTooltip", "countryPanel", "searchInput", "searchSummary", "filters",
  "filterDashboard", "filterPanel", "filterResultCount", "activeFilterCount", "activeFilterSummary", "filterScrollHint", "filterCategoryPosition",
  "filterTabBasis", "filterTabRoad", "filterTabScene", "filterTabObjects", "filterTabCamera",
  "filterPanelBasis", "filterPanelRoad", "filterPanelScene", "filterPanelObjects", "filterPanelCamera",
  "zoomIn", "zoomOut", "resetZoom",
  "matcherButton", "roadMatcher", "roadScreenshot", "matcherPreview", "matcherPreviewImage", "removeScreenshot",
  "stopOnlyFilterChip", "stopOtherFilterChip", "yellowCenterFilterChip", "whiteCenterFilterChip", "yellowEdgeFilterChip", "whiteEdgeFilterChip", "whitePlateFilterChip", "allFilterChip", "leftTrafficFilterChip", "rightTrafficFilterChip",
  "yellowDiamondFilterChip",
  "carMetaFilters", "roofRackFilterChip", "mirrorFilterChip", "snorkelFilterChip", "equipmentFilterChip", "tapeFilterChip",
  "motorcycleFilterChip", "trekkerFilterChip", "boatFilterChip",
  "aiHelperCard", "aiHelperStatus", "analyzeScreenshotButton", "resetAiAnalysisButton", "aiAnalysisResult", "downloadAiHelper",
  "updateNotice", "dismissUpdateNotice", "updateNoticeHeading", "updateNoticeText", "updateNoticeTime",
];
const nodesById = new Map(requiredIds.map((id) => [id, new TestNode("div", id)]));
nodesById.get("countryPanel").innerHTML = initialCountryPanelMarkup;
nodesById.get("roadMatcher").hidden = true;
nodesById.get("roadMatcher").setAttribute("aria-hidden", "true");
nodesById.get("matcherButton").setAttribute("aria-expanded", "false");
nodesById.get("matcherPreview").hidden = true;
nodesById.get("roadScreenshot").type = "file";
nodesById.get("analyzeScreenshotButton").disabled = true;
nodesById.get("resetAiAnalysisButton").disabled = true;
nodesById.get("aiAnalysisResult").hidden = true;
nodesById.get("aiHelperStatus").dataset.state = "unknown";
nodesById.get("updateNotice").hidden = true;
nodesById.get("updateNotice").dataset.updateId = "2026-08-16-variable-strassenmarkierungen-v7";
nodesById.get("updateNotice").dataset.publishedAt = "2026-08-16T19:18:00+02:00";
const filterDashboardNode = nodesById.get("filterDashboard");
const filterPanelNode = nodesById.get("filterPanel");
filterPanelNode.hidden = false;
nodesById.get("filterResultCount").textContent = "206 Treffer";
nodesById.get("activeFilterCount").textContent = "0";
nodesById.get("activeFilterSummary").textContent = "Keine Filter aktiv";
nodesById.get("activeFilterSummary").setAttribute("role", "status");
nodesById.get("activeFilterSummary").setAttribute("aria-live", "polite");
nodesById.get("activeFilterSummary").setAttribute("aria-atomic", "true");
filterDashboardNode.append(
  nodesById.get("filterResultCount"),
  nodesById.get("activeFilterCount"),
  nodesById.get("activeFilterSummary"),
  nodesById.get("allFilterChip"),
  filterPanelNode,
);
const filtersNode = nodesById.get("filters");
filterPanelNode.appendChild(filtersNode);
const filterCategories = ["Basis", "Road", "Scene", "Objects", "Camera"];
for (const [index, name] of filterCategories.entries()) {
  const key = name.toLowerCase();
  const tab = nodesById.get(`filterTab${name}`);
  const panel = nodesById.get(`filterPanel${name}`);
  tab.tagName = "button";
  tab.setAttribute("data-filter-tab", key);
  tab.setAttribute("aria-selected", String(index === 0));
  tab.classList.toggle("active", index === 0);
  panel.setAttribute("data-filter-panel", key);
  panel.hidden = index !== 0;
  filterPanelNode.appendChild(tab);
  filtersNode.appendChild(panel);
}
nodesById.get("filterScrollHint").textContent = "Mausrad oder Touchpad: Kategorie wechseln";
nodesById.get("filterScrollHint").appendChild(nodesById.get("filterCategoryPosition"));
filtersNode.appendChild(nodesById.get("filterScrollHint"));
const allFilterChipNode = nodesById.get("allFilterChip");
allFilterChipNode.tagName = "button";
allFilterChipNode.setAttribute("type", "button");
allFilterChipNode.textContent = "Filter löschen";
allFilterChipNode.disabled = true;

function configureMatcherFilterChip(id, dataKey, panelName = "Road") {
  const chip = nodesById.get(id);
  chip.tagName = "button";
  chip.classList.add("filter-chip");
  chip.setAttribute(`data-${dataKey.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`, "");
  chip.setAttribute("aria-pressed", "false");
  nodesById.get(`filterPanel${panelName}`).appendChild(chip);
  return chip;
}

configureMatcherFilterChip("stopOnlyFilterChip", "matcherStopOnly");
configureMatcherFilterChip("stopOtherFilterChip", "matcherStopOther");
configureMatcherFilterChip("whiteEdgeFilterChip", "matcherEdgeWhite");
configureMatcherFilterChip("whitePlateFilterChip", "matcherPlateWhite");
nodesById.get("stopOnlyFilterChip").textContent = "STOP: nur STOP";
nodesById.get("stopOtherFilterChip").textContent = "STOP: anderer Text";
nodesById.get("whiteEdgeFilterChip").textContent = "Weiße Randlinie";
nodesById.get("whitePlateFilterChip").textContent = "Weiße Kennzeichen";
for (const [id, criterion, value, label] of [
  ["yellowCenterFilterChip", "centerColor", "yellow", "Gelbe Mittellinie"],
  ["whiteCenterFilterChip", "centerColor", "white", "Weiße Mittellinie"],
  ["yellowEdgeFilterChip", "edgeColor", "yellow", "Gelbe Randlinie"],
]) {
  const chip = nodesById.get(id);
  chip.tagName = "button";
  chip.classList.add("filter-chip");
  chip.setAttribute("data-quick-criterion", criterion);
  chip.setAttribute("data-quick-value", value);
  chip.setAttribute("aria-pressed", "false");
  chip.textContent = label;
  nodesById.get("filterPanelRoad").appendChild(chip);
}
const yellowDiamondFilterChipNode = nodesById.get("yellowDiamondFilterChip");
yellowDiamondFilterChipNode.tagName = "button";
yellowDiamondFilterChipNode.classList.add("filter-chip");
yellowDiamondFilterChipNode.setAttribute("data-quick-criterion", "warningSign");
yellowDiamondFilterChipNode.setAttribute("data-quick-value", "diamond-yellow");
yellowDiamondFilterChipNode.setAttribute("aria-pressed", "false");
yellowDiamondFilterChipNode.textContent = "Gelbes Rautenschild";
nodesById.get("filterPanelRoad").appendChild(yellowDiamondFilterChipNode);
const leftTrafficFilterChipNode = nodesById.get("leftTrafficFilterChip");
leftTrafficFilterChipNode.tagName = "button";
leftTrafficFilterChipNode.classList.add("filter-chip");
leftTrafficFilterChipNode.setAttribute("data-filter", "traffic:left");
leftTrafficFilterChipNode.setAttribute("aria-pressed", "false");
leftTrafficFilterChipNode.textContent = "Linksverkehr";
nodesById.get("filterPanelBasis").appendChild(leftTrafficFilterChipNode);
const rightTrafficFilterChipNode = nodesById.get("rightTrafficFilterChip");
rightTrafficFilterChipNode.tagName = "button";
rightTrafficFilterChipNode.classList.add("filter-chip");
rightTrafficFilterChipNode.setAttribute("data-filter", "traffic:right");
rightTrafficFilterChipNode.setAttribute("aria-pressed", "false");
rightTrafficFilterChipNode.textContent = "Rechtsverkehr";
nodesById.get("filterPanelBasis").appendChild(rightTrafficFilterChipNode);
const carMetaFiltersNode = nodesById.get("carMetaFilters");
nodesById.get("filterPanelCamera").appendChild(carMetaFiltersNode);
for (const [id, dataKey, value, label] of [
  ["roofRackFilterChip", "captureFeature", "roof-rack", "Dachträger"],
  ["mirrorFilterChip", "captureFeature", "mirrors", "Spiegel"],
  ["snorkelFilterChip", "captureFeature", "snorkel", "Schnorchel"],
  ["equipmentFilterChip", "captureFeature", "equipment", "Zelt / Gepäck"],
  ["tapeFilterChip", "captureFeature", "tape", "Klebeband"],
  ["motorcycleFilterChip", "captureType", "motorcycle", "Motorrad"],
  ["trekkerFilterChip", "captureType", "trekker", "Trekker"],
  ["boatFilterChip", "captureType", "boat", "Boot"],
]) {
  const chip = nodesById.get(id);
  chip.tagName = "button";
  chip.classList.add("filter-chip");
  chip.setAttribute(`data-${dataKey.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`, value);
  chip.setAttribute("aria-pressed", "false");
  chip.textContent = label;
  carMetaFiltersNode.appendChild(chip);
}
const documentListeners = {};
const document = {
  activeElement: null,
  getElementById: (id) => nodesById.get(id) || null,
  createElement: (name) => new TestNode(name),
  createElementNS: (_namespace, name) => new TestNode(name),
  createDocumentFragment: () => new TestNode("fragment"),
  createTextNode: (value) => {
    const node = new TestNode("#text");
    node.textContent = String(value ?? "");
    return node;
  },
  querySelectorAll: () => [],
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
class TestFileReader {
  constructor() {
    this.listeners = {};
    this.result = null;
  }

  addEventListener(type, handler) {
    (this.listeners[type] ||= []).push(handler);
  }

  readAsDataURL(file) {
    this.result = file?.dataUrl || `data:${file?.type || "application/octet-stream"};base64,VEVTVA==`;
    Promise.resolve().then(() => (this.listeners.load || []).forEach((handler) => handler({ type: "load", target: this })));
  }
}

const helperRequests = [];
let helperOnline = true;
let deferredAnalysisResponse = null;
let nextAnalysisPayload = {
  ok: true,
  model: "smoke-test-vision",
  appliedFilterContext: { version: 1, activeFilters: [] },
  observations: {},
  summary: "Testanalyse ohne echte Netzwerkanfrage.",
  countryAnalysis: {
    summary: "Das gesamte Straßenbild wurde ausgewertet.",
    imageClues: [],
    bestGuess: {
      iso3: "NLD",
      country: "Niederlande",
      confidence: 0.67,
      reasons: ["Der stärkste verbleibende Kandidat."],
      evidence: ["Gesamteindruck"],
      evidenceCategories: ["landscape"],
    },
    likely: [],
    possible: [],
    excluded: [],
  },
  warnings: [],
};

function helperResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(payload),
  };
}

function deferNextAnalysisResponse() {
  let resolveResponse;
  const promise = new Promise((resolve) => {
    resolveResponse = resolve;
  });
  deferredAnalysisResponse = promise;
  return {
    resolve(payload = nextAnalysisPayload) {
      resolveResponse(helperResponse(payload));
    },
  };
}

async function fetchMock(url, options = {}) {
  helperRequests.push({ url: String(url), options });
  if (!helperOnline) throw new TypeError("Failed to fetch local helper");
  if (String(url) === "http://127.0.0.1:43117/health") {
    return helperResponse({ ok: true, groqConfigured: true, capabilities: { bestGuess: true, filterContextVersion: 1 } });
  }
  if (String(url) === "http://127.0.0.1:43117/analyze") {
    if (deferredAnalysisResponse) {
      const pendingResponse = deferredAnalysisResponse;
      deferredAnalysisResponse = null;
      return pendingResponse;
    }
    return helperResponse(nextAnalysisPayload);
  }
  throw new Error(`Unexpected network target in smoke test: ${url}`);
}

const windowObject = { innerWidth: 1600, innerHeight: 900, setTimeout, clearTimeout, URL: urlObject };
const context = {
  window: windowObject,
  document,
  localStorage,
  console,
  setTimeout,
  clearTimeout,
  URL: urlObject,
  fetch: fetchMock,
  FileReader: TestFileReader,
  AbortController,
  TypeError,
};
vm.createContext(context);
for (const relativePath of ["data/world-map.js", "data/countries.js", "script.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, relativePath), "utf8"), context, { filename: relativePath });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function settleAsync(turns = 4) {
  for (let index = 0; index < turns; index += 1) await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function nodeText(node) {
  if (!node) return "";
  return [node.textContent || "", ...node.children.map(nodeText)].join(" ").replace(/\s+/g, " ").trim();
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

function clickFilter(id) {
  clickWithBubble(id, "filterDashboard");
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
assert(/16\. August 2026/.test(nodesById.get("updateNoticeTime").textContent) && /19:18/.test(nodesById.get("updateNoticeTime").textContent), "Update notice must format its current Luxembourg publication date and time");
document.dispatchEvent({ type: "keydown", key: "Escape" });
assert(updateNotice.hidden === true, "Escape must dismiss a visible update notice");
assert(stored.get("geoguessr-atlas-seen-update-id") === updateNoticeId, "Dismissing the update notice must persist the current version ID");
stored.delete("geoguessr-atlas-seen-update-id");
updateNotice.hidden = false;
fire("dismissUpdateNotice", "click");
assert(updateNotice.hidden === true, "Clicking the update notice button must dismiss the popup");
assert(stored.get("geoguessr-atlas-seen-update-id") === updateNoticeId, "Click dismissal must persist the current update version");

const filterPanel = nodesById.get("filterPanel");
const basisTab = nodesById.get("filterTabBasis");
const roadTab = nodesById.get("filterTabRoad");
const sceneTab = nodesById.get("filterTabScene");
assert(!filterPanel.hidden && basisTab.getAttribute("aria-selected") === "true" && !nodesById.get("filterPanelBasis").hidden, "Persistent filter dashboard must start with its Basis category visible");
nodesById.get("leftTrafficFilterChip").focus();
let wheelPrevented = 0;
fire("filters", "wheel", { target: nodesById.get("filterPanelBasis"), deltaX: 0, deltaY: 24, deltaMode: 0, timeStamp: 1000, preventDefault() { wheelPrevented += 1; } });
assert(basisTab.getAttribute("aria-selected") === "true" && wheelPrevented === 1, "A small touchpad delta must be accumulated without skipping the Basis category");
fire("filters", "wheel", { target: nodesById.get("filterPanelBasis"), deltaX: 0, deltaY: 24, deltaMode: 0, timeStamp: 1010, preventDefault() { wheelPrevented += 1; } });
assert(roadTab.getAttribute("aria-selected") === "true" && nodesById.get("filterCategoryPosition").textContent === "2 / 5", "One downward wheel gesture must move from Basis to Straße");
assert(document.activeElement === roadTab, "Wheel switching must rescue focus from a filter chip before its old panel becomes hidden");
fire("filters", "wheel", { target: nodesById.get("filterPanelRoad"), deltaX: 0, deltaY: 120, deltaMode: 0, timeStamp: 1050, preventDefault() { wheelPrevented += 1; } });
assert(roadTab.getAttribute("aria-selected") === "true", "Momentum from the same wheel gesture must not skip multiple filter categories");
fire("filters", "wheel", { target: nodesById.get("filterPanelRoad"), deltaX: 0, deltaY: 120, deltaMode: 0, timeStamp: 1300, preventDefault() { wheelPrevented += 1; } });
assert(sceneTab.getAttribute("aria-selected") === "true" && document.activeElement === sceneTab, "A separate downward wheel gesture must advance to Umgebung and keep tab focus synchronized");
fire("filters", "wheel", { target: nodesById.get("filterPanelScene"), deltaX: 0, deltaY: -120, deltaMode: 0, timeStamp: 1600, preventDefault() { wheelPrevented += 1; } });
assert(roadTab.getAttribute("aria-selected") === "true", "An upward wheel gesture must move exactly one category back");
fire("filters", "wheel", { target: nodesById.get("filterPanelRoad"), deltaX: 0, deltaY: -120, deltaMode: 0, timeStamp: 1900, preventDefault() { wheelPrevented += 1; } });
let outerBoundaryPrevented = false;
fire("filters", "wheel", { target: nodesById.get("filterPanelBasis"), deltaX: 0, deltaY: -120, deltaMode: 0, timeStamp: 2200, preventDefault() { outerBoundaryPrevented = true; } });
assert(basisTab.getAttribute("aria-selected") === "true" && !outerBoundaryPrevented, "Scrolling upward at Basis must leave normal page scrolling available");
fire("filters", "wheel", { target: nodesById.get("filterPanelBasis"), deltaX: 100, deltaY: 12, deltaMode: 0, timeStamp: 2500, preventDefault() { throw new Error("Horizontal wheel movement must not be captured"); } });
fire("filters", "wheel", { target: nodesById.get("filterPanelBasis"), deltaX: 0, deltaY: 120, deltaMode: 0, timeStamp: 2800, ctrlKey: true, preventDefault() { throw new Error("Touchpad pinch zoom must not be captured"); } });
assert(basisTab.getAttribute("aria-selected") === "true", "Horizontal scrolling and touchpad pinch zoom must leave the filter category unchanged");
clickWithBubble("filterTabRoad", "filterDashboard");
assert(roadTab.getAttribute("aria-selected") === "true" && !nodesById.get("filterPanelRoad").hidden && nodesById.get("filterPanelBasis").hidden, "Clicking a category tab must reveal only its associated filter panel");
fire("filterDashboard", "keydown", { target: roadTab, key: "ArrowDown" });
assert(sceneTab.getAttribute("aria-selected") === "true" && !nodesById.get("filterPanelScene").hidden, "Arrow keys must move between filter categories");
assert(document.activeElement === sceneTab, "Keyboard category navigation must move focus with the selected tab");
fire("filterDashboard", "keydown", { target: sceneTab, key: "ArrowUp" });
assert(roadTab.getAttribute("aria-selected") === "true" && document.activeElement === roadTab, "Vertical arrow keys must match the desktop tab orientation in both directions");
clickWithBubble("filterTabBasis", "filterDashboard");

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
assert(/Karte/i.test(initialPanel) && !/Länderbrowser/i.test(initialPanel), "Country panel must explain map selection without the removed country browser");
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

countryShape("JPN").listeners.click[0]();
assertPanelCountry("JPN", "Japan");
assert(countryShape("JPN").classList.contains("is-selected"), "Country selected on the map must be highlighted");
const japanPanelMarkup = nodesById.get("countryPanel").innerHTML;
assert(/Datenqualität und Quellen/.test(japanPanelMarkup), "Selected-country panel must expose data quality and sources");
assert(/Zuverlässigkeit/.test(japanPanelMarkup) && /Quelle 1/.test(japanPanelMarkup), "Country data-quality panel must label confidence and at least one source");
assert(/target="_blank" rel="noopener noreferrer"/.test(japanPanelMarkup), "Country source links must open safely in a new tab");
assert((japanPanelMarkup.match(/class="country-flag"/g) || []).length === 1 && /aria-label="Flagge von Japan"/.test(japanPanelMarkup), "Japan's selected-country profile must show exactly one prominent accessible flag");
assert(/src="assets\/flags\/4x3\/jp\.svg"/.test(japanPanelMarkup), "Japan's selected-country profile must use its local SVG flag");
assert(!netherlandsPath.classList.contains("is-selected"), "Previous map selection must be cleared after browser selection");

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

  const searchInput = nodesById.get("searchInput");
  searchInput.value = "Vientiane";
  fire("searchInput", "input");
  assert(!countryShape("LAO").classList.contains("is-dimmed") && countryShape("GTM").classList.contains("is-dimmed"), "Country search must index regional Google-car meta such as Laos's Vientiane variant");
  searchInput.value = "";
  fire("searchInput", "input");
  countryShape("LAO").listeners.click[0]();
  const laosPanelMarkup = nodesById.get("countryPanel").innerHTML;
  assert(/(?:GOOGLE-CAR|FAHRZEUG)[^<]{0,40}(?:META|AUFNAHME)/i.test(laosPanelMarkup), "Selected-country panel must visibly expose Google-car and capture meta");
  assert(/Dachträger/.test(laosPanelMarkup) && /Seitenspiegel/.test(laosPanelMarkup) && /Vientiane/.test(laosPanelMarkup), "Laos panel must show the documented roof-rack and mirror variant plus its capital exception");
  assert(/https:\/\/www\.plonkit\.net\/laos/.test(laosPanelMarkup) && /target="_blank" rel="noopener noreferrer"/.test(laosPanelMarkup), "Laos capture-meta source must be rendered as a safe external link");

  {
  const matcherStart = html.indexOf('<section id="roadMatcher"');
  const matcherEnd = html.indexOf('<div class="map-card"', matcherStart);
  const matcherMarkup = html.slice(matcherStart, matcherEnd);
  assert(matcherStart >= 0 && matcherEnd > matcherStart, "AI-only screenshot area must exist in the HTML");
  assert(!/<select\b/i.test(matcherMarkup), "AI-only screenshot area must not expose manual matcher selects");
  assert(!/type=["']checkbox["']/i.test(matcherMarkup), "AI-only screenshot area must not expose manual matcher checkboxes");
  assert((matcherMarkup.match(/<input\b/gi) || []).length === 1 && /id=["']roadScreenshot["'][^>]*type=["']file["']/i.test(matcherMarkup), "AI-only screenshot area must contain only its image-file input");
  assert(/id=["']analyzeScreenshotButton["']/.test(matcherMarkup) && /id=["']resetAiAnalysisButton["']/.test(matcherMarkup), "AI-only screenshot area must expose analyze and reset actions");
  for (const removedId of ["matcherTraffic", "matcherCenterColor", "matcherEdgeColor", "matcherPlateColor", "matcherStopOnly", "matcherStopOther"]) {
    assert(!nodesById.has(removedId), `${removedId} must not be synthesized by the smoke-test DOM`);
  }

  const matcherPanel = nodesById.get("roadMatcher");
  const allChip = nodesById.get("allFilterChip");
  const stopOnlyChip = nodesById.get("stopOnlyFilterChip");
  const stopOtherChip = nodesById.get("stopOtherFilterChip");
    const whiteEdgeChip = nodesById.get("whiteEdgeFilterChip");
    const whitePlateChip = nodesById.get("whitePlateFilterChip");
    const lineChips = [
      nodesById.get("yellowCenterFilterChip"), nodesById.get("whiteCenterFilterChip"),
      nodesById.get("yellowEdgeFilterChip"), whiteEdgeChip,
    ];
    const mainChips = [stopOnlyChip, stopOtherChip, ...lineChips, whitePlateChip];
    const carFeatureChips = [
      nodesById.get("roofRackFilterChip"), nodesById.get("mirrorFilterChip"), nodesById.get("snorkelFilterChip"),
      nodesById.get("equipmentFilterChip"), nodesById.get("tapeFilterChip"),
    ];
    const captureTypeChips = [
      nodesById.get("motorcycleFilterChip"), nodesById.get("trekkerFilterChip"), nodesById.get("boatFilterChip"),
    ];
    const carMetaChips = [...carFeatureChips, ...captureTypeChips];
    const evidenceChips = [yellowDiamondFilterChipNode];
    const allQuickChips = [...mainChips, ...carMetaChips, ...evidenceChips];

    allQuickChips.forEach((chip) => {
      assert(chip.getAttribute("aria-pressed") === "false" && !chip.classList.contains("active"), "Main clue and Google-car chips must start inactive");
  });
  assert(allChip.getAttribute("aria-pressed") === null && !allChip.classList.contains("active"), "Everything-reset control must remain an action rather than a selected filter");
  assert(allChip.disabled, "Everything-reset control must start disabled without active filters");
  assert(/^0(?:\D|$)/.test(nodeText(nodesById.get("activeFilterCount"))), "Combined active-filter count must start at zero");
  assert(/(?:keine|0)[^.!?]{0,30}Filter/i.test(nodeText(nodesById.get("activeFilterSummary"))), "Active-filter summary must announce the empty selection");

  for (const filterId of ["yellowCenterFilterChip", "whiteCenterFilterChip", "yellowEdgeFilterChip", "whiteEdgeFilterChip"]) {
    clickFilter(filterId);
    const russiaShape = countryShape("RUS");
    assert(
      !russiaShape.classList.contains("is-dimmed")
        && russiaShape.classList.contains("is-matcher-possible")
        && !russiaShape.classList.contains("is-matcher-excluded"),
      `Russia must remain a possible candidate for ${nodesById.get(filterId).textContent}`,
    );
    clickFilter("allFilterChip");
  }

  clickFilter("yellowCenterFilterChip");
  clickFilter("whiteCenterFilterChip");
  assert(
    !nodesById.get("yellowCenterFilterChip").classList.contains("active")
      && nodesById.get("whiteCenterFilterChip").classList.contains("active"),
    "Selecting a white center line must replace the yellow center-line color",
  );
  clickFilter("yellowEdgeFilterChip");
  clickFilter("whiteEdgeFilterChip");
  assert(
    !nodesById.get("yellowEdgeFilterChip").classList.contains("active")
      && nodesById.get("whiteEdgeFilterChip").classList.contains("active"),
    "Selecting a white edge line must replace the yellow edge-line color",
  );
  assert(/^2(?:\D|$)/.test(nodeText(nodesById.get("activeFilterCount"))), "Center and edge colors must count as two independent positions");
  clickFilter("allFilterChip");

  for (const [filterId, isoCodes] of [
    ["yellowCenterFilterChip", ["FIN", "URY", "NZL", "IDN", "JPN", "PHL", "ARG", "CHL", "TUR"]],
    ["whiteCenterFilterChip", ["FIN", "URY", "NZL", "IDN", "JPN", "PHL", "ARG", "CHL", "TUR"]],
    ["yellowEdgeFilterChip", ["USA", "GRC", "CHL", "TUR"]],
    ["whiteEdgeFilterChip", ["USA", "GRC", "CHL", "TUR"]],
  ]) {
    clickFilter(filterId);
    for (const iso3 of isoCodes) {
      const shape = countryShape(iso3);
      assert(
        !shape.classList.contains("is-dimmed")
          && shape.classList.contains("is-matcher-possible")
          && !shape.classList.contains("is-matcher-excluded"),
        `${iso3} must remain possible for its documented variable line color`,
      );
    }
    clickFilter("allFilterChip");
  }

  clickFilter("yellowCenterFilterChip");
  assert(countryShape("DEU").classList.contains("is-matcher-excluded"), "A sourced stable country must still be excluded by an incompatible line color");
  clickFilter("leftTrafficFilterChip");
  assert(countryShape("RUS").classList.contains("is-dimmed"), "An incompatible traffic-side filter must still exclude Russia despite variable road markings");
  clickFilter("rightTrafficFilterChip");
  assert(!countryShape("RUS").classList.contains("is-dimmed") && countryShape("RUS").classList.contains("is-matcher-possible"), "A compatible non-road filter must keep Russia possible without upgrading the variable line to a certain match");
  clickFilter("allFilterChip");

  clickFilter("yellowEdgeFilterChip");
  clickFilter("yellowCenterFilterChip");
  assert(countryShape("USA").classList.contains("is-matcher-possible"), "A documented yellow US edge plus its yellow center must remain possible");
  clickFilter("whiteCenterFilterChip");
  assert(countryShape("USA").classList.contains("is-matcher-excluded"), "A variable US edge must not neutralize an incompatible center-line color");
  clickFilter("allFilterChip");

  clickFilter("yellowEdgeFilterChip");
  clickFilter("stopOnlyFilterChip");
  assert(countryShape("USA").classList.contains("is-matcher-possible"), "A matching STOP filter must keep the variable US edge possible rather than certain");
  clickFilter("stopOtherFilterChip");
  assert(countryShape("USA").classList.contains("is-matcher-excluded"), "An incompatible independent quick filter must still exclude a country with variable road lines");
  clickFilter("allFilterChip");

  clickFilter("leftTrafficFilterChip");
  clickFilter("whiteEdgeFilterChip");
  clickFilter("roofRackFilterChip");
  assert(/^3(?:\D|$)/.test(nodeText(nodesById.get("activeFilterCount"))), "Combined active-filter count must include standard, quick-clue, and Google-car filters exactly once");
  assert(!allChip.disabled, "Everything-reset control must become available as soon as a filter is selected");
  const mixedFilterSummary = nodeText(nodesById.get("activeFilterSummary"));
  assert(/Linksverkehr/i.test(mixedFilterSummary) && /Weiße Randlinie/i.test(mixedFilterSummary) && /Dachträger/i.test(mixedFilterSummary), "Active-filter summary must name selections from all three filter systems");
  assert(nodesById.get("activeFilterSummary").getAttribute("aria-live") === "polite", "Combined filter changes must remain available through the polite live summary");
  clickFilter("allFilterChip");
  assert(/^0(?:\D|$)/.test(nodeText(nodesById.get("activeFilterCount"))) && /(?:keine|0)[^.!?]{0,30}Filter/i.test(nodeText(nodesById.get("activeFilterSummary"))), "Everything-reset action must clear the combined count and summary");
  assert(allChip.disabled, "Everything-reset control must disable itself again after clearing every filter");
  assert(!leftTrafficFilterChipNode.classList.contains("active") && leftTrafficFilterChipNode.getAttribute("aria-pressed") === "false", "Everything-reset action must clear standard country filters too");

  clickFilter("stopOnlyFilterChip");
  assert(stopOnlyChip.classList.contains("active") && stopOnlyChip.getAttribute("aria-pressed") === "true", "STOP-only main filter must activate independently");
  assert(!stopOtherChip.classList.contains("active"), "STOP-only must keep the opposite STOP-text filter inactive");
  assert(hasMatcherResultClass(countryShape("USA")) && !countryShape("USA").classList.contains("is-matcher-excluded"), "STOP-only must retain a country whose sign contains only STOP");
  assert(countryShape("MEX").classList.contains("is-matcher-excluded") && countryShape("JPN").classList.contains("is-matcher-excluded"), "STOP-only must exclude sourced non-STOP sign texts");
  assert(!countryShape("ATA").classList.contains("is-matcher-excluded"), "Unknown STOP-sign data must stay possible");
  clickFilter("stopOnlyFilterChip");

  clickFilter("stopOtherFilterChip");
  assert(stopOtherChip.classList.contains("active") && !stopOnlyChip.classList.contains("active"), "Other STOP text must activate independently and remain mutually exclusive with STOP-only");
  assert(hasMatcherResultClass(countryShape("MEX")) && hasMatcherResultClass(countryShape("JPN")), "Other STOP text must retain sourced ALTO and non-Latin examples");
  assert(countryShape("USA").classList.contains("is-matcher-excluded"), "Other STOP text must exclude a sourced STOP-only country");
  clickFilter("stopOtherFilterChip");

  clickFilter("yellowDiamondFilterChip");
  assert(yellowDiamondFilterChipNode.classList.contains("active") && hasMatcherResultClass(countryShape("USA")), "Yellow-diamond warning-sign filter must retain a sourced matching country");
  assert(countryShape("DEU").classList.contains("is-matcher-excluded"), "Yellow-diamond warning-sign filter must exclude a sourced white-triangle country");
  assert(countryShape("ATA").classList.contains("is-matcher-possible") && !countryShape("ATA").classList.contains("is-matcher-excluded"), "Unknown warning-sign data must remain possible");
  clickFilter("yellowDiamondFilterChip");

  clickFilter("whiteEdgeFilterChip");
  assert(whiteEdgeChip.classList.contains("active") && hasMatcherResultClass(countryShape("USA")), "White edge-line filter must work without a screenshot matcher form");
  assert(countryShape("ZAF").classList.contains("is-matcher-excluded") && countryShape("BWA").classList.contains("is-matcher-excluded"), "White edge lines must exclude sourced yellow-edge examples");
  clickFilter("whiteEdgeFilterChip");

  clickFilter("whitePlateFilterChip");
  assert(whitePlateChip.classList.contains("active") && hasMatcherResultClass(countryShape("DEU")), "White-plate filter must work without a screenshot matcher form");
  assert(countryShape("NLD").classList.contains("is-matcher-excluded") && countryShape("LUX").classList.contains("is-matcher-excluded"), "White plates must exclude sourced yellow-plate countries");
    clickFilter("whitePlateFilterChip");

    clickFilter("roofRackFilterChip");
    assert(nodesById.get("roofRackFilterChip").classList.contains("active"), "Roof-rack filter must activate from the visible Google-car row");
    assert(countryShape("GTM").classList.contains("is-matcher-match") && countryShape("GHA").classList.contains("is-matcher-match"), "Roof-rack filter must strongly retain sourced Guatemala and Ghana variants");
    assert(countryShape("ATA").classList.contains("is-matcher-possible") && !countryShape("ATA").classList.contains("is-matcher-excluded"), "Countries without capture-meta data must stay possible instead of being falsely excluded");

    clickFilter("mirrorFilterChip");
    assert(countryShape("GTM").classList.contains("is-matcher-match") && countryShape("SEN").classList.contains("is-matcher-match"), "Roof-rack and mirror filters must match a single documented combined variant");
    assert(countryShape("DOM").classList.contains("is-matcher-possible") && !countryShape("DOM").classList.contains("is-matcher-match"), "A roof-rack-only or tape variant must not become a false exact roof-rack and mirror match");
    assert(countryShape("UGA").classList.contains("is-matcher-possible") && !countryShape("UGA").classList.contains("is-matcher-match"), "Separate mirror-only Uganda coverage must not satisfy a combined roof-rack and mirror observation");

    clickFilter("snorkelFilterChip");
    assert(countryShape("MNG").classList.contains("is-matcher-match"), "Mongolia must match the sourced roof-rack, mirror, and snorkel combination");
    assert(countryShape("KEN").classList.contains("is-matcher-possible") && !countryShape("KEN").classList.contains("is-matcher-match"), "Kenya's roof-rack and snorkel variant must not invent a visible mirror");
    clickFilter("equipmentFilterChip");
    assert(countryShape("MNG").classList.contains("is-matcher-match"), "Visible equipment must combine with Mongolia's documented vehicle variant");

    clickFilter("allFilterChip");
    clickFilter("roofRackFilterChip");
    clickFilter("tapeFilterChip");
    assert(countryShape("DOM").classList.contains("is-matcher-match") && countryShape("GHA").classList.contains("is-matcher-match"), "Roof-rack and tape filters must retain the sourced Dominican and Ghanaian combinations");
    assert(countryShape("GTM").classList.contains("is-matcher-possible") && !countryShape("GTM").classList.contains("is-matcher-match"), "Guatemala's roof-rack and mirror variant must not invent tape");

    clickFilter("motorcycleFilterChip");
    assert(carFeatureChips.every((chip) => !chip.classList.contains("active") && chip.getAttribute("aria-pressed") === "false"), "Activating a capture type must clear incompatible car-equipment observations");
    assert(nodesById.get("motorcycleFilterChip").classList.contains("active") && countryShape("VNM").classList.contains("is-matcher-match"), "Motorcycle capture filter must strongly retain sourced Vietnam coverage");
    clickFilter("trekkerFilterChip");
    assert(!nodesById.get("motorcycleFilterChip").classList.contains("active") && nodesById.get("trekkerFilterChip").classList.contains("active"), "Trekker must replace the mutually exclusive motorcycle capture type");
    assert(countryShape("MDG").classList.contains("is-matcher-match") && countryShape("CRI").classList.contains("is-matcher-match"), "Trekker filter must retain sourced Madagascar and Costa Rica variants without claiming they are trekker-only");
    clickFilter("boatFilterChip");
    assert(!nodesById.get("trekkerFilterChip").classList.contains("active") && nodesById.get("boatFilterChip").classList.contains("active"), "Boat must replace the mutually exclusive trekker capture type");
    assert(countryShape("MDG").classList.contains("is-matcher-match") && countryMapNode("MLT").classList.contains("is-matcher-match"), "Boat filter must retain sourced Madagascar and Malta variants");
    clickFilter("snorkelFilterChip");
    assert(!nodesById.get("boatFilterChip").classList.contains("active") && nodesById.get("snorkelFilterChip").classList.contains("active"), "Activating car equipment must clear an incompatible capture type");
    assert(countryShape("KEN").classList.contains("is-matcher-match") && countryShape("MNG").classList.contains("is-matcher-match"), "Snorkel filter must retain the sourced Kenyan and Mongolian car variants");

    clickFilter("allFilterChip");
    clickFilter("stopOnlyFilterChip");
    clickFilter("whiteEdgeFilterChip");
    clickFilter("whitePlateFilterChip");
    clickFilter("equipmentFilterChip");
    clickFilter("allFilterChip");
    allQuickChips.forEach((chip) => {
      assert(!chip.classList.contains("active") && chip.getAttribute("aria-pressed") === "false", "All must reset every independent main clue and Google-car filter");
  });
  assert(allChip.getAttribute("aria-pressed") === null && !allChip.classList.contains("active"), "Everything-reset control must not masquerade as an active toggle after clearing filters");
  assert(/^0(?:\D|$)/.test(nodeText(nodesById.get("activeFilterCount"))), "Everything-reset action must restore the visible active-filter count to zero");
  allCountryMapNodes().forEach((node) => {
    assert(!node.classList.contains("is-matcher-match") && !node.classList.contains("is-matcher-possible") && !node.classList.contains("is-matcher-excluded"), "All must clear main-filter map classes");
  });

  if (matcherPanel.hidden && !matcherPanel.classList.contains("open")) fire("matcherButton", "click");
  assert(!matcherPanel.hidden || matcherPanel.classList.contains("open"), "Screenshot button must reveal the AI-only analysis area");
  await settleAsync();
  assert(nodesById.get("aiHelperStatus").dataset.state === "connected", "Opening the AI area must detect the mocked local helper");
  assert(nodesById.get("analyzeScreenshotButton").disabled, "AI analysis must remain disabled without a screenshot");

  const screenshotInput = nodesById.get("roadScreenshot");
  screenshotInput.files = [{
    name: "street-reference.png",
    type: "image/png",
    size: 4096,
    dataUrl: "data:image/png;base64,VEVTVF9TQ1JFRU5TSE9U",
  }];
  const analyzeRequestsBeforeSelection = helperRequests.filter((request) => request.url.endsWith("/analyze")).length;
  fire("roadScreenshot", "change");
  await settleAsync();
  const screenshotObjectUrl = nodesById.get("matcherPreviewImage").src;
  assert(screenshotObjectUrl.startsWith("blob:local-test/"), "Screenshot preview must use a local object URL");
  assert(!nodesById.get("matcherPreview").hidden, "Choosing a screenshot must reveal its local preview");
  assert(!nodesById.get("analyzeScreenshotButton").disabled, "A valid screenshot must enable AI analysis");
  assert(helperRequests.filter((request) => request.url.endsWith("/analyze")).length === analyzeRequestsBeforeSelection, "Selecting a screenshot must not send it before the deliberate AI click");

  clickFilter("rightTrafficFilterChip");
  clickFilter("whiteEdgeFilterChip");
  clickFilter("roofRackFilterChip");
  assert(/^3(?:\D|$)/.test(nodeText(nodesById.get("activeFilterCount"))), "The AI test must begin with three active filters from different groups");

  nextAnalysisPayload = {
    ok: true,
    model: "smoke-test-vision",
    appliedFilterContext: {
      version: 1,
      activeFilters: [
        { key: "traffic", value: "right" },
        { key: "edgeColor", value: "white" },
        { key: "vehicleFeature", value: "roof-rack" },
      ],
    },
    summary: "Das vollständige Straßenbild wurde gemeinsam ausgewertet.",
    observations: {},
    countryAnalysis: {
      summary: "Gelbe Kennzeichen, flache Landschaft und markante Leitpfosten sprechen für Nordwesteuropa.",
      bestGuess: {
        iso3: "NLD",
        country: "Niederlande",
        confidence: 0.91,
        reasons: ["Gelbe Kennzeichen und flache Landschaft passen gemeinsam am besten."],
        evidence: ["Gelbe Kennzeichen", "Entwässerungsgraben"],
        evidenceCategories: ["plates", "landscape"],
      },
      imageClues: [
        { category: "vegetation", observation: "Dichte grüne Wiesen und Laubbäume.", confidence: 0.88 },
        { category: "bollards", observation: "Weiße Leitpfosten mit schwarzem Feld.", confidence: 0.91 },
        { category: "landscape", observation: "Sehr flaches, entwässertes Gelände.", confidence: 0.86 },
        { category: "road", observation: "Schmale Asphaltstraße mit weißen Randlinien.", confidence: 0.84 },
        { category: "signs", observation: "Europäisches Dreieck-Warnschild.", confidence: 0.76 },
        { category: "plates", observation: "Gelbe Kennzeichen sind sichtbar.", confidence: 0.93 },
        { category: "vehicle-meta", observation: "Zwei Querstreben und ein Seitenspiegel sind am Aufnahmefahrzeug sichtbar.", confidence: 0.94 },
        { category: "magic", observation: "Dieses unbekannte Merkmal darf nicht erscheinen.", confidence: 1 },
        { category: "climate", observation: "Ungültige Konfidenz.", confidence: 4 },
      ],
      likely: [
        { iso3: "NLD", country: "Niederlande", confidence: 0.91, reasons: ["Gelbe Kennzeichen und flache Landschaft passen zusammen."], evidence: ["Gelbe Kennzeichen", "Entwässerungsgraben"], evidenceCategories: ["plates", "landscape"] },
        { iso3: "DEU", country: "Deutschland", confidence: 0.59, reasons: ["Leitpfosten wirken ähnlich."], evidence: ["Weiß-schwarzer Leitpfosten"], evidenceCategories: ["bollards"] },
        { iso3: "JPN", country: "Japan", confidence: 0.84, reasons: ["Ein Einzelhinweis war zunächst plausibel."], evidence: ["Leitpfosten"], evidenceCategories: ["bollards"] },
        { iso3: "ZZZ", country: "Atlantis", confidence: 0.99, reasons: ["Ungültiger Atlas-Code."], evidence: ["Nichts"], evidenceCategories: ["other"] },
        { iso3: "BEL", country: "Belgien", confidence: "hoch", reasons: ["Ungültiger Konfidenzwert."], evidence: ["Nichts"], evidenceCategories: ["other"] },
      ],
      possible: [
        { iso3: "BEL", country: "Belgien", confidence: 0.68, reasons: ["Grenzregion bleibt denkbar."], evidence: ["Flache Landschaft"], evidenceCategories: ["landscape"] },
        { iso3: "JPN", country: "Japan", confidence: 0.70, reasons: ["Die übrigen Hinweise widersprechen der ersten Einordnung."], evidence: ["Europäisches Warnschild"], evidenceCategories: ["signs"] },
      ],
      excluded: [
        { iso3: "ZAF", country: "Südafrika", confidence: 0.88, reasons: ["Kennzeichen- und Landschaftsbild widersprechen deutlich."], evidence: ["Gelbe europäische Kennzeichen", "Grüne Polderlandschaft"], evidenceCategories: ["vehicle-meta", "plates"] },
        { iso3: "BWA", country: "Botswana", confidence: 0.70, reasons: ["Die Landschaft wirkt untypisch."], evidence: ["Feuchte grüne Wiesen"], evidenceCategories: ["landscape"] },
        { iso3: "KEN", country: "Kenia", confidence: 0.97, reasons: ["Das Fahrzeugmeta wirke unpassend."], evidence: ["Kein Dachträger erkennbar"], evidenceCategories: ["vehicle-meta"] },
        { iso3: "BRA", country: "Brasilien", confidence: 0.96, reasons: ["Vegetation und Klima wirkten unpassend."], evidence: ["Trockene Vegetation"], evidenceCategories: ["vegetation", "climate"] },
        { iso3: "CAN", country: "Kanada", confidence: 0.95, reasons: ["Ausschluss ohne strukturierte Belegkategorie."], evidence: ["Unspezifischer Eindruck"], evidenceCategories: [] },
        { iso3: "ARG", country: "Argentinien", confidence: 0.94, reasons: ["Ausschluss mit unbekannter Kategorie."], evidence: ["Unbekannter Hinweis"], evidenceCategories: ["magic"] },
        { iso3: "AUS", country: "Australien", confidence: 0.93, reasons: ["Nur schwache Umgebungshinweise."], evidence: ["Flache Landschaft und Kameraartefakt"], evidenceCategories: ["landscape", "camera", "other"] },
        { iso3: "NO!", country: "Ungültig", confidence: 0.95, reasons: ["Ungültiger ISO-Code."], evidence: ["Nichts"], evidenceCategories: ["road"] },
      ],
    },
    warnings: ["Straßenschild im Hintergrund ist teilweise verdeckt."],
  };

  fire("analyzeScreenshotButton", "click");
  await settleAsync(10);
  const analysisRequests = helperRequests.filter((request) => request.url.endsWith("/analyze"));
  assert(analysisRequests.length === analyzeRequestsBeforeSelection + 1, "AI analysis must send exactly one request after the deliberate click");
  const analysisRequest = analysisRequests.at(-1);
  assert(analysisRequest.url === "http://127.0.0.1:43117/analyze", "AI screenshot must only be sent to the fixed loopback helper endpoint");
  assert(analysisRequest.options.method === "POST", "AI helper analysis must use POST");
  assert(analysisRequest.options.headers["X-GeoGuessr-Helper"] === "1", "AI helper analysis must send the required helper-identification header");
  assert(!/authorization|bearer|groq.?key|api.?key/i.test(JSON.stringify(analysisRequest.options.headers)), "Browser request headers must never contain a Groq credential");
  const analysisBody = JSON.parse(analysisRequest.options.body);
  assert(JSON.stringify(Object.keys(analysisBody).sort()) === JSON.stringify(["fileName", "filterContext", "imageDataUrl"]), "AI helper request body must contain the screenshot fields and the structured filter context only");
  assert(analysisBody.fileName === "street-reference.png" && analysisBody.imageDataUrl.startsWith("data:image/png;base64,"), "AI helper request must carry the selected image and safe file name");
  assert(analysisBody.filterContext?.version === 1 && Array.isArray(analysisBody.filterContext.activeFilters), "AI helper request must use version 1 of the structured active-filter snapshot");
  const sentFilterPairs = analysisBody.filterContext.activeFilters
    .map(({ key, value, ...unexpected }) => ({ key, value, unexpectedKeys: Object.keys(unexpected) }))
    .sort((left, right) => `${left.key}:${left.value}`.localeCompare(`${right.key}:${right.value}`));
  assert(sentFilterPairs.every((item) => item.unexpectedKeys.length === 0), "AI filter context must not leak free-form labels or unrelated UI data");
  assert(JSON.stringify(sentFilterPairs.map(({ key, value }) => ({ key, value }))) === JSON.stringify([
    { key: "edgeColor", value: "white" },
    { key: "traffic", value: "right" },
    { key: "vehicleFeature", value: "roof-rack" },
  ]), "AI helper request must carry all active filters as the documented key/value set, independent of DOM order");

  const aiResult = nodesById.get("aiAnalysisResult");
  const aiResultText = nodeText(aiResult);
  assert(aiResult.dataset.state === "success" && !aiResult.hidden, "Successful AI analysis must expose an accessible result");
  const bestGuessCards = aiResult.querySelectorAll(".ai-best-guess");
  assert(bestGuessCards.length === 1 && bestGuessCards[0].id === "aiBestGuess", "Every successful analysis must render exactly one prominent #aiBestGuess card");
  const bestGuessText = nodeText(bestGuessCards[0]);
  assert(/Niederlande/.test(bestGuessText) && /91\s*%/.test(bestGuessText), "Prominent best guess must show the chosen country and its confidence");
  assert(/Rechtsverkehr/i.test(aiResultText) && /Weiße Randlinie/i.test(aiResultText) && /Dachträger/i.test(aiResultText), "AI result must show local human-readable labels for the exact filter snapshot that was sent");
  assert(/Im Gesamtbild erkannte Hinweise/.test(aiResultText), "AI result must describe the screenshot as a whole image");
  assert(/Vegetation/.test(aiResultText) && /Leitpfosten \/ Bollards/.test(aiResultText) && /Landschaft/.test(aiResultText), "AI result must visibly cover vegetation, bollards, and landscape clues");
    assert(/Straße und Markierungen/.test(aiResultText) && /Verkehrsschilder/.test(aiResultText) && /Kennzeichen/.test(aiResultText), "AI result must also show road, sign, and plate clues");
    assert(/Google-Car \/ Fahrzeug-Meta/.test(aiResultText) && /Zwei Querstreben und ein Seitenspiegel/.test(aiResultText), "AI result must render the canonical vehicle-meta clue and its direct visual observation");
  assert(!/unbekannte Merkmal/.test(aiResultText) && !/Ungültige Konfidenz/.test(aiResultText), "Unknown clue categories and invalid clue confidence values must be ignored");
  assert(/Wahrscheinlich \/ einschließen/.test(aiResultText) && /Noch möglich/.test(aiResultText) && /Ausdrücklich ausgeschlossen/.test(aiResultText), "AI result must render all three direct country groups");
  assert(/Niederlande/.test(aiResultText) && /Gelbe Kennzeichen und flache Landschaft/.test(aiResultText) && /Sichtbar: Gelbe Kennzeichen/.test(aiResultText), "Likely-country card must show name, reason, and direct visual evidence");
  assert(!/Atlantis/.test(aiResultText) && !/Ungültig/.test(aiResultText), "Invalid ISO entries must not appear in direct country lists");
  assert(/3 ungültige oder unbekannte Ländereinträge wurden sicher ignoriert/.test(aiResultText), "Ignored country entries must be reported safely");
  assert(countryShape("NLD").classList.contains("is-ai-best-guess"), "The single best guess must receive its dedicated prominent map class");
  assert(countryShape("NLD").classList.contains("is-ai-likely") && countryShape("NLD").classList.contains("is-matcher-match"), "High-confidence likely country must receive the direct likely map class");
    for (const iso3 of ["BEL", "DEU", "JPN", "BWA", "KEN", "BRA", "CAN", "ARG", "AUS"]) {
      assert(countryShape(iso3).classList.contains("is-ai-possible") && countryShape(iso3).classList.contains("is-matcher-possible"), `${iso3} must be mapped conservatively as possible`);
    }
  assert(!countryShape("DEU").classList.contains("is-ai-likely"), "A likely candidate below 0.60 confidence must be downgraded to possible");
  assert(!countryShape("BWA").classList.contains("is-ai-excluded"), "An exclusion below 0.72 confidence must be downgraded to possible");
    assert(!countryShape("JPN").classList.contains("is-ai-likely"), "A country placed in contradictory response groups must remain only possible");
    assert(countryShape("ZAF").classList.contains("is-ai-excluded") && countryShape("ZAF").classList.contains("is-matcher-excluded"), "A sufficiently confident explicit contradiction must receive the excluded map class");
    for (const iso3 of ["KEN", "BRA", "CAN", "ARG", "AUS"]) {
      assert(!countryShape(iso3).classList.contains("is-ai-excluded"), `${iso3} must not be hard-excluded without a robust evidence category`);
    }
  assert(countryShape("USA").classList.contains("is-ai-unassessed") && countryShape("USA").classList.contains("is-dimmed"), "Unmentioned countries must stay visibly unassessed instead of becoming excluded");
    assert(nodesById.get("worldMap").classList.contains("has-ai-analysis"), "World map must expose the active direct AI analysis state");
    assert(nodesById.get("resetAiAnalysisButton").disabled === false, "Successful direct analysis must enable its reset action");

    assert(nodesById.get("roofRackFilterChip").classList.contains("active") && countryShape("NLD").classList.contains("is-ai-likely"), "Google-car filters sent with the screenshot must stay active while the AI result is shown");

  fire("resetAiAnalysisButton", "click");
  assert(aiResult.hidden && nodesById.get("resetAiAnalysisButton").disabled, "AI reset must hide the direct result and disable itself");
  assert(!nodesById.get("matcherPreview").hidden && !nodesById.get("analyzeScreenshotButton").disabled, "AI reset must keep the chosen screenshot ready for a new analysis");
  assert(!nodesById.get("worldMap").classList.contains("has-ai-analysis"), "AI reset must clear the map's analysis state");
  allCountryMapNodes().forEach((node) => {
    assert(!node.classList.contains("is-ai-best-guess") && !node.classList.contains("is-ai-likely") && !node.classList.contains("is-ai-possible") && !node.classList.contains("is-ai-excluded") && !node.classList.contains("is-ai-unassessed"), "AI reset must remove the best-guess highlight and every direct map category");
  });

    clickFilter("allFilterChip");
    assert(/^0(?:\D|$)/.test(nodeText(nodesById.get("activeFilterCount"))), "The no-filter AI test must clear the previous filter snapshot first");
    nextAnalysisPayload = {
      ok: true,
      model: "smoke-test-vision",
      appliedFilterContext: { version: 1, activeFilters: [] },
      summary: "Unsichere Testanalyse ohne aktive Filter.",
      observations: {},
      countryAnalysis: {
        summary: "Mehrere Länder sind ähnlich; Belgien bleibt der beste einzelne Tipp.",
        imageClues: [
          { category: "landscape", observation: "Flaches, grünes Gelände.", confidence: 0.42 },
        ],
        bestGuess: {
          iso3: "BEL",
          country: "Belgien",
          confidence: 0.34,
          reasons: ["Unter den unsicheren Alternativen passt Belgien noch am ehesten."],
          evidence: ["Flaches Gelände"],
          evidenceCategories: ["landscape"],
        },
        likely: [],
        possible: [
          { iso3: "BEL", country: "Belgien", confidence: 0.34, reasons: ["Nur schwache Hinweise."], evidence: ["Flaches Gelände"], evidenceCategories: ["landscape"] },
        ],
        excluded: [],
      },
      warnings: ["Der einzelne Tipp ist wegen der niedrigen Konfidenz unsicher."],
    };

    fire("analyzeScreenshotButton", "click");
    await settleAsync(10);
    const noFilterRequest = helperRequests.filter((request) => request.url.endsWith("/analyze")).at(-1);
    const noFilterBody = JSON.parse(noFilterRequest.options.body);
    assert(noFilterBody.filterContext?.version === 1 && Array.isArray(noFilterBody.filterContext.activeFilters) && noFilterBody.filterContext.activeFilters.length === 0, "Screenshot analysis must still run with a valid empty filter context when no filter is selected");
    const uncertainBestGuessCards = aiResult.querySelectorAll(".ai-best-guess");
    assert(aiResult.dataset.state === "success" && uncertainBestGuessCards.length === 1, "A low-confidence analysis without filters must still finish with exactly one visible best guess");
    const uncertainBestGuessText = nodeText(uncertainBestGuessCards[0]);
    assert(/Belgien/.test(uncertainBestGuessText) && /34\s*%/.test(uncertainBestGuessText), "Low-confidence best guess must remain visibly committed to one country with its confidence");
    assert(/unsicher|niedrig|nur möglich|offene Möglichkeit/i.test(uncertainBestGuessText), "Low-confidence best guess must be clearly labelled as uncertain rather than overstated");
    assert(countryShape("BEL").classList.contains("is-ai-best-guess") && countryShape("BEL").classList.contains("is-ai-possible"), "Low-confidence best guess must stay highlighted while retaining possible status");
    assert(!countryShape("BEL").classList.contains("is-ai-excluded") && !allCountryMapNodes().some((node) => node.classList.contains("is-ai-excluded")), "Low confidence alone must never create a hard exclusion");

    clickFilter("stopOnlyFilterChip");
    assert(!nodesById.get("worldMap").classList.contains("has-ai-analysis") && !allCountryMapNodes().some((node) => node.classList.contains("is-ai-best-guess")), "Changing a filter after analysis must immediately invalidate the stale AI result and its best-guess highlight");
    assert(!aiResult.hidden && /Filter[^.!?]{0,80}(?:geändert|erneut)|erneut[^.!?]{0,80}analysier/i.test(nodeText(aiResult)), "Changing a filter after analysis must visibly ask for a fresh analysis");
    clickFilter("whitePlateFilterChip");
    clickFilter("roofRackFilterChip");
    clickFilter("allFilterChip");
    assert(aiResult.hidden && !nodesById.get("worldMap").classList.contains("has-ai-analysis"), "All must clear a direct AI analysis as well as main filters");
    assert(!allCountryMapNodes().some((node) => node.classList.contains("is-ai-best-guess")), "All must clear the dedicated best-guess map highlight");
    allQuickChips.forEach((chip) => {
      assert(!chip.classList.contains("active") && chip.getAttribute("aria-pressed") === "false", "All must reset main and Google-car filters even while AI analysis was active");
  });

  const filterChangeCancellation = deferNextAnalysisResponse();
  const requestsBeforeFilterChangeCancellation = helperRequests.filter((request) => request.url.endsWith("/analyze")).length;
  fire("analyzeScreenshotButton", "click");
  await settleAsync();
  const filterChangeRequest = helperRequests.filter((request) => request.url.endsWith("/analyze")).at(-1);
  assert(helperRequests.filter((request) => request.url.endsWith("/analyze")).length === requestsBeforeFilterChangeCancellation + 1, "Filter-change cancellation test must reach the analysis endpoint");
  clickFilter("whiteEdgeFilterChip");
  await settleAsync();
  assert(filterChangeRequest.options.signal?.aborted === true, "Changing a filter during analysis must abort the in-flight request tied to the old snapshot");
  assert(!aiResult.hidden && /Filter[^.!?]{0,80}(?:geändert|erneut)|erneut[^.!?]{0,80}analysier/i.test(nodeText(aiResult)), "Changing a filter during analysis must request a new screenshot analysis");
  filterChangeCancellation.resolve();
  await settleAsync(10);
  assert(!nodesById.get("worldMap").classList.contains("has-ai-analysis") && !allCountryMapNodes().some((node) => node.classList.contains("is-ai-best-guess")), "A response from the old filter snapshot must never restore stale map results");
  clickFilter("allFilterChip");

  // A deliberately delayed response simulates a helper that finishes after the
  // browser has already cancelled the request. The mock ignores AbortSignal on
  // purpose so the stale-response guard itself is exercised.
  const removeCancellation = deferNextAnalysisResponse();
  const requestsBeforeRemoveCancellation = helperRequests.filter((request) => request.url.endsWith("/analyze")).length;
  fire("analyzeScreenshotButton", "click");
  await settleAsync();
  assert(helperRequests.filter((request) => request.url.endsWith("/analyze")).length === requestsBeforeRemoveCancellation + 1, "Delayed remove-cancellation test must reach the analysis endpoint");
  assert(nodesById.get("aiHelperStatus").dataset.state === "checking" && /KI analysiert/.test(nodesById.get("analyzeScreenshotButton").textContent), "Delayed analysis must visibly enter its running state");
  fire("removeScreenshot", "click");
  await settleAsync();
  removeCancellation.resolve();
  await settleAsync(10);
  assert(nodesById.get("matcherPreview").hidden, "Removing a screenshot must hide its preview");
  assert(revokedObjectUrls.includes(screenshotObjectUrl), "Removing a screenshot must revoke its object URL");
  assert(aiResult.hidden && nodesById.get("analyzeScreenshotButton").disabled, "Removing a screenshot must clear AI results and disable analysis");
  assert(!nodesById.get("worldMap").classList.contains("has-ai-analysis") && !allCountryMapNodes().some((node) => node.classList.contains("is-ai-likely") || node.classList.contains("is-ai-possible") || node.classList.contains("is-ai-excluded")), "A stale response after removing the image must not restore map results");
  assert(nodesById.get("aiHelperStatus").dataset.state === "connected" && !/läuft|analysiert/i.test(nodeText(nodesById.get("aiHelperStatus"))), "A stale response after removing the image must not restore a running status");

  screenshotInput.files = [{
    name: "cancel-with-all.jpg",
    type: "image/jpeg",
    size: 3072,
    dataUrl: "data:image/jpeg;base64,QUJPUlRfQUxM",
  }];
  fire("roadScreenshot", "change");
  await settleAsync();
  const allCancellationObjectUrl = nodesById.get("matcherPreviewImage").src;
  const allCancellation = deferNextAnalysisResponse();
  const requestsBeforeAllCancellation = helperRequests.filter((request) => request.url.endsWith("/analyze")).length;
  fire("analyzeScreenshotButton", "click");
  await settleAsync();
  const runningDashboardResetRequests = helperRequests.filter((request) => request.url.endsWith("/analyze"));
  assert(runningDashboardResetRequests.length === requestsBeforeAllCancellation + 1, "Delayed dashboard-reset cancellation test must reach the analysis endpoint");
  const runningDashboardResetRequest = runningDashboardResetRequests.at(-1);
  assert(nodesById.get("allFilterChip").disabled === false, "Everything-reset must remain available while an AI analysis is running, even with zero selected filters");
  assert(/^0(?:\D|$)/.test(nodeText(nodesById.get("activeFilterCount"))) && /KI-Analyse läuft/i.test(nodeText(nodesById.get("activeFilterSummary"))), "Filter dashboard must announce the running AI analysis without counting it as a selected filter");
  clickFilter("allFilterChip");
  await settleAsync();
  assert(runningDashboardResetRequest.options.signal?.aborted === true, "Everything-reset from the filter dashboard must abort the in-flight AI request");
  assert(nodesById.get("allFilterChip").disabled === true, "Everything-reset must disable itself after cancelling the running analysis and clearing all state");
  assert(/^0(?:\D|$)/.test(nodeText(nodesById.get("activeFilterCount"))) && /Keine Filter aktiv/i.test(nodeText(nodesById.get("activeFilterSummary"))) && !/KI-Analyse läuft/i.test(nodeText(nodesById.get("activeFilterSummary"))), "Dashboard reset must immediately restore a neutral count and live summary after AI cancellation");
  allCancellation.resolve();
  await settleAsync(10);
  assert(aiResult.hidden && !nodesById.get("worldMap").classList.contains("has-ai-analysis"), "A stale response after All must not restore results or the AI map state");
  assert(!allCountryMapNodes().some((node) => node.classList.contains("is-ai-likely") || node.classList.contains("is-ai-possible") || node.classList.contains("is-ai-excluded") || node.classList.contains("is-ai-unassessed")), "A stale response after All must not restore any direct country category");
  assert(nodesById.get("aiHelperStatus").dataset.state === "connected" && !/läuft|analysiert/i.test(nodeText(nodesById.get("aiHelperStatus"))), "A stale response after All must not restore a running status");
  assert(!nodesById.get("analyzeScreenshotButton").disabled && nodesById.get("analyzeScreenshotButton").textContent === "Mit KI analysieren", "All cancellation must leave the retained screenshot ready for a fresh analysis");
  fire("removeScreenshot", "click");
  assert(revokedObjectUrls.includes(allCancellationObjectUrl), "Cleanup after All cancellation must revoke the retained screenshot URL");

  helperOnline = false;
  screenshotInput.files = [{ name: "offline-test.webp", type: "image/webp", size: 2048 }];
  fire("roadScreenshot", "change");
  await settleAsync();
  const analyzeRequestsBeforeOfflineClick = helperRequests.filter((request) => request.url.endsWith("/analyze")).length;
  fire("analyzeScreenshotButton", "click");
  await settleAsync(10);
  assert(nodesById.get("aiHelperStatus").dataset.state === "offline", "An unreachable local helper must produce an explicit offline state");
  assert(aiResult.dataset.state === "error" && /nicht erreichbar/i.test(nodeText(aiResult)), "Offline analysis must show a useful local-helper error");
  assert(!/manuell(?:e|er|en)? Screenshot|manuell(?:e|er|en)? Merkmal/i.test(nodeText(aiResult)), "Offline fallback must not promise a removed manual screenshot matcher");
  assert(helperRequests.filter((request) => request.url.endsWith("/analyze")).length === analyzeRequestsBeforeOfflineClick, "Offline health failure must prevent screenshot transmission");
  assert(!nodesById.get("worldMap").classList.contains("has-ai-analysis"), "Offline mode must not invent a country analysis");

    clickFilter("whitePlateFilterChip");
    assert(hasMatcherResultClass(countryShape("DEU")) && countryShape("NLD").classList.contains("is-matcher-excluded"), "Manual main filters outside the AI area must continue working while the helper is offline");
    clickFilter("allFilterChip");
    assert(whitePlateChip.getAttribute("aria-pressed") === "false" && /^0(?:\D|$)/.test(nodeText(nodesById.get("activeFilterCount"))), "Everything-reset action must clear an offline main-filter fallback and its count");
    clickFilter("roofRackFilterChip");
    assert(countryShape("GTM").classList.contains("is-matcher-match") && countryShape("ATA").classList.contains("is-matcher-possible"), "Source-backed Google-car filters must continue working locally while the optional helper is offline");
    clickFilter("allFilterChip");
  helperOnline = true;
  fire("removeScreenshot", "click");

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
    aiOnlyScreenshotControls: true,
    aiLocalScreenshotPreview: true,
    aiHealthCheck: true,
    aiClickOnlyUpload: true,
    aiLoopbackContract: true,
    aiStructuredFilterContext: true,
    aiAnalysisWithoutFilters: true,
    aiExactlyOneBestGuess: true,
    aiBestGuessProminentAndMapped: true,
    aiLowConfidenceBestGuessVisibleAsUncertain: true,
    aiDirectCountryAnalysis: true,
    aiCountryMapClassesAndLists: true,
    aiWholeImageClues: ["vegetation", "bollards", "landscape", "road", "signs", "plates", "vehicle-meta"],
    aiLikelyConfidenceThreshold: 0.60,
    aiExcludedConfidenceThreshold: 0.72,
    aiLowConfidenceConservative: true,
    aiRobustEvidenceCategoryRequiredForExclusion: true,
    aiWeakOrUnknownExclusionCategoriesDowngraded: true,
    aiInvalidIsoAndValuesIgnored: true,
    aiUnassessedNotExcluded: true,
    aiOfflineNoAnalysis: true,
    aiResetBehavior: true,
    dashboardResetCancelsRunningAi: true,
    aiStaleResponseCancellation: ["filterChange", "removeScreenshot", "all"],
    independentMainClueFilters: ["stopOnly", "stopOther", "whiteEdge", "whitePlate"],
    independentGoogleCarFilters: ["roof-rack", "mirrors", "snorkel", "equipment", "tape"],
    exclusiveCaptureTypeFilters: ["motorcycle", "trekker", "boat"],
    captureMetaUnknownCountriesRemainPossible: true,
    captureMetaSingleVariantCombinations: true,
    mainFiltersWorkOffline: true,
    allResetsMainFiltersAndAi: true,
    groupedFilterDashboard: ["Basis", "Straße", "Umgebung", "Objekte", "Kamera"],
    wheelDrivenFilterCategories: ["singleStep", "momentumGuard", "outerBoundaryRelease"],
    additionalGeoGuessrFilters: ["Sprache", "Warnschildform", "Kennzeichenanordnung", "Leitpfosten", "Masten", "Straßenrand", "Kamerahöhe"],
    variableRoadLineCountries: ["RUS", "USA", "URY", "NZL", "GRC", "IDN", "JPN", "PHL", "FIN", "ARG", "CHL", "TUR"],
    variableRoadLinesRemainConjunctive: true,
    filterDashboardKeyboardAndAria: true,
    combinedFilterCountAndSummary: true,
    countryPanelEvidenceSources: true,
    selectedCountryLocalFlags: true,
    philippineConcreteSlabs: true,
    versionedDismissibleUpdateNotice: true,
  }, null, 2));
  return;
}

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
