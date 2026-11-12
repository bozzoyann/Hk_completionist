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
    tab: LS.get("hk.tab", "progress"),
    progressView: LS.get("hk.progressView", "list"),
    notify: LS.get("hk.notify", false),
    mapZone: LS.get("hk.mapZone", null),
    mapMode: LS.get("hk.mapMode", "items"),
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
      // Same numbers as the game's journal screen
      let je = 0, jn = 0, jt = 146;
      for (const [k, type, de, dn, dt] of window.HKJournalRules || []) {
        const ok = type === 0 ? pd["killed" + k] === true : typeof pd["kills" + k] === "number" && pd["kills" + k] <= 0;
        if (ok) { je += de; jn += dn; jt += dt; }
      }
      stats.journal = je;
      stats.journalNotes = jn;
      stats.journalTotal = jt;
      stats.hunterMark = pd.hasHuntersMark === true;
    }
    // Charms: owned, costs, equipped
    const DEFAULT_COSTS = [0, 1, 1, 1, 2, 2, 2, 3, 2, 3, 1, 3, 1, 3, 1, 2, 2, 1, 2, 3, 2, 4, 2, 2, 2, 3, 1, 4, 2, 4, 1, 2, 3, 2, 4, 3, 5, 1, 3, 2, 2];
    const charms = { owned: [], costs: {}, equipped: Array.isArray(pd.equippedCharms) ? pd.equippedCharms : [], slots: pd.charmSlots || 3,
      royal: pd.royalCharmState || 0, grimmChild: pd.grimmChildLevel || 0,
      base: { nail: pd.nailDamage || 5, masks: pd.maxHealthBase || 5, reserve: pd.MPReserveMax || 0, f: pd.fireballLevel || 0, q: pd.quakeLevel || 0, s: pd.screamLevel || 0 } };
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
    // Geo rocks still holding Geo in visited rooms, by area
    const geoRockZones = {};
    for (const r of (raw.sceneData && raw.sceneData.geoRocks) || []) {
      if (r.hitsLeft > 0) {
        const z = sceneZone(r.sceneName); if (z) geoRockZones[z] = (geoRockZones[z] || 0) + 1;
      }
    }
    const seer = { d1: pd.dreamReward1 === true, d2: pd.dreamReward2 === true, d3: pd.dreamReward3 === true, c30: pd.gotCharm_30 === true, d5: pd.dreamReward5 === true,
      gate: pd.hasDreamGate === true, d6: pd.dreamReward6 === true, d7: pd.dreamReward7 === true, awoken: pd.dreamNailUpgraded === true, moth: pd.mothDeparted === true };
    const result = { done, counters, meta, stats, pctOverride, journal, charms, statues, shopFlags, relics, seer, geoRockZones, bankerTheft: pd.bankerTheft || 0,
      bank: pd.bankerAccountPurchased ? pd.bankerBalance || 0 : 0 };
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
      setStatus("", "");
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
    // Big drop zone without a save, compact bar with one
    const loaded = !!state.save;
    $("#loader").hidden = loaded;
    $("#saveBar").hidden = !loaded;
    $("#clearBtn").hidden = loaded;
    if (loaded && m) {
      const when = m.loadedAt ? new Date(m.loadedAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "";
      $("#saveFile").textContent = `📄 ${m.fileName || "Sauvegarde"}${m.version ? ` · v${m.version}` : ""}${when ? ` · ${when}` : ""}`;
    }

    for (const btn of document.querySelectorAll("#filterSeg button")) {
      btn.classList.toggle("on", btn.dataset.filter === state.filter);
    }

    const steel = !!(state.save && state.save.meta && state.save.meta.steelSoul);
    document.body.classList.toggle("steel", steel);
    $("#steelBadge").hidden = !steel;

    renderGrid();
    renderNews();
    renderTabs();
    $("#optional").checked = state.optional;
    if (state.tab === "progress" && state.progressView === "tree") renderTree();
    if (state.tab === "stats") renderStats();
    if (state.tab === "map") renderMap();
    if (state.tab === "journal") renderJournal();
    if (state.tab === "gods") renderGodhome();
    if (state.tab === "builds") renderBuilds();
    if (state.tab === "lore" && window.HKLoreView) HKLoreView.render();
    renderCoherence();
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
    // Sub views
    const sub = [["#progressView", "progressView", { list: "#view-list", tree: "#view-tree" }]];
    for (const [seg, key, views] of sub) {
      for (const b of document.querySelectorAll(seg + " button")) b.classList.toggle("on", b.dataset.view === state[key]);
      for (const [v, sel] of Object.entries(views)) $(sel).hidden = v !== state[key];
    }
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

  // Journal area codes -> map zones
  const JOURNAL_TO_MAP = {
    kingspass: "dirtmouth", dirtmouth: "dirtmouth", infected: "crossroads", crossroads: "crossroads", egg: "crossroads", ancestral: "crossroads",
    greenpath: "greenpath", stone: "greenpath", unn: "greenpath", overgrown: "fog", gardens: "gardens", fungalcore: "fungal", mantis: "fungal",
    fungal: "fungal", archives: "fog", fog: "fog", crystalmound: "peak", peak: "peak", sanctum: "city", spire: "city", love: "city", city: "city",
    isma: "waterways", junk: "waterways", waterways: "waterways", village: "deepnest", tramway: "deepnest", deepnest: "deepnest", basin: "basin",
    abyss: "abyss", edge: "edge", hive: "hive", colosseum: "colosseum", cliffs: "cliffs", resting: "resting", palace: "palace",
    godhome: "godhome", storms: "godhome", greyprince: "dirtmouth",
  };
  const ESSENCE_SOURCES = ["roots", "warriors"];
  // Essence given by each Warrior Dream and dream boss (first victory)
  const ESSENCE_AMOUNTS = {
    killedGhostAladar: 100, aladarSlugDefeated: 100, xeroDefeated: 100, elderHuDefeated: 100, mumCaterpillarDefeated: 150,
    noEyesDefeated: 200, galienDefeated: 200, markothDefeated: 250,
    falseKnightDreamDefeated: 300, mageLordDreamDefeated: 300, infectedKnightDreamDefeated: 400, whiteDefenderDefeated: 300, greyPrinceDefeated: 300,
  };
  const essenceOf = (it) => it.essence || ESSENCE_AMOUNTS[it.id] || 0;
  const DREAM_BOSSES = ["falseKnightDreamDefeated", "mageLordDreamDefeated", "infectedKnightDreamDefeated", "whiteDefenderDefeated", "greyPrinceDefeated"];


  // Map zone of a room, from its scene name
  const FOG_ROOMS = /^Fungus3_(0[123]|2[4-8]|30|35|44|47|archive)/;
  function sceneZone(scene) {
    if (/^Tutorial|^Town|^Room_(Town|shop|mapper|Bretta|Jinn|Sly)/i.test(scene)) return "dirtmouth";
    if (/^Crossroads/.test(scene)) return "crossroads";
    if (/^Fungus1_28|^Cliffs/.test(scene)) return "cliffs";
    if (/^Fungus1/.test(scene)) return "greenpath";
    if (/^Fungus2|^Room_Fungus_Shaman/.test(scene)) return "fungal";
    if (FOG_ROOMS.test(scene)) return "fog";
    if (/^Fungus3/.test(scene)) return "gardens";
    if (/^Ruins|^Room_(nailsmith|Mansion)/.test(scene)) return "city";
    if (/^Waterways|^GG_Pipeway|^Room_GG_Shortcut|^GG_Waterways/.test(scene)) return "waterways";
    if (/^Mines/.test(scene)) return "peak";
    if (/^RestingGrounds/.test(scene)) return "resting";
    if (/^Deepnest_East/.test(scene)) return "edge";
    if (/^Deepnest/.test(scene)) return "deepnest";
    if (/^Abyss_(06|08|09|10|12|15|16)/.test(scene)) return "abyss";
    if (/^Abyss/.test(scene)) return "basin";
    if (/^Hive/.test(scene)) return "hive";
    if (/^Room_Colosseum/.test(scene)) return "colosseum";
    if (/^White_Palace/.test(scene)) return "palace";
    if (/^GG_/.test(scene)) return "godhome";
    return null;
  }

  // Geo opportunities per map zone (community farming spots and places to earn Geo)
  const GEO_SPOTS = {
    greenpath: [["Chevaliers Moussus", "Bon spot de début de partie : de bonnes quantités de Geo par ennemi", "Moss_Knight"]],
    crossroads: [["Carcasses de la défense", "Ennemis solides qui lâchent beaucoup de Geo", "Husk_Guard"]],
    city: [["Salle au-dessus de la Station du Roi", "Spot de farm reconnu en milieu de partie", "King's_Station"],
      ["Lemm, le chercheur de reliques", "Vendez-lui vos reliques", "Relic_Seeker_Lemm"]],
    edge: [["Grands Sautilleurs, près du Colisée", "Spot de farm reconnu en fin de partie", "Great_Hopper"]],
    colosseum: [["Épreuve du Conquérant", "Entrée 450 Geo, environ 2 000 Geo par victoire", "Trial_of_the_Conqueror"]],
    fungal: [["Mangepatte", "Vend Avarice fragile : 20 à 100 % de Geo en plus sur les ennemis", "Leg_Eater"]],
  };

  // Uniform entries { name, sub, color, done, amount } for a zone in the current map mode
  function zoneEntries(zoneId, mode) {
    const strip = (n) => n.replace(/^#\d+ /, "");
    if (mode === "geo") {
      const out = [];
      const rocks = (state.save && state.save.geoRockZones && state.save.geoRockZones[zoneId]) || 0;
      if (rocks) out.push({ key: "rocks-" + zoneId, name: `${rocks} rocher${rocks > 1 ? "s" : ""} à Geo à casser`, sub: "Dans les salles déjà visitées", color: "#e8d9a8", done: false, weight: rocks, count: rocks, wiki: "Geo" });
      for (const [name, sub, wiki] of GEO_SPOTS[zoneId] || []) {
        let detail = sub;
        if (wiki === "Relic_Seeker_Lemm" && state.save && state.save.relics) {
          const value = state.save.relics.reduce((a, n, i) => a + n * HKFeatures.RELIC_VALUES[i], 0);
          const list = state.save.relics.map((n, i) => (n ? `${n} × ${HKFeatures.RELIC_NAMES[i]}` : "")).filter(Boolean).join(", ");
          if (value) detail = `Vos reliques valent ${value.toLocaleString("fr-FR")} Geo (${list})`;
        }
        if (wiki === "Leg_Eater" && state.save && state.save.charms && state.save.charms.owned.includes(24)) continue;
        out.push({ key: "spot-" + zoneId + name, name, sub: detail, color: "#f3c65a", done: false, weight: 3, wiki });
      }
      if (zoneId === "city" && state.save && state.save.bankerTheft >= 1 && state.save.bank > 0) {
        out.push({ key: "millibelle", name: "Millibelle, dans la Maison du Plaisir", sub: "Frappez-la pour récupérer votre Geo volé", color: "#f3c65a", done: false, weight: 3, wiki: "Millibelle" });
      }
      if (zoneId === "dirtmouth" && state.save && state.save.stats && state.save.stats.steelSoul && state.save.stats.rancidEggs) {
        out.push({ key: "jinn", name: "Jinn (Âme d'acier)", sub: `${state.save.stats.rancidEggs} oeuf(s) rance(s) à vendre, environ 290 à 449 Geo chacun`, color: "#f3c65a", done: false, weight: 3, wiki: "Steel_Soul_Jinn" });
      }
      return out;
    }
    if (mode === "journal") {
      const j = state.save && state.save.journal;
      if (!j) return [];
      const showNames = LS.get("hk.journalNames", true);
      const zonesOf = window.HKJournalZones || {};
      return (window.HKJournal || [])
        .filter((e) => (!e.opt || state.optional) && (zonesOf[e.k] || []).some((c) => JOURNAL_TO_MAP[c] === zoneId))
        .map((e) => {
          const [d, left] = j[e.k] || [0, e.n];
          const st = !d ? "unknown" : left > 0 ? "hunting" : "complete";
          return {
            key: e.k,
            wiki: ((window.HKI18n && HKI18n.lang === "en") ? e.fr : e.en).replace(/ /g, "_"),
            name: st === "unknown" && !showNames ? "???" : e.fr,
            sub: st === "unknown" ? `Pas encore rencontré · ${e.n} à vaincre` : st === "hunting" ? `Encore ${left} à vaincre (${e.n - left}/${e.n})` : "Notes complètes ✦",
            color: st === "complete" ? "#f3c65a" : "#ef8b8b",
            done: st === "complete",
          };
        });
    }
    if (mode === "essence") {
      const out = [];
      for (const s of SECTIONS) {
        for (const it of s.items || []) {
          const isSource = ESSENCE_SOURCES.includes(s.id) || DREAM_BOSSES.includes(it.id);
          if (!isSource || ITEM_ZONE[it.id] !== zoneId) continue;
          const amount = essenceOf(it);
          out.push({
            key: it.id,
            wiki: it.wiki,
            name: strip(it.name),
            sub: (s.id === "roots" ? "Racine de rêve" : s.id === "warriors" ? "Rêve de guerrier" : "Boss des rêves") + ` · ${amount} Essences`,
            color: s.color,
            done: isDone(it.id),
            amount,
          });
        }
      }
      return out;
    }
    return zoneItems(zoneId).map((e) => ({
      key: e.item.id,
      wiki: e.item.wiki,
      name: strip(e.item.name),
      sub: e.section.title.replace(/^DLC ?: /, "") + (e.item.hint ? " · " + e.item.hint : ""),
      color: e.section.color,
      done: isDone(e.item.id),
    }));
  }

  // Seer milestones (Essence) and what they give
  const SEER = [
    [100, "Sceau d'Hallownest", (pd) => pd.d1], [200, "Clairière des Esprits", (pd) => pd.d2], [300, "Minerai pâle", (pd) => pd.d3], [500, "Porteur de rêves", (pd) => pd.c30],
    [700, "Fragment de réceptacle", (pd) => pd.d5], [900, "Portail des Rêves", (pd) => pd.gate], [1200, "Oeuf arcanique", (pd) => pd.d6],
    [1500, "Éclat de masque", (pd) => pd.d7], [1800, "Aiguillon éveillé des rêves", (pd) => pd.awoken], [2400, "Derniers mots de la Voyante", (pd) => pd.moth],
  ];

  function renderEssenceBox() {
    const box = $("#essenceBox");
    if (state.mapMode !== "essence") { box.hidden = true; return; }
    box.hidden = false;
    const sv = state.save;
    if (!sv || !sv.seer) {
      box.innerHTML = `<p class="muted">Chargez une sauvegarde pour suivre votre Essence.</p>`;
      return;
    }
    const ess = sv.stats ? sv.stats.essence : 0;
    const next = SEER.find(([n, , f]) => !f(sv.seer));
    const sumLeft = (list) => list.filter((it) => !isDone(it.id)).reduce((a, it) => a + essenceOf(it), 0);
    const rootItems = SECTIONS.find((s) => s.id === "roots").items;
    const warriorItems = SECTIONS.find((s) => s.id === "warriors").items;
    const bossItems = DREAM_BOSSES.map(findItem).filter(Boolean);
    const rootsLeft = rootItems.filter((it) => !isDone(it.id));
    const rootEss = sumLeft(rootItems), warEss = sumLeft(warriorItems), bossEss = sumLeft(bossItems);
    const warriorsLeft = warriorItems.filter((it) => !isDone(it.id)).length;
    const bossesLeft = bossItems.filter((it) => !isDone(it.id)).length;
    const reachable = ess + rootEss + warEss + bossEss;
    const fmt = (n) => Number(n).toLocaleString("fr-FR");
    box.innerHTML = `
      <div class="ess-top">
        <div><small>Essence</small><strong>${fmt(ess)}</strong><em>${next ? (ess >= next[0] ? `palier ${fmt(next[0])} atteint : allez voir la Voyante !` : `encore ${fmt(next[0] - ess)} pour ${next[1]}`) : "toutes les récompenses obtenues ✦"}</em></div>
        <div><small>Racines de rêve restantes</small><strong>${rootsLeft.length}</strong><em>${fmt(rootEss)} Essences à récolter</em></div>
        <div><small>Rêves de guerriers restants</small><strong>${warriorsLeft}</strong><em>${fmt(warEss)} Essences à récolter</em></div>
        <div><small>Boss des rêves restants</small><strong>${bossesLeft}</strong><em>${fmt(bossEss)} Essences à récolter</em></div>
        <div><small>Essence atteignable</small><strong>${fmt(reachable)}</strong><em>${reachable >= 2400 ? "assez pour les 2 400 de la Voyante" : `il faudra ${fmt(2400 - reachable)} Essences d'ennemis`}</em></div>
      </div>
      <ol class="seer-track">${SEER.map(([n, label, f]) => {
        const got = f(sv.seer);
        const ready = !got && ess >= n;
        return `<li class="${got ? "got" : ready ? "ready" : ""}"><b>${fmt(n)}</b><span>${esc(label)}</span></li>`;
      }).join("")}</ol>
      <ul class="ess-tips">
        <li><b>Racines de rêve</b> : frappez chaque orbe avec l'Aiguillon des rêves pour tout récolter (482 Essences au total).</li>
        <li><b>Rêves de guerriers</b> : 1 100 Essences au total, de 100 (Gorb, Xero, Hu l'Ancien) à 250 (Markoth).</li>
        <li><b>Boss des rêves</b> : 300 à 400 Essences à la première victoire (Proche Disparu : 400).</li>
        <li><b>Ennemis</b> : 0,5 % de chance de lâcher 1 Essence (Aiguillon des rêves obtenu). 1 % avec Porteur de rêves, 2 % après avoir utilisé le Portail des Rêves (jusqu'à la prochaine Essence ramassée), 4 % avec les deux.</li>
        <li><b>Astuce</b> : à partir de 900 Essences, placez un Portail des Rêves près d'une zone pleine d'ennemis faibles, équipez Porteur de rêves et revenez-y après chaque Essence.</li>
      </ul>
      <p class="small muted">Valeurs tirées des guides et wikis de la communauté ; elles peuvent varier légèrement selon les sources.</p>`;
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
    const mode = state.mapMode || "items";
    for (const b of document.querySelectorAll("#mapMode button")) b.classList.toggle("on", b.dataset.mm === mode);
    renderEssenceBox();
    const zones = MAP_ZONES.map((z) => {
      const list = zoneEntries(z.id, mode);
      const done = list.filter((e) => e.done).length;
      const weight = list.reduce((a, e) => a + (e.weight || 0), 0);
      const count = list.reduce((a, e) => a + (e.count || 1), 0);
      return { ...z, list, done, total: list.length, weight, count, ratio: list.length ? done / list.length : 0 };
    });
    // Geo mode: brighter gold where there is more to earn
    const geoHeat = (w) => {
      if (!w) return "rgb(70,80,110)";
      const t = Math.min(1, w / 10);
      const a = [120, 105, 70], b = [243, 198, 90];
      return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
    };
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
      const col = mode === "geo" ? geoHeat(z.weight) : zoneColor(z.ratio);
      const sel = z.id === state.mapZone;
      const pct = Math.round(z.ratio * 100);
      const barW = z.w - 28;
      shapes += `<g class="zone${z.ratio >= 1 ? " full" : ""}${z.dream ? " dream" : ""}${sel ? " sel" : ""}" data-zone="${z.id}" style="--zc:${col}" tabindex="0" role="button" aria-label="${esc(z.name)} : ${z.done} sur ${z.total}">
        <rect class="zone-bg" x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="20"/>
        <rect class="zone-fill" x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="20" style="opacity:${mode === "geo" ? (z.weight ? 0.15 + Math.min(1, z.weight / 10) * 0.35 : 0.08) : 0.12 + z.ratio * 0.4}"/>
        <text class="zone-name" x="${z.x + 14}" y="${z.y + 26}">${wrapName(z.name, z.w).map((l, i) => `<tspan x="${z.x + 14}" dy="${i ? 17 : 0}">${esc(l)}</tspan>`).join("")}</text>
        ${z.sub ? `<text class="zone-sub" x="${z.x + 14}" y="${z.y + 26 + 16 * wrapName(z.name, z.w).length}">${esc(z.sub)}</text>` : ""}
        ${mode === "geo"
          ? `<text class="zone-pct" x="${z.x + z.w - 14}" y="${z.y + z.h - 16}" text-anchor="end">${z.total ? "◆ " + z.count : "—"}</text>`
          : `<text class="zone-pct" x="${z.x + z.w - 14}" y="${z.y + z.h - 22}" text-anchor="end">${z.total ? pct + "%" : "—"}</text>
        <text class="zone-count" x="${z.x + 14}" y="${z.y + z.h - 22}">${z.done}/${z.total}</text>
        <rect class="zone-track" x="${z.x + 14}" y="${z.y + z.h - 14}" width="${barW}" height="4" rx="2"/>
        <rect class="zone-bar" x="${z.x + 14}" y="${z.y + z.h - 14}" width="${barW * z.ratio}" height="4" rx="2"/>`}
      </g>`;
    }

    $("#map").innerHTML = `<svg viewBox="0 0 1000 700" role="img" aria-label="Carte d'Hallownest">
      <defs>
        <pattern id="mapDots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="rgba(255,255,255,.05)"/></pattern>
      </defs>
      <rect width="1000" height="700" fill="url(#mapDots)"/>
      ${links}${shapes}
    </svg>`;

    // Count each item / creature once, even if it appears in several zones
    const allKeys = new Map();
    for (const zz of zones) for (const e of zz.list) allKeys.set(e.key, allKeys.get(e.key) || e.done);
    const total = allKeys.size, totalDone = [...allKeys.values()].filter(Boolean).length;
    const full = zones.filter((z) => z.ratio >= 1).length;
    const unit = mode === "journal" ? "créatures" : mode === "essence" ? "sources d'Essence" : "objets";
    const active = zones.filter((z) => z.total);
    if (mode === "geo") {
      const rocks = Object.values((state.save && state.save.geoRockZones) || {}).reduce((a, n) => a + n, 0);
      $("#mapSummary").textContent = `${rocks} rochers à Geo à casser · ${active.length} zones intéressantes`;
    } else {
      $("#mapSummary").textContent = `${active.filter((z) => z.ratio >= 1).length} / ${active.length} zones complètes · ${totalDone} / ${total} ${unit}`;
    }

    const z = byId[state.mapZone];
    const missing = z.list.filter((e) => !e.done);
    const got = z.list.filter((e) => e.done);
    const row = (e, d) => `<li class="${d ? "done" : ""}" style="--c:${e.color}">
        <span class="zi-dot"></span>
        <div><b>${esc(e.name)}</b><small>${esc(e.sub)}</small></div>
        ${e.wiki && e.name !== "???" ? `<a class="zi-wiki" href="${wikiUrl(e.wiki)}" target="_blank" rel="noopener" title="Ouvrir le wiki">wiki ↗</a>` : ""}
      </li>`;
    const noData = mode !== "items" && mode !== "geo" && !(state.save && state.save.journal);
    $("#zoneDetail").innerHTML = `
      <div class="zd-head" style="--zc:${zoneColor(z.ratio)}">
        <h3>${esc(z.name)}</h3>
        <strong>${mode === "geo" ? "◆ " + z.count : `${z.done}/${z.total}`}</strong>
      </div>
      <div class="bar"><i style="width:${z.ratio * 100}%;background:${zoneColor(z.ratio)}"></i></div>
      ${noData ? `<p class="muted">Chargez une sauvegarde pour ce mode.</p>` : !z.total ? `<p class="muted">Rien à faire dans cette zone pour ce mode.</p>` : missing.length ? `<h4>${mode === "journal" ? "À chasser" : mode === "essence" ? "À récolter" : mode === "geo" ? "Pour gagner du Geo" : "À trouver"} (${missing.length})</h4><ul class="zone-items">${missing.map((e) => row(e, false)).join("")}</ul>` : `<p class="zd-done">Zone terminée ✦</p>`}
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
    const en = window.HKI18n && HKI18n.lang === "en";
    const AREAS = window.HKJournalAreas || {};
    const ZONES = window.HKJournalZones || {};
    const areaName = (c) => (AREAS[c] ? AREAS[c][en ? 1 : 0] : c);
    const all = window.HKJournal || [];
    const status = (e) => {
      const [d, left] = j[e.k] || [0, e.n];
      if (!d) return "unknown";
      return left > 0 ? "hunting" : "complete";
    };
    const main = all.filter((e) => !e.opt);
    const sst = state.save.stats || {};
    const found = sst.journal ?? main.filter((e) => status(e) !== "unknown").length;
    const complete = sst.journalNotes ?? main.filter((e) => status(e) === "complete").length;
    const totalEntries = sst.journalTotal ?? main.length;
    const mark = state.save.stats && state.save.stats.hunterMark;
    const f = state.journalFilter || "all";
    const q = state.journalQuery || "";
    const showUnknown = LS.get("hk.journalNames", true);
    const byZone = LS.get("hk.journalByZone", false);

    const visible = (e) => {
      const st = status(e);
      if (f !== "all" && f !== st) return false;
      const zones = (ZONES[e.k] || []).map(areaName).join(" ");
      return !q || (e.fr + " " + e.en + " " + zones).toLowerCase().includes(q);
    };
    const row = (e, withZones = true) => {
      const st = status(e);
      const [, left] = j[e.k] || [0, e.n];
      const done = Math.max(0, e.n - left);
      const hidden = st === "unknown" && !showUnknown;
      const name = hidden ? "???" : e.fr;
      const zones = (ZONES[e.k] || []).map(areaName).join(" · ");
      const count = st === "complete" ? "✦" : e.n ? `${st === "unknown" ? 0 : done}/${e.n}` : "";
      return `<li class="jr ${st}">
        <i class="jr-dot"></i>
        <span class="jr-name"><b>${esc(name)}</b>${!hidden && state.english && e.en !== e.fr ? `<small>${esc(e.en)}</small>` : ""}</span>
        ${withZones ? `<span class="jr-zone" title="${esc(zones)}">${esc(zones)}</span>` : ""}
        <span class="jr-count" title="${st === "hunting" ? `Encore ${left} à vaincre` : ""}">${count}</span>
        ${st === "hunting" && e.n ? `<span class="jr-bar"><i style="width:${(done / e.n) * 100}%"></i></span>` : ""}
      </li>`;
    };
    const list = (entries) => {
      const shown = entries.filter(visible);
      if (!shown.length) return `<p class="muted small">Aucune créature avec ce filtre.</p>`;
      if (!byZone) return `<ul class="jlist">${shown.map((e) => row(e)).join("")}</ul>`;
      const groups = new Map();
      for (const e of shown) {
        const z = (ZONES[e.k] || ["?"])[0];
        if (!groups.has(z)) groups.set(z, []);
        groups.get(z).push(e);
      }
      return [...groups.entries()].sort((a, b) => areaName(a[0]).localeCompare(areaName(b[0]))).map(([z, es]) => {
        const left = es.filter((e) => status(e) !== "complete").length;
        return `<section class="jgroup"><h4>${esc(areaName(z))} <small>${left ? `${left} à compléter` : "✦"}</small></h4><ul class="jlist">${es.map((e) => row(e, false)).join("")}</ul></section>`;
      }).join("");
    };

    el.innerHTML = `
      <div class="journal-head compact">
        <div class="jh-stat"><strong>${found}<small>/${totalEntries}</small></strong><span>entrées découvertes</span></div>
        <div class="jh-stat"><strong>${complete}<small>/${totalEntries}</small></strong><span>notes complètes</span></div>
        <div class="jh-stat ${mark ? "ok" : ""}"><strong>${mark ? "✦" : "–"}</strong><span>${mark ? "Marque du chasseur obtenue" : "Marque du chasseur"}</span></div>
      </div>
      <div class="toolbar journal-tools">
        <input type="search" id="journalSearch" placeholder="Rechercher une créature ou une zone…" value="${esc(q)}" autocomplete="off">
        <div class="seg" id="journalSeg">
          ${[["all", "Toutes"], ["unknown", "À découvrir"], ["hunting", "À chasser"], ["complete", "Complètes"]].map(([k, l]) => `<button data-jf="${k}" class="${f === k ? "on" : ""}">${l}</button>`).join("")}
        </div>
        <label class="toggle"><input type="checkbox" id="journalByZone" ${byZone ? "checked" : ""}> Grouper par zone</label>
        <label class="toggle"><input type="checkbox" id="journalNames" ${showUnknown ? "checked" : ""}> Noms des créatures non rencontrées</label>
      </div>
      ${list(main)}
      ${state.optional ? `<h3 class="journal-sub">Entrées supplémentaires <small class="muted">ne comptent pas pour la Marque du chasseur</small></h3>${list(all.filter((e) => e.opt))}` : ""}`;

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
    $("#journalByZone").addEventListener("change", (e) => { LS.set("hk.journalByZone", e.target.checked); renderJournal(); });
    $("#journalNames").addEventListener("change", (e) => { LS.set("hk.journalNames", e.target.checked); renderJournal(); });
  }

  /* ------------------------------ Coherence check ------------------------------ */

  function renderCoherence() {
    const el = $("#coherence");
    const m = state.save && state.save.meta;
    if (!m || m.gamePct === null || m.gamePct === undefined) { el.hidden = true; return; }
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


  // Stats of a build, from the save's base values and the equipped charms
  function buildStats(c, build) {
    const has = (n) => build.includes(n);
    const b = c.base || {};
    const nail = b.nail || 5;
    const strength = has(25) ? 1.5 : 1;
    const masksBase = (b.masks || 5) + (has(23) ? 2 : 0);
    const joni = has(27);
    const lifeblood = (has(8) ? 2 : 0) + (has(9) ? 4 : 0) + (joni ? Math.round(masksBase * 1.4) : 0);
    const shaman = has(19);
    const spells = [];
    if (b.f >= 1) spells.push([b.f >= 2 ? "Âme d'ombre" : "Esprit vengeur", b.f >= 2 ? 30 : 15, b.f >= 2 ? 40 : 20]);
    if (b.q >= 1) spells.push([b.q >= 2 ? "Ténèbres descendantes" : "Élan ravageur", b.q >= 2 ? 60 : 35, b.q >= 2 ? 88 : 53]);
    if (b.s >= 1) spells.push([b.s >= 2 ? "Cri des abysses" : "Spectres hurleurs", b.s >= 2 ? 80 : 39, b.s >= 2 ? 120 : 60]);
    const dec = (x) => (Number.isInteger(x) ? String(x) : x.toFixed(2).replace(/0$/, "").replace(".", ","));
    const rows = [
      ["Dégâts de l'aiguillon", String(nail), dec(nail * strength) + (has(6) ? ` (${dec(nail * (strength + 0.75))} à 1 masque)` : "")],
      ["Portée de l'aiguillon", "100 %", Math.round((has(13) && has(18) ? 1.4 : has(13) ? 1.25 : has(18) ? 1.15 : 1) * 100) + " %"],
      ["Délai entre deux attaques", "0,41 s", has(32) ? "0,25 s" : "0,41 s"],
      ["Masques", String(b.masks || 5), joni ? "convertis en sang-de-vie" : String(masksBase)],
      ["Masques sang-de-vie", "0", String(lifeblood)],
      ["Âme par coup", "11", String(11 + (has(20) ? 3 : 0) + (has(21) ? 8 : 0))],
      ["Âme par coup (réserve)", "6", String(6 + (has(20) ? 2 : 0) + (has(21) ? 6 : 0))],
      ["Âme quand vous êtes touché", "0", has(3) ? (has(35) ? "25" : "15") : "0"],
      ["Coût d'un sort", "33", has(33) ? "24" : "33"],
      ["Soin par Canalisation", "1 masque", joni ? "aucun" : has(34) ? "2 masques" : "1 masque"],
      ["Vitesse de Canalisation", "normale", joni ? "—" : has(7) && has(34) ? "presque normale" : has(7) ? "≈ 33 % plus rapide" : has(34) ? "plus lente" : "normale"],
      ["Recharge du dash", "0,6 s", has(31) ? "0,4 s" : "0,6 s"],
      ["Vitesse de course", "8,3", has(37) ? (has(31) ? "11,5" : "10") : "8,3"],
      ["Invulnérabilité après un coup", "1,3 s", has(4) ? "1,75 s" : "1,3 s"],
      ["Charge des Arts de l'Aiguillon", "1,35 s", has(26) ? "0,75 s" : "1,35 s"],
    ];
    for (const [name, base, boosted] of spells) rows.push([name, String(base), String(shaman ? boosted : base)]);
    return rows;
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
      <div class="build-stats">
        <div class="bs-table">
          <h3 class="journal-sub">Caractéristiques</h3>
          <table><thead><tr><th></th><th>Sans charme</th><th>Avec ce build</th></tr></thead><tbody>
            ${buildStats(c, state.build).map(([k, a, v]) => `<tr class="${a !== v ? "chg" : ""}"><th>${esc(k)}</th><td>${esc(a)}</td><td>${esc(v)}</td></tr>`).join("")}
          </tbody></table>
        </div>
        <div class="bs-fx">
          <h3 class="journal-sub">Effets du build</h3>
          ${state.build.length ? `<ul>${state.build.map((n) => `<li><b>${esc(charmLabel(n, c))}</b><span>${esc((HKFeatures.CHARM_FX[n] || ["", ""])[window.HKI18n && HKI18n.lang === "en" ? 1 : 0])}</span></li>`).join("")}</ul>` : `<p class="muted small">Aucun Charme dans ce build.</p>`}
        </div>
      </div>
      ${builds.length ? `<h3 class="journal-sub">Mes builds</h3><div class="saved-builds">${builds.map((b, i) => `<div class="saved"><button class="link" data-load="${i}">${esc(b.name)}</button><small>${b.charms.map((n) => esc(charmLabel(n, c))).join(", ")}</small><button class="x" data-del="${i}" aria-label="Supprimer">✕</button></div>`).join("")}</div>` : ""}
      <h3 class="journal-sub">Vos Charmes (${c.owned.length}/40)</h3>
      <div class="charm-grid">${c.owned.map((n) => `<button class="charm${state.build.includes(n) ? " in" : ""}" data-charm="${n}" title="${esc((HKFeatures.CHARM_FX[n] || ["", ""])[window.HKI18n && HKI18n.lang === "en" ? 1 : 0])}">
        <b>${esc(charmLabel(n, c))}</b><small>${esc((HKFeatures.CHARM_FX[n] || ["", ""])[window.HKI18n && HKI18n.lang === "en" ? 1 : 0])}</small><span class="cost">${pips(c.costs[n])}</span></button>`).join("")}</div>
      <p class="small muted">Valeurs tirées du code du jeu (vitesses, portée, Âme) et du wiki de la communauté (dégâts de la Force, de la Fureur et des sorts, Bénédiction de Joni).</p>`;
  }

  /* -------------------------------- Geo budget -------------------------------- */

  function geoBudget() {
    const sv = state.save;
    const isDoneShop = (it) => (it.flag ? !!(sv.shopFlags && sv.shopFlags[it.flag]) : isDone(it.id));
    const remaining = (list) => list.map((g) => ({ shop: g.shop, items: g.items.filter((it) => !isDoneShop(it)) })).filter((g) => g.items.length);
    const sum = (gs) => gs.reduce((a, g) => a + g.items.reduce((b, it) => b + it.geo, 0), 0);
    const groups = remaining(HKFeatures.SHOP);
    const need = sum(groups);
    const optGroups = remaining(HKFeatures.SHOP_OPTIONAL || []);
    const needOpt = sum(optGroups);
    const relicGeo = (sv.relics || [0, 0, 0, 0]).reduce((a, n, i) => a + n * HKFeatures.RELIC_VALUES[i], 0);
    const have = (sv.stats ? sv.stats.geo : 0) + (sv.bank || 0);
    return { groups, need, optGroups, needOpt, relicGeo, have };
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
      <div class="recap-row"><button class="btn" id="recapBtn">⇩ Image récapitulative à partager</button></div>
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
        const missingAll = Math.max(0, b.need + b.needOpt - b.have);
        const detail = (gs) => `<ul class="budget-list">${gs.map((g) => `<li><b>${esc(g.shop)}</b><span>${g.items.map((it) => `${esc(it.label)} <i>${fmt(it.geo)}</i>`).join(" · ")}</span></li>`).join("")}</ul>`;
        return `<div class="budget">
          <div class="budget-head">
            <div><small>Budget en Geo pour le 112 %</small><strong>${fmt(b.need)} Geo</strong><em>restent à dépenser en achats nécessaires</em></div>
            <div><small>Disponible</small><strong>${fmt(b.have)} Geo</strong><em>en poche${state.save.bank ? " et à la banque" : ""}</em></div>
            <div><small>Reliques à vendre</small><strong>${fmt(b.relicGeo)} Geo</strong><em>chez Lemm</em></div>
            <div class="${missing ? "warn" : "ok"}"><small>${missing ? "Il manque" : "Verdict"}</small><strong>${missing ? fmt(Math.max(0, missing - b.relicGeo)) + " Geo" : "Ça suffit ✦"}</strong><em>${missing ? (missing <= b.relicGeo ? "en vendant vos reliques, c'est bon" : "après la vente des reliques") : "pas besoin de farmer"}</em></div>
          </div>
          ${b.groups.length ? `<details><summary>Détail des achats restants</summary>${detail(b.groups)}</details>` : ""}
          <p class="small"><button class="link-btn" id="toGeoMap">Où gagner du Geo ? Voir la carte en mode Geo →</button></p>
          ${b.optGroups.length ? `<div class="budget-opt">
            <div><small>Achats optionnels (complétion totale)</small><strong>${fmt(b.needOpt)} Geo</strong><em>Charmes incassables de Divine, emplacements et bénédiction de Salubra</em></div>
            <div class="${missingAll ? "warn" : "ok"}"><small>${missingAll ? "Il manque, avec ces achats" : "Avec ces achats"}</small><strong>${missingAll ? fmt(Math.max(0, missingAll - b.relicGeo)) + " Geo" : "Ça suffit ✦"}</strong><em>${missingAll ? (missingAll <= b.relicGeo ? "en vendant vos reliques, c'est bon" : "après la vente des reliques") : "tout est payable"}</em></div>
          </div>
          <details><summary>Détail des achats optionnels</summary>${detail(b.optGroups)}</details>` : ""}
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
  window.addEventListener("drop", (e) => {
    e.preventDefault();
    if (e.target.closest && e.target.closest("#drop")) return;
    const file = e.dataTransfer && e.dataTransfer.files[0];
    if (file) loadFile(file);
  });

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

  $("#removeBtn").addEventListener("click", () => {
    state.save = null;
    state.fresh.clear();
    state.news = null;
    LS.del("hk.save");
    LS.del("hk.news");
    LS.del("hk.history");
    LS.del("hk.lore");
    stopWatching();
    setStatus("Sauvegarde retirée. Mode manuel.", "");
    render();
  });
  $("#reloadBtn").addEventListener("click", pickFile);

  $("#clearBtn").addEventListener("click", () => {
    if (!state.manual.size || confirm("Effacer toutes les cases cochées à la main ?")) {
      state.manual.clear();
      LS.set("hk.manual", []);
    }
    render();
  });

  // Settings popover
  const settings = $("#settings");
  $("#settingsBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    settings.hidden = !settings.hidden;
    $("#settingsBtn").setAttribute("aria-expanded", String(!settings.hidden));
  });
  document.addEventListener("click", (e) => {
    if (!settings.hidden && !e.target.closest("#settings")) {
      settings.hidden = true;
      $("#settingsBtn").setAttribute("aria-expanded", "false");
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !settings.hidden) { settings.hidden = true; $("#settingsBtn").focus(); }
  });

  // Sub views (Progression: list / tree)
  for (const [seg, key] of [["#progressView", "progressView"]]) {
    $(seg).addEventListener("click", (e) => {
      const b = e.target.closest("[data-view]");
      if (!b) return;
      state[key] = b.dataset.view;
      LS.set("hk." + key, state[key]);
      render();
    });
  }

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
    state.tab = "progress";
    state.progressView = "list";
    LS.set("hk.tab", "progress");
    LS.set("hk.progressView", "list");
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
  $("#mapMode").addEventListener("click", (e) => {
    const b = e.target.closest("[data-mm]");
    if (!b) return;
    state.mapMode = b.dataset.mm;
    LS.set("hk.mapMode", state.mapMode);
    state.mapZone = null;
    renderMap();
  });

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
    if (e.target.closest("#toGeoMap")) {
      state.tab = "map";
      state.mapMode = "geo";
      LS.set("hk.tab", "map");
      LS.set("hk.mapMode", "geo");
      render();
      window.scrollTo({ top: $(".tabs").offsetTop - 10, behavior: "smooth" });
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


  // Offline support
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }

  $("#overview").addEventListener("click", (e) => {
    const b = e.target.closest("[data-sec]");
    if (b) goToSection(b.dataset.sec);
  });

  $("#filterSeg").addEventListener("click", (e) => {
    const b = e.target.closest("[data-filter]");
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
  // Tabs saved by older versions
  const OLD_TABS = { list: ["progress", "list"], tree: ["progress", "tree"], achievements: ["gods"], godhome: ["gods"], challenges: ["gods"] };
  if (OLD_TABS[state.tab]) {
    const [tab, view] = OLD_TABS[state.tab];
    state.tab = tab;
    if (view) state.progressView = view;
  }
  if (!document.getElementById("panel-" + state.tab)) state.tab = "progress";
  if (/#p=/.test(location.hash)) history.replaceState(null, "", location.pathname);
  $("#notifyToggle").checked = state.notify;
  if (window.HK_VERSION) {
    const v = HK_VERSION;
    const date = new Date(v.date + "T12:00:00").toLocaleDateString(window.HKI18n && HKI18n.lang === "en" ? "en-GB" : "fr-FR");
    $("#siteVersion").textContent = `v${v.n} · ${date}`;
    $("#footerVersion").textContent = `Version ${v.n} du ${date}`;
  }
  document.querySelectorAll("[data-lang]").forEach((b) => {
    b.classList.toggle("on", window.HKI18n && b.dataset.lang === HKI18n.lang);
    b.addEventListener("click", () => window.HKI18n && HKI18n.setLang(b.dataset.lang));
  });

  render();
})();
