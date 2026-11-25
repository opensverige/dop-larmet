/* ==========================================================================
   Döp larmet — assets/app.js
   Tre akter, styrd av klockan. Inga beroenden, inga anrop i larmögonblicket.

     poll      fram till 2026-12-07 15:00:00  – röstning
     alarm     15:00:00 → 15:05:00             – helskärm, nedräkning
     clear     15:05 → midnatt                 – vinnaren avslöjas
     archive   efteråt                         – samma sida, utan klocka

   Förhandsvisa: ?act=alarm | ?act=clear | ?act=poll
   ========================================================================== */

(function () {
  "use strict";

  var CFG = window.DOPLARMET_CONFIG || {};
  var CANDIDATES = window.DOPLARMET_CANDIDATES || [];

  // Larmet: måndag 7 december 2026 kl 15:00 svensk tid.
  var T0 = Date.parse("2026-12-07T15:00:00+01:00");
  var T1 = T0 + 5 * 60 * 1000;          // "Faran över"
  var T_ARCHIVE = T1 + 24 * 60 * 60 * 1000;

  var $ = function (id) { return document.getElementById(id); };
  var pad = function (n) { return String(Math.max(0, n)).padStart(2, "0"); };

  var params = new URLSearchParams(location.search);
  var forcedAct = params.get("act");
  var act = null;
  var lastTally = { votes: {}, total: 0, mine: null };
  var previewAlarmTimer = null;

  var tally = window.createTally({
    api: CFG.api,
    seedVotes: CANDIDATES.reduce(function (acc, c) {
      acc[c.id] = c.seed || 0;
      return acc;
    }, {})
  });

  /* ------------------------------------------------------------------ akt */

  function actFor(now) {
    if (forcedAct && ["poll", "alarm", "clear", "archive"].indexOf(forcedAct) !== -1) {
      return forcedAct;
    }
    if (now < T0) return "poll";
    if (now < T1) return "alarm";
    if (now < T_ARCHIVE) return "clear";
    return "archive";
  }

  function setAct(next) {
    if (next === act) return;
    act = next;
    document.body.setAttribute("data-act", act);

    if (act === "alarm") {
      openAlarm();
    } else {
      closeAlarm();
    }
    if (act === "clear" || act === "archive") {
      renderResult();
    }
  }

  /* -------------------------------------------------------------- klockan */

  function tick() {
    var now = Date.now();
    var diff = T0 - now;
    setAct(actFor(now));

    var d = Math.floor(Math.abs(diff) / 86400000);
    var h = Math.floor(Math.abs(diff) / 3600000) % 24;
    var m = Math.floor(Math.abs(diff) / 60000) % 60;
    var s = Math.floor(Math.abs(diff) / 1000) % 60;

    if ($("cd-d")) {
      $("cd-d").textContent = d;
      $("cd-h").textContent = pad(h);
      $("cd-m").textContent = pad(m);
      $("cd-s").textContent = pad(s);
    }
    if ($("topcount")) {
      $("topcount").textContent = (act === "clear" || act === "archive" || diff <= 0)
        ? "larmet har gått"
        : "T–" + d + " dagar";
    }

    if (act === "alarm" && !previewAlarmTimer) {
      updateAlarmCount(T1 - now);
    }
    if (act === "poll" && now > T0 - 60 * 1000) {
      $("pollStatus").textContent = "röstning stänger";
      lockBoard(true);
    }
  }

  /* --------------------------------------------------------------- valsedel */

  function lockBoard(locked) {
    var opts = document.querySelectorAll("#board .opt");
    for (var i = 0; i < opts.length; i++) {
      opts[i].classList.toggle("locked", locked);
      opts[i].disabled = locked;
    }
    var form = $("suggestForm");
    if (form) form.style.display = locked ? "none" : "flex";
  }

  function renderBoard(tallyData) {
    lastTally = tallyData;
    var board = $("board");
    if (!board) return;

    var votes = tallyData.votes || {};
    var total = tallyData.total || 0;
    var mine = tallyData.mine || null;
    var max = 1;

    CANDIDATES.forEach(function (c) { max = Math.max(max, votes[c.id] || 0); });

    board.innerHTML = "";
    CANDIDATES.forEach(function (c) {
      var n = votes[c.id] || 0;
      var pct = total ? Math.round((n / total) * 100) : 0;

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "opt" + (mine === c.id ? " mine" : "");
      btn.setAttribute("aria-pressed", mine === c.id ? "true" : "false");
      btn.innerHTML =
        '<span class="bar" style="width:' + ((n / max) * 100) + '%"></span>' +
        '<span class="name">' + esc(c.name) +
          (c.note ? '<small>' + esc(c.note) + '</small>' : "") +
        '</span>' +
        '<span class="pct">' + pct + '&nbsp;%</span>';

      btn.addEventListener("click", function () {
        if (act !== "poll") return;
        btn.disabled = true;
        tally.vote(c.id).then(renderBoard);
      });

      board.appendChild(btn);
    });

    if ($("note")) {
      $("note").innerHTML = (tally.mode === "demo")
        ? "Demoläge: rösterna sparas bara i din webbläsare. " +
          '<a href="' + esc(CFG.discord || "#") + '" target="_blank" rel="noopener">Diskutera i Discord</a>.'
        : total + " röster · en röst per webbläsare · " +
          '<a href="' + esc(CFG.discord || "#") + '" target="_blank" rel="noopener">Diskutera i Discord</a>';
    }
  }

  function refresh() {
    tally.get().then(renderBoard);
  }

  /* -------------------------------------------------------------- förslag */

  var SUGGEST_KEY = "doplarmet.suggestions.v1";

  function readSuggestions() {
    try { return JSON.parse(localStorage.getItem(SUGGEST_KEY) || "[]") || []; }
    catch (e) { return []; }
  }

  function renderSuggestions() {
    var list = readSuggestions();
    var box = $("ownSuggestions");
    if (!box) {
      box = document.createElement("div");
      box.id = "ownSuggestions";
      box.className = "own-suggestions";
      $("suggestForm").insertAdjacentElement("afterend", box);
    }
    box.innerHTML = list.length
      ? '<p class="note mono">Dina förslag (bara här): ' + list.map(function (s) {
          return '<span class="chip">' + esc(s) + '</span>';
        }).join(" ") + '</p>'
      : "";
  }

  function bindSuggest() {
    var form = $("suggestForm");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = $("suggestInput");
      var name = input.value.trim().replace(/\s+/g, " ").slice(0, 28);
      if (!name) return;
      var list = readSuggestions();
      if (list.indexOf(name) === -1) list.push(name);
      try { localStorage.setItem(SUGGEST_KEY, JSON.stringify(list)); } catch (err) {}
      input.value = "";
      renderSuggestions();
    });
    renderSuggestions();
  }

  /* ---------------------------------------------------------------- larmet */

  function openAlarm() {
    var el = $("alarm");
    if (!el) return;
    el.hidden = false;
    document.body.style.overflow = "hidden";

    if (forcedAct === "alarm") {
      // Förhandsvisning: 5 minuter blir 15 sekunder.
      var left = 15;
      clearInterval(previewAlarmTimer);
      updateAlarmCount(left * 1000);
      previewAlarmTimer = setInterval(function () {
        left -= 1;
        updateAlarmCount(left * 1000);
        if (left <= 0) {
          clearInterval(previewAlarmTimer);
          previewAlarmTimer = null;
          forcedAct = "clear";
          setAct("clear");
        }
      }, 1000);
    }
  }

  function closeAlarm() {
    var el = $("alarm");
    if (el) el.hidden = true;
    document.body.style.overflow = "";
    if (previewAlarmTimer) { clearInterval(previewAlarmTimer); previewAlarmTimer = null; }
  }

  function updateAlarmCount(msLeft) {
    var el = $("alarmCount");
    if (!el) return;
    var total = Math.max(0, Math.ceil(msLeft / 1000));
    el.textContent = pad(Math.floor(total / 60)) + ":" + pad(total % 60);
  }

  /* --------------------------------------------------------------- faran över */

  function renderResult() {
    tally.get().then(function (data) {
      var winner = CANDIDATES.slice().sort(function (a, b) {
        return (data.votes[b.id] || 0) - (data.votes[a.id] || 0);
      })[0];

      var n = data.votes[winner.id] || 0;
      var pct = data.total ? Math.round((n / data.total) * 100) : 0;

      if ($("winner")) $("winner").textContent = winner.name;
      if ($("resultMeta")) {
        $("resultMeta").textContent = pct + " % · " + n + " av " + data.total + " röster";
      }
      if ($("clearKicker")) {
        $("clearKicker").textContent = act === "archive"
          ? "ARKIV · 7 DECEMBER 2026"
          : "15:05 · FARAN ÖVER";
      }
    });
  }

  function bindShare() {
    var btn = $("shareBtn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var name = $("winner").textContent;
      var url = "https://" + (CFG.site || location.host);
      var text = "Sveriges nya larm heter " + name + ". 10 miljoner telefoner, samma sekund.";

      if (navigator.share) {
        navigator.share({ title: "Döp larmet", text: text, url: url }).catch(function () {});
        return;
      }
      var copy = text + " " + url;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(copy).then(function () {
          btn.textContent = "Kopierat";
          setTimeout(function () { btn.textContent = "Dela"; }, 1600);
        });
      }
    });
  }

  /* ------------------------------------------------------------------ start */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  bindSuggest();
  bindShare();

  // Förhandsvisning av larmet – bara i demoläge, innan servern är inkopplad.
  var demoBtn = $("demoBtn");
  if (demoBtn && tally.mode === "demo") {
    demoBtn.hidden = false;
    demoBtn.addEventListener("click", function () {
      forcedAct = "alarm";
      setAct("alarm");
    });
  }
  refresh();
  tick();
  setInterval(tick, 1000);
})();
