# GeoGuessr World Reference

Ein inoffizieller, interaktiver Länderatlas zum Eingrenzen von Ländern anhand sichtbarer Straßenmerkmale. Die Anwendung verbindet eine anklickbare Weltkarte mit Länderprofilen, Straßen-Schemata, einem visuellen Merkmalsfilter und direkten Länder-Vergleichen. Die Website selbst läuft vollständig statisch mit HTML, CSS und JavaScript und benötigt weder Benutzerkonto noch Server. Eine optionale KI-Hilfe kann auf dem eigenen Windows-PC zusätzlich gestartet werden; alle manuellen Funktionen bleiben ohne dieses Programm und ohne API-Key verfügbar.

## Öffentliche Website

**[GeoGuessr World Reference öffnen](https://steven44554.github.io/geoguessr-world-reference/)**

Die veröffentlichte Version wird über GitHub Pages bereitgestellt. Änderungen auf dem Branch `main` erscheinen nach einem erfolgreichen Pages-Build automatisch auf der Website.

## Inhaltsverzeichnis

- [Projektidee](#projektidee)
- [Zentrale Funktionen](#zentrale-funktionen)
- [Update-Hinweis](#update-hinweis)
- [Straßen-Screenshot und Datenschutz](#straßen-screenshot-und-datenschutz)
- [Optionale lokale KI-Hilfe](#optionale-lokale-ki-hilfe)
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

Ohne Zusatzprogramm entscheidet der Nutzer selbst, welche Merkmale eindeutig sichtbar sind. Dadurch bleibt die manuelle Auswertung nachvollziehbar und kontrollierbar. Wer den lokalen KI-Helfer auf dem eigenen Windows-PC startet, kann einen ausgewählten Screenshot zusätzlich analysieren lassen und die erkannten Merkmale als Vorschlag in den Matcher übernehmen.

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

### Optionale KI-Analyse

- funktioniert nur, wenn der Besitzer des PCs den lokalen `GeoGuessr-KI-Helfer` gestartet und dort seinen eigenen Groq-API-Key eingerichtet hat
- verlangt niemals eine API-Key-Eingabe im Browser
- analysiert einen Screenshot ausschließlich nach einem bewussten Klick auf die Analyseschaltfläche
- übernimmt nur bekannte Merkmale mit mindestens `0,60` Modell-Konfidenz
- lässt unbekannte, widersprüchliche oder schwächer bewertete Merkmale unverändert
- zeigt das Ergebnis als Vorschlag; die manuelle Kontrolle bleibt weiterhin möglich
- hat keinen Einfluss auf Freunde oder andere Besucher der öffentlichen Website, bei denen das lokale Programm nicht läuft

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

Der normale Screenshot-Workflow ist vollständig lokal:

1. Über **„Straßen-Screenshot“** wird der Matcher geöffnet.
2. Mit **„Screenshot auswählen“** wird eine Bilddatei vom eigenen Gerät gewählt.
3. Der Browser erzeugt nur eine lokale Vorschau.
4. Die erkennbaren Merkmale werden von Hand in den Auswahlfeldern eingetragen.
5. Mit **„Bild entfernen“** wird die Vorschau wieder verworfen.

Solange die optionale KI-Analyse nicht angeklickt wird, wird das ausgewählte Bild nicht hochgeladen, nicht an GitHub gesendet und nicht auf einem externen Server analysiert. Beim Neuladen der Seite verschwindet die lokale Bildvorschau.

Nur beim bewussten Klick auf **„Mit KI analysieren“** sendet der Browser das ausgewählte Bild zuerst an `http://127.0.0.1:43117` auf demselben PC. Der lokale Helfer leitet den Screenshot dann zur Bilderkennung an Groq weiter. Für diese Verarbeitung gelten zusätzlich die Bedingungen und Datenschutzregeln von Groq. Der API-Key wird dabei ausschließlich vom lokalen Helfer zur Authentifizierung an Groq gesendet; er gelangt niemals in die Website, in den Browserspeicher, in den Screenshot oder zu GitHub.

> Wichtig: Beim Öffnen externer Quellen verlässt du die Website. Für deren Datenschutz gelten die Bestimmungen der jeweiligen Anbieter.

## Optionale lokale KI-Hilfe

### API-Key erstellen

Der Groq-API-Key wird direkt in der offiziellen Groq-Konsole erstellt:

**[Groq-API-Key erstellen](https://console.groq.com/keys)**

Groq bietet derzeit ein kostenloses Kontingent. Die Limits können sich jedoch jederzeit ändern; maßgeblich ist die [offizielle Übersicht der Groq-Limits](https://console.groq.com/docs/rate-limits). Wird ein kostenloses Limit erreicht, bleibt die Website weiterhin manuell benutzbar und die KI-Analyse kann später erneut versucht werden.

> Gib den API-Key niemals in die Website, die Browser-Konsole, eine GitHub-Datei, einen Commit, einen Screenshot oder einen Chat ein. Der Schlüssel gehört ausschließlich in die verdeckte Abfrage des lokalen Helfers.

### Installation und erster Start

Der bereitgestellte Helfer ist eine einzelne Datei für Windows x64. Er benötigt die **.NET Desktop Runtime 8** und die **ASP.NET Core Runtime 8** in der x64-Ausführung. Falls Windows beim Start ein fehlendes Framework meldet, beide Laufzeiten über die [offizielle .NET-8-Downloadseite](https://dotnet.microsoft.com/download/dotnet/8.0) installieren. Auf dem PC des Projektbesitzers sind die benötigten Frameworks bereits vorhanden.

1. **[GeoGuessr-KI-Helfer für Windows x64 herunterladen](downloads/GeoGuessr-KI-Helfer.exe)**.
2. Die heruntergeladene `GeoGuessr-KI-Helfer.exe` starten. Der Helfer selbst benötigt keine Installation und muss nicht als Administrator ausgeführt werden.
3. Beim ersten Start den Groq-API-Key in die verdeckte Konsolenabfrage einfügen und mit Enter bestätigen. Während der Eingabe werden keine Zeichen angezeigt.
4. Das Fenster geöffnet lassen. Der Helfer lauscht ausschließlich lokal unter `http://127.0.0.1:43117`.
5. Die Website öffnen, einen Screenshot auswählen und auf **„Mit KI analysieren“** klicken.

Wenn der Helfer nicht läuft oder nicht eingerichtet ist, bleibt die KI-Schaltfläche ohne Funktion beziehungsweise zeigt eine verständliche Fehlermeldung. Karte, Länderprofile, Suche, manuelle Filter und Vergleiche funktionieren davon unabhängig.

### Sichere Speicherung mit Windows-DPAPI

Der Helfer verschlüsselt den API-Key mit der Windows Data Protection API (DPAPI) und speichert nur die verschlüsselte Form unter `%LOCALAPPDATA%\GeoGuessr-KI-Helfer\groq-key.dpapi`. Die Entschlüsselung ist an dasselbe Windows-Benutzerkonto auf demselben PC gebunden. Der Browser kann den gespeicherten Schlüssel nicht auslesen, und im Repository befindet sich kein API-Key.

### API-Key zurücksetzen

1. Den laufenden Helfer beenden.
2. PowerShell oder die Eingabeaufforderung im Ordner der EXE öffnen.
3. Folgenden Befehl ausführen:

```powershell
.\GeoGuessr-KI-Helfer.exe --reset-key
```

4. Den Helfer anschließend normal neu starten und den neuen Schlüssel in die verdeckte Abfrage eingeben.

### Architektur und Datenfluss

```text
Statische GitHub-Pages-Website
        │
        │ POST /analyze mit Screenshot und X-GeoGuessr-Helper: 1
        ▼
http://127.0.0.1:43117 auf dem eigenen PC
        │
        │ entschlüsselt den Key per Windows-DPAPI und sendet nur bei Klick
        ▼
Groq Vision API
        │
        │ strukturierte Beobachtungen mit Wert, Konfidenz und Begründung
        ▼
Lokaler Helfer → Browser → vorhandener regelbasierter Länder-Matcher
```

Die Website ruft niemals die Groq-API direkt auf. Sie sendet keinen API-Key und kennt ihn auch nicht. Der Helfer akzeptiert den Analyseaufruf nur auf der Loopback-Adresse und erwartet den Header `X-GeoGuessr-Helper: 1`. Die Anfrage enthält ausschließlich `imageDataUrl` und `fileName`. Die Antwort enthält `summary`, `observations` und mögliche `warnings`; jedes erkannte Merkmal besitzt `value`, `confidence` und `evidence`. Erst der Browser entscheidet anhand der festen Schwelle `confidence >= 0.60`, welche bekannten Werte in den Matcher übernommen werden. `unknown` und nicht unterstützte Werte werden nicht angewendet.

`127.0.0.1` bezeichnet immer den Computer des jeweiligen Besuchers. Freunde ohne den gestarteten Helfer sehen deshalb lediglich den Offline-Hinweis und können deinen auf deinem PC gespeicherten Schlüssel nicht mitbenutzen. Ihre Karte, Länderprofile und manuellen Filter funktionieren trotzdem vollständig.

### Fehlerhilfe

| Anzeige oder Problem | Lösung |
| --- | --- |
| Helfer ist nicht erreichbar | `GeoGuessr-KI-Helfer.exe` starten und das Fenster geöffnet lassen. |
| Kein Screenshot ausgewählt | Zuerst eine PNG-, JPG- oder WebP-Datei auswählen. |
| API-Key fehlt oder ist ungültig | Den Schlüssel mit `--reset-key` löschen und den Helfer erneut starten. |
| Kostenloses Limit erreicht | Die in der Meldung genannte Zeit abwarten und später erneut versuchen. Die manuellen Filter bleiben verfügbar. |
| Windows meldet ein fehlendes .NET-Framework | .NET Desktop Runtime 8 und ASP.NET Core Runtime 8 für x64 über die oben verlinkte offizielle Microsoft-Seite installieren. |
| Windows warnt vor einer unbekannten App | Nur die EXE aus diesem Repository verwenden. Im Zweifel nicht starten und den öffentlich einsehbaren Quellcode des Helfers selbst bauen. |
| KI-Vorschlag wirkt falsch | Unsichere Filter manuell entfernen. Die KI liefert Hinweise, keine garantierte Länderbestimmung. |

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

Mit laufendem KI-Helfer kann nach Schritt 2 alternativ **„Mit KI analysieren“** angeklickt werden. Prüfe danach die Zusammenfassung und die übernommenen Merkmale. Werte unter `0,60` Konfidenz sowie unbekannte Werte trägt die Website bewusst nicht ein. **„Zurücksetzen“** löscht sowohl die manuell gewählten Merkmale als auch das sichtbare KI-Ergebnis, jedoch weder den verschlüsselt gespeicherten API-Key noch die ausgewählte Länderansicht.

### Zwei oder mehr Länder vergleichen

1. Füge Länder über die Vergleichsfunktion hinzu oder wähle eine Vorlage.
2. Öffne **„Vergleichen“**.
3. Stelle Verkehr, Markierungen, Kennzeichen, Landschaft und typische Hinweise nebeneinander.

## Bewertung, Zuverlässigkeit und Quellen

Die Trefferliste ist keine statistisch kalibrierte Wahrscheinlichkeitsberechnung. Auch nach einer optionalen KI-Analyse bleibt sie eine regelbasierte, konservative Entscheidungshilfe: Die KI schlägt lediglich sichtbare Merkmale vor, während der vorhandene Matcher daraus die Ländergruppen bildet.

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

Die statische Website hat keine Build-Stufe und keine Laufzeitabhängigkeiten. Für ihre manuellen Funktionen genügt ein moderner Browser. Nur der optionale Windows-Helfer benötigt die oben genannten .NET-8-Laufzeiten.

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
├── downloads/
│   └── GeoGuessr-KI-Helfer.exe     # optionales lokales Windows-Programm
├── helper/
│   ├── GeoGuessrAiHelper/          # C#-Quellcode des lokalen Helfers
│   ├── build-helper.ps1            # reproduzierbarer EXE-Build
│   └── README.md                   # Entwickler- und Selbsttesthinweise
├── tools/
│   ├── validate.js                  # strukturelle und inhaltliche Validierung
│   ├── smoke-test.js                # browsernaher Interaktions-Smoke-Test
│   ├── generate-world-map.js        # Kartendaten erzeugen
│   ├── map-lod-report.js            # Detailstufen der Karte prüfen
│   └── render-map-preview.js        # Vorschau der Karte erzeugen
├── .gitignore                       # schließt Schlüssel und Buildausgaben aus
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
- vollständig statischen manuellen Betrieb ohne externe Laufzeitressourcen
- fehlende Browser-Eingabefelder und Speicherpfade für API-Keys
- festen Loopback-Endpunkt, Helfer-Header und dokumentierten Anfragevertrag
- Abwesenheit eines versehentlich eingecheckten Groq-Schlüssels

Der Smoke-Test simuliert zentrale Bedienabläufe:

- Auswahl eines Landes und Aktualisierung des Profils
- Suche, Filter, Matcher und Rücksetzen
- starke Ausschlüsse sowie konservatives Verhalten bei schwacher oder unbekannter Evidenz
- Vergleich, Favoriten, Kartenzustand und Screenshot-Vorschau
- Anzeige von Datenqualität und Quellen
- Screenshot-Übertragung erst nach dem bewussten KI-Klick
- Übernahme bekannter KI-Merkmale erst ab `0,60` Konfidenz
- Ignorieren unbekannter oder zu unsicherer KI-Werte
- gegenseitigen Ausschluss widersprüchlicher Stoppschild-Merkmale
- verständliches Offline-Verhalten ohne Einschränkung der manuellen Funktionen
- vollständiges Löschen des sichtbaren KI-Ergebnisses beim Zurücksetzen

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
