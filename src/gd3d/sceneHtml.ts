// Self-contained Three.js scene for gradient descent on a 2-D loss landscape.
// Rendered inside a WebView. No backticks or ${ } below: this file is one template literal.
export const GD_HTML = `<!doctype html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
  html,body{margin:0;height:100%;background:#FAF7F2;font-family:Georgia,'Times New Roman',serif;color:#1A1A1A;-webkit-user-select:none;user-select:none;overflow:hidden}
  #app{display:flex;flex-direction:column;height:100%}
  #scene{position:relative;flex:1 1 0;min-height:300px;background:radial-gradient(ellipse at 50% 30%,#234A3A 0%,#1E4D3A 45%,#162E25 100%);touch-action:none}
  canvas#c{display:block;width:100%;height:100%}
  .lbl{position:absolute;pointer-events:none;font-size:12px;color:#FAF7F2;text-shadow:0 1px 2px rgba(0,0,0,.6);white-space:nowrap;transform:translate(-50%,-100%)}
  #lossLabel{font-size:13px;background:rgba(22,46,37,.7);padding:3px 7px;border-radius:4px;border:1px solid rgba(212,168,75,.5)}
  #gradLabel{color:#E5B94E;font-style:italic;font-size:14px;transform:translate(6px,4px)}
  #hint{position:absolute;left:10px;right:10px;bottom:8px;text-align:center;font-size:11px;color:rgba(250,247,242,.6);font-style:italic;pointer-events:none}
  #status{position:absolute;left:10px;top:8px;font-size:12px;color:#E5B94E;pointer-events:none}
  #closing{position:absolute;left:16px;right:16px;top:38%;text-align:center;font-size:17px;line-height:1.4;color:#FAF7F2;font-style:italic;opacity:0;transition:opacity 1.2s;pointer-events:none;text-shadow:0 1px 3px rgba(0,0,0,.7)}
  #panel{padding:10px 14px 12px;display:flex;flex-direction:column;gap:8px;border-top:1px solid #E6E0D6}
  .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;font-size:14px}
  .grid b{font-weight:400;color:#7E8C85;font-size:12px;letter-spacing:.5px}
  .grid span{font-family:Menlo,monospace;font-size:13px}
  button{font-family:Georgia,serif;font-size:14px;padding:8px 12px;white-space:nowrap;border-radius:6px;border:1px solid #E6E0D6;background:#fff;color:#1E4D3A;cursor:pointer}
  button.primary{background:#1E4D3A;color:#FAF7F2;border-color:#1E4D3A}
  button.active{background:rgba(30,77,58,.13);border-color:#1E4D3A;font-weight:700}
  button:active{opacity:.8}
  #lr{width:100%;-webkit-appearance:none;height:4px;border-radius:2px;background:linear-gradient(90deg,#9CAF98,#C9A344 55%,#8B4A2F);outline:none}
  #lr::-webkit-slider-thumb{-webkit-appearance:none;width:26px;height:26px;border-radius:50%;background:#1E4D3A;border:3px solid #FAF7F2;box-shadow:0 1px 4px rgba(0,0,0,.3)}
  .lrlabels{display:flex;justify-content:space-between;font-size:12px;color:#7E8C85;font-style:italic}
  .lrtitle{display:flex;justify-content:space-between;font-size:15px}
  .lrtitle span{font-family:Menlo,monospace;font-size:13px;color:#1E4D3A}
  #chart{width:100%;height:64px;display:block}
  .explain{font-size:13px;line-height:1.35;color:#3A3F3C}
  .explain i{color:#1E4D3A}
</style></head>
<body><div id="app">
<div id="scene">
  <canvas id="c"></canvas>
  <div id="lossLabel" class="lbl">Loss</div>
  <div id="gradLabel" class="lbl">−∇L</div>
  <div id="status"></div>
  <div id="closing">Gradient descent repeatedly asks: “Which direction makes the error decrease fastest from where I am now?”</div>
  <div id="hint">drag to rotate · pinch to zoom · tap the terrain to move the weights · double-tap to reset the view</div>
</div>
<div id="panel">
  <div class="grid">
    <div><b>PARAMETERS</b><br><span id="rw">w₁ = 0.00, w₂ = 0.00</span></div>
    <div><b>LOSS</b><br><span id="rl">L = 0.00</span></div>
    <div><b>GRADIENT</b><br><span id="rg">∇L = [0.00, 0.00]</span></div>
    <div><b>ITERATION</b><br><span id="ri">0</span></div>
  </div>
  <div class="row">
    <button id="bstep" class="primary">Take one step</button>
    <button id="brun">Run</button>
    <button id="breset">Reset</button>
    <span style="flex:1"></span>
    <button id="mvalley" class="active">Valley</button>
    <button id="mravine">Ravine</button>
  </div>
  <div>
    <div class="lrtitle"><div>Learning rate <i>η</i></div><span id="lrv">0.10</span></div>
    <input id="lr" type="range" min="0" max="1000" value="520">
    <div class="lrlabels"><span>Small: tiny careful steps</span><span>Large: leaps across the valley</span></div>
  </div>
  <canvas id="chart"></canvas>
  <div class="explain"><i>Gradient</i> ∇L = direction of steepest increase. <i>Negative gradient</i> −∇L = direction of steepest decrease. The gradient tells us which way to go; the learning rate tells us how far. Step: <i>θ ← θ − η ∇L</i>.</div>
</div>
</div>
<script src="https://unpkg.com/three@0.158.0/build/three.min.js"></script>
<script>
(function(){
  var DOM = 3.0, SEG = 96;
  var mode = 'valley';
  function fValley(x,z){
    return 0.30*(x*x+z*z) + 1.05*Math.sin(1.4*x)*Math.cos(1.2*z)
      + 1.5*Math.exp(-((x-1.7)*(x-1.7)+(z+1.5)*(z+1.5))/0.7)
      + 1.0*Math.exp(-((x+1.9)*(x+1.9)+(z-1.6)*(z-1.6))/0.9)
      + 0.8*Math.exp(-((x+0.2)*(x+0.2)+(z+2.3)*(z+2.3))/0.6);
  }
  function fRavine(x,z){ var c=Math.cos(0.55), s=Math.sin(0.55); var u=c*x+s*z, v=-s*x+c*z; return 0.10*u*u + 2.4*v*v; }
  var raw = fValley, offset = 0, yScale = 1, minPt = {x:0,z:0}, maxL = 1;
  function L(x,z){ return raw(x,z) - offset; }
  function grad(x,z){ var h=1e-3; return { x:(L(x+h,z)-L(x-h,z))/(2*h), z:(L(x,z+h)-L(x,z-h))/(2*h) }; }
  function analyze(){
    var mn=1e9, mx=-1e9; offset=0;
    for(var i=0;i<=120;i++) for(var j=0;j<=120;j++){ var x=-DOM+2*DOM*i/120, z=-DOM+2*DOM*j/120; var v=raw(x,z); if(v<mn){mn=v;minPt={x:x,z:z};} if(v>mx)mx=v; }
    offset=mn; maxL=mx-mn; yScale=2.3/maxL;
  }
  function H(x,z){ return L(x,z)*yScale; }

  var scene = new THREE.Scene();
  var W = 300, Hh = 300;
  var canvas = document.getElementById('c');
  var renderer = new THREE.WebGLRenderer({canvas:canvas, antialias:true, alpha:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
  var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xfaf7f2, 0x162e25, 0.9));
  var sun = new THREE.DirectionalLight(0xffffff, 0.9); sun.position.set(4,8,3); scene.add(sun);

  var surface=null, gridLines=null;
  function cream(t){ // low: cream, mid: sage, high: forest
    var a=[0.98,0.97,0.95], b=[0.61,0.69,0.60], c=[0.12,0.30,0.23];
    var r=t<0.5? [a[0]+(b[0]-a[0])*t*2, a[1]+(b[1]-a[1])*t*2, a[2]+(b[2]-a[2])*t*2] : [b[0]+(c[0]-b[0])*(t-0.5)*2, b[1]+(c[1]-b[1])*(t-0.5)*2, b[2]+(c[2]-b[2])*(t-0.5)*2];
    return r;
  }
  function buildSurface(){
    if(surface){ scene.remove(surface); scene.remove(gridLines); }
    var g = new THREE.PlaneGeometry(2*DOM, 2*DOM, SEG, SEG); g.rotateX(-Math.PI/2);
    var pos = g.attributes.position, col = new Float32Array(pos.count*3);
    for(var i=0;i<pos.count;i++){ var x=pos.getX(i), z=pos.getZ(i); var y=H(x,z); pos.setY(i,y); var c=cream(Math.min(1,y/2.3)); col[3*i]=c[0]; col[3*i+1]=c[1]; col[3*i+2]=c[2]; }
    g.setAttribute('color', new THREE.BufferAttribute(col,3)); g.computeVertexNormals();
    var m = new THREE.MeshStandardMaterial({vertexColors:true, transparent:true, opacity:0.93, roughness:0.75, metalness:0.05, side:THREE.DoubleSide});
    surface = new THREE.Mesh(g,m); scene.add(surface);
    var pts=[], n=12;
    for(var k=0;k<=n;k++){ var a=-DOM+2*DOM*k/n; for(var t=0;t<SEG;t++){ var u0=-DOM+2*DOM*t/SEG, u1=-DOM+2*DOM*(t+1)/SEG;
      pts.push(a,H(a,u0)+0.004,u0, a,H(a,u1)+0.004,u1, u0,H(u0,a)+0.004,a, u1,H(u1,a)+0.004,a); } }
    var lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(pts,3));
    gridLines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({color:0xD4A84B, transparent:true, opacity:0.22})); scene.add(gridLines);
  }

  var ball = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 24), new THREE.MeshStandardMaterial({color:0xE5B94E, emissive:0xD4A84B, emissiveIntensity:0.55, roughness:0.35}));
  scene.add(ball);
  var glow = new THREE.PointLight(0xE5B94E, 1.6, 2.2); ball.add(glow);
  var trail = new THREE.Group(); scene.add(trail);
  var crumbGeo = new THREE.SphereGeometry(0.045, 12, 12), crumbMat = new THREE.MeshStandardMaterial({color:0xE5B94E, emissive:0xD4A84B, emissiveIntensity:0.5});
  var trailLine = null;
  var plane = new THREE.Mesh(new THREE.PlaneGeometry(0.8,0.8), new THREE.MeshBasicMaterial({color:0xE5B94E, transparent:true, opacity:0, side:THREE.DoubleSide, depthWrite:false}));
  scene.add(plane);
  var arrow = new THREE.ArrowHelper(new THREE.Vector3(1,0,0), new THREE.Vector3(), 0.5, 0xE5B94E, 0.16, 0.09); scene.add(arrow);

  var w={x:2.3,z:2.1}, eta=0.1, iter=0, running=false, animating=false, lossHist=[], planeTarget=0, converged=false;
  var cam={theta:0.75, phi:0.78, r:10.8}, target=new THREE.Vector3(0,0.5,0), camAnim=null;
  var el={};
  ['lossLabel','gradLabel','status','closing','rw','rl','rg','ri','lrv','lr','bstep','brun','breset','mvalley','mravine','chart'].forEach(function(id){ el[id]=document.getElementById(id); });

  function placeBall(){ ball.position.set(w.x, H(w.x,w.z)+0.1, w.z); updateGradientVisuals(); updateReadout(); }
  function updateGradientVisuals(){
    var g=grad(w.x,w.z); var n=Math.hypot(g.x,g.z)||1e-9;
    var dx=-g.x/n, dz=-g.z/n, k=0.28;
    var p0=new THREE.Vector3(w.x, H(w.x,w.z)+0.02, w.z), p1=new THREE.Vector3(w.x+dx*k, H(w.x+dx*k, w.z+dz*k)+0.02, w.z+dz*k);
    var dir=p1.clone().sub(p0).normalize();
    var len=Math.min(0.9, 0.25+0.35*Math.min(3,n));
    arrow.position.copy(p0); arrow.setDirection(dir); arrow.setLength(len, 0.16, 0.09);
    arrow.visible = n>0.02;
    var nrm=new THREE.Vector3(-g.x*yScale, 1, -g.z*yScale).normalize();
    plane.position.copy(p0); plane.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1), nrm);
    arrow.userData.tip = p0.clone().add(dir.multiplyScalar(len));
  }
  function updateReadout(){
    var g=grad(w.x,w.z), l=L(w.x,w.z);
    el.rw.textContent='w₁ = '+w.x.toFixed(2)+', w₂ = '+w.z.toFixed(2);
    el.rl.textContent='L = '+l.toFixed(2);
    el.rg.textContent='∇L = ['+g.x.toFixed(2)+', '+g.z.toFixed(2)+']';
    el.ri.textContent=String(iter);
    el.lossLabel.textContent='Loss: '+l.toFixed(2);
    drawChart();
  }
  function addCrumb(x,z){
    var c=new THREE.Mesh(crumbGeo, crumbMat); c.position.set(x,H(x,z)+0.045,z); trail.add(c);
    var pts=[]; trail.children.forEach(function(m){ pts.push(m.position.x, m.position.y, m.position.z); });
    pts.push(ball.position.x, ball.position.y-0.05, ball.position.z);
    if(trailLine){ scene.remove(trailLine); }
    var lg=new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(pts,3));
    trailLine=new THREE.Line(lg, new THREE.LineBasicMaterial({color:0xFAF7F2, transparent:true, opacity:0.55})); scene.add(trailLine);
  }
  function setStatus(s){ el.status.textContent=s; }

  function step(){
    if(animating) return false;
    var g=grad(w.x,w.z), n=Math.hypot(g.x,g.z);
    if(n<0.01){ finish('Converged: the slope here is ≈ 0, so the step is ≈ 0.'); return false; }
    var nx=w.x-eta*g.x, nz=w.z-eta*g.z, diverged=false;
    if(Math.abs(nx)>DOM||Math.abs(nz)>DOM){ diverged=true; nx=Math.max(-DOM,Math.min(DOM,nx)); nz=Math.max(-DOM,Math.min(DOM,nz)); }
    planeTarget=1; animating=true;
    var from={x:w.x,z:w.z}, to={x:nx,z:nz}, t0=performance.now(), dur=380;
    addCrumb(from.x, from.z);
    var y0=H(from.x,from.z), y1=H(to.x,to.z), dist=Math.hypot(to.x-from.x,to.z-from.z);
    var done=false;
    function finalize(){ if(done) return; done=true;
        w=to; iter++; lossHist.push(L(w.x,w.z)); animating=false; planeTarget=0;
        placeBall();
        if(diverged){ finish('Diverged: the learning rate is too large; each step overshoots the valley.'); }
        else if(lossHist.length>1 && lossHist[lossHist.length-1]>lossHist[lossHist.length-2]+1e-9) setStatus('Loss went up: the step overshot. Lower η.');
        else setStatus('');
    }
    setTimeout(finalize, dur+150);
    function tick(now){
      if(done) return;
      var t=Math.min(1,(now-t0)/dur), e=t<0.5?2*t*t:-1+(4-2*t)*t;
      var x=from.x+(to.x-from.x)*e, z=from.z+(to.z-from.z)*e;
      ball.position.set(x, y0+(y1-y0)*e+Math.sin(Math.PI*t)*Math.min(0.5,0.12+0.25*dist)+0.1, z);
      if(t<1) requestAnimationFrame(tick); else finalize();
    }
    requestAnimationFrame(tick);
    return true;
  }
  var lastStepAt=0;
  function maybeStep(now){ if(running && !animating && now-lastStepAt>640){ lastStepAt=now; if(!step()) stopRun(); } }
  setInterval(function(){ maybeStep(performance.now()); }, 300);
  function run(){ if(running){ stopRun(); return; } running=true; lastStepAt=0; el.brun.textContent='Pause'; }
  function stopRun(){ running=false; el.brun.textContent='Run'; }
  function finish(msg){ stopRun(); setStatus(msg); if(!converged){ converged=true; el.closing.style.opacity=1; pullUp(); } }
  function pullUp(){ var mid=new THREE.Vector3(); var n=0; trail.children.forEach(function(m){ mid.add(m.position); n++; }); mid.add(ball.position); n++; mid.multiplyScalar(1/n);
    camAnim={t0:performance.now(), dur:1800, from:{r:cam.r,phi:cam.phi,tgt:target.clone()}, to:{r:Math.max(cam.r,11.5), phi:1.05, tgt:mid.multiplyScalar(0.7)}}; }
  function reset(start){
    stopRun(); animating=false; converged=false; el.closing.style.opacity=0; setStatus('');
    trail.clear(); if(trailLine){ scene.remove(trailLine); trailLine=null; }
    w = start || (mode==='valley'? {x:2.3,z:2.1} : {x:2.6,z:1.3}); iter=0; lossHist=[L(w.x,w.z)];
    placeBall(); target.set(w.x*0.25, 0.5, w.z*0.25);
  }
  function setMode(m){ mode=m; raw = m==='valley'? fValley : fRavine; analyze(); buildSurface();
    el.mvalley.className = m==='valley'?'active':''; el.mravine.className = m==='ravine'?'active':''; reset(); resetCamera(); }
  function resetCamera(){ camAnim={t0:performance.now(), dur:900, from:{r:cam.r,phi:cam.phi,tgt:target.clone()}, to:{r:10.8, phi:0.78, tgt:new THREE.Vector3(w.x*0.25,0.5,w.z*0.25)}}; cam.theta=0.75; }

  // learning rate slider: log scale 0.005 .. 1.5
  function lrFromSlider(v){ return 0.005*Math.pow(300, v/1000); }
  function onLR(){ eta=lrFromSlider(+el.lr.value); el.lrv.textContent=eta.toFixed(3); }
  el.lr.addEventListener('input', onLR); onLR();
  el.bstep.addEventListener('click', function(){ stopRun(); step(); });
  el.brun.addEventListener('click', run);
  el.breset.addEventListener('click', function(){ reset(); resetCamera(); });
  el.mvalley.addEventListener('click', function(){ setMode('valley'); });
  el.mravine.addEventListener('click', function(){ setMode('ravine'); });

  // camera controls: drag rotate, pinch zoom, tap relocate, double-tap reset
  var pointers={}, lastTap=0, downPos=null, moved=0, pinchD=0;
  var ray=new THREE.Raycaster(), ndc=new THREE.Vector2();
  canvas.addEventListener('pointerdown', function(e){ pointers[e.pointerId]={x:e.clientX,y:e.clientY}; downPos={x:e.clientX,y:e.clientY}; moved=0; camAnim=null; canvas.setPointerCapture(e.pointerId);
    var ids=Object.keys(pointers); if(ids.length===2){ var a=pointers[ids[0]], b=pointers[ids[1]]; pinchD=Math.hypot(a.x-b.x,a.y-b.y); } });
  canvas.addEventListener('pointermove', function(e){ if(!pointers[e.pointerId]) return; var p=pointers[e.pointerId]; var dx=e.clientX-p.x, dy=e.clientY-p.y; moved+=Math.abs(dx)+Math.abs(dy);
    pointers[e.pointerId]={x:e.clientX,y:e.clientY}; var ids=Object.keys(pointers);
    if(ids.length===1){ cam.theta-=dx*0.008; cam.phi=Math.max(0.2,Math.min(1.35,cam.phi+dy*0.006)); }
    else if(ids.length===2){ var a=pointers[ids[0]], b=pointers[ids[1]]; var d=Math.hypot(a.x-b.x,a.y-b.y); if(pinchD>0) cam.r=Math.max(3.2,Math.min(14,cam.r*pinchD/d)); pinchD=d; } });
  function endPointer(e){ delete pointers[e.pointerId]; if(Object.keys(pointers).length===0 && downPos && moved<8){
      var now=performance.now(); if(now-lastTap<320){ resetCamera(); lastTap=0; return; } lastTap=now;
      var rect=canvas.getBoundingClientRect(); ndc.set(((e.clientX-rect.left)/rect.width)*2-1, -((e.clientY-rect.top)/rect.height)*2+1);
      ray.setFromCamera(ndc, camera); var hit=ray.intersectObject(surface); if(hit.length){ var p=hit[0].point; reset({x:Math.max(-DOM,Math.min(DOM,p.x)), z:Math.max(-DOM,Math.min(DOM,p.z))}); setStatus('Moved the weights. Take a step from here.'); }
    } downPos=null; }
  canvas.addEventListener('pointerup', endPointer); canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('wheel', function(e){ cam.r=Math.max(3.2,Math.min(14,cam.r*(1+e.deltaY*0.001))); e.preventDefault(); }, {passive:false});

  function resize(){ var s=document.getElementById('scene'); W=s.clientWidth; Hh=s.clientHeight; renderer.setSize(W,Hh,false); camera.aspect=W/Hh; camera.updateProjectionMatrix(); }
  window.addEventListener('resize', resize);

  function project(v){ var p=v.clone().project(camera); return {x:(p.x+1)/2*W, y:(1-p.y)/2*H2()}; }
  function H2(){ return Hh; }
  function drawChart(){ var c=el.chart, ctx=c.getContext('2d'); var dpr=Math.min(window.devicePixelRatio||1,2); var cw=c.clientWidth||300, ch=64; c.width=cw*dpr; c.height=ch*dpr; ctx.scale(dpr,dpr); ctx.clearRect(0,0,cw,ch);
    var n=lossHist.length, mx=Math.max.apply(null,lossHist.concat([0.5])), pad=28;
    ctx.strokeStyle='#E6E0D6'; ctx.beginPath(); ctx.moveTo(pad,ch-12); ctx.lineTo(cw-6,ch-12); ctx.stroke();
    ctx.fillStyle='#7E8C85'; ctx.font='10px Georgia'; ctx.fillText('loss', 2, 12); ctx.fillText('iteration →', cw-62, ch-1);
    ctx.strokeStyle='#C9A344'; ctx.lineWidth=2; ctx.beginPath();
    for(var i=0;i<n;i++){ var x=pad+(n>1? i/(n-1):0)*(cw-pad-6), y=ch-12-(lossHist[i]/mx)*(ch-22); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.stroke();
    if(n){ ctx.fillStyle='#1E4D3A'; ctx.font='11px Menlo,monospace'; ctx.textAlign='right'; ctx.fillText('L = '+lossHist[n-1].toFixed(2), cw-6, 12); ctx.textAlign='left'; }
  }

  function frame(now){
    requestAnimationFrame(frame);
    maybeStep(now);
    if(camAnim){ var t=Math.min(1,(now-camAnim.t0)/camAnim.dur), e=1-Math.pow(1-t,3); cam.r=camAnim.from.r+(camAnim.to.r-camAnim.from.r)*e; cam.phi=camAnim.from.phi+(camAnim.to.phi-camAnim.from.phi)*e; target.copy(camAnim.from.tgt).lerp(camAnim.to.tgt,e); if(t>=1) camAnim=null; }
    else if(running||animating){ target.lerp(new THREE.Vector3(ball.position.x*0.6, ball.position.y*0.6, ball.position.z*0.6), 0.03); }
    camera.position.set(target.x+cam.r*Math.cos(cam.phi)*Math.sin(cam.theta), target.y+cam.r*Math.sin(cam.phi), target.z+cam.r*Math.cos(cam.phi)*Math.cos(cam.theta));
    camera.lookAt(target);
    plane.material.opacity += ((planeTarget?0.32:0.12) - plane.material.opacity)*0.12;
    plane.visible = !animating || planeTarget>0;
    renderer.render(scene, camera);
    var bp=project(new THREE.Vector3(ball.position.x, ball.position.y+0.16, ball.position.z)); el.lossLabel.style.left=bp.x+'px'; el.lossLabel.style.top=bp.y+'px';
    if(arrow.visible && arrow.userData.tip){ var tp=project(arrow.userData.tip); el.gradLabel.style.left=tp.x+'px'; el.gradLabel.style.top=(tp.y-2)+'px'; el.gradLabel.style.display='block'; } else el.gradLabel.style.display='none';
  }
  analyze(); buildSurface(); resize(); reset(); resetCamera(); requestAnimationFrame(frame);
  setTimeout(resize, 50); setTimeout(resize, 400);
})();
</script></body></html>`;
