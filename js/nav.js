(function(){
  function initSwapLink(link){
    var span = link.querySelector('.swap');
    if (!span) return;
    var text = span.getAttribute('data-text') || span.textContent;
    link.setAttribute('aria-label', text);
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML = '';

    for (var i = 0; i < text.length; i++){
      var ch = text.charAt(i);
      if (ch === ' '){
        span.appendChild(document.createTextNode(String.fromCharCode(160)));
        continue;
      }
      var cell = document.createElement('span');
      cell.className = 'cell';
      cell.style.setProperty('--i', i);
      var a = document.createElement('span');
      a.className = 'cell__a';
      a.textContent = ch;
      var b = document.createElement('span');
      b.className = 'cell__b';
      b.textContent = ch;
      cell.appendChild(a);
      cell.appendChild(b);
      span.appendChild(cell);
    }

    function activate(){ span.classList.add('is-active'); }
    function deactivate(){ span.classList.remove('is-active'); }
    link.addEventListener('mouseenter', activate);
    link.addEventListener('mouseleave', deactivate);
    link.addEventListener('focus', activate);
    link.addEventListener('blur', deactivate);
  }

  var reduceMotionNav = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotionNav){
    var navLinks = document.querySelectorAll('.nav__links a');
    for (var i = 0; i < navLinks.length; i++) initSwapLink(navLinks[i]);
  }
})();

(function(){
  var nav = document.querySelector('.nav');
  if (!nav) return;
  function sync(){ nav.classList.toggle('is-scrolled', window.pageYOffset > 10); }
  window.addEventListener('scroll', sync, { passive:true });
  sync();
})();

(function(){
  var box = document.getElementById('contact'), btn = document.getElementById('contactBtn');
  if (!box || !btn) return;
  function set(open){ box.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', open ? 'true' : 'false'); }
  btn.addEventListener('click', function(e){ e.stopPropagation(); set(!box.classList.contains('is-open')); });
  document.addEventListener('click', function(e){ if (!box.contains(e.target)) set(false); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape'){ set(false); btn.focus(); } });
  box.querySelectorAll('.contact__opt').forEach(function(o){ o.addEventListener('click', function(){ set(false); }); });
})();
