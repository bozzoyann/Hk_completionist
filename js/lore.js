/* Lore tab: NPC quests and encounters tracked from the save. */
(function () {
  "use strict";

  const { QUESTS, test } = HKLore;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const wiki = (p) => "https://hollowknight.wiki/w/" + encodeURIComponent(p);
  const read = (k) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } };

  function render() {
    const pd = read("hk.lore");
    $("#loreEmpty").hidden = !!pd;
    const data = pd || {};
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

  window.HKLoreView = { render };
})();
