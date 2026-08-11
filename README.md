# GeoGuessr World Reference

Ein inoffizieller, interaktiver Länderatlas zum Eingrenzen von Ländern anhand sichtbarer Straßenmerkmale. Die Anwendung verbindet eine anklickbare Weltkarte mit Länderprofilen, Straßen-Schemata, einem visuellen Merkmalsfilter und direkten Länder-Vergleichen. Sie läuft vollständig statisch mit HTML, CSS und JavaScript und benötigt weder Benutzerkonto noch Server.

## Öffentliche Website

**[GeoGuessr World Reference öffnen](https://steven44554.github.io/geoguessr-world-reference/)**

Die veröffentlichte Version wird über GitHub Pages bereitgestellt. Änderungen auf dem Branch `main` erscheinen nach einem erfolgreichen Pages-Build automatisch auf der Website.

## Inhaltsverzeichnis

- [Projektidee](#projektidee)
- [Zentrale Funktionen](#zentrale-funktionen)
- [Update-Hinweis](#update-hinweis)
- [Straßen-Screenshot und Datenschutz](#straßen-screenshot-und-datenschutz)
- [Bedienung](#bedienung)
- [Bewertung, Zuverlässigkeit und Quellen](#bewertung-zuverlässigkeit-und-quellen)
- [Lokale Nutzung](#lokale-nutzung)
- [Projektstruktur](#projektstruktur)
- [Tests und Qualitätsprüfung](#tests-und-qualitätsprüfung)
- [Veröffentlichung mit GitHub Pages](#veröffentlichung-mit-github-pages)
- [Daten und Quellen](#daten-und-quellen)
- [Grenzen und Haftungsausschluss](#grenzen-und-haftungsausschluss)
- [Beitragen und Updates](#beitragen-und-updates)

## Projektidee

GeoGuessr-Runden liefern selten einen einzigen eindeutigen Hinweis. Häufig entsteht die Lösung erst aus einer Kombination von Verkehrsseite, Fahrbahnmarkierungen, Kennzeichenfarben, Schildern, Straßenrand und Landschaft. Diese Website hilft dabei, solche Beobachtungen strukturiert festzuhalten und passende Länder einzugrenzen.

Sie ist als Referenz- und Lernwerkzeug gedacht:

- Die Weltkarte macht großräumige Muster sofort sichtbar.
- Länderprofile bündeln wichtige Erkennungsmerkmale an einem Ort.
- Der Straßen-Matcher sortiert Länder anhand der tatsächlich sichtbaren Hinweise.
- Der Direktvergleich zeigt Unterschiede zwischen ähnlich wirkenden Ländern.

Die Anwendung versucht nicht, einen Screenshot automatisch durch künstliche Intelligenz zu erkennen. Der Nutzer entscheidet selbst, welche Merkmale eindeutig sichtbar sind. Dadurch bleibt die Auswertung nachvollziehbar und kontrollierbar.

## Zentrale Funktionen

### Interaktive Weltkarte

- anklickbare Länder und zusätzliche Marker für kleine Gebiete
- farbliche Unterscheidung von Links- und Rechtsverkehr
- direkt sichtbare Straßenmarkierungs-Symbole auf der Karte
- Zoom-, Verschiebe- und Rücksetzfunktion
- Hervorhebung passender, möglicher und ausgeschlossener Länder
- Suchfeld und Schnellfilter für Kontinente, Verkehr, Landschaft, Markierungen, Kennzeichen, Stoppschild-Texte und Favoriten

### Länderprofile

Nach dem Anklicken eines Landes erscheint dessen Profil mit:

- einer deutlich sichtbaren, lokal geladenen Landesflagge
- Verkehrsseite und grundlegenden Länderinformationen
- priorisierten GeoGuessr-Hinweisen
- repräsentativem Straßen-Schema
- Beschreibung typischer Fahrbahnmarkierungen und wichtiger Varianten
- Oberflächenstrukturen wie den charakteristischen rechteckigen Betonplatten im Philippinen-Profil
- Kennzeichen-, Landschafts- und Schilderhinweisen
- möglichen Verwechslungsländern
- Datenqualität, Geltungsbereich, Aktualisierungsstand und anklickbaren Quellen

### Straßen-Screenshot-Matcher

Ein lokaler Screenshot kann als visuelle Gedächtnisstütze eingeblendet werden. Die sichtbaren Eigenschaften werden anschließend manuell ausgewählt.

Grundmerkmale:

- Links- oder Rechtsverkehr
- Farbe und Stil der Mittellinie
- Farbe und Stil der Randlinien
- Kennzeichenfarbe
- Asphalt-, Beton- oder Schotteroberfläche
- Stoppschild ausschließlich mit dem Text „STOP“ oder mit einem anderen Text

Direkt über der Karte stehen dafür Schnellfilter für „STOP“ beziehungsweise einen anderen Stoppschild-Text, weiße Randlinien und weiße Kennzeichen bereit.

Erweiterte visuelle Hinweise aus Phase 3:

- Stoppschild-Texte wie `ALTO`, `PARE`, `BERHENTI` oder `止まれ / STOP`
- gelbe Warnraute, weißes Warndreieck oder gelbes Warndreieck
- Kennzeichenanordnung vorne und hinten
- Leitpfosten- und Pfostenmuster
- Holz- oder Betonmasten
- befestigter, unbefestigter oder fehlender Straßenrand sowie offene Entwässerung
- dunkle Schildrückseiten
- auffällig niedrige Kamera-Perspektive

### Datenqualität aus Phase 4

- Hinweise besitzen eine ausgewiesene Zuverlässigkeit.
- Nationale Standards werden von regionalen oder beobachtungsabhängigen Mustern unterschieden.
- Quellenbelegte, starke Widersprüche können ein Land ausschließen.
- Schwache oder regionale Hinweise verändern nur die Reihenfolge der Kandidaten.
- Fehlende Daten werden als unbekannt behandelt und nicht als Gegenbeweis.
- Verifizierte Merkmale zeigen ihre Quellen direkt im Länderprofil.

### Länderbrowser und Vergleich

- alphabetische Gruppierung sowie Sortierung nach Kontinent oder Verkehrsseite
- Auswahl mehrerer Länder für einen direkten Vergleich
- vorbereitete Vergleichsgruppen, beispielsweise Südliches Afrika, Australien/Neuseeland oder USA/Kanada
- Favoriten zum schnellen Wiederfinden häufig genutzter Länder

### Update-Hinweis

Nach einer neuen Website-Version erscheint unten rechts ein kompakter Hinweis mit Veröffentlichungsdatum und Uhrzeit. Ein Klick auf den Hinweis schließt ihn. Die Versions-ID wird ausschließlich im lokalen Browserspeicher abgelegt, damit genau diese Meldung beim nächsten Laden nicht erneut erscheint. Wird bei einem späteren Update eine neue Versions-ID veröffentlicht, erscheint der Hinweis wieder.

## Straßen-Screenshot und Datenschutz

Der Screenshot-Workflow ist vollständig lokal:

1. Über **„Straßen-Screenshot“** wird der Matcher geöffnet.
2. Mit **„Screenshot auswählen“** wird eine Bilddatei vom eigenen Gerät gewählt.
3. Der Browser erzeugt nur eine lokale Vorschau.
4. Die erkennbaren Merkmale werden von Hand in den Auswahlfeldern eingetragen.
5. Mit **„Bild entfernen“** wird die Vorschau wieder verworfen.

Das ausgewählte Bild wird nicht hochgeladen, nicht an GitHub gesendet und nicht auf einem externen Server analysiert. Die Anwendung benötigt dafür keine Netzwerk-API. Beim Neuladen der Seite verschwindet die lokale Bildvorschau.

> Wichtig: Beim Öffnen externer Quellen verlässt du die Website. Für deren Datenschutz gelten die Bestimmungen der jeweiligen Anbieter.

## Bedienung

### Ein Land direkt untersuchen

1. Suche nach dem Land oder klicke es auf der Weltkarte an.
2. Das vollständige Länderprofil erscheint auf der rechten Seite beziehungsweise auf schmalen Bildschirmen unterhalb der Karte.
3. Prüfe besonders das Straßen-Schema, die hervorgehobenen Hinweise und deren Zuverlässigkeit.
4. Öffne bei Bedarf **„Datenqualität und Quellen“**, um Herkunft und Geltungsbereich der Angaben nachzuvollziehen.

### Länder mit einem Screenshot eingrenzen

1. Öffne **„Straßen-Screenshot“**.
2. Füge optional deinen Screenshot als lokale Referenz ein.
3. Wähle zuerst nur sichere Grundmerkmale aus.
4. Ergänze danach eindeutig erkennbare Schilder-, Kennzeichen- oder Infrastrukturhinweise.
5. Vergleiche die Gruppen **passend**, **noch möglich** und **ausgeschlossen**.
6. Klicke einen Kandidaten an, um sein Länderprofil zu prüfen.
7. Entferne zweifelhafte Filter, falls die Auswahl zu eng geworden ist.
8. Mit **„Zurücksetzen“** werden alle Matcher-Merkmale entfernt.

### Zwei oder mehr Länder vergleichen

1. Füge Länder über die Vergleichsfunktion hinzu oder wähle eine Vorlage.
2. Öffne **„Vergleichen“**.
3. Stelle Verkehr, Markierungen, Kennzeichen, Landschaft und typische Hinweise nebeneinander.

## Bewertung, Zuverlässigkeit und Quellen

Die Trefferliste ist keine Wahrscheinlichkeitsberechnung und keine automatische Bilderkennung. Sie ist eine regelbasierte, konservative Entscheidungshilfe.

| Datenlage | Verhalten im Matcher |
| --- | --- |
| Hohe Zuverlässigkeit, amtliche Quelle und starker nationaler Widerspruch | Das Land kann ausgeschlossen werden. |
| Mittlere oder niedrige Zuverlässigkeit | Der Hinweis beeinflusst die Reihenfolge, führt aber nicht allein zum Ausschluss. |
| Regionales oder straßentypabhängiges Merkmal | Das Land bleibt grundsätzlich möglich. |
| Keine hinterlegten Daten | Unbekannt bleibt möglich; fehlende Daten gelten nicht als Widerspruch. |

Diese Logik schützt vor einer häufigen Fehlannahme: Ein typisches Merkmal ist nicht automatisch auf jeder Straße eines Landes vorhanden. Baustellen, ältere Aufnahmen, regionale Regeln, unterschiedliche Straßenklassen, verblasste Markierungen und private Straßen können vom hinterlegten Grundmuster abweichen.

Im Länderprofil können zu einem Merkmal folgende Angaben erscheinen:

- **Zuverlässigkeit:** Stärke der derzeitigen Datenlage
- **Geltungsbereich:** beispielsweise nationaler Standard, bestimmte Straßenklasse oder regionale Beobachtung
- **Hinweis:** Einschränkungen und wichtige Varianten
- **Quelle:** amtliche Regelwerke, Verkehrsbehörden oder ergänzende Referenzen
- **Datenstand:** Zeitpunkt der letzten inhaltlichen Prüfung

## Lokale Nutzung

Das Projekt hat keine Build-Stufe und keine Laufzeitabhängigkeiten. Für die eigentliche Website genügt ein moderner Browser.

### Direkt öffnen

1. Repository herunterladen oder klonen.
2. `index.html` im Browser öffnen.

Die Kernfunktionen sind für den statischen Betrieb ausgelegt. Falls ein Browser lokale Dateien besonders streng behandelt, empfiehlt sich ein kleiner lokaler Webserver.

### Mit lokalem Webserver

Mit Python:

```bash
python -m http.server 8000
```

Danach <http://localhost:8000/> öffnen.

Alternativ mit einer vorhandenen Node.js-Installation:

```bash
npx --yes serve .
```

`npx serve` lädt beim ersten Start ein Paket. Für die Website selbst ist dieses Paket nicht erforderlich.

## Projektstruktur

```text
geoguessr-world-reference/
├── index.html                       # Seitenstruktur und Bedienelemente
├── style.css                        # Layout, Karte, Profile und responsive Ansicht
├── script.js                        # Interaktion, Matcher, Karte und Vergleich
├── data/
│   ├── countries.js                 # Länderprofile, Evidenz und Quellen
│   └── world-map.js                 # vorbereitete Kartengeometrie
├── assets/
│   ├── natural-earth-countries.geojson
│   └── flags/
│       ├── 4x3/                    # lokale SVG-Landesflaggen
│       └── LICENSE                 # MIT-Lizenz der Flaggenbibliothek
├── tools/
│   ├── validate.js                  # strukturelle und inhaltliche Validierung
│   ├── smoke-test.js                # browsernaher Interaktions-Smoke-Test
│   ├── generate-world-map.js        # Kartendaten erzeugen
│   ├── map-lod-report.js            # Detailstufen der Karte prüfen
│   └── render-map-preview.js        # Vorschau der Karte erzeugen
└── README.md
```

## Tests und Qualitätsprüfung

Für die Prüfskripte wird Node.js benötigt; zusätzliche npm-Pakete sind nicht erforderlich. Eine aktuelle Node.js-LTS-Version wird empfohlen.

Zuerst prüfen, ob `node` im Terminal verfügbar ist:

```bash
node --version
```

Danach im Projektverzeichnis ausführen:

```bash
node tools/validate.js
node tools/smoke-test.js
```

Unter PowerShell können beide Prüfungen gemeinsam und mit sauberer Fehlerweitergabe gestartet werden:

```powershell
node .\tools\validate.js
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
node .\tools\smoke-test.js
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
```

Falls `node` nicht gefunden wird, muss Node.js LTS installiert oder der Pfad zur ausführbaren Datei explizit verwendet werden. Ein portables Beispiel in PowerShell:

```powershell
$nodeExe = "C:\Pfad\zu\node.exe"
& $nodeExe .\tools\validate.js
& $nodeExe .\tools\smoke-test.js
```

Die Validierung kontrolliert unter anderem:

- Vollständigkeit und Schema der Länder- und Kartendaten
- gültige Farben, Linienarten, Zuverlässigkeitsstufen und Quellen-URLs
- Datenmodell der Stoppschilder und erweiterten visuellen Evidenz
- vorhandene Bedienelemente und verknüpfte Skripte
- vollständig statischen Betrieb ohne externe Laufzeitressourcen

Der Smoke-Test simuliert zentrale Bedienabläufe:

- Auswahl eines Landes und Aktualisierung des Profils
- Suche, Filter, Matcher und Rücksetzen
- starke Ausschlüsse sowie konservatives Verhalten bei schwacher oder unbekannter Evidenz
- Vergleich, Favoriten, Kartenzustand und Screenshot-Vorschau
- Anzeige von Datenqualität und Quellen

Vor einer Veröffentlichung sollten beide Befehle ohne Fehler durchlaufen.

## Veröffentlichung mit GitHub Pages

Das Repository wird direkt als statische Website veröffentlicht. Es ist kein Build-System erforderlich.

Empfohlene GitHub-Einstellung:

1. Repository auf GitHub öffnen.
2. **Settings → Pages** aufrufen.
3. Unter **Build and deployment** die Veröffentlichung aus einem Branch auswählen.
4. Branch `main` und Verzeichnis `/ (root)` festlegen.
5. Speichern und den ersten Pages-Build abwarten.

Nach jedem Push auf `main` erstellt GitHub Pages automatisch die neue öffentliche Version. Der Status ist im Repository unter **Actions** beziehungsweise **Settings → Pages** sichtbar.

Öffentliche Adresse:

<https://steven44554.github.io/geoguessr-world-reference/>

Nach einem Update empfiehlt sich folgende Kontrolle:

1. Beide lokalen Tests ausführen.
2. Nur die beabsichtigten Dateien committen und auf `main` pushen.
3. Den erfolgreichen Pages-Build abwarten.
4. Die öffentliche Website mit einer vollständigen Aktualisierung neu laden.
5. Die geänderte Funktion auf Desktop und Smartphone kurz prüfen.

## Daten und Quellen

Die Länderbasis und Kartengeometrie liegen vollständig im Repository. Straßen- und Verkehrsmerkmale werden, soweit möglich, mit offiziellen Quellen verknüpft. Dazu gehören beispielsweise nationale Straßenverkehrsordnungen, Handbücher für Verkehrszeichen und Fahrbahnmarkierungen sowie Veröffentlichungen staatlicher Verkehrsbehörden.

Ergänzende Beobachtungsquellen können verwendet werden, wenn kein ausreichend detaillierter amtlicher Datensatz verfügbar ist. Solche Angaben erhalten eine vorsichtigere Zuverlässigkeitsstufe und werden nicht wie ein landesweiter Standard behandelt.

Beim Ergänzen von Daten gelten folgende Grundsätze:

- amtliche und aktuelle Primärquellen bevorzugen
- die konkrete Aussage möglichst direkt durch die Quelle belegen
- nationale Regeln von regionalen Varianten und typischen Beobachtungen trennen
- Datum der letzten Prüfung dokumentieren
- Unsicherheit ausdrücklich kennzeichnen
- fehlende Daten nicht durch Vermutungen ersetzen
- bei Straßen-Schemata wichtige Gegenbeispiele und Varianten nennen

Die verwendeten Quellen sind direkt in `data/countries.js` hinterlegt und werden im jeweiligen Länderprofil angezeigt.

Die lokal eingebundenen SVG-Landesflaggen stammen aus [flag-icons](https://github.com/lipis/flag-icons), Version 7.5.0. Das Projekt steht unter der MIT-Lizenz; der vollständige Lizenztext liegt unter `assets/flags/LICENSE`. Da die Dateien mit der Website ausgeliefert werden, werden auch die Flaggen ohne externe Bildanfrage geladen.

## Grenzen und Haftungsausschluss

- Die dargestellten Straßenbilder sind repräsentative Schemata und keine Garantie für jede Straße.
- Verkehrsregeln und Beschilderungen können sich ändern.
- Regionale Unterschiede, Überseegebiete, Sonderzonen, Baustellen und historische Street-View-Aufnahmen können abweichen.
- Nicht jedes Land besitzt für jedes Merkmal bereits gleich tiefe oder amtlich verifizierte Daten.
- Die Matcher-Reihenfolge ist eine Lernhilfe und keine statistisch kalibrierte Wahrscheinlichkeit.
- Die Website darf nicht als Ersatz für amtliche Verkehrsregeln oder reale Navigations- und Sicherheitsinformationen verwendet werden.

Dieses Projekt ist ein inoffizielles Lern- und Referenzwerkzeug. Es steht in keiner Verbindung zu GeoGuessr, Google Street View oder den genannten Verkehrsbehörden. Marken und Eigennamen gehören ihren jeweiligen Rechteinhabern.

## Beitragen und Updates

Verbesserungen an Länderprofilen, Quellen, Filtern, Barrierefreiheit und Darstellung sind willkommen. Für einen nachvollziehbaren Update-Ablauf:

1. Problem oder gewünschte Ergänzung möglichst konkret beschreiben.
2. Bei Datenänderungen mindestens eine belastbare Quelle angeben.
3. Nur den betroffenen Datensatz oder Funktionsbereich ändern.
4. Unsicherheit, regionale Gültigkeit und wichtige Ausnahmen dokumentieren.
5. `node tools/validate.js` und `node tools/smoke-test.js` ausführen.
6. Änderungen im Browser auf einer breiten und einer schmalen Ansicht prüfen.
7. Einen klar beschriebenen Commit oder Pull Request erstellen.
8. Nach der Übernahme den GitHub-Pages-Build und die Live-Website kontrollieren.

Bei einem sichtbaren Website-Update werden außerdem `data-update-id`, `data-published-at` und der Meldungstext des Update-Hinweises in `index.html` aktualisiert. Dadurch sehen Besucher genau einmal, welche neue Version veröffentlicht wurde und zu welcher Uhrzeit sie bereitstand.

Für Datenkorrekturen sind besonders hilfreich:

- Land und ISO-3-Code
- betroffener Hinweis
- bisheriger und vorgeschlagener Wert
- Geltungsbereich der Aussage
- direkte Quelle
- Datum der Prüfung
- kurze Erklärung, warum die Änderung notwendig ist

So bleibt die Website erweiterbar, ohne schwache Beobachtungen als sichere Ausschlussregeln zu behandeln.
