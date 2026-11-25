#!/usr/bin/env python3
"""
Döp larmet — referensserver för röstsammanställningen.

    python3 server/tally.py            # http://localhost:8787
    PORT=9000 python3 server/tally.py

Bara stdlib. Två endpoints:

    GET  /tally         -> {"votes": {"fick": 148, ...}, "total": 406, "mine": null}
    POST /tally/vote    <- {"id": "fick", "voter": "<uuid>"}
                        -> {"votes": {...}, "total": 407, "mine": "fick"}

En röst per voter-id. Röstar samma voter igen flyttas rösten.
Röster persistas i server/data/votes.json (gitignored).

Produktion: använd server/worker.js mot Cloudflare KV, eller kör den här
bakom en reverse proxy. Den är medvetet liten – läs den innan du litar på den.
"""

import json
import os
import re
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

PORT = int(os.environ.get("PORT", "8787"))
ROOT = Path(__file__).resolve().parent
STORE = ROOT / "data" / "votes.json"
MAX_BODY = 4096
ID_RE = re.compile(r"^[a-z0-9][a-z0-9_-]{0,31}$")

# Valsedeln. Ska matcha assets/candidates.js.
BALLOT = {"fick", "skrik", "tjutet", "pelle", "lars", "lill"}

lock = threading.Lock()


def load():
    if not STORE.exists():
        return {"votes": {}, "voters": {}}
    try:
        with STORE.open(encoding="utf-8") as fh:
            data = json.load(fh)
        data.setdefault("votes", {})
        data.setdefault("voters", {})
        return data
    except (OSError, ValueError):
        return {"votes": {}, "voters": {}}


def save(data):
    STORE.parent.mkdir(parents=True, exist_ok=True)
    tmp = STORE.with_suffix(".tmp")
    with tmp.open("w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, separators=(",", ":"))
    tmp.replace(STORE)


def snapshot(data, voter=None):
    votes = {k: v for k, v in data["votes"].items()}
    return {
        "votes": votes,
        "total": sum(votes.values()),
        "mine": data["voters"].get(voter) if voter else None,
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "doplarmet/1.0"

    def log_message(self, fmt, *args):  # tystare logg
        if os.environ.get("VERBOSE"):
            super().log_message(fmt, *args)

    def _send(self, code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._send(204, {})

    def do_GET(self):
        if self.path.split("?")[0] != "/tally":
            return self._send(404, {"error": "not found"})
        voter = None
        if "voter=" in self.path:
            voter = self.path.split("voter=", 1)[1].split("&")[0]
        with lock:
            data = load()
        self._send(200, snapshot(data, voter))

    def do_POST(self):
        if self.path != "/tally/vote":
            return self._send(404, {"error": "not found"})

        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            return self._send(400, {"error": "bad length"})
        if length <= 0 or length > MAX_BODY:
            return self._send(400, {"error": "bad body"})

        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            return self._send(400, {"error": "bad json"})

        ballot_id = str(payload.get("id", ""))
        voter = str(payload.get("voter", ""))[:64]

        if ballot_id not in BALLOT:
            return self._send(400, {"error": "unknown id"})
        if not ID_RE.match(voter) and len(voter) < 8:
            return self._send(400, {"error": "bad voter"})

        with lock:
            data = load()
            previous = data["voters"].get(voter)
            if previous and previous != ballot_id:
                data["votes"][previous] = max(0, data["votes"].get(previous, 0) - 1)
            if previous != ballot_id:
                data["votes"][ballot_id] = data["votes"].get(ballot_id, 0) + 1
            data["voters"][voter] = ballot_id
            save(data)
            result = snapshot(data, voter)

        self._send(200, result)


if __name__ == "__main__":
    print(f"doplarmet tally  →  http://localhost:{PORT}/tally")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
