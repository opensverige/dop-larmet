/* ==========================================================================
   Döp larmet — assets/tally.js
   Röstsammanställning med två lägen:

     demo  – allt i localStorage, inga anrop, fungerar från file://
     api   – GET {api}/tally  och  POST {api}/tally/vote

   Båda lägena ger samma form: { votes: {[id]: n}, total: n, mine: id|null }

   En röst per webbläsare. Röstar du igen flyttas rösten, den adderas inte.
   ========================================================================== */

window.createTally = function createTally(options) {
  var api = (options && options.api) || "";
  var onSeed = (options && options.seedVotes) || {};
  var KEY = "doplarmet.v1";

  /* ---------- lokal lagring ---------- */

  function readLocal() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || "null");
      if (raw && typeof raw === "object") {
        return {
          votes: raw.votes || {},
          mine: raw.mine || null,
          voter: raw.voter || newId()
        };
      }
    } catch (e) { /* privat läge, kvot, trasig JSON – kör vidare */ }
    return { votes: {}, mine: null, voter: newId() };
  }

  function writeLocal(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  function newId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "v" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  function combine(personal) {
    var votes = {};
    var total = 0;
    Object.keys(onSeed).forEach(function (id) {
      votes[id] = onSeed[id] || 0;
      total += votes[id];
    });
    Object.keys(personal.votes).forEach(function (id) {
      votes[id] = (votes[id] || 0) + personal.votes[id];
      total += personal.votes[id];
    });
    return { votes: votes, total: total, mine: personal.mine };
  }

  /* ---------- api ---------- */

  function request(path, body) {
    var init = { method: body ? "POST" : "GET", credentials: "omit" };
    if (body) {
      init.headers = { "Content-Type": "application/json" };
      init.body = JSON.stringify(body);
    }
    return fetch(api + path, init).then(function (res) {
      if (!res.ok) throw new Error("tally: HTTP " + res.status);
      return res.json();
    });
  }

  /* ---------- publikt ---------- */

  var local = readLocal();
  var voted = false;

  return {
    mode: api ? "api" : "demo",

    get: function () {
      if (!api) return Promise.resolve(combine(local));
      return request("/tally", null).catch(function () {
        // Nätet ligger nere? Visa det vi har istället för att visa noll.
        return combine(local);
      });
    },

    vote: function (id) {
      if (!api) {
        if (local.mine && local.votes[local.mine]) {
          local.votes[local.mine] = Math.max(0, local.votes[local.mine] - 1);
        }
        local.votes[id] = (local.votes[id] || 0) + 1;
        local.mine = id;
        writeLocal(local);
        return Promise.resolve(combine(local));
      }

      return request("/tally/vote", { id: id, voter: local.voter }).then(function (data) {
        local.mine = id;
        writeLocal(local);
        return data;
      }).catch(function () {
        return combine(local);
      });
    },

    hasVoted: function () { return !!local.mine; },
    voterId: function () { return local.voter; }
  };
};
