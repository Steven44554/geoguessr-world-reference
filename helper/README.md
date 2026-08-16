# GeoGuessr-KI-Helfer

Der Helfer verbindet die öffentliche, statische Website mit Groqs Bilderkennung, ohne den API-Key in die Website oder nach GitHub zu legen. Version 1.3.0 analysiert das gesamte Straßenbild einschließlich sichtbarem Fahrzeug- und Aufnahmemeta, berücksichtigt zuvor gewählte Website-Filter als unbestätigten Nutzerkontext und legt sich auch bei Unsicherheit auf einen bestmöglichen Ländertipp fest.

## Antwortvertrag

`POST /analyze` akzeptiert weiterhin `imageDataUrl` und `fileName`. Optional kann die Website folgenden rückwärtskompatiblen Filterkontext mitsenden:

```json
{
  "imageDataUrl": "data:image/jpeg;base64,...",
  "fileName": "strasse.jpg",
  "filterContext": {
    "version": 1,
    "activeFilters": [
      { "key": "traffic", "value": "left" },
      { "key": "vehicleFeature", "value": "roof-rack" }
    ]
  }
}
```

Der Helfer übernimmt nur fest erlaubte Schlüssel-Wert-Paare. Freie Texte, unbekannte Werte und unbekannte Kontextversionen gelangen nicht in den Modellprompt. Die kanonische Antwort enthält:

- `countryAnalysis.summary` als konservatives Gesamturteil
- `countryAnalysis.imageClues` mit Kategorie, sichtbarer Beobachtung und Konfidenz
- `countryAnalysis.bestGuess` als genau einen festgelegten Ländertipp mit ISO-3-Code, Ländername, Konfidenz, Gründen, sichtbaren Belegen und normalisierten `evidenceCategories`
- `countryAnalysis.likely`, `possible` und `excluded` mit ISO-3-Code, Ländername, Konfidenz, Gründen, sichtbaren Belegen und normalisierten `evidenceCategories`
- `appliedFilterContext` als Bestätigung des tatsächlich normalisierten und verwendeten Filterkontexts
- `warnings` für Unsicherheit oder konkurrierende Evidenz

Ein erfolgreicher Analyseaufruf enthält immer genau ein Objekt unter `countryAnalysis.bestGuess`. Wenn das Modell dieses Feld auslässt, verwendet der Helfer rückwärtskompatibel den stärksten gültigen Eintrag aus `likely` oder `possible`. Liefert das Modell überhaupt keinen gültigen positiven Ländertipp, wird die Antwort als ungültig abgelehnt, statt einen erfolgreichen Aufruf ohne Festlegung zurückzugeben.

Erlaubte Filterpaare in `filterContext.activeFilters` sind:

- `traffic`: `left`, `right`
- `centerColor`, `edgeColor`, `plateColor`: `yellow`, `white`
- `terrain`: `tropical`, `desert`, `mountain`
- `continent`: `europe`, `africa`, `asia`, `north-america`, `south-america`, `oceania`
- `stopSign`: `stop-only`, `other-text`
- `vehicleFeature`: `roof-rack`, `mirrors`, `snorkel`, `equipment`, `tape`
- `captureType`: `motorcycle`, `trekker`, `boat`

Die Filter stammen vom Nutzer und werden ausdrücklich getrennt von der sichtbaren Bildevidenz an das Modell übergeben. Sie dürfen die Rangfolge beeinflussen, werden aber nicht automatisch zu `imageClues`, `evidence` oder `evidenceCategories`. Ein Merkmal erscheint dort nur, wenn es unabhängig im Screenshot sichtbar ist.

Die Bildmerkmale decken unter anderem Vegetation, Klima, Landschaft, Leitpfosten beziehungsweise Bollards, Straße, Schilder, Sprache, Kennzeichen, Architektur, Masten, Verkehr, Kameraartefakte und die Kategorie `vehicle-meta` ab. Bei Fahrzeug- und Aufnahmemeta prüft die KI ausdrücklich Dachgepäckträger beziehungsweise Querstreben, Seitenspiegel, Schnorchel, Zelt, Gepäck, Ersatzrad, Klebeband oder markante Streifen sowie Motorrad-, Trekker-, Fuß- und Bootskameras. Gründe interpretieren die Geografie; `evidence` darf nur direkt Sichtbares beschreiben. Die Kategorien sind gegenseitig eindeutig und werden nicht in manuelle Matcher-Eingaben umgewandelt.

Fahrzeugmeta wird immer mit Vegetation, Straße und weiteren sichtbaren Szenenhinweisen abgeglichen. Die KI soll Unterschiede zwischen Aufnahmegenerationen, Regionen und Aufnahmeserien berücksichtigen, aber keine Generation oder Meta-Variante erfinden. Verdecktes, unscharfes oder unbekanntes Fahrzeugmeta gilt nicht als Widerspruch und darf kein Land hart ausschließen.

Der Helfer prüft Modellausschlüsse zusätzlich serverseitig. Ein Land bleibt nur dann in `excluded`, wenn mindestens eine robuste, zugleich als sichtbarer Bildhinweis ausgegebene Widerspruchskategorie aus Straße, Schildern, Sprache, Kennzeichen, Leitpfosten, Architektur, Masten oder Verkehr vorliegt. Ausschlüsse nur aufgrund von Vegetation, Klima, Landschaft, Kamera-, Fahrzeugmeta, sonstigen oder unbekannten Kategorien werden mit einer Warnung auf `possible` herabgestuft.

## Entwicklung

```powershell
dotnet run --project .\helper\GeoGuessrAiHelper\GeoGuessrAiHelper.csproj
```

Beim ersten Start fragt das Programm verdeckt nach dem Groq-Key und speichert ihn mit Windows-DPAPI unter `%LOCALAPPDATA%\GeoGuessr-KI-Helfer\groq-key.dpapi`. Die Datei kann ausschließlich durch dasselbe Windows-Benutzerkonto entschlüsselt werden.

Schlüssel löschen:

```powershell
dotnet run --project .\helper\GeoGuessrAiHelper\GeoGuessrAiHelper.csproj -- --reset-key
```

Lokaler Selbsttest ohne Netzwerk und API-Key:

```powershell
dotnet run --project .\helper\GeoGuessrAiHelper\GeoGuessrAiHelper.csproj -- --self-test
```

Veröffentlichbare EXE erzeugen:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\helper\build-helper.ps1
```

Der Helfer lauscht ausschließlich auf `127.0.0.1:43117`. Zulässige Browser-Ursprünge sind die veröffentlichte GitHub-Pages-Seite und lokale Webserver auf Loopback-Adressen. Direkt geöffnete HTML-Dateien senden `Origin: null`; dieser Ursprung ist für die KI-Schnittstelle ausdrücklich blockiert. Die manuellen Website-Funktionen können weiterhin direkt aus der HTML-Datei genutzt werden, für die KI ist lokal beispielsweise ein Webserver unter `http://localhost` erforderlich. Der Header `X-GeoGuessr-Helper: 1` ist für Anfragen erforderlich.

Die Umgebungsvariablen `GEOGUESSR_GROQ_API_KEY` und `GEOGUESSR_GROQ_BASE_URL` dienen ausschließlich lokalen Tests. Sie werden nicht gespeichert. Die produktive Groq-Adresse ist fest vorgegeben; eine Anfrage der Website kann sie nicht verändern.
