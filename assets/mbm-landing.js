/* ----------------------------------------------------------
   MadeByMeier • Orbit v6 (auto-spin + true angular drag)
   ---------------------------------------------------------- */
(function(){
  const VERSION = "v6";
  console.log(`MBM orbit ${VERSION} loaded`);

  const stage = document.getElementById('orbit-stage');
  if (!stage){ console.warn("MBM: no #orbit-stage found"); return; }

  // TEMP: ignore Reduce Motion so we can verify behavior.
  // (For production, set `const allowMotion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;`)
  const allowMotion = true;
  console.log("MBM allowMotion =", allowMotion);
  if (!allowMotion) return;

  const buttons = Array.from(stage.querySelectorAll('.orbit-btn'));
  console.log("MBM buttons =", buttons.length);

  const cfg = {
    outer:  { radius: 0.50, auto: 0.18 },
    middle: { radius: 0.36, auto: 0.24 },
    inner:  { radius: 0.24, auto: 0.32 }
  };

  const state = buttons.map(btn=>{
    const ring  = btn.dataset.ring || 'middle';
    const count = Math.max(1, parseInt(btn.dataset.count || '1', 10));
    const idx   = parseInt(btn.dataset.index || '0', 10);
    const angle = (idx / count) * Math.PI * 2;
    return { el: btn, ring, base: angle };
  });

  let rect = stage.getBoundingClientRect();
  let width = rect.width, height = rect.height;
  let cx = width/2, cy = height/2;

  // angular user input + inertia
  let spin = 0;      // radians
  let vel  = 0;      // radians/sec
  let dragging = false;
  let lastAngle = 0;
  let lastTime  = performance.now();

  // auto-spin time
  let t = 0;
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
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    return Math.atan2(py - cy, px - cx);
  }
  function norm(a){ while(a> Math.PI) a-=Math.PI*2; while(a<-Math.PI) a+=Math.PI*2; return a; }

  stage.addEventListener('pointerdown', (e)=>{
    dragging = true;
    lastAngle = pointerAngle(e);
    lastTime  = performance.now();
    stage.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  stage.addEventListener('pointermove', (e)=>{
    if (!dragging) return;
    const now = performance.now();
    const ang = pointerAngle(e);
    const dA  = norm(ang - lastAngle);
    const dt  = Math.max((now - lastTime)/1000, 0.001);

    spin += dA;
    vel   = dA / dt;

    lastAngle = ang;
    lastTime  = now;
  });
  stage.addEventListener('pointerup',   ()=> dragging = false);
  stage.addEventListener('pointercancel',()=> dragging = false);

  document.addEventListener('visibilitychange', ()=>{
    if (document.hidden){ cancelAnimationFrame(raf); }
    else { lastFrame = performance.now(); loop(lastFrame); }
  });

  function loop(now){
    raf = requestAnimationFrame(loop);

    const dt = (now - lastFrame) / 1000;
    lastFrame = now;
    t += dt;

    vel *= 0.97;         // free but not wild
    spin += vel * dt;

    state.forEach(s=>{
      const conf = cfg[s.ring] || cfg.middle;
      const r = Math.min(width, height) * conf.radius;
      const a = s.base + t * conf.auto + spin;

      const z = Math.sin(a) * 0.5;
      const scale = 1 + z * 0.18;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;

      s.el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`;
      s.el.style.zIndex  = String(100 + Math.floor(z*100));
      s.el.style.opacity = (0.9 + z*0.1).toString();
    });
  }

  loop(performance.now());
})();
