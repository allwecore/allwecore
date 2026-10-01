(function(){
  var canvas = document.getElementById('web');
  var stage = document.getElementById('stage');
  var headline = document.getElementById('headline');
  var ctx = canvas.getContext('2d');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var WORDS = ['CONFIANÇA','INOVAÇÃO','DESEMPENHO','EVOLUÇÃO','RESULTADO','ESTRATÉGIA','ZELO','DEDICAÇÃO'];

  headline.innerHTML = 'Nós da <span class="accent">All We Core</span><br>acreditamos no seu sonho.<span class="headline__rule"></span>';

  var SPOKES = 8;
  var RINGS = [0.2, 0.44, 0.7, 1.0];
  var SAMPLES = 18;
  var ANG = [];
  for (var k=0;k<SPOKES;k++) ANG.push(-Math.PI/2 + k*Math.PI*2/SPOKES);

  var ringPaths = RINGS.map(function(r, j){
    var pts = [];
    var sag = j === 0 ? 0.86 : 0.8;
    for (var k=0;k<SPOKES;k++){
      var a0 = ANG[k], a1 = ANG[(k+1)%SPOKES], am = a0 + Math.PI/SPOKES;
      var p0 = [Math.cos(a0)*r, Math.sin(a0)*r];
      var p2 = [Math.cos(a1)*r, Math.sin(a1)*r];
      var c  = [Math.cos(am)*r*sag, Math.sin(am)*r*sag];
      for (var s=(k===0?0:1); s<=SAMPLES; s++){
        var t = s/SAMPLES, u = 1-t;
        pts.push([u*u*p0[0] + 2*u*t*c[0] + t*t*p2[0], u*u*p0[1] + 2*u*t*c[1] + t*t*p2[1]]);
      }
    }
    return pts;
  });

  var T = {
    core:     [0, 700],
    spokes0:  350, spokeGap: 140, spokeDur: 800,
    rings0:   1500, ringGap: 520, ringDur: 1200,
    contract: [4650, 5750],
    flash:    [5550, 6150],
    textIn:   5800
  };

  function clamp01(v){ return v < 0 ? 0 : v > 1 ? 1 : v; }
  function prog(t, a, b){ return clamp01((t-a)/(b-a)); }
  function outCubic(x){ return 1 - Math.pow(1-x,3); }
  function inOutCubic(x){ return x < .5 ? 4*x*x*x : 1 - Math.pow(-2*x+2,3)/2; }
  function inOutSine(x){ return -(Math.cos(Math.PI*x)-1)/2; }

  var size = {w:0,h:0};
  function resize(){
    var rect = stage.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width*dpr));
    canvas.height = Math.max(1, Math.round(rect.height*dpr));
    ctx.setTransform(dpr,0,0,dpr,0,0);
    size.w = rect.width; size.h = rect.height;
  }
  resize();
  if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
  else window.addEventListener('resize', resize);

  var mouse = {x:0, y:0, tx:0, ty:0};
  stage.addEventListener('pointermove', function(e){
    var r = stage.getBoundingClientRect();
    mouse.tx = ((e.clientX - r.left)/r.width - .5);
    mouse.ty = ((e.clientY - r.top)/r.height - .5);
  });
  stage.addEventListener('pointerleave', function(){ mouse.tx = 0; mouse.ty = 0; });

  var dust = [];
  for (var i=0;i<60;i++){
    dust.push({ x:Math.random(), y:Math.random(), r:Math.random()*1.2+.3,
      vx:(Math.random()-.5)*0.000012, vy:-(Math.random()*0.000018+0.000004),
      ph:Math.random()*6.28, sp:Math.random()*0.0012+0.0005, a:Math.random()*.3+.1 });
  }

  function drawDust(now, dt){
    for (var i=0;i<dust.length;i++){
      var d = dust[i];
      d.x += d.vx*dt; d.y += d.vy*dt;
      if (d.y < -0.02) d.y = 1.02;
      if (d.x < -0.02) d.x = 1.02; else if (d.x > 1.02) d.x = -0.02;
      var a = d.a * (0.55 + 0.45*Math.sin(now*d.sp + d.ph));
      ctx.beginPath();
      ctx.arc(d.x*size.w, d.y*size.h, d.r, 0, 6.2832);
      ctx.fillStyle = 'rgba(229,231,235,'+a.toFixed(3)+')';
      ctx.fill();
    }
  }

  function webState(t, now){
    var narrow = size.w < 560;
    var R = Math.min(size.w*(narrow ? 0.27 : 0.3), size.h*0.36);
    var cp = inOutCubic(prog(t, T.contract[0], T.contract[1]));
    var breathe = 1 + 0.018*Math.sin(now/1300);
    return {
      cx: size.w/2 + mouse.x*18,
      cy: size.h/2 + mouse.y*14,
      R: R * breathe * (1 - cp),
      rot: 0.04*Math.sin(now/2600) + cp*Math.PI*0.6,
      cp: cp,
      narrow: narrow
    };
  }

  function project(s, p){
    var c = Math.cos(s.rot), n = Math.sin(s.rot);
    return [s.cx + (p[0]*c - p[1]*n)*s.R, s.cy + (p[0]*n + p[1]*c)*s.R];
  }

  function strokeTwice(width, alpha){
    ctx.lineWidth = width*3.2;
    ctx.strokeStyle = 'rgba(198,255,0,'+(alpha*0.12).toFixed(3)+')';
    ctx.stroke();
    ctx.lineWidth = width;
    ctx.strokeStyle = 'rgba(198,255,0,'+alpha.toFixed(3)+')';
    ctx.stroke();
  }

  function drawWeb(t, now){
    if (t >= T.contract[1]) return;
    var s = webState(t, now);
    var fade = 1 - clamp01((s.cp - 0.55)/0.45);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    var spokeP = [];
    ctx.beginPath();
    for (var k=0;k<SPOKES;k++){
      var st = T.spokes0 + k*T.spokeGap;
      var p = outCubic(prog(t, st, st + T.spokeDur));
      spokeP.push(p);
      if (p <= 0) continue;
      var a = project(s, [0,0]);
      var b = project(s, [Math.cos(ANG[k])*p, Math.sin(ANG[k])*p]);
      ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
    }
    strokeTwice(1.3, 0.85*fade);

    for (var j=0;j<RINGS.length;j++){
      var rs = T.rings0 + j*T.ringGap;
      var rp = inOutSine(prog(t, rs, rs + T.ringDur));
      if (rp <= 0) continue;
      var pts = ringPaths[j];
      var last = rp*(pts.length-1);
      var n = Math.floor(last);
      ctx.beginPath();
      var q = project(s, pts[0]);
      ctx.moveTo(q[0], q[1]);
      for (var i=1;i<=n;i++){ q = project(s, pts[i]); ctx.lineTo(q[0], q[1]); }
      var head = null;
      if (n < pts.length-1){
        var f = last - n, A = pts[n], B = pts[n+1];
        head = project(s, [A[0]+(B[0]-A[0])*f, A[1]+(B[1]-A[1])*f]);
        ctx.lineTo(head[0], head[1]);
      }
      strokeTwice(j === RINGS.length-1 ? 1.5 : 1.2, (0.55 + j*0.1)*fade);
      if (head){
        ctx.fillStyle = 'rgba(255,255,255,'+(0.9*fade).toFixed(3)+')';
        ctx.beginPath(); ctx.arc(head[0], head[1], 2.2, 0, 6.2832); ctx.fill();
      }
    }

    var coreP = outCubic(prog(t, T.core[0], T.core[1]));
    var cpos = project(s, [0,0]);
    var pulse = 1 + 0.15*Math.sin(now/420);
    var glow = ctx.createRadialGradient(cpos[0], cpos[1], 0, cpos[0], cpos[1], 26*pulse);
    glow.addColorStop(0, 'rgba(198,255,0,'+(0.55*coreP).toFixed(3)+')');
    glow.addColorStop(1, 'rgba(198,255,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(cpos[0], cpos[1], 26*pulse, 0, 6.2832); ctx.fill();
    ctx.fillStyle = 'rgba(198,255,0,'+coreP.toFixed(3)+')';
    ctx.beginPath(); ctx.arc(cpos[0], cpos[1], 5*coreP, 0, 6.2832); ctx.fill();

    var fontPx = s.narrow ? 9 : 11;
    ctx.font = '500 '+fontPx+"px 'JetBrains Mono', ui-monospace, monospace";
    if ('letterSpacing' in ctx) ctx.letterSpacing = s.narrow ? '1.5px' : '2.5px';
    var labelFade = 1 - clamp01(s.cp/0.35);
    for (k=0;k<SPOKES;k++){
      var lp = clamp01((spokeP[k]-0.75)/0.25) * labelFade;
      if (lp <= 0.01) continue;
      var tip = project(s, [Math.cos(ANG[k]), Math.sin(ANG[k])]);
      var ang = ANG[k] + s.rot;
      var cx = Math.cos(ang), cy = Math.sin(ang);

      ctx.fillStyle = 'rgba(198,255,0,'+lp.toFixed(3)+')';
      ctx.beginPath(); ctx.arc(tip[0], tip[1], 3.2, 0, 6.2832); ctx.fill();
      ctx.fillStyle = 'rgba(198,255,0,'+(0.18*lp).toFixed(3)+')';
      ctx.beginPath(); ctx.arc(tip[0], tip[1], 8, 0, 6.2832); ctx.fill();

      var off = 14;
      var lx = tip[0] + cx*off, ly = tip[1] + cy*off;
      var align = cx > 0.35 ? 'left' : cx < -0.35 ? 'right' : 'center';
      ctx.textAlign = align;
      ctx.textBaseline = cy > 0.35 ? 'top' : cy < -0.35 ? 'bottom' : 'middle';
      var tw = ctx.measureText(WORDS[k]).width;
      var x0 = align === 'left' ? lx : align === 'right' ? lx - tw : lx - tw/2;
      var rs0 = T.spokes0 + k*T.spokeGap + T.spokeDur*0.6;
      var reveal = inOutSine(prog(t, rs0, rs0 + 900));
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0 - 2, ly - 24, (tw + 4) * reveal, 48);
      ctx.clip();
      ctx.fillStyle = 'rgba(229,231,235,'+(0.92*labelFade).toFixed(3)+')';
      ctx.fillText(WORDS[k], lx, ly);
      ctx.restore();
    }
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }

  function drawFlash(t){
    var p = prog(t, T.flash[0], T.flash[1]);
    if (p <= 0 || p >= 1) return;
    var k = Math.pow(Math.sin(p*Math.PI), 1.6);
    var cx = size.w/2 + mouse.x*18, cy = size.h/2 + mouse.y*14;
    var r = Math.max(size.w, size.h) * (0.12 + 0.45*outCubic(p));
    var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, 'rgba(255,255,255,'+(0.85*k).toFixed(3)+')');
    g.addColorStop(0.18, 'rgba(198,255,0,'+(0.45*k).toFixed(3)+')');
    g.addColorStop(1, 'rgba(198,255,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,size.w,size.h);

    ctx.strokeStyle = 'rgba(198,255,0,'+(0.5*k).toFixed(3)+')';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var i=0;i<SPOKES*2;i++){
      var a = i*Math.PI/SPOKES + 0.2;
      var r0 = r*0.08, r1 = r*(0.35 + 0.25*(i%2));
      ctx.moveTo(cx + Math.cos(a)*r0, cy + Math.sin(a)*r0);
      ctx.lineTo(cx + Math.cos(a)*r1, cy + Math.sin(a)*r1);
    }
    ctx.stroke();
  }

  function updateHeadline(t){
    if (t >= T.textIn) headline.classList.add('is-visible');
  }

  var page = document.getElementById('heroWrap');
  var net = document.getElementById('net');
  var nctx = net.getContext('2d');
  var nsize = {w:0, h:0};
  var particles = [], netOrigin = {x:0, y:0}, netT0 = null;
  var nmouse = {x:null, y:null};

  function localCenter(el){
    var r = el.getBoundingClientRect(), p = page.getBoundingClientRect();
    return { x: r.left - p.left + r.width/2, y: r.top - p.top + r.height/2, w: r.width, h: r.height };
  }
  var stageC = null;

  function seedParticles(burst){
    var count = Math.min(window.innerWidth < 720 ? 70 : 140, Math.round(nsize.w*nsize.h/12000));
    var c = localCenter(stage);
    netOrigin.x = c.x; netOrigin.y = c.y;
    particles = [];
    for (var i=0;i<count;i++){
      particles.push({
        hx: Math.random()*nsize.w, hy: Math.random()*nsize.h,
        x: 0, y: 0,
        vx: (Math.random()-.5)*0.026, vy: (Math.random()-.5)*0.026,
        r: Math.random()*1.5 + 0.8,
        delay: burst ? Math.random()*450 : -99999
      });
    }
  }

  function resizeNet(){
    var r = page.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    net.width = Math.max(1, Math.round(r.width*dpr));
    net.height = Math.max(1, Math.round(r.height*dpr));
    nctx.setTransform(dpr,0,0,dpr,0,0);
    var changed = Math.abs(r.width - nsize.w) > 40 || Math.abs(r.height - nsize.h) > 40;
    nsize.w = r.width; nsize.h = r.height;
    stageC = localCenter(stage);
    if (netT0 !== null && changed) seedParticles(false);
  }
  resizeNet();
  if (window.ResizeObserver) new ResizeObserver(resizeNet).observe(page);
  else window.addEventListener('resize', resizeNet);

  window.addEventListener('pointermove', function(e){
    var p = page.getBoundingClientRect();
    nmouse.x = e.clientX - p.left; nmouse.y = e.clientY - p.top;
  });
  document.addEventListener('pointerleave', function(){ nmouse.x = null; nmouse.y = null; });

  var MOUSE_R = 170, LINK = 135;

  function stepNet(dt){
    var k = dt/16;
    for (var i=0;i<particles.length;i++){
      var p = particles[i];
      p.hx += p.vx*dt; p.hy += p.vy*dt;
      if (p.hx < 0 || p.hx > nsize.w) { p.vx = -p.vx; p.hx = Math.max(0, Math.min(nsize.w, p.hx)); }
      if (p.hy < 0 || p.hy > nsize.h) { p.vy = -p.vy; p.hy = Math.max(0, Math.min(nsize.h, p.hy)); }
      if (nmouse.x !== null){
        var dx = nmouse.x - p.hx, dy = nmouse.y - p.hy;
        var d = Math.sqrt(dx*dx + dy*dy);
        if (d > 0.1 && d < MOUSE_R){
          var f = (MOUSE_R - d)/MOUSE_R;
          p.hx -= dx/d * f * 3 * k;
          p.hy -= dy/d * f * 3 * k;
        }
      }
    }
  }

  function paintNet(alpha, sinceStart){
    nctx.clearRect(0,0,nsize.w,nsize.h);
    if (alpha <= 0) return;
    var i, p;
    for (i=0;i<particles.length;i++){
      p = particles[i];
      var e = outCubic(clamp01((sinceStart - p.delay)/1900));
      p.x = netOrigin.x + (p.hx - netOrigin.x)*e;
      p.y = netOrigin.y + (p.hy - netOrigin.y)*e;
    }
    nctx.lineWidth = 1;
    var L2 = LINK*LINK, mx = nmouse.x, my = nmouse.y, B = 6, n = particles.length;
    var green = [], white = [];
    for (i=0;i<B;i++){ green.push([]); white.push([]); }
    for (i=0;i<n;i++){
      var a = particles[i];
      var near = mx !== null && ((a.x-mx)*(a.x-mx) + (a.y-my)*(a.y-my) < MOUSE_R*MOUSE_R);
      for (var j=i+1;j<n;j++){
        var b = particles[j];
        var dx = a.x - b.x, dy = a.y - b.y, d2 = dx*dx + dy*dy;
        if (d2 >= L2) continue;
        var lvl = Math.min(B-1, Math.floor((1 - Math.sqrt(d2)/LINK) * B));
        (near ? white : green)[lvl].push(a.x, a.y, b.x, b.y);
      }
    }
    function flush(list, rgb, mul){
      for (var l=0;l<B;l++){
        var seg = list[l];
        if (!seg.length) continue;
        nctx.strokeStyle = 'rgba(' + rgb + ',' + (((l+0.5)/B)*alpha*mul).toFixed(3) + ')';
        nctx.beginPath();
        for (var q=0;q<seg.length;q+=4){ nctx.moveTo(seg[q], seg[q+1]); nctx.lineTo(seg[q+2], seg[q+3]); }
        nctx.stroke();
      }
    }
    flush(green, '198,255,0', 0.42);
    flush(white, '255,255,255', 0.75);
    nctx.fillStyle = 'rgba(198,255,0,'+(0.85*alpha).toFixed(3)+')';
    nctx.beginPath();
    for (i=0;i<n;i++){
      p = particles[i];
      nctx.moveTo(p.x + p.r, p.y); nctx.arc(p.x, p.y, p.r, 0, 6.2832);
    }
    nctx.fill();

    var s = stageC || (stageC = localCenter(stage));
    var g = nctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, Math.min(s.w*0.5, 420));
    g.addColorStop(0, 'rgba(10,10,10,'+(0.82*alpha).toFixed(3)+')');
    g.addColorStop(0.6, 'rgba(10,10,10,'+(0.45*alpha).toFixed(3)+')');
    g.addColorStop(1, 'rgba(10,10,10,0)');
    nctx.fillStyle = g; nctx.fillRect(0,0,nsize.w,nsize.h);
  }

  function drawNet(t, dt){
    if (t < T.flash[0] + 150) return;
    if (netT0 === null){ netT0 = t; seedParticles(true); }
    stepNet(dt);
    paintNet(outCubic(prog(t, netT0, netT0 + 2200)), t - netT0);
  }

  if (reduceMotion){
    headline.classList.add('is-visible');
    ctx.clearRect(0,0,size.w,size.h);
    drawDust(0, 0);
    netT0 = 0; seedParticles(false);
    paintNet(1, 99999);
    return;
  }

  var start = null, prev = null;
  function loop(now){
    if (start === null){ start = now; prev = now; }
    var dt = Math.min(now - prev, 50); prev = now;
    var t = now - start;

    mouse.x += (mouse.tx - mouse.x)*0.05;
    mouse.y += (mouse.ty - mouse.y)*0.05;

    drawNet(t, dt);
    ctx.clearRect(0,0,size.w,size.h);
    drawDust(now, dt);
    drawWeb(t, now);
    drawFlash(t);
    updateHeadline(t);
    if (heroVisible && !document.hidden) requestAnimationFrame(loop);
    else { running = false; pausedAt = now; }
  }
  var heroVisible = true, running = true, pausedAt = null;
  function resume(){
    if (running || !heroVisible || document.hidden) return;
    running = true;
    requestAnimationFrame(function(now){
      if (start !== null && pausedAt !== null) start += now - pausedAt;
      pausedAt = null; prev = now;
      loop(now);
    });
  }
  if ('IntersectionObserver' in window){
    new IntersectionObserver(function(es){
      heroVisible = es[0].isIntersecting;
      resume();
    }).observe(page);
  }
  document.addEventListener('visibilitychange', resume);
  requestAnimationFrame(loop);
})();
