/* 선택시트 — 페이지의 모든 <select class="in"> 을 하단 시트로 바꾼다.
   원래 셀렉트는 숨긴 채 값·change 이벤트를 그대로 쓰므로 기존 코드가 안 깨진다. */
(function () {
  var 스타일 = document.createElement('style');
  스타일.textContent = [
    'select.in.pick-hidden{display:none !important;}',
    '.pickbtn{display:flex; align-items:center; justify-content:space-between; gap:8px;',
    '  width:100%; text-align:left; cursor:pointer; background:#fff;}',
    '.pickbtn .ph{color:#8A9099;}',
    '.pickbtn i{font-style:normal; color:#9AA1AC; font-size:13px; flex:0 0 auto;}',
    '.pkdim{position:fixed; inset:0; z-index:220; background:rgba(15,23,42,.45);',
    '  opacity:0; pointer-events:none; transition:opacity .25s;}',
    '.pkdim.on{opacity:1; pointer-events:auto;}',
    '.pksheet{position:fixed; left:50%; transform:translate(-50%,100%); bottom:0; z-index:221;',
    '  width:100%; max-width:480px; background:#fff; border-radius:24px 24px 0 0;',
    '  padding:12px 20px calc(18px + env(safe-area-inset-bottom, 0px));',
    '  transition:transform .3s cubic-bezier(.3,.6,.25,1); display:flex; flex-direction:column; max-height:76vh;}',
    '.pksheet.on{transform:translate(-50%,0);}',
    '.pksheet .pk-bar{width:42px; height:4px; border-radius:999px; background:#E3E7EE; margin:0 auto 14px; flex:0 0 auto;}',
    '.pksheet h4{font-size:18px; font-weight:800; letter-spacing:-.3px; margin:0 0 6px; flex:0 0 auto; color:#1D2023;}',
    '.pkbody{flex:1 1 auto; overflow-y:auto; scrollbar-width:none; margin-top:4px;}',
    '.pkbody::-webkit-scrollbar{display:none;}',
    '.pkrow{display:flex; align-items:center; justify-content:space-between; gap:10px; width:100%;',
    '  padding:15px 2px; border:none; background:none; cursor:pointer; font:inherit; font-size:15.5px;',
    '  color:#1D2023; border-bottom:1px solid #F0F2F6; text-align:left;}',
    '.pkrow:last-child{border-bottom:none;}',
    '.pkrow em{font-style:normal; font-weight:700; color:#0FC0A6; font-size:12.5px;}',
    '.pkrow.now{color:#156FF9; font-weight:700;}',
    '.pkrow.now:after{content:"✓"; color:#156FF9; font-weight:800;}',
    '.pkgrid{display:grid; grid-template-columns:repeat(4,1fr); gap:8px; padding:6px 0 4px;}',
    '.pkbank{display:flex; flex-direction:column; align-items:center; gap:7px; padding:12px 2px 10px;',
    '  border:1px solid #ECEEF1; border-radius:14px; background:#fff; cursor:pointer; font:inherit;}',
    '.pkbank.now{border-color:#156FF9; background:#EEF3FF;}',
    '.pkbank .bl{width:40px; height:40px; border-radius:12px; display:flex; align-items:center;',
    '  justify-content:center; font-weight:800; color:#fff; line-height:1;}',
    '.pkbank span{font-size:12px; font-weight:600; color:#1D2023; letter-spacing:-.3px; white-space:nowrap;}'
  ].join('\n');
  document.head.appendChild(스타일);

  var 은행들 = {
    'KB국민': { c: '#FFBC00', m: 'KB', t: '#3B2B00' },
    '신한': { c: '#1F4EEB', m: '신' },
    '우리': { c: '#0067AC', m: '우' },
    '하나': { c: '#00857F', m: '하나' },
    'NH농협': { c: '#19A94C', m: 'N' },
    'IBK기업': { c: '#00589F', m: 'IBK' },
    '카카오뱅크': { c: '#FFCD00', m: 'k', t: '#3B1E1E' },
    '토스뱅크': { c: '#0064FF', m: 'toss' },
    '케이뱅크': { c: '#3D2AFF', m: 'K' },
    'SC제일': { c: '#0E7C61', m: 'SC' },
    '새마을금고': { c: '#EC1C24', m: 'MG' },
    '우체국': { c: '#E5390E', m: '우' },
    '부산': { c: '#E6002D', m: '부' },
    'iM뱅크': { c: '#007DC5', m: 'iM' },
    '수협': { c: '#0079C1', m: '수' },
    '신협': { c: '#003399', m: '신협' }
  };
  function 마크크기(m) { return m.length <= 1 ? '17px' : (m.length <= 2 ? '13px' : '10px'); }

  var 딤 = document.createElement('div'); 딤.className = 'pkdim';
  var 시트 = document.createElement('div'); 시트.className = 'pksheet';
  시트.innerHTML = '<div class="pk-bar"></div><h4 id="pk-t">선택</h4><div class="pkbody" id="pk-b"></div>';
  document.body.appendChild(딤); document.body.appendChild(시트);
  function 닫기() { 딤.classList.remove('on'); 시트.classList.remove('on'); }
  딤.addEventListener('click', 닫기);

  function 제목찾기(sel) {
    var fld = sel.closest('.fld');
    var lb = fld && fld.querySelector('label');
    if (!lb) return '선택';
    var t = lb.cloneNode(true);
    var sm = t.querySelector('small'); if (sm) sm.remove();
    return t.textContent.trim();
  }

  function 열기(sel) {
    document.getElementById('pk-t').textContent = 제목찾기(sel);
    var 판 = document.getElementById('pk-b');
    판.innerHTML = '';
    var 은행형 = sel.id === '은행';
    var 그리드 = null;
    if (은행형) { 그리드 = document.createElement('div'); 그리드.className = 'pkgrid'; 판.appendChild(그리드); }
    Array.prototype.forEach.call(sel.options, function (o) {
      if (o.value === '' && o.text.indexOf('선택') > -1) return;
      var b = document.createElement('button'); b.type = 'button';
      if (은행형) {
        var d = 은행들[o.text] || { c: '#8A9099', m: o.text.slice(0, 1) };
        b.className = 'pkbank' + (sel.value === (o.value || o.text) && sel.selectedIndex === o.index ? ' now' : '');
        b.innerHTML = '<span class="bl" style="background:' + d.c + ';color:' + (d.t || '#fff') + ';font-size:' + 마크크기(d.m) + '">' + d.m + '</span><span>' + o.text + '</span>';
        그리드.appendChild(b);
      } else {
        b.className = 'pkrow' + (sel.selectedIndex === o.index ? ' now' : '');
        b.innerHTML = o.text.replace('(무이자)', '<em>무이자</em>');
        판.appendChild(b);
      }
      b.addEventListener('click', function () {
        sel.selectedIndex = o.index;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        닫기();
      });
    });
    딤.classList.add('on'); 시트.classList.add('on');
  }

  function 준비(sel) {
    if (sel.dataset.pk) return;
    sel.dataset.pk = '1';
    var 버튼 = document.createElement('button');
    버튼.type = 'button'; 버튼.className = 'in pickbtn';
    function 표시() {
      var o = sel.options[sel.selectedIndex];
      var 글 = o ? o.text : '선택';
      var 빈값 = o && o.value === '' && 글.indexOf('선택') > -1;
      버튼.innerHTML = '<span' + (빈값 ? ' class="ph"' : '') + '>' + 글 + '</span><i>▾</i>';
    }
    표시();
    sel.classList.add('pick-hidden');
    sel.parentNode.insertBefore(버튼, sel.nextSibling);
    sel.addEventListener('change', 표시);
    버튼.addEventListener('click', function () { 열기(sel); });
  }

  function 전부() { document.querySelectorAll('select.in').forEach(준비); }
  전부();
  /* 나중에 생기는 셀렉트(증빙 화면)도 잡는다 */
  new MutationObserver(전부).observe(document.body, { childList: true, subtree: true });
})();
