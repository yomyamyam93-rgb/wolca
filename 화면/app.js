/* 랜선페이 프로토타입 — 폰 느낌: 드래그 스크롤 + 관성 + 진입 모션 (모든 화면 공용) */
(function(){
  /* 진입 모션 + 버튼 눌림 피드백 (CSS 주입) */
  var st=document.createElement('style');
  st.textContent =
    '.phone{animation:appIn .3s cubic-bezier(.2,.8,.2,1);}'+
    '@keyframes appIn{from{opacity:.35; transform:translateY(12px) scale(.992);} to{opacity:1; transform:none;}}'+
    '@media (prefers-reduced-motion: reduce){.phone{animation:none;}}'+
    'button:active{transform:scale(.97); transition:transform .06s;}';
  document.head.appendChild(st);

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
