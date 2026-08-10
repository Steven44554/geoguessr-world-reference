/*
 * GeoGuessr country knowledge base.
 *
 * Every map feature receives its own normalized record. Priority countries then
 * override the conservative baseline with country-specific, confidence-labelled
 * observations. Wording intentionally avoids turning a common pattern into an
 * absolute national rule.
 */
(function buildCountryDatabase() {
  const leftTraffic = new Set([
    "ATG", "AUS", "BHS", "BGD", "BRB", "BTN", "BWA", "BRN", "CYP", "DMA",
    "SWZ", "CYN", "FJI", "FLK", "GRD", "GUY", "IND", "IDN", "IRL", "JAM", "JPN", "KEN",
    "KIR", "LSO", "MWI", "MYS", "MDV", "MLT", "MUS", "MOZ", "NAM", "NRU",
    "NPL", "NZL", "PAK", "PNG", "KNA", "LCA", "VCT", "WSM", "SYC", "SGP",
    "SLB", "ZAF", "LKA", "SUR", "TZA", "THA", "TLS", "TON", "TTO", "TUV",
    "UGA", "GBR", "ZMB", "ZWE",
  ]);

  const markerCountries = [
    ["AND", "AD", "Andorra", "Andorra", "Europe", 1.60, 42.55],
    ["ATG", "AG", "Antigua and Barbuda", "Antigua und Barbuda", "North America", -61.80, 17.08],
    ["BHR", "BH", "Bahrain", "Bahrain", "Asia", 50.55, 26.07],
    ["BRB", "BB", "Barbados", "Barbados", "North America", -59.55, 13.17],
    ["CPV", "CV", "Cabo Verde", "Kap Verde", "Africa", -23.60, 15.10],
    ["COM", "KM", "Comoros", "Komoren", "Africa", 43.33, -11.70],
    ["DMA", "DM", "Dominica", "Dominica", "North America", -61.37, 15.41],
    ["GRD", "GD", "Grenada", "Grenada", "North America", -61.68, 12.12],
    ["KIR", "KI", "Kiribati", "Kiribati", "Oceania", 173.00, 1.90],
    ["LIE", "LI", "Liechtenstein", "Liechtenstein", "Europe", 9.55, 47.17],
    ["MDV", "MV", "Maldives", "Malediven", "Asia", 73.50, 4.20],
    ["MLT", "MT", "Malta", "Malta", "Europe", 14.38, 35.94],
    ["MHL", "MH", "Marshall Islands", "Marshallinseln", "Oceania", 171.20, 7.10],
    ["MUS", "MU", "Mauritius", "Mauritius", "Africa", 57.55, -20.20],
    ["FSM", "FM", "Micronesia", "Mikronesien", "Oceania", 158.20, 6.90],
    ["FRO", "FO", "Faroe Islands", "Färöer", "Europe", -6.90, 62.00],
    ["MCO", "MC", "Monaco", "Monaco", "Europe", 7.42, 43.73],
    ["NRU", "NR", "Nauru", "Nauru", "Oceania", 166.93, -0.52],
    ["PLW", "PW", "Palau", "Palau", "Oceania", 134.58, 7.50],
    ["KNA", "KN", "Saint Kitts and Nevis", "St. Kitts und Nevis", "North America", -62.78, 17.35],
    ["LCA", "LC", "Saint Lucia", "St. Lucia", "North America", -60.98, 13.90],
    ["VCT", "VC", "Saint Vincent and the Grenadines", "St. Vincent und die Grenadinen", "North America", -61.20, 13.25],
    ["SMR", "SM", "San Marino", "San Marino", "Europe", 12.45, 43.94],
    ["STP", "ST", "Sao Tome and Principe", "São Tomé und Príncipe", "Africa", 6.61, 0.18],
    ["SYC", "SC", "Seychelles", "Seychellen", "Africa", 55.45, -4.62],
    ["SGP", "SG", "Singapore", "Singapur", "Asia", 103.82, 1.35],
    ["TON", "TO", "Tonga", "Tonga", "Oceania", -175.20, -21.20],
    ["TUV", "TV", "Tuvalu", "Tuvalu", "Oceania", 179.20, -8.50],
    ["VAT", "VA", "Vatican City", "Vatikanstadt", "Europe", 12.45, 41.90],
  ].map(([iso3, iso2, name, nameDe, continent, lon, lat]) => ({
    iso3, iso2, name, nameDe, continent, lon, lat,
  }));

  window.SMALL_COUNTRY_MARKERS = markerCountries;

  const continentNames = {
    Africa: "Afrika",
    Asia: "Asien",
    Europe: "Europa",
    "North America": "Nordamerika",
    "South America": "Südamerika",
    Oceania: "Ozeanien",
    Antarctica: "Antarktika",
    "Seven seas (open ocean)": "Ozeanien",
  };

  const countries = {};
  const mapFeatures = window.WORLD_GEOJSON?.features || [];
  const allSources = [
    ...mapFeatures.map((feature) => ({
      ...feature.properties,
      lon: feature.properties.labelX,
      lat: feature.properties.labelY,
    })),
    ...markerCountries,
  ];

  allSources.forEach((source) => {
    if (!source.iso3 || countries[source.iso3]) return;
    const side = leftTraffic.has(source.iso3) ? "left" : "right";
    countries[source.iso3] = {
      iso3: source.iso3,
      iso2: source.iso2 || "",
      name: source.nameDe || source.name,
      nameEnglish: source.name,
      continent: continentNames[source.continent] || source.continent || "Unbekannt",
      subregion: source.subregion || "",
      coordinates: [source.lon, source.lat],
      traffic: side,
      domain: "Nicht erfasst",
      detailLevel: "basis",
      roadMarkings: {
        centerColor: "Nicht zuverlässig erfasst",
        centerStyle: "Hängt von Straßentyp und lokaler Regelung ab",
        leftEdgeColor: "Nicht zuverlässig erfasst",
        rightEdgeColor: "Nicht zuverlässig erfasst",
        prevalence: "Nicht bewertet",
        uncertainty: "Für dieses Land ist noch kein belastbares länderspezifisches Straßenprofil hinterlegt.",
        commonVariations: ["Straßentyp und Region können die Markierung verändern."],
      },
      roadStyles: [],
      roadMapPattern: {
        center: { color: "none", style: "none", count: 0 },
        leftEdge: { color: "none", style: "none" },
        rightEdge: { color: "none", style: "none" },
        confidence: "unknown",
        notes: "Kein ausreichend verifiziertes repräsentatives Straßenmuster hinterlegt.",
      },
      roads: {
        asphalt: "Noch nicht länderspezifisch erfasst",
        roadWidth: "Noch nicht länderspezifisch erfasst",
        shoulders: "Noch nicht länderspezifisch erfasst",
        condition: "Regional unterschiedlich",
      },
      bollards: { description: "Noch nicht verlässlich erfasst", importance: "LOW" },
      signs: { description: "Noch nicht verlässlich erfasst", importance: "LOW" },
      stopSign: {
        format: "unknown",
        displayedText: "Nicht sicher erfasst",
        confidence: "unknown",
        sources: [],
      },
      utilityPoles: { description: "Noch nicht verlässlich erfasst", importance: "LOW" },
      licensePlates: { description: "Noch nicht verlässlich erfasst", importance: "LOW" },
      languages: [],
      landscape: "Noch nicht länderspezifisch erfasst",
      architecture: "Noch nicht länderspezifisch erfasst",
      meta: "Kein belastbarer Meta-Hinweis hinterlegt.",
      geoGuessrClues: [
        {
          importance: "HIGH",
          category: "Verkehr",
          text: side === "left" ? "Linksverkehr" : "Rechtsverkehr",
          reliability: "nationaler Standard",
        },
        {
          importance: "LOW",
          category: "Datenqualität",
          text: "Noch kein kuratiertes Länderprofil – keine unbestätigten Regeln anzeigen.",
          reliability: "transparent unvollständig",
        },
      ],
      confusedWith: [],
      distinguish: {},
    };
  });

  function canonicalPatternColor(value) {
    const text = String(value || "").toLowerCase();
    if (text.includes("gelb") || text.includes("yellow")) return "yellow";
    if (text.includes("grün") || text.includes("green")) return "green";
    if (text.includes("weiß") || text.includes("weiss") || text.includes("white")) return "white";
    return "none";
  }

  function canonicalPatternStyle(value, fallback = "solid") {
    const style = String(value || fallback).toLowerCase();
    if (style === "none") return "none";
    if (style === "double" || style === "double-solid") return "double-solid";
    if (style === "double-dashed") return "double-dashed";
    if (style === "solid-left" || style === "solid-dashed") return "solid-dashed";
    if (style === "dashed") return "dashed";
    return "solid";
  }

  function patternFromRoadStyle(style, confidence, notes) {
    const centerStyle = canonicalPatternStyle(style.centerStyle, "dashed");
    return {
      center: {
        color: canonicalPatternColor(style.centerColor),
        style: centerStyle,
        count: centerStyle.startsWith("double") || centerStyle === "solid-dashed" ? 2 : centerStyle === "none" ? 0 : 1,
      },
      leftEdge: {
        color: canonicalPatternColor(style.leftEdgeColor),
        style: canonicalPatternStyle(style.leftEdgeStyle || style.edgeStyle, "solid"),
      },
      rightEdge: {
        color: canonicalPatternColor(style.rightEdgeColor),
        style: canonicalPatternStyle(style.rightEdgeStyle || style.edgeStyle, "solid"),
      },
      confidence,
      notes,
    };
  }

  function define(iso3, config) {
    const base = countries[iso3];
    if (!base) return;
    const center = config.center || "weiß";
    const edge = config.edge || "weiß";
    const certainty = config.certainty || "häufig, aber vom Straßentyp abhängig";
    const traffic = config.traffic || base.traffic;
    const roadStyles = config.roadStyles || [
      {
        label: "Typische Landstraße",
        centerColor: center,
        centerStyle: config.centerVisual || "dashed",
        leftEdgeColor: config.leftEdge || edge,
        rightEdgeColor: config.rightEdge || edge,
        lanes: 2,
        note: certainty,
      },
    ];
    const roadMapPattern = config.roadMapPattern || patternFromRoadStyle(
      roadStyles[0],
      config.patternConfidence || "medium",
      config.patternNotes || roadStyles[0].note || certainty,
    );
    countries[iso3] = {
      ...base,
      ...config,
      traffic,
      detailLevel: "priorität",
      roadMarkings: {
        centerColor: center,
        centerStyle: config.centerStyle || "Meist einfache oder doppelte Linie; durchgezogen und unterbrochen je nach Überholregel",
        leftEdgeColor: config.leftEdge || edge,
        rightEdgeColor: config.rightEdge || edge,
        prevalence: certainty,
        uncertainty: config.roadUncertainty || "Markierungen können nach Straße, Region und Erhaltungszustand abweichen.",
        commonVariations: config.variations || ["Nebenstraßen können unmarkiert sein."],
      },
      roadStyles,
      roadMapPattern,
      roads: {
        asphalt: config.asphalt || "Grau bis dunkelgrau; Alter und Klima verändern den Eindruck",
        roadWidth: config.roadWidth || "Stark vom Straßentyp abhängig",
        shoulders: config.shoulders || "Befestigte und unbefestigte Varianten",
        condition: config.condition || "Regional unterschiedlich",
      },
      bollards: {
        description: config.bollards || "Kein einzelnes Design ist landesweit eindeutig.",
        importance: config.bollardImportance || "MEDIUM",
      },
      signs: {
        description: config.signs || "Beschilderung mit regionalen und straßentypabhängigen Varianten.",
        importance: config.signImportance || "MEDIUM",
      },
      utilityPoles: {
        description: config.poles || "Holz-, Beton- und Metallmasten kommen je nach Region vor.",
        importance: config.poleImportance || "MEDIUM",
      },
      licensePlates: {
        description: config.plates || "Plattenfarbe und Format allein sind selten eindeutig.",
        importance: config.plateImportance || "MEDIUM",
      },
      geoGuessrClues: (config.clues || []).map(([importance, category, text, reliability = "häufig"]) => ({
        importance, category, text, reliability,
      })),
    };
  }

  // Southern Africa
  define("ZAF", {
    name: "Südafrika", domain: ".za", center: "weiß", edge: "gelb", certainty: "sehr häufig auf größeren Straßen",
    centerStyle: "Weiße Mittellinie; einfach oder doppelt, durchgezogen oder unterbrochen nach Überholregel",
    asphalt: "Oft breite, dunkle Fernstraßen; ältere Abschnitte wirken grob und ausgeblichen",
    roadWidth: "Fernstraßen oft auffallend breit, ländliche Nebenstraßen variabel",
    shoulders: "Gelbe Randlinie trennt häufig einen nutzbaren oder schmalen Seitenbereich",
    bollards: "Weiße Leitpfosten und Chevrons kommen vor; Form allein weniger stark als die Randlinien.",
    signs: "Dreieckige Warnschilder; Fernstraßen tragen häufig N- oder R-Nummern.",
    poles: "Holz- und Betonmasten; lange Leitungen in offenem Gelände sind häufig.",
    plates: "Überwiegend helle Platten; Provinzformate variieren und sind durch Unschärfe oft schwer nutzbar.",
    languages: ["Englisch", "Afrikaans", "isiZulu", "weitere Amtssprachen"],
    landscape: "Große Bandbreite von trockener Steppe bis grünen Hochländern, Fynbos und subtropischer Küste.",
    architecture: "Mauern und Zäune in Städten; Farmzäune und verstreute Gehöfte im ländlichen Raum.",
    meta: "GeoGuessr Meta: Südafrika hat breite offizielle Street-View-Abdeckung; Fahrzeughinweise nur ergänzend nutzen.",
    clues: [
      ["VERY HIGH", "Straßenmarkierung", "Gelbe äußere Randlinien bei weißer Mittellinie", "sehr häufig"],
      ["VERY HIGH", "Verkehr", "Linksverkehr", "nationaler Standard"],
      ["HIGH", "Straße", "Breite Fernstraßen mit markantem Randstreifen"],
      ["HIGH", "Landschaft", "Offene, oft trockene Hochland- oder Savannenlandschaft"],
      ["MEDIUM", "Schilder", "N- und R-Straßennummern"],
    ],
    confusedWith: ["BWA", "LSO", "SWZ", "NAM"],
    distinguish: {
      BWA: "Südafrika hat häufiger klar ausgebaute Fernstraßen und größere landschaftliche Vielfalt; Botswana wirkt oft flacher und trockener. Gelbe Außenlinien gibt es in beiden.",
      LSO: "Lesotho ist deutlich gebirgiger und höher gelegen; Südafrika besitzt viel mehr flache Fernstraßenräume.",
      SWZ: "Eswatini wirkt häufiger hügelig, dichter besiedelt und grüner; Südafrika ist im Maßstab viel variabler.",
      NAM: "Namibia ist meist trockener und extrem dünn besiedelt; lange Schotterstraßen sind dort wesentlich typischer.",
    },
  });

  define("BWA", {
    name: "Botswana", domain: ".bw", center: "weiß", edge: "gelb", certainty: "häufig auf Hauptstraßen",
    asphalt: "Lange, gerade, oft schmale Asphaltbänder durch flaches trockenes Gelände",
    roadWidth: "Hauptstraßen meist zweispurig; Seitenraum wirkt offen und unbebaut",
    shoulders: "Sandige oder staubige, meist unbefestigte Schultern",
    bollards: "Leitpfosten sind nicht überall dicht gesetzt; Wildtierwarnungen können auffallen.",
    signs: "Südafrikanisch geprägte dreieckige Warnschilder; englische Beschriftung.",
    poles: "Lange, einfache Stromtrassen; große Abschnitte ganz ohne Leitungen.",
    plates: "Vorn weiß und hinten gelb, jeweils mit schwarzer Schrift.", languages: ["Englisch", "Setswana"],
    landscape: "Sehr flach, trocken, sandig; Dornbusch, Kalahari und weite Savanne.",
    architecture: "Niedrige Siedlungen, Zäune und weit auseinanderliegende Gebäude.",
    meta: "GeoGuessr Meta: Abdeckungs- und Fahrzeughinweise ändern sich; nicht als alleinigen Beweis verwenden.",
    clues: [
      ["VERY HIGH", "Verkehr", "Linksverkehr", "nationaler Standard"],
      ["HIGH", "Kennzeichen", "Vorn weiß, hinten gelb", "nationaler Standard"],
      ["HIGH", "Straßenmarkierung", "Weiße Mitte und häufig gelbe Außenlinien"],
      ["HIGH", "Landschaft", "Extrem flache, trockene Dornbusch- und Kalahari-Landschaft"],
      ["MEDIUM", "Straße", "Lange gerade Hauptstraßen mit sandigen Schultern"],
    ],
    confusedWith: ["ZAF", "NAM", "LSO"],
    distinguish: { ZAF: "Botswana ist meist flacher, trockener und dünner besiedelt.", NAM: "Namibia hat noch häufiger markante Schotterstraßen und sehr helle Wüstenräume.", LSO: "Lesotho ist bergig; Botswana fast durchgehend flach." },
  });

  define("LSO", {
    name: "Lesotho", domain: ".ls", center: "weiß", edge: "gelb", certainty: "häufig auf ausgebauten Hauptstraßen",
    asphalt: "Kurvige Bergstraßen, oft mit deutlichen Höhenwechseln",
    roadWidth: "Hauptachsen zweispurig; viele schmale Nebenstraßen",
    shoulders: "Oft schmal, felsig oder grasig; kaum Platz neben der Fahrbahn",
    bollards: "Leitpfosten und Kurvenmarkierungen an Bergstrecken; nicht jede Straße ist ausgestattet.",
    signs: "Südafrikanisch beeinflusste Warn- und Richtungsschilder.",
    poles: "Einfache Leitungen entlang von Tälern und Siedlungen.",
    plates: "Lange weiße Kennzeichen mit blauer Schrift sind charakteristisch.", languages: ["Sesotho", "Englisch"],
    landscape: "Hochgelegenes, baumarmes Gebirge mit grasigen Hängen, Terrassen und tiefen Tälern.",
    architecture: "Rondavels, Stein- und Wellblechhäuser in verstreuten Bergsiedlungen.",
    meta: "GeoGuessr Meta: Das sichtbare Hochland ist der stabilere Hinweis als Kamera- oder Fahrzeugdetails.",
    clues: [
      ["VERY HIGH", "Landschaft", "Dramatisches, baumarmes Hochland und Bergpässe"],
      ["VERY HIGH", "Verkehr", "Linksverkehr", "nationaler Standard"],
      ["HIGH", "Kennzeichen", "Weiße Platten mit blauer Schrift", "charakteristisch"],
      ["HIGH", "Straßenmarkierung", "Südafrikanisches Muster mit gelben Außenlinien auf Hauptstraßen"],
      ["HIGH", "Architektur", "Rondavels und dichte Bergdörfer"],
    ],
    confusedWith: ["ZAF", "SWZ"],
    distinguish: { ZAF: "Lesotho ist fast überall hoch und bergig; gelbe Randlinien allein reichen nicht.", SWZ: "Lesotho ist höher, karger und baumärmer als das meist grünere Eswatini." },
  });

  define("SWZ", {
    name: "Eswatini", domain: ".sz", center: "weiß", edge: "gelb", certainty: "häufig auf Hauptstraßen",
    asphalt: "Kurvige, oft gut markierte Straßen durch hügeliges Gelände",
    roadWidth: "Hauptstraßen zweispurig, Ortsdurchfahrten dichter",
    shoulders: "Grasige oder unbefestigte Schultern; Bebauung oft nah an der Straße",
    signs: "Südafrikanisch geprägte Verkehrszeichen; Englisch und siSwati.",
    poles: "Holz- und Betonmasten in dichter besiedelten Korridoren.",
    plates: "Lange Kennzeichen mit charakteristischem grünem unteren Bereich.", languages: ["siSwati", "Englisch"],
    landscape: "Hügelig bis bergig, häufig grüner und dichter besiedelt als Botswana oder Namibia.",
    architecture: "Siedlungsbänder, Mauern und ländliche Gehöfte entlang der Straßen.",
    meta: "GeoGuessr Meta: Reale Landschafts- und Straßenhinweise höher gewichten als wechselnde Fahrzeugdetails.",
    clues: [
      ["VERY HIGH", "Verkehr", "Linksverkehr", "nationaler Standard"],
      ["MEDIUM", "Kennzeichen", "Charakteristischer grüner unterer Bereich", "ergänzender Hinweis"],
      ["HIGH", "Landschaft", "Grüne, hügelige südafrikanische Landschaft mit dichter Bebauung"],
      ["HIGH", "Straßenmarkierung", "Weiße Mitte, häufig gelbe Außenlinien"],
      ["MEDIUM", "Sprache", "Englisch und siSwati auf lokalen Hinweisen"],
    ],
    confusedWith: ["ZAF", "LSO"],
    distinguish: { ZAF: "Eswatini ist kleinräumiger, häufiger grün und hügelig mit mehr Straßenrandbebauung.", LSO: "Eswatini ist bewaldeter und weniger hochalpin als Lesotho." },
  });

  define("NAM", {
    name: "Namibia", domain: ".na", center: "weiß", edge: "gelb", certainty: "häufig auf asphaltierten Hauptstraßen",
    asphalt: "Sehr lange, gerade Asphaltstraßen; daneben außergewöhnlich viele breite Schotterstraßen",
    roadWidth: "Asphaltachsen zweispurig; Schotterstraßen oft breit und gut geformt",
    shoulders: "Helle Kies- oder Sandschultern gehen direkt in offene Wüste über",
    roadStyles: [
      { label: "Asphalt-Hauptstraße", centerColor: "weiß", centerStyle: "dashed", leftEdgeColor: "gelb", rightEdgeColor: "gelb", lanes: 2, note: "häufig" },
      { label: "Typische Schotterstraße", centerColor: "none", centerStyle: "none", leftEdgeColor: "none", rightEdgeColor: "none", lanes: 2, surface: "gravel", note: "sehr häufig außerhalb der Hauptachsen" },
    ],
    bollards: "Spärliche Leitpfosten auf Fernstraßen; offene Entfernungen sind oft der stärkere Eindruck.",
    signs: "Südafrikanisch geprägte Dreieckswarnschilder; deutsche Ortsnamen kommen vor.",
    poles: "Sehr lange Abschnitte ohne Masten; einfache Leitungen nahe Siedlungen.",
    plates: "Normale private Kennzeichen sind vorn und hinten reflektierend gelb mit schwarzer Schrift.",
    languages: ["Englisch", "Afrikaans", "Oshiwambo", "Deutsch"],
    landscape: "Extrem trocken, weit und dünn besiedelt; helle Wüste, rote Sandflächen, Tafelberge.",
    architecture: "Deutsche Kolonialspuren in einzelnen Städten; Farmzäune und isolierte Gebäude.",
    meta: "GeoGuessr Meta: Abdeckung konzentriert sich stark auf befahrbare Haupt- und Schotterachsen.",
    clues: [
      ["VERY HIGH", "Landschaft", "Extrem weite Wüsten- und Halbwüstenräume"],
      ["VERY HIGH", "Straße", "Breite, gepflegte Schotterstraßen über große Distanzen"],
      ["HIGH", "Kennzeichen", "Vorn und hinten reflektierend gelb", "nationaler Standard"],
      ["HIGH", "Straßenmarkierung", "Auf Asphalt weiße Mitte und oft gelbe Außenlinien"],
      ["HIGH", "Verkehr", "Linksverkehr", "nationaler Standard"],
    ],
    confusedWith: ["BWA", "ZAF"],
    distinguish: { BWA: "Namibia zeigt häufiger helle oder rötliche Wüstenflächen und breite Schotterstraßen.", ZAF: "Namibia ist im Mittel viel leerer und trockener; städtische Hinweise sind seltener." },
  });

  // Nordics
  define("NOR", {
    name: "Norwegen", domain: ".no", center: "gelb", edge: "weiß", certainty: "gelbe Trennung des Gegenverkehrs ist national charakteristisch",
    centerStyle: "Gelbe Mittelmarkierung; unterbrochen oder durchgezogen je nach Überholregel",
    asphalt: "Dunkler Asphalt, oft schmal und kurvig zwischen Fels, Fjord und Tunnel",
    roadWidth: "Nebenstraßen können sehr schmal sein; größere Straßen besitzen weiße Randlinien",
    shoulders: "Schmale oder fehlende Schultern, Felswände und Entwässerungsrinnen",
    roadStyles: [
      { label: "Größere Landstraße", centerColor: "gelb", centerStyle: "dashed", leftEdgeColor: "weiß", rightEdgeColor: "weiß", lanes: 2, note: "typisch" },
      { label: "Schmale Straße", centerColor: "none", centerStyle: "none", leftEdgeColor: "weiß", rightEdgeColor: "weiß", edgeStyle: "dashed", lanes: 1, note: "lange weiße Randstriche sind häufig" },
    ],
    bollards: "Schlanke weiße Leitpfosten mit schwarzen Feldern; Schnee- und Tunnelumgebung beachten.",
    signs: "Gelbe Richtungsschilder sind ein sehr nützlicher Nordik-Hinweis; Warnschilder rot-weiß.",
    poles: "Holzmasten in ländlichen Tälern; Leitungen oft zwischen Fels und Wald.",
    plates: "Weiße Platten; grüne Nutzfahrzeugplatten können vorkommen.", languages: ["Norwegisch", "Samische Sprachen"],
    landscape: "Fjorde, steile Berge, kahle Hochflächen, Nadelwald und zahlreiche Tunnel.",
    architecture: "Holzhäuser, oft rot oder weiß; kompakte Dörfer in Tälern und an Fjorden.",
    meta: "GeoGuessr Meta: Tunnel- und Fährabdeckung kann ungewöhnliche Sequenzen erzeugen; reale Linienfarben bleiben robuster.",
    clues: [
      ["VERY HIGH", "Straßenmarkierung", "Gelbe Mittellinie trennt Gegenverkehr", "national charakteristisch"],
      ["HIGH", "Straße", "Lange gestrichelte weiße Randlinien auf schmalen Straßen"],
      ["HIGH", "Schilder", "Gelbe Richtungsschilder"],
      ["HIGH", "Landschaft", "Fjorde, steiler Fels und Tunnel"],
    ],
    confusedWith: ["SWE", "FIN", "ISL"],
    distinguish: { SWE: "Schweden nutzt weiße Mittellinien; Norwegen gelb zur Gegenverkehrstrennung.", FIN: "Norwegen ist häufiger steil und fjordgeprägt; Finnland meist flacher und seenreicher.", ISL: "Island ist baumärmer und vulkanischer; Norwegen dichter bewaldet." },
  });

  define("SWE", {
    name: "Schweden", domain: ".se", center: "weiß", edge: "weiß", certainty: "typisch auf markierten Straßen",
    asphalt: "Glatter grauer Asphalt durch Nadelwald und offene Agrarflächen",
    roadWidth: "Breite Hauptstraßen, schmale Waldstraßen; 2+1-Straßen kommen häufig vor",
    shoulders: "Weiße Randlinien, auf schmaleren Straßen oft kurze Randstriche",
    bollards: "Weiße Leitpfosten mit dunklem Rechteck; Form und Reflektor helfen im Nordik-Vergleich.",
    signs: "Viele Warnschilder haben gelben Grund mit rotem Rand; Richtungsschilder oft blau.",
    poles: "Holzmasten und einfache Leitungen in Wald- und Agrarräumen.",
    plates: "Weiße EU-Platten; meist blaues Band links.", languages: ["Schwedisch", "Samische Sprachen"],
    landscape: "Nadelwald, Seen, rote Holzhäuser, flach bis sanft hügelig; Norden dünn besiedelt.",
    architecture: "Rote Holzfassaden mit weißen Kanten sind sehr häufig, aber nicht exklusiv.",
    meta: "GeoGuessr Meta: Keine einzelne Kamerageneration als dauerhaften Länderbeweis verwenden.",
    clues: [
      ["VERY HIGH", "Straßenmarkierung", "Nur weiße Linien; oft kurze gestrichelte Randlinien"],
      ["HIGH", "Schilder", "Gelbe Warnschilder mit rotem Rand"],
      ["HIGH", "Landschaft", "Nadelwald, Seen und rote Holzhäuser"],
      ["MEDIUM", "Straße", "Charakteristische 2+1-Straßen mit Mittelleitplanke"],
    ],
    confusedWith: ["NOR", "FIN", "DNK"],
    distinguish: { NOR: "Schwedische Mittellinien sind weiß; norwegische gelb.", FIN: "Schweden zeigt häufiger kurze gestrichelte Randlinien; Finnland oft durchgezogene Ränder.", DNK: "Schweden ist waldreicher und weitläufiger; Dänemark flach und agrarisch." },
  });

  define("FIN", {
    name: "Finnland", domain: ".fi", center: "weiß", edge: "weiß", certainty: "heute überwiegend weiße Markierungen; ältere gelbe Hinweise können veraltet sein",
    roadUncertainty: "Finnland stellte die gelben Mittellinien bis 2023 auf weiß um; alte Bilder oder Lernquellen können noch Gelb zeigen.",
    asphalt: "Meist glatter, grauer Asphalt durch flache Wald- und Seenlandschaft",
    roadWidth: "Hauptstraßen breit, lokale Straßen schmal; lange gerade Abschnitte häufig",
    shoulders: "Durchgezogene weiße Randlinien sind ein nützlicher Vergleichshinweis",
    bollards: "Weiße Leitpfosten mit dunkler Oberpartie; im Detail von schwedischen Pfosten unterscheiden.",
    signs: "Warnschilder mit gelbem Grund und rotem Rand; zweisprachige Schilder im Südwesten möglich.",
    poles: "Holzmasten entlang gerader Straßen; Leitungen häufig im Waldkorridor.",
    plates: "Weiße EU-Platten; meist blaues Band links.", languages: ["Finnisch", "Schwedisch", "Samische Sprachen"],
    landscape: "Sehr seenreich, flach, dichter Nadel- und Birkenwald; Granitaufschlüsse.",
    architecture: "Holzhäuser und funktionale Siedlungen; weniger rote Häuser als Schweden als Faustregel, nicht absolut.",
    meta: "GeoGuessr Meta: Bildalter kann bei der Markierungsfarbe entscheidend sein.",
    clues: [
      ["VERY HIGH", "Datenqualität", "Neue Aufnahmen: weiße Mittellinien; alte gelbe Regel ist überholt", "zeitabhängig"],
      ["HIGH", "Straßenmarkierung", "Häufig durchgezogene weiße Randlinien"],
      ["HIGH", "Landschaft", "Flache Seen- und Nadelwaldlandschaft"],
      ["HIGH", "Sprache", "Finnische Doppelvokale und Endungen wie -tie"],
    ],
    confusedWith: ["SWE", "NOR"],
    distinguish: { SWE: "Finnland hat häufiger solide weiße Außenlinien und sichtbar finnische Sprache.", NOR: "Finnland ist meist flach; Norwegen bergig und mit gelber Gegenverkehrslinie." },
  });

  define("ISL", {
    name: "Island", domain: ".is", center: "weiß", edge: "weiß", certainty: "aktuelle permanente Markierungen sind weiß; ältere gelbe Lernhinweise sind veraltet",
    asphalt: "Schmale dunkle Ring- und Regionalstraßen, oft ohne breite Schulter; viele Schotterabschnitte im Inland",
    roadWidth: "Meist zweispurig und eher schmal; einspurige Brücken möglich",
    shoulders: "Kiesige Ränder ohne Vegetation oder niedrige Grasränder",
    bollards: "Hohe weiße Leitpfosten und gelbe Reflektoren fallen in der offenen Landschaft auf.",
    signs: "Europäische Warnformen; Ortsnamen mit ð, þ und vielen langen Zusammensetzungen.",
    poles: "Wenig Masten in offenen Hochlandräumen; Leitungen nahe Siedlungen.",
    plates: "Weiße europäische Platten ohne EU-Zwangsmerkmal.", languages: ["Isländisch"],
    landscape: "Baumarme Lavafelder, Moos, schwarze Böden, Wasserfälle, Gletscher und vulkanische Berge.",
    architecture: "Bunte Wellblechhäuser und isolierte Farmen; sehr wenige große Siedlungen.",
    meta: "GeoGuessr Meta: Saison, Wetter und Bildgeneration verändern Farben stark; Vulkanlandschaft ist stabiler.",
    clues: [
      ["VERY HIGH", "Landschaft", "Baumlose Vulkan-, Lava- und Mooslandschaft"],
      ["HIGH", "Straßenmarkierung", "Aktuelle permanente Mittel- und Außenlinien sind weiß", "amtlich verifiziert"],
      ["HIGH", "Sprache", "Buchstaben ð und þ"],
      ["MEDIUM", "Straße", "Einspurige Brücken und kiesige Schultern"],
    ],
    confusedWith: ["NOR", "FRO"],
    distinguish: { NOR: "Island ist deutlich baumärmer und vulkanischer; Norwegen hat mehr Wald und Fjordbebauung." },
  });

  define("DNK", {
    name: "Dänemark", domain: ".dk", center: "weiß", edge: "weiß", certainty: "typisch auf markierten Straßen",
    asphalt: "Gut gepflegte, flache Straßen in intensiv genutzter Agrarlandschaft",
    roadWidth: "Landstraßen meist mittelbreit; Radwege häufig separat geführt",
    shoulders: "Sehr kurze weiße Randstriche kommen auf Landstraßen vor",
    bollards: "Weiße Leitpfosten mit dunklen Rechteckfeldern; dicht und ordentlich gesetzt.",
    signs: "Europäische Schilder; blaue Radwegzeichen und dänische Ortsnamen.",
    poles: "Weniger Freileitungen an modernisierten Hauptachsen; Windkraftanlagen häufig sichtbar.",
    plates: "Weiße EU-Platten; gelbe Platten bei bestimmten Nutzfahrzeugen möglich.", languages: ["Dänisch"],
    landscape: "Sehr flach bis sanft wellig, Felder, Hecken, Küsten und Windräder.",
    architecture: "Backsteinhäuser, gepflegte Höfe und kompakte Dörfer.",
    meta: "GeoGuessr Meta: Reale Infrastruktur und Sprache sind belastbarer als Kamerahinweise.",
    clues: [
      ["VERY HIGH", "Straßenmarkierung", "Sehr kurze, stakkatoartige weiße Randstriche"],
      ["HIGH", "Landschaft", "Flache Agrarlandschaft mit Windrädern"],
      ["HIGH", "Infrastruktur", "Dichte Radwege und gepflegte Straßenräume"],
      ["MEDIUM", "Architektur", "Backsteinhöfe und kompakte Dörfer"],
    ],
    confusedWith: ["SWE", "NLD", "DEU"],
    distinguish: { SWE: "Dänemark ist flacher, dichter agrarisch und hat extrem kurze Randstriche.", NLD: "Dänische Straßen wirken weniger kanalgeprägt; dänische Buchstaben æ, ø, å helfen.", DEU: "Dänemark hat häufiger kurze Randstriche und sehr präsente Radwege." },
  });

  // North America
  define("USA", {
    name: "Vereinigte Staaten", domain: ".us", center: "gelb", edge: "weiß", certainty: "national sehr verbreitet",
    centerStyle: "Gelb trennt Gegenverkehr; Weiß trennt Fahrstreifen gleicher Richtung",
    asphalt: "Große Bandbreite; breite Fahrbahnen und lange gerade Highways häufig",
    roadWidth: "Oft breite Fahrstreifen und Schultern, selbst außerhalb von Städten",
    shoulders: "Befestigte rechte Schulter mit weißer Randlinie auf größeren Straßen",
    roadStyles: [
      { label: "Zweispuriger Highway", centerColor: "gelb", centerStyle: "double", leftEdgeColor: "weiß", rightEdgeColor: "weiß", lanes: 2, note: "sehr häufig" },
      { label: "Mehrspurige Fahrbahn", centerColor: "gelb", centerStyle: "solid-left", laneDividerColor: "weiß", leftEdgeColor: "gelb", rightEdgeColor: "weiß", lanes: 3, note: "Gelb links, Weiß zwischen gleichen Richtungen" },
    ],
    bollards: "Delineatoren variieren stark nach Bundesstaat; gelbe Reflektoren links, weiße rechts sind häufig.",
    signs: "MUTCD-Stil: gelbe Rautenwarnschilder, grüne Wegweisung, weiße Speed-Limit-Schilder in mph.",
    poles: "Holzmasten mit vielen Querträgern sind in Vororten und ländlichen Gebieten sehr häufig.",
    plates: "Bundesstaatlich sehr unterschiedlich; hinten meist Pflicht, vorne nicht in allen Staaten.",
    languages: ["Englisch", "Spanisch regional"], landscape: "Extrem vielfältig; Straßen- und Beschilderungsstandard oft nützlicher als Klima.",
    architecture: "Breite Vorstadtstraßen, Holzhäuser, freistehende Gewerbebauten und große Parkflächen.",
    meta: "GeoGuessr Meta: Offizielle Abdeckung ist sehr breit; Bildgeneration oder Sonnenstand nicht allein verwenden.",
    clues: [
      ["VERY HIGH", "Straßenmarkierung", "Gelb trennt Gegenverkehr, Weiß trennt gleiche Richtung", "nationaler Standard"],
      ["VERY HIGH", "Schilder", "Gelbe rautenförmige Warnschilder und mph-Limits"],
      ["HIGH", "Straße", "Breite Fahrbahnen und Schultern"],
      ["HIGH", "Infrastruktur", "Holzmasten mit mehreren Querträgern"],
    ],
    confusedWith: ["CAN", "MEX"],
    distinguish: { CAN: "Kanada nutzt km/h und metrische Beschilderung; Provinzschilder und Straßenrand wirken oft kanadisch markiert.", MEX: "Mexiko hat spanische Schilder, andere Straßenqualität und meist Betonmasten statt typischer US-Holzmasten." },
  });

  define("CAN", {
    name: "Kanada", domain: ".ca", center: "gelb", edge: "weiß", certainty: "sehr häufig",
    centerStyle: "Gelbe Trennung von Gegenverkehr; Weiß für gleiche Fahrtrichtung",
    asphalt: "Breite Fernstraßen, im Norden und ländlich oft rissig durch Frost",
    roadWidth: "Hauptstraßen breit; dünn besiedelte Straßen können sehr lang und gerade sein",
    shoulders: "Befestigte oder kiesige Schultern mit weißer Randlinie",
    bollards: "Delineatoren und Schneepfähle variieren nach Provinz; Winterinfrastruktur ist häufig.",
    signs: "Kanadische Warnschilder meist gelbe Rauten; Geschwindigkeiten in km/h, bilingual in Teilen des Landes.",
    poles: "Holzmasten und lange Leitungen in Wald- und Präriekorridoren.",
    plates: "Provinzabhängig; Frontplatte nicht überall Pflicht.", languages: ["Englisch", "Französisch"],
    landscape: "Borealer Wald, Seen, Prärie, felsiger Canadian Shield und Gebirge im Westen.",
    architecture: "Nordamerikanische Vorstädte; französische Hinweise und spezielle Straßenformen in Québec.",
    meta: "GeoGuessr Meta: Dichte und Alter der Abdeckung variieren regional; km/h ist der stabile Trennhinweis zu den USA.",
    clues: [
      ["VERY HIGH", "Schilder", "Geschwindigkeiten in km/h trotz nordamerikanischem Straßenbild", "nationaler Standard"],
      ["HIGH", "Straßenmarkierung", "Gelbe Gegenverkehrs- und weiße Randlinien"],
      ["HIGH", "Landschaft", "Borealer Wald, Seen oder extrem weite Prärie"],
      ["MEDIUM", "Sprache", "Französisch in Québec und zweisprachige Bundesbeschilderung"],
    ],
    confusedWith: ["USA"],
    distinguish: { USA: "Kanada zeigt km/h, häufig Provinzsymbole und in Teilen Französisch; die USA verwenden mph." },
  });

  define("MEX", {
    name: "Mexiko", domain: ".mx", center: "gelb", edge: "weiß", certainty: "gelbe Mittellinien auf Überlandstraßen sehr häufig",
    asphalt: "Von glatten Mautautobahnen bis zu rauen, geflickten Landstraßen",
    roadWidth: "Hauptachsen breit; lokale Straßen oft ohne Schulter oder Markierung",
    shoulders: "Staubig, kiesig oder direkt bebaut; Bordsteine in Städten oft bemalt",
    bollards: "Beton- und Kunststoffleitpfosten; regionale Unterschiede groß.",
    signs: "Spanische Beschriftung; rautenförmige Warnschilder und grüne Wegweisung häufig.",
    poles: "Betonmasten sind sehr häufig, oft mit dichter Verkabelung.",
    plates: "Überwiegend helle Platten, bundesstaatlich variabel; Front-/Heckregeln unterscheiden sich.",
    languages: ["Spanisch", "zahlreiche indigene Sprachen"],
    landscape: "Trockene Hochebenen und Kakteen im Norden, vulkanisches Hochland, tropischer Süden.",
    architecture: "Flachdächer, unverputzter Beton, farbige Fassaden und hohe Mauern.",
    meta: "GeoGuessr Meta: Abdeckung und Bildqualität sind regional unterschiedlich; Fahrzeugmeta nicht allein nutzen.",
    clues: [
      ["VERY HIGH", "Sprache", "Spanisch im nordamerikanischen Straßenbild"],
      ["HIGH", "Straßenmarkierung", "Gelbe Mittellinie, weiße Außenlinien auf größeren Straßen"],
      ["HIGH", "Infrastruktur", "Betonmasten und dichte Freileitungen"],
      ["HIGH", "Architektur", "Flachdach-Betonbauten und bemalte Bordsteine"],
    ],
    confusedWith: ["USA", "GTM"],
    distinguish: { USA: "Spanisch, km/h, Betonmasten und dichteres unregelmäßiges Straßenrandbild sprechen für Mexiko." },
  });

  // South America
  define("BRA", {
    name: "Brasilien", domain: ".br", center: "gelb", edge: "weiß", certainty: "gelbe Gegenverkehrslinie sehr häufig",
    asphalt: "Häufig dunkler oder rötlich bestäubter Asphalt; Qualität variiert stark",
    roadWidth: "Fernstraßen von schmal bis mehrspurig; Schultern oft schmal oder erdig",
    shoulders: "Rote Erde, Gras oder offene Entwässerungsgräben häufig",
    bollards: "Weiße Leitpfosten und Betonmarker variieren; schwarze Rückseiten vieler Schilder sind nützlich.",
    signs: "Portugiesisch; gelbe Rautenwarnschilder, häufig dunkle oder schwarze Schildrückseiten.",
    poles: "Betonmasten mit charakteristischen Loch- oder Querträgerformen sind verbreitet.",
    plates: "Heute Mercosur-Stil weiß; ältere graue Platten in historischen Bildern möglich.",
    languages: ["Portugiesisch"],
    landscape: "Rote Böden, tropische Vegetation, Cerrado, Küstengebirge und riesige Agrarflächen.",
    architecture: "Ziegeldächer, Mauern, offene Gräben und farbige Betonfassaden.",
    meta: "GeoGuessr Meta: Kamera- und Fahrzeugmerkmale können nach Bildalter variieren; Portugiesisch ist robuster.",
    clues: [
      ["VERY HIGH", "Sprache", "Portugiesisch – besonders ão, lh und nh"],
      ["HIGH", "Boden", "Rote Erde und rötlicher Staub"],
      ["HIGH", "Schilder", "Häufig schwarze Schildrückseiten"],
      ["HIGH", "Straßenmarkierung", "Gelbe Mitte, weiße Außenlinien"],
    ],
    confusedWith: ["COL", "MEX", "ARG"],
    distinguish: { COL: "Portugiesisch und häufig rote Erde; Kolumbien ist spanisch und hat andere Platten-/Kreuzmast-Hinweise.", ARG: "Brasilien ist meist tropischer, rötlicher und portugiesisch beschriftet." },
  });

  define("ARG", {
    name: "Argentinien", domain: ".ar", center: "weiß", edge: "weiß", certainty: "weiße Mittellinie auf normalen zweispurigen Landstraßen nach aktuellem nationalem Standard",
    asphalt: "Sehr lange Straßen; Patagonien rau und offen, Pampas flach und agrarisch",
    roadWidth: "Fernstraßen meist zweispurig, oft mit breiten Gras- oder Kiesrändern",
    shoulders: "Unbefestigt bis teilweise befestigt; offene Entwässerung",
    bollards: "Weiße Leitpfosten mit dunklen Feldern; Design nicht allein eindeutig.",
    signs: "Spanische Beschriftung; grüne Richtungsschilder und rautenförmige Warnschilder häufig.",
    poles: "Holz- und Betonmasten; lange Zaunlinien in Pampas und Patagonien.",
    plates: "Mercosur-Platten weiß; ältere schwarze Mitte kann durch Blur wie ein Punkt wirken, aber nicht sicher.",
    languages: ["Spanisch"],
    landscape: "Flache Pampas, trockene patagonische Steppe, Anden und subtropischer Norden.",
    architecture: "Europäisch geprägte Städte, flache Farmlandschaften und windgeprägte Patagonien-Bauten.",
    meta: "GeoGuessr Meta: Ein dunkler Blur-Punkt an älteren Platten ist nur ein schwacher Zusatzhinweis.",
    clues: [
      ["VERY HIGH", "Landschaft", "Weite Pampas oder windige patagonische Steppe"],
      ["HIGH", "Straßenmarkierung", "Aktuell meist weiße gestrichelte Mitte und weiße Außenlinien auf normalen zweispurigen Rutas", "amtlicher Standard seit 2025; straßentypabhängig"],
      ["HIGH", "Straße", "Sehr lange, gerade Rutas durch offene Landschaft"],
      ["MEDIUM", "Platten", "Mercosur-Platten; ältere Blur-Muster nur ergänzend"],
    ],
    confusedWith: ["URY", "CHL", "ZAF"],
    distinguish: { URY: "Uruguay wirkt meist grüner, sanfter und dichter beweidet; Argentinien hat größere trockene Räume.", CHL: "Beide können weiße Straßenmarkierungen zeigen; Landschaft, Andennähe, Straßenbau und Beschilderung gemeinsam prüfen.", ZAF: "Argentinien fährt rechts und hat gewöhnlich weiße Außenlinien; Südafrika fährt links und nutzt gelbe Außenlinien." },
  });

  define("URY", {
    name: "Uruguay", domain: ".uy", center: "weiß im Grundmuster; gelb-weiß-gelbe Sonderkombination", edge: "weiß", certainty: "normatives weißes Grundmuster; auffällige dreifache Sondervariante ist GeoGuessr-relevant, aber nicht universal",
    asphalt: "Sanft wellige Landstraßen, oft bei bedecktem Himmel und zwischen Weideflächen",
    roadWidth: "Zweispurige Rutas mit grasigen Schultern",
    shoulders: "Breite Grasränder, flache Gräben und Zaunlinien",
    bollards: "Weiße Leitpfosten; Details variieren nach Route.",
    signs: "Spanische Beschriftung; lateinamerikanische Rautenwarnschilder.",
    poles: "Holz- und Betonmasten entlang offener Weidelandschaft.",
    plates: "Weiße Mercosur-Platten; Format ähnelt den Nachbarn.", languages: ["Spanisch"],
    landscape: "Grüne, sanft rollende Weiden, Eukalyptusreihen, wenig dramatisches Relief.",
    architecture: "Niedrige Häuser, gepflegte Farmen und kleine Ortschaften.",
    meta: "GeoGuessr Meta: Häufig bedecktes Bildwetter ist eine Beobachtung, kein geografischer Beweis.",
    clues: [
      ["VERY HIGH", "Landschaft", "Grüne, sanft wellige Weidelandschaft"],
      ["HIGH", "Straße", "Rutas mit breiten Grasrändern und flachen Gräben"],
      ["VERY HIGH", "Straßenmarkierung", "Auffällige Sondervariante: weiße Strichlinie zwischen zwei gelben Sperrlinien", "häufiger GeoGuessr-Hinweis, nicht universal"],
      ["MEDIUM", "Meta", "Oft bedeckte Aufnahmen – nur als Zusatzhinweis", "nicht universal"],
    ],
    confusedWith: ["ARG", "BRA"],
    distinguish: { ARG: "Uruguay ist im Mittel grüner, kleiner strukturiert und sanft hügelig.", BRA: "Uruguay ist spanisch, weniger tropisch und hat seltener rote Erde." },
  });

  define("CHL", {
    name: "Chile", domain: ".cl", center: "weiß", edge: "weiß", certainty: "weiße Mittellinien sind im südamerikanischen Vergleich auffällig, aber Straßentypen variieren",
    asphalt: "Von trockenen Wüstenautobahnen bis zu nassen südlichen Waldstraßen",
    roadWidth: "Hauptachsen gut ausgebaut; Berg- und Küstenstraßen schmaler",
    shoulders: "Wüste, Fels, Gräben oder befestigte Schultern je nach Klimazone",
    bollards: "Weiße Leitpfosten und schwarz-weiße Kurvenmarkierungen kommen vor.",
    signs: "Spanisch; klare moderne Wegweisung und lateinamerikanische Warnrauten.",
    poles: "Holz- und Betonmasten; trockener Norden oft mit sehr kahlen Trassen.",
    plates: "Weiße Platten mit dunklen Zeichen; vorn und hinten üblich.", languages: ["Spanisch"],
    landscape: "Atacama-Wüste, mediterranes Zentraltal, Anden, Fjorde und temperierter Regenwald.",
    architecture: "Erdbebengeprägte Bauweise; bunte Wellblechhäuser im Süden, Leichtbau in trockenen Orten.",
    meta: "GeoGuessr Meta: Die außergewöhnliche Nord-Süd-Klimaspanne macht Landschaft nur mit Straßenhinweisen verlässlich.",
    clues: [
      ["VERY HIGH", "Straßenmarkierung", "Häufig weiße Mittellinie – auffällig in Südamerika"],
      ["HIGH", "Landschaft", "Anden fast immer relativ nah; extrem schmaler Klimakorridor"],
      ["HIGH", "Boden", "Kahler Atacama-Norden oder kühler regenreicher Süden"],
      ["MEDIUM", "Infrastruktur", "Ordentliche Fernstraßen und markante Kurvenpfosten"],
    ],
    confusedWith: ["ARG", "PER", "BOL"],
    distinguish: { ARG: "Weiße Mittellinien kommen heute in beiden Ländern vor; Chiles schmaler Anden-Küsten-Korridor und Infrastruktur sind verlässlichere Trennhinweise.", PER: "Chile wirkt meist geordneter und nutzt häufiger weiße Mitte; Peru zeigt häufiger schwarz-weiße Pfosten.", BOL: "Chile hat bessere markierte Fernstraßen und viel tiefere Küstenwüste." },
  });

  define("PER", {
    name: "Peru", domain: ".pe", center: "gelb", edge: "weiß", certainty: "häufig auf Hauptstraßen",
    asphalt: "Schmale Küsten- und Andenstraßen, oft staubig, geflickt und an steilen Hängen",
    roadWidth: "Hauptstraßen zweispurig; Bergstraßen häufig schmal mit engem Rand",
    shoulders: "Staub, Fels, offene Gräben; kaum befestigte Schulter in den Bergen",
    bollards: "Schwarz-weiß bemalte Pfosten, Mauerkanten und Schutzbauten sind ein starker regionaler Hinweis.",
    signs: "Spanische Beschriftung; Rautenwarnschilder, häufig an schwarz-weißen Trägern oder Sockeln.",
    poles: "Betonmasten mit einfacher Verkabelung; dicht in Bergdörfern.",
    plates: "Helle Platten; Detail meist schwach.", languages: ["Spanisch", "Quechua", "Aymara"],
    landscape: "Extrem trockene Küste, steile Anden, Hochland und feuchter Amazonasrand.",
    architecture: "Unverputzte Ziegel- und Betonbauten, Flachdächer in trockenen Hochlagen.",
    meta: "GeoGuessr Meta: Fahrzeug- oder Kamerahinweise nur zusammen mit den stabilen Pfosten- und Landschaftsmerkmalen nutzen.",
    clues: [
      ["VERY HIGH", "Bollards", "Schwarz-weiß bemalte Straßenpfosten und Mauerkanten"],
      ["HIGH", "Landschaft", "Trockene, steile Andentäler und kahle Küstenwüste"],
      ["HIGH", "Architektur", "Unverputzte Ziegelbauten an trockenen Hängen"],
      ["HIGH", "Straßenmarkierung", "Gelbe Mitte, weiße Außenlinien auf Hauptachsen"],
    ],
    confusedWith: ["BOL", "ECU", "CHL"],
    distinguish: { BOL: "Peru hat mehr Küstenwüste und häufig markantere schwarz-weiße Straßenobjekte.", ECU: "Peru ist meist trockener und kahler; Ecuador grüner und kompakter.", CHL: "Peru nutzt häufiger gelbe Mitte und wirkt infrastrukturell unregelmäßiger." },
  });

  define("BOL", {
    name: "Bolivien", domain: ".bo", center: "gelb", edge: "weiß", certainty: "häufig auf markierten Hauptstraßen",
    asphalt: "Hochlandstraßen können rau und rissig sein; viele Nebenachsen unbefestigt",
    roadWidth: "Von breiten Altiplano-Achsen bis zu sehr schmalen Bergstraßen",
    shoulders: "Staubig, steinig oder direkt in Hang und Abgrund übergehend",
    bollards: "Betonpfosten und schwarz-weiße Bemalungen kommen vor; nicht allein eindeutig.",
    signs: "Spanische Beschriftung; Wegweisung teils spärlich.",
    poles: "Einfache Betonmasten und Ziegelbauten im Hochland.",
    plates: "Weiße Platten; durch Blur selten stark.", languages: ["Spanisch", "Quechua", "Aymara", "Guaraní"],
    landscape: "Kahler Altiplano, extreme Höhe, Salzflächen, trockene Berge; grüner Tieflandosten.",
    architecture: "Unverputzte rote Ziegel, Flachdächer und dichte Hochlandsiedlungen.",
    meta: "GeoGuessr Meta: Höhengefühl und Vegetationsarmut sind robuster als Abdeckungsdetails.",
    clues: [
      ["VERY HIGH", "Landschaft", "Extrem hoch gelegenes, kahles Altiplano"],
      ["HIGH", "Architektur", "Rote unverputzte Ziegel und Flachdächer"],
      ["HIGH", "Straße", "Rauere Hochlandachsen mit staubigen Schultern"],
      ["MEDIUM", "Sprache", "Spanisch plus indigene Ortsnamen"],
    ],
    confusedWith: ["PER", "CHL", "ECU"],
    distinguish: { PER: "Bolivien wirkt häufiger als breite, sehr hohe Hochebene ohne Küste.", CHL: "Bolivien hat rauere Infrastruktur und mehr rote Ziegel; Chile häufig weiße Mittellinien.", ECU: "Bolivien ist höher, trockener und viel baumärmer." },
  });

  define("ECU", {
    name: "Ecuador", domain: ".ec", center: "gelb", edge: "weiß", certainty: "häufig auf Hauptstraßen",
    asphalt: "Kurvige Andenstraßen, häufig feucht; Küsten- und Amazonasstraßen tropisch",
    roadWidth: "Hauptachsen oft gut ausgebaut, Bergnebenstraßen schmal",
    shoulders: "Grasige Böschungen, Entwässerungsrinnen und dichter Bewuchs",
    bollards: "Beton- und Kunststoffleitpfosten variieren; Kurvenchevrons häufig.",
    signs: "Spanische Beschriftung; grüne Wegweisung und Rautenwarnschilder.",
    poles: "Betonmasten und dichte Leitungen in den Andentälern.",
    plates: "Weiße Platten mit orangefarbener Oberkante in vielen Aufnahmen als möglicher Zusatzhinweis.",
    languages: ["Spanisch", "Kichwa"],
    landscape: "Grüne hohe Anden, vulkanische Kegel, tropische Küste und dichter Amazonasrand.",
    architecture: "Beton- und Ziegelhäuser, Gewächshäuser und intensive Landwirtschaft in Hochlandtälern.",
    meta: "GeoGuessr Meta: Fahrzeughinweise können editionsabhängig sein; Vegetation und Platten nur kombiniert nutzen.",
    clues: [
      ["VERY HIGH", "Landschaft", "Sehr grüne, dicht besiedelte Anden mit Vulkanformen"],
      ["HIGH", "Straße", "Kurvige feuchte Bergstraßen mit offenen Rinnen"],
      ["MEDIUM", "Platten", "Mögliche orange Oberkante – nur ergänzend", "häufig, nicht universal"],
      ["MEDIUM", "Infrastruktur", "Betonmasten in engen Bergtälern"],
    ],
    confusedWith: ["COL", "PER", "BOL"],
    distinguish: { COL: "Ecuador wirkt kompakter und vulkanischer; Kolumbien hat oft gelbe Platten.", PER: "Ecuador ist wesentlich grüner und feuchter.", BOL: "Ecuador ist niedriger, dichter bewachsen und infrastrukturell kompakter." },
  });

  define("COL", {
    name: "Kolumbien", domain: ".co", center: "gelb", edge: "weiß", certainty: "gelbe Mittellinie sehr häufig",
    asphalt: "Kurvige Bergstraßen, tropische Tieflandachsen und häufig stark bebaute Straßenränder",
    roadWidth: "Hauptachsen meist zweispurig; in Bergen enge Kurven und steile Böschungen",
    shoulders: "Offene Entwässerungsrinnen, Betonränder oder dichter Bewuchs",
    bollards: "Leitpfosten und Kurvenchevrons variieren; colombian-cross-Mastformen können ein Hinweis sein.",
    signs: "Spanisch; Rautenwarnschilder und grüne Wegweisung.",
    poles: "Betonmasten, teils mit kreuzförmigen Öffnungen oder Querarmen, sind ein bekannter visueller Hinweis.",
    plates: "Gelbe Kennzeichen vorn und hinten sind ein sehr starker Kolumbien-Hinweis.",
    languages: ["Spanisch"],
    landscape: "Üppige Anden, Kaffeehänge, Palmen, tropische Täler und dicht besiedelte Bergkorridore.",
    architecture: "Bunte Beton- und Ziegelhäuser oft direkt an kurvigen Straßen.",
    meta: "GeoGuessr Meta: Kennzeichenfarbe und reale Infrastruktur sind stabiler als Google-Car-Eigenheiten.",
    clues: [
      ["VERY HIGH", "Kennzeichen", "Gelbe Kennzeichen vorn und hinten", "national sehr charakteristisch"],
      ["HIGH", "Landschaft", "Üppige, steile Anden mit dichter Straßenrandbebauung"],
      ["HIGH", "Infrastruktur", "Betonmasten mit auffälligen Kreuz-/Querformen"],
      ["HIGH", "Straßenmarkierung", "Gelbe Mitte und weiße Außenlinien"],
    ],
    confusedWith: ["ECU", "BRA", "MEX"],
    distinguish: { ECU: "Gelbe Kennzeichen sind der klarste Trennhinweis zu Ecuador.", BRA: "Kolumbien ist spanisch und zeigt gelbe Platten; Brasilien portugiesisch.", MEX: "Kolumbien ist häufiger sehr grün und bergig; gelbe Platten sind stark." },
  });

  // Oceania
  define("AUS", {
    name: "Australien", domain: ".au", center: "weiß", edge: "weiß", certainty: "weiße Markierungen sind typisch; gelbe Linien sind kein Standardmuster wie im südlichen Afrika",
    asphalt: "Oft rötlich bestäubt, grob und sehr lang; urbane Straßen breiter",
    roadWidth: "Landstraßen von schmalen unmarkierten Bändern bis zu breiten Highways",
    shoulders: "Rote Erde, Kies oder trockene Grasränder; breite befestigte Schulter auf Hauptachsen",
    bollards: "Weiße Leitpfosten mit schwarzen oder roten Reflektordetails; australische Varianten sind lernbar.",
    signs: "Gelbe rautenförmige Warnschilder, oft mit Tier-Symbolen; Geschwindigkeiten in km/h.",
    poles: "Holz- und Betonmasten; weite Abschnitte ohne Leitungen.",
    plates: "Bundesstaatlich verschieden, überwiegend hell; einzelne Staaten haben farbige Varianten.",
    languages: ["Englisch"],
    landscape: "Eukalyptus, rote Erde, trockenes Buschland, tropischer Norden und gemäßigte Küsten.",
    architecture: "Wellblechdächer, breite Veranden, niedrige Vorstädte und große Grundstücke.",
    meta: "GeoGuessr Meta: Abdeckung ist breit; Fahrzeugteile oder Kamerageneration nur ergänzend nutzen.",
    clues: [
      ["VERY HIGH", "Verkehr", "Linksverkehr", "nationaler Standard"],
      ["VERY HIGH", "Straßenmarkierung", "Typischerweise weiße Mitte und weiße Ränder"],
      ["HIGH", "Vegetation", "Eukalyptus und trockenes Buschland"],
      ["HIGH", "Schilder", "Gelbe Rautenwarnschilder mit australischen Tieren"],
    ],
    confusedWith: ["NZL", "ZAF"],
    distinguish: { NZL: "Australien ist meist trockener, flacher und roter; Neuseeland grüner und bergiger.", ZAF: "Australien hat im Normalfall weiße Außenlinien; Südafrika gelbe." },
  });

  define("NZL", {
    name: "Neuseeland", domain: ".nz", center: "weiß", edge: "weiß", certainty: "weiße Linien häufig; gelbe Linien markieren Halte-/Überholverbote, nicht das südafrikanische Außenlinienmuster",
    asphalt: "Schmale, kurvige Chipseal-Straßen; Oberfläche wirkt oft grob und hell gesprenkelt",
    roadWidth: "Landstraßen häufig schmal mit wenig Schulter; einspurige Brücken möglich",
    shoulders: "Grasige Ränder, offene Entwässerungsgräben und häufig keine befestigte Schulter",
    bollards: "Weiße Leitpfosten mit schwarzen Feldern, rote/weiße Reflektoren; sehr präsent auf Kurvenstraßen.",
    signs: "Gelbe Rautenwarnschilder; britisch geprägte Symbolik und englische Ortsnamen, dazu Māori.",
    poles: "Holzmasten und schlanke Betonmasten in Weide- und Hügellandschaften.",
    plates: "Weiße Platten vorn und hinten.", languages: ["Englisch", "Māori"],
    landscape: "Sehr grün, hügelig bis alpin, Schafweiden, Farne und windige Küsten.",
    architecture: "Freistehende Holzhäuser, Wellblechdächer und Zäune entlang von Weiden.",
    meta: "GeoGuessr Meta: Abdeckungsalter variiert; Straßenoberfläche und Landschaft sind zuverlässiger.",
    clues: [
      ["VERY HIGH", "Landschaft", "Sehr grüne, steile Weidehügel und Farne"],
      ["HIGH", "Straße", "Schmale grobe Chipseal-Straßen mit Grasrändern"],
      ["HIGH", "Verkehr", "Linksverkehr", "nationaler Standard"],
      ["HIGH", "Infrastruktur", "Weiße Leitpfosten und häufig einspurige Brücken"],
    ],
    confusedWith: ["AUS", "GBR", "IRL"],
    distinguish: { AUS: "Neuseeland ist grüner, steiler und hat schmalere kurvige Straßen.", GBR: "Neuseeland nutzt gelbe Rautenwarnschilder statt britischer Dreiecke.", IRL: "Neuseeland hat gelbe Rauten und andere Leitpfosten; Irland europäische Dreiecksschilder." },
  });

  // East and Southeast Asia
  define("JPN", {
    name: "Japan", domain: ".jp", center: "weiß", edge: "weiß", certainty: "häufig; gelbe Mittellinien zeigen Verbote und sind ebenfalls verbreitet",
    centerStyle: "Weiße oder gelbe Mitte je nach Überholregel; sehr viele schmale Straßen ohne Mitte",
    asphalt: "Dunkel, sauber und oft eng zwischen Entwässerungsrinnen, Mauern und Gebäuden",
    roadWidth: "Lokale Straßen extrem schmal; Hauptstraßen klar markiert",
    shoulders: "Tiefe offene Betonrinnen, weiße Randlinien und kaum Platz neben der Fahrbahn",
    bollards: "Zahlreiche reflektierende Pfosten, Spiegel und orange-schwarze Schutzobjekte.",
    signs: "Japanische Schrift; blaue Richtungsschilder, rote Dreiecks-Stoppschilder mit 止まれ.",
    poles: "Dichte Betonmasten mit komplexer Verkabelung sind sehr typisch.",
    plates: "Weiße oder gelbe Kei-Car-Platten; grüne Zeichen bei Privatfahrzeugen.",
    languages: ["Japanisch"],
    landscape: "Steile bewaldete Berge, Reisfelder, dichte Küstenebenen und subtropischer Süden.",
    architecture: "Ziegeldächer, enge Siedlungen, Automaten, Mauern und sehr saubere Straßenräume.",
    meta: "GeoGuessr Meta: Niedrige Kameraposition in älteren Aufnahmen kann auffallen, ist aber kein dauerhafter Beweis.",
    clues: [
      ["VERY HIGH", "Sprache", "Kana und Kanji"],
      ["VERY HIGH", "Infrastruktur", "Dichte Betonmasten und offene Betonrinnen"],
      ["HIGH", "Verkehr", "Linksverkehr", "nationaler Standard"],
      ["HIGH", "Kennzeichen", "Gelbe Kei-Car-Platten neben weißen Platten"],
    ],
    confusedWith: ["KOR", "TWN"],
    distinguish: { KOR: "Japan fährt links und nutzt japanische Kana; Südkorea fährt rechts und verwendet Hangul.", TWN: "Japan fährt links; Taiwan rechts. Japanische Kana sind eindeutig." },
  });

  define("KOR", {
    name: "Südkorea", domain: ".kr", center: "gelb", edge: "weiß", certainty: "gelbe Mittellinien sind sehr häufig; weiße Fahrstreifentrennung",
    asphalt: "Gut ausgebaute, oft breite Straßen mit dichter Markierung und Stadtinfrastruktur",
    roadWidth: "Viele mehrspurige Achsen; ländliche Straßen schmaler zwischen Reisfeldern",
    shoulders: "Betonrinnen, Bordsteine und befestigte Ränder häufig",
    bollards: "Schwarz-gelbe Schutzpfosten und flexible orange/weiße Poller häufig, aber nicht exklusiv.",
    signs: "Hangul; grüne/blaue Wegweisung, oft mit englischer Umschrift.",
    poles: "Betonmasten und dichte Verkabelung; Gewächshauslandschaften häufig.",
    plates: "Lange weiße Platten mit koreanischen Zeichen.", languages: ["Koreanisch"],
    landscape: "Hügeliges bis bergiges Land, dichte Städte, Reisfelder und viele Gewächshäuser.",
    architecture: "Mehrgeschossige helle Gebäude, bunte Dächer und sehr dichte Siedlungsränder.",
    meta: "GeoGuessr Meta: Schrift und Verkehrsseite sind wesentlich stabiler als Kamerahinweise.",
    clues: [
      ["VERY HIGH", "Sprache", "Hangul-Schrift"],
      ["VERY HIGH", "Verkehr", "Rechtsverkehr – klare Trennung zu Japan", "nationaler Standard"],
      ["HIGH", "Straßenmarkierung", "Gelbe Mittellinie, weiße Fahrstreifen"],
      ["HIGH", "Landschaft", "Hügel, Reisfelder, Gewächshäuser und dichte Bebauung"],
    ],
    confusedWith: ["JPN", "TWN"],
    distinguish: { JPN: "Südkorea fährt rechts und nutzt Hangul; Japan links und Kana/Kanji.", TWN: "Koreanisches Hangul unterscheidet sich klar von chinesischen Zeichen." },
  });

  define("THA", {
    name: "Thailand", domain: ".th", center: "gelb", edge: "weiß", certainty: "gelbe Trennung von Gegenverkehr und weiße Fahrstreifen häufig",
    asphalt: "Viele breite, gut markierte Fernstraßen; lokale Wege schmaler und unmarkiert",
    roadWidth: "Hauptstraßen oft sehr breit mit Seitenfahrbahnen oder breiten Schultern",
    shoulders: "Befestigte Schultern, Entwässerungsgräben und dichter Straßenrandhandel",
    bollards: "Schwarz-weiß bemalte Sockel und Betonpfosten kommen häufig vor.",
    signs: "Thailändische Schrift, oft mit englischer Umschrift; gelbe Rautenwarnschilder.",
    poles: "Betonmasten mit dichter, oft unübersichtlicher Verkabelung.",
    plates: "Weiße Platten mit thailändischer Schrift; Nutzfahrzeuge können farbige Varianten haben.",
    languages: ["Thai"],
    landscape: "Tropische Ebenen, Reisfelder, trockenerer Nordosten und bewaldete Berge im Norden.",
    architecture: "Bunte Tempeldächer, offene Ladenfronten und Häuser auf Pfosten in feuchten Gebieten.",
    meta: "GeoGuessr Meta: Abdeckungs- und Fahrzeughinweise sind versionsabhängig; Schrift ist eindeutig.",
    clues: [
      ["VERY HIGH", "Sprache", "Unverwechselbare thailändische Rundschrift"],
      ["VERY HIGH", "Verkehr", "Linksverkehr", "nationaler Standard"],
      ["HIGH", "Straße", "Breite Fernstraßen mit gelber Mitte und weißen Fahrstreifen"],
      ["HIGH", "Infrastruktur", "Betonmasten und schwarz-weiße Sockel"],
    ],
    confusedWith: ["KHM", "LAO", "MYS"],
    distinguish: { MYS: "Thai-Schrift statt lateinischer/malaiischer Beschriftung; Thailand hat häufiger gelbe Gegenverkehrslinien.", KHM: "Thailand fährt links; Kambodscha rechts. Die Schriften unterscheiden sich im Detail.", LAO: "Thailand fährt links, Laos rechts; Lao-Schrift wirkt ähnlich, aber anders geformt." },
  });

  define("MYS", {
    name: "Malaysia", domain: ".my", center: "weiß", edge: "weiß", certainty: "weiße Markierungen sehr häufig; gelbe Rand-/Verbotslinien können vorkommen",
    asphalt: "Gut ausgebaute dunkle Straßen in üppig tropischer Umgebung",
    roadWidth: "Fernstraßen oft breit und mehrspurig; Kampung-Straßen schmaler",
    shoulders: "Befestigte Ränder, offene Betonrinnen und dichte Vegetation",
    bollards: "Schwarz-weiße Bordsteine und Leitobjekte häufig, regional variabel.",
    signs: "Malaiisch in lateinischer Schrift; grüne Fernstraßenwegweisung und britisch geprägte Symbole.",
    poles: "Betonmasten und geordnete, aber dichte Verkabelung.",
    plates: "Schwarze Platten mit weißen Zeichen sind ein sehr starker Hinweis.",
    languages: ["Malaiisch", "Englisch", "Chinesische Sprachen", "Tamil"],
    landscape: "Üppige Tropen, Ölpalmenplantagen, Kalksteinberge und moderne Städte.",
    architecture: "Moscheen, Shoplots, Ziegeldächer und gut ausgebaute Vororte.",
    meta: "GeoGuessr Meta: Kennzeichenfarbe und Fahrseite sind stabiler als sichtbare Fahrzeugteile.",
    clues: [
      ["VERY HIGH", "Kennzeichen", "Schwarze Platten mit weißen Zeichen"],
      ["VERY HIGH", "Verkehr", "Linksverkehr", "nationaler Standard"],
      ["HIGH", "Straße", "Gut ausgebaute tropische Straßen mit weißen Linien"],
      ["HIGH", "Vegetation", "Ölpalmen und üppige, geordnete Tropenlandschaft"],
    ],
    confusedWith: ["IDN", "THA", "SGP"],
    distinguish: { IDN: "Malaysia wirkt meist geordneter und nutzt häufig klare weiße Markierungen; beide haben schwarze Platten.", THA: "Malaysia nutzt lateinische malaiische Schrift und häufiger weiße Mitte; Thailand Thai-Schrift und oft gelbe Mitte.", SGP: "Singapur ist deutlich urbaner und extrem gepflegt." },
  });

  define("IDN", {
    name: "Indonesien", domain: ".id", center: "gelb auf Nationalstraßen; weiß oder unmarkiert auf anderen Straßenklassen", edge: "weiß", certainty: "gelbe Mitte ist ein nützlicher Hinweis auf Nationalstraßen, aber kein universelles Landesmuster",
    asphalt: "Schmale, häufig raue Straßen mit dichter Bebauung und tropischer Vegetation",
    roadWidth: "Viele lokale Achsen sehr schmal; Hauptstraßen zweispurig und stark belebt",
    shoulders: "Kaum Schulter, offene Rinnen, Verkaufsstände und Häuser direkt am Asphalt",
    bollards: "Schwarz-weiß bemalte Sockel, Brücken und Pfosten häufig; regional variabel.",
    signs: "Indonesisch in lateinischer Schrift; rote/weiße Landesfarben oft an Mauern und Pfosten.",
    poles: "Betonmasten mit chaotischer dichter Verkabelung.",
    plates: "Seit 2022 werden neue oder erneuerte Privatplatten weiß mit schwarzer Schrift; ältere schwarze Platten mit weißer Schrift bleiben in Street View häufig.", languages: ["Indonesisch", "zahlreiche Regionalsprachen"],
    landscape: "Tropisch, vulkanisch, Reisfelder, Palmen und extrem dichte Siedlungen auf vielen Inseln.",
    architecture: "Ziegeldächer, Moscheen, enge Straßenläden und regionale Dachformen.",
    meta: "GeoGuessr Meta: Insel- und Bildabdeckung kann die Verteilung stark verzerren; nicht als reale Regel lesen.",
    clues: [
      ["HIGH", "Kennzeichen", "Ältere schwarze Platten sind in Street View häufig; neue oder erneuerte Platten sind seit 2022 weiß", "bildalterabhängig"],
      ["HIGH", "Straßenmarkierung", "Gelbe Mitte kennzeichnet Nationalstraßen; Provinz- und Lokalstraßen können weiß oder unmarkiert sein", "straßenklassenabhängig"],
      ["HIGH", "Straße", "Sehr schmale, dicht bebaute tropische Straßen"],
      ["HIGH", "Infrastruktur", "Betonmasten mit dichter Verkabelung und schwarz-weiße Sockel"],
      ["HIGH", "Verkehr", "Linksverkehr", "nationaler Standard"],
    ],
    confusedWith: ["MYS", "PHL"],
    distinguish: { MYS: "Indonesien wirkt dichter, chaotischer und hat häufiger unmarkierte schmale Straßen.", PHL: "Indonesien fährt links und nutzt schwarze Platten; die Philippinen fahren rechts und zeigen viel Englisch." },
  });

  define("PHL", {
    name: "Philippinen", domain: ".ph", center: "weiß im aktuellen Grundmuster; gelbe Varianten kommen vor", edge: "weiß", certainty: "weiße Mitte ist das aktuelle repräsentative Grundmuster; Bildalter und Straßenklasse erzeugen deutliche Varianten",
    asphalt: "Betonfahrbahnen sind sehr häufig, daneben Asphalt und stark geflickte Ortsstraßen",
    roadWidth: "Hauptachsen breit; lokale Straßen eng und dicht bebaut",
    shoulders: "Betonränder, offene Rinnen, Verkaufsstände und dichter Verkehr",
    roadStyles: [
      { label: "Beton-Hauptstraße", centerColor: "weiß", centerStyle: "dashed", leftEdgeColor: "weiß", rightEdgeColor: "weiß", lanes: 2, surface: "concrete", note: "aktuelles Grundmuster; gelbe Varianten kommen vor" },
      { label: "Lokale Straße", centerColor: "none", centerStyle: "none", leftEdgeColor: "none", rightEdgeColor: "none", lanes: 2, surface: "concrete", note: "oft unmarkiert" },
    ],
    bollards: "Schwarz-weiß oder schwarz-gelb bemalte Betonobjekte und Brückenkanten häufig.",
    signs: "Sehr viel Englisch; US-inspirierte gelbe Warnrauten und zahlreiche Barangay-Schilder.",
    poles: "Betonmasten mit dichter Verkabelung; Stromleitungen dominieren viele Straßenbilder.",
    plates: "Überwiegend helle Platten; Detail wechselt nach Ausgabejahr.", languages: ["Filipino", "Englisch", "Regionalsprachen"],
    landscape: "Tropisch, vulkanisch, Reisfelder, Kokospalmen und dichte Küstensiedlungen.",
    architecture: "Bunte Betonhäuser, Wellblechdächer, Sari-Sari-Läden und englische Werbung.",
    meta: "GeoGuessr Meta: Abdeckung ist nicht gleichmäßig über alle Inseln; Sprach- und Betoninfrastruktur ist robuster.",
    clues: [
      ["VERY HIGH", "Sprache", "Sehr viel Englisch im tropischen Südostasien"],
      ["VERY HIGH", "Verkehr", "Rechtsverkehr – Ausnahme im maritimen Vergleich", "nationaler Standard"],
      ["HIGH", "Straßenmarkierung", "Aktuelles weißes Grundmuster; gelbe Mittel- und Mehrfachlinien bleiben wichtige Varianten", "bild- und straßentypabhängig"],
      ["HIGH", "Straße", "Häufig helle Betonfahrbahnen"],
      ["HIGH", "Infrastruktur", "Dichte Betonmasten und Barangay-Schilder"],
    ],
    confusedWith: ["IDN", "MYS"],
    distinguish: { IDN: "Philippinen fahren rechts, nutzen viel Englisch und haben häufiger Betonstraßen.", MYS: "Philippinen fahren rechts und wirken infrastrukturell US-geprägter." },
  });

  // British Isles and Western Europe
  define("GBR", {
    name: "Vereinigtes Königreich", domain: ".uk", center: "weiß", edge: "weiß", certainty: "weiße Markierungen; gelbe Linien meist Park-/Haltebeschränkungen am Rand",
    asphalt: "Schmale, oft dunkle und geflickte Straßen; Hecken reichen häufig direkt an die Fahrbahn",
    roadWidth: "Viele sehr schmale Landstraßen ohne Mitte; Hauptachsen klar markiert",
    shoulders: "Oft keine Schulter, stattdessen Hecke, Mauer oder Bordstein",
    bollards: "Britische weiße Poller mit schwarzen Feldern; Keep-Left-Bollards in Städten.",
    signs: "Rote Dreieckswarnschilder; Geschwindigkeiten in mph; britische Schrift und Richtungspfeile.",
    poles: "Holzmasten und Steinhäuser in ländlichen Regionen; regionale Unterschiede groß.",
    plates: "Vorn weiß, hinten gelb – sehr starker Hinweis.", languages: ["Englisch", "Walisisch", "Schottisch-Gälisch"],
    landscape: "Grüne Heckenlandschaft, Moor, sanfte Hügel und regional dramatische Highlands.",
    architecture: "Backstein, Naturstein, Reihenhäuser und hohe Hecken.",
    meta: "GeoGuessr Meta: Trekker- und Inselabdeckung gesondert betrachten; Platten und mph sind stabil.",
    clues: [
      ["VERY HIGH", "Kennzeichen", "Vorn weiß, hinten gelb", "nationaler Standard"],
      ["VERY HIGH", "Verkehr", "Linksverkehr", "nationaler Standard"],
      ["HIGH", "Schilder", "mph-Limits und rote Dreieckswarnschilder"],
      ["HIGH", "Straße", "Schmale Heckenstraßen ohne Schulter"],
    ],
    confusedWith: ["IRL", "NZL"],
    distinguish: { IRL: "Irland nutzt km/h und meist weiße Platten hinten; irische Sprache kann erscheinen.", NZL: "Neuseeland hat gelbe Rautenwarnschilder statt britischer Dreiecke." },
  });

  define("IRL", {
    name: "Irland", domain: ".ie", center: "weiß", edge: "gelb", certainty: "gelbe harte Schulter-/Randlinien sind auf Nationalstraßen häufig",
    asphalt: "Schmale, unebene Landstraßen zwischen dichten Hecken; größere Nationalstraßen breiter",
    roadWidth: "Viele sehr schmale Nebenstraßen, Hauptachsen häufig mit gelb gestrichelten Seitenlinien",
    shoulders: "Gelb gestrichelte Seitenlinie kann einen breiten Seitenstreifen markieren; Nebenstraßen oft ohne Schulter",
    bollards: "Weiße Leitpfosten mit schwarzen Feldern; gelbe Reflektoren können auffallen.",
    signs: "Gelbe rautenförmige Warnschilder mit schwarzem Rand; km/h und oft zweisprachig Irisch/Englisch.",
    poles: "Holzmasten und Steinmauern in grüner Agrarlandschaft.",
    plates: "Weiße Platten vorn und hinten mit Jahres-/County-Struktur.", languages: ["Englisch", "Irisch"],
    landscape: "Sehr grüne Weiden, Steinmauern, Hecken, feuchtes Wetter und niedrige Hügel.",
    architecture: "Bunte Pubs, verputzte Einzelhäuser und Steinmauern.",
    meta: "GeoGuessr Meta: Wetterwirkung nicht überbewerten; gelbe Randlinie plus km/h ist stärker.",
    clues: [
      ["VERY HIGH", "Straßenmarkierung", "Gelbe Rand-/Schulterlinien auf größeren Straßen"],
      ["VERY HIGH", "Schilder", "Gelbe rautenförmige Warnschilder mit schwarzem Rand"],
      ["HIGH", "Kennzeichen", "Hinten weiß, anders als im Vereinigten Königreich"],
      ["HIGH", "Sprache", "Irisch und Englisch; km/h"],
    ],
    confusedWith: ["GBR", "NZL"],
    distinguish: { GBR: "Irland nutzt km/h, gelbe Rautenwarnschilder und weiße Heckplatten.", NZL: "Beide nutzen gelbe Rautenwarnschilder; Irland erkennt man zusätzlich an gelb gestrichelten Außenlinien, irischer Sprache und europäischen Kennzeichen." },
  });

  const westernEurope = {
    ESP: ["Spanien", ".es", "Mediterrane Trockenheit, rote oder helle Böden und vielfältige Gebirge", "Charakteristische spanische Leitpfosten mit schwarzem Rechteck; weiße EU-Platten", ["PRT", "ITA", "GRC"]],
    PRT: ["Portugal", ".pt", "Trockene Hügellandschaft, Eukalyptus, Korkeichen und häufig Kopfsteinpflaster in Orten", "Portugiesische Leitpfosten und blau-weiße Azulejos; gelbe Hauswandkanten kommen vor", ["ESP"]],
    FRA: ["Frankreich", ".fr", "Große Bandbreite von Bocage und Feldern bis Alpen und Mittelmeer", "Französische D-Straßen, weiße Leitpfosten und oft markante blaue Richtungshinweise", ["BEL", "ESP", "DEU"]],
    DEU: ["Deutschland", ".de", "Dichte Dörfer, Wälder und intensiv bewirtschaftete Felder", "Schwarz-weiße Leitpfosten mit schwarzem Rechteck und kleinen Reflektoren sind sehr stark", ["AUT", "NLD", "BEL"]],
    NLD: ["Niederlande", ".nl", "Extrem flach, Kanäle, Deiche und dichte Radinfrastruktur", "Rote Radwege; besondere Straßenmarkierungen mit Rand-/Mittelbändern auf Landstraßen", ["BEL", "DNK", "DEU"]],
    BEL: ["Belgien", ".be", "Dichte Bebauung, Backstein und oft rauere Straßenoberflächen", "Betonmasten und markante Straßenrandbebauung; regionale Sprachen Niederländisch/Französisch", ["NLD", "FRA", "LUX"]],
    LUX: ["Luxemburg", ".lu", "Grüne Hügellandschaft, sehr gepflegte Straßen und dichte Ortschaften", "Gelbe Kennzeichen vorn und hinten sind ein extrem starker Hinweis im kontinentalen Europa", ["BEL", "FRA", "DEU"]],
  };

  Object.entries(westernEurope).forEach(([iso3, [name, domain, landscape, signature, confusedWith]]) => define(iso3, {
    name, domain, center: "weiß", edge: "weiß", certainty: "europäischer Weißlinienstandard; lokale Varianten beachten",
    asphalt: "Überwiegend gut ausgebaute europäische Straßen; Zustand und Textur regional unterschiedlich",
    roadWidth: "Autobahnen breit, Landstraßen meist zweispurig, Ortsstraßen enger",
    shoulders: "Weiße Randlinien auf größeren Straßen; Nebenstraßen können ohne Randlinie sein",
    bollards: signature,
    signs: "Europäische rote Dreiecks- und Kreiszeichen; Sprache, Pfosten und Wegweisung sind die besseren Trennhinweise.",
    poles: iso3 === "BEL" ? "Betonmasten und dichte Freileitungen sind häufig sichtbar." : "Freileitungen und Masttypen variieren stark zwischen Stadt und Land.",
    plates: iso3 === "LUX" ? "Gelbe Kennzeichen vorn und hinten mit schwarzer Schrift." : iso3 === "NLD" ? "Gelbe Kennzeichen vorn und hinten; EU-Band links." : "Weiße EU-Kennzeichen; nationale Details sind meist klein.",
    languages: iso3 === "ESP" ? ["Spanisch", "Katalanisch", "Galicisch", "Baskisch"] : iso3 === "PRT" ? ["Portugiesisch"] : iso3 === "FRA" ? ["Französisch"] : iso3 === "DEU" ? ["Deutsch"] : iso3 === "NLD" ? ["Niederländisch"] : iso3 === "BEL" ? ["Niederländisch", "Französisch", "Deutsch"] : ["Luxemburgisch", "Französisch", "Deutsch"],
    landscape,
    architecture: "Regionale Dachformen, Mauerwerk und Siedlungsdichte sind nützliche Ergänzungen, aber selten allein eindeutig.",
    meta: "GeoGuessr Meta: Im dicht abgedeckten Westeuropa reale Straßenobjekte und Sprache vor Kamera-Meta priorisieren.",
    clues: [
      iso3 === "NLD" ? ["VERY HIGH", "Kennzeichen", "Gelbe Kennzeichen vorn und hinten", "nationaler Standard"] : ["VERY HIGH", iso3 === "LUX" ? "Kennzeichen" : "Länderprofil", signature],
      ...(iso3 === "NLD" ? [["HIGH", "Länderprofil", signature]] : []),
      ["HIGH", "Landschaft", landscape],
      ["HIGH", "Straßenmarkierung", "Weiße Mittel- und Randlinien; Nebenstraßen können unmarkiert sein"],
      ["MEDIUM", "Sprache", "Lokale Sprache und Ortsnamenschreibweise prüfen"],
    ],
    confusedWith,
    distinguish: Object.fromEntries(confusedWith.map((other) => [other, `${signature}. Mit Sprache, Leitpfosten und Straßenbau gegen ${other} absichern.`])),
  }));

  define("NLD", {
    name: "Niederlande", domain: ".nl", center: "weiß; auf bestimmten Außerortsstraßen grünes Mittelband", edge: "weiß",
    certainty: "Weiße Markierungen sind Standard; das grüne Mittelband ist charakteristisch, aber nicht auf jeder Straße vorhanden",
    centerStyle: "Weiße Mittelmarkierung; auf bestimmten Außerortsstraßen ein grünes Band zwischen doppelten weißen Linien",
    asphalt: "Meist sehr gepflegte Fahrbahnen mit klar getrennten Radwegen und dichter Straßenmöblierung",
    roadWidth: "Landstraßen kompakt und klar zoniert; Autobahnen und städtische Achsen breit",
    shoulders: "Weiße Randlinien, rote Radwege, Kanäle oder befestigte Seitenräume sind häufig",
    roadStyles: [
      { label: "Charakteristische Außerortsstraße", centerColor: "grün", centerStyle: "double", leftEdgeColor: "weiß", rightEdgeColor: "weiß", lanes: 2, note: "charakteristisch, nicht universal" },
      { label: "Gewöhnliche Landstraße", centerColor: "weiß", centerStyle: "dashed", leftEdgeColor: "weiß", rightEdgeColor: "weiß", lanes: 2, note: "häufig" },
    ],
    bollards: "Niederländische Leitpfosten, rote Radwege sowie besondere Rand-/Mittelbänder auf Landstraßen sind gemeinsam sehr nützlich.",
    signs: "Europäische Beschilderung; niederländische Ortsnamen und außergewöhnlich dichte Radwegweisung.",
    poles: "Freileitungen sind an Hauptachsen relativ selten; Straßenbeleuchtung und Radinfrastruktur dominieren.",
    plates: "Gelbe Kennzeichen vorn und hinten; EU-Band links.",
    languages: ["Niederländisch", "Friesisch regional"],
    landscape: "Extrem flach, Kanäle, Deiche, Gewächshäuser und dichte Radinfrastruktur.",
    architecture: "Backsteinhäuser, große Fenster, kompakte Orte und äußerst geordnete Straßenräume.",
    meta: "GeoGuessr Meta: Gelbe Kennzeichen und reale Rad-/Straßeninfrastruktur sind stabiler als Kamera-Meta.",
    clues: [
      ["VERY HIGH", "Kennzeichen", "Gelbe Kennzeichen vorn und hinten", "nationaler Standard"],
      ["VERY HIGH", "Infrastruktur", "Rote Radwege und außergewöhnlich dichte Radinfrastruktur"],
      ["HIGH", "Straßenmarkierung", "Grünes Mittelband zwischen weißen Linien auf bestimmten Außerortsstraßen", "charakteristisch, nicht universal"],
      ["HIGH", "Landschaft", "Extrem flach mit Kanälen, Deichen und Gewächshäusern"],
    ],
    confusedWith: ["BEL", "DNK", "DEU"],
    distinguish: {
      BEL: "Gelbe Kennzeichen vorn und hinten sowie dichtere rote Radwege sprechen klar für die Niederlande.",
      DNK: "Die Niederlande haben gelbe Kennzeichen und mehr Kanäle; Dänemark weiße Platten und sehr kurze Randstriche.",
      DEU: "Gelbe Kennzeichen, rote Radwege und Kanäle trennen die Niederlande meist schnell von Deutschland.",
    },
  });

  // Central, Eastern and Balkan Europe. Each entry owns a country-specific discriminator.
  const eastEurope = {
    POL: ["Polen", ".pl", "Rot-weiße Leitpfosten mit großem schwarzem Feld; häufig Betonplatten-Zäune", "Polnische Zeichen wie ł, ą, ę, sz und cz", ["CZE", "SVK", "LTU"]],
    CZE: ["Tschechien", ".cz", "Leitpfosten mit markanter schwarzer Fläche; häufig Obstbaumalleen und sanfte Hügel", "Tschechische Háčeks: č, ř, š, ž", ["SVK", "POL", "AUT"]],
    SVK: ["Slowakei", ".sk", "Ähnliche Leitpfosten wie Tschechien, aber häufiger bergiger und ländlicher", "Slowakische Zeichen wie ľ, ĺ, ô und Ortsnamen", ["CZE", "HUN", "POL"]],
    HUN: ["Ungarn", ".hu", "Flache Puszta, lange gerade Straßen und Beton-/Holzmasten", "Ungarische Buchstaben ő und ű sind stark", ["ROU", "SRB", "SVK"]],
    ROU: ["Rumänien", ".ro", "Viele Betonmasten mit Lochmustern, offene Gräben und lange Straßendörfer", "Rumänische Buchstaben ă, â, î, ș, ț", ["BGR", "HUN", "SRB"]],
    BGR: ["Bulgarien", ".bg", "Kyrillische Schrift, häufig rauere Straßen und trockene Balkanlandschaft", "Bulgarisches Ъ und kyrillische Ortsnamen", ["MKD", "SRB", "ROU"]],
    SRB: ["Serbien", ".rs", "Kyrillisch und Latein parallel, rote Ziegeldächer und offene Gräben", "Serbische Zeichen đ, ć, č sowie љ/њ", ["HRV", "BGR", "MNE"]],
    HRV: ["Kroatien", ".hr", "Rote Ziegeldächer, Karst und mediterrane Küste; gut markierte Straßen", "Kroatische č, ć, đ, š, ž und Ortsnamen", ["SVN", "MNE", "SRB"]],
    SVN: ["Slowenien", ".si", "Sehr grün, alpin und gepflegt; kleine Dörfer mit steilen Dächern", "Slowenische Ortsnamen und häufig makellose alpine Straßen", ["HRV", "AUT", "SVK"]],
    MNE: ["Montenegro", ".me", "Dramatische kahle Karstberge direkt an Küste oder engen Tälern", "Montenegrinische/serbische Sprache und extrem steiles Relief", ["HRV", "ALB", "SRB"]],
    MKD: ["Nordmazedonien", ".mk", "Trockene Becken und Berge, kyrillische Schrift und rote Ziegeldächer", "Mazedonisches ѓ/ќ und zweisprachige Hinweise in Teilen des Landes", ["BGR", "ALB", "SRB"]],
    ALB: ["Albanien", ".al", "Kahle Berge, unfertige Betonbauten, Wassertanks und dichter Straßenrandbau", "Albanische Wörter mit ë und q; rote Flaggen häufig", ["MNE", "MKD", "GRC"]],
    GRC: ["Griechenland", ".gr", "Griechische Schrift, trockene Olivenlandschaft und weißer Kalkstein", "Gelbe Randlinien kommen auf manchen Straßen vor; nicht als universale Regel behandeln", ["TUR", "ALB", "ITA"]],
    TUR: ["Türkei", ".tr", "Sehr vielfältig: trockene Hochflächen, Mittelmeer, Schwarzes Meer und dichte Städte", "Türkische Buchstaben ğ, ı, ş, ç und häufig rote Flaggen", ["GRC", "BGR", "ROU"]],
  };

  Object.entries(eastEurope).forEach(([iso3, [name, domain, signature, languageClue, confusedWith]]) => define(iso3, {
    name, domain, center: "weiß", edge: iso3 === "GRC" ? "gelb oder weiß" : "weiß",
    certainty: "häufig auf Hauptstraßen; Qualität und Vollständigkeit regional unterschiedlich",
    asphalt: "Von glatten Transitachsen bis zu rauen, geflickten Regionalstraßen",
    roadWidth: "Hauptstraßen zweispurig; Dörfer und Bergachsen häufig enger",
    shoulders: "Gras, Kies, offene Entwässerungsgräben oder Bordstein je nach Siedlungsform",
    bollards: signature,
    signs: `Europäische Schilderformen; ${languageClue}.`,
    poles: "Beton- und Holzmasten sind je nach Region häufig; Form und Lochmuster zusammen mit Sprache bewerten.",
    plates: "Überwiegend weiße europäische Platten; EU-Band abhängig vom Land und Bildalter.",
    languages: [languageClue],
    landscape: signature,
    architecture: "Ziegel-, Putz- und Betonbauten; Dächer, Zäune und Straßendörfer sind wichtige regionale Ergänzungen.",
    meta: "GeoGuessr Meta: Abdeckungsalter und Kamerageneration wechseln; Schrift, Leitpfosten und Straße zuerst prüfen.",
    clues: [
      ["VERY HIGH", "Länderprofil", signature],
      ["HIGH", "Sprache", languageClue],
      ["HIGH", "Straßenmarkierung", iso3 === "GRC" ? "Weiße Mitte; gelbe oder weiße Randlinien je nach Straße" : "Weiße Mittel- und Randlinien auf Hauptstraßen"],
      ["MEDIUM", "Infrastruktur", "Leitpfosten, Mastform und offene Gräben zusammen vergleichen"],
    ],
    confusedWith,
    distinguish: Object.fromEntries(confusedWith.map((other) => [other, `${signature}. Gegen ${other} zusätzlich Schrift, Leitpfosten und Relief prüfen.`])),
  }));

  function applyConservativePattern(isoCodes, template, confidence, note) {
    isoCodes.forEach((iso3) => {
      const country = countries[iso3];
      if (!country || country.roadMapPattern.confidence !== "unknown") return;
      country.roadMapPattern = {
        center: { ...template.center },
        leftEdge: { ...template.leftEdge },
        rightEdge: { ...template.rightEdge },
        confidence,
        notes: `${country.name}: ${note}`,
      };
    });
  }

  const allWhitePattern = {
    center: { color: "white", style: "dashed", count: 1 },
    leftEdge: { color: "white", style: "solid" },
    rightEdge: { color: "white", style: "solid" },
  };
  const whiteCenterNoEdgesPattern = {
    center: { color: "white", style: "dashed", count: 1 },
    leftEdge: { color: "none", style: "none" },
    rightEdge: { color: "none", style: "none" },
  };
  const yellowCenterPattern = {
    center: { color: "yellow", style: "dashed", count: 1 },
    leftEdge: { color: "white", style: "solid" },
    rightEdge: { color: "white", style: "solid" },
  };
  const yellowOuterPattern = {
    center: { color: "white", style: "dashed", count: 1 },
    leftEdge: { color: "yellow", style: "solid" },
    rightEdge: { color: "yellow", style: "solid" },
  };

  // Conservative per-country map symbols for records whose detailed profiles are not yet curated.
  // These deliberately carry low/medium confidence and describe a representative marked main road,
  // not a universal rule for every road in the country.
  applyConservativePattern(
    ["RUS", "BLR", "UKR", "AUT", "MDA", "LTU", "LVA", "EST", "CHE", "ITA", "BIH", "KOS", "AND", "LIE", "MLT", "FRO", "MCO", "SMR", "VAT", "GRL", "FLK"],
    allWhitePattern,
    "medium",
    "Repräsentatives Muster einer markierten Hauptstraße; Nebenstraßen können ohne Außen- oder Mittellinien auskommen.",
  );
  applyConservativePattern(
    ["PAN", "CRI", "NIC", "HND", "SLV", "GTM", "BLZ", "PRI", "DOM", "HTI", "CUB", "VEN", "GUY", "SUR", "PRY"],
    yellowCenterPattern,
    "medium",
    "Gelbe Trennung des Gegenverkehrs und weiße Außenlinien sind auf markierten Überlandstraßen repräsentativ; lokale Straßen variieren.",
  );
  applyConservativePattern(
    ["BHS", "JAM", "TTO", "ATG", "BRB", "DMA", "GRD", "KNA", "LCA", "VCT"],
    whiteCenterNoEdgesPattern,
    "low",
    "Vorsichtiges Symbol für eine markierte Hauptstraße; viele Inselstraßen sind schmal, unmarkiert oder regional anders ausgeführt.",
  );
  applyConservativePattern(
    ["FJI", "PNG", "VUT", "NCL", "SLB", "KIR", "MHL", "FSM", "NRU", "PLW", "TON", "TUV"],
    whiteCenterNoEdgesPattern,
    "low",
    "Repräsentatives Hauptstraßen-Symbol; vollständige Randlinien sind auf kleinen Inselstraßen nicht verlässlich zu erwarten.",
  );
  applyConservativePattern(
    ["ISR", "JOR", "ARE", "OMN"],
    yellowOuterPattern,
    "medium",
    "Gelbe äußere Linien bei weißer Fahrbahnmarkierung sind ein nützlicher Hauptstraßenhinweis, aber nicht auf jeder Straße vorhanden.",
  );
  applyConservativePattern(
    ["IRQ", "CHN", "TWN", "VNM", "KHM", "LAO"],
    yellowCenterPattern,
    "low",
    "Repräsentatives Muster größerer Überlandstraßen; Farbe und Linienzahl hängen stark von Straßenklasse und Überholregel ab.",
  );
  applyConservativePattern(
    ["KAZ", "UZB", "TLS", "LBN", "PSE", "QAT", "KWT", "MMR", "PRK", "MNG", "IND", "BGD", "BTN", "NPL", "PAK", "AFG", "TJK", "KGZ", "TKM", "IRN", "SYR", "ARM", "LKA", "AZE", "GEO", "BRN", "YEM", "SAU", "CYN", "CYP", "BHR", "MDV", "SGP"],
    allWhitePattern,
    "low",
    "Vorsichtiges Muster einer markierten Hauptstraße; nationale, regionale und straßenklassenabhängige Abweichungen sind ausdrücklich möglich.",
  );
  applyConservativePattern(
    ["TZA", "ESH", "COD", "SOM", "KEN", "SDN", "TCD", "ZWE", "SEN", "MLI", "MRT", "BEN", "NER", "NGA", "CMR", "TGO", "GHA", "CIV", "GIN", "GNB", "LBR", "SLE", "BFA", "CAF", "COG", "GAB", "GNQ", "ZMB", "MWI", "MOZ", "AGO", "BDI", "MDG", "GMB", "TUN", "DZA", "ERI", "MAR", "EGY", "LBY", "ETH", "DJI", "SOL", "UGA", "RWA", "SSD", "CPV", "COM", "MUS", "STP", "SYC"],
    allWhitePattern,
    "low",
    "Repräsentatives Muster einer markierten Hauptstraße; ländliche Straßen sind häufig unmarkiert und nationale Standards müssen noch einzeln vertieft werden.",
  );

  function applyVerifiedRoadPattern(iso3, pattern) {
    const country = countries[iso3];
    if (!country) return;
    const verificationStatus = pattern.verificationStatus || "cross-checked";
    const colorLabel = { white: "weiß", yellow: "gelb", green: "grün", none: "keine" };
    const styleLabel = {
      solid: "durchgezogen", dashed: "gestrichelt", "double-solid": "doppelt durchgezogen",
      "double-dashed": "doppelt gestrichelt", "solid-dashed": "durchgezogen und gestrichelt", none: "ohne Linie",
    };
    const centerColor = pattern.center.bandColor
      ? `${colorLabel[pattern.center.color]} mit ${colorLabel[pattern.center.bandColor]}em Mittelband`
      : colorLabel[pattern.center.color];
    country.roadMapPattern = {
      center: { ...pattern.center, inner: pattern.center.inner ? { ...pattern.center.inner } : undefined },
      leftEdge: { ...pattern.leftEdge },
      rightEdge: { ...pattern.rightEdge },
      confidence: pattern.confidence,
      scope: pattern.scope || "marked-main-road",
      showOnWorld: pattern.showOnWorld !== false,
      notes: pattern.notes,
      sources: [...pattern.sources],
    };
    const previousStyle = country.roadStyles[0] || {};
    country.roadStyles[0] = {
      ...previousStyle,
      label: pattern.label || "Verifiziertes Hauptstraßenmuster",
      lanes: previousStyle.lanes || 2,
      centerColor,
      centerStyle: pattern.center.style,
      centerBandColor: pattern.center.bandColor ? colorLabel[pattern.center.bandColor] : undefined,
      centerInnerColor: pattern.center.inner ? colorLabel[pattern.center.inner.color] : undefined,
      centerInnerStyle: pattern.center.inner?.style,
      leftEdgeColor: colorLabel[pattern.leftEdge.color],
      leftEdgeStyle: pattern.leftEdge.style,
      rightEdgeColor: colorLabel[pattern.rightEdge.color],
      rightEdgeStyle: pattern.rightEdge.style,
      note: pattern.notes,
    };
    country.roadMarkings.centerColor = centerColor;
    country.roadMarkings.centerStyle = `${styleLabel[pattern.center.style] || pattern.center.style}; repräsentatives Hauptstraßenmuster`;
    country.roadMarkings.leftEdgeColor = colorLabel[pattern.leftEdge.color];
    country.roadMarkings.rightEdgeColor = colorLabel[pattern.rightEdge.color];
    country.roadMarkings.prevalence = pattern.notes;
    country.roadMarkings.uncertainty = verificationStatus === "partial"
      ? `Teilweise geprüftes Kartenmuster; nicht als landesweit häufigste Strichart belegt: ${pattern.notes}`
      : `Verifiziertes Kartenmuster, aber nicht universal: ${pattern.notes}`;
    country.roadVerification = { status: verificationStatus, sources: [...pattern.sources] };
  }

  const verifiedRoadPatterns = {
    NOR: { center: { color: "yellow", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "high", notes: "Normale zweispurige Straße; schmale Straßen können ohne Mitte und mit gestrichelten weißen Rändern auftreten.", sources: ["https://store.vegnorm.vegvesen.no/svv-proj-1465022", "https://www.vegvesen.no/globalassets/fag/handboker/hb-n302.pdf"] },
    SWE: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "dashed" }, rightEdge: { color: "white", style: "dashed" }, confidence: "high", notes: "Typische schwedische Außerortsmarkierung mit kurzen gestrichelten Randlinien.", sources: ["https://www.transportstyrelsen.se/sv/vagtrafik/trafikregler-och-vagmarken/vagmarken/vagmarkeringar/kantlinje/", "https://www.transportstyrelsen.se/TSFS/TSFS%202010_171.pdf"] },
    FIN: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "high", notes: "Aktuelles Muster; gelbe Trenn- oder Sperrlinien können nur in älteren Aufnahmen vor der Umstellung bis 2023 vorkommen.", sources: ["https://static.traficom.fi/en/transport/road/new-road-markings-and-traffic-signs"] },
    ISL: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "high", notes: "Aktuelle permanente Markierungen sind weiß; Gelb wird insbesondere für temporäre Markierungen oder Parkregelungen verwendet.", sources: ["https://island.is/reglugerdir/nr/0250-2024", "https://www.vegagerdin.is/vegagerdin/gagnasafn/umferdarmerki/yfirbordsmerkingar/yfirbordsmerkingar-jpg-2024"] },
    DNK: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "high", showOnWorld: false, notes: "Normale markierte Haupt- oder Routenstraße. Kurze gestrichelte Außenlinien gehören insbesondere zu schmalen 2−1-Straßen und bleiben als eigene Detailvariante erhalten.", sources: ["https://vejregler.dk/h/7e0fba84-06dd-483b-898a-c7b3e3affaa1/5ceddb86315346c9b7ee12103df96d13?showExact=true"] },
    GBR: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "high", notes: "Repräsentative A-Road; schmale Landstraßen sind häufig teilweise oder vollständig unmarkiert.", sources: ["https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/773421/traffic-signs-manual-chapter-05.pdf", "https://www.gov.uk/guidance/the-highway-code/road-markings"] },
    IRL: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "yellow", style: "dashed" }, rightEdge: { color: "yellow", style: "dashed" }, confidence: "high", notes: "Typische Nationalstraße mit gestrichelten gelben Seiten- oder Standstreifenlinien.", sources: ["https://www.gov.ie/en/department-of-transport/publications/traffic-signs-manual/", "https://www.rsa.ie/docs/default-source/road-safety/rules-of-the-road.pdf?sfvrsn=e0334acb_23"] },
    DEU: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "high", notes: "Normale markierte Landstraße; Nebenstraßen können Randlinien oder sämtliche Linien verlieren.", sources: ["https://www.gesetze-im-internet.de/stvo_2013/anlage_2.html"] },
    ITA: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "high", showOnWorld: true, notes: "Repräsentative markierte zweispurige Hauptstraße; gelbe Längsmarkierungen sind vor allem temporären oder besonderen Funktionen vorbehalten.", sources: ["https://aci.gov.it/codice-della-strada/art-40/", "https://www.gazzettaufficiale.it/atto/serie_generale/caricaArticoloDefault/originario?atto.codiceRedazionale=09A15766&atto.dataPubblicazioneGazzetta=2000-12-28&atto.tipoProvvedimento=DIRETTIVA"] },
    UKR: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "high", showOnWorld: true, notes: "Amtliches Grundmuster einer markierten zweispurigen Straße: weiße Linie 1.5 trennt den Gegenverkehr unterbrochen, weiße Linie 1.2 kennzeichnet die Fahrbahnkante durchgezogen.", sources: ["https://zakon.rada.gov.ua/laws/show/1306-2001-%D0%BF"] },
    TUR: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "high", showOnWorld: true, notes: "Repräsentative markierte Hauptstraße nach dem weißen KGM-Grundsystem; durchgezogene, doppelte oder gelbe Linien bleiben funktionsabhängige Varianten.", sources: ["https://www.kgm.gov.tr/SiteCollectionDocuments/KGMdocuments/Trafik/KanunYonetmelik/TrafikIsaretYonetmelik.pdf", "https://www.kgm.gov.tr/SiteCollectionDocuments/KGMdocuments/Trafik/erismekontrollukarayollarindatrafikisaretlemestandartlari.pdf"] },
    FRA: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "dashed" }, rightEdge: { color: "white", style: "dashed" }, confidence: "high", notes: "Typische französische Landstraße mit T1-Mittellinie und T2-Randlinien.", sources: ["https://equipementsdelaroute.cerema.fr/IMG/pdf/iisr_7epartie_vc_202104_cle0149be.pdf", "https://www.legifrance.gouv.fr/jorf/article_jo/JORFARTI000018688815"] },
    ESP: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "high", notes: "Normale Haupt- oder Landstraße; Gelb ist kein reguläres nationales Randlinienmerkmal.", sources: ["https://boe.es/buscar/doc.php?id=BOE-A-2025-12199", "https://cdn.transportes.gob.es/portal-web-transportes/carreteras/normativa_tecnica/12_equipamiento_vial/8_2ic1987fomento1.pdf"] },
    PRT: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "medium-high", notes: "Repräsentative Hauptstraße; kleinere Straßen sind oft weniger vollständig markiert.", sources: ["https://files.dre.pt/1s/2019/12/24501/0000200175.pdf", "https://www.imt-ip.pt/wp-content/uploads/IMTT/Portugues/InfraestruturasRodoviarias/InovacaoNormalizacao/Divulgao%20Tcnica/MR_Caracteristicas.pdf"] },
    NLD: { center: { color: "white", style: "double-solid", count: 2, bandColor: "green" }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "high", scope: "road-class", notes: "Ikonische 100-km/h-Straße: grünes Band zwischen zwei weißen Mittellinien; andere Straßenklassen besitzen andere Muster.", sources: ["https://www.rijksoverheid.nl/vraag-en-antwoord/verkeersveiligheid/wat-betekenen-de-strepen-op-de-weg", "https://www.anwb.nl/verkeer/veiligheid/verkeersregels/strepen-op-de-weg"] },
    BEL: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "high", notes: "Normale Hauptstraße; gelbe Randmarkierungen kennzeichnen regelmäßig ein Parkverbot.", sources: ["https://www.wegcode.be/nl/regelgeving/1975120109~hra8v386pu", "https://www.wegcode.be/nl/regelgeving/1976101105~j6siwtihko"] },
    LUX: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "medium-high", notes: "Repräsentative Hauptstraße; gelbe Linien betreffen insbesondere Baustellen oder Parkregelungen.", sources: ["https://transports.public.lu/fr/conduire/circulation-et-securite-routieres/signalisation-routiere.html"] },
    POL: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "high", notes: "Repräsentative National- oder Woiwodschaftsstraße mit relativ dichter Markierung.", sources: ["https://www.gov.pl/web/gddkia/oznakowanie-poziome-na-drogach-gddkia", "https://eli.gov.pl/api/acts/DU/2019/2310/text.html"] },
    CZE: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "high", notes: "Normale Hauptstraße; temporäre Markierungen können gelb oder orange sein.", sources: ["https://www.zakonyprolidi.cz/cs/2015-294?text=294+%2F+2015"] },
    SVK: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "medium-high", notes: "Repräsentative Hauptstraße; Nebenstraßen sind häufig ohne Randlinien.", sources: ["https://www.slov-lex.sk/ezbierky-fe/pravne-predpisy/SK/ZZ/2020/30/"] },
    HUN: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "medium", notes: "Typische Hauptstraße; gelbe Linien werden vor allem bei temporären Verkehrsführungen eingesetzt.", sources: ["https://njt.hu/jogszabaly/2001-11-20-93", "https://net.jogtar.hu/jogszabaly?docid=97500001.kpm"] },
    ROU: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "medium", notes: "Häufigstes Hauptstraßenmuster; das Regelwerk erlaubt auch gestrichelte Randlinien.", sources: ["https://legislatie.just.ro/Public/FormaPrintabila/00000G1B1SMZFP7QAS81PU4VPL9B4OM0"] },
    BGR: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "high", notes: "Normale markierte Hauptstraße; lokale Straßen können stark lückenhaft markiert sein.", sources: ["https://www.sars.gov.bg/wp-content/uploads/2023/07/%D0%9D%D0%B0%D1%80%D0%B5%D0%B4%D0%B1%D0%B0-%E2%84%96-2-%D0%BE%D1%82-17-%D1%8F%D0%BD%D1%83%D0%B0%D1%80%D0%B8-2001-%D0%B3.-%D0%B7%D0%B0-%D1%81%D0%B8%D0%B3%D0%BD%D0%B0%D0%BB%D0%B8%D0%B7%D0%B0%D1%86%D0%B8%D1%8F-%D0%BD%D0%B0-%D0%BF%D1%8A%D1%82%D0%B8%D1%89%D0%B0%D1%82%D0%B0-%D1%81-%D0%BF%D1%8A%D1%82%D0%BD%D0%B0-%D0%BC%D0%B0%D1%80%D0%BA%D0%B8%D1%80%D0%BE%D0%B2%D0%BA%D0%B0.pdf"] },
    ZAF: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "yellow", style: "solid" }, rightEdge: { color: "yellow", style: "solid" }, confidence: "high", notes: "Typische markierte zweispurige Gegenverkehrsstraße; geteilte Fahrbahnen sind asymmetrisch markiert.", sources: ["https://www.transport.gov.za/wp-content/uploads/2023/02/V1C7.pdf", "https://www.plonkit.net/south-africa"] },
    BWA: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "yellow", style: "solid" }, rightEdge: { color: "yellow", style: "solid" }, confidence: "high", notes: "Markierte Asphalt-Hauptstraße; Linien können stark verblasst sein und kleinere Straßen unmarkiert bleiben.", sources: ["https://www.transport.gov.za/wp-content/uploads/2023/02/V1C7.pdf", "https://www.plonkit.net/botswana"] },
    LSO: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "yellow", style: "solid" }, rightEdge: { color: "yellow", style: "solid" }, confidence: "high", notes: "Typische markierte Hauptstraße; schmale Berg- und Nebenstraßen können unmarkiert sein.", sources: ["https://www.transport.gov.za/wp-content/uploads/2023/02/V1C7.pdf", "https://www.plonkit.net/lesotho"] },
    SWZ: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "yellow", style: "solid" }, rightEdge: { color: "yellow", style: "solid" }, confidence: "high", notes: "Typische markierte Hauptstraße in Eswatini; Nebenstraßen können unmarkiert sein.", sources: ["https://www.transport.gov.za/wp-content/uploads/2023/02/V1C7.pdf", "https://www.plonkit.net/eswatini"] },
    NAM: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "yellow", style: "solid" }, rightEdge: { color: "yellow", style: "solid" }, confidence: "high", notes: "Asphaltierte Fernstraße; das ebenfalls sehr wichtige unmarkierte Schotterstraßenbild bleibt als zweite Variante im Panel.", sources: ["https://www.transport.gov.za/wp-content/uploads/2023/02/V1C7.pdf", "https://www.lac.org.na/laws/annoREG/Road%20Traffic%20and%20Transport%20Act%2022%20of%201999-Regulations%202001-053.pdf"] },
    JPN: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "high", notes: "Häufige Kombination; gelbe durchgezogene Mitte und unmarkierte schmale Straßen sind wichtige Varianten.", sources: ["https://www.npa.go.jp/english/bureau/traffic/document/TrafficSafetyRules.pdf", "https://www.plonkit.net/japan"] },
    KOR: { center: { color: "yellow", style: "solid", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "medium-high", notes: "Einzelne gelbe Volllinie als repräsentatives Zweispurbild; gelb gestrichelt, doppelt oder kombiniert sind Varianten.", sources: ["https://law.go.kr/lsLawLinkInfo.do?chrClsCd=010202&lsJoLnkSeq=1015617353", "https://www.plonkit.net/south-korea"] },
    THA: { center: { color: "yellow", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "high", notes: "Offizielle normale Richtungstrennlinie; gelbe Sperr- und Kombinationslinien hängen von der Überholregel ab.", sources: ["https://network.doh.go.th/km-web/storage/km/articles/3-%E0%B8%84%E0%B8%B9%E0%B9%88%E0%B8%A1%E0%B8%B7%E0%B8%AD%E0%B9%80%E0%B8%84%E0%B8%A3%E0%B8%B7%E0%B9%88%E0%B8%AD%E0%B8%87%E0%B8%AB%E0%B8%A1%E0%B8%B2%E0%B8%A2%E0%B8%84%E0%B8%A7%E0%B8%9A%E0%B8%84%E0%B8%B8%E0%B8%A1%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%88%E0%B8%A3%E0%B8%B2%E0%B8%88%E0%B8%A3%E0%B9%83%E0%B8%99%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B8%81%E0%B9%88%E0%B8%AD%E0%B8%AA%E0%B8%A3%E0%B9%89%E0%B8%B2%E0%B8%87%20%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B8%9A%E0%B8%B9%E0%B8%A3%E0%B8%93%E0%B8%B0%E0%B8%AF_20220713130556.pdf"] },
    MYS: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "high", notes: "Normales malaysisches Hauptstraßenbild ist vollständig weiß markiert; Gelb ist Sonderfunktionen vorbehalten.", sources: ["https://epsmg.jkr.gov.my/images/9/99/Atj_2d-ori_-_wm.pdf"] },
    IDN: { center: { color: "yellow", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "medium", scope: "road-class", notes: "Diagnostische Nationalstraße; Provinz- und Lokalstraßen nutzen weiße Markierungen oder bleiben unmarkiert.", sources: ["https://www.peraturan.go.id/files/bn908-2018.pdf", "https://binamarga.pu.go.id/balai-jateng-diy/berita/marka-kuning-identitas-jalan-nasional"] },
    PHL: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "medium", notes: "Aktuelles zweispuriges Grundmuster; gelbe Mittel- und Mehrfachlinien sowie unmarkierte Betonstraßen bleiben wichtige Varianten.", sources: ["https://lto.gov.ph/wp-content/uploads/2023/10/FDM-Vol.-1-2nd-Edition.pdf", "https://www.dpwh.gov.ph/DPWH/sites/default/files/webform/civil_works/advertisement/25lj0068_plan.pdf"] },
    USA: { center: { color: "yellow", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "medium-high", notes: "Repräsentatives Grundmuster einer markierten zweispurigen Straße; durchgezogene, doppelte und kombinierte gelbe Mittellinien hängen von der Überholregel ab.", sources: ["https://mutcd.fhwa.dot.gov/pdfs/11th_Edition/part3.pdf"] },
    CAN: { center: { color: "yellow", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "medium", notes: "Repräsentatives Grundmuster einer markierten kanadischen Landstraße; Mittellinien können je nach Provinz und Überholregel einfach, doppelt, durchgezogen oder gestrichelt sein.", sources: ["https://www.ontario.ca/document/official-mto-drivers-handbook/pavement-markings"] },
    MEX: { center: { color: "yellow", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "high", notes: "Repräsentatives Grundmuster einer markierten zweispurigen Bundesstraße; durchgezogene und kombinierte Mittellinien richten sich nach der Überholregel.", sources: ["https://www.dof.gob.mx/nota_detalle_popup.php?codigo=5702233"] },
    BRA: { center: { color: "yellow", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "medium-high", notes: "Repräsentatives Grundmuster einer markierten zweispurigen Straße; durchgezogene, doppelte und kombinierte gelbe Mittellinien bleiben funktionsabhängige Varianten.", sources: ["https://www.gov.br/transportes/pt-br/assuntos/transito/arquivos-senatran/educacao/publicacoes/manual_vol_iv_2.pdf"] },
    ARG: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "high", notes: "Aktueller nationaler Standard für normale zweispurige Landstraßen; Gelb dient unter anderem Barriere- und Gegenverkehrstrennungen auf mehrspurigen Straßen.", sources: ["https://www.argentina.gob.ar/normativa/nacional/decreto-196-2025-410682/actualizacion"] },
    URY: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "medium", notes: "Normatives Grundmuster einer markierten zweispurigen Straße; die auffällige gelb–weiß–gelbe Kombination bleibt als GeoGuessr-relevante Sondervariante im Detailpanel.", sources: ["https://www.gub.uy/unidad-nacional-seguridad-vial/sites/unidad-nacional-seguridad-vial/files/documentos/publicaciones/DIC-1999-NORMA-DE-SENALIZACION-HORIZONTAL-MTOP.pdf"] },
    CHL: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "high", notes: "Repräsentative normale Landstraße mit weißen Linien; gelbe Sondervarianten kommen etwa auf einzelnen Schnee- oder Schutzgebietsabschnitten vor.", sources: ["https://www.mtt.gob.cl/wp-content/uploads/2025/07/Manual-de-Senalizacion-de-Transito.pdf"] },
    PER: { center: { color: "yellow", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "high", notes: "Normales zweispuriges Hauptstraßenmuster; Bergstraßen können nur Randlinien besitzen und geteilte Straßen vollständig weiß markiert sein.", sources: ["https://www.gob.pe/institucion/mtc/normas-legales/6150395-26-2024-mtc-18", "https://cdn.www.gob.pe/uploads/document/file/7173778/6150395-manual-de-dispositivos-de-control-de-transito-automotor-rd-n-26-2024-mtc-18.pdf?v=1730902043"] },
    BOL: { center: { color: "yellow", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "medium", verificationStatus: "partial", showOnWorld: false, notes: "Vorsichtiges Symbol einer markierten Hauptstraße; die Strichart ist nicht als landesweit häufigste belegt und auch asphaltierte Straßen sind oft unmarkiert.", sources: ["https://www.abc.gob.bo/Manuales"] },
    COL: { center: { color: "yellow", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "high", notes: "Typisches kolumbianisches Hauptstraßenmuster; gestrichelte, durchgezogene, gemischte und doppelte gelbe Mittellinien sind funktionsabhängige Varianten.", sources: ["https://mintransporte.gov.co/publicaciones/11893/gobierno-nacional-avanza-con-la-socializacion-del-nuevo-manual-de-senalizacion-vial/", "https://www.mindeporte.gov.co/recursos_user/2025/FOMENTO/Actividad_fisica/Manual_Senalizacion_Vial_Colombia_2024.pdf"] },
    ECU: { center: { color: "yellow", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "high", notes: "Repräsentative zweispurige Hauptstraße; Gelb trennt Gegenverkehr, Weiß kennzeichnet gewöhnlich die äußeren Ränder.", sources: ["https://obraspublicas.gob.ec/wp-content/uploads/downloads/2015/03/LOTAIP2015_reglamento_tecnico_se%2B%C2%A6alizaci%2B%C2%A6n_horizontal.pdf"] },
    AUS: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "high", notes: "Fast ausschließlich weißes normales Landstraßenmuster; schmale Straßen können Randlinien, Mittellinie oder sämtliche Markierungen verlieren.", sources: ["https://www.qld.gov.au/transport/safety/rules/road/lines", "https://www.vicroads.vic.gov.au/-/media/files/technical-documents-new/road-design-notes/road-design-note-0309-wide-centre-line-treatment-working-release-jan-2019.ashx"] },
    NZL: { center: { color: "white", style: "dashed", count: 1 }, leftEdge: { color: "white", style: "solid" }, rightEdge: { color: "white", style: "solid" }, confidence: "medium", notes: "Normales markiertes Zweispurmuster; die doppelte gelbe Mitte kennzeichnet ein Überholverbot und bleibt als wichtige Detailvariante erhalten.", sources: ["https://www.nzta.govt.nz/roads-and-rail/traffic-control-devices-manual/part-5-traffic-control-devices-for-general-use-between-intersections/treatment-of-straights-general-delineation/treatments-in-the-centre-of-the-road/standard-centre-lines"] },
  };

  Object.entries(verifiedRoadPatterns).forEach(([iso3, pattern]) => applyVerifiedRoadPattern(iso3, pattern));

  const additionalRoadVariants = {
    USA: {
      label: "Doppelte gelbe Sperrlinie",
      centerColor: "gelb", centerStyle: "double-solid",
      leftEdgeColor: "weiß", leftEdgeStyle: "solid",
      rightEdgeColor: "weiß", rightEdgeStyle: "solid", lanes: 2,
      note: "Häufige Überholverbotsvariante; nicht das allgemeine Karten-Grundmuster.",
    },
    CAN: {
      label: "Gelbe Sperrlinie",
      centerColor: "gelb", centerStyle: "solid",
      leftEdgeColor: "weiß", leftEdgeStyle: "solid",
      rightEdgeColor: "weiß", rightEdgeStyle: "solid", lanes: 2,
      note: "Durchgezogene Variante bei entsprechender Überholregel; Provinzstandards können abweichen.",
    },
    MEX: {
      label: "Gelbe Sperrlinie",
      centerColor: "gelb", centerStyle: "solid",
      leftEdgeColor: "weiß", leftEdgeStyle: "solid",
      rightEdgeColor: "weiß", rightEdgeStyle: "solid", lanes: 2,
      note: "Durchgezogene Variante bei Überholverbot; das Kartenmuster zeigt den neutraleren Grundfall.",
    },
    BRA: {
      label: "Doppelte gelbe Sperrlinie",
      centerColor: "gelb", centerStyle: "double-solid",
      leftEdgeColor: "weiß", leftEdgeStyle: "solid",
      rightEdgeColor: "weiß", rightEdgeStyle: "solid", lanes: 2,
      note: "Auffällige Überholverbotsvariante; einfache und kombinierte gelbe Linien kommen ebenfalls vor.",
    },
    URY: {
      label: "Gelb–weiß–gelbe Sonderkombination",
      centerColor: "gelb", centerStyle: "double-solid",
      centerInnerColor: "weiß", centerInnerStyle: "dashed",
      leftEdgeColor: "weiß", leftEdgeStyle: "solid",
      rightEdgeColor: "weiß", rightEdgeStyle: "solid", lanes: 2,
      note: "Auffällige GeoGuessr-Sondervariante; das Kartenmuster zeigt das normative weiße Grundmuster.",
    },
    NZL: {
      label: "Doppelte gelbe Sperrlinie",
      centerColor: "gelb", centerStyle: "double-solid",
      leftEdgeColor: "weiß", leftEdgeStyle: "solid",
      rightEdgeColor: "weiß", rightEdgeStyle: "solid", lanes: 2,
      note: "Wichtige Überholverbotsvariante; die normale Mittellinie im Kartenmuster ist weiß und gestrichelt.",
    },
    DNK: {
      label: "Schmale 2−1-Straße",
      centerColor: "none", centerStyle: "none",
      leftEdgeColor: "weiß", leftEdgeStyle: "dashed",
      rightEdgeColor: "weiß", rightEdgeStyle: "dashed", lanes: 2,
      note: "Kurze gestrichelte Außenlinien gehören zu dieser besonderen schmalen Straßenform und sind kein allgemeiner Landesstandard.",
    },
  };

  Object.entries(additionalRoadVariants).forEach(([iso3, style]) => {
    if (!countries[iso3] || countries[iso3].roadStyles.some((entry) => entry.label === style.label)) return;
    countries[iso3].roadStyles.splice(1, 0, style);
  });

  countries.ARG.center = "weiß";
  countries.ARG.certainty = "weiße Mittellinie auf normalen zweispurigen Landstraßen nach aktuellem nationalem Standard";
  countries.ARG.geoGuessrClues = countries.ARG.geoGuessrClues.map((clue) => clue.category === "Straßenmarkierung"
    ? { importance: "HIGH", category: "Straßenmarkierung", text: "Aktuell meist weiße gestrichelte Mitte und weiße Außenlinien auf normalen zweispurigen Rutas", reliability: "amtlicher Standard seit 2025; straßentypabhängig" }
    : clue);
  countries.ARG.distinguish.CHL = "Beide können weiße Straßenmarkierungen zeigen; Landschaft, Andennähe, Straßenbau und Beschilderung gemeinsam prüfen.";
  countries.ARG.distinguish.ZAF = "Argentinien fährt rechts und hat gewöhnlich weiße Außenlinien; Südafrika fährt links und nutzt gelbe Außenlinien.";
  countries.CHL.distinguish.ARG = "Weiße Mittellinien kommen heute in beiden Ländern vor; Chiles schmaler Anden-Küsten-Korridor und Infrastruktur sind verlässlichere Trennhinweise.";

  countries.URY.roadMarkings.centerColor = "weiß im Grundmuster; zwei gelbe Sperrlinien mit weißer Strichlinie dazwischen als auffällige Sondervariante";
  countries.URY.roadMarkings.centerStyle = "gestrichelt im Grundmuster; dreifache Kombination bei der GeoGuessr-relevanten Sondervariante";
  countries.URY.geoGuessrClues = countries.URY.geoGuessrClues.map((clue) => clue.category === "Straßenmarkierung"
    ? { importance: "VERY HIGH", category: "Straßenmarkierung", text: "Auffällige Sondervariante: weiße Strichlinie zwischen zwei gelben Sperrlinien", reliability: "häufiger GeoGuessr-Hinweis, nicht universal" }
    : clue);

  countries.NZL.roadMarkings.centerColor = "weiß im Normalfall; doppelt gelb bei Überholverbot";
  countries.NZL.roadMarkings.centerStyle = "weiße Strichlinie im Grundmuster; doppelte gelbe Volllinie als wichtige Variante";
  countries.NZL.geoGuessrClues.push({ importance: "HIGH", category: "Straßenmarkierung", text: "Weiße normale Mitte; doppelte gelbe Mitte bei Überholverbot", reliability: "nationaler Standard, straßentypabhängig" });

  const newlyVerifiedBaseProfiles = {
    ITA: "Weiße gestrichelte Mitte und weiße durchgezogene Außenlinien auf markierten zweispurigen Hauptstraßen",
    UKR: "Weiße gestrichelte Mitte und weiße durchgezogene Außenlinien auf markierten zweispurigen Straßen",
  };
  Object.entries(newlyVerifiedBaseProfiles).forEach(([iso3, text]) => {
    countries[iso3].geoGuessrClues = countries[iso3].geoGuessrClues.filter((clue) => clue.category !== "Datenqualität");
    countries[iso3].geoGuessrClues.push({
      importance: "HIGH",
      category: "Straßenmarkierung",
      text,
      reliability: "amtlicher Standard; Straßenklasse und Erhaltungszustand variieren",
    });
  });

  countries.DNK.geoGuessrClues = countries.DNK.geoGuessrClues.map((clue) => clue.category === "Straßenmarkierung"
    ? { importance: "HIGH", category: "Straßenmarkierung", text: "Weiße Markierungen; kurze gestrichelte Außenlinien besonders auf schmalen 2−1-Straßen", reliability: "straßenklassenabhängig" }
    : clue);
  countries.DNK.distinguish.SWE = "Dänemark ist flacher und dichter agrarisch; kurze gestrichelte Außenlinien sind besonders auf schmalen 2−1-Straßen ein Zusatzhinweis.";
  countries.DNK.distinguish.DEU = "Dänemark hat mehr küstennahe Agrarlandschaft und sehr präsente Radwege; kurze Randstriche nur zusammen mit der passenden schmalen Straßenform werten.";
  countries.NLD.distinguish.DNK = "Die Niederlande haben gelbe Kennzeichen und mehr Kanäle; Dänemarks kurze Randstriche gehören insbesondere zu schmalen 2−1-Straßen.";

  for (const iso3 of ["BOL", "ECU"]) {
    if (!countries[iso3].geoGuessrClues.some((clue) => clue.category === "Straßenmarkierung")) {
      countries[iso3].geoGuessrClues.push({
        importance: iso3 === "ECU" ? "HIGH" : "MEDIUM",
        category: "Straßenmarkierung",
        text: "Gelbe Gegenverkehrsmitte und weiße Außenlinien auf markierten Hauptstraßen",
        reliability: iso3 === "ECU" ? "nationales Farbsystem; Straßentyp variiert" : "teilweise geprüft; nicht als häufigste Strichart belegt",
      });
    }
  }

  countries.ISL.geoGuessrClues = countries.ISL.geoGuessrClues.map((clue) => clue.category === "Straßenmarkierung"
    ? { importance: "HIGH", category: "Straßenmarkierung", text: "Aktuelle permanente Linien sind weiß; gelbe Mitte in älteren Lernquellen ist kein heutiger Standard", reliability: "amtlich verifiziert" }
    : clue);
  countries.ISL.center = "weiß";
  countries.ISL.certainty = "aktuelle permanente Markierungen sind weiß; ältere gelbe Lernhinweise sind veraltet";
  countries.IRL.signs.description = "Gelbe rautenförmige Warnschilder mit schwarzem Rand; km/h und häufig zweisprachig Irisch/Englisch.";
  countries.IRL.geoGuessrClues = countries.IRL.geoGuessrClues.map((clue) => clue.category === "Schilder"
    ? { importance: "VERY HIGH", category: "Schilder", text: "Gelbe rautenförmige Warnschilder mit schwarzem Rand", reliability: "nationaler Standard" }
    : clue);
  countries.IRL.distinguish.NZL = "Beide nutzen gelbe Rautenwarnschilder; Irland erkennt man zusätzlich an gelb gestrichelten Außenlinien, irischer Sprache und europäischen Kennzeichen.";
  countries.LUX.licensePlates.description = "Gelbe Kennzeichen vorn und hinten mit schwarzer Schrift.";
  countries.LUX.geoGuessrClues = countries.LUX.geoGuessrClues.map((clue) => clue.category === "Kennzeichen"
    ? { importance: "VERY HIGH", category: "Kennzeichen", text: "Gelbe Kennzeichen vorn und hinten", reliability: "nationaler Standard" }
    : clue);
  countries.BWA.licensePlates.description = "Vorn weiß und hinten gelb, jeweils mit schwarzer Schrift.";
  countries.LSO.licensePlates.description = "Lange weiße Kennzeichen mit blauer Schrift sind charakteristisch.";
  countries.SWZ.licensePlates.description = "Lange Kennzeichen mit charakteristischem grünem unteren Bereich.";
  countries.NAM.licensePlates.description = "Normale private Kennzeichen sind vorn und hinten reflektierend gelb mit schwarzer Schrift.";
  countries.JPN.meta = "GeoGuessr Meta: Die niedrige Street-View-Kameraposition ist ein stabiler Japan-Hinweis; reale Schrift, Fahrseite und Infrastruktur bleiben vorrangig.";
  countries.KOR.licensePlates.description = "Seit 2006 überwiegend weiße Privatplatten; ältere kurze grüne sowie gelbe Nutzfahrzeugplatten können vorkommen.";
  countries.IDN.center = "gelb auf Nationalstraßen; weiß oder unmarkiert auf anderen Straßenklassen";
  countries.IDN.certainty = "gelbe Mitte ist ein nützlicher Hinweis auf Nationalstraßen, aber kein universelles Landesmuster";
  countries.IDN.licensePlates.description = "Seit 2022 werden neue oder erneuerte Privatplatten weiß mit schwarzer Schrift; ältere schwarze Platten mit weißer Schrift bleiben in Street View häufig.";
  countries.PHL.center = "weiß im aktuellen Grundmuster; gelbe Varianten kommen vor";
  countries.PHL.certainty = "weiße Mitte ist das aktuelle repräsentative Grundmuster; Bildalter und Straßenklasse erzeugen deutliche Varianten";

  const verifiedStopSigns = {
    USA: {
      format: "stop-only",
      displayedText: "STOP",
      confidence: "high",
      sources: ["https://mutcd.fhwa.dot.gov/htm/2003/part2/part2b1.htm"],
    },
    GBR: {
      format: "stop-only",
      displayedText: "STOP",
      confidence: "high",
      sources: ["https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/782724/traffic-signs-manual-chapter-03.pdf"],
    },
    FRA: {
      format: "stop-only",
      displayedText: "STOP",
      confidence: "high",
      sources: ["https://modules.securite-routiere.gouv.fr/50ans/pdf/securite_routiere.pdf"],
    },
    NLD: {
      format: "stop-only",
      displayedText: "STOP",
      confidence: "high",
      sources: ["https://www.government.nl/documents/2024/02/09/road-traffic-signs-and-regulations-in-the-netherlands"],
    },
    AUS: {
      format: "stop-only",
      displayedText: "STOP",
      confidence: "high",
      sources: ["https://www.transport.nsw.gov.au/operations/roads-and-waterways/traffic-signs?page=12"],
    },
    NZL: {
      format: "stop-only",
      displayedText: "STOP",
      confidence: "high",
      sources: ["https://www.nzta.govt.nz/driving-skills/learn-to-drive/roadcode/general-road-code/about-signs/main-types-of-signs"],
    },
    ZAF: {
      format: "stop-only",
      displayedText: "STOP",
      confidence: "high",
      sources: ["https://www.transport.gov.za/wp-content/uploads/2023/02/V1C2.pdf"],
    },
    MEX: {
      format: "local-or-multilingual",
      displayedText: "ALTO",
      confidence: "high",
      exclusionReason: "Mexikos übliches Stoppschild trägt „ALTO“",
      sources: ["https://www.dof.gob.mx/2024/SICT/manual_de_senalizacion_carreteras.pdf"],
    },
    BRA: {
      format: "local-or-multilingual",
      displayedText: "PARE",
      confidence: "high",
      exclusionReason: "Brasiliens übliches Stoppschild trägt „PARE“",
      sources: ["https://www.gov.br/dnit/pt-br/rodovias/operacoes-rodoviarias/faixa-de-dominio/regulamentacao-atual/manual-de-sinalizacao-vertical-de-regulamentacao-contran/view"],
    },
    JPN: {
      format: "local-or-multilingual",
      displayedText: "止まれ oder 止まれ + STOP",
      confidence: "high",
      exclusionReason: "Japans Stoppschild enthält „止まれ“",
      sources: ["https://www.npa.go.jp/laws/notification/koutuu/kisei/kisei20170421.pdf"],
    },
    MYS: {
      format: "local-or-multilingual",
      displayedText: "BERHENTI",
      confidence: "high",
      exclusionReason: "Malaysias übliches Stoppschild trägt „BERHENTI“",
      sources: ["https://epsmg.jkr.gov.my/images/6/6c/ATJ_2B.85_PINDAAN_2019_WM.pdf"],
    },
    CAN: {
      format: "variable",
      displayedText: "STOP, ARRÊT oder regionale Kombination",
      confidence: "high",
      sources: ["https://www.quebec.ca/en/transports/traffic-road-safety/traffic-signs-and-signals/traffic-signs/regulatory-signs"],
    },
  };

  Object.entries(verifiedStopSigns).forEach(([iso3, profile]) => {
    if (countries[iso3]) countries[iso3].stopSign = profile;
  });

  window.COUNTRIES = countries;
  window.COUNTRY_IMPORTANCE_ORDER = { "VERY HIGH": 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
})();
