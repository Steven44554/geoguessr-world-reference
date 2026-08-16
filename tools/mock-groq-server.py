"""Einmaliger lokaler Groq-Mock für den KI-Helfer-Integrationstest."""

import json
from http.server import BaseHTTPRequestHandler, HTTPServer


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.headers.get("Transfer-Encoding", "").lower() == "chunked":
            while True:
                chunk_size = int(self.rfile.readline().split(b";", 1)[0], 16)
                if chunk_size == 0:
                    self.rfile.readline()
                    break
                self.rfile.read(chunk_size)
                self.rfile.read(2)
        else:
            length = int(self.headers.get("Content-Length", "0"))
            self.rfile.read(length)
        content = json.dumps(
            {
                "summary": "Flache, grüne Landschaft mit niederländisch wirkender Straßeninfrastruktur.",
                "observations": {},
                "countryAnalysis": {
                    "summary": "Die Kombination aus Landschaft, Leitpfosten und gelben Kennzeichen spricht am stärksten für die Niederlande.",
                    "imageClues": [
                        {
                            "category": "vegetation",
                            "observation": "Dichtes grünes Gras und einzelne Laubbäume neben der Fahrbahn.",
                            "confidence": 0.82,
                        },
                        {
                            "category": "bollards",
                            "observation": "Schmale weiße Leitpfosten mit dunklem Reflektorfeld.",
                            "confidence": 0.9,
                        },
                        {
                            "category": "landscape",
                            "observation": "Sehr flaches, offen landwirtschaftlich genutztes Gelände.",
                            "confidence": 0.88,
                        },
                        {
                            "category": "road",
                            "observation": "Weiße Fahrbahnlinien um ein grün wirkendes Mittelband.",
                            "confidence": 0.86,
                        },
                        {
                            "category": "signs",
                            "observation": "Europäische Schildformen sind am Straßenrand sichtbar.",
                            "confidence": 0.68,
                        },
                        {
                            "category": "plates",
                            "observation": "Vorn und hinten sind gelbe Kennzeichenflächen sichtbar.",
                            "confidence": 0.78,
                        },
                    ],
                    "bestGuess": {
                        "iso3": "NLD",
                        "country": "Niederlande",
                        "confidence": 0.91,
                        "reasons": ["Flaches Kulturland, Leitpfosten und gelbe Kennzeichen passen zusammen."],
                        "evidence": ["Gelbe Kennzeichen", "Grünes Mittelband", "Flache Landschaft"],
                        "evidenceCategories": ["plates", "road", "landscape"],
                    },
                    "likely": [
                        {
                            "iso3": "NLD",
                            "country": "Niederlande",
                            "confidence": 0.91,
                            "reasons": ["Flaches Kulturland, Leitpfosten und gelbe Kennzeichen passen zusammen."],
                            "evidence": ["Gelbe Kennzeichen", "Grünes Mittelband", "Flache Landschaft"],
                            "evidenceCategories": ["plates", "road", "landscape"],
                        }
                    ],
                    "possible": [
                        {
                            "iso3": "BEL",
                            "country": "Belgien",
                            "confidence": 0.56,
                            "reasons": ["Landschaft und Straßenbau wirken regional ähnlich, die Kennzeichen sprechen jedoch schwächer dafür."],
                            "evidence": ["Flache Landschaft", "Europäische Beschilderung"],
                            "evidenceCategories": ["landscape", "signs"],
                        }
                    ],
                    "excluded": [
                        {
                            "iso3": "ZAF",
                            "country": "Südafrika",
                            "confidence": 0.87,
                            "reasons": ["Die sichtbaren gelben Kennzeichen an beiden Fahrzeugseiten und die Infrastruktur widersprechen dem typischen Bild."],
                            "evidence": ["Gelbe Kennzeichen vorn und hinten", "Europäische Leitpfosten"],
                            "evidenceCategories": ["plates", "bollards"],
                        }
                    ],
                },
                "warnings": ["Vegetation und Landschaft allein wären nicht eindeutig; die Infrastruktur trägt die Einordnung."],
            },
            ensure_ascii=False,
        )
        body = json.dumps(
            {"choices": [{"message": {"content": content}}]},
            ensure_ascii=False,
        ).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, _format, *_args):
        return


if __name__ == "__main__":
    server = HTTPServer(("127.0.0.1", 43118), Handler)
    server.serve_forever()
