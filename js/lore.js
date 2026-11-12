(function () {
  "use strict";

  const { QUESTS, REVELATIONS, test, pick } = HKLore;
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
