/* 랜선페이 프로토타입 — 폰 느낌: 드래그 스크롤 + 관성 + 진입 모션 (모든 화면 공용) */
(function(){
  /* 진입 모션 + 버튼 눌림 피드백 (CSS 주입) */
  var st=document.createElement('style');
  st.textContent =
    '.phone{animation:appIn .3s cubic-bezier(.2,.8,.2,1);}'+
    '@keyframes appIn{from{opacity:.35; transform:translateY(12px) scale(.992);} to{opacity:1; transform:none;}}'+
    '@media (prefers-reduced-motion: reduce){.phone{animation:none;}}'+
    'button:active{transform:scale(.97); transition:transform .06s;}'+
    '.phone{-webkit-user-select:none; user-select:none;}'+
    '.phone input,.phone textarea{-webkit-user-select:text; user-select:text;}'+
    /* 이미지가 손가락/마우스에 끌려 나오지 않게 */
    '.phone img{-webkit-user-drag:none; user-drag:none; -webkit-touch-callout:none; pointer-events:none;}';
  document.head.appendChild(st);

  /* 드래그 자체를 막기 (모바일 길게 눌러 이미지 저장/끌기 방지) */
  document.addEventListener('dragstart', function(e){
    if (e.target && e.target.tagName === 'IMG') e.preventDefault();
  });
  document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('.phone img').forEach(function(im){ im.setAttribute('draggable', 'false'); });
  });

  /* 드래그 스크롤 (세로) + 관성 */
  var sc=null, startY=0, startTop=0, lastY=0, lastT=0, vel=0, moved=false, raf=null;

  function scrollableAncestor(t){
    while(t && t!==document.documentElement){
      if(t.nodeType===1){
        var s=getComputedStyle(t);
        if(/(auto|scroll)/.test(s.overflowY) && t.scrollHeight>t.clientHeight+2) return t;
      }
      t=t.parentElement;
    }
    return null;
  }

  document.addEventListener('pointerdown', function(e){
    if(e.button!==0) return;
    if(e.target.closest('input,textarea,select')) return;
    sc=scrollableAncestor(e.target);
    if(!sc) return;
    if(raf) clearInterval(raf);
    moved=false; startY=e.clientY; startTop=sc.scrollTop;
    lastY=e.clientY; lastT=performance.now(); vel=0;
  });

  document.addEventListener('pointermove', function(e){
    if(!sc) return;
    var dy=e.clientY-startY;
    if(Math.abs(dy)>4) moved=true;
    if(moved){
      sc.scrollTop=startTop-dy;
      var now=performance.now();
      vel=(e.clientY-lastY)/((now-lastT)||1);
      lastY=e.clientY; lastT=now;
      e.preventDefault();
    }
  }, {passive:false});

  function endDrag(){
    if(!sc) return;
    var el=sc, v=vel*14; sc=null;
    if(Math.abs(v)<1) return;
    if(raf) clearInterval(raf);
    raf=setInterval(function(){
      el.scrollTop-=v; v*=0.93;
      if(Math.abs(v)<0.4) clearInterval(raf);
    }, 14);
  }
  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', function(){ sc=null; });

  /* 드래그 직후 클릭(버튼 오작동) 방지 */
  document.addEventListener('click', function(e){
    if(moved){ e.stopPropagation(); e.preventDefault(); moved=false; }
  }, true);
})();

/* 뒤로 갔을 때 보던 위치로 되돌리기 (모든 화면 공용) */
(function(){
  var KEY = 'sc_' + decodeURIComponent(location.pathname.split('/').pop());

  function box(){
    return document.querySelector('.screen, .body, .chat') || null;
  }
  function save(){
    var b = box();
    if (b) { try{ sessionStorage.setItem(KEY, String(b.scrollTop)); }catch(e){} }
  }
  function restore(){
    var b = box();
    if (!b) return;
    var v = 0;
    try{ v = parseInt(sessionStorage.getItem(KEY) || '0', 10); }catch(e){}
    if (v > 0) {
      b.scrollTop = v;                       /* 바로 한 번 */
      requestAnimationFrame(function(){ b.scrollTop = v; });   /* 그림 그려진 뒤 한 번 더 */
      setTimeout(function(){ b.scrollTop = v; }, 60);          /* 아이콘 로딩 후 한 번 더 */
    }
  }

  document.addEventListener('DOMContentLoaded', function(){
    restore();
    var b = box();
    if (b) b.addEventListener('scroll', function(){
      clearTimeout(b._st);
      b._st = setTimeout(save, 120);
    }, { passive:true });
  });
  window.addEventListener('load', restore);
  window.addEventListener('pagehide', save);
  window.addEventListener('beforeunload', save);
})();

/* 뒤로가기 — 어느 화면에서 들어왔는지 기억해서 정확히 되돌아가기 */
(function(){
  var KEY = 'lp_stack';
  var goingBack = false;

  function me(){ return decodeURIComponent(location.pathname.split('/').pop()) + location.search; }
  function get(){ try{ return JSON.parse(sessionStorage.getItem(KEY) || '[]'); }catch(e){ return []; } }
  function set(a){ try{ sessionStorage.setItem(KEY, JSON.stringify(a)); }catch(e){} }

  /* 화면을 떠날 때 '내가 있던 곳'을 쌓아둠 (뒤로 가는 중이면 쌓지 않음) */
  window.addEventListener('pagehide', function(){
    if (goingBack) return;
    var a = get(), cur = me();
    if (a[a.length - 1] !== cur) a.push(cur);
    if (a.length > 25) a.shift();
    set(a);
  });

  /* 모든 화면의 뒤로가기가 이 함수를 씀 */
  window.lpBack = function(fallback){
    var a = get();
    var prev = a.pop();
    set(a);
    goingBack = true;
    /* 쌓인 게 없으면(직접 열었거나 저장소가 비었을 때) 직전 화면을 주소에서 찾아봄 */
    if (!prev && document.referrer) {
      var r = document.referrer.split('#')[0];
      var here = location.href.split('/').slice(0, -1).join('/') + '/';
      if (r.indexOf(here) === 0 && r !== location.href.split('#')[0]) {
        prev = r.slice(here.length);
      }
    }
    location.href = prev || fallback || '../app.html';
  };
})();

/* ===== 앱 공용 : 아래에서 올라오는 확인 시트 =====
   브라우저 confirm() 대신 씁니다.  askSheet({t, s, ok, danger, onOk}) */
(function(){
  var CSS = ''
    + '.ask-layer{position:absolute; inset:0; z-index:70; pointer-events:none;}'
    + '.ask-dim{position:absolute; inset:0; background:rgba(15,20,30,.5); opacity:0; transition:opacity .28s;}'
    + '.ask-layer.on{pointer-events:auto;} .ask-layer.on .ask-dim{opacity:1;}'
    + '.ask-sheet{position:absolute; left:0; right:0; bottom:0; background:#fff; border-radius:24px 24px 0 0;'
    + ' padding:10px 20px 26px; transform:translateY(100%); transition:transform .34s cubic-bezier(.2,.7,.2,1);}'
    + '.ask-layer.on .ask-sheet{transform:translateY(0);}'
    + '.ask-h{width:44px; height:4px; border-radius:3px; background:#DDE2E8; margin:0 auto 16px;}'
    + '.ask-t{font-size:18px; font-weight:800; letter-spacing:-.3px;}'
    + '.ask-s{font-size:13.5px; color:#4E5968; line-height:1.7; margin-top:9px;}'
    + '.ask-b{display:flex; gap:9px; margin-top:22px;}'
    + '.ask-b button{flex:1; height:54px; border:none; border-radius:15px; font-family:inherit;'
    + ' font-size:15.5px; font-weight:700; cursor:pointer;}'
    + '.ask-no{background:#EEF1F4; color:#4E5968;}'
    + '.ask-ok{background:#1D4ED8; color:#fff;}';
  var st = document.createElement('style'); st.textContent = CSS;
  document.head.appendChild(st);

  window.askSheet = function(o){
    var host = document.querySelector('.phone') || document.body;
    var w = document.createElement('div');
    w.className = 'ask-layer';
    w.innerHTML = '<div class="ask-dim"></div><div class="ask-sheet"><div class="ask-h"></div>'
      + '<div class="ask-t">' + (o.t || '') + '</div>'
      + (o.s ? '<div class="ask-s">' + o.s + '</div>' : '')
      + '<div class="ask-b"><button class="ask-no">' + (o.no || '취소') + '</button>'
      + '<button class="ask-ok' + (o.danger ? ' danger' : '') + '">' + (o.ok || '확인') + '</button></div></div>';
    host.appendChild(w);
    requestAnimationFrame(function(){ w.classList.add('on'); });
    function close(){ w.classList.remove('on'); setTimeout(function(){ w.remove(); }, 320); }
    w.querySelector('.ask-dim').onclick = close;
    w.querySelector('.ask-no').onclick = close;
    w.querySelector('.ask-ok').onclick = function(){ close(); if (o.onOk) o.onOk(); };
  };
})();
