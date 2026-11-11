(function () {
  "use strict";

  const { SECTIONS, sectionPercent, MAX_PERCENT } = HKData;
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
    return { done, counters, meta };
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
      card.className = "card" + (section.extra ? " extra" : "");
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
            <h2>${esc(section.title)}</h2>
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
