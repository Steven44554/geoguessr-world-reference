GeoGuessr-KI-Helfer für Windows – Version 1.3.0
===============================================

1. Erstelle deinen kostenlosen Groq-Key:
   https://console.groq.com/keys

2. Starte GeoGuessr-KI-Helfer.exe.

3. Füge den Key bei der ersten, verdeckten Abfrage ein und drücke Enter.

4. Lass das schwarze Helferfenster offen. Die GeoGuessr-Website öffnet sich
   automatisch und zeigt bei der lokalen KI-Analyse „Lokaler Helfer verbunden“.

5. Wähle einen Straßen-Screenshot aus und klicke „Mit KI analysieren“.
   Die KI prüft das Gesamtbild einschließlich Vegetation, Leitpfosten,
   Landschaft, Straße, Schildern, Kennzeichen sowie sichtbarem Fahrzeug- und
   Aufnahmemeta. Dazu gehören Dachgepäckträger, Querstreben, Seitenspiegel,
   Schnorchel, Zelt, Gepäck, Ersatzrad, Klebeband beziehungsweise Streifen und
   Motorrad-, Trekker-, Fuß- oder Bootskameras. Danach zeigt die Website
   einen bestmöglichen Ländertipp sowie wahrscheinliche, mögliche und
   ausgeschlossene Länder mit Gründen an. Die KI legt sich auch bei niedriger
   Sicherheit auf genau einen Tipp fest und zeigt die Unsicherheit weiterhin an.

   Bereits ausgewählte Website-Filter werden als zusätzlicher Nutzerkontext an
   den Helfer gesendet. Der Helfer lässt nur bekannte Filterwerte zu. Diese
   Angaben beeinflussen die Rangfolge, gelten aber nicht automatisch als im Bild
   sichtbarer Beleg.

   Fahrzeugmeta wird mit den übrigen sichtbaren Hinweisen kombiniert. Varianten
   nach Region und Aufnahmegeneration werden berücksichtigt; unbekanntes oder
   verdecktes Meta führt nicht automatisch zum Ausschluss eines Landes.

   Ausschlüsse prüft der Helfer zusätzlich selbst: Ohne eine robuste sichtbare
   Widerspruchskategorie wird ein Land nur als „möglich“ angezeigt und eine
   Warnung ergänzt.

Schlüssel zurücksetzen:
  GeoGuessr-KI-Helfer.exe --reset-key

Der Schlüssel wird mit Windows-DPAPI im Benutzerprofil verschlüsselt und nie
in der Website gespeichert. Ein Screenshot wird nur nach einem Klick auf
„Mit KI analysieren“ über den Helfer an Groq übertragen. Im Screenshot-Bereich
gibt es keine manuellen Merkmalsfelder.

Diese EXE benötigt die auf diesem PC vorhandene .NET-8-Desktop- und
ASP.NET-Core-Laufzeit. Atlas, Suche, Länderprofile, Haupt-Schnellfilter und
Vergleich funktionieren immer ohne dieses Programm und ohne API-Key; nur die
Screenshot-Analyse ist dann nicht verfügbar.

Sicherheitshinweis:
  Nutze für die KI entweder die veröffentlichte GitHub-Pages-Website oder einen
  lokalen Webserver unter http://localhost beziehungsweise 127.0.0.1. Eine
  direkt geöffnete HTML-Datei funktioniert weiterhin für Atlas, Filter und
  Länderprofile, darf den KI-Helfer wegen ihres unsicheren Ursprungs
  „Origin: null“ jedoch absichtlich nicht aufrufen.
