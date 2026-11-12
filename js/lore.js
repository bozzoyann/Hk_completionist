(function () {
  "use strict";

  const { QUESTS, REVELATIONS, NODES, LINKS, test, pick } = HKLore;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const wiki = (p) => "https://hollowknight.wiki/w/" + encodeURIComponent(p);
  const LS = {
    get(k, f) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch { return f; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
  };

  let pd = LS.get("hk.lore", null);
  let reveal = LS.get("hk.loreReveal", false);
  const opened = new Set();
  let selected = "knight";

  function renderWeb(data) {
    const known = (n) => n.always || n.when.some((s) => test(data, s));
    const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));
    let lines = "", labels = "", nodes = "";
    for (const [a, b, label] of LINKS) {
      const A = byId[a], B = byId[b];
      const both = known(A) && known(B);
      lines += `<line class="wl${both ? " on" : ""}" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" style="--c:${B.color}"/>`;
      if (both) {
        const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
        labels += `<g class="wlabel" transform="translate(${mx},${my})"><rect x="${-label.length * 3.4 - 8}" y="-11" width="${label.length * 6.8 + 16}" height="20" rx="10"/><text y="4">${esc(label)}</text></g>`;
      }
    }
    for (const n of NODES) {
      const k = known(n);
      nodes += `<g class="wn${k ? " on" : ""}${n.id === selected ? " sel" : ""}" data-node="${n.id}" transform="translate(${n.x},${n.y})" style="--c:${n.color}" tabindex="0" role="button" aria-label="${k ? esc(n.name) : "Personnage inconnu"}">
        <circle class="wn-glow" r="34"/>
        <circle class="wn-dot" r="25"/>
        <text class="wn-glyph" y="8">${k ? n.glyph : "?"}</text>
        <text class="wn-name" y="48">${k ? esc(n.name) : "???"}</text>
      </g>`;
    }
    $("#web").innerHTML = `<svg viewBox="0 0 900 560" role="img" aria-label="Toile des personnages">
      <defs><radialGradient id="webBg" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#1c2340"/><stop offset="1" stop-color="#0d1019" stop-opacity="0"/></radialGradient></defs>
      <rect width="900" height="560" fill="url(#webBg)"/>${lines}${labels}${nodes}</svg>`;
    const n = byId[selected];
    const k = known(n);
    $("#webCard").innerHTML = k
      ? `<div class="wc-glyph" style="--c:${n.color}">${n.glyph}</div><div><h3>${esc(n.name)}</h3><p class="${reveal || opened.has("node-" + n.id) ? "" : "blur"}" data-reveal="node-${n.id}" title="Cliquer pour lire">${esc(n.text)}</p></div>`
      : `<div class="wc-glyph">?</div><div><h3>Personnage inconnu</h3><p class="muted">Continuez votre exploration pour le découvrir.</p></div>`;
    const count = NODES.filter(known).length;
    $("#webCount").textContent = `${count} / ${NODES.length} personnages révélés`;
  }

  function setSource() {
    const save = LS.get("hk.save", null);
    const el = $("#loreSource");
    if (!pd) {
      el.textContent = "Aucune sauvegarde chargée : chargez-en une ici ou sur le tracker.";
      el.className = "status";
    } else {
      el.textContent = "✔ Données de " + (save && save.meta && save.meta.fileName ? save.meta.fileName : "votre sauvegarde") +
        (save && save.meta && save.meta.loadedAt ? ", chargée le " + new Date(save.meta.loadedAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "");
      el.className = "status ok";
    }
  }

  function render() {
    const data = pd || {};
    renderWeb(data);
    $("#reveals").innerHTML = REVELATIONS.map((r) => {
      const ok = r.all ? r.when.every((s) => test(data, s)) : r.when.some((s) => test(data, s));
      const clear = reveal || opened.has(r.id);
      return `<article class="reveal ${ok ? "on" : "off"}">
        <header><h3>${esc(r.title)}</h3><span>${ok ? "Découvert" : "Verrouillé"}</span></header>
        ${ok
          ? `<p class="reveal-text ${clear ? "" : "blur"}" data-reveal="${r.id}" title="${clear ? "" : "Cliquer pour lire"}">${esc(r.text)}</p>`
          : `<p class="reveal-lock">◌ ${esc(r.lock)}</p>`}
        <a class="small" href="${wiki(r.wiki)}" target="_blank" rel="noopener">En savoir plus sur le wiki ↗</a>
      </article>`;
    }).join("");

    $("#quests").innerHTML = QUESTS.map((q) => {
      const done = q.steps.filter((s) => test(data, s)).length;
      const ratio = done / q.steps.length;
      return `<article class="quest${ratio === 1 ? " full" : ""}" style="--c:${q.color}">
        <header>
          <h3>${esc(q.name)}</h3>
          <strong>${done}/${q.steps.length}</strong>
        </header>
        <p class="quest-intro">${esc(q.intro)}</p>
        <div class="bar"><i style="width:${ratio * 100}%"></i></div>
        <ol class="quest-steps">
          ${q.steps.map((s) => `<li class="${test(data, s) ? "done" : ""}"><span></span>${esc(s.label)}</li>`).join("")}
        </ol>
        <a class="small" href="${wiki(q.wiki)}" target="_blank" rel="noopener">Dialogues et détails sur le wiki ↗</a>
      </article>`;
    }).join("");
  }

  const pickNode = (id) => { selected = id; render(); };
  $("#web").addEventListener("click", (e) => {
    const g = e.target.closest("[data-node]");
    if (g) pickNode(g.dataset.node);
  });
  $("#web").addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.dataset && e.target.dataset.node) { e.preventDefault(); pickNode(e.target.dataset.node); }
  });
  $("#webCard").addEventListener("click", (e) => {
    const p = e.target.closest("[data-reveal]");
    if (p) { opened.add(p.dataset.reveal); render(); }
  });

  $("#reveals").addEventListener("click", (e) => {
    const p = e.target.closest("[data-reveal]");
    if (!p) return;
    opened.add(p.dataset.reveal);
    render();
  });

  const toggle = $("#spoilerToggle");
  toggle.checked = reveal;
  toggle.addEventListener("change", () => {
    reveal = toggle.checked;
    LS.set("hk.loreReveal", reveal);
    render();
  });

  $("#loreFile").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const raw = HKSave.decodeSave(await file.arrayBuffer());
      pd = pick(raw.playerData || raw);
      LS.set("hk.lore", pd);
      setSource();
      $("#loreSource").textContent = "✔ " + file.name + " chargé";
      render();
    } catch (err) {
      $("#loreSource").textContent = "✖ Impossible de lire la sauvegarde : " + err.message;
      $("#loreSource").className = "status err";
    }
    e.target.value = "";
  });

  setSource();
  render();
})();
