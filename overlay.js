/*
 * Placar da Live — motor do overlay.
 *
 * Voce nao precisa editar este arquivo. Tudo que muda no dia a dia
 * (times, pontos, presentes, cores) esta em config.js.
 *
 * Fluxo: TikTok LIVE -> TikFinity -> WebSocket local -> este arquivo.
 */

(function () {
  "use strict";

  var CFG = window.CONFIG || {};
  var STORAGE_KEY = "placar-live:v1";
  var MAX_SEEN_IDS = 400;

  var params = new URLSearchParams(location.search);
  var isDemo = params.has("demo");
  var showBg = params.has("fundo");
  var forceReset = params.has("reset");
  // ?flip=0 troca o deslizar dos times por uma troca seca de posicao.
  // Serve pra gravar video quadro a quadro sem pegar meia animacao.
  var flipEnabled = params.get("flip") !== "0";

  var els = {
    body: document.body,
    board: document.getElementById("board"),
    title: document.getElementById("title"),
    teams: document.getElementById("teams"),
    status: document.getElementById("status"),
    statusText: document.getElementById("status-text"),
    demoBar: document.getElementById("demo-bar"),
  };

  /* ------------------------------------------------------------------
   * Estado
   * ---------------------------------------------------------------- */

  var teams = (CFG.teams || []).map(function (t) {
    return {
      id: Number(t.id),
      name: String(t.name || ""),
      color: t.color || "#888888",
      initials: t.initials || String(t.name || "?").slice(0, 2).toUpperCase(),
      badge: t.badge || "",
    };
  });

  var teamById = {};
  teams.forEach(function (t) { teamById[t.id] = t; });

  var scores = {};
  var choices = {};          // uniqueId -> { t: idDoTime, at: timestamp }
  var seenIds = [];
  var seenSet = Object.create(null);
  var rows = {};             // idDoTime -> { el, score, gain, sender, ... }
  var senderTimers = {};

  teams.forEach(function (t) { scores[t.id] = 0; });

  /* ------------------------------------------------------------------
   * Persistencia
   *
   * O placar tem que sobreviver a um "atualizar" da fonte no meio da
   * live. Por isso ele grava a cada ponto no localStorage do proprio
   * navegador embutido do LIVE Studio.
   * ---------------------------------------------------------------- */

  function signature() {
    return teams.map(function (t) { return t.id + ":" + t.name; }).join("|");
  }

  function load() {
    if (CFG.resetOnLoad || forceReset) { save(); return; }
    var raw;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { return; }
    if (!raw) return;
    var data;
    try { data = JSON.parse(raw); } catch (e) { return; }
    // Mudou a lista de times no config? O placar antigo nao vale mais.
    if (!data || data.sig !== signature()) return;
    teams.forEach(function (t) {
      var v = data.scores && data.scores[t.id];
      scores[t.id] = typeof v === "number" && isFinite(v) ? v : 0;
    });
    if (data.choices) choices = data.choices;
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        v: 1,
        sig: signature(),
        scores: scores,
        choices: choices,
        savedAt: Date.now(),
      }));
    } catch (e) { /* modo privado: segue sem gravar */ }
  }

  function resetScores() {
    teams.forEach(function (t) { scores[t.id] = 0; });
    choices = {};
    save();
    render({ animate: true });
  }

  /* ------------------------------------------------------------------
   * Desenho da tela
   * ---------------------------------------------------------------- */

  function buildRows() {
    els.title.textContent = CFG.title || "";
    els.board.style.setProperty("--scale", CFG.scale || 1);
    if (showBg) els.body.classList.add("with-bg");
    if (CFG.showBars === false) els.body.classList.add("no-bars");

    teams.forEach(function (t) {
      var el = document.createElement("div");
      el.className = "team";
      el.style.setProperty("--team-color", t.color);

      var badge = document.createElement("div");
      badge.className = "badge";
      if (t.badge) {
        var img = document.createElement("img");
        img.src = t.badge;
        img.alt = "";
        // Escudo que nao carrega vira as iniciais, em vez de um buraco.
        img.onerror = function () { badge.textContent = t.initials; };
        badge.appendChild(img);
      } else {
        badge.textContent = t.initials;
      }

      var wrap = document.createElement("div");
      wrap.className = "name-wrap";
      var name = document.createElement("div");
      name.className = "name";
      name.textContent = t.name;
      var sender = document.createElement("div");
      sender.className = "sender";
      wrap.appendChild(name);
      if (CFG.showSender !== false) wrap.appendChild(sender);

      var score = document.createElement("div");
      score.className = "score";
      score.textContent = "0";

      el.appendChild(badge);
      el.appendChild(wrap);
      el.appendChild(score);
      els.teams.appendChild(el);

      rows[t.id] = { el: el, scoreEl: score, nameEl: name, senderEl: sender };
    });
  }

  function render(opts) {
    opts = opts || {};
    var order = teams.slice();
    if (CFG.sortByScore !== false) {
      order.sort(function (a, b) {
        return (scores[b.id] - scores[a.id]) || (a.id - b.id);
      });
    }

    var max = Math.max.apply(null, teams.map(function (t) { return scores[t.id]; }));
    var lead = max > 0 ? max : 0;

    // FLIP: mede antes de mexer no DOM, mede depois, e anima a diferenca.
    var before = {};
    teams.forEach(function (t) { before[t.id] = rows[t.id].el.getBoundingClientRect().top; });

    order.forEach(function (t) { els.teams.appendChild(rows[t.id].el); });

    teams.forEach(function (t) {
      var r = rows[t.id];
      var v = scores[t.id];
      r.scoreEl.textContent = formatNumber(v);
      r.el.style.setProperty("--fill", lead > 0 ? (v / lead * 100) + "%" : "0%");
      r.el.classList.toggle("leader", lead > 0 && v === lead);

      if (opts.animate !== false && flipEnabled) {
        var delta = before[t.id] - r.el.getBoundingClientRect().top;
        if (delta) {
          r.el.style.transition = "none";
          r.el.style.transform = "translateY(" + delta + "px)";
          // forca o navegador a aplicar o estado acima antes de animar
          void r.el.offsetHeight;
          r.el.style.transition = "transform 480ms cubic-bezier(0.22,1,0.36,1)";
          r.el.style.transform = "";
        }
      }
    });
  }

  function formatNumber(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function celebrate(teamId, points, effect, senderName) {
    var r = rows[teamId];
    if (!r) return;

    if (effect) {
      var cls = "fx-" + effect;
      r.el.classList.remove(cls);
      void r.el.offsetHeight;
      r.el.classList.add(cls);
      setTimeout(function () { r.el.classList.remove(cls); }, 1200);
    }

    var gain = document.createElement("div");
    gain.className = "gain";
    gain.textContent = "+" + formatNumber(points);
    r.el.appendChild(gain);
    setTimeout(function () { gain.remove(); }, 1200);

    if (CFG.showSender !== false && senderName) {
      r.senderEl.textContent = senderName + "  +" + formatNumber(points);
      r.senderEl.classList.add("on");
      clearTimeout(senderTimers[teamId]);
      senderTimers[teamId] = setTimeout(function () {
        r.senderEl.classList.remove("on");
      }, 3000);
    }
  }

  function addPoints(teamId, points, effect, senderName) {
    if (!teamById[teamId] || !points) return;
    scores[teamId] += points;
    save();
    render();
    celebrate(teamId, points, effect, senderName);
  }

  /* ------------------------------------------------------------------
   * Interpretacao dos eventos
   * ---------------------------------------------------------------- */

  function normalize(str) {
    return String(str || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  }

  function alreadySeen(id) {
    if (!id) return false;
    if (seenSet[id]) return true;
    seenSet[id] = true;
    seenIds.push(id);
    if (seenIds.length > MAX_SEEN_IDS) delete seenSet[seenIds.shift()];
    return false;
  }

  // "3", "!3", "time 3", "#3" ou o proprio nome do time.
  function parseTeamChoice(comment) {
    var raw = normalize(comment).replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    if (!raw) return null;

    var m = raw.match(/^(?:time\s*|t\s*)?(\d{1,2})$/);
    if (m) {
      var id = Number(m[1]);
      return teamById[id] ? id : null;
    }
    for (var i = 0; i < teams.length; i++) {
      if (normalize(teams[i].name) === raw) return teams[i].id;
    }
    return null;
  }

  function chosenTeam(uniqueId) {
    var c = choices[uniqueId];
    if (!c) return null;
    var minutes = Number(CFG.choiceExpiryMinutes) || 0;
    if (minutes > 0 && Date.now() - c.at > minutes * 60000) {
      delete choices[uniqueId];
      return null;
    }
    return teamById[c.t] ? c.t : null;
  }

  function giftConfig(giftName) {
    var table = CFG.gifts || {};
    var key = normalize(giftName);
    if (Object.prototype.hasOwnProperty.call(table, key)) return table[key];
    for (var k in table) {
      if (normalize(k) === key) return table[k];
    }
    return null;
  }

  function pointsFor(conf, data) {
    if (conf) return Number(conf.points) || 0;
    var rule = CFG.unknownGift || "ignore";
    if (rule === "ignore") return 0;
    if (rule === "diamond") {
      var d = Number(data.diamondCount);
      if (isFinite(d) && d > 0) return d * (Number(CFG.diamondRate) || 1);
      return Number(CFG.unknownGiftPoints) || 0;
    }
    return Number(CFG.unknownGiftPoints) || 0;
  }

  function handleChat(data) {
    var uniqueId = data.uniqueId || data.userId;
    var comment = data.comment || data.message || "";
    if (!uniqueId) return;

    if (normalize(comment) === "!zerar") {
      var owners = (CFG.owners || []).map(normalize);
      if (owners.indexOf(normalize(uniqueId)) !== -1) resetScores();
      return;
    }

    var teamId = parseTeamChoice(comment);
    if (teamId) {
      choices[uniqueId] = { t: teamId, at: Date.now() };
      save();
    }
  }

  function handleGift(data) {
    // A TikTok manda varios eventos enquanto a pessoa segura o presente
    // (o "combo"). Contar todos multiplica o placar por 5, 10, 20.
    // So vale o evento final da sequencia.
    var streakable = data.giftType === 1 || data.giftType === undefined;
    if (streakable && data.repeatEnd === false) return;

    if (alreadySeen(data.msgId)) return;

    var conf = giftConfig(data.giftName || data.gift_name);
    var unit = pointsFor(conf, data);
    if (!unit) return;

    var count = Number(data.repeatCount);
    if (!isFinite(count) || count < 1) count = 1;

    var mode = CFG.mode || "chat";
    var uniqueId = data.uniqueId || data.userId;
    var teamId = null;

    if (mode === "gift") {
      teamId = conf && Number(conf.team) ? Number(conf.team) : null;
    } else if (mode === "both") {
      teamId = (conf && Number(conf.team)) ? Number(conf.team) : chosenTeam(uniqueId);
    } else {
      teamId = chosenTeam(uniqueId);
    }

    // Ninguem escolheu time: o presente nao pontua, mas tambem nao
    // trava a live. O modo "gift" evita isso por completo.
    if (!teamId || !teamById[teamId]) return;

    addPoints(
      teamId,
      unit * count,
      conf && conf.effect ? conf.effect : "",
      data.nickname || uniqueId
    );
  }

  function handleEvent(msg) {
    if (!msg || typeof msg !== "object") return;
    var type = normalize(msg.event || msg.type);
    var data = msg.data || msg;
    if (type === "gift") handleGift(data);
    else if (type === "chat" || type === "comment") handleChat(data);
  }

  /* ------------------------------------------------------------------
   * Conexao com o TikFinity
   * ---------------------------------------------------------------- */

  var ws = null;
  var retry = 0;
  var retryTimer = null;

  function setStatus(connected, text) {
    els.status.hidden = connected;
    els.statusText.textContent = text || "";
  }

  function connect() {
    if (isDemo) return;
    var url = CFG.tikfinityUrl || "ws://localhost:21213/";

    try { ws = new WebSocket(url); }
    catch (e) { scheduleReconnect(); return; }

    ws.onopen = function () {
      retry = 0;
      setStatus(true);
    };

    ws.onmessage = function (ev) {
      var msg;
      try { msg = JSON.parse(ev.data); } catch (e) { return; }
      handleEvent(msg);
    };

    ws.onclose = function () { scheduleReconnect(); };

    ws.onerror = function () {
      try { ws.close(); } catch (e) { /* ja fechou */ }
    };
  }

  function scheduleReconnect() {
    setStatus(false, "TikFinity fora do ar — reconectando");
    clearTimeout(retryTimer);
    retry += 1;
    var wait = Math.min(1000 * Math.pow(1.6, retry), 10000);
    retryTimer = setTimeout(connect, wait);
  }

  /* ------------------------------------------------------------------
   * Modo demonstracao (?demo=1) — para gravar video sem live aberta
   * ---------------------------------------------------------------- */

  var demoTimer = null;
  var DEMO_NAMES = [
    "carlinhos", "ju_torcedora", "pedro.h", "mari", "zeca",
    "torcida_fiel", "bia", "rafa10", "dona_ines", "gustavo",
  ];

  // ?seed=123 deixa a demonstracao sempre igual — e o que permite gravar
  // o GIF quadro a quadro sem a sequencia mudar entre um quadro e outro.
  var rand = Math.random;
  if (params.has("seed")) {
    var s = (Number(params.get("seed")) || 1) >>> 0;
    rand = function () {
      s = (s + 0x6d2b79f5) >>> 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function demoTick() {
    var names = Object.keys(CFG.gifts || {});
    if (!names.length || !teams.length) return;
    var giftName = names[Math.floor(rand() * names.length)];
    var conf = CFG.gifts[giftName];
    var team = teams[Math.floor(rand() * teams.length)];
    var count = rand() < 0.25 ? 1 + Math.floor(rand() * 4) : 1;
    addPoints(
      team.id,
      (Number(conf.points) || 1) * count,
      conf.effect || "",
      DEMO_NAMES[Math.floor(rand() * DEMO_NAMES.length)]
    );
    demoTimer = setTimeout(demoTick, 500 + rand() * 1400);
  }

  function startDemo() { clearTimeout(demoTimer); demoTick(); }
  function stopDemo() { clearTimeout(demoTimer); demoTimer = null; }

  function setupDemo() {
    // ?limpo=1 esconde os botoes, pra gravar video sem eles na tela
    els.demoBar.hidden = params.has("limpo");
    els.demoBar.addEventListener("click", function (ev) {
      var action = ev.target.getAttribute("data-demo");
      if (action === "start") startDemo();
      if (action === "stop") stopDemo();
      if (action === "reset") { stopDemo(); resetScores(); }
    });
    startDemo();
  }

  /* ------------------------------------------------------------------
   * Partida
   * ---------------------------------------------------------------- */

  if (!teams.length) {
    document.body.textContent = "config.js sem times. Preencha a lista teams.";
    return;
  }

  load();
  buildRows();
  render({ animate: false });

  if (isDemo) setupDemo();
  else connect();

  // Deixa disponivel no console do navegador, pra teste manual:
  //   placar.add(3, 50)   -> soma 50 pontos no time 3
  //   placar.reset()      -> zera tudo
  window.placar = {
    add: function (teamId, points) { addPoints(Number(teamId), Number(points), "flash", "teste"); },
    reset: resetScores,
    scores: function () { return Object.assign({}, scores); },
    feed: handleEvent,
  };
})();
