/**
 * Döp larmet — Cloudflare Worker + Durable Object
 *
 * Varför Durable Object och inte KV: en räknare som ska vara exakt får inte
 * tappa uppdateringar. En DO-instans serialiserar alla anrop, så två röster
 * i samma millisekund kan inte skriva över varandra.
 *
 *   GET  /tally?voter=<id>
 *   POST /tally/vote   {"id":"fick","voter":"<id>"}
 *
 * Deployment: se README. Bindningen heter TALLY och pekar på klassen Tally.
 */

const BALLOT = new Set(["fick", "skrik", "tjutet", "pelle", "lars", "lill"]);
const ALLOWED_ORIGIN = "*"; // sätt till "https://doplarmet.se" i drift

const CORS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Cache-Control": "no-store"
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS }
  });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

    if (url.pathname === "/tally" && request.method === "GET") {
      const voter = url.searchParams.get("voter") || "";
      return stub(env).fetch(`https://tally/?voter=${encodeURIComponent(voter)}`);
    }

    if (url.pathname === "/tally/vote" && request.method === "POST") {
      const raw = await request.text();
      if (raw.length > 4096) return json({ error: "body too large" }, 413);

      let body;
      try { body = JSON.parse(raw); } catch { return json({ error: "bad json" }, 400); }

      const id = String(body.id || "");
      const voter = String(body.voter || "").slice(0, 64);

      if (!BALLOT.has(id)) return json({ error: "unknown id" }, 400);
      if (voter.length < 8) return json({ error: "bad voter" }, 400);

      return stub(env).fetch("https://tally/vote", {
        method: "POST",
        body: JSON.stringify({ id, voter })
      });
    }

    return json({ error: "not found" }, 404);
  }
};

function stub(env) {
  return env.TALLY.get(env.TALLY.idFromName("sweden"));
}

export class Tally {
  constructor(state) {
    this.state = state;
    this.votes = null;
    this.voters = null;
  }

  async load() {
    if (!this.votes) {
      this.votes = (await this.state.storage.get("votes")) || {};
      this.voters = (await this.state.storage.get("voters")) || {};
    }
  }

  async save() {
    await this.state.storage.put("votes", this.votes);
    await this.state.storage.put("voters", this.voters);
  }

  snapshot(voter) {
    return {
      votes: this.votes,
      total: Object.values(this.votes).reduce((a, b) => a + b, 0),
      mine: voter ? this.voters[voter] || null : null
    };
  }

  async fetch(request) {
    await this.load();
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return json(this.snapshot(url.searchParams.get("voter")));
    }

    if (url.pathname === "/vote" && request.method === "POST") {
      const { id, voter } = await request.json();
      const previous = this.voters[voter];

      if (previous && previous !== id) {
        this.votes[previous] = Math.max(0, (this.votes[previous] || 0) - 1);
      }
      if (previous !== id) {
        this.votes[id] = (this.votes[id] || 0) + 1;
        this.voters[voter] = id;
      }

      await this.save();
      return json(this.snapshot(voter));
    }

    return json({ error: "not found" }, 404);
  }
}
