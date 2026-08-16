# GeoGuessr World Reference

Ein inoffizieller, interaktiver Länderatlas zum Eingrenzen von Ländern anhand sichtbarer Straßenmerkmale. Die Anwendung verbindet eine große anklickbare Weltkarte mit Länderprofilen und einem visuellen Merkmalsfilter. Die Website selbst läuft vollständig statisch mit HTML, CSS und JavaScript und benötigt weder Benutzerkonto noch Server. Eine optionale KI-Hilfe kann auf dem eigenen Windows-PC zusätzlich gestartet werden; alle manuellen Funktionen bleiben ohne dieses Programm und ohne API-Key verfügbar.

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
- Ein dauerhaft sichtbares Filter-Arbeitsfeld grenzt Länder anhand von Straßenhinweisen, Sprache, Straßenobjekten und Google-Car-/Kamera-Meta ein.
- Die optionale Screenshot-KI wertet das gesamte sichtbare Bild aus und ordnet Länder direkt ein.

Ohne Zusatzprogramm bleiben Weltkarte, Länderprofile, Suche und alle manuellen Filter vollständig nutzbar. Der Bereich **„Straßen-Screenshot“** ist dagegen bewusst ein reiner KI-Modus: Wer den lokalen KI-Helfer auf dem eigenen Windows-PC startet, kann dort ein Gesamtbild analysieren lassen und erhält direkt begründete Länderkategorien.

## Zentrale Funktionen

### Interaktive Weltkarte

- anklickbare Länder und zusätzliche Marker für kleine Gebiete
- farbliche Unterscheidung von Links- und Rechtsverkehr
- direkt sichtbare Straßenmarkierungs-Symbole auf der Karte
- Zoom-, Verschiebe- und Rücksetzfunktion
- Hervorhebung passender, möglicher und ausgeschlossener Länder
- Suchfeld und kategorisierte Filter für Kontinente, Verkehr, Landschaft, Sprache, Markierungen, Kennzeichen, Schildformen, Leitpfosten, Masten, Straßenrand und Kamera-Meta

### Übersichtliche Filterauswahl

Das Filter-Arbeitsfeld bleibt dauerhaft sichtbar und ist in fünf Kategorien aufgeteilt: **Basis**, **Straße**, **Umgebung**, **Objekte** und **Kamera**. Dadurch bleibt immer nur die gerade benötigte Gruppe im Blick, obwohl deutlich mehr Hinweise verfügbar sind. Trefferzahl, aktive Filter und eine Kurzfassung bleiben ständig sichtbar. Kleine Zähler an den Kategorien zeigen sofort, wo bereits etwas ausgewählt wurde.

Unvereinbare Optionen ersetzen sich automatisch. So können nicht versehentlich Links- und Rechtsverkehr, mehrere Kontinente oder verschiedene Varianten desselben Straßenobjekts gleichzeitig gewählt werden. Landschafts- und Fahrzeugmerkmale bleiben kombinierbar. **„Filter löschen“** entfernt die komplette Auswahl mit einem Klick. Nicht erfasste Objekt- und Kamera-Merkmale gelten weiterhin als unbekannt und nicht automatisch als Gegenbeweis.

Alle vier Farbfilter für Mittel- und Außenlinien werden vorsichtig ausgewertet. Wenn für ein Land positionsbezogen mehrere Farben nach Straßenklasse, Region oder Aufnahmestand erfasst sind, bleibt es bei jeder belegten Variante **möglich**, statt durch das repräsentative Hauptstraßenmuster ausgeschlossen zu werden. Verkehrsseite, Region, Landschaft, Schilder, Kennzeichen, Straßenobjekte und Kamera-Meta wirken trotzdem weiterhin gemeinsam und können das Land unabhängig davon eingrenzen oder ausschließen. Gelbe Park- oder Bordsteinmarkierungen zählen dabei nicht als gelbe Außenlinie.

Neu hinzugekommen sind unter anderem sichtbare Sprachen, gelbe Rauten- und Dreiecksschilder, Kennzeichenanordnungen, Leitpfosten-Muster, Holz- und Betonmasten, Schildrückseiten, verschiedene Straßenränder sowie eine auffällig niedrige Kameraposition. Die Kategorien lassen sich per Klick und Pfeiltasten bedienen. Bleibt der Mauszeiger über dem Filterfeld, wechselt eine einzelne Mausrad- oder Touchpad-Geste automatisch genau eine Kategorie vor oder zurück.

### Google-Car- und Kamera-Meta

Die Kategorie **„Kamera“** unterstützt direkt sichtbare Merkmale des Aufnahmefahrzeugs und besondere Aufnahmearten:

- **Dachgepäckträger**
- **sichtbare Spiegel**
- **Schnorchel**
- **Zelt, Gepäck oder Ersatzrad**
- **Klebeband oder markante Streifen am Fahrzeugaufbau**
- **Motorradkamera**
- **Trekker- beziehungsweise Fußkamera**
- **Bootskamera**
- **auffällig niedrige Kamera**

Die Auto-Merkmale lassen sich miteinander kombinieren. So kann beispielsweise gleichzeitig nach einem sichtbaren Dachgepäckträger, Spiegeln und einem Schnorchel gefiltert werden. Die drei Aufnahmemodi Motorrad, Trekker/Fußkamera und Boot sind dagegen gegenseitig exklusiv: Wird ein anderer Modus gewählt, ersetzt er den zuvor aktiven Modus. **„Filter löschen“** setzt sämtliche Filtergruppen zurück.

Diese Meta-Hinweise hängen stark von Aufnahmegeneration, Region, Route und Zeitpunkt der Street-View-Abdeckung ab. Ein Land ohne hinterlegtes Kamera-Meta bleibt deshalb **möglich**; fehlende Daten gelten nicht als Gegenbeweis. Auch ein dokumentierter Fahrzeugtyp wird nicht automatisch auf jede Aufnahme des Landes übertragen. Abweichungen zwischen Varianten werden vorsichtig gewichtet und führen nur bei entsprechend belastbaren, umfassenden Daten zu einem Ausschluss.

Die bereitgestellte ältere Referenzkarte wurde aus diesem Grund nicht unverändert als starre Länderklassifikation übernommen. Costa Rica wird nicht als „nur Trekker“ behandelt, weil neben besonderen Trekker- oder Bootsaufnahmen auch reguläre Autoabdeckung berücksichtigt werden muss. Vietnam wird nicht als „nur Motorrad“ modelliert, da sich Motorrad- und Autoaufnahmen unterscheiden können. Für Senegal wird bei der Gen-3-Variante neben dem Dachgepäckträger auch der sichtbare rechte Spiegel berücksichtigt. Diese Beispiele beschreiben Aufnahmevarianten und keine unveränderlichen landesweiten Regeln.

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

### Straßen-Screenshot als reiner KI-Modus

Im Screenshot-Bereich gibt es keine manuellen Merkmals-Auswahlfelder. Nach einem bewussten Klick analysiert die KI das gesamte sichtbare Bild, nicht nur Fahrbahnmarkierungen. Dazu gehören insbesondere:

- Vegetation, Klimaeindruck, Gelände und weitere Landschaftsmerkmale
- Leitpfosten beziehungsweise Bollards, Masten und Straßenrand-Infrastruktur
- Straßenbelag, Fahrbahnverlauf, Mittel- und Randlinien
- Verkehrszeichen, Stoppschild-Texte und Schildformen
- Kennzeichenfarben und Kennzeichenanordnung
- Bebauung, sichtbare Fahrzeuge und weitere verwertbare Umgebungshinweise
- sichtbares Kamera-Meta wie Dachgepäckträger, Spiegel, Schnorchel, Zelt, Gepäck, Ersatzrad, Klebeband oder Fahrzeugstreifen
- besondere Aufnahmemodi wie Motorradkamera, Trekker/Fußkamera oder Bootskamera

Die Antwort wird direkt als Länderanalyse dargestellt:

- **bester Tipp:** Die KI muss sich bei jeder erfolgreichen Analyse auf genau ein Land als `bestGuess` festlegen, auch wenn der Screenshot mehrdeutig ist.
- **wahrscheinlich / einschließen:** starke Kandidaten mit hoher Konfidenz
- **möglich:** plausible oder noch unsichere Kandidaten
- **ausgeschlossen:** Länder mit einem nachvollziehbaren starken Widerspruch
- **Bildmerkmale:** sichtbar erkannte Hinweise mit Begründung und Konfidenz

Die Kategorien erscheinen sowohl als Länderlisten als auch direkt auf der Weltkarte. Der beste Tipp wird zusätzlich prominent angezeigt und auf der Karte hervorgehoben. Eine niedrige Konfidenz bleibt dabei ausdrücklich als **unsicher** sichtbar und führt konservativ zu **„möglich“** statt zu einem vorschnellen Ausschluss. Unbekannte ISO-Codes, ungültige Kategorien und fehlerhafte Werte werden sicher ignoriert.

Bereits zuvor ausgewählte Filter werden beim bewussten Analyse-Klick als strukturierter `filterContext` mit `version: 1` und einer Liste fester `activeFilters` an den lokalen Helfer gesendet. Der Helfer nutzt sie als zusätzlichen, unbestätigten Nutzerkontext für die Rangfolge, nicht als angeblich im Bild erkannte Evidenz. Ändert sich die Filterauswahl während oder nach einer Analyse, wird das veraltete Ergebnis verworfen und die Website fordert zu einer neuen Analyse auf.

Die KI bewertet sichtbare Rig- und Fahrzeugmerkmale nicht isoliert. Sie kombiniert sie mit Hinweisen aus dem Gesamtbild, etwa Vegetation, Landschaft, Straßenbau, Leitpfosten, Beschilderung und Kennzeichen. Dadurch bleibt beispielsweise ein Dachgepäckträger ein nützlicher Hinweis, ohne allein als sicherer Ländernachweis behandelt zu werden.

Die KI-Analyse:

- funktioniert nur, wenn der Besitzer des PCs den lokalen `GeoGuessr-KI-Helfer` gestartet und dort seinen eigenen Groq-API-Key eingerichtet hat
- verlangt niemals eine API-Key-Eingabe im Browser
- sendet den Screenshot ausschließlich nach einem bewussten Klick auf die Analyseschaltfläche
- liefert Länderempfehlungen, aber keine garantierte Standortbestimmung
- hat keinen Einfluss auf Freunde oder andere Besucher der öffentlichen Website, bei denen das lokale Programm nicht läuft

Alle manuellen Filter bleiben außerhalb des Screenshot-Bereichs unabhängig verfügbar. Dazu gehören neben Stoppschild-Texten, Randlinien und Kennzeichenfarben auch Sprache, Warnschildform, Kennzeichenanordnung, Leitpfosten, Masten, Straßenrand und Kamerahöhe. **„Filter löschen“** entfernt diese Auswahl wieder.

### Datenqualität aus Phase 4

- Hinweise besitzen eine ausgewiesene Zuverlässigkeit.
- Nationale Standards werden von regionalen oder beobachtungsabhängigen Mustern unterschieden.
- Quellenbelegte, starke Widersprüche können ein Land ausschließen.
- Schwache oder regionale Hinweise verändern nur die Reihenfolge der Kandidaten.
- Fehlende Daten werden als unbekannt behandelt und nicht als Gegenbeweis.
- Verifizierte Merkmale zeigen ihre Quellen direkt im Länderprofil.

### Update-Hinweis

Nach einer neuen Website-Version erscheint unten rechts ein kompakter Hinweis mit Veröffentlichungsdatum und Uhrzeit. Ein Klick auf den Hinweis schließt ihn. Die Versions-ID wird ausschließlich im lokalen Browserspeicher abgelegt, damit genau diese Meldung beim nächsten Laden nicht erneut erscheint. Wird bei einem späteren Update eine neue Versions-ID veröffentlicht, erscheint der Hinweis wieder.

## Straßen-Screenshot und Datenschutz

Die Vorbereitung des Screenshots ist vollständig lokal:

1. Über **„Straßen-Screenshot“** wird die KI-Analyse geöffnet.
2. Mit **„Screenshot auswählen“** wird eine Bilddatei vom eigenen Gerät gewählt.
3. Der Browser erzeugt nur eine lokale Vorschau.
4. Erst **„Mit KI analysieren“** startet die Übertragung an den lokalen Helfer und anschließend an Groq.
5. Die erkannten Bildmerkmale und direkten Länderkategorien erscheinen auf der Website und der Karte.
6. Mit **„Bild entfernen“** beziehungsweise dem Zurücksetzen wird die Vorschau samt KI-Ergebnis verworfen.

Der Screenshot-Bereich enthält absichtlich keine manuellen Merkmalsfelder. Ohne laufenden Helfer ist dort keine Screenshot-Auswertung möglich. Die übrigen Funktionen der Website, einschließlich der Haupt-Schnellfilter, bleiben davon unabhängig nutzbar.

Solange die optionale KI-Analyse nicht angeklickt wird, wird das ausgewählte Bild nicht hochgeladen, nicht an GitHub gesendet und nicht auf einem externen Server analysiert. Beim Neuladen der Seite verschwindet die lokale Bildvorschau.

Nur beim bewussten Klick auf **„Mit KI analysieren“** sendet der Browser das ausgewählte Bild zuerst an `http://127.0.0.1:43117` auf demselben PC. Der lokale Helfer leitet den Screenshot dann zur Bilderkennung an Groq weiter. Für diese Verarbeitung gelten zusätzlich die Bedingungen und Datenschutzregeln von Groq. Der API-Key wird dabei ausschließlich vom lokalen Helfer zur Authentifizierung an Groq gesendet; er gelangt niemals in die Website, in den Browserspeicher, in den Screenshot oder zu GitHub.

> Wichtig: Beim Öffnen externer Quellen verlässt du die Website. Für deren Datenschutz gelten die Bestimmungen der jeweiligen Anbieter.

## Optionale lokale KI-Hilfe

### API-Key erstellen

Der Groq-API-Key wird direkt in der offiziellen Groq-Konsole erstellt:

**[Groq-API-Key erstellen](https://console.groq.com/keys)**

Groq bietet derzeit ein kostenloses Kontingent. Die Limits können sich jedoch jederzeit ändern; maßgeblich ist die [offizielle Übersicht der Groq-Limits](https://console.groq.com/docs/rate-limits). Wird ein kostenloses Limit erreicht, bleiben Atlas, Suche, Länderprofile und manuelle Filter nutzbar; nur die Screenshot-Analyse muss später erneut versucht werden.

> Gib den API-Key niemals in die Website, die Browser-Konsole, eine GitHub-Datei, einen Commit, einen Screenshot oder einen Chat ein. Der Schlüssel gehört ausschließlich in die verdeckte Abfrage des lokalen Helfers.

### Installation und erster Start

Der bereitgestellte Helfer ist eine einzelne Datei für Windows x64. Er benötigt die **.NET Desktop Runtime 8** und die **ASP.NET Core Runtime 8** in der x64-Ausführung. Falls Windows beim Start ein fehlendes Framework meldet, beide Laufzeiten über die [offizielle .NET-8-Downloadseite](https://dotnet.microsoft.com/download/dotnet/8.0) installieren. Auf dem PC des Projektbesitzers sind die benötigten Frameworks bereits vorhanden.

1. **[GeoGuessr-KI-Helfer für Windows x64 herunterladen](downloads/GeoGuessr-KI-Helfer.exe)**.
2. Die heruntergeladene `GeoGuessr-KI-Helfer.exe` starten. Der Helfer selbst benötigt keine Installation und muss nicht als Administrator ausgeführt werden.
3. Beim ersten Start den Groq-API-Key in die verdeckte Konsolenabfrage einfügen und mit Enter bestätigen. Während der Eingabe werden keine Zeichen angezeigt.
4. Das Fenster geöffnet lassen. Der Helfer lauscht ausschließlich lokal unter `http://127.0.0.1:43117`.
5. Die Website öffnen, einen Screenshot auswählen und auf **„Mit KI analysieren“** klicken.

Wenn der Helfer nicht läuft oder nicht eingerichtet ist, bleibt die KI-Schaltfläche ohne Funktion beziehungsweise zeigt eine verständliche Fehlermeldung. Karte, Länderprofile, Suche und manuelle Filter funktionieren davon unabhängig.

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
        │ Gesamtbildmerkmale und direkte Länderkategorien
        ▼
Lokaler Helfer → Browser → Länderlisten und Kartenhervorhebung
```

Die Website ruft niemals die Groq-API direkt auf. Sie sendet keinen API-Key und kennt ihn auch nicht. Der Helfer akzeptiert den Analyseaufruf nur auf der Loopback-Adresse und erwartet den Header `X-GeoGuessr-Helper: 1`. Die Anfrage enthält `imageDataUrl`, `fileName` und den strukturierten Filter-Snapshot `filterContext`. Darin stehen ausschließlich erlaubte Schlüssel-Wert-Paare; freie Beschriftungen aus der Oberfläche werden nicht übertragen. Ohne aktive Filter bleibt `activeFilters` leer und die Screenshot-Analyse funktioniert weiterhin.

Die kanonische Antwort enthält `countryAnalysis` mit `summary`, `imageClues`, genau einem `bestGuess`, `likely`, `possible` und `excluded`. Ein Bildmerkmal besteht aus `category`, `observation` und `confidence`; ein Ländereintrag aus `iso3`, `country`, `confidence`, `reasons` und `evidence`. Zusätzlich bestätigt `appliedFilterContext`, welche festen Filterpaare tatsächlich in den Modellhinweis übernommen wurden. Die Bildmerkmale beschreiben unter anderem Vegetation, Leitpfosten beziehungsweise Bollards, Landschaft, Straße, Schilder und Kennzeichen. Gründe erklären die geografische Interpretation, während `evidence` ausschließlich direkt sichtbare Belege nennt.

Der Helfer begrenzt die Antwort auf höchstens 24 Bildmerkmale, 5 wahrscheinliche, 10 mögliche und 12 ausgeschlossene Länder. Die Länderlisten sind gegenseitig eindeutig; bei mehrfacher Nennung gewinnt die stärkste Konfidenz. Der Browser validiert alle Einträge zusätzlich gegen die vorhandenen Länderdaten, ignoriert unbekannte ISO-Codes und ungültige Werte und stellt niedrige Konfidenz konservativ als **„möglich“** dar. Die KI-Kategorien werden nicht in versteckte manuelle Merkmalsfelder umgewandelt.

`127.0.0.1` bezeichnet immer den Computer des jeweiligen Besuchers. Freunde ohne den gestarteten Helfer sehen deshalb lediglich den Offline-Hinweis und können deinen auf deinem PC gespeicherten Schlüssel nicht mitbenutzen. Ihre Karte, Länderprofile und manuellen Filter funktionieren trotzdem vollständig.

### Fehlerhilfe

| Anzeige oder Problem | Lösung |
| --- | --- |
| Helfer ist nicht erreichbar | `GeoGuessr-KI-Helfer.exe` starten und das Fenster geöffnet lassen. Ohne Helfer ist keine Screenshot-Analyse möglich; Atlas und Hauptfilter bleiben nutzbar. |
| Kein Screenshot ausgewählt | Zuerst eine PNG-, JPG- oder WebP-Datei auswählen. |
| API-Key fehlt oder ist ungültig | Den Schlüssel mit `--reset-key` löschen und den Helfer erneut starten. |
| Kostenloses Limit erreicht | Die in der Meldung genannte Zeit abwarten und später erneut versuchen. Atlas und Haupt-Schnellfilter bleiben verfügbar. |
| Windows meldet ein fehlendes .NET-Framework | .NET Desktop Runtime 8 und ASP.NET Core Runtime 8 für x64 über die oben verlinkte offizielle Microsoft-Seite installieren. |
| Windows warnt vor einer unbekannten App | Nur die EXE aus diesem Repository verwenden. Im Zweifel nicht starten und den öffentlich einsehbaren Quellcode des Helfers selbst bauen. |
| KI-Vorschlag wirkt falsch | Bildmerkmale, Konfidenzen und Gründe prüfen. Unsichere Länder nur als „möglich“ behandeln oder die Analyse zurücksetzen. Die KI liefert keine garantierte Standortbestimmung. |

## Bedienung

### Filter mit einer Hand bedienen

1. Lass den Mauszeiger über den eigentlichen Filterkarten stehen.
2. Scrolle einmal nach unten, um von **Basis** zu **Straße** und danach zu den folgenden Kategorien zu wechseln.
3. Scrolle nach oben, um genau eine Kategorie zurückzugehen.
4. Eine länger auslaufende Touchpad-Geste löst nur einen Wechsel aus. Am ersten und letzten Reiter scrollt die Seite normal weiter, damit der Filterbereich keine Scroll-Falle bildet.

### Ein Land direkt untersuchen

1. Suche nach dem Land oder klicke es auf der Weltkarte an.
2. Das vollständige Länderprofil erscheint auf der rechten Seite beziehungsweise auf schmalen Bildschirmen unterhalb der Karte.
3. Prüfe besonders das Straßen-Schema, die hervorgehobenen Hinweise und deren Zuverlässigkeit.
4. Öffne bei Bedarf **„Datenqualität und Quellen“**, um Herkunft und Geltungsbereich der Angaben nachzuvollziehen.

### Länder mit Google-Car- und Kamera-Meta eingrenzen

1. Prüfe im Straßenbild nur die Merkmale, die tatsächlich sichtbar sind.
2. Öffne die Kategorie **„Kamera“** und aktiviere beliebig viele passende Auto-Merkmale, beispielsweise **Dachgepäckträger**, **Spiegel** und **Schnorchel**.
3. Wähle bei einer besonderen Aufnahme genau einen Modus: **Motorradkamera**, **Trekker/Fußkamera** oder **Bootskamera**.
4. Behandle hervorgehobene Länder als Kandidaten und kontrolliere im Länderprofil die bekannte Generation, Region und Abdeckungsvariante.
5. Kombiniere das Kamera-Meta mit Straße, Landschaft, Beschilderung und weiteren unabhängigen Hinweisen.

Ein unbekanntes oder nur teilweise dokumentiertes Kamera-Meta schließt ein Land nicht aus. Mit **„Filter löschen“** werden sowohl die allgemeinen Filter als auch die Google-Car-/Kamera-Meta-Filter zurückgesetzt.

### Länder mit einem Screenshot eingrenzen

1. Öffne **„Straßen-Screenshot“**.
2. Starte auf deinem PC den eingerichteten `GeoGuessr-KI-Helfer`.
3. Wähle einen PNG-, JPG- oder WebP-Screenshot aus.
4. Kontrolliere die lokale Vorschau und klicke auf **„Mit KI analysieren“**.
5. Prüfe zuerst die erkannten Bildmerkmale, besonders Vegetation, Leitpfosten, Landschaft, Straße, Schilder und Kennzeichen.
6. Vergleiche danach **wahrscheinlich / einschließen**, **möglich** und **ausgeschlossen** samt Konfidenzen und Gründen.
7. Klicke einen Kandidaten in der Liste oder auf der Karte an, um sein Länderprofil zu prüfen.
8. Setze die Analyse zurück, wenn das Bild ungeeignet ist oder die Begründung nicht überzeugt.

Ohne laufenden Helfer kann der Screenshot nicht ausgewertet werden. Es gibt in diesem Bereich keinen manuellen Ersatz-Matcher. Verwende dann die Weltkarte, Länderprofile, Suche oder das Filter-Arbeitsfeld oberhalb der Karte.

## Bewertung, Zuverlässigkeit und Quellen

Die Konfidenzen der Screenshot-KI sind keine statistisch kalibrierten Standortwahrscheinlichkeiten. Sie dienen als nachvollziehbare Sortierhilfe. Ein Ergebnis sollte immer zusammen mit den erkannten Bildmerkmalen und den angegebenen Gründen geprüft werden. Niedrige oder widersprüchliche Sicherheit bleibt **„möglich“** und darf nicht als sicherer Ausschluss erscheinen.

Jeder KI-Kandidat trägt zusätzlich strukturierte `evidenceCategories`. Ein harter Ausschluss wird nur übernommen, wenn mindestens eine robuste, im Bild tatsächlich ausgegebene Widerspruchskategorie vorliegt, etwa Straßenmarkierung, Schild, Sprache, Kennzeichen, Leitpfosten oder Verkehrsseite. Ausschlüsse, die nur auf Vegetation, Klima, Landschaft, Kameraartefakten, Google-Car-/Fahrzeugmeta, unbekannten Kategorien oder gar keiner Kategorie beruhen, werden automatisch zu **„möglich“** herabgestuft.

Davon getrennt arbeitet das manuelle Filter-Arbeitsfeld mit den hinterlegten, quellenbewerteten Länderdaten:

| Datenlage | Verhalten der Hauptfilter |
| --- | --- |
| Hohe Zuverlässigkeit, amtliche Quelle und starker nationaler Widerspruch | Das Land kann ausgeschlossen werden. |
| Mittlere oder niedrige Zuverlässigkeit | Der Hinweis beeinflusst die Reihenfolge, führt aber nicht allein zum Ausschluss. |
| Regionales oder straßentypabhängiges Merkmal | Das Land bleibt grundsätzlich möglich. |
| Keine hinterlegten Daten | Unbekannt bleibt möglich; fehlende Daten gelten nicht als Widerspruch. |

Diese Logik schützt vor einer häufigen Fehlannahme: Ein typisches Merkmal ist nicht automatisch auf jeder Straße eines Landes vorhanden. Baustellen, ältere Aufnahmen, regionale Regeln, unterschiedliche Straßenklassen, verblasste Markierungen und private Straßen können vom hinterlegten Grundmuster abweichen.

Russland bleibt deshalb bei weißen und gelben Mittel- sowie Randlinien als möglicher Kandidat sichtbar. Die große regionale, straßentypabhängige und zeitliche Variation wird dabei nicht als sicherer Treffer gewertet.

Für Kamera-Meta kommen zusätzliche Unterschiede zwischen Aufnahmegenerationen, Fahrzeugvarianten, Sonderaufnahmen und neu hinzugekommener Abdeckung hinzu. Ein Treffer bedeutet daher, dass eine passende Variante dokumentiert ist; er behauptet nicht, dass jede Aufnahme des Landes dieses Merkmal zeigt.

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

Aus Sicherheitsgründen verbindet sich die optionale KI-Hilfe nicht aus einer direkt per `file://` geöffneten Seite mit dem lokalen Helfer. Die manuellen Atlasfunktionen laufen weiterhin direkt aus der Datei. Für die KI-Analyse bitte die veröffentlichte GitHub-Pages-Website oder den folgenden lokalen Webserver verwenden; der Helfer akzeptiert ausschließlich diese veröffentlichte Herkunft und Loopback-Adressen wie `localhost` beziehungsweise `127.0.0.1`.

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
├── script.js                        # Interaktion, Filter-Arbeitsfeld, Screenshot-KI und Karte
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
- Datenmodell der Google-Car-/Kamera-Meta-Varianten und ihrer Quellen
- vorhandene Bedienelemente und verknüpfte Skripte
- vollständig statischen manuellen Betrieb ohne externe Laufzeitressourcen
- fehlende Browser-Eingabefelder und Speicherpfade für API-Keys
- reinen KI-Modus ohne sichtbare manuelle Selects oder Checkboxen im Screenshot-Bereich
- festen Loopback-Endpunkt, Helfer-Header und dokumentierten Anfragevertrag
- Schema der direkten `countryAnalysis`-Antwort und sichere ISO-Validierung
- Abwesenheit eines versehentlich eingecheckten Groq-Schlüssels

Der Smoke-Test simuliert zentrale Bedienabläufe:

- Auswahl eines Landes und Aktualisierung des Profils
- Suche, Filterauswahl und vollständiges Zurücksetzen
- dauerhafte Filterfläche mit fünf per Maus und Tastatur bedienbaren Kategorien
- Filter für Stoppschilder, Linien, Kennzeichen, Sprache, Schildformen, Leitpfosten, Masten, Straßenrand und Kamerahöhe
- kombinierbare Auto-Merkmale sowie exklusive Aufnahmemodi der Kamera-Kategorie
- Favoriten, Kartenzustand und Screenshot-Vorschau
- Anzeige von Datenqualität und Quellen
- Screenshot-Übertragung erst nach dem bewussten KI-Klick
- direkte Verarbeitung der Ländergruppen `likely`, `possible` und `excluded`
- übereinstimmende Kategorien in Kartenklassen und sichtbaren Länderlisten
- sichtbare Gesamtbildmerkmale für Vegetation, Leitpfosten, Landschaft und Kamera-Meta
- konservative Behandlung niedriger Konfidenz
- sicheres Ignorieren unbekannter ISO-Codes und ungültiger Werte
- verständliches Offline-Verhalten: keine Screenshot-Analyse, aber weiterhin Atlas und Hauptfilter
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
- Die KI-Länderkategorien und Hauptfilter sind Lernhilfen und keine statistisch kalibrierten Standortwahrscheinlichkeiten.
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
