// ===== Shared scores: screens. Wraps the single-player UI instead of replacing it. =====

// ---------- small helpers ----------
function mpAgo(ms){
  const m = Math.floor(ms / 60000);
  if (m < 1) return t('mpNow');
  if (m < 60) return fill(t('mpMinAgo'), [m]);
  const h = Math.floor(m / 60);
  return h < 24 ? fill(t('mpHrAgo'), [h]) : fill(t('mpDayAgo'), [Math.floor(h / 24)]);
}
function mpWhen(e){
  const when = MONTHS[LANG][((e.t % 12) + 12) % 12] + ' ' + (START_YEAR + Math.floor(e.t / 12));
  const what = e.over === 'fail' ? t('mpFell') : e.over === 'end' ? t('mpFinished') : t('mpPlaying');
  return when + ' · ' + what;
}
const mpStateTxt = () => ({ live:t('mpLive'), syncing:t('mpSyncing'), offline:t('mpOffline'), codes:t('mpNoServer') }[MP.state] || '');
function mpCopy(text, okMsg){
  const done = () => toast('✅ ' + (okMsg || t('mpCopied')));
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(done, () => mpShowText(text));
  } catch(e){}
  mpShowText(text);
}
function mpShowText(text){
  modal(`<h2>${t('mpCopyFail')}</h2><textarea class="code" readonly onclick="this.select()">${esc(text)}</textarea>
  <button class="btn primary" data-act="close">${t('gotIt')}</button>`);
  const ta = $('#modal textarea'); if (ta){ ta.focus(); ta.select(); }
}

// ---------- the scoreboard panel ----------
function mpRow(e){
  const flag = e.me ? `<i class="you">${t('mpYou')}</i>` : e.src === 'code' ? `<i class="code">${t('mpFromCode')}</i>` : '';
  const stale = !e.me && e.age > 120000 ? `<span class="ago">${esc(mpAgo(e.age))}</span>` : '';
  return `<div class="mprow${e.me ? ' me' : ''}${e.over ? ' done' : ''}">
    <span class="pl">${e.place}</span><span class="gr g-${e.grade}">${e.grade}</span>
    <span class="nm"><b>${esc(e.name)}</b>${flag}<small>${esc(mpWhen(e))} ${stale}</small></span>
    <span class="sc">${Math.round(e.score)}</span></div>`;
}
function mpPanel(){
  if (!MP.open || !MP.room) return '';
  const rows = MP.roster, others = rows.filter(e => !e.me).length;
  return `<aside class="mppanel" role="region" aria-label="${t('mpOpenBoard')}">
    <div class="head"><div class="dic" aria-hidden="true">🏆</div>
      <div class="ht"><h2>${t('mpFriends')}</h2><div class="sub">${fill(t('mpInRoom'), [esc(MP.room)])} · <span class="dot ${MP.state}"></span>${esc(mpStateTxt())}</div></div>
      <button class="close" data-act="mpClose" aria-label="${t('mpCloseBoard')}">✕</button></div>
    <div class="body">
      ${MP.state === 'offline' ? `<p class="mpnote bad">${t('mpOfflineTxt')}</p>` : ''}
      ${MP.state === 'codes' ? `<p class="mpnote">${t('mpNoServerTxt')}</p>` : ''}
      ${rows.length ? rows.map(mpRow).join('') : `<p class="muted">${t('mpStartFirst')}</p>`}
      ${others ? '' : `<p class="muted mpalone">${t('mpAlone')}</p>`}
      <p class="mpnote small">${t('mpRules')}</p>
    </div>
    <div class="foot">
      <button class="btn primary small" data-act="mpInvite">🔗 ${t('mpInvite')}</button>
      <button class="btn small" data-act="mpCode">🔑 ${t('mpMyCode')}</button>
      <button class="btn small" data-act="mpPaste">➕ ${t('mpAddCode')}</button>
      <button class="btn small" data-act="mpServer">⚙️ ${t('mpServerBtn')}</button>
      <button class="btn small" data-act="mpLeave">🚪 ${t('mpLeaveBtn')}</button>
    </div></aside>`;
}
function mpHudBtn(){
  if (!MP.room) return `<button class="iconbtn" data-act="mpLobby" aria-label="${t('mpTitle')}" title="${t('mpTitle')}">🏆</button>`;
  const n = MP.roster.length;
  return `<button class="iconbtn mpchip s-${MP.state}" data-act="mpBoard" aria-label="${t('mpOpenBoard')}" title="${t('mpOpenBoard')}">🏆 <b>${MP.rank && n > 1 ? fill(t('mpRankOf'), [MP.rank, n]) : esc(MP.room)}</b></button>`;
}
// Repaint only the two things that change; the rest of the board is untouched.
function mpPaint(){
  const box = $('#mpbox'); if (box) box.innerHTML = mpPanel();
  const chip = $('#hud [data-act="mpBoard"], #hud [data-act="mpLobby"]');
  if (chip){ const tmp = document.createElement('div'); tmp.innerHTML = mpHudBtn(); chip.replaceWith(tmp.firstElementChild); }
}

// ---------- screens ----------
function mpLobby(msg){
  const room = MP.room || MP.pendingRoom || '';
  modal(`<div class="tut-icon" aria-hidden="true">🏆</div><h2>${t('mpTitle')}</h2><p class="lede">${t('mpSub')}</p>
  ${msg ? `<p class="why">${esc(msg)}</p>` : ''}
  <label class="mpfield"><span>${t('mpName')}</span><input id="mpname" maxlength="18" placeholder="${t('mpNamePh')}" value="${esc(MP.name || '')}"></label>
  <label class="mpfield"><span>${t('mpRoom')}</span><input id="mproom" maxlength="10" placeholder="${t('mpRoomPh')}" value="${esc(room)}" style="text-transform:uppercase"></label>
  <div class="row" style="margin-top:12px">
    <button class="btn primary" data-act="mpGo">${t('mpGo')}</button>
    <button class="btn" data-act="mpNew">✨ ${t('mpCreateBtn')}</button>
    ${MP.room ? `<button class="btn" data-act="mpLeave">${t('mpLeaveBtn')}</button>` : `<button class="btn" data-act="mpSkip">${t('mpPlayAlone')}</button>`}
  </div>
  <p class="muted small" style="margin-top:12px">${t('mpRules')}</p>
  <div class="row" style="margin-top:6px"><button class="btn small" data-act="mpServer">⚙️ ${MP.relay ? esc(fill(t('mpServerHost'), [mpHost(MP.relay)])) : t('mpServerNone')}</button></div>`);
  const f = $('#mpname'); if (f) f.focus();
}
// Leaving the lobby for the server settings must not throw away what the player already typed.
function mpStash(){
  const n = $('#mpname'), r = $('#mproom');
  if (n) MP.name = mpNameOk(n.value);
  if (r) MP.pendingRoom = mpRoomOk(r.value);
}
function mpServerModal(msg){
  modal(`<h2>⚙️ ${t('mpServerTitle')}</h2><p class="lede">${t('mpServerTxt')}</p>
  ${msg ? `<p class="why">${esc(msg)}</p>` : ''}
  <label class="mpfield"><span>${t('mpServerTitle')}</span><input id="mprelay" placeholder="${t('mpServerPh')}" value="${esc(MP.relay || '')}" dir="ltr"></label>
  <div class="row" style="margin-top:12px"><button class="btn primary" data-act="mpRelaySave">${t('mpSave')}</button><button class="btn" data-act="mpBack">${t('back')}</button></div>`);
  const f = $('#mprelay'); if (f) f.focus();
}
function mpCodeModal(){
  const code = mpCode();
  if (!code) return modal(`<p class="lede">${t('mpStartFirst')}</p><button class="btn primary" data-act="close">${t('gotIt')}</button>`);
  mpCopy(code);
  modal(`<h2>🔑 ${t('mpMyCode')}</h2><p>${t('mpMyCodeTxt')}</p><textarea class="code" readonly onclick="this.select()">${esc(code)}</textarea>
  <div class="row"><button class="btn primary" data-act="mpBack">${t('back')}</button></div>`);
  const ta = $('#modal textarea'); if (ta){ ta.focus(); ta.select(); }
}
function mpPasteModal(msg){
  modal(`<h2>➕ ${t('mpAddCode')}</h2>${msg ? `<p class="why">${esc(msg)}</p>` : ''}
  <textarea class="code" id="mpcodein" placeholder="${t('pasteCode')}"></textarea>
  <div class="row"><button class="btn primary" data-act="mpAdd">${t('mpAddBtn')}</button><button class="btn" data-act="mpBack">${t('back')}</button></div>`);
  const f = $('#mpcodein'); if (f) f.focus();
}

// ---------- hooks into the single-player game ----------
const mpBaseFrame = ensureFrame;
ensureFrame = function(){
  mpBaseFrame();
  if (!$('#mpbox')){ const b = $('#board'); if (b){ const d = document.createElement('div'); d.id = 'mpbox'; b.appendChild(d); } }
};
const mpBaseHUD = renderHUD;
renderHUD = function(P){ return mpBaseHUD(P) + mpHudBtn(); };
const mpBaseRender = render;
render = function(force){
  mpBaseRender(force);
  const box = $('#mpbox'); if (box) box.innerHTML = mpPanel();
  const b = $('#board'); if (b) b.classList.toggle('has-mp', !!(MP.open && MP.room));
};
const mpBaseAdvance = advance;
advance = function(){ mpBaseAdvance(); if (MP.room) mpSync(false); };
const mpBaseBegin = begin;
begin = function(diff, mission){ mpBaseBegin(diff, mission); if (MP.room){ MP.lastScore = null; MP.above = {}; MP.seenOnce = false; mpSync(true); } };
['showFail', 'showLegacy', 'showMissionEnd', 'showMilestone'].forEach(fn => {
  if (typeof window[fn] !== 'function') return;
  const base = window[fn];
  window[fn] = function(){ const r = base.apply(this, arguments); if (MP.room) mpSync(true); return r; };
});
const mpBaseMenu = menu;
menu = function(){
  mpBaseMenu();
  const box = $('#modal .modal'); if (!box) return;
  const d = document.createElement('div');
  d.className = 'row'; d.style.marginTop = '10px';
  d.innerHTML = `<button class="btn primary" data-act="${MP.room ? 'mpBoard' : 'mpLobby'}">🏆 ${MP.room ? t('mpOpenBoard') : t('mpTitle')}</button>`;
  box.appendChild(d);
};
const mpBaseStart = startScreen;
startScreen = function(){
  mpBaseStart();
  const box = $('#modal .modal'); if (!box) return;
  const d = document.createElement('div');
  d.innerHTML = `<button class="opt" data-act="mpLobby"><b>🏆 ${t('mpTitle')}</b><span class="t">${t('mpSub')}</span></button>`;
  const anchor = box.querySelector('[data-act="loadcode"]');
  if (anchor) anchor.after(d.firstElementChild); else box.appendChild(d.firstElementChild);
};

// ---------- input ----------
document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act;
  if (a.slice(0, 2) !== 'mp') return;
  const val = el => { const x = $(el); return x ? x.value : ''; };
  switch(a){
    case 'mpLobby':   // opened from the start screen? come back to it, so the player still picks a difficulty
      MP.afterLobby = $('#modal [data-act="newgame"]') ? 'start' : 'close';
      return mpLobby();
    case 'mpBack': return MP.room ? closeModal() : mpLobby();
    case 'mpNew': { const f = $('#mproom'); if (f){ f.value = mpNewRoom(); f.focus(); } return; }
    case 'mpSkip': { MP.pendingRoom = ''; const back = MP.afterLobby === 'start'; MP.afterLobby = null; closeModal(); return back ? startScreen() : render(true); }
    case 'mpGo': {
      const name = mpNameOk(val('#mpname')), room = mpRoomOk(val('#mproom'));
      if (!name) return mpLobby(t('mpNeedName'));
      if (!room) return mpLobby(t('mpNeedRoom'));
      mpJoin(room, name); MP.open = true; closeModal();
      if (MP.afterLobby === 'start'){ MP.afterLobby = null; return startScreen(); }
      MP.afterLobby = null; return render(true);
    }
    case 'mpBoard': MP.open = true; mpLoop(); closeModal(); mpSync(true); return render(true);
    case 'mpClose': MP.open = false; mpLoop(); return render(true);
    case 'mpLeave': mpLeave(); closeModal(); return render(true);
    case 'mpInvite': return mpCopy(mpInviteLink());
    case 'mpCode': return mpCodeModal();
    case 'mpPaste': return mpPasteModal();
    case 'mpAdd': {
      const e = mpReadCode(val('#mpcodein'));
      if (!e) return mpPasteModal(t('mpBadCode'));
      mpSaveCode(e); mpMerge([], Date.now()); closeModal();
      toast('🏆 ' + fill(t('mpAdded'), [e.name])); MP.open = true;
      return render(true);
    }
    case 'mpServer': mpStash(); return mpServerModal();
    case 'mpRelaySave': {
      if (!mpSetRelay(val('#mprelay'))) return mpServerModal(t('mpServerBad'));
      closeModal(); if (!MP.room) return mpLobby();
      return render(true);
    }
  }
});

// ---------- boot ----------
(function(){
  const onStartScreen = !!$('#modal [data-act="newgame"]');
  mpBoot();
  if (MP.pendingRoom && MP.name && !MP.fromLink){ mpJoin(MP.pendingRoom, MP.name); MP.open = false; }
  else if (MP.pendingRoom || MP.fromLink){ MP.afterLobby = onStartScreen ? 'start' : 'close'; mpLobby(); }
  else if (onStartScreen) startScreen();   // 5-game.js drew it before this file wrapped it: draw it again, with the friends button
  if (S) render(true);
})();
