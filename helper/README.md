# GeoGuessr-KI-Helfer

Der Helfer verbindet die öffentliche, statische Website mit Groqs Bilderkennung, ohne den API-Key in die Website oder nach GitHub zu legen.

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

Der Helfer lauscht ausschließlich auf `127.0.0.1:43117`. Zulässige Browser-Ursprünge sind die veröffentlichte GitHub-Pages-Seite, lokale Entwicklungsserver und lokale HTML-Dateien. Der Header `X-GeoGuessr-Helper: 1` ist für Anfragen erforderlich.

Die Umgebungsvariablen `GEOGUESSR_GROQ_API_KEY` und `GEOGUESSR_GROQ_BASE_URL` dienen ausschließlich lokalen Tests. Sie werden nicht gespeichert. Die produktive Groq-Adresse ist fest vorgegeben; eine Anfrage der Website kann sie nicht verändern.
