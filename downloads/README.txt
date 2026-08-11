GeoGuessr-KI-Helfer für Windows
================================

1. Erstelle deinen kostenlosen Groq-Key:
   https://console.groq.com/keys

2. Starte GeoGuessr-KI-Helfer.exe.

3. Füge den Key bei der ersten, verdeckten Abfrage ein und drücke Enter.

4. Lass das schwarze Helferfenster offen. Die GeoGuessr-Website öffnet sich
   automatisch und zeigt beim Screenshot-Matcher „Lokaler Helfer verbunden“.

Schlüssel zurücksetzen:
  GeoGuessr-KI-Helfer.exe --reset-key

Der Schlüssel wird mit Windows-DPAPI im Benutzerprofil verschlüsselt und nie
in der Website gespeichert. Ein Screenshot wird nur nach einem Klick auf
„Mit KI analysieren“ über den Helfer an Groq übertragen.

Diese EXE benötigt die auf diesem PC vorhandene .NET-8-Desktop- und
ASP.NET-Core-Laufzeit. Der manuelle Teil der Website funktioniert immer ohne
dieses Programm und ohne API-Key.
