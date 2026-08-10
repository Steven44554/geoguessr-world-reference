# GeoGuessr World Reference

Ein inoffizieller, interaktiver Länderatlas zum Erkennen visueller GeoGuessr-Hinweise. Die Website funktioniert vollständig statisch mit HTML, CSS und JavaScript.

## Öffentliche Website

Nach der ersten GitHub-Pages-Veröffentlichung ist die Website unter folgender Adresse erreichbar:

<https://steven44554.github.io/geoguessr-world-reference/>

## Funktionen

- interaktive Weltkarte mit Links- und Rechtsverkehr
- Straßenmarkierungs- und Kennzeichenhinweise
- lokaler Straßen-Screenshot als visuelle Referenz
- Länder-Matcher mit Verkehrsseite, Linien, Stoppschild-Texten, Warnschildformen, Kennzeichenanordnung, Leitpfosten, Masten, Straßenrändern, Schildrückseiten und Kamera-Hinweisen
- konservative Trefferbewertung: Nur starke, quellenbelegte Widersprüche schließen ein Land automatisch aus; fehlende oder regionale Daten bleiben möglich
- Datenqualität, Zuverlässigkeit, Geltungsbereich und anklickbare Quellen direkt im Länderprofil
- Länderbrowser und Direktvergleich

Ausgewählte Screenshots bleiben ausschließlich im Browser und werden nicht hochgeladen.

## Aktualisierung

Änderungen auf dem Branch `main` werden über GitHub Pages automatisch veröffentlicht.

Vor jeder Veröffentlichung prüfen `tools/validate.js` und `tools/smoke-test.js` Datenmodell, Offline-Verhalten, Matcher-Logik, Kartenstatus sowie die Rücksetz- und Auswahlabläufe.

## Hinweis

Dieses Projekt ist ein inoffizielles Lern- und Referenzwerkzeug und steht in keiner Verbindung zu GeoGuessr.
