(function(){
  var section = document.getElementById('servicos');
  var stage = document.getElementById('wheelStage');
  var drum = document.getElementById('wheelDrum');
  var labelEl = document.getElementById('wheelLabel');
  var titleEl = document.getElementById('wheelTitle');
  var indexEl = document.getElementById('wheelIndex');
  var hintEl = document.getElementById('wheelHint');
  if (!section || !stage) return;

  var S = 'fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"';
  var ITEMS = [
    { title:'Sites', photo:'assets/svc-sites.webp', icon:'<svg viewBox="0 0 24 24" '+S+'><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M7 13h6M7 16h10"/></svg>' },
    { title:'Software', photo:'assets/svc-software.webp', icon:'<svg viewBox="0 0 24 24" '+S+'><path d="M8 7 3 12l5 5"/><path d="m16 7 5 5-5 5"/><path d="m14 4-4 16"/></svg>' },
    { title:'Automações e IA', photo:'assets/svc-automacao.webp', icon:'<svg viewBox="0 0 24 24" '+S+'><path d="M13 2 4 14h6.5L10 22l9-12h-6.5L13 2Z"/></svg>' },
    { title:'Tráfego pago', photo:'assets/svc-trafego.webp', icon:'<svg viewBox="0 0 24 24" '+S+'><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>' },
    { title:'Marketing digital', photo:'assets/svc-marketing.webp', icon:'<svg viewBox="0 0 24 24" '+S+'><path d="M3 20h18"/><path d="M4 16l5-5 3.5 3.5L20 7"/><path d="M15 7h5v5"/></svg>' },
    { title:'Video Maker', photo:'assets/svc-video.webp', icon:'' },
    { title:'Consultoria estratégica', photo:'assets/svc-consultoria.webp', icon:'<svg viewBox="0 0 24 24" '+S+'><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/></svg>' }
  ];

  var CARD_H = 0.32, CARD_MAX_W = 0.3, CARD_MAX_W_NARROW = 0.62, CARD_RATIO = 1.45;
  var STEP = 40, DRUM = 2.22, LENS = 2.7, RING_R = 1.14, BOW = 1.82;
  var TITLE = 0.13, INDEX = 0.045, CULL = 1.6;
  var UNIT = 0.42, TAIL = 0.25, EASE = 0.16;
  var count = ITEMS.length, last = count - 1;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

  function clamp(v, lo, hi){ return Math.min(hi, Math.max(lo, v)); }
  function lerp(a, b, t){ return a + (b - a) * t; }
  function rad(d){ return d * Math.PI / 180; }
  function place(ringDeg, drumDeg, ringR, drumR, bow, m){
    return 'translateX(' + (m * -bow * (1 - Math.cos(rad(drumDeg)))) + 'px)' +
      ' rotateZ(' + ((1 - m) * ringDeg) + 'deg) translateY(' + (-(1 - m) * ringR) + 'px)' +
      ' rotateX(' + (m * drumDeg) + 'deg) translateZ(' + (m * drumR) + 'px)';
  }

  var snaps = [];
  for (var k = 0; k <= last + 1; k++){
    var mk = document.createElement('div'); mk.className = 'wheel-snap'; mk.setAttribute('aria-hidden','true');
    section.appendChild(mk); snaps.push(mk);
  }

  var cards = [], faces = [], buttons = [];
  ITEMS.forEach(function(item, i){
    var card = document.createElement('div');
    card.className = 'wheel-card'; card.id = 'wheel-item-' + i;
    card.setAttribute('role','option'); card.setAttribute('aria-label', item.title);
    var face = document.createElement('span');
    face.className = 'wheel-card__face';
    face.innerHTML = '<span class="wheel-card__num">' + ('0'+(i+1)).slice(-2) + ' / ' + ('0'+count).slice(-2) + '</span>' + (item.photo ? '<img class="wheel-card__photo" src="' + item.photo + '" alt="" draggable="false" decoding="async"><span class="wheel-card__shade"></span>' : item.img ? '<img class="wheel-card__art" src="' + item.img + '" alt="" draggable="false">' : '<span class="wheel-card__icon">' + item.icon + '</span>');
    card.appendChild(face); drum.appendChild(card);
    card.tabIndex = 0;
    card.addEventListener('click', function(){ scrollToTurn(i + 1); });
    card.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); scrollToTurn(i + 1); } });
    cards.push(card); faces.push(face);
    var li = document.createElement('li'), btn = document.createElement('button');
    btn.type = 'button'; btn.textContent = item.title;
    btn.addEventListener('click', function(){ scrollToTurn(i + 1); });
    li.appendChild(btn); indexEl.appendChild(li); buttons.push(btn);
  });

  var M = {}, narrow = false, turn = 0, target = 0, active = -1, dirty = true, unitPx = 1, hinted = false;

  var lastW = -1, lastH = -1;
  function measure(){
    var w = stage.clientWidth, h = stage.clientHeight;
    if (w === lastW && Math.abs(h - lastH) < 120) return;
    lastW = w; lastH = h;
    narrow = w < 640;
    section.classList.toggle('is-narrow', narrow);
    var cardW = Math.min(h * CARD_H * CARD_RATIO, w * (narrow ? CARD_MAX_W_NARROW : CARD_MAX_W));
    var cardH = cardW / CARD_RATIO, ringR = cardH * RING_R;
    M = { ringR:ringR, ringScale:clamp(((2*Math.PI*ringR/count)*0.82)/(cardW||1), 0.16, 1), drumR:cardH*DRUM, bow:cardH*BOW };
    cards.forEach(function(c){
      c.style.width = cardW + 'px'; c.style.height = cardH + 'px';
      c.style.marginLeft = (-cardW/2) + 'px'; c.style.marginTop = (-cardH/2) + 'px';
      c.style.fontSize = (cardH/10) + 'px';
    });
    stage.style.perspective = (cardH * LENS) + 'px';
    labelEl.style.fontSize = Math.max(narrow ? 26 : 22, cardH * TITLE * 1.15) + 'px';
    titleEl.style.fontSize = Math.max(narrow ? 24 : 20, cardH * TITLE) + 'px';
    titleEl.style.maxWidth = narrow ? '' : Math.max(200, w/2 - cardW/2 - w*0.09) + 'px';
    indexEl.style.fontSize = Math.max(12, cardH * INDEX) + 'px';
    unitPx = h * UNIT;
    section.style.height = (h + (last + 1 + TAIL) * unitPx) + 'px';
    snaps.forEach(function(sn, j){ sn.style.top = (j * unitPx) + 'px'; });
    dirty = true; readScroll();
  }
  function dwell(x){ var b = Math.floor(x), e = clamp((x - b - 0.18)/0.64, 0, 1); return b + e*e*(3-2*e); }
  var lastY = window.pageYOffset, jumping = false, upAcc = 0, UP_MIN = coarse ? 70 : 2;
  function readScroll(){
    var y = window.pageYOffset, top = section.getBoundingClientRect().top;
    var dy = y - lastY;
    upAcc = dy < 0 ? upAcc - dy : 0;
    var goingUp = upAcc > UP_MIN;
    lastY = y;
    if (goingUp && !jumping && !programmatic && top < -4 && top > -(section.offsetHeight - window.innerHeight)){
      jumping = true;
      var dest = top + y - 1;
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, dest);
      document.documentElement.style.scrollBehavior = '';
      lastY = window.pageYOffset;
      turn = 0; target = 0; dirty = true; upAcc = 0;
      setTimeout(function(){ jumping = false; }, 120);
      return;
    }
    target = clamp(dwell(clamp(-top / unitPx, 0, last + 1)), 0, last + 1);
    if (target > 0.05 && !hinted){ hinted = true; hintEl.classList.add('is-hidden'); }
  }
  var programmatic = false;
  function scrollToTurn(n){
    programmatic = true;
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, section.getBoundingClientRect().top + window.pageYOffset + n * unitPx);
    document.documentElement.style.scrollBehavior = '';
    lastY = window.pageYOffset;
    readScroll();
    setTimeout(function(){ programmatic = false; lastY = window.pageYOffset; }, 200);
  }
  function setActive(i){
    if (i === active) return;
    if (active >= 0){ cards[active].setAttribute('aria-selected','false'); buttons[active].classList.remove('is-active'); }
    active = i;
    cards[i].setAttribute('aria-selected','true'); buttons[i].classList.add('is-active');
    stage.setAttribute('aria-activedescendant', cards[i].id);
    titleEl.textContent = ITEMS[i].title;
    if (titleEl.animate && !reduced) titleEl.animate([{opacity:0, translate:'0 8px'},{opacity:1, translate:'0 0'}], {duration:320, easing:'cubic-bezier(.22,1,.36,1)', composite:'add'});
  }

  measure(); setActive(0);
  if (window.ResizeObserver) new ResizeObserver(measure).observe(stage);
  else window.addEventListener('resize', measure);
  window.addEventListener('scroll', readScroll, { passive:true });

  function frame(){
    requestAnimationFrame(frame);
    var gap = target - turn;
    if (Math.abs(gap) < 0.0005){ if (!dirty && turn === target) return; turn = target; }
    else turn += gap * (reduced ? 1 : EASE);
    dirty = false;
    var m = clamp(turn, 0, 1), pos = Math.max(0, turn - 1);
    drum.style.transform = 'translateZ(' + (-m * M.drumR) + 'px)';
    for (var i = 0; i < count; i++){
      var d = i - pos;
      cards[i].style.transform = place(d * (360/count), d * STEP, M.ringR, M.drumR, M.bow, m);
      var hide = m > 0.5 && Math.abs(d) > CULL;
      var dim = narrow && m > 0.5 ? clamp(1 - Math.abs(d)*0.65, 0.3, 1) : 1;
      cards[i].style.opacity = hide ? '0' : String(dim);
      cards[i].style.zIndex = String(Math.round(100 - Math.abs(d)*2));
      faces[i].style.transform = 'scale(' + lerp(M.ringScale, 1, m) + ')';
    }
    labelEl.style.opacity = String(1 - m);
    titleEl.style.opacity = String(m);
    setActive(clamp(Math.round(pos), 0, last));
  }
  requestAnimationFrame(frame);
})();
