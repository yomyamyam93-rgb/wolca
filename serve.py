# -*- coding: utf-8 -*-
# 개발용 서버 — 캐시를 금지해서 저장하면 바로 새 화면이 보이게 한다
import http.server, socketserver

class 손님맞이(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()
    def log_message(self, *a):
        pass

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(('', 8778), 손님맞이) as 서버:
    print('http://127.0.0.1:8778 (캐시 없음)')
    서버.serve_forever()
