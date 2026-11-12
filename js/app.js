(function () {
  "use strict";

  const { SECTIONS, sectionPercent, MAX_PERCENT } = HKData;
  const { TREE, COLORS, MAP_ZONES, MAP_LINKS, ITEM_ZONE } = HKExtras;
  const t = (fr) => (window.HKI18n ? HKI18n.t(fr) : fr);
  const $ = (sel, root = document) => root.querySelector(sel);

  const LS = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
    },
    del(key) { try { localStorage.removeItem(key); } catch { /* ignore */ } },
  };

  const state = {
    manual: new Set(LS.get("hk.manual", [])),
    save: LS.get("hk.save", null), // { done: [...ids], counters: {...}, meta: {...} }
    filter: LS.get("hk.filter", "all"),
    spoilers: LS.get("hk.spoilers", true),
    english: LS.get("hk.english", true),
    tab: LS.get("hk.tab", "list"),
    notify: LS.get("hk.notify", false),
    shared: false,
    mapZone: LS.get("hk.mapZone", null),
    optional: LS.get("hk.optional", true),
    news: LS.get("hk.news", null), // { items: [ids], pctFrom, pctTo, timeDelta, at, fileName }
    collapsed: new Set(LS.get("hk.collapsed", [])),
    query: "",
    fresh: new Set(), // ids newly obtained since previous load (for highlight)
  };

  let fileHandle = null;
  let lastModified = 0;
  let watchTimer = null;

  /* ------------------------------ Save reading ------------------------------ */

  function evaluate(raw) {
    const pd = raw.playerData || raw;
    const items = (raw.sceneData && raw.sceneData.persistentBoolItems) || [];
    const sceneIndex = new Set(items.filter((i) => i.activated).map((i) => i.id + "|" + i.sceneName));
    const sc = (id, sceneName) => sceneIndex.has(id + "|" + sceneName);

    const done = [];
    const counters = {};
    for (const section of SECTIONS) {
      for (const item of section.items || []) {
        try { if (item.check(pd, sc)) done.push(item.id); } catch { /* missing field */ }
      }
      for (const c of section.counters || []) {
        try { counters[c.id] = c.value(pd, raw) || 0; } catch { counters[c.id] = 0; }
      }
    }
    const meta = {
      version: pd.version || "?",
      gamePct: typeof pd.completionPercentage === "number" ? pd.completionPercentage : null,
      playTime: pd.playTime || 0,
      geo: pd.geo || 0,
      steelSoul: pd.permadeathMode > 0,
      loadedAt: Date.now(),
    };
    const pctOverride = {};
    for (const section of SECTIONS) {
      if (!section.gamePct) continue;
      try {
        const v = section.gamePct(pd);
        if (v !== null) pctOverride[section.id] = Math.min(section.max, v);
      } catch { /* ignore */ }
    }
    // Hunter's Journal: [discovered (0/1), kills remaining]
    const journal = {};
    for (const e of window.HKJournal || []) {
      const discovered = e.k === "ShadeJournal" ? pd.hasJournal === true : pd["killed" + e.k] === true;
      const left = typeof pd["kills" + e.k] === "number" ? pd["kills" + e.k] : (discovered ? 0 : e.n);
      journal[e.k] = [discovered ? 1 : 0, Math.max(0, left)];
    }
    let stats = null;
    try { stats = HKExtras.computeStats(raw); } catch (e) { console.warn(e); }
    if (stats) {
      const main = (window.HKJournal || []).filter((e) => !e.opt);
      stats.journal = main.filter((e) => journal[e.k][0]).length;
      stats.journalTotal = main.length;
      stats.hunterMark = pd.hasHuntersMark === true;
    }
    // Charms: owned, costs, equipped
    const DEFAULT_COSTS = [0, 1, 1, 1, 2, 2, 2, 3, 2, 3, 1, 3, 1, 3, 1, 2, 2, 1, 2, 3, 2, 4, 2, 2, 2, 3, 1, 4, 2, 4, 1, 2, 3, 2, 4, 3, 5, 1, 3, 2, 2];
    const charms = { owned: [], costs: {}, equipped: Array.isArray(pd.equippedCharms) ? pd.equippedCharms : [], slots: pd.charmSlots || 3,
      royal: pd.royalCharmState || 0, grimmChild: pd.grimmChildLevel || 0 };
    for (let n = 1; n <= 40; n++) {
      const owned = n === 36 ? (pd.royalCharmState || 0) >= 3 : pd["gotCharm_" + n] === true;
      if (owned) charms.owned.push(n);
      charms.costs[n] = typeof pd["charmCost_" + n] === "number" ? pd["charmCost_" + n] : DEFAULT_COSTS[n];
    }
    // Hall of Gods statues: [unlocked, attuned, ascended, radiant]
    const statues = {};
    for (const st of (window.HKFeatures ? HKFeatures.STATUES : [])) {
      const v = pd["statueState" + st.k] || {};
      statues[st.k] = [v.isUnlocked ? 1 : 0, v.completedTier1 ? 1 : 0, v.completedTier2 ? 1 : 0, v.completedTier3 ? 1 : 0];
    }
    // Geo budget inputs
    const shopFlags = {};
    for (const f of (window.HKFeatures ? HKFeatures.SHOP_FLAGS : [])) shopFlags[f] = pd[f] === true;
    const relics = [1, 2, 3, 4].map((i) => pd["trinket" + i] || 0);
    const result = { done, counters, meta, stats, pctOverride, journal, charms, statues, shopFlags, relics,
      bank: pd.bankerAccountPurchased ? pd.bankerBalance || 0 : 0 };
    // Achievements
    if (window.HKFeatures) {
      const total = totalPercent(result);
      const main = (window.HKJournal || []).filter((e) => !e.opt);
      const ctx = { total, journalFound: main.filter((e) => journal[e.k][0]).length, journalTotal: main.length,
        stations: ["openedTownBuilding", "openedCrossroads", "openedGreenpath", "openedFungalWastes", "openedRuins1", "openedRestingGrounds",
          "openedRuins2", "openedRoyalGardens", "openedDeepnest", "openedHiddenStation", "openedStagNest"].filter((k) => pd[k] === true).length };
      result.achievements = {};
      for (const [k, rule] of Object.entries(HKFeatures.ACH_RULES)) {
        let v = null;
        try { v = rule(pd, ctx); } catch { v = null; }
        result.achievements[k] = v === null ? null : !!v;
      }
      result.meta.trackerPct = total;
    }
    return result;
  }

  async function loadBuffer(buffer, label) {
    try {
      const raw = HKSave.decodeSave(buffer);
      if (!raw || !(raw.playerData || raw.geo !== undefined)) throw new Error("ce fichier ne ressemble pas à une sauvegarde Hollow Knight");
      const result = evaluate(raw);
      if (window.HKLore) LS.set("hk.lore", HKLore.pick(raw.playerData || raw));
      result.meta.fileName = label;
      // Compare with the previous load of the same file, or else the last loaded save.
      const history = LS.get("hk.history", {});
      const before = history[label] || state.save;
      const prev = before ? new Set(before.done) : null;
      const newIds = prev ? result.done.filter((id) => !prev.has(id)) : [];
      state.fresh = new Set(newIds);
      if (prev && newIds.length) {
        state.news = {
          items: newIds,
          pctFrom: totalPercent(before),
          pctTo: totalPercent(result),
          timeDelta: Math.max(0, (result.meta.playTime || 0) - ((before.meta && before.meta.playTime) || 0)),
          at: Date.now(),
          fileName: label,
        };
        LS.set("hk.news", state.news);
      }
      history[label] = { done: result.done, meta: result.meta, pctOverride: result.pctOverride };
      LS.set("hk.history", history);
      state.save = result;
      LS.set("hk.save", result);
      setStatus(`✔ ${label} chargé (version ${result.meta.version}) à ${new Date().toLocaleTimeString("fr-FR")}` +
        (newIds.length ? ` · ${newIds.length} nouveauté(s) !` : prev ? " · rien de nouveau depuis la dernière fois" : ""), "ok");
      if (watchTimer && newIds.length) notifyNew(newIds);
      render();
    } catch (err) {
      console.error(err);
      setStatus("✖ Impossible de lire la sauvegarde : " + err.message, "err");
    }
  }

  async function loadFile(file) {
    lastModified = file.lastModified;
    loadBuffer(await file.arrayBuffer(), file.name);
  }

  function setStatus(msg, kind) {
    const el = $("#status");
    el.textContent = msg;
    el.className = "status " + (kind || "");
  }

  /* ------------------------------ Live watching ----------------------------- */

  function startWatching(handle) {
    fileHandle = handle;
    clearInterval(watchTimer);
    watchTimer = setInterval(async () => {
      try {
        const file = await fileHandle.getFile();
        if (file.lastModified !== lastModified) loadFile(file);
      } catch (e) {
        clearInterval(watchTimer);
        setStatus("Suivi interrompu : " + e.message, "err");
        updateWatchBtn();
      }
    }, 3000);
    updateWatchBtn();
  }

  function stopWatching() {
    clearInterval(watchTimer);
    watchTimer = null;
    fileHandle = null;
    updateWatchBtn();
  }

  function updateWatchBtn() {
    const btn = $("#watchBtn");
    btn.textContent = watchTimer ? "● Suivi en direct (arrêter)" : "Suivre le fichier en direct";
    btn.classList.toggle("live", !!watchTimer);
  }

  /* -------------------------------- Rendering ------------------------------- */

  // Total % for any stored save result (used to compare two saves).
  function totalPercent(save) {
    const done = new Set(save.done || []);
    let total = 0;
    for (const section of SECTIONS) {
      if (section.extra) continue;
      const o = save.pctOverride && save.pctOverride[section.id];
      total += o !== undefined ? o : sectionPercent(section, (section.items || []).filter((it) => done.has(it.id)).length);
    }
    return total;
  }

  // Use the game's own value when the save provides one (masks / soul vessels).
  function sectionPct(section, doneCount) {
    const o = state.save && state.save.pctOverride;
    if (o && o[section.id] !== undefined) return o[section.id];
    return sectionPercent(section, doneCount);
  }

  function isDone(id) {
    return state.save ? state.save.done.includes(id) : state.manual.has(id);
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  function wikiUrl(page) {
    return "https://hollowknight.wiki/w/" + encodeURIComponent(page).replace(/%2F/g, "/");
  }

  function fmtTime(sec) {
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
    return `${h} h ${String(m).padStart(2, "0")}`;
  }

  function matches(text) {
    return !state.query || text.toLowerCase().includes(state.query);
  }

  function render() {
    const root = $("#sections");
    root.innerHTML = "";
    let total = 0;
    document.body.classList.toggle("no-spoilers", !state.spoilers);
    document.body.classList.toggle("no-english", !state.english);

    for (const section of SECTIONS) {
      if (section.extra && !section.required && !state.optional) continue;
      const card = document.createElement("section");
      card.className = "card" + (section.extra ? " extra" : "") + (section.dlc ? " dlc dlc-" + section.id : "");
      card.style.setProperty("--c", section.color);
      card.id = "sec-" + section.id;
      if (state.collapsed.has(section.id)) card.classList.add("collapsed");

      let body = "";
      let visible = 0;
      let doneCount = 0;
      let count = 0;

      if (section.items) {
        count = section.items.length;
        for (const item of section.items) {
          const done = isDone(item.id);
          if (done) doneCount++;
          const show = (state.filter === "all" || (state.filter === "done") === done) &&
            matches(item.name + " " + (item.en || "") + " " + (item.hint || "") + " " + section.title);
          if (!show) continue;
          visible++;
          body += `
            <li class="item${done ? " done" : ""}${state.fresh.has(item.id) ? " fresh" : ""}" data-id="${item.id}">
              <button class="check" aria-pressed="${done}" aria-label="${esc(item.name)}" ${state.save ? "disabled" : ""}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>
              </button>
              <div class="item-text">
                <span class="name">${esc(item.name)}${item.en && item.en !== item.name ? ` <span class="en">${esc(item.en)}</span>` : ""}</span>
                ${item.hint ? `<span class="hint">${esc(item.hint)}</span>` : ""}
              </div>
              ${item.wiki ? `<a class="wiki" href="${wikiUrl(item.wiki)}" target="_blank" rel="noopener" title="Ouvrir le wiki">wiki ↗</a>` : ""}
            </li>`;
        }
      }

      if (section.counters) {
        for (const c of section.counters) {
          if (!matches(c.name + " " + section.title)) continue;
          visible++;
          const val = state.save ? state.save.counters[c.id] || 0 : null;
          const ratio = val === null ? 0 : Math.min(1, val / c.max);
          body += `
            <li class="counter">
              <div class="counter-head">
                <a href="${wikiUrl(c.wiki)}" target="_blank" rel="noopener">${esc(c.name)}</a>
                <span>${val === null ? "–" : val} / ${c.max}</span>
              </div>
              <div class="bar"><i style="width:${ratio * 100}%"></i></div>
            </li>`;
        }
      }

      const pct = sectionPct(section, doneCount);
      total += pct;
      const complete = section.items ? doneCount === count : false;
      card.classList.toggle("complete", complete);

      const progress = section.items ? doneCount / count : 0;
      card.innerHTML = `
        <header class="card-head" tabindex="0" role="button" aria-expanded="${!state.collapsed.has(section.id)}">
          <span class="sec-icon" aria-hidden="true">${section.icon || "•"}</span>
          <div class="sec-title">
            <h2>${esc(section.title.replace(/^DLC ?: /, ""))}${section.dlc ? ` <span class="badge">DLC</span>` : ""}</h2>
            ${section.desc ? `<p>${esc(section.desc)}</p>` : ""}
          </div>
          <div class="sec-score">
            ${section.items ? `<b>${doneCount}/${count}</b>` : ""}
            ${section.extra ? `<small>${section.required ? "requis" : "hors %"}</small>` : `<small>${pct} / ${section.max} %</small>`}
          </div>
          <span class="chev" aria-hidden="true">▾</span>
        </header>
        ${section.items ? `<div class="bar thin"><i style="width:${progress * 100}%"></i></div>` : ""}
        <ul class="items">${body || `<li class="empty">Rien à afficher avec ce filtre.</li>`}</ul>`;

      if (state.query && !visible) card.hidden = true;
      root.appendChild(card);
    }

    // Summary
    $("#totalPct").textContent = total;
    $("#ring").style.setProperty("--p", total / MAX_PERCENT);
    $("#ring").classList.toggle("max", total >= MAX_PERCENT);
    const m = state.save && state.save.meta;
    $("#statSource").textContent = m ? (m.steelSoul ? "Save (Âme d'acier)" : "Sauvegarde") : "Manuel";
    $("#statGame").textContent = m && m.gamePct !== null ? m.gamePct + " %" : "–";
    $("#statTime").textContent = m ? fmtTime(m.playTime) : "–";
    $("#statGeo").textContent = m ? m.geo.toLocaleString("fr-FR") : "–";
    $("#clearBtn").textContent = state.save ? "Retirer la sauvegarde" : "Réinitialiser";

    for (const btn of document.querySelectorAll(".seg button")) {
      btn.classList.toggle("on", btn.dataset.filter === state.filter);
    }

    const steel = !!(state.save && state.save.meta && state.save.meta.steelSoul);
    document.body.classList.toggle("steel", steel);
    $("#steelBadge").hidden = !steel;

    renderGrid();
    renderNews();
    renderTabs();
    $("#optional").checked = state.optional;
    if (state.tab === "tree") renderTree();
    if (state.tab === "stats") renderStats();
    if (state.tab === "map") renderMap();
    if (state.tab === "journal") renderJournal();
    if (state.tab === "achievements") renderAchievements();
    if (state.tab === "godhome") renderGodhome();
    if (state.tab === "builds") renderBuilds();
    if (state.tab === "lore" && window.HKLoreView) HKLoreView.render();
    renderCoherence();
    renderShareBanner();
  }

  /* ------------------------------ 112 cells grid ----------------------------- */

  function sectionDone(section) {
    return (section.items || []).filter((it) => isDone(it.id)).length;
  }

  function renderGrid() {
    const grid = $("#grid");
    const legend = $("#gridLegend");
    let cells = "";
    let leg = "";
    for (const section of SECTIONS) {
      if (section.extra) continue;
      const pct = sectionPct(section, sectionDone(section));
      const label = section.title.replace(/^DLC ?: /, "");
      for (let i = 0; i < section.max; i++) {
        cells += `<button class="cell${i < pct ? " on" : ""}" style="--c:${section.color}" data-sec="${section.id}" title="${esc(label)} : ${pct}/${section.max} %"></button>`;
      }
      leg += `<button class="leg${pct === section.max ? " full" : ""}" style="--c:${section.color}" data-sec="${section.id}"><i></i>${esc(label)} <b>${pct}/${section.max}</b></button>`;
    }
    grid.innerHTML = cells;
    legend.innerHTML = leg;
  }

  /* ---------------------------------- News ---------------------------------- */

  function findSection(id) {
    for (const s of SECTIONS) for (const it of s.items || []) if (it.id === id) return { item: it, section: s };
    return null;
  }

  function renderNews() {
    const box = $("#news");
    const n = state.news;
    if (!n || !n.items || !n.items.length) { box.hidden = true; return; }
    const entries = n.items.map(findSection).filter(Boolean)
      .filter((e) => state.optional || !e.section.extra || e.section.required);
    const gain = n.pctTo - n.pctFrom;
    const when = new Date(n.at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
    box.hidden = false;
    box.innerHTML = `
      <div class="news-head">
        <div>
          <span class="news-kicker">Nouveautés</span>
          <h2>${n.items.length} nouvel${n.items.length > 1 ? "s" : ""} objet${n.items.length > 1 ? "s" : ""} depuis la sauvegarde précédente</h2>
          <p class="small muted">${esc(n.fileName)} · chargé le ${when}${n.timeDelta ? ` · ${fmtTime(n.timeDelta)} de jeu en plus` : ""}</p>
        </div>
        <div class="news-gain${gain > 0 ? "" : " zero"}"><strong>${gain > 0 ? "+" + gain : gain} %</strong><small>${n.pctFrom} → ${n.pctTo} %</small></div>
        <button class="news-close" id="newsClose" aria-label="Masquer les nouveautés">✕</button>
      </div>
      <ul class="news-list">
        ${entries.map((e) => `<li style="--c:${e.section.color}"><button data-sec="${e.section.id}" data-item="${e.item.id}"><i></i><b>${esc(e.item.name.replace(/^#\d+ /, ""))}</b><small>${esc(e.section.title.replace(/^DLC ?: /, ""))}</small></button></li>`).join("")}
      </ul>`;
  }

  /* ---------------------------------- Tabs ---------------------------------- */

  function renderTabs() {
    for (const b of document.querySelectorAll(".tabs button")) {
      const on = b.dataset.tab === state.tab;
      b.classList.toggle("on", on);
      b.setAttribute("aria-selected", on);
    }
    for (const p of document.querySelectorAll(".panel")) p.hidden = p.id !== "panel-" + state.tab;
  }

  /* ------------------------------ Progression tree ----------------------------- */

  function findItem(id) {
    for (const s of SECTIONS) for (const it of s.items || []) if (it.id === id) return it;
    return null;
  }

  function renderTree() {
    const depth = {};
    const byId = Object.fromEntries(TREE.map((n) => [n.id, n]));
    const getDepth = (n) => {
      if (depth[n.id] !== undefined) return depth[n.id];
      depth[n.id] = n.req.length ? 1 + Math.max(...n.req.map((r) => getDepth(byId[r]))) : 0;
      return depth[n.id];
    };
    TREE.forEach(getDepth);

    const W = 960, padX = 70, rowH = 92, top = 56;
    const lanes = 8;
    const rows = Math.max(...Object.values(depth)) + 1;
    const H = top + rows * rowH + 10;
    const pos = {};
    for (const n of TREE) pos[n.id] = { x: padX + (n.lane / lanes) * (W - 2 * padX), y: top + depth[n.id] * rowH };

    const status = (n) => (isDone(n.id) ? "done" : n.req.every((r) => isDone(r)) ? "next" : "locked");

    let edges = "";
    for (const n of TREE) {
      for (const r of n.req) {
        const a = pos[r], b = pos[n.id];
        const lit = isDone(r) && isDone(n.id);
        const half = isDone(r) && !isDone(n.id);
        const my = (a.y + b.y) / 2;
        edges += `<path class="edge${lit ? " lit" : half ? " half" : ""}" style="--c:${COLORS[n.cat]}" d="M${a.x},${a.y + 18} C${a.x},${my} ${b.x},${my} ${b.x},${b.y - 18}"/>`;
      }
    }

    let nodes = "";
    const next = [];
    for (const n of TREE) {
      const st = status(n);
      if (st === "next") next.push(n);
      const p = pos[n.id];
      const words = n.label.split(" ");
      const lines = [];
      for (const w of words) {
        if (lines.length && (lines[lines.length - 1] + " " + w).length <= 14) lines[lines.length - 1] += " " + w;
        else lines.push(w);
      }
      const item = findItem(n.id);
      const tip = n.label + (item && item.hint ? " — " + item.hint : "");
      nodes += `<g class="node ${st}" style="--c:${COLORS[n.cat]}" transform="translate(${p.x},${p.y})" tabindex="0">
        <title>${esc(tip)}</title>
        <circle class="halo" r="26"/>
        <circle class="dot" r="16"/>
        ${st === "done" ? `<path class="tick" d="M-7,0 L-2,5 L7,-5"/>` : st === "locked" ? `<circle class="lock" r="3.5"/>` : `<circle class="spark" r="5"/>`}
        <text y="34">${lines.map((l, i) => `<tspan x="0" dy="${i ? 13 : 0}">${esc(l)}</tspan>`).join("")}</text>
      </g>`;
    }

    // Act bands
    const acts = [
      { label: "Début", from: 0, to: 2 },
      { label: "Milieu", from: 3, to: 6 },
      { label: "Late game", from: 7, to: 8 },
      { label: "Fin de partie", from: 9, to: rows - 1 },
    ];
    let bands = "";
    acts.forEach((a, i) => {
      const y1 = top + a.from * rowH - rowH / 2 + 6, y2 = top + a.to * rowH + rowH / 2 - 6;
      bands += `<rect class="band${i % 2 ? " alt" : ""}" x="6" y="${y1}" width="${W - 12}" height="${y2 - y1}" rx="16"/>
        <text class="band-label" x="22" y="${y1 + 22}">${a.label}</text>`;
    });

    $("#tree").innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Arbre de progression">${bands}${edges}${nodes}</svg>`;

    const doneCount = TREE.filter((n) => isDone(n.id)).length;
    $("#treeSummary").textContent = `${doneCount} / ${TREE.length} étapes clés franchies`;
    $("#nextList").innerHTML = next.length
      ? next.map((n) => {
        const item = findItem(n.id);
        return `<li style="--c:${COLORS[n.cat]}"><b>${esc(n.label)}</b>${item && item.hint ? `<span>${esc(item.hint)}</span>` : ""}</li>`;
      }).join("")
      : `<li class="muted">Toutes les étapes clés sont franchies. Bravo !</li>`;
  }

  /* ------------------------------- Hallownest map ------------------------------ */

  function zoneItems(zoneId) {
    const out = [];
    for (const s of SECTIONS) {
      if (s.extra && !s.required && !state.optional) continue;
      for (const it of s.items || []) {
        if (ITEM_ZONE[it.id] === zoneId) out.push({ item: it, section: s });
      }
    }
    return out;
  }

  function zoneColor(ratio) {
    if (ratio >= 1) return "#f3c65a";
    // From dim slate to soul blue as progress grows.
    const a = [70, 80, 110], b = [143, 168, 255];
    const t = Math.pow(ratio, 0.8);
    return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
  }

  // Split an area name into lines that fit in a zone of width w (Cinzel 15px).
  function wrapName(name, w) {
    const max = Math.floor((w - 28) / 10.5);
    const lines = [];
    for (const word of name.split(" ")) {
      const last = lines[lines.length - 1];
      if (last && (last + " " + word).length <= max) lines[lines.length - 1] = last + " " + word;
      else lines.push(word);
    }
    return lines;
  }

  function renderMap() {
    const zones = MAP_ZONES.map((z) => {
      const list = zoneItems(z.id);
      const done = list.filter((e) => isDone(e.item.id)).length;
      return { ...z, list, done, total: list.length, ratio: list.length ? done / list.length : 0 };
    });
    const byId = Object.fromEntries(zones.map((z) => [z.id, z]));
    if (!state.mapZone || !byId[state.mapZone]) {
      const firstMissing = zones.find((z) => z.done < z.total);
      state.mapZone = (firstMissing || zones[0]).id;
    }

    const center = (z) => [z.x + z.w / 2, z.y + z.h / 2];
    let links = "";
    for (const [a, b] of MAP_LINKS) {
      const [x1, y1] = center(byId[a]), [x2, y2] = center(byId[b]);
      const lit = byId[a].done > 0 && byId[b].done > 0;
      links += `<line class="tunnel${lit ? " lit" : ""}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    }

    let shapes = "";
    for (const z of zones) {
      const col = zoneColor(z.ratio);
      const sel = z.id === state.mapZone;
      const pct = Math.round(z.ratio * 100);
      const barW = z.w - 28;
      shapes += `<g class="zone${z.ratio >= 1 ? " full" : ""}${z.dream ? " dream" : ""}${sel ? " sel" : ""}" data-zone="${z.id}" style="--zc:${col}" tabindex="0" role="button" aria-label="${esc(z.name)} : ${z.done} sur ${z.total}">
        <rect class="zone-bg" x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="20"/>
        <rect class="zone-fill" x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="20" style="opacity:${0.12 + z.ratio * 0.4}"/>
        <text class="zone-name" x="${z.x + 14}" y="${z.y + 26}">${wrapName(z.name, z.w).map((l, i) => `<tspan x="${z.x + 14}" dy="${i ? 17 : 0}">${esc(l)}</tspan>`).join("")}</text>
        ${z.sub ? `<text class="zone-sub" x="${z.x + 14}" y="${z.y + 26 + 16 * wrapName(z.name, z.w).length}">${esc(z.sub)}</text>` : ""}
        <text class="zone-pct" x="${z.x + z.w - 14}" y="${z.y + z.h - 22}" text-anchor="end">${pct}%</text>
        <text class="zone-count" x="${z.x + 14}" y="${z.y + z.h - 22}">${z.done}/${z.total}</text>
        <rect class="zone-track" x="${z.x + 14}" y="${z.y + z.h - 14}" width="${barW}" height="4" rx="2"/>
        <rect class="zone-bar" x="${z.x + 14}" y="${z.y + z.h - 14}" width="${barW * z.ratio}" height="4" rx="2"/>
      </g>`;
    }

    $("#map").innerHTML = `<svg viewBox="0 0 1000 700" role="img" aria-label="Carte d'Hallownest">
      <defs>
        <pattern id="mapDots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="rgba(255,255,255,.05)"/></pattern>
      </defs>
      <rect width="1000" height="700" fill="url(#mapDots)"/>
      ${links}${shapes}
    </svg>`;

    const totalDone = zones.reduce((a, z) => a + z.done, 0), total = zones.reduce((a, z) => a + z.total, 0);
    const full = zones.filter((z) => z.ratio >= 1).length;
    $("#mapSummary").textContent = `${full} / ${zones.length} zones complètes · ${totalDone} / ${total} objets`;

    const z = byId[state.mapZone];
    const missing = z.list.filter((e) => !isDone(e.item.id));
    const got = z.list.filter((e) => isDone(e.item.id));
    const row = (e, d) => `<li class="${d ? "done" : ""}" style="--c:${e.section.color}">
        <span class="zi-dot"></span>
        <div><b>${esc(e.item.name.replace(/^#\d+ /, ""))}</b><small>${esc(e.section.title.replace(/^DLC ?: /, ""))}${e.item.hint ? " · " + esc(e.item.hint) : ""}</small></div>
      </li>`;
    $("#zoneDetail").innerHTML = `
      <div class="zd-head" style="--zc:${zoneColor(z.ratio)}">
        <h3>${esc(z.name)}</h3>
        <strong>${z.done}/${z.total}</strong>
      </div>
      <div class="bar"><i style="width:${z.ratio * 100}%;background:${zoneColor(z.ratio)}"></i></div>
      ${missing.length ? `<h4>À trouver (${missing.length})</h4><ul class="zone-items">${missing.map((e) => row(e, false)).join("")}</ul>` : `<p class="zd-done">Zone terminée ✦</p>`}
      ${got.length ? `<h4>Obtenu (${got.length})</h4><ul class="zone-items">${got.map((e) => row(e, true)).join("")}</ul>` : ""}`;
  }

  /* ------------------------------ Hunter's Journal ----------------------------- */

  function renderJournal() {
    const el = $("#journal-body");
    const j = state.save && state.save.journal;
    if (!j) {
      el.innerHTML = `<p class="muted">Chargez une sauvegarde pour voir votre Journal du chasseur.</p>`;
      return;
    }
    const all = window.HKJournal || [];
    const status = (e) => {
      const [d, left] = j[e.k] || [0, e.n];
      if (!d) return "unknown";
      return left > 0 ? "hunting" : "complete";
    };
    const main = all.filter((e) => !e.opt);
    const found = main.filter((e) => status(e) !== "unknown").length;
    const complete = main.filter((e) => status(e) === "complete").length;
    const mark = state.save.stats && state.save.stats.hunterMark;
    const f = state.journalFilter || "all";
    const q = state.journalQuery || "";
    const card = (e) => {
      const st = status(e);
      const [, left] = j[e.k] || [0, e.n];
      if (f !== "all" && f !== st) return "";
      if (q && !(e.fr + " " + e.en).toLowerCase().includes(q)) return "";
      const done = Math.max(0, e.n - left);
      const ratio = e.n ? done / e.n : st === "complete" ? 1 : 0;
      return `<li class="jc ${st}">
        <div class="jc-name"><b>${st === "unknown" ? "???" : esc(e.fr)}</b>${st !== "unknown" && state.english && e.en !== e.fr ? `<small>${esc(e.en)}</small>` : ""}</div>
        <div class="jc-state">${st === "unknown" ? "Pas encore rencontré" : st === "complete" ? "Notes complètes ✦" : `Encore ${left} à vaincre`}</div>
        ${e.n ? `<div class="bar"><i style="width:${ratio * 100}%"></i></div>` : ""}
      </li>`;
    };
    const showOpt = state.optional;
    el.innerHTML = `
      <div class="journal-head">
        <div class="jh-stat"><strong>${found}<small>/${main.length}</small></strong><span>entrées découvertes</span></div>
        <div class="jh-stat"><strong>${complete}<small>/${main.length}</small></strong><span>notes complètes</span></div>
        <div class="jh-stat ${mark ? "ok" : ""}"><strong>${mark ? "✦" : "–"}</strong><span>${mark ? "Marque du chasseur obtenue" : "Marque du chasseur"}</span></div>
      </div>
      <div class="toolbar journal-tools">
        <input type="search" id="journalSearch" placeholder="Rechercher une créature…" value="${esc(q)}" autocomplete="off">
        <div class="seg" id="journalSeg">
          ${[["all", "Toutes"], ["unknown", "À découvrir"], ["hunting", "À chasser"], ["complete", "Complètes"]].map(([k, l]) => `<button data-jf="${k}" class="${f === k ? "on" : ""}">${l}</button>`).join("")}
        </div>
      </div>
      <p class="small muted">Pour obtenir la Marque du chasseur, il faut compléter les notes de toutes les entrées (vaincre chaque créature le nombre de fois demandé), puis retourner voir le Chasseur dans le Vertchemin.</p>
      <ul class="journal-grid">${main.map(card).join("") || `<li class="muted">Aucune créature avec ce filtre.</li>`}</ul>
      ${showOpt ? `<h3 class="journal-sub">Entrées supplémentaires</h3><p class="small muted">Boss secrets et contenus additionnels : ils ne comptent pas pour la Marque du chasseur.</p>
      <ul class="journal-grid">${all.filter((e) => e.opt).map(card).join("")}</ul>` : ""}`;
    const input = $("#journalSearch");
    input.addEventListener("input", () => {
      state.journalQuery = input.value.trim().toLowerCase();
      const pos = input.selectionStart;
      renderJournal();
      const again = $("#journalSearch");
      again.focus();
      again.setSelectionRange(pos, pos);
    });
    $("#journalSeg").addEventListener("click", (e) => {
      const b = e.target.closest("[data-jf]");
      if (!b) return;
      state.journalFilter = b.dataset.jf;
      renderJournal();
    });
  }


  /* ------------------------------ Coherence check ------------------------------ */

  function renderCoherence() {
    const el = $("#coherence");
    const m = state.save && state.save.meta;
    if (!m || m.gamePct === null || m.gamePct === undefined || state.shared) { el.hidden = true; return; }
    const total = SECTIONS.filter((s) => !s.extra).reduce((a, s) => a + sectionPct(s, sectionDone(s)), 0);
    if (Math.round(m.gamePct) === total) {
      el.hidden = false;
      el.className = "coherence ok";
      el.innerHTML = `✔ Le site et le jeu sont d'accord : <b>${total} %</b>.`;
    } else {
      el.hidden = false;
      el.className = "coherence warn";
      el.innerHTML = `⚠ Le jeu indique <b>${m.gamePct} %</b>, le site calcule <b>${total} %</b>.
        <span>Le jeu ne recalcule son pourcentage qu'à certains moments (par exemple en ouvrant l'inventaire) : rouvrez l'inventaire en jeu, sauvegardez sur un banc et rechargez le fichier. Si l'écart persiste, c'est une erreur du site : n'hésitez pas à la signaler.</span>`;
    }
  }

  /* ---------------------------------- Achievements ---------------------------------- */

  function renderAchievements() {
    const el = $("#achievements-body");
    const a = state.save && state.save.achievements;
    if (!a) { el.innerHTML = `<p class="muted">Chargez une sauvegarde pour voir vos succès.</p>`; return; }
    const list = window.HKAchievements || [];
    const got = list.filter((x) => a[x.k] === true).length;
    const unknown = list.filter((x) => a[x.k] === null).length;
    const f = state.achFilter || "all";
    const cls = (v) => (v === true ? "got" : v === null ? "unknown" : "locked");
    el.innerHTML = `
      <div class="journal-head">
        <div class="jh-stat ok"><strong>${got}<small>/${list.length}</small></strong><span>succès obtenus d'après la sauvegarde</span></div>
        <div class="jh-stat"><strong>${list.length - got - unknown}</strong><span>restants</span></div>
        <div class="jh-stat"><strong>${unknown}</strong><span>impossibles à vérifier depuis la save</span></div>
      </div>
      <div class="toolbar journal-tools">
        <div class="seg" id="achSeg">${[["all", "Tous"], ["locked", "Restants"], ["got", "Obtenus"], ["unknown", "Incertains"]].map(([k, l]) => `<button data-af="${k}" class="${f === k ? "on" : ""}">${l}</button>`).join("")}</div>
      </div>
      <ul class="ach-grid">${list.filter((x) => f === "all" || cls(a[x.k]) === f).map((x) => `
        <li class="ach ${cls(a[x.k])}">
          <span class="ach-icon">${a[x.k] === true ? "✦" : a[x.k] === null ? "?" : "◇"}</span>
          <div><b>${esc(x.fr)}</b>${state.english && x.en !== x.fr ? ` <small class="en">${esc(x.en)}</small>` : ""}<p>${esc(x.frd)}</p>
          ${a[x.k] === null ? `<em>La sauvegarde ne permet pas de le vérifier.</em>` : ""}</div>
        </li>`).join("")}</ul>
      <p class="small muted">Les succès Steam, Xbox ou PlayStation sont liés à votre compte, pas à la sauvegarde : cette liste indique ce que la sauvegarde permet de déduire.</p>`;
    $("#achSeg").addEventListener("click", (e) => {
      const b = e.target.closest("[data-af]");
      if (!b) return;
      state.achFilter = b.dataset.af;
      renderAchievements();
    });
  }

  /* ---------------------------------- Godhome ---------------------------------- */

  function renderGodhome() {
    const el = $("#godhome-body");
    const st = state.save && state.save.statues;
    if (!st) { el.innerHTML = `<p class="muted">Chargez une sauvegarde pour voir la Salle des Dieux.</p>`; return; }
    const list = HKFeatures.STATUES;
    const count = (i) => list.filter((x) => st[x.k] && st[x.k][i]).length;
    const tiers = [["Attuned", "difficulté 1"], ["Ascended", "difficulté 2"], ["Radiant", "difficulté 3"]];
    el.innerHTML = `
      <div class="journal-head">
        <div class="jh-stat"><strong>${count(0)}<small>/${list.length}</small></strong><span>statues débloquées</span></div>
        ${tiers.map(([n, d], i) => `<div class="jh-stat tier${i + 1}"><strong>${count(i + 1)}<small>/${list.length}</small></strong><span>${n} (${d})</span></div>`).join("")}
      </div>
      <div class="godhome-grid">${list.map((x) => {
        const v = st[x.k] || [0, 0, 0, 0];
        const level = v[3] ? 3 : v[2] ? 2 : v[1] ? 1 : 0;
        return `<div class="statue lvl${level}${v[0] ? "" : " sealed"}">
          <div class="statue-plinth"><span class="statue-gem"></span></div>
          <b>${v[0] ? esc(x.fr) : "???"}</b>${v[0] && state.english && x.en !== x.fr ? `<small>${esc(x.en)}</small>` : ""}
          <div class="tiers">${[1, 2, 3].map((t) => `<i class="${v[t] ? "on" : ""}" title="${tiers[t - 1][0]}"></i>`).join("")}</div>
        </div>`;
      }).join("")}</div>
      <p class="small muted">Chaque statue de la Salle des Dieux peut être vaincue à trois niveaux : Attuned, Ascended et Radiant (noms anglais du jeu). Les Panthéons sont suivis dans la checklist.</p>`;
  }

  /* -------------------------------- Charm builds -------------------------------- */

  function charmLabel(n, c) {
    if (n === 36) return c.royal >= 4 ? "Coeur du vide" : "Âme-royale";
    if (n === 40) return c.grimmChild >= 5 ? "Mélodie Insouciante" : "L'Héritier de Grimm";
    const it = findItem("gotCharm_" + n);
    return it ? it.name.replace(/^#\d+ /, "") : "Charme #" + n;
  }

  function renderBuilds() {
    const el = $("#builds-body");
    const c = state.save && state.save.charms;
    if (!c) { el.innerHTML = `<p class="muted">Chargez une sauvegarde pour composer un build avec vos Charmes.</p>`; return; }
    if (!state.build) state.build = LS.get("hk.build", null) || [...c.equipped];
    state.build = state.build.filter((n) => c.owned.includes(n));
    const used = state.build.reduce((a, n) => a + (c.costs[n] || 0), 0);
    const over = used > c.slots;
    const builds = LS.get("hk.builds", []);
    const pips = (n) => Array.from({ length: n }, () => "<i></i>").join("");
    el.innerHTML = `
      <div class="build-bar ${over ? "over" : ""}">
        <div>
          <small>Emplacements utilisés</small>
          <div class="notches">${Array.from({ length: Math.max(c.slots, used) }, (_, i) => `<i class="${i < used ? (i >= c.slots ? "over" : "on") : ""}"></i>`).join("")}</div>
          <strong>${used} / ${c.slots}</strong> ${over ? `<span class="over-tag">Surcharge : les dégâts reçus sont doublés</span>` : ""}
        </div>
        <div class="build-actions">
          <button class="btn ghost" id="buildCurrent">Build équipé en jeu</button>
          <button class="btn ghost" id="buildClear">Vider</button>
          <button class="btn" id="buildSave">Enregistrer ce build</button>
        </div>
      </div>
      <div class="build-current">${state.build.length ? state.build.map((n) => `<button class="chip" data-charm="${n}">${esc(charmLabel(n, c))} <span class="cost">${pips(c.costs[n])}</span> ✕</button>`).join("") : `<span class="muted">Cliquez sur des Charmes ci-dessous pour composer un build.</span>`}</div>
      ${builds.length ? `<h3 class="journal-sub">Mes builds</h3><div class="saved-builds">${builds.map((b, i) => `<div class="saved"><button class="link" data-load="${i}">${esc(b.name)}</button><small>${b.charms.map((n) => esc(charmLabel(n, c))).join(", ")}</small><button class="x" data-del="${i}" aria-label="Supprimer">✕</button></div>`).join("")}</div>` : ""}
      <h3 class="journal-sub">Vos Charmes (${c.owned.length}/40)</h3>
      <div class="charm-grid">${c.owned.map((n) => `<button class="charm${state.build.includes(n) ? " in" : ""}" data-charm="${n}">
        <b>${esc(charmLabel(n, c))}</b><span class="cost">${pips(c.costs[n])}</span></button>`).join("")}</div>`;
  }

  /* -------------------------------- Geo budget -------------------------------- */

  function geoBudget() {
    const sv = state.save;
    const isDoneShop = (it) => (it.flag ? !!(sv.shopFlags && sv.shopFlags[it.flag]) : isDone(it.id));
    const groups = HKFeatures.SHOP.map((g) => ({ shop: g.shop, items: g.items.filter((it) => !isDoneShop(it)) })).filter((g) => g.items.length);
    const need = groups.reduce((a, g) => a + g.items.reduce((b, it) => b + it.geo, 0), 0);
    const relicGeo = (sv.relics || [0, 0, 0, 0]).reduce((a, n, i) => a + n * HKFeatures.RELIC_VALUES[i], 0);
    const have = (sv.stats ? sv.stats.geo : 0) + (sv.bank || 0);
    return { groups, need, relicGeo, have };
  }

  /* -------------------------------- Notifications -------------------------------- */

  function chime() {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      [660, 990].forEach((f, i) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, ac.currentTime + i * 0.12);
        g.gain.exponentialRampToValueAtTime(0.12, ac.currentTime + i * 0.12 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + i * 0.12 + 0.5);
        o.connect(g).connect(ac.destination);
        o.start(ac.currentTime + i * 0.12); o.stop(ac.currentTime + i * 0.12 + 0.55);
      });
    } catch { /* audio unavailable */ }
  }

  function notifyNew(ids) {
    if (!state.notify) return;
    chime();
    const names = ids.map((id) => { const f = findSection(id); return f ? f.item.name.replace(/^#\d+ /, "") : id; });
    try {
      if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
        const title = window.HKI18n && HKI18n.lang === "en" ? `${ids.length} new item${ids.length > 1 ? "s" : ""}!` : `${ids.length} nouveauté${ids.length > 1 ? "s" : ""} !`;
        new Notification(title, { body: names.slice(0, 5).join(", "), icon: "img/icon-192.png" });
      }
    } catch { /* notifications unavailable */ }
  }

  /* -------------------------------- Share link -------------------------------- */

  function allItemIds() {
    const ids = [];
    for (const s of SECTIONS) for (const it of s.items || []) ids.push(it.id);
    return ids;
  }

  function shareLink() {
    const ids = allItemIds();
    const done = new Set(state.save ? state.save.done : [...state.manual]);
    const bytes = new Uint8Array(Math.ceil(ids.length / 8));
    ids.forEach((id, i) => { if (done.has(id)) bytes[i >> 3] |= 1 << (i & 7); });
    let bin = "";
    bytes.forEach((b) => { bin += String.fromCharCode(b); });
    const bits = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const m = state.save && state.save.meta;
    const o = (state.save && state.save.pctOverride) || {};
    const extra = [m ? Math.round(m.playTime || 0) : 0, m && m.steelSoul ? 1 : 0, o.masks ?? "x", o.vessels ?? "x"].join(".");
    return location.origin + location.pathname + "#p=1." + extra + "." + bits;
  }

  function readShareLink() {
    const mt = /#p=1\.(\d+)\.(\d)\.(\d|x)\.(\d|x)\.([A-Za-z0-9_-]+)/.exec(location.hash);
    if (!mt) return null;
    try {
      const bin = atob(mt[5].replace(/-/g, "+").replace(/_/g, "/"));
      const ids = allItemIds();
      const done = ids.filter((id, i) => (bin.charCodeAt(i >> 3) >> (i & 7)) & 1);
      const pctOverride = {};
      if (mt[3] !== "x") pctOverride.masks = +mt[3];
      if (mt[4] !== "x") pctOverride.vessels = +mt[4];
      return { done, pctOverride, meta: { playTime: +mt[1], steelSoul: mt[2] === "1", gamePct: null, version: "", geo: 0 } };
    } catch { return null; }
  }

  function renderShareBanner() {
    const el = $("#shareBanner");
    if (!state.shared) { el.hidden = true; return; }
    el.hidden = false;
  }

  /* -------------------------------- Statistics ------------------------------- */

  function renderStats() {
    const el = $("#stats-body");
    const st = state.save && state.save.stats;
    if (!st) {
      el.innerHTML = `<p class="muted">Chargez une sauvegarde pour voir vos statistiques.</p>`;
      return;
    }
    const m = state.save.meta;
    const fmt = (n) => Number(n).toLocaleString("fr-FR");
    const pips = (n, max, cls) => Array.from({ length: max }, (_, i) => `<i class="${cls}${i < n ? " on" : ""}"></i>`).join("");
    const card = (icon, label, value, sub, color) =>
      `<div class="stat" style="--c:${color || "var(--accent)"}"><span class="stat-icon">${icon}</span><div><small>${label}</small><strong>${value}</strong>${sub ? `<em>${sub}</em>` : ""}</div></div>`;

    el.innerHTML = `
      <div class="recap-row"><button class="btn ghost" id="linkBtn">🔗 Copier un lien de partage</button><button class="btn" id="recapBtn">⇩ Image récapitulative à partager</button></div>
      <div class="stat-hero">
        <div class="vitals">
          <div><small>Masques</small><div class="pips">${pips(st.maxHealth, 9, "mask")}</div></div>
          <div><small>Réceptacles d'Âme</small><div class="pips">${pips(st.soulVessels, 3, "vessel")}</div></div>
          <div><small>Emplacements de Charme</small><div class="pips">${pips(st.charmSlots, 11, "notch")}</div></div>
        </div>
        <div class="shade ${st.shadeZone ? "" : "none"}">
          <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18.2 31 C10 25.5 7.6 14.5 11.2 2.8 C13.4 11 17.4 18.4 24.6 23.9 C27 23.2 29.5 22.8 32 22.8 C34.5 22.8 37 23.2 39.4 23.9 C46.6 18.4 50.6 11 52.8 2.8 C56.4 14.5 54 25.5 45.8 31 C47.2 33.7 48 36.8 48 40 C48 50.5 40.8 58.5 32 58.5 C23.2 58.5 16 50.5 16 40 C16 36.8 16.8 33.7 18.2 31 Z"/><g class="eyes"><ellipse cx="25.4" cy="41.5" rx="4.4" ry="7.2"/><ellipse cx="38.6" cy="41.5" rx="4.4" ry="7.2"/></g></svg>
          <div>
            <small>Votre ombre</small>
            ${st.shadeZone ? `<strong>${esc(st.shadeZone)}</strong><em>${fmt(st.shadeGeo)} Geo à récupérer</em>` : `<strong>Aucune ombre</strong><em>Vous n'avez rien perdu</em>`}
          </div>
        </div>
      </div>
      <div class="stat-grid">
        ${card("⏱", "Temps de jeu", fmtTime(m.playTime), st.steelSoul ? "Mode Âme d'acier" : "Mode classique", "#cfd8ff")}
        ${card("◎", "% affiché en jeu", m.gamePct !== null ? m.gamePct + " %" : "–", "", "#f3c65a")}
        ${card("◉", "Geo", fmt(st.geo), st.bank !== null ? `Banque de Millibelle : ${fmt(st.bank)}` : "", "#e8d9a8")}
        ${card("☾", "Essences", fmt(st.essence), st.essence >= 2400 ? "Voyante comblée" : `${fmt(Math.max(0, 2400 - st.essence))} avant les derniers mots de la Voyante`, "#d7a4ff")}
        ${card("†", "Dégâts de l'Aiguillon", st.nailDamage, "", "#cfd6e4")}
        ${card("✦", "Charmes possédés", st.charmsOwned + " / 40", "", "#b79cff")}
        ${card("❦", "Larves sauvées", st.grubs + " / 46", "", "#9fe3b5")}
        ${card("☰", "Journal du chasseur", st.journal + " / " + st.journalTotal, st.hunterMark ? "Marque du chasseur obtenue ✦" : "entrées découvertes", "#ef8b8b")}
        ${card("⌂", "Salles visitées", fmt(st.rooms), "", "#7fd8e8")}
        ${card("◈", "Reliques en poche", st.relics, `${st.relicsSold} vendue(s) à Lemm`, "#c9b88f")}
        ${card("◍", "Oeufs rances", st.rancidEggs, `${st.eggsSold} vendu(s) à Jinn`, "#a3a9bb")}
        ${card("♛", "Zote le Prince Gris", st.greyPrince + " / 10", "victoires", "#f39a5a")}
        ${card("❖", "Protecteur Blanc", st.whiteDefender + " / 5", "victoires", "#f4efe6")}
        ${card("❀", "Fleur délicate", st.flowerBroken ? st.flowerBroken + " fois brisée" : "Jamais brisée", "", "#ffb3c7")}
      </div>
      ${(() => {
        const b = geoBudget();
        const missing = Math.max(0, b.need - b.have);
        return `<div class="budget">
          <div class="budget-head">
            <div><small>Budget en Geo pour le 112 %</small><strong>${fmt(b.need)} Geo</strong><em>restent à dépenser en achats nécessaires</em></div>
            <div><small>Disponible</small><strong>${fmt(b.have)} Geo</strong><em>en poche${state.save.bank ? " et à la banque" : ""}</em></div>
            <div><small>Reliques à vendre</small><strong>${fmt(b.relicGeo)} Geo</strong><em>chez Lemm</em></div>
            <div class="${missing ? "warn" : "ok"}"><small>${missing ? "Il manque" : "Verdict"}</small><strong>${missing ? fmt(Math.max(0, missing - b.relicGeo)) + " Geo" : "Ça suffit ✦"}</strong><em>${missing ? (missing <= b.relicGeo ? "en vendant vos reliques, c'est bon" : "après la vente des reliques") : "pas besoin de farmer"}</em></div>
          </div>
          ${b.groups.length ? `<details><summary>Détail des achats restants</summary><ul class="budget-list">${b.groups.map((g) => `<li><b>${esc(g.shop)}</b><span>${g.items.map((it) => `${esc(it.label)} <i>${fmt(it.geo)}</i>`).join(" · ")}</span></li>`).join("")}</ul></details>` : ""}
        </div>`;
      })()}
      <div class="equipped">
        <small>Charmes équipés</small>
        <div>${st.equipped.length ? st.equipped.map((c) => `<span>${esc(c)}</span>`).join("") : `<span class="muted">Aucun</span>`}</div>
      </div>
      <p class="small muted">Le jeu n'enregistre pas le nombre de morts : seule la position de votre ombre (votre dernière mort) est connue.</p>`;
  }

  /* ------------------------------- Recap image ------------------------------- */

  async function makeRecap() {
    try { await document.fonts.ready; } catch { /* ignore */ }
    const W = 1200, H = 675;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const g = c.getContext("2d");
    const steel = document.body.classList.contains("steel");
    const accent = steel ? "#d6dbe6" : "#cfd8ff";

    // Background
    const bg = g.createRadialGradient(W * 0.3, -100, 50, W * 0.4, H * 0.3, W);
    bg.addColorStop(0, steel ? "#2a1a20" : "#1d2440");
    bg.addColorStop(1, "#0a0c12");
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) {
      g.fillStyle = `rgba(200, 215, 255, ${Math.random() * 0.4})`;
      g.beginPath();
      g.arc(Math.random() * W, Math.random() * H, Math.random() * 1.8 + 0.3, 0, Math.PI * 2);
      g.fill();
    }

    // Title
    g.fillStyle = "#e9e6dc";
    g.font = "700 40px Cinzel, serif";
    g.fillText("Hollow Knight", 60, 82);
    g.fillStyle = accent;
    g.font = "500 40px Cinzel, serif";
    g.fillText("Completionist", 60 + g.measureText("Hollow Knight ").width + 8, 82);
    const m = state.save ? state.save.meta : null;
    const st = state.save ? state.save.stats : null;
    g.fillStyle = "#8d93a6";
    g.font = "400 20px Inter, sans-serif";
    g.fillText(m ? `${fmtTime(m.playTime)} ${t("de jeu")} · ${steel ? t("Âme d'acier") : t("mode classique")}` : t("Progression manuelle"), 62, 116);

    // Big percentage ring
    const total = SECTIONS.filter((s) => !s.extra).reduce((a, s) => a + sectionPct(s, sectionDone(s)), 0);
    const cx = W - 150, cy = 105, r = 70;
    g.lineWidth = 14;
    g.strokeStyle = "#262c3d";
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = total >= MAX_PERCENT ? "#f3c65a" : accent;
    g.beginPath(); g.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * total) / MAX_PERCENT); g.stroke();
    g.fillStyle = "#e9e6dc";
    g.textAlign = "center";
    g.font = "700 46px Cinzel, serif";
    g.fillText(String(total), cx, cy + 12);
    g.fillStyle = "#8d93a6";
    g.font = "400 16px Inter, sans-serif";
    g.fillText("/ 112 %", cx, cy + 36);
    g.textAlign = "left";

    // 112 grid
    const gx = 60, gy = 200, cell = 34, gap = 5, cols = 28;
    let idx = 0;
    for (const section of SECTIONS) {
      if (section.extra) continue;
      const pct = sectionPct(section, sectionDone(section));
      for (let i = 0; i < section.max; i++) {
        const x = gx + (idx % cols) * (cell + gap), y = gy + Math.floor(idx / cols) * (cell + gap);
        g.globalAlpha = i < pct ? 1 : 0.16;
        g.fillStyle = section.color;
        g.beginPath();
        g.roundRect ? g.roundRect(x, y, cell, cell, 6) : g.rect(x, y, cell, cell);
        g.fill();
        idx++;
      }
    }
    g.globalAlpha = 1;

    // Category list
    let lx = 60, ly = 395;
    const secs = SECTIONS.filter((s) => !s.extra);
    secs.forEach((section, i) => {
      const col = Math.floor(i / 5), row = i % 5;
      const x = lx + col * 370, y = ly + row * 34;
      const pct = sectionPct(section, sectionDone(section));
      g.fillStyle = section.color;
      g.beginPath(); g.arc(x + 6, y - 6, 6, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#cfd3de";
      g.font = "500 19px Inter, sans-serif";
      g.fillText(section.title.replace(/^DLC ?: /, ""), x + 22, y);
      g.fillStyle = pct === section.max ? section.color : "#e9e6dc";
      g.font = "700 19px Inter, sans-serif";
      g.textAlign = "right";
      g.fillText(`${pct}/${section.max}`, x + 330, y);
      g.textAlign = "left";
    });

    // Bottom stats
    if (st) {
      const items = [
        [t("Charmes"), `${st.charmsOwned}/40`], [t("Larves"), `${st.grubs}/46`], [t("Essences"), String(st.essence)],
        [t("Journal"), `${st.journal}/${st.journalTotal}`], ["Geo", String(st.geo)],
      ];
      items.forEach(([label, value], i) => {
        const x = 60 + i * 220, y = 600;
        g.fillStyle = "#8d93a6";
        g.font = "500 15px Inter, sans-serif";
        g.fillText(label.toUpperCase(), x, y);
        g.fillStyle = "#e9e6dc";
        g.font = "700 26px Inter, sans-serif";
        g.fillText(value, x, y + 32);
      });
    }
    g.fillStyle = "#5d6378";
    g.font = "400 14px Inter, sans-serif";
    g.textAlign = "right";
    g.fillText(location.host + location.pathname.replace(/index\.html$/, ""), W - 40, H - 22);
    return c;
  }

  async function shareRecap() {
    const canvas = await makeRecap();
    const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
    const file = new File([blob], "hollow-knight-progression.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] }) && window.matchMedia("(pointer: coarse)").matches) {
      try { await navigator.share({ files: [file], title: t("Ma progression Hollow Knight") }); return; } catch { /* fall back to download */ }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  /* --------------------------------- Events --------------------------------- */

  const drop = $("#drop");
  const input = $("#fileInput");

  async function pickFile() {
    if (window.showOpenFilePicker) {
      try {
        const [handle] = await window.showOpenFilePicker({ multiple: false });
        fileHandle = handle;
        await loadFile(await handle.getFile());
        return;
      } catch (e) {
        if (e.name === "AbortError") return;
      }
    }
    input.click();
  }

  drop.addEventListener("click", pickFile);
  drop.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pickFile(); } });
  input.addEventListener("change", () => { if (input.files[0]) loadFile(input.files[0]); input.value = ""; });

  ["dragenter", "dragover"].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach((t) => drop.addEventListener(t, () => drop.classList.remove("over")));
  drop.addEventListener("drop", async (e) => {
    e.preventDefault();
    const item = e.dataTransfer.items && e.dataTransfer.items[0];
    if (item && item.getAsFileSystemHandle) {
      try {
        const handle = await item.getAsFileSystemHandle();
        if (handle && handle.kind === "file") {
          fileHandle = handle;
          return loadFile(await handle.getFile());
        }
      } catch { /* fall back to plain file */ }
    }
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  });
  // Avoid the browser opening the file when dropped elsewhere.
  window.addEventListener("dragover", (e) => e.preventDefault());
  window.addEventListener("drop", (e) => e.preventDefault());

  if (window.showOpenFilePicker) $("#watchBtn").hidden = false;
  $("#watchBtn").addEventListener("click", async () => {
    if (watchTimer) return stopWatching();
    if (!fileHandle) {
      try {
        [fileHandle] = await window.showOpenFilePicker({ multiple: false });
        await loadFile(await fileHandle.getFile());
      } catch { return; }
    }
    startWatching(fileHandle);
    setStatus("Suivi en direct actif : la page se met à jour à chaque sauvegarde du jeu (banc, changement de zone…).", "ok");
  });

  $("#clearBtn").addEventListener("click", () => {
    if (state.save) {
      state.save = null;
      state.fresh.clear();
      state.news = null;
      LS.del("hk.save");
      LS.del("hk.news");
      LS.del("hk.history");
      LS.del("hk.lore");
      stopWatching();
      setStatus("Sauvegarde retirée. Mode manuel.", "");
    } else {
      if (!state.manual.size || confirm("Effacer toutes les cases cochées à la main ?")) {
        state.manual.clear();
        LS.set("hk.manual", []);
      }
    }
    render();
  });

  $("#sections").addEventListener("click", (e) => {
    const head = e.target.closest(".card-head");
    if (head) {
      const id = head.parentElement.id.slice(4);
      state.collapsed.has(id) ? state.collapsed.delete(id) : state.collapsed.add(id);
      LS.set("hk.collapsed", [...state.collapsed]);
      head.parentElement.classList.toggle("collapsed");
      head.setAttribute("aria-expanded", !state.collapsed.has(id));
      return;
    }
    const li = e.target.closest(".item");
    if (!li || e.target.closest("a")) return;
    if (state.save) {
      setStatus("Une sauvegarde est chargée : retirez-la pour cocher à la main.", "");
      return;
    }
    const id = li.dataset.id;
    state.manual.has(id) ? state.manual.delete(id) : state.manual.add(id);
    LS.set("hk.manual", [...state.manual]);
    render();
  });
  $("#sections").addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("card-head")) {
      e.preventDefault();
      e.target.click();
    }
  });

  $(".tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    state.tab = b.dataset.tab;
    LS.set("hk.tab", state.tab);
    render();
  });

  function goToSection(id) {
    state.tab = "list";
    LS.set("hk.tab", "list");
    state.collapsed.delete(id);
    LS.set("hk.collapsed", [...state.collapsed]);
    render();
    const card = document.getElementById("sec-" + id);
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "start" });
      card.classList.add("flash");
      setTimeout(() => card.classList.remove("flash"), 1600);
    }
  }
  $("#map").addEventListener("click", (e) => {
    const g = e.target.closest("[data-zone]");
    if (!g) return;
    state.mapZone = g.dataset.zone;
    LS.set("hk.mapZone", state.mapZone);
    renderMap();
    if (window.matchMedia("(max-width: 900px)").matches) $("#zoneDetail").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#map").addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.dataset && e.target.dataset.zone) {
      e.preventDefault();
      state.mapZone = e.target.dataset.zone;
      LS.set("hk.mapZone", state.mapZone);
      renderMap();
      const again = document.querySelector(`[data-zone="${state.mapZone}"]`);
      if (again) again.focus();
    }
  });

  $("#news").addEventListener("click", (e) => {
    if (e.target.closest("#newsClose")) {
      state.news = null;
      LS.del("hk.news");
      renderNews();
      return;
    }
    const b = e.target.closest("[data-sec]");
    if (b) goToSection(b.dataset.sec);
  });

  $("#optional").addEventListener("change", (e) => {
    state.optional = e.target.checked;
    LS.set("hk.optional", state.optional);
    render();
  });

  $("#panel-stats").addEventListener("click", async (e) => {
    if (e.target.closest("#recapBtn")) shareRecap();
    if (e.target.closest("#linkBtn")) {
      const url = shareLink();
      try { await navigator.clipboard.writeText(url); setStatus("🔗 Lien de partage copié dans le presse-papiers.", "ok"); }
      catch { prompt("Copiez ce lien :", url); }
    }
  });

  $("#panel-builds").addEventListener("click", (e) => {
    const c = state.save && state.save.charms;
    if (!c) return;
    const ch = e.target.closest("[data-charm]");
    if (ch) {
      const n = +ch.dataset.charm;
      state.build = state.build.includes(n) ? state.build.filter((x) => x !== n) : [...state.build, n];
      LS.set("hk.build", state.build);
      return renderBuilds();
    }
    if (e.target.closest("#buildCurrent")) { state.build = [...c.equipped]; LS.set("hk.build", state.build); return renderBuilds(); }
    if (e.target.closest("#buildClear")) { state.build = []; LS.set("hk.build", state.build); return renderBuilds(); }
    if (e.target.closest("#buildSave")) {
      if (!state.build.length) return;
      const name = prompt("Nom du build :", "Build " + (LS.get("hk.builds", []).length + 1));
      if (!name) return;
      const builds = LS.get("hk.builds", []);
      builds.push({ name: name.slice(0, 40), charms: state.build });
      LS.set("hk.builds", builds);
      return renderBuilds();
    }
    const ld = e.target.closest("[data-load]");
    if (ld) { state.build = [...LS.get("hk.builds", [])[+ld.dataset.load].charms]; LS.set("hk.build", state.build); return renderBuilds(); }
    const del = e.target.closest("[data-del]");
    if (del) { const b = LS.get("hk.builds", []); b.splice(+del.dataset.del, 1); LS.set("hk.builds", b); return renderBuilds(); }
  });

  $("#notifyToggle").addEventListener("change", async (e) => {
    state.notify = e.target.checked;
    LS.set("hk.notify", state.notify);
    if (state.notify && "Notification" in window && Notification.permission === "default") {
      try { await Notification.requestPermission(); } catch { /* ignore */ }
    }
    if (state.notify) chime();
  });

  $("#shareExit").addEventListener("click", () => {
    history.replaceState(null, "", location.pathname);
    location.reload();
  });

  // Offline support
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }

  $("#overview").addEventListener("click", (e) => {
    const b = e.target.closest("[data-sec]");
    if (b) goToSection(b.dataset.sec);
  });

  $(".seg").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    state.filter = b.dataset.filter;
    LS.set("hk.filter", state.filter);
    render();
  });

  $("#search").addEventListener("input", (e) => {
    state.query = e.target.value.trim().toLowerCase();
    render();
  });

  const english = $("#english");
  english.checked = state.english;
  english.addEventListener("change", () => {
    state.english = english.checked;
    LS.set("hk.english", state.english);
    render();
  });

  const spoilers = $("#spoilers");
  spoilers.checked = state.spoilers;
  spoilers.addEventListener("change", () => {
    state.spoilers = spoilers.checked;
    LS.set("hk.spoilers", state.spoilers);
    render();
  });

  document.querySelectorAll("code.copy").forEach((el) => {
    el.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(el.textContent);
        el.classList.add("copied");
        setTimeout(() => el.classList.remove("copied"), 1200);
      } catch { /* clipboard unavailable */ }
    });
  });

  if (location.hash === "#lore") {
    state.tab = "lore";
    history.replaceState(null, "", location.pathname);
  }
  const shared = readShareLink();
  if (shared) {
    state.shared = true;
    state.save = { done: shared.done, counters: {}, meta: shared.meta, stats: null, pctOverride: shared.pctOverride, journal: null };
    state.news = null;
  }
  $("#notifyToggle").checked = state.notify;
  document.querySelectorAll("[data-lang]").forEach((b) => {
    b.classList.toggle("on", window.HKI18n && b.dataset.lang === HKI18n.lang);
    b.addEventListener("click", () => window.HKI18n && HKI18n.setLang(b.dataset.lang));
  });

  if (state.save && !state.shared) {
    setStatus(`Dernière sauvegarde chargée le ${new Date(state.save.meta.loadedAt).toLocaleString("fr-FR")}. Rechargez-la pour mettre à jour.`, "");
  }
  render();
})();
