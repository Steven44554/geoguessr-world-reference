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
                "summary": "Weiße Mittellinie und ein gelbes Kennzeichen sind sichtbar.",
                "observations": {
                    "centerColor": {
                        "value": "white",
                        "confidence": 0.93,
                        "evidence": "Weiße Linie in der Fahrbahnmitte",
                    },
                    "plateColor": {
                        "value": "yellow",
                        "confidence": 0.42,
                        "evidence": "Entferntes gelbes Kennzeichen",
                    },
                },
                "warnings": ["Kennzeichen ist nur klein sichtbar."],
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
