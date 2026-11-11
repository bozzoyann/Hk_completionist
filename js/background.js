/*
 * Animated background: drifting soul motes, a few lumaflies and slow fog,
 * drawn on a fixed canvas behind the page. Pauses when the tab is hidden and
 * draws a single still frame when the user prefers reduced motion.
 */
(function () {
  "use strict";

  const canvas = document.getElementById("bg");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let W = 0, H = 0, dpr = 1;
  let motes = [], flies = [], fogs = [];
  let raf = 0, last = 0;

  const rand = (a, b) => a + Math.random() * (b - a);

  function makeMote(anywhere) {
    return {
      x: rand(0, W), y: anywhere ? rand(0, H) : H + rand(0, 40),
      r: rand(0.6, 2.2), vy: rand(6, 22), sway: rand(6, 22), phase: rand(0, Math.PI * 2),
      speed: rand(0.2, 0.7), a: rand(0.25, 0.8),
      hue: Math.random() < 0.8 ? [200, 215, 255] : [255, 235, 190],
    };
  }

  function makeFly() {
    return {
      x: rand(0, W), y: rand(H * 0.2, H), r: rand(2.5, 4), t: rand(0, 1000),
      sx: rand(0.0002, 0.0006), sy: rand(0.0003, 0.0007), ax: rand(60, 160), ay: rand(40, 110),
      cx: rand(0, W), cy: rand(H * 0.2, H * 0.95), blink: rand(0, Math.PI * 2),
    };
  }

  function makeFog(i) {
    return { x: rand(0, W), y: H * (0.3 + i * 0.22), rx: rand(W * 0.35, W * 0.7), ry: rand(80, 160), v: rand(4, 10) * (i % 2 ? -1 : 1), a: rand(0.05, 0.09) };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(110, Math.round((W * H) / 16000));
    motes = Array.from({ length: count }, () => makeMote(true));
    flies = Array.from({ length: W < 700 ? 3 : 6 }, makeFly);
    fogs = [0, 1, 2].map(makeFog);
  }

  function draw(dt, time) {
    ctx.clearRect(0, 0, W, H);

    // Fog bands
    for (const f of fogs) {
      f.x += f.v * dt;
      if (f.x - f.rx > W) f.x = -f.rx;
      if (f.x + f.rx < 0) f.x = W + f.rx;
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.rx);
      g.addColorStop(0, `rgba(120, 140, 210, ${f.a})`);
      g.addColorStop(1, "rgba(120, 140, 210, 0)");
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.scale(1, f.ry / f.rx);
      ctx.translate(-f.x, -f.y);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Soul motes rising
    for (const m of motes) {
      m.y -= m.vy * dt;
      m.phase += m.speed * dt;
      const x = m.x + Math.sin(m.phase) * m.sway;
      if (m.y < -10) Object.assign(m, makeMote(false));
      const fade = Math.min(1, m.y / (H * 0.25));
      const [r, g, b] = m.hue;
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${m.a * fade})`;
      ctx.beginPath();
      ctx.arc(x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Lumaflies wandering with a soft glow
    for (const f of flies) {
      f.t += dt * 1000;
      const x = f.cx + Math.sin(f.t * f.sx) * f.ax + Math.sin(f.t * f.sx * 2.3) * 20;
      const y = f.cy + Math.cos(f.t * f.sy) * f.ay;
      const glow = 0.55 + 0.45 * Math.sin(time / 700 + f.blink);
      const g = ctx.createRadialGradient(x, y, 0, x, y, f.r * 9);
      g.addColorStop(0, `rgba(255, 244, 200, ${0.55 * glow})`);
      g.addColorStop(0.25, `rgba(255, 220, 150, ${0.18 * glow})`);
      g.addColorStop(1, "rgba(255, 220, 150, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, f.r * 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255, 250, 230, ${0.7 + 0.3 * glow})`;
      ctx.beginPath();
      ctx.arc(x, y, f.r * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop(time) {
    const dt = Math.min(0.05, (time - last) / 1000 || 0);
    last = time;
    draw(dt, time);
    raf = requestAnimationFrame(loop);
  }

  function start() {
    cancelAnimationFrame(raf);
    if (reduced) { draw(0, 0); return; }
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  window.addEventListener("resize", () => { resize(); if (reduced) draw(0, 0); });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else start();
  });

  resize();
  start();
})();
