/* ----------------------------------------------------------
   MadeByMeier v8 • Orbit motion (auto-spin + angular drag)
   ---------------------------------------------------------- */
(function(){
  const VERSION="v8";
  console.log(`MBM orbit ${VERSION} loaded`);

  const stage=document.getElementById("orbit-stage");
  if(!stage)return;

  const allowMotion=!window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(!allowMotion){console.log("Reduced motion active");return;}

  const items=[...stage.querySelectorAll(".orbit-item")];
  const cfg={outer:{radius:.53,auto:.18},middle:{radius:.38,auto:.24},inner:{radius:.26,auto:.32}};
  const state=items.map(btn=>{
    const ring=btn.dataset.ring||"middle";
    const count=Math.max(1,parseInt(btn.dataset.count||"1"));
    const idx=parseInt(btn.dataset.index||"0");
    const base=(idx/count)*Math.PI*2;
    return{el:btn,ring,base};
  });

  let rect=stage.getBoundingClientRect(),w=rect.width,h=rect.height,cx=w/2,cy=h/2;
  let spin=0,vel=0,dragging=false,lastA=0,lastT=performance.now();
  let t=0,lastFrame=performance.now(),raf=null;

  const update=()=>{
    rect=stage.getBoundingClientRect();w=rect.width;h=rect.height;cx=w/2;cy=h/2;
  };
  new ResizeObserver(update).observe(stage);
  window.addEventListener("scroll",update,{passive:true});

  const pAngle=e=>{
    const px=e.clientX-rect.left,py=e.clientY-rect.top;
    return Math.atan2(py-cy,px-cx);
  };
  const norm=a=>{while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a;};

  stage.addEventListener("pointerdown",e=>{
    dragging=true;lastA=pAngle(e);lastT=performance.now();
    stage.setPointerCapture(e.pointerId);e.preventDefault();
  });
  stage.addEventListener("pointermove",e=>{
    if(!dragging)return;
    const now=performance.now(),ang=pAngle(e),dA=norm(ang-lastA);
    const dt=Math.max((now-lastT)/1000,.001);
    spin+=dA;vel=dA/dt;lastA=ang;lastT=now;
  });
  stage.addEventListener("pointerup",()=>dragging=false);
  stage.addEventListener("pointercancel",()=>dragging=false);

  function loop(now){
    raf=requestAnimationFrame(loop);
    const dt=(now-lastFrame)/1000;lastFrame=now;t+=dt;
    vel*=.97;spin+=vel*dt;
    state.forEach(s=>{
      const conf=cfg[s.ring]||cfg.middle;
      const r=Math.min(w,h)*conf.radius;
      const a=s.base+t*conf.auto+spin;
      const z=Math.sin(a)*.5;
      const scale=1+z*.18;
      const x=cx+Math.cos(a)*r;
      const y=cy+Math.sin(a)*r;
      s.el.style.transform=`translate(-50%,-50%) translate(${x}px,${y}px) scale(${scale})`;
      s.el.style.zIndex=String(100+Math.floor(z*100));
      s.el.style.opacity=(0.9+z*0.1).toString();
    });
  }
  loop(performance.now());
})();
