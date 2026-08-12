/* 안전장치 : 이 표시가 붙어야만 요소를 숨긴다.
   web.js 가 안 불러와지거나 오류가 나면 표시가 없어서 내용이 그냥 다 보인다. */
document.documentElement.classList.add('js-motion');

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

/* ===== 등장 · 반복 모션 =====
   화면에 들어왔는지를 스크롤 위치로 직접 잽니다.
   (IntersectionObserver 는 창이 숨겨져 있으면 아예 울리지 않아, 내용이 안 보이는 사고가 납니다.) */
document.addEventListener('DOMContentLoaded', function () {

  /* --- 1. 등장 모션을 걸 조각들을 자동으로 골라 준다 ---
         큰 덩어리에만 걸면 화면에 들어오기 전에 끝나서 안 보인다. */
  var AUTO = [
    '.sec > .wrap > *', '.page-hero > *', '.cardco .wrap > *',
    '.board a', '.fq', '.nr', '.nw', '.tl-item', '.fstep',
    '.paycard', '.authcard', '.qa-in > *', '.tx-in > *', '.post > *',
    '.ctaband .cb-in > *', '.rs', '.case', '.st3'
  ].join(',');
  var SKIP_POPUP = '.drawer,.modal,.docbox,.fpop,.askbox,.dhbox,.lgbox';
  var SKIP_OWN   = '.stagger,.scr,.gscr,.sms,.noti,.split,.nr-list,.rv-track,.hero';

  document.querySelectorAll(AUTO).forEach(function (el) {
    if (el.classList.contains('reveal')) return;
    if (el.closest(SKIP_POPUP)) return;
    if (el.closest(SKIP_OWN)) return;
    var pos = getComputedStyle(el).position;
    if (pos === 'fixed' || pos === 'sticky' || pos === 'absolute') return;
    el.classList.add('reveal');
  });

  /* 같은 부모 안에서는 조금씩 늦게 — 형제끼리 차례로 올라온다 */
  var seen = new Map();
  document.querySelectorAll('.reveal').forEach(function (el) {
    var n = seen.get(el.parentElement) || 0;
    seen.set(el.parentElement, n + 1);
    if (n > 0 && n <= 5) el.classList.add('d' + n);
  });

  /* --- 2. 묶음(.stagger) 자식에 순서를 매긴다 --- */
  document.querySelectorAll('.stagger').forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty('--i', i); });
  });

  /* --- 3. 화면에 들어왔는지 직접 재기 --- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal, .stagger'));
  var loops   = Array.prototype.slice.call(document.querySelectorAll('[data-loop]'));
  var nums    = Array.prototype.slice.call(document.querySelectorAll('.countup'));
  var still   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (still) {
    reveals.forEach(function (el) { el.classList.add('in'); });
    return;
  }

  var DUR = 620, GAP = 150;   /* 숫자 : 0.62초에 싹 차고, 0.15초 간격으로 하나씩 */

  function countUp(el, wait) {
    var raw = el.textContent.trim();
    var m = raw.match(/^([\d,]+(?:\.\d+)?)(.*)$/);
    if (!m) return;
    var target = parseFloat(m[1].replace(/,/g, ''));
    var tail = m[2];
    var dec = (m[1].split('.')[1] || '').length;
    var comma = m[1].indexOf(',') >= 0;
    /* 창이 숨겨져 있으면 화면 갱신이 멈춰 0 에서 굳는다 → 그냥 최종값으로 둔다 */
    if (document.hidden) return;
    /* 세는 동안만 (1) 바깥 폭을 붙잡고 (2) 숫자 폭을 균일하게 → 글자가 출렁이지 않음.
       끝나면 둘 다 풀어서 원래 보이던 모양 그대로 돌려 놓는다. */
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
        show(target * (1 - Math.pow(1 - p, 5)));   /* 빠르게 차고 끝에서 딱 */
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
    /* 등장 — 한 번 나오면 끝 */
    for (var i = reveals.length - 1; i >= 0; i--) {
      if (inView(reveals[i], 0.88)) { reveals[i].classList.add('in'); reveals.splice(i, 1); }
    }
    /* 반복 모션 — 보일 때만 돌린다 */
    loops.forEach(function (el) { el.classList.toggle('play', inView(el, 1)); });
    /* 숫자 — 왼쪽부터 하나씩 */
    for (var j = nums.length - 1; j >= 0; j--) {
      if (inView(nums[j], 0.9)) {
        var el = nums[j], idx = nums.indexOf(el);
        nums.splice(j, 1);
        countUp(el, idx * GAP);
      }
    }
  }
  function onScroll() {
    /* 창이 숨겨져 있으면 requestAnimationFrame 이 돌지 않으므로 바로 계산한다 */
    if (document.hidden) { check(); return; }
    if (!ticking) { ticking = true; requestAnimationFrame(check); }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', check);
  document.addEventListener('visibilitychange', check);
  /* 탭을 눌러 숨어 있던 내용이 열릴 때도 다시 확인 (안 하면 투명한 채로 남는다) */
  document.addEventListener('click', function () { setTimeout(check, 60); }, true);
  check();
});

/* ===== 펼침 · 접힘(details) 움직임 =====
   <details> 는 원래 툭 하고 즉시 열립니다. 높이를 재서 부드럽게 여닫습니다.
   화면에 나중에 만들어지는 것(고객센터 FAQ)까지 잡으려고 문서 전체에서 받습니다. */
document.addEventListener('click', function (e) {
  var sm = e.target && e.target.closest ? e.target.closest('summary') : null;
  if (!sm) return;
  var d = sm.parentElement;
  if (!d || d.tagName !== 'DETAILS') return;
  var body = sm.nextElementSibling;
  if (!body) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  e.preventDefault();
  if (d.dataset.sliding) return;          /* 움직이는 중에 또 누르면 무시 */
  d.dataset.sliding = '1';

  var opening = !d.open;
  body.style.overflow = 'hidden';

  function finish() {
    body.style.transition = '';
    body.style.height = '';
    body.style.opacity = '';
    body.style.overflow = '';
    if (!opening) d.open = false;
    delete d.dataset.sliding;
  }

  if (opening) {
    d.open = true;
    var h = body.scrollHeight;
    body.style.height = '0px';
    body.style.opacity = '0';
    body.getBoundingClientRect();                       /* 지금 상태를 확정시킨다 */
    body.style.transition = 'height .28s cubic-bezier(.22,.8,.3,1), opacity .24s ease';
    body.style.height = h + 'px';
    body.style.opacity = '1';
  } else {
    body.style.height = body.scrollHeight + 'px';
    body.style.opacity = '1';
    body.getBoundingClientRect();
    body.style.transition = 'height .24s cubic-bezier(.4,0,.7,1), opacity .16s ease';
    body.style.height = '0px';
    body.style.opacity = '0';
  }

  /* 창이 숨겨져 있으면 전환이 안 끝나므로 시간으로도 마무리한다 */
  var guard = setTimeout(finish, 420);
  body.addEventListener('transitionend', function te(ev) {
    if (ev.propertyName !== 'height') return;
    clearTimeout(guard);
    body.removeEventListener('transitionend', te);
    finish();
  });
});
