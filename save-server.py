# Dev helper: receives canvas exports from the browser and writes them to assets/
# Usage: python save-server.py   (listens on 127.0.0.1:3100, POST /save/<filename>)
import http.server, os, base64

PORT = 3100
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets')

class Handler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            name = self.path.strip('/').split('?')[0].split('/')[-1]
            if not name:
                self.send_response(400); self.end_headers(); return
            if body.startswith(b'data:image'):
                body = base64.b64decode(body.split(b',', 1)[1])
            with open(os.path.join(OUT, name), 'wb') as f:
                f.write(body)
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'ok:' + name.encode())
        except Exception as e:
            self.send_response(500); self.end_headers()
            self.wfile.write(str(e).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def log_message(self, *args):
        pass

print('save-server on http://127.0.0.1:%d (writes to assets/)' % PORT)
http.server.HTTPServer(('127.0.0.1', PORT), Handler).serve_forever()
