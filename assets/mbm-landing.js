/* ----------------------------------------------------------
   MadeByMeier • Orbit motion (auto-spin + drag + inertia)
   ---------------------------------------------------------- */
(function(){
  console.log("MBM orbit script loaded");

  const stage = document.getElementById('orbit-stage');
  if (!stage) return;

  // Respect system accessibility setting
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return; // CSS handles static fallback

  const buttons = Array.from(stage.querySelectorAll('.orbit-btn'));

  // Per-ring configuration:
  // - radius: fraction of stage size
  // - auto: radians per second (continuous spin)
  // - drag: multiplier applied to user spin gesture
  const cfg = {
    outer:  { radius: 0.50, auto: 0.20, drag: 0.22 },
    middle: { radius: 0.36, auto: 0.28, drag: 0.32 },
    inner:  { radius: 0.24, auto: 0.36, drag: 0.42 }
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

  // User interaction / inertia
  let spin = 0;        // accumulated drag rotation
  let vel  = 0;        // inertial velocity from drag
  let dragging = false, lastX = 0;

  // Time for auto-spin
  let t = 0;           // seconds
  let last = performance.now();
  let raf = null;

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
    spin += dx * 0.006;   // accumulate rotation
    vel  = dx * 0.003;    // inertia
  });
  stage.addEventListener('pointerup',   ()=> dragging = false);
  stage.addEventListener('pointercancel',()=> dragging = false);

  // Pause orbit when tab hidden
  document.addEventListener('visibilitychange', ()=>{
    if (document.hidden) cancelAnimationFrame(raf);
    else { last = performance.now(); loop(last); }
  });

  function loop(now){
    raf = requestAnimationFrame(loop);

    // delta time in seconds
    const dt = (now - last) / 1000;
    last = now;
    t += dt;

    // inertia decay (so it slows smoothly after dragging)
    vel *= 0.95;
    spin += vel;

    state.forEach(s=>{
      const conf = cfg[s.ring] || cfg.middle;
      const r = Math.min(width, height) * conf.radius;

      // angle = base spacing + continuous auto spin + user spin component
      const a = s.base + t * conf.auto + spin * conf.drag;

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

  loop(performance.now());
})();
