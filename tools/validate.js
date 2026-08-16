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
const flagDirectory = path.join(root, "assets", "flags", "4x3");
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
const allowedCaptureFeatures = new Set(["roof-rack", "mirrors", "snorkel", "equipment", "tape"]);
const allowedCaptureTypes = new Set(["car", "motorcycle", "trekker", "boat"]);
const allowedCaptureTypicality = new Set(["typical", "variant", "rare"]);
const allowedCaptureConfidence = new Set(["low", "medium", "high"]);
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

function elementMarkupById(source, id) {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const openingMatch = new RegExp(`<([a-z][a-z0-9-]*)\\b[^>]*\\bid=["']${escapedId}["'][^>]*>`, "i").exec(source);
  if (!openingMatch) return "";
  const [openingTag, tagName] = openingMatch;
  if (/\/$/.test(openingTag.slice(0, -1).trim())) return openingTag;
  const tokenPattern = new RegExp(`<\\/?${tagName}\\b[^>]*>`, "gi");
  tokenPattern.lastIndex = openingMatch.index;
  let depth = 0;
  let token;
  while ((token = tokenPattern.exec(source))) {
    if (/^<\//.test(token[0])) depth -= 1;
    else if (!/\/$/.test(token[0].slice(0, -1).trim())) depth += 1;
    if (depth === 0) return source.slice(openingMatch.index, tokenPattern.lastIndex);
  }
  return "";
}

function elementMarkupAt(source, startIndex) {
  const openingMatch = /^<([a-z][a-z0-9-]*)\b[^>]*>/i.exec(source.slice(startIndex));
  if (!openingMatch) return "";
  const [openingTag, tagName] = openingMatch;
  if (/\/$/.test(openingTag.slice(0, -1).trim())) return openingTag;
  const tokenPattern = new RegExp(`<\\/?${tagName}\\b[^>]*>`, "gi");
  tokenPattern.lastIndex = startIndex;
  let depth = 0;
  let token;
  while ((token = tokenPattern.exec(source))) {
    if (/^<\//.test(token[0])) depth -= 1;
    else if (!/\/$/.test(token[0].slice(0, -1).trim())) depth += 1;
    if (depth === 0) return source.slice(startIndex, tokenPattern.lastIndex);
  }
  return "";
}

function elementsWithRole(source, role) {
  const matches = [];
  const pattern = new RegExp(`<([a-z][a-z0-9-]*)\\b[^>]*\\brole=["']${role}["'][^>]*>`, "gi");
  let match;
  while ((match = pattern.exec(source))) {
    const markup = elementMarkupAt(source, match.index);
    if (markup) matches.push(markup);
  }
  return matches;
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
  country.roadStyles.forEach((style) => {
    if (style.surfaceDetail !== undefined) {
      assert(style.surfaceDetail === "concrete-slabs", `Invalid road surface detail: ${country.iso3} -> ${style.surfaceDetail}`);
      assert(style.surface === "concrete", `Concrete slab detail requires a concrete surface: ${country.iso3}`);
    }
  });
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

  assert(country.captureMeta && typeof country.captureMeta === "object", `Missing capture meta: ${country.iso3}`);
  assert(typeof country.captureMeta.summary === "string", `Missing capture-meta summary: ${country.iso3}`);
  assert(Array.isArray(country.captureMeta.variants), `Missing capture-meta variants: ${country.iso3}`);
  if (country.captureMeta.updatedAt) assert(/^\d{4}-\d{2}-\d{2}$/.test(country.captureMeta.updatedAt), `Invalid capture-meta update date: ${country.iso3}`);
  country.captureMeta.variants.forEach((variant, index) => {
    const variantLabel = `${country.iso3} -> variant ${index + 1}`;
    assert(Array.isArray(variant.features), `Missing capture-meta features: ${variantLabel}`);
    assert(new Set(variant.features).size === variant.features.length, `Duplicate capture-meta feature: ${variantLabel}`);
    variant.features.forEach((feature) => assert(allowedCaptureFeatures.has(feature), `Invalid capture-meta feature: ${variantLabel}:${feature}`));
    assert(allowedCaptureTypes.has(variant.captureType), `Invalid capture type: ${variantLabel}:${variant.captureType}`);
    assert(variant.generation === undefined || typeof variant.generation === "string", `Invalid capture-meta generation: ${variantLabel}`);
    assert(variant.typicality === undefined || variant.typicality === "" || allowedCaptureTypicality.has(variant.typicality), `Invalid capture-meta typicality: ${variantLabel}:${variant.typicality}`);
    assert(allowedCaptureConfidence.has(variant.confidence), `Invalid capture-meta confidence: ${variantLabel}:${variant.confidence}`);
    assert(typeof variant.scope === "string" && variant.scope.trim(), `Missing capture-meta scope: ${variantLabel}`);
    assert(typeof variant.note === "string" && variant.note.trim(), `Missing capture-meta note: ${variantLabel}`);
    assert(Array.isArray(variant.sources) && variant.sources.length, `Capture-meta variant must be source-backed: ${variantLabel}`);
    variant.sources.forEach((source) => assert(/^https:\/\//.test(source), `Invalid capture-meta source: ${variantLabel}`));
  });
});

assert(fs.existsSync(flagDirectory), "Local flag asset directory is missing");
assert(fs.existsSync(path.join(root, "assets", "flags", "LICENSE")), "Local flag asset license is missing");
const localFlagFiles = fs.readdirSync(flagDirectory).filter((name) => name.endsWith(".svg"));
assert(localFlagFiles.length >= 260, `Local flag asset set is unexpectedly incomplete: ${localFlagFiles.length}`);
localFlagFiles.forEach((name) => {
  const flagSvg = fs.readFileSync(path.join(flagDirectory, name), "utf8");
  assert(/<svg\b/i.test(flagSvg), `Flag asset is not valid SVG markup: ${name}`);
  assert(!/<script\b|\bon\w+\s*=|(?:href|src)\s*=\s*["']https?:\/\//i.test(flagSvg), `Flag asset contains executable or remote content: ${name}`);
});
const explicitFlagFallbacks = new Set(["CYN", "SOL"]);
records.forEach((country) => {
  if (explicitFlagFallbacks.has(country.iso3)) {
    assert(!country.iso2, `Political flag fallback must stay explicit for ${country.iso3}`);
    return;
  }
  assert(/^[A-Z]{2}$/i.test(country.iso2), `Country lacks a usable flag code: ${country.iso3}`);
  assert(fs.existsSync(path.join(flagDirectory, `${country.iso2.toLowerCase()}.svg`)), `Country lacks a local flag asset: ${country.iso3} -> ${country.iso2}`);
});

const mappedPatterns = records.filter((country) => country.roadMapPattern.confidence !== "unknown");
const crossCheckedPatterns = records.filter((country) => country.roadVerification?.status === "cross-checked");
const partialPatterns = records.filter((country) => country.roadVerification?.status === "partial");
const visualEvidenceProfiles = records.reduce((sum, country) => sum + Object.keys(country.visualEvidence.profiles).length, 0);
const sourceBackedVisualProfiles = records.reduce((sum, country) => sum + Object.values(country.visualEvidence.profiles).filter((profile) => profile.sources.length).length, 0);
const captureMetaVariants = records.reduce((sum, country) => sum + country.captureMeta.variants.length, 0);
const sourceBackedCaptureMetaVariants = records.reduce((sum, country) => sum + country.captureMeta.variants.filter((variant) => variant.sources.length).length, 0);
const captureMetaCountries = records.filter((country) => country.captureMeta.variants.length).length;
assert(mappedPatterns.length >= 200, "Road-map patterns should cover all countries with representative public roads");
assert(crossCheckedPatterns.length >= 35, "Priority countries should retain a substantial cross-checked road-pattern set");
assert(captureMetaCountries >= 20 && captureMetaVariants >= 30, "Google-car meta should retain the curated core plus conservative special-coverage variants");
assert(sourceBackedCaptureMetaVariants === captureMetaVariants, "Every curated Google-car meta variant must remain source-backed");
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
assert(COUNTRIES.PHL.roadStyles.length >= 2 && COUNTRIES.PHL.roadStyles.every((style) => style.surface === "concrete" && style.surfaceDetail === "concrete-slabs"), "Philippine road diagrams must retain concrete slab surfaces and joints");
assert(COUNTRIES.RUS.iso2 === "RU" && COUNTRIES.PHL.iso2 === "PH", "Russia and the Philippines must have local flag asset codes");
assert(
  ["white", "yellow"].every((color) => COUNTRIES.RUS.roadLineFilterVariants?.centerColors?.includes(color)
    && COUNTRIES.RUS.roadLineFilterVariants?.edgeColors?.includes(color)),
  "Russia must remain eligible for white and yellow center-line and edge-line filters",
);
assert(/Region|Straße|Aufnahmestand/i.test(COUNTRIES.RUS.roadLineFilterVariants?.scope || ""), "Russia's variable road-line filter behavior must explain its regional scope");
assert(COUNTRIES.NOR.iso2 === "NO" && COUNTRIES.FRA.iso2 === "FR" && COUNTRIES.TWN.iso2 === "TW" && COUNTRIES.KOS.iso2 === "XK", "Known Natural Earth flag-code gaps must be normalized");
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
for (const iso3 of ["MEX", "BRA", "JPN", "MYS"]) {
  assert(COUNTRIES[iso3].stopSign.format === "local-or-multilingual", `${iso3} must support the other-text stop-sign filter`);
  assert(COUNTRIES[iso3].stopSign.confidence === "high" && COUNTRIES[iso3].stopSign.sources.length, `${iso3} other-text stop-sign data must be source-backed`);
}
for (const iso3 of ["USA", "GBR", "FRA"]) {
  assert(COUNTRIES[iso3].stopSign.format === "stop-only", `${iso3} must be excluded by the other-text stop-sign filter`);
}
assert(COUNTRIES.CAN.stopSign.format === "variable", "Canada's regional stop-sign text must remain uncertain");
assert(COUNTRIES.ATA.stopSign.format === "unknown", "Unknown Antarctic stop-sign data must remain uncertain");
for (const iso3 of ["USA", "DEU", "FRA"]) {
  assert(COUNTRIES[iso3].roadMapPattern.leftEdge.color === "white" || COUNTRIES[iso3].roadMapPattern.rightEdge.color === "white", `${iso3} must support the white-edge filter`);
}
for (const iso3 of ["ZAF", "BWA"]) {
  assert(COUNTRIES[iso3].roadVerification?.status === "cross-checked", `${iso3} edge-color exclusion must be source-checked`);
  assert(COUNTRIES[iso3].roadMapPattern.leftEdge.color === "yellow" && COUNTRIES[iso3].roadMapPattern.rightEdge.color === "yellow", `${iso3} must be excluded by the white-edge filter`);
}
assert(/weiße[^.]{0,30}kennzeichen/i.test(COUNTRIES.DEU.licensePlates.description), "Germany must support the white-plate filter");
for (const iso3 of ["NLD", "LUX"]) {
  assert(/gelb/i.test(COUNTRIES[iso3].licensePlates.description), `${iso3} must be excluded by the white-plate filter`);
}
assert(COUNTRIES.USA.visualEvidence.profiles.warningSign.values.includes("diamond-yellow") && COUNTRIES.USA.visualEvidence.profiles.warningSign.confidence === "high", "USA must have a sourced high-confidence yellow-diamond warning-sign profile");
assert(COUNTRIES.GBR.visualEvidence.profiles.plateLayout.values.includes("white-yellow") && COUNTRIES.GBR.visualEvidence.profiles.plateLayout.sources.length, "Great Britain must have a sourced white/yellow plate profile");
for (const iso3 of ["NLD", "LUX", "COL"]) {
  assert(COUNTRIES[iso3].visualEvidence.profiles.plateLayout.values.includes("yellow-yellow"), `${iso3} must have yellow plates at both ends`);
  assert(COUNTRIES[iso3].visualEvidence.profiles.plateLayout.sources.length, `${iso3} yellow plate layout must be source-backed`);
}
assert(COUNTRIES.JPN.visualEvidence.profiles.camera.values.includes("low") && COUNTRIES.JPN.visualEvidence.profiles.camera.exclusion === "soft", "Japan's low-camera clue must remain a soft hint");
assert(COUNTRIES.BRA.visualEvidence.profiles.signBack.values.includes("dark") && COUNTRIES.BRA.visualEvidence.profiles.signBack.exclusion === "soft", "Brazil's dark sign-back clue must remain a soft hint");
assert(Object.keys(COUNTRIES.ATA.visualEvidence.profiles).length === 0, "Unknown Antarctic visual evidence must remain empty instead of being guessed");

function hasCaptureVariant(iso3, { features = [], captureType = "" } = {}) {
  return COUNTRIES[iso3].captureMeta.variants.some((variant) => (
    (!captureType || variant.captureType === captureType)
    && features.every((feature) => variant.features.includes(feature))
  ));
}

const coreCaptureMetaIso3 = ["GTM", "DOM", "GHA", "SEN", "KEN", "MNG", "LAO", "KGZ", "BGD", "ARE", "NGA", "FRO", "UGA", "VNM", "MDG", "CRI"];
coreCaptureMetaIso3.forEach((iso3) => {
  assert(COUNTRIES[iso3].captureMeta.variants.length, `${iso3} must have curated capture-meta variants`);
  assert(COUNTRIES[iso3].captureMeta.variants.every((variant) => variant.sources.length), `${iso3} capture-meta variants must be source-backed`);
});
for (const iso3 of ["GTM", "SEN", "LAO", "KGZ", "BGD"]) {
  assert(hasCaptureVariant(iso3, { features: ["roof-rack", "mirrors"], captureType: "car" }), `${iso3} must retain its sourced roof-rack and mirror combination`);
}
for (const iso3 of ["DOM", "GHA"]) {
  assert(hasCaptureVariant(iso3, { features: ["roof-rack", "tape"], captureType: "car" }), `${iso3} must retain its sourced roof-rack and tape combination`);
}
assert(hasCaptureVariant("KEN", { features: ["roof-rack", "snorkel"], captureType: "car" }), "Kenya must retain its sourced roof-rack and snorkel combination");
assert(hasCaptureVariant("MNG", { features: ["roof-rack", "snorkel"], captureType: "car" }), "Mongolia must retain a sourced roof-rack and snorkel variant");
assert(hasCaptureVariant("MNG", { features: ["equipment"], captureType: "car" }), "Mongolia must retain a sourced visible-equipment variant");
for (const iso3 of ["ARE", "NGA", "FRO"]) {
  assert(hasCaptureVariant(iso3, { features: ["roof-rack"], captureType: "car" }), `${iso3} must retain a sourced roof-rack variant`);
}
assert(hasCaptureVariant("UGA", { features: ["mirrors"], captureType: "car" }), "Uganda must retain its sourced visible-mirror variant");
assert(hasCaptureVariant("VNM", { captureType: "motorcycle" }), "Vietnam must retain its sourced motorcycle coverage variant");
assert(hasCaptureVariant("MDG", { captureType: "trekker" }) && hasCaptureVariant("MDG", { captureType: "boat" }), "Madagascar must retain sourced trekker and boat coverage variants");
assert(hasCaptureVariant("CRI", { captureType: "trekker" }) || hasCaptureVariant("CRI", { captureType: "boat" }), "Costa Rica must retain a sourced non-car coverage variant without being reduced to it");
assert(COUNTRIES.ATA.captureMeta.variants.length === 0, "Unknown Antarctic capture meta must remain empty instead of being guessed");

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
const helperReadme = fs.readFileSync(path.join(root, "helper", "README.md"), "utf8");
const downloadReadme = fs.readFileSync(path.join(root, "downloads", "README.txt"), "utf8");
const helperProgram = fs.readFileSync(path.join(root, "helper", "GeoGuessrAiHelper", "Program.cs"), "utf8");
const helperProject = fs.readFileSync(path.join(root, "helper", "GeoGuessrAiHelper", "GeoGuessrAiHelper.csproj"), "utf8");
const mockGroqServer = fs.readFileSync(path.join(root, "tools", "mock-groq-server.py"), "utf8");
const gitignore = fs.readFileSync(path.join(root, ".gitignore"), "utf8");
const initialCountryPanelMarkup = html.match(/<aside\b[^>]*id=["']countryPanel["'][^>]*>([\s\S]*?)<\/aside>/i)?.[1] || "";
const initialCountryPanelText = initialCountryPanelMarkup.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
assert(initialCountryPanelMarkup, "Initial country panel markup is missing");
assert(/\bempty-state\b/.test(initialCountryPanelMarkup), "Initial country panel must use the neutral empty state");
assert(/Wähle ein Land/i.test(initialCountryPanelText), "Initial country panel needs a neutral German selection heading");
assert(/Karte/i.test(initialCountryPanelText), "Initial country panel must explain map-based country selection in German");
for (const removedId of ["browserButton", "countryBrowser", "compareButton", "comparisonModal"]) {
  assert(!new RegExp(`id=["']${removedId}["']`, "i").test(html), `Removed browser or comparison UI must stay absent: ${removedId}`);
}
assert(!/Südafrika/i.test(initialCountryPanelText), "South Africa must not be displayed in the initial country panel");
assert(!/\bdata-select-country\b/i.test(initialCountryPanelMarkup), "Initial country panel must not contain a preselected country action");
assert(/\bselectedIso\s*:\s*null\b/.test(script), "Application state must start without a selected country");
assert(!/\bselectCountry\s*\(\s*["']ZAF["']\s*,\s*false\s*,\s*false\s*\)\s*;/.test(script), "South Africa must not be selected during application startup");
const screenshotAnalysisIds = [
  "matcherButton", "roadMatcher", "roadScreenshot", "matcherPreview", "matcherPreviewImage", "removeScreenshot",
  "stopOnlyFilterChip", "stopOtherFilterChip", "whiteEdgeFilterChip", "whitePlateFilterChip",
];
for (const id of screenshotAnalysisIds) {
  const occurrences = html.match(new RegExp(`id=["']${id}["']`, "g")) || [];
  assert(occurrences.length === 1, `Screenshot-analysis or main-filter element must exist exactly once: ${id}`);
}
const filterDashboardIds = [
  "filterDashboard", "filterPanel", "filterResultCount", "activeFilterCount", "activeFilterSummary", "allFilterChip",
];
for (const id of filterDashboardIds) {
  const occurrences = html.match(new RegExp(`id=["']${id}["']`, "g")) || [];
  assert(occurrences.length === 1, `Grouped filter-dashboard element must exist exactly once: ${id}`);
}
const carMetaFilterIds = [
  "carMetaFilters", "roofRackFilterChip", "mirrorFilterChip", "snorkelFilterChip", "equipmentFilterChip", "tapeFilterChip",
  "motorcycleFilterChip", "trekkerFilterChip", "boatFilterChip",
];
for (const id of carMetaFilterIds) {
  const occurrences = html.match(new RegExp(`id=["']${id}["']`, "g")) || [];
  assert(occurrences.length === 1, `Google-car meta filter element must exist exactly once: ${id}`);
}
const aiHelperIds = ["aiHelperCard", "aiHelperStatus", "analyzeScreenshotButton", "resetAiAnalysisButton", "aiAnalysisResult", "downloadAiHelper"];
for (const id of aiHelperIds) {
  const occurrences = html.match(new RegExp(`id=["']${id}["']`, "g")) || [];
  assert(occurrences.length === 1, `Optional AI helper element must exist exactly once: ${id}`);
}
const updateNoticeIds = ["updateNotice", "dismissUpdateNotice", "updateNoticeHeading", "updateNoticeText", "updateNoticeTime"];
for (const id of updateNoticeIds) {
  const occurrences = html.match(new RegExp(`id=["']${id}["']`, "g")) || [];
  assert(occurrences.length === 1, `Update notice element must exist exactly once: ${id}`);
}
const updateNoticeMarkup = html.match(/<aside\b[^>]*id=["']updateNotice["'][^>]*>[\s\S]*?<\/aside>/i)?.[0] || "";
assert(/role=["']status["']/i.test(updateNoticeMarkup) && /aria-live=["']polite["']/i.test(updateNoticeMarkup) && /aria-atomic=["']true["']/i.test(updateNoticeMarkup), "Update notice needs an accessible polite live region");
assert(/data-update-id=["']2026-08-11-ki-endtipp-filterkontext-v6["']/i.test(updateNoticeMarkup), "Update notice needs the current AI best-guess version identifier");
assert(/data-published-at=["']2026-08-11T17:46:16\+02:00["']/i.test(updateNoticeMarkup), "Update notice needs the current AI best-guess publication timestamp");
assert(/<button\b[^>]*id=["']dismissUpdateNotice["']/i.test(updateNoticeMarkup), "The complete update notice must be dismissible with a real button");
assert(/11\. August 2026[^<]*17:46 Uhr/i.test(updateNoticeMarkup), "Update notice must show the current publication date and time without JavaScript");
const updateNoticeText = updateNoticeMarkup.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
assert(/genau einen besten Ländertipp/i.test(updateNoticeText), "Update notice must announce the mandatory single-country best guess");
assert(/auch bei Unsicherheit/i.test(updateNoticeText), "Update notice must keep low-confidence guesses visibly uncertain");
assert(/zuvor ausgewählten Filter/i.test(updateNoticeText), "Update notice must announce that prior filters are supplied to the AI");
assert(/Straßen-Screenshot als Gesamtbild auswerten/.test(html), "AI screenshot area needs a visible whole-image heading");
assert(/Straße[^<]*Vegetation[^<]*Schilder[^<]*Kennzeichen[^<]*Landschaft/i.test(html)
  || /Gesamtbild[^<]{0,180}(?:Screenshot|Filter)|Screenshot[^<]{0,180}(?:Gesamtbild|gemeinsam)/i.test(html), "AI screenshot area must visibly promise whole-image analysis");
assert(/keine manuelle Merkmalsauswahl|zuvor ausgewählte Filter/i.test(html), "AI screenshot area must distinguish the external filter context from removed manual screenshot controls");
assert(/Screenshot auswählen/.test(html) && /PNG, JPG oder WebP[^<]*zunächst nur lokal/.test(html), "Screenshot picker must visibly describe its initially local image formats");
assert(/Länder mit KI ein- und ausschließen/.test(html)
  && (/wahrscheinlichen[^<]*möglichen[^<]*(?:ausgeschlossenen|unwahrscheinlichen) Ländern/i.test(html)
    || /verpflichtenden besten Ländertipp[^<]*möglichen[^<]*ausgeschlossenen Ländern/i.test(html)), "AI screenshot area must visibly describe direct country categorization");
const screenshotInputMarkup = html.match(/<input\b[^>]*id=["']roadScreenshot["'][^>]*>/i)?.[0] || "";
assert(/type=["']file["']/i.test(screenshotInputMarkup) && /accept=["']image\/(?:\*|[^"']+)["']/i.test(screenshotInputMarkup), "Screenshot input must be a local image-only file picker");
const aiHelperCardMarkup = html.match(/<section\b[^>]*id=["']aiHelperCard["'][^>]*>[\s\S]*?<\/section>/i)?.[0] || "";
const aiHelperStatusMarkup = html.match(/<[^>]+\bid=["']aiHelperStatus["'][^>]*>/i)?.[0] || "";
const analyzeScreenshotButtonMarkup = html.match(/<button\b[^>]*id=["']analyzeScreenshotButton["'][^>]*>[\s\S]*?<\/button>/i)?.[0] || "";
const resetAiAnalysisButtonMarkup = html.match(/<button\b[^>]*id=["']resetAiAnalysisButton["'][^>]*>[\s\S]*?<\/button>/i)?.[0] || "";
const aiAnalysisResultMarkup = html.match(/<[^>]+\bid=["']aiAnalysisResult["'][^>]*>/i)?.[0] || "";
const downloadAiHelperMarkup = html.match(/<a\b[^>]*id=["']downloadAiHelper["'][^>]*>[\s\S]*?<\/a>/i)?.[0] || "";
assert(aiHelperCardMarkup, "Optional AI helper card is missing");
assert(/role=["']status["']/i.test(aiHelperStatusMarkup) && /aria-live=["']polite["']/i.test(aiHelperStatusMarkup) && /data-state=["']unknown["']/i.test(aiHelperStatusMarkup), "AI helper status needs an accessible initial state");
assert(/type=["']button["']/i.test(analyzeScreenshotButtonMarkup) && /\bdisabled\b/i.test(analyzeScreenshotButtonMarkup), "AI analysis button must start disabled until a supported screenshot exists");
assert(/type=["']button["']/i.test(resetAiAnalysisButtonMarkup) && /\bdisabled\b/i.test(resetAiAnalysisButtonMarkup), "AI analysis reset must start disabled before an image or result exists");
assert(/aria-live=["']polite["']/i.test(aiAnalysisResultMarkup) && /\bhidden\b/i.test(aiAnalysisResultMarkup), "AI analysis result needs a hidden polite live region");
assert(/href=["']downloads\/GeoGuessr-KI-Helfer\.exe["']/i.test(downloadAiHelperMarkup), "AI helper download must use the repository-local Windows executable");
const aiHelperDownloadPath = path.join(root, "downloads", "GeoGuessr-KI-Helfer.exe");
assert(fs.existsSync(aiHelperDownloadPath) && fs.statSync(aiHelperDownloadPath).size > 100000, "AI helper download is missing or still a placeholder");
assert(/https:\/\/console\.groq\.com\/keys/i.test(aiHelperCardMarkup), "AI helper card must link to the official Groq key page");
assert(/Schlüssel[^<]*ausschließlich[^<]*lokalen Helfer/i.test(aiHelperCardMarkup), "AI helper card must explain that the key stays in the local helper");
assert(/Screenshot[^<]*nur nach deinem Klick[^<]*an Groq/i.test(aiHelperCardMarkup), "AI helper card must disclose click-triggered screenshot transfer to Groq");
const browserCredentialInputs = (html.match(/<input\b[^>]*>/gi) || []).filter((markup) =>
  /type=["']password["']|(?:id|name|placeholder|autocomplete)=["'][^"']*(?:api.?key|groq|token|schlüssel)/i.test(markup)
);
assert(browserCredentialInputs.length === 0, "The browser UI must never contain an API-key or token input");
const roadMatcherStart = html.search(/<section\b[^>]*id=["']roadMatcher["']/i);
const mapCardStart = roadMatcherStart >= 0 ? html.slice(roadMatcherStart).search(/<div\b[^>]*class=["'][^"']*\bmap-card\b/i) : -1;
const roadMatcherMarkup = roadMatcherStart >= 0 && mapCardStart > 0
  ? html.slice(roadMatcherStart, roadMatcherStart + mapCardStart)
  : "";
assert(roadMatcherMarkup, "AI-only screenshot section is missing");
assert(!/<select\b/i.test(roadMatcherMarkup), "AI-only screenshot section must not contain manual select controls");
assert(!/<input\b[^>]*type=["']checkbox["']/i.test(roadMatcherMarkup), "AI-only screenshot section must not contain manual checkbox controls");
assert((roadMatcherMarkup.match(/<input\b/gi) || []).length === 1 && roadMatcherMarkup.includes(screenshotInputMarkup), "AI-only screenshot section may contain only its image file input");
const filterDashboardMarkup = elementMarkupById(html, "filterDashboard");
const filterPanelMarkup = elementMarkupById(html, "filterPanel");
const filterResultCountMarkup = elementMarkupById(html, "filterResultCount");
const activeFilterCountMarkup = elementMarkupById(html, "activeFilterCount");
const activeFilterSummaryMarkup = elementMarkupById(html, "activeFilterSummary");
const allFilterChipMarkup = elementMarkupById(html, "allFilterChip");
const allFilterChipOpeningTag = allFilterChipMarkup.match(/^<button\b[^>]*>/i)?.[0] || "";
const filterStripMarkup = elementMarkupById(html, "filters");
const carMetaFiltersMarkup = elementMarkupById(html, "carMetaFilters");

assert(filterDashboardMarkup, "Grouped filter dashboard is missing");
for (const id of ["filterPanel", "filterResultCount", "activeFilterCount", "activeFilterSummary", "allFilterChip", "filters", "carMetaFilters"]) {
  assert(filterDashboardMarkup.includes(`id="${id}"`) || filterDashboardMarkup.includes(`id='${id}'`), `${id} must live inside the filter dashboard`);
}
assert(/206\s+Treffer/i.test(filterResultCountMarkup), "Persistent filter dashboard must show the initial result count without JavaScript");
assert(/role=["']status["']/i.test(activeFilterSummaryMarkup) && /aria-live=["']polite["']/i.test(activeFilterSummaryMarkup) && /aria-atomic=["']true["']/i.test(activeFilterSummaryMarkup), "Active-filter summary must be an atomic polite status region");
assert(/>\s*0\s*</.test(activeFilterCountMarkup), "Active-filter count must visibly start at zero");
assert(/type=["']button["']/i.test(allFilterChipOpeningTag), "Everything-reset control must be a real non-submit button");
assert(/\bdisabled\b/i.test(allFilterChipOpeningTag), "Everything-reset control must start disabled while no filter is selected");
assert(!/aria-pressed=/i.test(allFilterChipOpeningTag), "Everything-reset control is an action, not a persistent toggle");
assert(/(?:Alles|Filter)[^<]{0,30}(?:zurücksetzen|löschen)|Zurücksetzen/i.test(allFilterChipMarkup.replace(/<[^>]+>/g, " ")), "Everything-reset control needs an unambiguous German reset label");
assert(!filterStripMarkup.includes(allFilterChipMarkup), "Everything-reset action must sit outside the selectable filter-chip collection");

function filterGroupAccessibleName(markup) {
  const openingTag = markup.match(/^<[^>]+>/i)?.[0] || "";
  const directLabel = openingTag.match(/\baria-label=["']([^"']+)["']/i)?.[1];
  if (directLabel) return directLabel.replace(/\s+/g, " ").trim();
  const labelledBy = openingTag.match(/\baria-labelledby=["']([^"']+)["']/i)?.[1];
  if (!labelledBy) return "";
  return labelledBy.split(/\s+/).map((id) => (
    elementMarkupById(filterPanelMarkup, id).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  )).filter(Boolean).join(" ");
}

const categoryTabMarkups = elementsWithRole(filterPanelMarkup, "tab");
const categoryPanelMarkups = elementsWithRole(filterPanelMarkup, "tabpanel");
assert(categoryTabMarkups.length === 5 && categoryPanelMarkups.length === 5, "Persistent dashboard must expose exactly five accessible category tabs and panels");
assert(categoryTabMarkups.filter((markup) => /aria-selected=["']true["']/i.test(markup)).length === 1, "Exactly one filter category must start selected");
assert(categoryPanelMarkups.filter((markup) => !/^<[^>]+\bhidden\b/i.test(markup)).length === 1, "Exactly one filter category panel must start visible");
for (const category of ["basis", "road", "scene", "objects", "camera"]) {
  assert(new RegExp(`data-filter-tab=["']${category}["']`, "i").test(filterPanelMarkup), `Filter category tab is missing: ${category}`);
  assert(new RegExp(`data-filter-panel=["']${category}["']`, "i").test(filterPanelMarkup), `Filter category panel is missing: ${category}`);
}

const filterGroupMarkups = elementsWithRole(filterPanelMarkup, "group").filter((markup) =>
  /class=["'][^"']*\bfilter-group\b/i.test(markup.match(/^<[^>]+>/)?.[0] || "")
);
assert(filterGroupMarkups.length === 12, `Filter dashboard must expose twelve focused accessible groups, found ${filterGroupMarkups.length}`);
const expectedFilterGroups = [
  { name: /^Verkehrsseite$/i, label: "Verkehrsseite", patterns: [/traffic:left/i, /traffic:right/i] },
  { name: /^Weltregion$/i, label: "Weltregion", patterns: [/continent:Europa/i, /continent:Afrika/i, /continent:Asien/i, /continent:Nordamerika/i, /continent:Südamerika/i, /continent:Ozeanien/i] },
  { name: /^Straßenlinien$/i, label: "Straßenlinien", ids: ["whiteEdgeFilterChip"] },
  { name: /^Kennzeichen$/i, label: "Kennzeichen", ids: ["whitePlateFilterChip"], patterns: [/plateLayout/i] },
  { name: /^Schilder$/i, label: "Schilder", ids: ["stopOnlyFilterChip", "stopOtherFilterChip"], patterns: [/warningSign/i] },
  { name: /^Landschaft$/i, label: "Landschaft", patterns: [/terrain:trop/i, /terrain:wüste/i, /terrain:berg/i, /terrain:flach/i, /terrain:wald/i, /terrain:insel/i] },
  { name: /^Sprache\s*\/\s*Schrift$/i, label: "Sprache / Schrift", patterns: [/language:Englisch/i, /language:Spanisch/i, /language:Portugiesisch/i] },
  { name: /^Leitpfosten$/i, label: "Leitpfosten", patterns: [/data-quick-criterion=["']bollard["']/i] },
  { name: /^Masten\s*&\s*Schildrückseite$/i, label: "Masten & Schildrückseite", patterns: [/data-quick-criterion=["']pole["']/i, /data-quick-criterion=["']signBack["']/i] },
  { name: /^Straßenrand$/i, label: "Straßenrand", patterns: [/data-quick-criterion=["']shoulder["']/i] },
  { name: /^Sichtbares Fahrzeug$/i, label: "Sichtbares Fahrzeug", ids: ["roofRackFilterChip", "mirrorFilterChip", "snorkelFilterChip", "equipmentFilterChip", "tapeFilterChip"] },
  { name: /^Aufnahmeart$/i, label: "Aufnahmeart", ids: ["motorcycleFilterChip", "trekkerFilterChip", "boatFilterChip"], patterns: [/data-quick-criterion=["']camera["']/i] },
];
for (const expectedGroup of expectedFilterGroups) {
  const groupMarkup = filterGroupMarkups.find((markup) => expectedGroup.name.test(filterGroupAccessibleName(markup)));
  assert(groupMarkup, `Accessible filter group is missing: ${expectedGroup.label}`);
  for (const id of expectedGroup.ids || []) {
    assert(groupMarkup.includes(`id="${id}"`) || groupMarkup.includes(`id='${id}'`), `${id} must belong to the ${expectedGroup.label} group`);
  }
  for (const pattern of expectedGroup.patterns || []) {
    assert(pattern.test(groupMarkup), `${expectedGroup.label} group is missing an expected option: ${pattern}`);
  }
}

const stopOnlyFilterChipMarkup = html.match(/<button\b[^>]*id=["']stopOnlyFilterChip["'][^>]*>[\s\S]*?<\/button>/i)?.[0] || "";
const stopOnlyFilterChipOpeningTag = stopOnlyFilterChipMarkup.match(/^<button\b[^>]*>/i)?.[0] || "";
assert(filterStripMarkup && filterPanelMarkup.includes(stopOnlyFilterChipMarkup), "STOP-only filter chip must be available in the grouped filter panel");
assert(/class=["'][^"']*\bfilter-chip\b/i.test(stopOnlyFilterChipMarkup), "STOP-only main control must use the standard filter-chip styling");
assert(/\bdata-matcher-stop-only(?:\s|=|>)/i.test(stopOnlyFilterChipMarkup), "STOP-only filter chip needs its dedicated matcher data attribute");
assert(!/\bdata-filter\s*=/i.test(stopOnlyFilterChipMarkup), "STOP-only filter chip must not enter the generic country-filter handler");
assert(!/\baria-controls\s*=/i.test(stopOnlyFilterChipMarkup), "Independent STOP-only main filter must not reference a removed screenshot control");
assert(/\baria-pressed=["']false["']/i.test(stopOnlyFilterChipMarkup), "STOP-only filter chip must expose its initial toggle state");
const stopOnlyFilterChipText = stopOnlyFilterChipMarkup.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
assert(/STOP:\s*nur STOP/i.test(stopOnlyFilterChipText) && stopOnlyFilterChipText.length <= 24, "STOP-only filter chip needs the compact visible label");
assert(/aria-label=["'][^"']*Stoppschild[^"']*ausschließlich STOP/i.test(stopOnlyFilterChipOpeningTag), "STOP-only filter chip needs its full accessible meaning");

for (const [id, dataAttribute, labelPattern] of [
  ["stopOtherFilterChip", "data-matcher-stop-other", /STOP:\s*anderer Text/i],
  ["whiteEdgeFilterChip", "data-matcher-edge-white", /Weiße Randlinie/i],
  ["whitePlateFilterChip", "data-matcher-plate-white", /Weiße Kennzeichen/i],
]) {
  const markup = html.match(new RegExp(`<button\\b[^>]*id=["']${id}["'][^>]*>[\\s\\S]*?<\\/button>`, "i"))?.[0] || "";
  const openingTag = markup.match(/^<button\b[^>]*>/i)?.[0] || "";
  assert(filterPanelMarkup.includes(markup), `${id} must be available in the grouped filter panel`);
  assert(/class=["'][^"']*\bfilter-chip\b/i.test(markup), `${id} must use the standard filter-chip styling`);
  assert(new RegExp(`\\b${dataAttribute}(?:\\s|=|>)`, "i").test(markup), `${id} needs its dedicated matcher data attribute`);
  assert(!/\bdata-filter\s*=/i.test(markup), `${id} must not enter the generic country-filter handler`);
  assert(!/\baria-controls\s*=/i.test(markup), `${id} must not reference a removed screenshot control`);
  assert(/\baria-pressed=["']false["']/i.test(markup), `${id} must expose its initial toggle state`);
  assert(labelPattern.test(markup.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()), `${id} needs its expected visible German label`);
}
const visibleHtmlText = html
  .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
  .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ");
assert(/(?:nur|ausschließlich)[^.!?]{0,40}\bSTOP\b|\bSTOP\b[^.!?]{0,40}(?:nur|ausschließlich)/i.test(visibleHtmlText), "Independent STOP-only main filter needs a concise visible label");
assert(carMetaFiltersMarkup, "A dedicated Google-car and camera-meta filter collection is missing");
for (const [id, labelPattern] of [
  ["roofRackFilterChip", /Dach(?:gepäck)?träger/i],
  ["mirrorFilterChip", /Spiegel/i],
  ["snorkelFilterChip", /Schnorchel/i],
  ["equipmentFilterChip", /(?:Zelt|Gepäck|Ausrüstung)/i],
  ["tapeFilterChip", /(?:Klebeband|schwarze Streifen)/i],
  ["motorcycleFilterChip", /Motorrad/i],
  ["trekkerFilterChip", /Trekker/i],
  ["boatFilterChip", /Boot/i],
]) {
  const markup = html.match(new RegExp(`<button\\b[^>]*id=["']${id}["'][^>]*>[\\s\\S]*?<\\/button>`, "i"))?.[0] || "";
  assert(carMetaFiltersMarkup.includes(markup), `${id} must be available in the dedicated Google-car meta group`);
  assert(/class=["'][^"']*\bfilter-chip\b/i.test(markup), `${id} must reuse the standard compact filter-chip styling`);
  assert(/\baria-pressed=["']false["']/i.test(markup), `${id} must expose its inactive initial toggle state`);
  assert(labelPattern.test(markup.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()), `${id} needs a concise visible German label`);
}
assert(/(?:Google-Car|Fahrzeug|Kamera)[^.!?]{0,80}(?:Meta|Aufnahme)/i.test(visibleHtmlText), "Google-car meta filters need a visible explanatory heading");
assert(/(?:nicht erfasst|unbekannt|keine Daten)[^.!?]{0,100}(?:bleiben möglich|nicht automatisch ausgeschlossen)|nicht automatisch ausgeschlossen[^.!?]{0,100}(?:nicht erfasst|unbekannt|keine Daten)/i.test(visibleHtmlText), "Google-car meta filters must explain that unknown coverage does not exclude countries automatically");

assert(html.includes('id="roadLineOverlays"'), "Visible road-line overlay layer is missing");
assert(html.includes('id="countryClipPaths"'), "Country clip-path layer is missing");
assert(html.includes('id="countryBorders"'), "Top country-border layer is missing");
assert(html.includes('class="map-legend"'), "Compact in-map legend is missing");
assert(/id="resetZoom"[^>]*>Reset</.test(html), "Map controls must include a textual Reset button");
assert(script.includes("zoomLevelForScale") && script.includes("map-road-surface") && script.includes("map-road-neutral-line"), "Road-sample LOD implementation is incomplete");
assert(script.includes("URL.createObjectURL") && script.includes("URL.revokeObjectURL"), "Screenshot preview must use and release a local object URL");
for (const className of ["is-ai-best-guess", "is-ai-likely", "is-ai-possible", "is-ai-excluded", "is-ai-unassessed"]) {
  assert(script.includes(className), `Direct AI country analysis does not assign map class: ${className}`);
}
assert(css.includes(".is-matcher-match") && css.includes(".is-matcher-possible") && css.includes(".is-ai-excluded") && css.includes(".is-ai-best-guess") && css.includes(".has-ai-analysis"), "Best guess, likely, possible, excluded, or active AI map states lack distinct styling");
assert(/countryFlagMarkup/.test(script) && /assets\/flags\/4x3\//.test(script), "Selected-country panel lacks local SVG flag rendering");
assert(/class=\"country-flag\"/.test(script) && /Flagge von/.test(script), "Selected-country flag lacks its prominent accessible panel container");
assert(/initializeUpdateNotice/.test(script) && /dismissUpdateNotice/.test(script) && /geoguessr-atlas-seen-update-id/.test(script), "Versioned update notice behavior is incomplete");
assert(/Europe\/Luxembourg/.test(script) && /Intl\.DateTimeFormat/.test(script), "Update notice does not format its publication time for Luxembourg");
assert(/road-slab-joints/.test(script) && /concrete-slabs/.test(script), "Philippine concrete slab joints are not rendered by the road diagram");
assert(/selectionIso/.test(script) && /event\.target\.closest\?\.\(\"\[data-iso\]\"\)/.test(script), "Pointer-captured map clicks are not routed back to the selected country");
assert(/renderDataQuality/.test(script) && /Datenqualität und Quellen/.test(script), "Country panel lacks evidence quality and source rendering");
for (const id of ["stopOnlyFilterChip", "stopOtherFilterChip", "whiteEdgeFilterChip", "whitePlateFilterChip"]) {
  assert(script.includes(id), `Independent main clue filter is not handled by the application script: ${id}`);
}
for (const id of carMetaFilterIds) {
  assert(script.includes(id), `Google-car meta filter is not handled by the application script: ${id}`);
}
for (const id of filterDashboardIds) {
  assert(script.includes(id), `Grouped filter-dashboard element is not handled by the application script: ${id}`);
}
assert(/syncMatcherFilterChips/.test(script) && /aria-pressed/.test(script), "Main matcher filter chips are not synchronized by the application script");
assert(/selectFilterTab/.test(script) && /aria-selected/.test(script) && /data-filter-panel/.test(script), "Filter category tabs must synchronize selected tabs and visible panels");
assert(/activeFilterCount/.test(script) && /activeFilterSummary/.test(script), "Combined active-filter count and summary are not updated by the application script");
assert(/keydown/.test(script) && /ArrowLeft/.test(script) && /ArrowRight/.test(script) && /Home/.test(script) && /End/.test(script), "Filter category tabs must support keyboard navigation");
assert(/quick\.stopOnly\s*=\s*!quick\.stopOnly[\s\S]{0,120}quick\.stopOther\s*=\s*false[\s\S]{0,220}quick\.stopOther\s*=\s*!quick\.stopOther[\s\S]{0,120}quick\.stopOnly\s*=\s*false/.test(script), "Independent STOP-only and other-text main filters must remain mutually exclusive");
assert(/quick\.edgeColor\s*=\s*quick\.edgeColor\s*===\s*["']white["']\s*\?\s*["']["']\s*:\s*["']white["']/.test(script), "White-edge main filter must toggle its independent quick criterion");
assert(/quick\.plateColor\s*=\s*quick\.plateColor\s*===\s*["']white["']\s*\?\s*["']["']\s*:\s*["']white["']/.test(script), "White-plate main filter must toggle its independent quick criterion");
assert(/checkAiHelperHealth/.test(script) && /analyzeMatcherScreenshot/.test(script), "Optional AI health and screenshot-analysis functions are incomplete");
assert(/parseAiCountryAnalysis/.test(script) && /applyAiCountryAnalysis/.test(script) && /renderAiCountryAnalysis/.test(script), "Direct countryAnalysis parsing, application, or rendering is incomplete");
assert(/payload\?\.countryAnalysis/.test(script) && /imageClues/.test(script) && /countryGroups/.test(script), "Browser must consume the canonical countryAnalysis payload");
assert(/buildAiFilterContext/.test(script) && /filterContext\s*,?\s*\n?\s*\}\)/.test(script) && /version:\s*1[\s\S]{0,120}activeFilters/.test(script), "Browser must send a versioned structured filter context with every screenshot analysis");
assert(/AI_FILTER_CONTEXT_LABELS/.test(script) && /AI_BASE_FILTER_CONTEXT/.test(script), "Browser must map only fixed filter keys and values into the AI request");
for (const [key, value] of [
  ["traffic", "left"], ["traffic", "right"], ["edgeColor", "white"], ["stopSign", "stop-only"],
  ["vehicleFeature", "roof-rack"], ["captureType", "motorcycle"],
]) {
  assert(script.includes(`${key}:${value}`) || (script.includes(`"${key}"`) && script.includes(`"${value}"`)), `AI filter context is missing documented pair: ${key}:${value}`);
}
assert(/raw\.bestGuess/.test(script) && /if\s*\(!bestGuess\)\s*return null/.test(script), "Browser must require or conservatively derive exactly one valid best guess");
assert(/id\s*=\s*["']aiBestGuess["']/.test(script) && /className\s*=\s*["'][^"']*ai-best-guess/.test(script), "Successful AI output must render one prominent #aiBestGuess card");
assert(/bestGuessIso/.test(script) && /is-ai-best-guess/.test(script), "Best guess must receive a dedicated map highlight");
assert(/Filterauswahl geändert/.test(script) && /clearAiAnalysisResult\(\)/.test(script), "Changing filters must invalidate stale AI output and request a fresh analysis");
assert(/AI_LIKELY_CONFIDENCE\s*=\s*0\.6\b/.test(script) && /AI_EXCLUDED_CONFIDENCE\s*=\s*0\.72\b/.test(script), "Direct AI country groups need conservative likely and exclusion thresholds");
assert(/AI_COUNTRY_LIMITS\s*=\s*Object\.freeze\(\{\s*likely:\s*5,\s*possible:\s*10,\s*excluded:\s*12\s*\}\)/.test(script), "Direct AI country groups must enforce the canonical list limits");
for (const category of ["vegetation", "landscape", "bollards", "road", "signs", "plates", "vehicle-meta"]) {
  assert(new RegExp(`["']?${category}["']?\\s*:`).test(script), `Whole-image AI clue category is missing: ${category}`);
}
assert(/JSON\.stringify\(country\.captureMeta\)/.test(script), "Country search index must include structured Google-car meta");
assert(/captureMeta/.test(script) && /(?:Google-Car|Fahrzeug- und Kamera-Meta|Aufnahmemeta)/.test(script), "Selected-country panel must render structured Google-car and camera meta");
assert(!/applyAiObservations\s*\(|renderAiAnalysisResult\s*\(/.test(script), "AI-only screenshot flow must not translate results into manual matcher observations");
assert(/http:\/\/127\.0\.0\.1:43117/.test(script), "Browser must address the local helper on the fixed loopback endpoint");
assert(/X-GeoGuessr-Helper["']?\s*:\s*["']1["']/.test(script), "Local helper requests must include the fixed helper-identification header");
assert(/\/health/.test(script) && /\/analyze/.test(script), "Browser must use the local helper health and analysis endpoints");
assert(/imageDataUrl/.test(script) && /fileName/.test(script) && /filterContext/.test(script), "AI analysis request must contain the documented screenshot fields and structured filter context");
assert(/parseAiConfidence/.test(script) && /\^\[A-Z\]\{3\}\$/.test(script), "AI country analysis must validate confidence values and ISO-3 syntax");
assert(!/api\.groq\.com|Authorization\s*[:=]|Bearer\s+[A-Za-z0-9._-]+|GROQ_API_KEY/.test(script), "Browser code must not contain Groq credentials or call Groq directly");
assert(!/localStorage[\s\S]{0,80}(?:api.?key|groq|token|schlüssel)/i.test(script), "Browser storage must never be used for a Groq credential");
assert(/https:\/\/console\.groq\.com\/keys/.test(readme) && /https:\/\/console\.groq\.com\/docs\/rate-limits/.test(readme), "README must link the official Groq key page and changeable free-tier limits");
assert(/%LOCALAPPDATA%\\GeoGuessr-KI-Helfer\\groq-key\.dpapi/.test(readme) && /GeoGuessr-KI-Helfer\.exe --reset-key/.test(readme), "README must document the DPAPI location and exact key-reset command");
assert(/127\.0\.0\.1[^\n]*Computer des jeweiligen Besuchers/i.test(readme), "README must explain why friends cannot use the owner's local helper key");
assert(/countryAnalysis/.test(readme) && /imageClues/.test(readme) && /likely/.test(readme) && /possible/.test(readme) && /excluded/.test(readme), "README must document the canonical direct-country response fields");
assert(/bestGuess/.test(readme) && /genau ein(?:en)?[^.\n]{0,80}(?:Land|Ländertipp)|(?:Land|Ländertipp)[^.\n]{0,80}festlegen/i.test(readme), "README must document the mandatory single-country best guess");
assert(/filterContext/.test(readme) && /activeFilters/.test(readme) && /zuvor[^.\n]{0,120}(?:gewählt(?:e|en)|ausgewählt(?:e|en))[^.\n]{0,80}Filter/i.test(readme), "README must document the structured snapshot of filters supplied to the AI");
assert(/niedrig[^.\n]{0,120}(?:unsicher|möglich)|unsicher[^.\n]{0,120}(?:Konfidenz|möglich)/i.test(readme), "README must explain that a low-confidence best guess stays visibly uncertain");
assert(/Vegetation/.test(readme) && /Leitpfosten/.test(readme) && /Landschaft/.test(readme), "README must document whole-image vegetation, bollard, and landscape analysis");
assert(/Version 1\.3\.0/.test(helperReadme) && /countryAnalysis/.test(helperReadme) && /Vegetation/.test(helperReadme) && /Fahrzeug[^.\n]{0,40}meta/i.test(helperReadme), "Helper README must document v1.3.0 whole-image countryAnalysis including vehicle meta");
assert(/Vegetation/.test(downloadReadme) && /Leitpfosten/.test(downloadReadme) && /Fahrzeug[^.\n]{0,40}meta/i.test(downloadReadme) && /wahrscheinliche[^\n]*mögliche[^\n]*ausgeschlossene/i.test(downloadReadme.replace(/\r?\n/g, " ")), "Download README must explain whole-image direct country categories including vehicle meta");
assert(/<Version>1\.3\.0<\/Version>/.test(helperProject), "AI helper project version must be 1.3.0 for the filter-aware mandatory-best-guess contract");
assert(/FilterContextRequest/.test(helperProgram) && /FilterContextRules\.Normalize/.test(helperProgram) && /appliedFilterContext/.test(helperProgram), "AI helper must normalize, apply, and echo the structured filter context");
assert(/capabilities\s*=\s*new[\s\S]{0,160}bestGuess\s*=\s*true[\s\S]{0,160}filterContextVersion\s*=\s*(?:FilterContextVersion|1)/.test(helperProgram), "AI helper health response must advertise mandatory best-guess and filter-context capabilities");
assert(/bestGuess muss ein einzelnes Objekt sein/.test(helperProgram) && /Lege dich[^.\n]{0,160}genau ein Land[^.\n]{0,160}bestGuess/i.test(helperProgram), "AI helper prompt must demand one country even when confidence is low");
assert(/CountryAnalysis\.BestGuess is \{ Iso3:/.test(helperProgram) && /fehlenden bestGuess aus stärkstem positiven Kandidaten ergänzt/.test(helperProgram), "AI helper self-test must cover a unique best guess and legacy fallback derivation");
assert(/normalized\.CountryAnalysis\.BestGuess is null[\s\S]{0,180}INVALID_MODEL_RESPONSE/.test(helperProgram), "AI helper must reject a successful analysis when no valid country guess can be produced");
assert(/"vehicle-meta"/.test(helperProgram) && /NormalizeImageClueCategory/.test(helperProgram), "AI helper must normalize the canonical vehicle-meta clue category");
assert(/Dachgepäckträger[\s\S]{0,500}Seitenspiegel[\s\S]{0,500}Schnorchel/i.test(helperProgram), "AI helper prompt must inspect roof racks, mirrors, and snorkels");
assert(/Motorrad[\s\S]{0,300}Trekker[\s\S]{0,300}Boot/i.test(helperProgram), "AI helper prompt must inspect motorcycle, trekker, and boat capture types");
assert(/Fahrzeugmeta ist kein Widerspruch/i.test(helperProgram) && /darf kein Land hart ausschließen/i.test(helperProgram), "AI helper prompt must keep unknown or hidden vehicle meta conservative");
assert(/SelfTest\.Assert\(!OriginPolicy\.IsAllowed\("null"\)/.test(helperProgram), "AI helper self-test must require Origin: null to be blocked");
assert(/SelfTest\.Assert\(OriginPolicy\.IsAllowed\("https:\/\/steven44554\.github\.io"\)/.test(helperProgram), "AI helper self-test must keep the published GitHub Pages origin allowed");
assert(/SelfTest\.Assert\(OriginPolicy\.IsAllowed\("http:\/\/127\.0\.0\.1:8000"\)/.test(helperProgram), "AI helper self-test must keep a loopback development origin allowed");
assert(!/string\.Equals\(origin,\s*"null"[\s\S]{0,100}return true/i.test(helperProgram), "AI helper origin policy must not contain a null-origin allow branch");
assert(/evidenceCategories/.test(helperProgram), "AI helper candidate schema must include structured evidenceCategories");
assert(/evidenceCategories/.test(script), "Browser candidate parser must consume structured evidenceCategories");
const robustAiExclusionCategories = ["road", "signs", "language", "plates", "bollards", "architecture", "utility-poles", "traffic"];
const weakAiOnlyCategories = ["vehicle-meta", "vegetation", "climate", "landscape", "camera", "other"];
const helperRobustPolicy = helperProgram.match(/private static bool IsRobustExclusionCategory\(string category\)\s*=>\s*category is([\s\S]*?);/)?.[1] || "";
const browserRobustPolicy = script.match(/AI_ROBUST_EXCLUSION_CATEGORIES\s*=\s*new Set\(\[([\s\S]*?)\]\)/)?.[1] || "";
assert(helperRobustPolicy, "AI helper must define an explicit robust exclusion-category policy");
assert(browserRobustPolicy, "Browser must define an explicit robust exclusion-category policy");
for (const category of robustAiExclusionCategories) {
  assert(helperRobustPolicy.includes(`"${category}"`), `AI helper robust exclusion policy is missing category: ${category}`);
  assert(browserRobustPolicy.includes(`"${category}"`), `Browser robust exclusion policy is missing category: ${category}`);
}
for (const category of weakAiOnlyCategories) {
  assert(!helperRobustPolicy.includes(`"${category}"`), `Weak AI clue must not enter the helper's robust exclusion policy: ${category}`);
  assert(!browserRobustPolicy.includes(`"${category}"`), `Weak AI clue must not enter the browser's robust exclusion policy: ${category}`);
}
assert(/ReadEvidenceCategories\(item,\s*visibleEvidenceCategories\)/.test(helperProgram) && /visibleEvidenceCategories\.Contains\(category\)/.test(helperProgram), "AI helper must accept candidate evidence categories only when they are visible image clues");
assert(/bucket\s*==\s*CountryBucket\.Excluded[\s\S]{0,180}!candidate\.EvidenceCategories\.Any\(IsRobustExclusionCategory\)[\s\S]{0,180}normalizedBucket\s*=\s*CountryBucket\.Possible/.test(helperProgram), "AI helper must downgrade exclusions without robust visible evidence to possible");
assert(/schwache Ausschlüsse zu möglich herabgestuft/.test(helperProgram) && /EvidenceCategories\.SequenceEqual/.test(helperProgram) && /Herabstufungen gemeldet/.test(helperProgram), "AI helper self-test must cover weak, empty, unknown, and robust evidence-category handling");
assert(/visibleEvidenceCategories\.has\(category\)/.test(script) && /sourceGroup\s*===\s*"excluded"\s*&&\s*!hasRobustVisibleExclusion/.test(script), "Browser must independently require a robust category that is also visible in imageClues");
assert((mockGroqServer.match(/"evidenceCategories"\s*:/g) || []).length >= 3, "Local Groq mock must emit the structured evidenceCategories candidate contract");
assert(/evidenceCategories/.test(readme) && /(?:herabgestuft|möglich)/i.test(readme), "README must document the hardened exclusion-category contract");
assert(/(?:nicht[^.\n]{0,120}file:\/\/|file:\/\/[^.\n]{0,120}(?:nicht|blockiert))/i.test(readme), "README must document that direct file origins cannot call the local helper");
assert(/groq-key\.dpapi/.test(gitignore) && /helper\/\*\*\/bin\//.test(gitignore) && /helper\/\*\*\/obj\//.test(gitignore), ".gitignore must protect the local key file and helper build outputs");
assert(!script.includes("smallBadgeOffsets") && !script.includes("road-badge-base"), "Legacy floating road badges must be removed from the map script");
assert(css.includes(".map-road-surface") && css.includes(".map-road-neutral-line") && css.includes(".has-selection"), "Final road, neutral, and selection styles are incomplete");
assert(css.includes(".ai-country-group") && css.includes(".ai-clue-grid") && css.includes(".ai-reset-button"), "Whole-image clue, direct country-group, or AI-reset styles are incomplete");
assert(css.includes(".source-list"), "Country data-quality source styles are incomplete");
assert(css.includes(".country-flag") && css.includes(".update-notice") && css.includes(".road-slab-joints"), "Flag, update-notice, or concrete-slab styles are incomplete");
assert(/\.stop-filter-chip\s*>\s*span:last-child\s*\{[^}]*font-size:\s*inherit/i.test(css), "Compact STOP-filter labels must use the same text size as the other filter chips");
assert(!/filter-chip-icon/i.test(html + css), "Compact STOP-filter chips must not include a redundant icon that makes them wider");
assert(/\.filter-dashboard\s*\{[^}]*position:\s*relative/i.test(css), "Filter dashboard needs a stable positioning context for its desktop panel");
assert(/\.filter-group-grid\s*\{[^}]*display:\s*grid/i.test(css), "Desktop filter panel must use a structured group grid instead of one long strip");
assert(/\.filter-chip-list\s*\{[^}]*flex-wrap:\s*wrap/i.test(css), "Filter options must wrap within their groups");
assert(!/(?:\.filter-group-grid|\.filter-chip-list|\.car-meta-filter-options)[^{]*\{[^}]*(?:overflow-x\s*:\s*(?:auto|scroll)|white-space\s*:\s*nowrap)/i.test(css), "Desktop filter groups must not hide choices behind horizontal scrolling");
assert(/@media\s*\([^)]*max-width\s*:[^)]*\)[\s\S]*?\.filter-group-grid\s*\{[^}]+grid-template-columns:\s*1fr/i.test(css), "Filter panel needs an explicit single-column mobile group layout");
assert(/@media\s*\([^)]*max-width\s*:[^)]*\)[\s\S]*?(?:\.filter-chip|\.filter-toggle-button)\s*\{[^}]*(?:min-height|padding)/i.test(css), "Mobile filter controls need an explicit usable touch-target rule");
assert(!css.includes("road-badge-base") && !css.includes("road-badge-leader"), "Legacy road badge styles must be removed");
for (const relativePath of ["style.css", "data/world-map.js", "data/countries.js", "script.js"]) {
  assert(html.includes(relativePath), `index.html does not reference ${relativePath}`);
  assert(html.includes(`${relativePath}?v=20260816-2`), `index.html must cache-bust ${relativePath} with the current build version`);
  assert(fs.existsSync(path.join(root, relativePath)), `Referenced file missing: ${relativePath}`);
}
assert(/<meta\s+name=["']geo-atlas-build["']\s+content=["']20260816-2["']/i.test(html), "index.html must expose the current cache-busting build version");

assert(!/<(?:script|link|img|source|iframe)\b[^>]*(?:src|href)\s*=\s*["']https?:\/\//i.test(html), "index.html must not load external assets");
assert(/keine manuelle Merkmalsauswahl|zuvor ausgewählte Filter/i.test(html), "Screenshot area must remain AI-only while accepting the external filter context");
assert(/Haupt-Schnellfilter/.test(readme) && /ohne laufenden Helfer[^.]*nicht ausgewertet/i.test(readme), "README must explain that only screenshot analysis is unavailable without AI");

for (const file of ["index.html", "style.css", "data/countries.js", "data/world-map.js"]) {
  const content = fs.readFileSync(path.join(root, file), "utf8");
  assert(!/\bfetch\s*\(|XMLHttpRequest|WebSocket/.test(content), `Network call found in ${file}`);
  assert(!/@import\s+(?:url\()?\s*["']?https?:\/\//i.test(content), `Remote CSS import found in ${file}`);
  assert(!/url\(\s*["']?https?:\/\//i.test(content), `Remote CSS asset found in ${file}`);
  assert(!/[Ã�]|â†|â˜|ï»¿/.test(content), `Encoding artifact found in ${file}`);
}
assert(!/@import\s+(?:url\()?\s*["']?https?:\/\//i.test(script) && !/url\(\s*["']?https?:\/\//i.test(script), "Browser script must not load remote assets");
const browserScriptNetworkText = script
  .replaceAll("http://127.0.0.1:43117", "")
  .replaceAll("http://www.w3.org/2000/svg", "");
assert(!/https?:\/\/[^"'`\s)]+/i.test(browserScriptNetworkText), "Browser script may contact only the fixed loopback helper");
assert((script.match(/\bfetch\s*\(/g) || []).length >= 2, "Browser script must perform explicit local health and analysis requests");
assert(!/[Ã�]|â†|â˜|ï»¿/.test(script), "Encoding artifact found in script.js");

const secretScanExtensions = new Set([".cs", ".csproj", ".html", ".js", ".json", ".md", ".ps1", ".py", ".txt", ".xml"]);
function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if ([".git", "bin", "downloads", "node_modules", "obj"].includes(entry.name)) return [];
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(fullPath);
    return secretScanExtensions.has(path.extname(entry.name).toLowerCase()) ? [fullPath] : [];
  });
}
for (const sourceFile of sourceFiles(root)) {
  const content = fs.readFileSync(sourceFile, "utf8");
  assert(!/\bgsk_[A-Za-z0-9]{20,}\b/.test(content), `Potential live Groq API key found in ${path.relative(root, sourceFile)}`);
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
  captureMetaCountries,
  captureMetaVariants,
  sourceBackedCaptureMetaVariants,
  localFlagAssets: localFlagFiles.length,
  screenshotAnalysisAndMainFilterControls: screenshotAnalysisIds.length,
  filterDashboardControls: filterDashboardIds.length,
  accessibleFilterGroups: expectedFilterGroups.map((group) => group.label),
  optionalAiHelperControls: aiHelperIds.length,
  matcherMainClueChips: 4,
  googleCarMetaChips: 8,
  screenshotManualSelects: 0,
  screenshotManualCheckboxes: 0,
  directAiCountryAnalysis: true,
  structuredAiFilterContext: true,
  mandatorySingleBestGuess: true,
  lowConfidenceBestGuessRemainsPossible: true,
  bestGuessProminentAndMapped: true,
  staleAiInvalidatedOnFilterChange: true,
  wholeImageClues: true,
  vehicleMetaAiClue: true,
  sourceBackedCaptureMeta: true,
  helperNullOriginBlocked: true,
  structuredAiEvidenceCategories: true,
  robustAiExclusionsOnly: true,
  groupedFilterDashboard: true,
  combinedFilterCountAndSummary: true,
  responsiveFilterWrap: true,
  phase3VisualFilters: true,
  phase4EvidenceQuality: true,
  selectedCountryFlags: true,
  philippineConcreteSlabs: true,
  versionedUpdateNotice: true,
  cacheBustedStaticAssets: true,
  pointerCapturedCountrySelection: true,
  neutralInitialCountryPanel: true,
  matcherNetworkUploadsWithoutClick: 0,
  optionalAiLoopbackOnly: true,
  browserCredentialInputs: 0,
  floatingRoadBadges: 0,
  externalNetworkCalls: 0,
}, null, 2));
