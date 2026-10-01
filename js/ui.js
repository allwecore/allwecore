(function(){
  var btn = document.getElementById('toTop');
  if (!btn) return;
  function sync(){ btn.classList.toggle('is-visible', window.pageYOffset > window.innerHeight * 0.6); }
  window.addEventListener('scroll', sync, { passive:true });
  btn.addEventListener('click', function(){ window.scrollTo(0, 0); });
  sync();
})();

(function(){
  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){ e.target.classList.toggle('is-offscreen', !e.isIntersecting); });
  }, { rootMargin:'200px 0px' });
  document.querySelectorAll('#servicos, .team, .projects').forEach(function(el){ io.observe(el); });
})();
