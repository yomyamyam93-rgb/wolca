/* ============================================================
   랜선페이 — 통합 폼 공용 스크립트
   ① 등장 모션  ② 숫자 카운트  ③ 아코디언 여닫기  ④ 칩 필터  ⑤ 서브탭
   화면에 들어왔는지는 스크롤 위치로 직접 잽니다.
   (IntersectionObserver 는 창이 숨겨져 있으면 아예 울리지 않아
    내용이 통째로 안 보이는 사고가 납니다.)
   ============================================================ */

/* 안전장치 — 이 표시가 붙어야만 요소를 숨긴다.
   이 파일이 안 불러와지거나 오류가 나면 표시가 없어서 내용이 그냥 다 보인다. */
document.documentElement.classList.add('js-motion');

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- ① 등장 모션 ---------- */
  // 큰 덩어리에만 걸면 화면에 들어오기 전에 끝나 안 보인다 → 실제 눈에 띄는 조각에 건다.
  var AUTO = '.sec > .wrap > *, .head > *, .grid > *, .card, .row, .step, .stat';
  document.querySelectorAll(AUTO).forEach(function (el) {
    if (el.classList.contains('up')) return;
    if (el.closest('.appbar, .tabs, .cta, .drawer')) return;
    var pos = getComputedStyle(el).position;
    if (pos === 'fixed' || pos === 'sticky') return;
    el.classList.add('up');
  });
  // 형제끼리 조금씩 늦게 — 차례로 올라온다
  var seen = new Map();
  document.querySelectorAll('.up').forEach(function (el) {
    var n = seen.get(el.parentElement) || 0;
    seen.set(el.parentElement, n + 1);
    if (n > 0 && n <= 5) el.classList.add('d' + n);
  });

  var ups   = Array.prototype.slice.call(document.querySelectorAll('.up'));
  var nums  = Array.prototype.slice.call(document.querySelectorAll('.countup'));
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still) { ups.forEach(function (e) { e.classList.add('in'); }); ups = []; nums = []; }

  /* ---------- ② 숫자 카운트 ---------- */
  var DUR = 620, GAP = 120;
  function countUp(el, wait) {
    var raw = el.textContent.trim();
    var m = raw.match(/^([\d,]+(?:\.\d+)?)(.*)$/);
    if (!m) return;
    if (document.hidden) return;             // 숨겨져 있으면 0 에서 굳는다 → 최종값 유지
    var target = parseFloat(m[1].replace(/,/g, ''));
    var tail = m[2];
    var dec = (m[1].split('.')[1] || '').length;
    var comma = m[1].indexOf(',') >= 0;
    // 세는 동안만 폭을 붙잡고 숫자 폭을 균일하게 → 글자가 출렁이지 않는다
    el.style.minWidth = el.getBoundingClientRect().width + 'px';
    el.style.fontVariantNumeric = 'tabular-nums';
    function show(v) {
      var t = dec ? v.toFixed(dec) : String(Math.round(v));
      if (comma) t = Number(t).toLocaleString('ko-KR');
      el.textContent = t + tail;
    }
    show(0);
    setTimeout(function () {
      var t0 = null;
      (function step(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min(1, (ts - t0) / DUR);
        show(target * (1 - Math.pow(1 - p, 5)));
        if (p < 1) requestAnimationFrame(step);
        else { el.textContent = raw; el.style.minWidth = ''; el.style.fontVariantNumeric = ''; }
      })(performance.now());
    }, wait);
  }

  function inView(el, ratio) {
    var r = el.getBoundingClientRect();
    if (!r.height && !r.width) return false;
    var h = window.innerHeight || document.documentElement.clientHeight;
    return r.top < h * ratio && r.bottom > 0;
  }

  var ticking = false;
  function check() {
    ticking = false;
    for (var i = ups.length - 1; i >= 0; i--)
      if (inView(ups[i], 0.9)) { ups[i].classList.add('in'); ups.splice(i, 1); }
    for (var j = nums.length - 1; j >= 0; j--)
      if (inView(nums[j], 0.9)) {
        var el = nums[j], idx = nums.indexOf(el);
        nums.splice(j, 1);
        countUp(el, idx * GAP);
      }
  }
  function onScroll() {
    if (document.hidden) { check(); return; }   // 숨겨져 있으면 rAF 가 안 돈다
    if (!ticking) { ticking = true; requestAnimationFrame(check); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', check);
  document.addEventListener('visibilitychange', check);
  document.addEventListener('click', function () { setTimeout(check, 60); }, true);
  check();
});

/* ---------- ③ 펼침·접힘(details) — 높이를 재서 부드럽게 ---------- */
document.addEventListener('click', function (e) {
  var sm = e.target && e.target.closest ? e.target.closest('summary') : null;
  if (!sm) return;
  var d = sm.parentElement;
  if (!d || d.tagName !== 'DETAILS') return;
  var body = sm.nextElementSibling;
  if (!body) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  e.preventDefault();
  if (d.dataset.sliding) return;
  d.dataset.sliding = '1';

  var opening = !d.open;
  body.style.overflow = 'hidden';
  function finish() {
    body.style.transition = ''; body.style.height = '';
    body.style.opacity = ''; body.style.overflow = '';
    if (!opening) d.open = false;
    delete d.dataset.sliding;
  }
  if (opening) {
    d.open = true;
    var h = body.scrollHeight;
    body.style.height = '0px'; body.style.opacity = '0';
    body.getBoundingClientRect();
    body.style.transition = 'height .26s cubic-bezier(.22,.8,.3,1), opacity .22s ease';
    body.style.height = h + 'px'; body.style.opacity = '1';
  } else {
    body.style.height = body.scrollHeight + 'px'; body.style.opacity = '1';
    body.getBoundingClientRect();
    body.style.transition = 'height .22s cubic-bezier(.4,0,.7,1), opacity .16s ease';
    body.style.height = '0px'; body.style.opacity = '0';
  }
  var guard = setTimeout(finish, 400);
  body.addEventListener('transitionend', function te(ev) {
    if (ev.propertyName !== 'height') return;
    clearTimeout(guard); body.removeEventListener('transitionend', te); finish();
  });
});

/* ---------- ④ 칩 필터 · ⑤ 서브탭 ---------- */
function 칩고르기(btn, 그룹, 대상) {
  document.querySelectorAll(그룹 + ' .chip').forEach(function (c) { c.classList.toggle('on', c === btn); });
  var key = btn.dataset.key;
  document.querySelectorAll(대상).forEach(function (el) {
    el.style.display = (!key || key === 'all' || el.dataset.cat === key) ? '' : 'none';
  });
}
function 서브탭(btn, 패널) {
  var 그룹 = btn.parentElement;
  Array.prototype.forEach.call(그룹.children, function (b) { b.classList.toggle('on', b === btn); });
  document.querySelectorAll('.panel').forEach(function (p) { p.classList.toggle('on', p.id === 패널); });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- 전체메뉴 서랍 ---------- */
window.drawer = function (on) {
  var d = document.getElementById('drawer'), m = document.getElementById('dim');
  if (d) d.classList.toggle('on', on);
  if (m) m.classList.toggle('on', on);
};

/* ---------- 시작 버튼 — 히어로가 있는 화면(홈)에선 첫 화면을 지나야 나타난다 ---------- */
(function () {
  function 시작() {
    var fab = document.querySelector('.fab'), hero = document.querySelector('.hero');
    var 끝 = document.getElementById('endcta');
    var 발 = document.querySelector('.foot');
    var 기준칸 = document.querySelector('.rzgrid');
    var 시작 = 기준칸 ? 기준칸.closest('section') : null;
    if (!fab) return;
    function 보기() {
      var 아직 = false;
      if (hero) {
        아직 = 시작
          ? 시작.getBoundingClientRect().top > window.innerHeight * 0.6
          : window.scrollY < hero.offsetHeight - 120;
      }
      var 끝보임 = 끝 && 끝.getBoundingClientRect().top < window.innerHeight - 160;
      var 발보임 = 발 && 발.getBoundingClientRect().top < window.innerHeight - 120;
      fab.classList.toggle('hide', 아직 || 끝보임 || 발보임);
    }
    보기();
    window.addEventListener('scroll', 보기, { passive: true });
    window.addEventListener('resize', 보기);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', 시작);
  else 시작();
})();
