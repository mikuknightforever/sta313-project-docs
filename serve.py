"""本地预览服务器：浏览器每次都读取最新文件 / Local preview server: the browser always gets the latest files.

用法 / Usage:
    python serve.py          # http://localhost:8000/
    python serve.py 8001     # 换一个端口 / use another port

和 `python -m http.server 8000` 一样，从本文件所在的仓库根目录提供文件（在哪个目录运行都可以），
只是每个响应都带 `Cache-Control: no-store`，所以 `git pull` 之后普通刷新就能看到最新版本。
Like `python -m http.server 8000`, serving the repository root (where this file lives, whatever the
current directory), but every response carries `Cache-Control: no-store`, so a normal refresh after
`git pull` shows the latest version.

只用 Python 标准库，需要 Python 3.7+。/ Standard library only; Python 3.7+.
"""
import argparse
import functools
import http.server
import pathlib
import socket
import sys

ROOT = pathlib.Path(__file__).resolve().parent


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()


class Server(http.server.ThreadingHTTPServer):
    # 与 `python -m http.server` 相同：IPv6 + IPv4 双栈 / dual-stack, like `python -m http.server`
    address_family = socket.AF_INET6
    # Windows 上 SO_REUSEADDR 会让两个服务器同时占用同一端口，所以关掉，端口被占用时直接报错
    # On Windows, SO_REUSEADDR lets two servers share a port, so turn it off and fail loudly instead
    allow_reuse_address = sys.platform != "win32"

    def server_bind(self):
        try:
            self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        except (AttributeError, OSError):
            pass
        super().server_bind()


def main():
    parser = argparse.ArgumentParser(description="Serve the repository with caching disabled.")
    parser.add_argument("port", nargs="?", type=int, default=8000, help="port (default 8000)")
    args = parser.parse_args()

    handler = functools.partial(NoCacheHandler, directory=str(ROOT))
    try:
        httpd = Server(("::", args.port), handler)
    except OSError as err:
        sys.exit(
            f"端口 {args.port} 已被占用（{err}）。先在原来的终端按 Ctrl+C 关掉正在运行的服务器"
            f"（例如 `python -m http.server`），或换一个端口：python serve.py {args.port + 1}\n"
            f"Port {args.port} is in use ({err}). Stop the running server with Ctrl+C, "
            f"or pick another port: python serve.py {args.port + 1}"
        )

    print(f"Serving {ROOT}")
    print(f"Open http://localhost:{args.port}/  (caching disabled; Ctrl+C to stop)")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()
