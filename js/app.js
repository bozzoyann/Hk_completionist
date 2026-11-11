(function () {
  "use strict";

  const { SECTIONS, sectionPercent, MAX_PERCENT } = HKData;
  const { TREE, COLORS, MAP_ZONES, MAP_LINKS, ITEM_ZONE } = HKExtras;
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
    mapZone: LS.get("hk.mapZone", null),
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
    let stats = null;
    try { stats = HKExtras.computeStats(raw); } catch (e) { console.warn(e); }
    return { done, counters, meta, stats };
  }

  async function loadBuffer(buffer, label) {
    try {
      const raw = HKSave.decodeSave(buffer);
      if (!raw || !(raw.playerData || raw.geo !== undefined)) throw new Error("ce fichier ne ressemble pas à une sauvegarde Hollow Knight");
      const result = evaluate(raw);
      result.meta.fileName = label;
      const sameFile = state.save && state.save.meta && state.save.meta.fileName === label;
      const prev = sameFile ? new Set(state.save.done) : null;
      state.fresh = new Set(prev ? result.done.filter((id) => !prev.has(id)) : []);
      state.save = result;
      LS.set("hk.save", result);
      setStatus(`✔ ${label} chargé (version ${result.meta.version}) à ${new Date().toLocaleTimeString("fr-FR")}` +
        (state.fresh.size && prev ? ` · ${state.fresh.size} nouveauté(s) !` : ""), "ok");
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

      const pct = sectionPercent(section, doneCount);
      total += pct;
      const complete = section.items ? doneCount === count : false;
      card.classList.toggle("complete", complete);

      const progress = section.items ? doneCount / count : 0;
      card.innerHTML = `
        <header class="card-head" tabindex="0" role="button" aria-expanded="${!state.collapsed.has(section.id)}">
          <span class="sec-icon" aria-hidden="true">${section.icon || "•"}</span>
          <div class="sec-title">
            <h2>${esc(section.title.replace(/^DLC : /, ""))}${section.dlc ? ` <span class="badge">DLC</span>` : ""}</h2>
            ${section.desc ? `<p>${esc(section.desc)}</p>` : ""}
          </div>
          <div class="sec-score">
            ${section.items ? `<b>${doneCount}/${count}</b>` : ""}
            ${section.extra ? `<small>hors %</small>` : `<small>${pct} / ${section.max} %</small>`}
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

    renderGrid();
    renderTabs();
    if (state.tab === "tree") renderTree();
    if (state.tab === "stats") renderStats();
    if (state.tab === "map") renderMap();
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
      const pct = sectionPercent(section, sectionDone(section));
      const label = section.title.replace(/^DLC : /, "");
      for (let i = 0; i < section.max; i++) {
        cells += `<button class="cell${i < pct ? " on" : ""}" style="--c:${section.color}" data-sec="${section.id}" title="${esc(label)} : ${pct}/${section.max} %"></button>`;
      }
      leg += `<button class="leg${pct === section.max ? " full" : ""}" style="--c:${section.color}" data-sec="${section.id}"><i></i>${esc(label)} <b>${pct}/${section.max}</b></button>`;
    }
    grid.innerHTML = cells;
    legend.innerHTML = leg;
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
        <div><b>${esc(e.item.name.replace(/^#\d+ /, ""))}</b><small>${esc(e.section.title.replace(/^DLC : /, ""))}${e.item.hint ? " · " + esc(e.item.hint) : ""}</small></div>
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
        ${card("☰", "Journal du chasseur", st.journal + " / " + st.journalTotal, "créatures rencontrées", "#ef8b8b")}
        ${card("⌂", "Salles visitées", fmt(st.rooms), "", "#7fd8e8")}
        ${card("◈", "Reliques en poche", st.relics, `${st.relicsSold} vendue(s) à Lemm`, "#c9b88f")}
        ${card("◍", "Oeufs rances", st.rancidEggs, `${st.eggsSold} vendu(s) à Jinn`, "#a3a9bb")}
        ${card("♛", "Zote le Prince Gris", st.greyPrince + " / 10", "victoires", "#f39a5a")}
        ${card("❖", "Protecteur Blanc", st.whiteDefender + " / 5", "victoires", "#f4efe6")}
        ${card("❀", "Fleur délicate", st.flowerBroken ? st.flowerBroken + " fois brisée" : "Jamais brisée", "", "#ffb3c7")}
      </div>
      <div class="equipped">
        <small>Charmes équipés</small>
        <div>${st.equipped.length ? st.equipped.map((c) => `<span>${esc(c)}</span>`).join("") : `<span class="muted">Aucun</span>`}</div>
      </div>
      <p class="small muted">Le jeu n'enregistre pas le nombre de morts : seule la position de votre ombre (votre dernière mort) est connue.</p>`;
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
      LS.del("hk.save");
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

  if (state.save) {
    setStatus(`Dernière sauvegarde chargée le ${new Date(state.save.meta.loadedAt).toLocaleString("fr-FR")}. Rechargez-la pour mettre à jour.`, "");
  }
  render();
})();
