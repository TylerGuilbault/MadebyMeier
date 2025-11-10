/* ----------------------------------------------------------
   MadeByMeier • Orbit motion (drag + inertia + accessibility)
   ---------------------------------------------------------- */
(function(){
  console.log("MBM orbit script loaded");

  const stage = document.getElementById('orbit-stage');
  if (!stage) return;

  // Respect system accessibility setting
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return; // CSS handles static fallback

  const buttons = Array.from(stage.querySelectorAll('.orbit-btn'));

  // Tune per-ring feel (desktop + mobile friendly)
  const cfg = {
    outer:  { radius: 0.50, speed: 0.22 },
    middle: { radius: 0.36, speed: 0.32 },
    inner:  { radius: 0.24, speed: 0.42 }
  };

  // Initial placement for each button
  const state = buttons.map(btn=>{
    const ring  = btn.dataset.ring || 'middle';
    const count = Math.max(1, parseInt(btn.dataset.count || '1', 10));
    const idx   = parseInt(btn.dataset.index || '0', 10);
    const angle = (idx / count) * Math.PI * 2;
    return { el: btn, ring, base: angle };
  });

  let width = stage.clientWidth, height = stage.clientHeight;
  let cx = width/2, cy = height/2;
  let spin = 0, vel = 0, dragging = false, lastX = 0, raf = null;

  // Keep layout reactive
  new ResizeObserver(()=>{
    width = stage.clientWidth; height = stage.clientHeight;
    cx = width/2; cy = height/2;
  }).observe(stage);

  // Pointer controls (mouse/touch/pen)
  stage.addEventListener('pointerdown', (e)=>{
    dragging = true; lastX = e.clientX;
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', (e)=>{
    if (!dragging) return;
    const dx = e.clientX - lastX; lastX = e.clientX;
    spin += dx * 0.006;
    vel  = dx * 0.003; // inertia
  });
  stage.addEventListener('pointerup',   ()=> dragging = false);
  stage.addEventListener('pointercancel',()=> dragging = false);

  // Pause orbit when tab hidden
  document.addEventListener('visibilitychange', ()=>{
    if (document.hidden) cancelAnimationFrame(raf);
    else loop();
  });

  function loop(){
    raf = requestAnimationFrame(loop);
    vel *= 0.95;      // inertia decay
    spin += vel;

    state.forEach(s=>{
      const conf = cfg[s.ring] || cfg.middle;
      const r = Math.min(width, height) * conf.radius;
      const a = s.base + spin * conf.speed;

      // faux depth
      const z = Math.sin(a) * 0.5;
      const scale = 1 + z * 0.18;

      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;

      s.el.style.transform =
        `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`;
      s.el.style.zIndex  = String(100 + Math.floor(z*100));
      s.el.style.opacity = (0.9 + z*0.1).toString();
    });
  }

  loop();
})();
