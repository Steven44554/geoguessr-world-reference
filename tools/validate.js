const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, "data", "world-map.js"), "utf8"), context);
vm.runInContext(fs.readFileSync(path.join(root, "data", "countries.js"), "utf8"), context);

const { WORLD_GEOJSON, COUNTRIES, SMALL_COUNTRY_MARKERS } = context.window;
const records = Object.values(COUNTRIES);
const allowedPatternColors = new Set(["white", "yellow", "green", "none"]);
const allowedPatternStyles = new Set(["solid", "dashed", "double-solid", "double-dashed", "solid-dashed", "none"]);
const allowedPatternConfidence = new Set(["unknown", "low", "medium", "medium-high", "high"]);
const allowedPatternScopes = new Set(["national-default", "marked-main-road", "road-class", "special-variant", "generic-placeholder"]);
const allowedStopFormats = new Set(["unknown", "stop-only", "local-or-multilingual", "variable"]);
const allowedVisualKeys = new Set(["warningSign", "plateLayout", "bollard", "pole", "shoulder", "signBack", "camera"]);
const allowedVisualValues = new Set([
  "diamond-yellow", "triangle-white", "triangle-yellow",
  "white-white", "white-yellow", "yellow-yellow", "dark-dark",
  "white-black", "painted-black-white", "black-yellow",
  "wood", "concrete", "paved", "gravel", "none", "drainage", "dark", "low",
]);
const allowedVisualConfidence = new Set(["low", "medium", "high"]);
const allowedVisualExclusion = new Set(["soft", "strong"]);
const priorityIso3 = [
  "ZAF", "BWA", "LSO", "SWZ", "NAM",
  "NOR", "SWE", "FIN", "ISL", "DNK",
  "USA", "CAN", "MEX",
  "BRA", "ARG", "URY", "CHL", "PER", "BOL", "ECU", "COL",
  "AUS", "NZL", "JPN", "KOR", "THA", "MYS", "IDN", "PHL",
  "GBR", "IRL", "ESP", "PRT", "FRA", "DEU", "NLD", "BEL", "LUX",
  "POL", "CZE", "SVK", "HUN", "ROU", "BGR", "SRB", "HRV", "SVN",
  "MNE", "MKD", "ALB", "GRC", "TUR",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(WORLD_GEOJSON.features.length === 177, "Unexpected Natural Earth feature count");
assert(records.length >= 200, "Country browser should cover countries plus mapped territories");
assert(priorityIso3.length === 52, "Priority list definition drifted");
priorityIso3.forEach((iso3) => assert(COUNTRIES[iso3]?.detailLevel === "priorität", `Missing priority profile: ${iso3}`));
assert(/gelb/i.test(COUNTRIES.NLD.licensePlates.description), "Netherlands must match the yellow license plate filter");
assert(COUNTRIES.NLD.geoGuessrClues.some((clue) => /gelbe Kennzeichen/i.test(clue.text)), "Netherlands yellow plates must be a prominent clue");
WORLD_GEOJSON.features.forEach((feature) => assert(COUNTRIES[feature.properties.iso3], `Map feature lacks record: ${feature.properties.iso3}`));
SMALL_COUNTRY_MARKERS.forEach((marker) => assert(COUNTRIES[marker.iso3], `Marker lacks record: ${marker.iso3}`));

records.forEach((country) => {
  assert(["left", "right"].includes(country.traffic), `Invalid traffic side: ${country.iso3}`);
  assert(country.roadMarkings?.centerColor, `Missing road markings: ${country.iso3}`);
  assert(Array.isArray(country.geoGuessrClues) && country.geoGuessrClues.length, `Missing clues: ${country.iso3}`);
  country.confusedWith.forEach((iso3) => assert(COUNTRIES[iso3], `Broken comparison reference: ${country.iso3} -> ${iso3}`));
  assert(allowedPatternConfidence.has(country.roadMapPattern.confidence), `Invalid map-pattern confidence: ${country.iso3}`);
  assert(typeof country.roadMapPattern.notes === "string" && country.roadMapPattern.notes.trim(), `Missing map-pattern note: ${country.iso3}`);
  for (const part of [country.roadMapPattern.center, country.roadMapPattern.leftEdge, country.roadMapPattern.rightEdge]) {
    assert(allowedPatternColors.has(part.color), `Invalid map-pattern color: ${country.iso3} -> ${part.color}`);
    assert(allowedPatternStyles.has(part.style), `Invalid map-pattern style: ${country.iso3} -> ${part.style}`);
  }
  const center = country.roadMapPattern.center;
  const expectedCenterCount = center.style === "none" ? 0 : ["double-solid", "double-dashed", "solid-dashed"].includes(center.style) ? 2 : 1;
  assert(center.count === expectedCenterCount, `Invalid map-pattern line count: ${country.iso3} -> ${center.count}`);
  if (center.bandColor !== undefined) {
    assert(allowedPatternColors.has(center.bandColor) && center.bandColor !== "none", `Invalid map-pattern band color: ${country.iso3}`);
  }
  const inner = country.roadMapPattern.center.inner;
  if (inner) {
    assert(allowedPatternColors.has(inner.color), `Invalid inner map-pattern color: ${country.iso3} -> ${inner.color}`);
    assert(allowedPatternStyles.has(inner.style), `Invalid inner map-pattern style: ${country.iso3} -> ${inner.style}`);
    const expectedInnerCount = inner.style === "none" ? 0 : ["double-solid", "double-dashed", "solid-dashed"].includes(inner.style) ? 2 : 1;
    assert(inner.count === expectedInnerCount, `Invalid inner map-pattern line count: ${country.iso3} -> ${inner.count}`);
  }
  if (country.roadMapPattern.center.spacing !== undefined) {
    assert(Number.isFinite(country.roadMapPattern.center.spacing) && country.roadMapPattern.center.spacing > 0, `Invalid map-pattern spacing: ${country.iso3}`);
  }
  if (country.roadVerification) {
    assert(["cross-checked", "partial"].includes(country.roadVerification.status), `Invalid verification status: ${country.iso3}`);
    assert(Array.isArray(country.roadVerification.sources) && country.roadVerification.sources.length, `Verified pattern lacks sources: ${country.iso3}`);
    country.roadVerification.sources.forEach((source) => assert(/^https:\/\//.test(source), `Invalid verification source: ${country.iso3}`));
  }
  if (country.roadVerification?.status === "cross-checked") {
    assert(allowedPatternScopes.has(country.roadMapPattern.scope), `Verified pattern lacks a valid scope: ${country.iso3}`);
    assert(country.roadMapPattern.showOnWorld === undefined || typeof country.roadMapPattern.showOnWorld === "boolean", `Invalid world visibility flag: ${country.iso3}`);
  }
  assert(allowedStopFormats.has(country.stopSign?.format), `Invalid stop-sign format: ${country.iso3}`);
  assert(["unknown", "low", "medium", "high"].includes(country.stopSign?.confidence), `Invalid stop-sign confidence: ${country.iso3}`);
  assert(Array.isArray(country.stopSign?.sources), `Missing stop-sign sources array: ${country.iso3}`);
  country.stopSign.sources.forEach((source) => assert(/^https:\/\//.test(source), `Invalid stop-sign source: ${country.iso3}`));
  if (country.stopSign.updatedAt) assert(/^\d{4}-\d{2}-\d{2}$/.test(country.stopSign.updatedAt), `Invalid stop-sign update date: ${country.iso3}`);

  assert(country.visualEvidence && typeof country.visualEvidence === "object", `Missing visual evidence: ${country.iso3}`);
  assert(country.visualEvidence.profiles && typeof country.visualEvidence.profiles === "object", `Missing visual-evidence profiles: ${country.iso3}`);
  if (country.visualEvidence.updatedAt) assert(/^\d{4}-\d{2}-\d{2}$/.test(country.visualEvidence.updatedAt), `Invalid visual-evidence update date: ${country.iso3}`);
  Object.entries(country.visualEvidence.profiles).forEach(([key, profile]) => {
    assert(allowedVisualKeys.has(key), `Invalid visual-evidence key: ${country.iso3} -> ${key}`);
    assert(Array.isArray(profile.values) && profile.values.length, `Missing visual-evidence values: ${country.iso3} -> ${key}`);
    profile.values.forEach((value) => assert(allowedVisualValues.has(value), `Invalid visual-evidence value: ${country.iso3} -> ${key}:${value}`));
    assert(allowedVisualConfidence.has(profile.confidence), `Invalid visual-evidence confidence: ${country.iso3} -> ${key}`);
    assert(allowedVisualExclusion.has(profile.exclusion), `Invalid visual-evidence exclusion mode: ${country.iso3} -> ${key}`);
    assert(typeof profile.scope === "string" && profile.scope.trim(), `Missing visual-evidence scope: ${country.iso3} -> ${key}`);
    assert(typeof profile.note === "string" && profile.note.trim(), `Missing visual-evidence note: ${country.iso3} -> ${key}`);
    assert(Array.isArray(profile.sources), `Missing visual-evidence sources: ${country.iso3} -> ${key}`);
    profile.sources.forEach((source) => assert(/^https:\/\//.test(source), `Invalid visual-evidence source: ${country.iso3} -> ${key}`));
    if (profile.exclusion === "strong") {
      assert(profile.confidence === "high" && profile.sources.length, `Strong visual exclusion must be high-confidence and sourced: ${country.iso3} -> ${key}`);
    }
  });
});

const mappedPatterns = records.filter((country) => country.roadMapPattern.confidence !== "unknown");
const crossCheckedPatterns = records.filter((country) => country.roadVerification?.status === "cross-checked");
const partialPatterns = records.filter((country) => country.roadVerification?.status === "partial");
const visualEvidenceProfiles = records.reduce((sum, country) => sum + Object.keys(country.visualEvidence.profiles).length, 0);
const sourceBackedVisualProfiles = records.reduce((sum, country) => sum + Object.values(country.visualEvidence.profiles).filter((profile) => profile.sources.length).length, 0);
assert(mappedPatterns.length >= 200, "Road-map patterns should cover all countries with representative public roads");
assert(crossCheckedPatterns.length >= 35, "Priority countries should retain a substantial cross-checked road-pattern set");
const unknownPatterns = records.filter((country) => country.roadMapPattern.confidence === "unknown").map((country) => country.iso3).sort();
assert(JSON.stringify(unknownPatterns) === JSON.stringify(["ATA", "ATF"]), `Unexpected countries without road pattern: ${unknownPatterns.join(", ")}`);

assert(COUNTRIES.ISL.roadMapPattern.center.color === "white", "Iceland must use current white permanent markings");
assert(COUNTRIES.SWE.roadMapPattern.leftEdge.style === "dashed" && COUNTRIES.SWE.roadMapPattern.rightEdge.style === "dashed", "Sweden must show dashed outer lines");
assert(COUNTRIES.IRL.roadMapPattern.leftEdge.color === "yellow" && COUNTRIES.IRL.roadMapPattern.leftEdge.style === "dashed", "Ireland must show dashed yellow outer lines");
assert(COUNTRIES.NLD.roadMapPattern.center.color === "white" && COUNTRIES.NLD.roadMapPattern.center.bandColor === "green", "Netherlands must show white lines around a green center band");
assert(COUNTRIES.ARG.roadMapPattern.center.color === "white", "Argentina must use the current white regular center line");
assert(COUNTRIES.URY.roadMapPattern.center.color === "white" && COUNTRIES.URY.roadMapPattern.center.style === "dashed", "Uruguay's map must use its normative white dashed base pattern");
assert(COUNTRIES.URY.roadStyles.some((style) => style.centerColor === "gelb" && style.centerInnerColor === "weiß"), "Uruguay must retain the yellow-white-yellow special variant in the panel");
assert(COUNTRIES.IDN.roadMapPattern.center.color === "yellow", "Indonesia's representative national-road pattern must use a yellow center");
assert(COUNTRIES.IDN.roadMapPattern.scope === "road-class", "Indonesia's yellow pattern must be limited to a road class");
assert(COUNTRIES.PHL.roadMapPattern.center.color === "white", "Philippines' current representative base pattern must use a white center");
assert(COUNTRIES.NZL.roadMapPattern.center.color === "white" && COUNTRIES.NZL.roadMapPattern.center.style === "dashed", "New Zealand's map must use its normal white dashed center line");
assert(COUNTRIES.NZL.roadStyles.some((style) => style.centerColor === "gelb" && /double|doppelt/.test(style.centerStyle)), "New Zealand must retain its double-yellow no-passing variant in the panel");
for (const iso3 of ["USA", "CAN", "MEX", "BRA"]) {
  assert(COUNTRIES[iso3].roadMapPattern.center.color === "yellow" && COUNTRIES[iso3].roadMapPattern.center.style === "dashed", `${iso3} must use a representative dashed yellow base center`);
}
assert(COUNTRIES.BOL.roadVerification?.status === "partial", "Bolivia's incompletely supported pattern must be marked partial");
assert(COUNTRIES.FLK.traffic === "left", "Falkland Islands must use left-hand traffic");
assert(COUNTRIES.CYN.traffic === "left", "Northern Cyprus must use left-hand traffic");
for (const iso3 of ["ITA", "UKR", "TUR", "DNK"]) {
  assert(COUNTRIES[iso3].roadVerification?.status === "cross-checked", `${iso3} must have a source-checked European road pattern`);
  assert(COUNTRIES[iso3].roadMapPattern.center.color === "white" && COUNTRIES[iso3].roadMapPattern.center.style === "dashed", `${iso3} must use a white dashed representative center`);
}
assert(COUNTRIES.DNK.roadMapPattern.showOnWorld === false, "Denmark's pattern must stay out of the world LOD");
assert(/vorn und hinten/i.test(COUNTRIES.LUX.licensePlates.description) && /gelb/i.test(COUNTRIES.LUX.licensePlates.description), "Luxembourg must describe yellow plates at both ends");
assert(COUNTRIES.USA.visualEvidence.profiles.warningSign.values.includes("diamond-yellow") && COUNTRIES.USA.visualEvidence.profiles.warningSign.confidence === "high", "USA must have a sourced high-confidence yellow-diamond warning-sign profile");
assert(COUNTRIES.GBR.visualEvidence.profiles.plateLayout.values.includes("white-yellow") && COUNTRIES.GBR.visualEvidence.profiles.plateLayout.sources.length, "Great Britain must have a sourced white/yellow plate profile");
for (const iso3 of ["NLD", "LUX", "COL"]) {
  assert(COUNTRIES[iso3].visualEvidence.profiles.plateLayout.values.includes("yellow-yellow"), `${iso3} must have yellow plates at both ends`);
  assert(COUNTRIES[iso3].visualEvidence.profiles.plateLayout.sources.length, `${iso3} yellow plate layout must be source-backed`);
}
assert(COUNTRIES.JPN.visualEvidence.profiles.camera.values.includes("low") && COUNTRIES.JPN.visualEvidence.profiles.camera.exclusion === "soft", "Japan's low-camera clue must remain a soft hint");
assert(COUNTRIES.BRA.visualEvidence.profiles.signBack.values.includes("dark") && COUNTRIES.BRA.visualEvidence.profiles.signBack.exclusion === "soft", "Brazil's dark sign-back clue must remain a soft hint");
assert(Object.keys(COUNTRIES.ATA.visualEvidence.profiles).length === 0, "Unknown Antarctic visual evidence must remain empty instead of being guessed");

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const initialCountryPanelMarkup = html.match(/<aside\b[^>]*id=["']countryPanel["'][^>]*>([\s\S]*?)<\/aside>/i)?.[1] || "";
const initialCountryPanelText = initialCountryPanelMarkup.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
assert(initialCountryPanelMarkup, "Initial country panel markup is missing");
assert(/\bempty-state\b/.test(initialCountryPanelMarkup), "Initial country panel must use the neutral empty state");
assert(/Wähle ein Land/i.test(initialCountryPanelText), "Initial country panel needs a neutral German selection heading");
assert(/Karte/i.test(initialCountryPanelText) && /Länderbrowser/i.test(initialCountryPanelText), "Initial country panel must explain both country selection routes in German");
assert(!/Südafrika/i.test(initialCountryPanelText), "South Africa must not be displayed in the initial country panel");
assert(!/\bdata-select-country\b/i.test(initialCountryPanelMarkup), "Initial country panel must not contain a preselected country action");
assert(/\bselectedIso\s*:\s*null\b/.test(script), "Application state must start without a selected country");
assert(!/\bselectCountry\s*\(\s*["']ZAF["']\s*,\s*false\s*,\s*false\s*\)\s*;/.test(script), "South Africa must not be selected during application startup");
const matcherIds = [
  "matcherButton", "roadMatcher", "roadScreenshot", "matcherPreview", "matcherPreviewImage", "removeScreenshot",
  "matcherTraffic", "matcherCenterColor", "matcherCenterStyle", "matcherEdgeColor", "matcherEdgeStyle",
  "matcherPlateColor", "matcherSurface", "matcherStopOnly", "stopOnlyFilterChip", "matcherReset", "matcherSummary", "matcherRoadPreview", "matcherCandidates",
  "matcherStopText", "matcherWarningSign", "matcherPlateLayout", "matcherBollard", "matcherPole", "matcherShoulder", "matcherSignBack", "matcherCamera",
  "matcherExcludedSummary",
];
for (const id of matcherIds) {
  const occurrences = html.match(new RegExp(`id=["']${id}["']`, "g")) || [];
  assert(occurrences.length === 1, `Matcher element must exist exactly once: ${id}`);
}
assert(/Straßen-Screenshot auswerten/.test(html), "Matcher needs a visible, descriptive German heading");
assert(/Der Screenshot bleibt lokal/.test(html), "Matcher must explain that screenshots stay local");
assert(/Wähle nur sichtbare Merkmale aus/.test(html), "Matcher must tell users to select only clues actually visible in the screenshot");
assert(/Straßentypen können innerhalb eines Landes variieren/.test(html), "Matcher must disclose that road markings can vary within a country");
assert(/Weitere visuelle Hinweise/.test(html), "Matcher must expose the expanded visual filters");
assert(/Konservative Auswertung/.test(html) && /fehlende Daten bleiben/.test(html), "Matcher must explain conservative evidence handling and unknown-data behavior");
assert(/Screenshot auswählen/.test(html) && /PNG, JPG oder WebP[^<]*nur lokal/.test(html), "Screenshot picker must visibly describe its local image formats");
assert(/Mögliche Länder/.test(html) && /Länder ein- und auszuschließen/.test(html), "Matcher must visibly label its candidate and exclusion workflow");
assert(/Noch keine Länder ausgeschlossen/.test(html), "Matcher needs an explicit empty exclusion state");
const screenshotInputMarkup = html.match(/<input\b[^>]*id=["']roadScreenshot["'][^>]*>/i)?.[0] || "";
assert(/type=["']file["']/i.test(screenshotInputMarkup) && /accept=["']image\/(?:\*|[^"']+)["']/i.test(screenshotInputMarkup), "Screenshot input must be a local image-only file picker");
const stopOnlyInputMarkup = html.match(/<input\b[^>]*id=["']matcherStopOnly["'][^>]*>/i)?.[0] || "";
assert(/type=["']checkbox["']/i.test(stopOnlyInputMarkup), "STOP-only matcher control must be a checkbox");
const filterStripMarkup = html.match(/<div\b[^>]*id=["']filters["'][^>]*>[\s\S]*?<\/div>/i)?.[0] || "";
const stopOnlyFilterChipMarkup = html.match(/<button\b[^>]*id=["']stopOnlyFilterChip["'][^>]*>[\s\S]*?<\/button>/i)?.[0] || "";
assert(filterStripMarkup && filterStripMarkup.includes(stopOnlyFilterChipMarkup), "STOP-only filter chip must be directly visible in the main filter strip");
assert(/class=["'][^"']*\bfilter-chip\b/i.test(stopOnlyFilterChipMarkup), "STOP-only main control must use the standard filter-chip styling");
assert(/\bdata-matcher-stop-only(?:\s|=|>)/i.test(stopOnlyFilterChipMarkup), "STOP-only filter chip needs its dedicated matcher data attribute");
assert(!/\bdata-filter\s*=/i.test(stopOnlyFilterChipMarkup), "STOP-only filter chip must not enter the generic country-filter handler");
assert(/\baria-controls=["']matcherStopOnly["']/i.test(stopOnlyFilterChipMarkup), "STOP-only filter chip must reference its synchronized matcher checkbox");
assert(/\baria-pressed=["']false["']/i.test(stopOnlyFilterChipMarkup), "STOP-only filter chip must expose its initial toggle state");
assert(!/(?:\bhidden\b|\baria-hidden=["']true["']|\bdisplay\s*:\s*none\b)/i.test(stopOnlyFilterChipMarkup), "STOP-only filter chip must not be hidden");
const stopOnlyFilterChipText = stopOnlyFilterChipMarkup.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
assert(/\bSTOP\b/i.test(stopOnlyFilterChipText) && /Schild/i.test(stopOnlyFilterChipText), "STOP-only filter chip needs a concise visible STOP-sign label");
const allFilterPosition = filterStripMarkup.search(/\bdata-filter=["']all["']/i);
const stopOnlyFilterPosition = filterStripMarkup.search(/\bid=["']stopOnlyFilterChip["']/i);
const trafficFilterPosition = filterStripMarkup.search(/\bdata-filter=["']traffic:left["']/i);
assert(allFilterPosition >= 0 && stopOnlyFilterPosition > allFilterPosition && trafficFilterPosition > stopOnlyFilterPosition, "STOP-only filter chip must sit directly after All so it stays visible without horizontal scrolling");
const visibleHtmlText = html
  .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
  .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ");
assert(/(?:nur|ausschließlich)[^.!?]{0,40}\bSTOP\b|\bSTOP\b[^.!?]{0,40}(?:nur|ausschließlich)/i.test(visibleHtmlText), "STOP checkbox needs a visible German hint that only STOP is written on the sign");
assert(/kein(?:e|er)\s+(?:weitere(?:n|r)?|andere(?:n|r)?)\s+Sprache/i.test(visibleHtmlText), "STOP checkbox must visibly clarify that no other language is present");

function selectMarkup(id) {
  return html.match(new RegExp(`<select\\b[^>]*id=["']${id}["'][^>]*>[\\s\\S]*?<\\/select>`, "i"))?.[0] || "";
}

const matcherTrafficOptions = selectMarkup("matcherTraffic");
const matcherCenterColorOptions = selectMarkup("matcherCenterColor");
const matcherCenterStyleOptions = selectMarkup("matcherCenterStyle");
const matcherEdgeColorOptions = selectMarkup("matcherEdgeColor");
const matcherEdgeStyleOptions = selectMarkup("matcherEdgeStyle");
const matcherPlateOptions = selectMarkup("matcherPlateColor");
const matcherSurfaceOptions = selectMarkup("matcherSurface");
const matcherStopTextOptions = selectMarkup("matcherStopText");
const matcherWarningSignOptions = selectMarkup("matcherWarningSign");
const matcherPlateLayoutOptions = selectMarkup("matcherPlateLayout");
const matcherBollardOptions = selectMarkup("matcherBollard");
const matcherPoleOptions = selectMarkup("matcherPole");
const matcherShoulderOptions = selectMarkup("matcherShoulder");
const matcherSignBackOptions = selectMarkup("matcherSignBack");
const matcherCameraOptions = selectMarkup("matcherCamera");
for (const [label, markup, values] of [
  ["traffic", matcherTrafficOptions, ["left", "right"]],
  ["center color", matcherCenterColorOptions, ["white", "yellow", "green", "none"]],
  ["center style", matcherCenterStyleOptions, ["dashed", "solid", "double-solid", "solid-dashed", "none"]],
  ["edge color", matcherEdgeColorOptions, ["white", "yellow", "none"]],
  ["edge style", matcherEdgeStyleOptions, ["dashed", "solid", "none"]],
  ["plate color", matcherPlateOptions, ["yellow", "white", "dark"]],
  ["surface", matcherSurfaceOptions, ["asphalt", "concrete", "gravel", "unpaved"]],
  ["stop text", matcherStopTextOptions, ["alto", "pare", "berhenti", "tomare-stop"]],
  ["warning sign", matcherWarningSignOptions, ["diamond-yellow", "triangle-white", "triangle-yellow"]],
  ["plate layout", matcherPlateLayoutOptions, ["white-white", "white-yellow", "yellow-yellow", "dark-dark"]],
  ["bollard", matcherBollardOptions, ["white-black", "painted-black-white", "black-yellow"]],
  ["pole", matcherPoleOptions, ["wood", "concrete"]],
  ["shoulder", matcherShoulderOptions, ["paved", "gravel", "none", "drainage"]],
  ["sign back", matcherSignBackOptions, ["dark"]],
  ["camera", matcherCameraOptions, ["low"]],
]) {
  assert(markup, `Missing matcher ${label} select`);
  for (const value of values) assert(new RegExp(`value=["']${value}["']`).test(markup), `Matcher ${label} is missing option: ${value}`);
}
assert(/value=["']green["'][^>]*>\s*Grünes Mittelband/i.test(matcherCenterColorOptions), "Matcher must expose the Dutch green center band as a visible option");

assert(html.includes('id="roadLineOverlays"'), "Visible road-line overlay layer is missing");
assert(html.includes('id="countryClipPaths"'), "Country clip-path layer is missing");
assert(html.includes('id="countryBorders"'), "Top country-border layer is missing");
assert(html.includes('class="map-legend"'), "Compact in-map legend is missing");
assert(/id="resetZoom"[^>]*>Reset</.test(html), "Map controls must include a textual Reset button");
assert(script.includes("zoomLevelForScale") && script.includes("map-road-surface") && script.includes("map-road-neutral-line"), "Road-sample LOD implementation is incomplete");
assert(script.includes("URL.createObjectURL") && script.includes("URL.revokeObjectURL"), "Screenshot preview must use and release a local object URL");
for (const className of ["is-matcher-match", "is-matcher-possible", "is-matcher-excluded"]) {
  assert(script.includes(className), `Matcher does not assign map class: ${className}`);
  assert(css.includes(`.${className}`), `Matcher map class lacks styling: ${className}`);
}
assert(script.includes("data-matcher-open") && script.includes("data-matcher-exclude") && script.includes("data-matcher-restore"), "Matcher candidate actions are incomplete");
assert(/matcherCenterColor/.test(script) && /matcherEdgeStyle/.test(script) && /matcherPlateColor/.test(script) && /matcherSurface/.test(script), "Matcher does not evaluate all visible clue controls");
assert(/matcherStopOnly/.test(script) && /\.checked\b/.test(script), "Matcher does not evaluate the STOP-only checkbox state");
assert(/matcherStopText/.test(script) && /matcherWarningSign/.test(script) && /matcherPlateLayout/.test(script), "Matcher does not evaluate the strong expanded visual controls");
assert(/matcherBollard/.test(script) && /matcherPole/.test(script) && /matcherShoulder/.test(script) && /matcherSignBack/.test(script) && /matcherCamera/.test(script), "Matcher does not evaluate the soft expanded visual controls");
assert(/evaluateVisualEvidence/.test(script) && /verifiedMatches/.test(script) && /sourceCount/.test(script), "Matcher lacks confidence-aware visual-evidence evaluation");
assert(/renderDataQuality/.test(script) && /Datenqualität und Quellen/.test(script), "Country panel lacks evidence quality and source rendering");
assert(/stopOnlyFilterChip/.test(script) && /aria-pressed/.test(script), "Main STOP-only filter chip is not synchronized by the application script");
assert(!script.includes("smallBadgeOffsets") && !script.includes("road-badge-base"), "Legacy floating road badges must be removed from the map script");
assert(css.includes(".map-road-surface") && css.includes(".map-road-neutral-line") && css.includes(".has-selection"), "Final road, neutral, and selection styles are incomplete");
assert(css.includes(".matcher-advanced-grid") && css.includes(".matcher-evidence") && css.includes(".source-list"), "Expanded matcher and data-quality styles are incomplete");
assert(!css.includes("road-badge-base") && !css.includes("road-badge-leader"), "Legacy road badge styles must be removed");
for (const relativePath of ["style.css", "data/world-map.js", "data/countries.js", "script.js"]) {
  assert(html.includes(relativePath), `index.html does not reference ${relativePath}`);
  assert(fs.existsSync(path.join(root, relativePath)), `Referenced file missing: ${relativePath}`);
}

assert(!/<(?:script|link|img|source|iframe)\b[^>]*(?:src|href)\s*=\s*["']https?:\/\//i.test(html), "index.html must not load external assets");
const matcherClaimText = html
  .replace(/keine automatische(?:n|r|s)?\s+(?:Bild|Foto|Screenshot)[^.<]*/gi, "")
  .replace(/nicht automatisch[^.<]*/gi, "");
assert(!/(?:\bKI\b|\bAI\b).{0,80}(?:erkennt|analysiert|bestimmt|identifiziert)|automatische(?:n|r|s)?\s+(?:Bilderkennung|Bildanalyse|Screenshotanalyse)/is.test(matcherClaimText), "Matcher must not claim automatic or AI-based screenshot recognition");

for (const file of ["index.html", "style.css", "script.js", "data/countries.js", "data/world-map.js"]) {
  const content = fs.readFileSync(path.join(root, file), "utf8");
  assert(!/\bfetch\s*\(|XMLHttpRequest|WebSocket/.test(content), `Network call found in ${file}`);
  assert(!/@import\s+(?:url\()?\s*["']?https?:\/\//i.test(content), `Remote CSS import found in ${file}`);
  assert(!/url\(\s*["']?https?:\/\//i.test(content), `Remote CSS asset found in ${file}`);
  assert(!/[Ã�]|â†|â˜|ï»¿/.test(content), `Encoding artifact found in ${file}`);
}

console.log(JSON.stringify({
  status: "OK",
  mapFeatures: WORLD_GEOJSON.features.length,
  countryRecords: records.length,
  priorityProfiles: priorityIso3.length,
  smallCountryMarkers: SMALL_COUNTRY_MARKERS.length,
  roadMapPatterns: mappedPatterns.length,
  crossCheckedRoadPatterns: crossCheckedPatterns.length,
  partiallyCheckedRoadPatterns: partialPatterns.length,
  visualEvidenceProfiles,
  sourceBackedVisualProfiles,
  matcherControls: matcherIds.length,
  phase3VisualFilters: true,
  phase4EvidenceQuality: true,
  neutralInitialCountryPanel: true,
  matcherNetworkUploads: 0,
  floatingRoadBadges: 0,
  externalNetworkCalls: 0,
}, null, 2));
