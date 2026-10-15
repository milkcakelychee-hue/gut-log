# เซิร์ฟเวอร์ทดสอบในเครื่อง: ปิด cache เพื่อให้เห็นโค้ดล่าสุดทุกครั้ง
import functools, http.server, sys
class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
root = sys.argv[1]
http.server.ThreadingHTTPServer(('127.0.0.1', 5173), functools.partial(NoCache, directory=root)).serve_forever()
