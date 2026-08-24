import type { Artist } from "./supabase";

/**
 * 지금 갤러리 내용을 그대로 담은 독립 HTML 문자열을 만든다.
 * 이미지는 원본 주소를 그대로 참조하므로 파일이 가볍다.
 * (원본 저장소가 살아 있는 동안 보인다)
 */
export function buildExportHtml(items: Artist[], title = "NAI MATOME"): string {
  const data = JSON.stringify(items).replace(/<\/script/gi, "<\\/script");
  const savedAt = new Date().toLocaleString("ko-KR");

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@400;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{--paper:#fff;--paper-dim:#ededed;--ink:#000;--ink-soft:#6b6b6b;
--display:"Anton","Archivo",system-ui,sans-serif;--body:"Archivo",system-ui,sans-serif;--mono:"IBM Plex Mono",ui-monospace,monospace}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--paper);color:var(--ink);font-family:var(--body);-webkit-font-smoothing:antialiased}
body::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:100;opacity:.13;mix-blend-mode:multiply;
background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E")}
button{cursor:pointer;background:none;border:none;font:inherit;color:inherit}
:focus-visible{outline:3px solid var(--ink);outline-offset:2px}
.shell{max-width:1180px;margin:0 auto;padding:0 18px 120px}
.masthead{border-bottom:3px solid var(--ink);padding:34px 0 14px}
.eyebrow{font-family:var(--mono);font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:var(--ink-soft);margin-bottom:10px}
.wordmark{font-family:var(--display);text-transform:uppercase;line-height:.82;letter-spacing:-.02em;font-size:clamp(48px,15vw,140px);font-weight:400}
.count{font-family:var(--mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-soft);display:block;margin-top:12px}
.controls{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:14px 0;border-bottom:1px solid var(--ink)}
.search{flex:1;min-width:170px;background:transparent;border:none;border-bottom:2px solid var(--ink);padding:7px 2px;font-family:var(--mono);font-size:13px}
.search::placeholder{color:var(--ink-soft);text-transform:uppercase;letter-spacing:.16em;font-size:11px}
.setlist{display:flex;flex-wrap:wrap;border-bottom:1px solid var(--ink);padding:8px 0 10px}
.setlist-label{font-family:var(--mono);font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:var(--ink-soft);width:100%;margin-bottom:7px}
.tag-btn{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;padding:5px 11px;margin:0 6px 6px 0;border:1px solid var(--ink);background:transparent}
.tag-btn:hover{background:var(--paper-dim)}
.tag-btn[data-on="true"]{background:var(--ink);border-color:var(--ink);color:var(--paper)}
.tag-clear{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;padding:5px 4px;margin-bottom:6px;color:var(--ink-soft);text-decoration:underline}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:22px 12px;padding-top:26px}
@media(min-width:620px){.grid{grid-template-columns:repeat(auto-fill,minmax(212px,1fr));gap:26px 20px}}
.card{display:flex;flex-direction:column;position:relative;min-width:0}
.card-frame{border:2px solid var(--ink);background:var(--paper-dim);aspect-ratio:1/1;overflow:hidden;position:relative;cursor:zoom-in}
.card-frame img{width:100%;height:100%;object-fit:cover;display:block}
.card-frame-empty{display:flex;align-items:center;justify-content:center;height:100%;font-family:var(--mono);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-soft)}
.extra-flag{position:absolute;left:6px;bottom:6px;font-family:var(--mono);font-size:9px;letter-spacing:.14em;background:var(--ink);color:var(--paper);padding:3px 7px}
.stamp-btn{width:100%;border:2px solid var(--ink);border-top:none;background:var(--paper);font-family:var(--mono);font-size:12px;text-align:left;padding:9px 10px;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:space-between;gap:6px}
.stamp-btn:hover{background:var(--paper-dim)}
.stamp-btn .label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.stamp-btn .hint{font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-soft);white-space:nowrap}
@media(max-width:619px){.stamp-btn .hint{display:none}}
.stamp-btn .slam{position:absolute;inset:0;background:var(--ink);color:var(--paper);display:flex;align-items:center;justify-content:center;font-size:11px;letter-spacing:.3em;text-transform:uppercase;opacity:0;transform:scale(1.5) rotate(-4deg);pointer-events:none}
.stamp-btn[data-copied="true"] .slam{animation:slam .62s cubic-bezier(.2,.9,.2,1) forwards}
@keyframes slam{0%{opacity:0;transform:scale(1.6) rotate(-6deg)}22%{opacity:1;transform:scale(1) rotate(-2deg)}78%{opacity:1;transform:scale(1) rotate(-2deg)}100%{opacity:0;transform:scale(1) rotate(-2deg)}}
@media(prefers-reduced-motion:reduce){.stamp-btn[data-copied="true"] .slam{animation:none;opacity:1;transform:none}}
.card-tags{display:flex;flex-wrap:wrap;gap:4px 6px;margin-top:7px}
.card-tag{font-family:var(--mono);font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-soft);border-bottom:1px solid var(--ink-soft);padding-bottom:1px}
.card-tag:hover{color:var(--ink);border-color:var(--ink)}
.stage{padding:90px 0;text-align:center;font-family:var(--mono);font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-soft)}
.scrim{position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:60;display:flex;align-items:flex-start;justify-content:center;padding:22px 16px 60px;overflow-y:auto}
.viewer{background:var(--paper);border:3px solid var(--ink);width:100%;max-width:720px}
.viewer-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 16px;border-bottom:2px solid var(--ink)}
.viewer-head h2{font-family:var(--display);text-transform:uppercase;font-size:24px;font-weight:400;line-height:1;overflow:hidden;text-overflow:ellipsis}
.btn{font-family:var(--mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;padding:9px 16px;border:2px solid var(--ink);background:var(--paper)}
.btn:hover{background:var(--ink);color:var(--paper)}
.viewer-body{padding:16px}
.viewer-body .stamp-btn{border:2px solid var(--ink);margin-bottom:14px}
.viewer-note{font-family:var(--mono);font-size:12.5px;line-height:1.7;white-space:pre-wrap;border-left:3px solid var(--ink);padding-left:11px;margin-bottom:16px}
.note-code{position:relative;background:var(--paper-dim);border:2px solid var(--ink);padding:12px 70px 12px 12px;margin-bottom:16px}
.note-code pre{font-family:var(--mono);font-size:12px;line-height:1.6;white-space:pre-wrap;word-break:break-word}
.note-code-copy{position:absolute;top:10px;right:10px;font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;border:2px solid var(--ink);background:var(--paper);padding:5px 9px;cursor:pointer}
.note-code-copy:hover{background:var(--ink);color:var(--paper)}
.note-code-copy[data-copied="true"]{background:var(--ink);color:var(--paper)}
.viewer-label{font-family:var(--mono);font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:var(--ink-soft);margin-bottom:8px}
.viewer-main{border:2px solid var(--ink);margin-bottom:16px}
.viewer-main img{width:100%;display:block}
.viewer-extras{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
@media(min-width:620px){.viewer-extras{grid-template-columns:repeat(3,1fr)}}
.viewer-extras a{border:2px solid var(--ink);display:block;aspect-ratio:1/1;overflow:hidden}
.viewer-extras img{width:100%;height:100%;object-fit:cover;display:block}
.saved-note{font-family:var(--mono);font-size:10px;letter-spacing:.1em;color:var(--ink-soft);border-top:1px solid var(--ink);margin-top:40px;padding-top:14px;line-height:1.7}
</style>
</head>
<body>
<div class="shell">
  <header class="masthead">
    <p class="eyebrow">NovelAI · Artist Index</p>
    <h1 class="wordmark">NAI<br>MATOME</h1>
    <span class="count" id="count"></span>
  </header>
  <div class="controls">
    <input class="search" id="q" type="text" placeholder="아티스트 찾기">
  </div>
  <div class="setlist" id="setlist"></div>
  <div class="grid" id="grid"></div>
  <p class="saved-note">${savedAt}에 저장한 사본입니다. 그림은 원본 주소를 불러오므로 인터넷 연결이 필요합니다.</p>
</div>

<script id="payload" type="application/json">${data}</script>
<script>
(function(){
  var items = JSON.parse(document.getElementById("payload").textContent);
  var active = [], q = "";
  var grid = document.getElementById("grid");
  var setlist = document.getElementById("setlist");
  var count = document.getElementById("count");

  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }

  function parseNote(note){
    var parts = [], re = /\`\`\`([\\s\\S]*?)\`\`\`/g, last = 0, m;
    while ((m = re.exec(note)) !== null) {
      if (m.index > last) parts.push({type:"text", content: note.slice(last, m.index)});
      parts.push({type:"code", content: m[1].replace(/^\\n/, "").replace(/\\n$/, "")});
      last = re.lastIndex;
    }
    if (last < note.length) parts.push({type:"text", content: note.slice(last)});
    return parts.filter(function(p){ return p.content.trim().length > 0; });
  }

  function renderNote(note){
    return parseNote(note).map(function(p){
      if (p.type === "code") {
        return '<div class="note-code"><pre>' + esc(p.content) + '</pre>' +
          '<button class="note-code-copy" data-copy="' + esc(p.content) + '">복사</button></div>';
      }
      return '<p class="viewer-note">' + esc(p.content.trim()) + '</p>';
    }).join("");
  }

  function copy(text, btn){
    var done = function(){
      btn.setAttribute("data-copied","true");
      setTimeout(function(){ btn.removeAttribute("data-copied"); }, 650);
    };
    if (navigator.clipboard) { navigator.clipboard.writeText(text).then(done, done); return; }
    var ta = document.createElement("textarea");
    ta.value = text; ta.style.position="fixed"; ta.style.opacity="0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch(e){}
    document.body.removeChild(ta); done();
  }

  var allTags = [];
  items.forEach(function(i){ (i.tags||[]).forEach(function(t){
    if (allTags.indexOf(t) === -1) allTags.push(t); }); });
  allTags.sort(function(a,b){ return a.localeCompare(b, "ko"); });

  count.textContent = items.length + "명 수록 · " + allTags.length + "개 스타일";

  function openViewer(item){
    var extras = item.extra_images || [];
    var scrim = document.createElement("div");
    scrim.className = "scrim";
    scrim.innerHTML =
      '<div class="viewer">' +
        '<div class="viewer-head"><h2>' + esc(item.artist) + '</h2>' +
        '<button class="btn" data-close>닫기</button></div>' +
        '<div class="viewer-body">' +
          '<button class="stamp-btn" data-copy="' + esc(item.artist) + ', ">' +
            '<span class="label">' + esc(item.artist) + ', </span>' +
            '<span class="hint">눌러서 복사</span><span class="slam">복사됨</span>' +
          '</button>' +
          (item.image_url ? '<div class="viewer-main"><img src="' + esc(item.image_url) + '" alt=""></div>' : "") +
          (item.note ? renderNote(item.note) : "") +
          (extras.length ? '<p class="viewer-label">확인용 이미지 ' + extras.length + '장</p><div class="viewer-extras">' +
            extras.map(function(s){ return '<a href="' + esc(s) + '" target="_blank" rel="noreferrer"><img src="' + esc(s) + '" alt="" loading="lazy"></a>'; }).join("") +
            '</div>' : "") +
        '</div>' +
      '</div>';
    function close(){ scrim.remove(); document.removeEventListener("keydown", onKey); }
    function onKey(e){ if (e.key === "Escape") close(); }
    scrim.addEventListener("click", function(e){
      if (e.target === scrim || e.target.hasAttribute("data-close")) close();
      var c = e.target.closest("[data-copy]");
      if (c) copy(c.getAttribute("data-copy"), c);
    });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(scrim);
  }

  function renderTags(){
    var html = '<span class="setlist-label">스타일</span>';
    allTags.forEach(function(t){
      html += '<button class="tag-btn" data-tag="' + esc(t) + '" data-on="' +
        (active.indexOf(t) > -1) + '">' + esc(t) + '</button>';
    });
    if (active.length) html += '<button class="tag-clear" data-clear>전체 보기</button>';
    setlist.innerHTML = allTags.length ? html : "";
  }

  function renderGrid(){
    var query = q.trim().toLowerCase();
    var shown = items.filter(function(i){
      if (query && i.artist.toLowerCase().indexOf(query) === -1 &&
          (i.note||"").toLowerCase().indexOf(query) === -1) return false;
      return active.every(function(t){ return (i.tags||[]).indexOf(t) > -1; });
    });

    if (!shown.length){ grid.innerHTML = '<div class="stage">찾은 항목이 없습니다</div>'; return; }

    grid.innerHTML = shown.map(function(i, idx){
      var extras = (i.extra_images||[]).length;
      return '<article class="card">' +
        '<div class="card-frame" data-open="' + idx + '">' +
          (i.image_url ? '<img src="' + esc(i.image_url) + '" alt="' + esc(i.artist) + '" loading="lazy">'
                       : '<div class="card-frame-empty">이미지 없음</div>') +
          (extras ? '<span class="extra-flag">+' + extras + '</span>' : "") +
        '</div>' +
        '<button class="stamp-btn" data-copy="' + esc(i.artist) + ', ">' +
          '<span class="label">' + esc(i.artist) + ', </span>' +
          '<span class="hint">눌러서 복사</span><span class="slam">복사됨</span>' +
        '</button>' +
        ((i.tags||[]).length ? '<div class="card-tags">' + i.tags.map(function(t){
          return '<button class="card-tag" data-tag="' + esc(t) + '">' + esc(t) + '</button>'; }).join("") + '</div>' : "") +
      '</article>';
    }).join("");
    grid.__shown = shown;
  }

  document.addEventListener("click", function(e){
    var c = e.target.closest("[data-copy]");
    if (c && !e.target.closest(".scrim")) { copy(c.getAttribute("data-copy"), c); return; }
    var t = e.target.closest("[data-tag]");
    if (t && !e.target.closest(".scrim")) {
      var tag = t.getAttribute("data-tag");
      var k = active.indexOf(tag);
      if (k > -1) active.splice(k,1); else active.push(tag);
      renderTags(); renderGrid(); return;
    }
    if (e.target.closest("[data-clear]")) { active = []; renderTags(); renderGrid(); return; }
    var o = e.target.closest("[data-open]");
    if (o && !e.target.closest(".scrim")) openViewer(grid.__shown[+o.getAttribute("data-open")]);
  });

  document.getElementById("q").addEventListener("input", function(e){
    q = e.target.value; renderGrid();
  });

  renderTags(); renderGrid();
})();
</script>
</body>
</html>`;
}

/** 만들어진 HTML을 파일로 내려받게 한다 */
export function downloadExport(items: Artist[]) {
  const html = buildExportHtml(items);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `nai-matome-${stamp}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
