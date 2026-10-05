"""Servidor local que imita GitHub Pages: sirve site/ bajo la ruta de SITE_URL.

Uso:  python tools/servidor.py [puerto]
Luego abre http://localhost:8734/el-patio-beach-club/
"""
import http.server
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
cfg = (ROOT / "assets" / "js" / "config.js").read_text(encoding="utf-8")
BASE = urlparse(re.search(r'"SITE_URL":\s*"([^"]+)"', cfg).group(1)).path.rstrip("/")


class Manejador(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=str(SITE), **k)

    def translate_path(self, path):
        ruta = urlparse(path).path
        if BASE and ruta.startswith(BASE):
            ruta = ruta[len(BASE):] or "/"
        return super().translate_path(ruta)

    def send_head(self):
        ruta = Path(self.translate_path(self.path))
        if not ruta.exists():
            self.send_response(404)
            cuerpo = (SITE / "404.html").read_bytes()
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(cuerpo)))
            self.end_headers()
            self.wfile.write(cuerpo)
            return None
        return super().send_head()


if __name__ == "__main__":
    puerto = int(sys.argv[1]) if len(sys.argv) > 1 else 8734
    print(f"Sirviendo en http://localhost:{puerto}{BASE}/")
    http.server.ThreadingHTTPServer(("127.0.0.1", puerto), Manejador).serve_forever()
