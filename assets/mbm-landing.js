/* ----------------------------------------------------------
   MadeByMeier • Orbit motion (auto-spin + true angular drag)
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
  const cfg = {
    outer:  { radius: 0.50, auto: 0.18 },
    middle: { radius: 0.36, auto: 0.24 },
    inner:  { radius: 0.24, auto: 0.32 }
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

  // For pointer → angle math we need the stage's client rect
  let rect = stage.getBoundingClientRect();

  // User interaction / inertia (in radians)
  let spin = 0;        // accumulated rotation from user
  let vel  = 0;        // angular velocity from drag
  let dragging = false;
  let lastAngle = 0;
  let lastTime  = performance.now();

  // Time for auto-spin
  let t = 0;           // seconds
  let lastFrame = performance.now();
  let raf = null;

  function updateRect(){
    rect = stage.getBoundingClientRect();
    width = rect.width; height = rect.height;
    cx = width/2; cy = height/2;
  }
  updateRect();

  new ResizeObserver(updateRect).observe(stage);
  window.addEventListener('scroll', updateRect, { passive: true });

  function pointerAngle(e){
    // pointer position relative to stage
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    return Math.atan2(py - cy, px - cx);
  }
  function normAngle(a){
    // normalize to [-PI, PI] to avoid jumps
    while (a >  Math.PI) a -= Math.PI*2;
    while (a < -Math.PI) a += Math.PI*2;
    return a;
  }

  // Pointer controls (mouse/touch/pen)
  stage.addEventListener('pointerdown', (e)=>{
    dragging = true;
    lastAngle = pointerAngle(e);
    lastTime  = performance.now();
    stage.setPointerCapture(e.pointerId);
    // stop iOS tap-to-zoom/scroll feels
    e.preventDefault();
  });
  stage.addEventListener('pointermove', (e)=>{
    if (!dragging) return;
    const now = performance.now();
    const ang = pointerAngle(e);
    const dA  = normAngle(ang - lastAngle);
    const dt  = (now - lastTime) / 1000;

    spin += dA;              // accumulate rotation
    vel   = dA / Math.max(dt, 0.001); // angular velocity for inertia

    lastAngle = ang;
    lastTime  = now;
  });
  stage.addEventListener('pointerup',   ()=> dragging = false);
  stage.addEventListener('pointercancel',()=> dragging = false);

  // Pause orbit when tab hidden
  document.addEventListener('visibilitychange', ()=>{
    if (document.hidden) cancelAnimationFrame(raf);
    else { lastFrame = performance.now(); loop(lastFrame); }
  });

  function loop(now){
    raf = requestAnimationFrame(loop);

    // delta time in seconds
    const dt = (now - lastFrame) / 1000;
    lastFrame = now;
    t += dt;

    // inertia decay — slightly lower friction for "freer" feel
    vel *= 0.96;
    spin += vel * dt;

    state.forEach(s=>{
      const conf = cfg[s.ring] || cfg.middle;
      const r = Math.min(width, height) * conf.radius;

      // angle = base spacing + continuous auto spin + user spin component
      const a = s.base + t * conf.auto + spin;

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
