(function() {
  'use strict';

  // Configuration
  const cfg = {
    outer:  { radius: 0.53, autoSpeed: 0.18 },
    middle: { radius: 0.38, autoSpeed: 0.24 }
  };

  const stage = document.querySelector('.orbit-stage');
  if (!stage) return;

  const items = Array.from(document.querySelectorAll('.orbit-item'));
  if (!items.length) return;

  const state = {
    angles: new Map(),
    stageSize: 0,
    isDragging: false,
    lastPointerAngle: 0,
    spinVelocity: 0,
    lastFrameTime: 0,
    animationId: null
  };

  // Drag constants
  const DRAG_MULT = 1.2;
  const INERTIA_DECAY = 0.92;
  const MIN_VELOCITY = 0.0005;

  function measureStage() {
    const rect = stage.getBoundingClientRect();
    state.stageSize = Math.min(rect.width, rect.height);
  }

  function getPointerAngle(evt) {
    const rect = stage.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const px = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const py = evt.touches ? evt.touches[0].clientY : evt.clientY;
    return Math.atan2(py - cy, px - cx);
  }

  function positionItems() {
    items.forEach(item => {
      const ring = item.dataset.ring || 'outer';
      const ringCfg = cfg[ring];
      if (!ringCfg) return;

      let angle = state.angles.get(item);
      if (angle === undefined) {
        // Initialize with random offset
        angle = Math.random() * Math.PI * 2;
        state.angles.set(item, angle);
      }

      const radiusPx = ringCfg.radius * state.stageSize;
      const x = Math.cos(angle) * radiusPx;
      const y = Math.sin(angle) * radiusPx;
      
      // Depth effect
      const depthZ = Math.sin(angle);
      const scale = 0.8 + depthZ * 0.2;
      const opacity = 0.65 + depthZ * 0.35;
      const zIndex = Math.round(50 + depthZ * 50);

      item.style.left = '50%';
      item.style.top = '50%';
      item.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${scale})`;
      item.style.opacity = opacity;
      item.style.zIndex = zIndex;
    });
  }

  function animate(timestamp) {
    const deltaTime = state.lastFrameTime ? (timestamp - state.lastFrameTime) / 16.67 : 1;
    state.lastFrameTime = timestamp;

    if (!state.isDragging) {
      // Auto-rotate each ring
      items.forEach(item => {
        const ring = item.dataset.ring || 'outer';
        const ringCfg = cfg[ring];
        if (!ringCfg) return;

        let angle = state.angles.get(item);
        angle += ringCfg.autoSpeed * 0.01 * deltaTime;
        state.angles.set(item, angle);
      });

      // Apply inertia from drag
      if (Math.abs(state.spinVelocity) > MIN_VELOCITY) {
        items.forEach(item => {
          let angle = state.angles.get(item);
          angle += state.spinVelocity * deltaTime;
          state.angles.set(item, angle);
        });
        state.spinVelocity *= INERTIA_DECAY;
      }
    }

    positionItems();
    state.animationId = requestAnimationFrame(animate);
  }

  function handleDragStart(evt) {
    state.isDragging = true;
    state.lastPointerAngle = getPointerAngle(evt);
    state.spinVelocity = 0;
    evt.preventDefault();
  }

  function handleDragMove(evt) {
    if (!state.isDragging) return;

    const currentAngle = getPointerAngle(evt);
    let angleDelta = currentAngle - state.lastPointerAngle;

    // Normalize angle delta
    if (angleDelta > Math.PI) angleDelta -= Math.PI * 2;
    if (angleDelta < -Math.PI) angleDelta += Math.PI * 2;

    // Rotate all items by drag amount
    items.forEach(item => {
      let angle = state.angles.get(item);
      angle += angleDelta * DRAG_MULT;
      state.angles.set(item, angle);
    });

    state.spinVelocity = angleDelta * DRAG_MULT;
    state.lastPointerAngle = currentAngle;
    evt.preventDefault();
  }

  function handleDragEnd() {
    state.isDragging = false;
  }

  // Event bindings
  stage.addEventListener('mousedown', handleDragStart);
  stage.addEventListener('touchstart', handleDragStart, { passive: false });
  
  window.addEventListener('mousemove', handleDragMove);
  window.addEventListener('touchmove', handleDragMove, { passive: false });
  
  window.addEventListener('mouseup', handleDragEnd);
  window.addEventListener('touchend', handleDragEnd);

  // Resize handling
  const resizeObserver = new ResizeObserver(() => {
    measureStage();
    positionItems();
  });
  resizeObserver.observe(stage);

  // Pause when tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (state.animationId) cancelAnimationFrame(state.animationId);
    } else {
      state.lastFrameTime = 0;
      state.animationId = requestAnimationFrame(animate);
    }
  });

  // Initialize
  measureStage();
  positionItems();
  state.animationId = requestAnimationFrame(animate);

})();
