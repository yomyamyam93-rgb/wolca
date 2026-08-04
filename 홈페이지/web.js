/* 랜선페이 홈페이지 공용 스크립트 */

/* 1) 웹폰트 로딩 전 글자가 튀는 현상 방지
      — 폰트가 준비될 때까지 화면을 잠깐 감췄다가 부드럽게 보여줌 */
(function () {
  var d = document.documentElement;
  d.classList.add('fonts-loading');
  function ready() {
    d.classList.remove('fonts-loading');
    d.classList.add('fonts-ready');
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(ready);
  } else {
    ready();
  }
  setTimeout(ready, 1500);   // 폰트를 못 받아와도 1.5초 뒤엔 무조건 보여줌
})();

/* 2) 페이지 안 이동(#앵커) — 상단 고정 메뉴 높이만큼 띄워서 딱 맞게 */
document.addEventListener('click', function (e) {
  var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
  if (!a) return;
  var id = a.getAttribute('href').slice(1);
  if (!id) return;
  var el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  var nav = document.querySelector('.nav');
  var offset = (nav ? nav.offsetHeight : 64) + 24;
  var top = el.getBoundingClientRect().top + window.pageYOffset - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
});

/* 3) 스크롤하면 요소가 아래에서 위로 나타나는 효과 */
document.addEventListener('DOMContentLoaded', function () {
  var targets = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  targets.forEach(function (el) { io.observe(el); });
});
