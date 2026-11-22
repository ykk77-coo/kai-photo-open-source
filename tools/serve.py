"""Run a localhost-only preview. No authentication, uploads or public exposure."""
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from functools import partial
import argparse
if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--port',type=int,default=8000);args=parser.parse_args()
 root=Path(__file__).resolve().parents[1]
 print(f'Preview http://127.0.0.1:{args.port}/index.html',flush=True)
 ThreadingHTTPServer(('127.0.0.1',args.port),partial(SimpleHTTPRequestHandler,directory=str(root))).serve_forever()
