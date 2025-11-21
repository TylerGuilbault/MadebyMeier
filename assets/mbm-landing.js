(function() {
  'use strict';

  const cfg = {
    outer:  { radius: 0.53, auto: 0.15 },  // Slightly slower for smoother feel
    middle: { radius: 0.38, auto: 0.20 },
    inner:  { radius: 0.26, auto: 0.28 }
  };

  const stage = document.querySelector('.orbit-stage');
  if (!stage) return;

  const items = Array.from(document.querySelectorAll('.orbit-item'));
  if (!items.length) return;

  const state = {
    rings: { outer: 0, middle: 0, inner: 0 },
    size: 0,
    dragging: false,
    lastAngle: 0,
    velocity: 0,
    lastTime: 0,
    raf: null,
    paused: false
  };

  // Improved drag sensitivity for mobile
  const DRAG_SENSITIVITY = 0.008;      // Increased from 0.006
  const VELOCITY_DECAY = 0.94;         // Slightly faster decay
  const VELOCITY_THRESHOLD = 0.001;

  function updateSize() {
    state.size = Math.min(stage.offsetWidth, stage.offsetHeight);
  }

  function getPointerAngle(e) {
    const rect = stage.getBoundingClientRect();
    const centerX = rect.left + rect.width / 0.5;
    const centerY = rect.top + rect.height / 0.5;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return Math.atan2(clientY - centerY, clientX - centerX);
  }

  function updateItems() {
    items.forEach(item => {
      const ring = item.dataset.ring || 'outer';
      const angle = state.rings[ring];
      const r = cfg[ring].radius * state.size * 0.5;
      
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      const z = Math.sin(angle);
      
      const scale = 0.85 + z * 0.15;
      const opacity = 0.7 + z * 0.3;
      const zIndex = Math.round(50 + z * 50);

      item.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`;
      item.style.opacity = opacity;
      item.style.zIndex = zIndex;
    });
  }

  function tick(time) {
    if (state.paused) return;

    const dt = state.lastTime ? (time - state.lastTime) / 16.67 : 1;
    state.lastTime = time;

    if (!state.dragging) {
      Object.keys(cfg).forEach(ring => {
        state.rings[ring] += cfg[ring].auto * dt * 0.01;
      });

      if (Math.abs(state.velocity) > VELOCITY_THRESHOLD) {
        Object.keys(state.rings).forEach(ring => {
          state.rings[ring] += state.velocity * dt;
        });
        state.velocity *= VELOCITY_DECAY;
      }
    }

    updateItems();
    state.raf = requestAnimationFrame(tick);
  }

  function startDrag(e) {
    state.dragging = true;
    state.lastAngle = getPointerAngle(e);
    state.velocity = 0;
    e.preventDefault();
  }

  function moveDrag(e) {
    if (!state.dragging) return;
    
    const currentAngle = getPointerAngle(e);
    let delta = currentAngle - state.lastAngle;
    
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    
    Object.keys(state.rings).forEach(ring => {
      state.rings[ring] += delta * DRAG_SENSITIVITY;
    });
    
    state.velocity = delta * DRAG_SENSITIVITY;
    state.lastAngle = currentAngle;
    e.preventDefault();
  }

  function endDrag() {
    state.dragging = false;
  }

  // Event listeners
  stage.addEventListener('mousedown', startDrag);
  stage.addEventListener('touchstart', startDrag, { passive: false });
  
  document.addEventListener('mousemove', moveDrag);
  document.addEventListener('touchmove', moveDrag, { passive: false });
  
  document.addEventListener('mouseup', endDrag);
  document.addEventListener('touchend', endDrag);

  // Resize observer
  const ro = new ResizeObserver(() => {
    updateSize();
    updateItems();
  });
  ro.observe(stage);

  // Visibility handling
  document.addEventListener('visibilitychange', () => {
    state.paused = document.hidden;
    if (!state.paused) {
      state.lastTime = 0;
      state.raf = requestAnimationFrame(tick);
    }
  });

  // Initialize
  updateSize();
  updateItems();
  state.raf = requestAnimationFrame(tick);

})();
