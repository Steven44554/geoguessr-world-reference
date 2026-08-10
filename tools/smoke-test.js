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
    const results = [];
    const visit = (node) => {
      if (classes && classes.every((className) => node.classList.contains(className))) results.push(node);
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
  "matcherPlateColor", "matcherSurface", "matcherStopOnly", "stopOnlyFilterChip", "matcherReset", "matcherSummary", "matcherRoadPreview", "matcherCandidates",
  "matcherExcludedSummary",
];
const nodesById = new Map(requiredIds.map((id) => [id, new TestNode("div", id)]));
nodesById.get("countryPanel").innerHTML = initialCountryPanelMarkup;
nodesById.get("roadMatcher").hidden = true;
nodesById.get("roadMatcher").setAttribute("aria-hidden", "true");
nodesById.get("matcherButton").setAttribute("aria-expanded", "false");
nodesById.get("matcherPreview").hidden = true;
nodesById.get("roadScreenshot").type = "file";
nodesById.get("matcherStopOnly").type = "checkbox";
const stopOnlyFilterChipNode = nodesById.get("stopOnlyFilterChip");
stopOnlyFilterChipNode.tagName = "button";
stopOnlyFilterChipNode.classList.add("filter-chip");
stopOnlyFilterChipNode.dataset.matcherStopOnly = "";
stopOnlyFilterChipNode.setAttribute("aria-controls", "matcherStopOnly");
stopOnlyFilterChipNode.setAttribute("aria-pressed", "false");
nodesById.get("filters").appendChild(stopOnlyFilterChipNode);
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
    if (requestedSelectors.some((part) => [
      ".matcher-observations input",
      ".matcher-observations input[type=\"checkbox\"]",
      ".matcher-observations input[type='checkbox']",
      "#matcherStopOnly",
    ].includes(part))) {
      matches.push(nodesById.get("matcherStopOnly"));
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
assert(!netherlandsPath.classList.contains("is-selected"), "Previous map selection must be cleared after browser selection");
assert(!nodesById.get("countryBrowser").classList.contains("open"), "Country browser must close after selecting a country");

// The matcher uses a locally shown screenshot as a visual reference. The actual
// country filtering is deterministic and driven only by the selected clues.
const matcher = nodesById.get("roadMatcher");
const mainStopOnlyChip = nodesById.get("stopOnlyFilterChip");
const stopOnlyCheckbox = nodesById.get("matcherStopOnly");
assert(stopOnlyCheckbox.checked === false, "STOP-only matcher checkbox must start disabled");
assert(mainStopOnlyChip.getAttribute("aria-pressed") === "false" && !mainStopOnlyChip.classList.contains("active"), "Main STOP-only filter chip must start inactive");
clickWithBubble("stopOnlyFilterChip", "filters");
assert(stopOnlyCheckbox.checked === true, "Clicking the visible STOP-only filter chip must enable the matcher checkbox");
assert(mainStopOnlyChip.getAttribute("aria-pressed") === "true" && mainStopOnlyChip.classList.contains("active"), "Active STOP-only filter chip must synchronize its ARIA and visual states");
assert(!countryShape("USA").classList.contains("is-matcher-excluded"), "The visible STOP-only filter chip must run the matcher and retain the USA");
assert(countryShape("MEX").classList.contains("is-matcher-excluded"), "The visible STOP-only filter chip must run the matcher and exclude Mexico's ALTO sign");
clickWithBubble("stopOnlyFilterChip", "filters");
assert(stopOnlyCheckbox.checked === false, "Clicking the active STOP-only filter chip again must disable the matcher checkbox");
assert(mainStopOnlyChip.getAttribute("aria-pressed") === "false" && !mainStopOnlyChip.classList.contains("active"), "Inactive STOP-only filter chip must synchronize its ARIA and visual states");
clickWithBubble("stopOnlyFilterChip", "filters");
fire("matcherReset", "click");
assert(stopOnlyCheckbox.checked === false, "Matcher reset must disable the checkbox activated by the main STOP-only filter chip");
assert(mainStopOnlyChip.getAttribute("aria-pressed") === "false" && !mainStopOnlyChip.classList.contains("active"), "Matcher reset must also deactivate the main STOP-only filter chip");
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
for (const id of ["matcherTraffic", "matcherCenterColor", "matcherCenterStyle", "matcherEdgeColor", "matcherEdgeStyle", "matcherPlateColor", "matcherSurface"]) {
  assert(nodesById.get(id).value === "", `Matcher reset must clear ${id}`);
}
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
assert(mainStopOnlyChip.getAttribute("aria-pressed") === "true" && mainStopOnlyChip.classList.contains("active"), "Changing the matcher checkbox must activate the visible STOP-only filter chip");
assert(hasMatcherResultClass(countryShape("USA")), "A country with STOP-only signs must remain a matcher candidate");
assert(!countryShape("USA").classList.contains("is-matcher-excluded"), "The STOP-only clue must not exclude the USA");
assert(countryShape("JPN").classList.contains("is-matcher-excluded"), "STOP-only signs must exclude Japan's Japanese stop-sign text");
assert(countryShape("MEX").classList.contains("is-matcher-excluded"), "STOP-only signs must exclude Mexico's ALTO stop-sign text");
assert(!countryShape("ATA").classList.contains("is-matcher-excluded"), "Countries without stop-sign text data must remain possible instead of being hard-excluded");
fire("matcherReset", "click");
assert(stopOnlyCheckbox.checked === false, "Matcher reset must disable the STOP-only checkbox");
assert(mainStopOnlyChip.getAttribute("aria-pressed") === "false" && !mainStopOnlyChip.classList.contains("active"), "Matcher reset must keep the main STOP-only filter chip synchronized");

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
  matcherResetPreservesSelection: true,
}, null, 2));
