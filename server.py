#!/usr/bin/env python3
"""在本机启动离线网页，不上传任何数据。"""

from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os
import socket
import threading
import webbrowser


ROOT = Path(__file__).resolve().parent


def available_port(start=8000, end=8010):
    for port in range(start, end + 1):
        with socket.socket() as probe:
            try:
                probe.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    raise RuntimeError("8000—8010 端口均被占用，请先关闭其他本地网页服务。")


if __name__ == "__main__":
    os.chdir(ROOT)
    port = available_port()
    address = f"http://127.0.0.1:{port}/index.html"
    server = ThreadingHTTPServer(("127.0.0.1", port), SimpleHTTPRequestHandler)
    print("北京市家校沟通与投诉规范平台（离线版）")
    print(f"网页地址：{address}")
    print("按 Ctrl+C 可停止运行。所有演示记录只保存在当前浏览器中。")
    threading.Timer(0.8, lambda: webbrowser.open(address)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n本地服务已停止。")
    finally:
        server.server_close()
