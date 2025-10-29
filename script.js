
// Full app script for gift_for_you (complete features)
const STORAGE_KEY = 'gift_for_you_complete_v1';
let state = localStorage.getItem(STORAGE_KEY) ? JSON.parse(localStorage.getItem(STORAGE_KEY)) : {
  settings: { title: 'Happy Birthday ❤️', subtitle: 'Every day with you is a new chapter in my favorite story.', frontImage: 'heart.jpg', audioMode: 'default', audioData: null, credentials: { adminUser:'admin', adminPass:'admin', receiverUser:'receiver', receiverPass:'receiver', receiverRequiresPass:true } },
  messages: [], nextId: 1, activity: [], users: []
};
let currentUser = null;
const bgPlayer = document.getElementById('bgPlayer');
let playing = false;

function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); renderAll(); }
function toast(msg, short=false){ const el=document.createElement('div'); el.className='toast'; el.textContent=msg; document.body.appendChild(el); setTimeout(()=>el.remove(), short?1600:3600); }
function vibrate(){ if(navigator.vibrate) navigator.vibrate(60); }
function fmt(iso){ return new Date(iso).toLocaleString(); }

document.addEventListener('DOMContentLoaded', ()=>{
  try{
    document.getElementById('siteTitle').textContent = state.settings.title;
    document.getElementById('subtitle').textContent = state.settings.subtitle;
    if(state.settings.frontImage) document.getElementById('heartImage').src = state.settings.frontImage;
    // audio
    if(state.settings.audioMode === 'default'){ configureAudioSource('lofi.mp3'); attemptPlay(); document.getElementById('toggleAudioBtn').style.display='inline-block'; }
    else if(state.settings.audioData){ configureAudioSource(state.settings.audioData); document.getElementById('toggleAudioBtn').style.display='inline-block'; }
    else { document.getElementById('toggleAudioBtn').style.display='none'; }
    renderAll();
    setTimeout(()=>document.body.classList.add('loaded'),300);
  }catch(e){ console.warn(e); }

  // attach events
  document.getElementById('loginToggle').addEventListener('click', openLogin);
  document.getElementById('closeLogin').addEventListener('click', closeLogin);
  document.getElementById('doLogin').addEventListener('click', doLogin);
  document.getElementById('addMessageBtn').addEventListener('click', addMessage);
  document.getElementById('audioMode').addEventListener('change', audioModeChange);
  document.getElementById('audioUpload').addEventListener('change', audioUploadChange);
  document.getElementById('audioLink').addEventListener('blur', audioLinkSet);
  document.getElementById('toggleAudioBtn').addEventListener('click', toggleAudio);
  document.getElementById('exportJson').addEventListener('click', exportJson);
  document.getElementById('importJson').addEventListener('click', importJson);
  document.getElementById('resetAll').addEventListener('click', resetAll);
  document.getElementById('fab').addEventListener('click', fabTip);
  document.getElementById('settingsBtn').addEventListener('click', openSettings);

  document.getElementById('subtitle').addEventListener('click', ()=>{ if(!currentUser || currentUser.role!=='admin') return; const el=document.getElementById('subtitle'); el.contentEditable=true; el.focus(); });
  document.getElementById('subtitle').addEventListener('blur', ()=>{ state.settings.subtitle = document.getElementById('subtitle').textContent; saveState(); });

  document.getElementById('heartImage').addEventListener('click', ()=>{
    if(!currentUser || currentUser.role!=='admin') return;
    const ip=document.createElement('input'); ip.type='file'; ip.accept='image/*'; ip.onchange=(e)=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=(ev)=>{ state.settings.frontImage=ev.target.result; document.getElementById('heartImage').src=ev.target.result; state.activity.push('Admin updated heart image at '+new Date().toLocaleString()); saveState(); toast('Image updated', true); }; r.readAsDataURL(f); }; ip.click();
  });
});

// LOGIN
function openLogin(){ document.getElementById('loginModal').classList.remove('hidden'); }
function closeLogin(){ document.getElementById('loginModal').classList.add('hidden'); }
function doLogin(){
  const name = document.getElementById('loginName').value.trim();
  const role = document.getElementById('loginRole').value;
  const pass = document.getElementById('loginPass').value;
  if(!name){ alert('Enter your name'); return; }
  if(role === 'admin'){
    if(pass !== state.settings.credentials.adminPass){ alert('Wrong admin password'); return; }
  } else {
    if(state.settings.credentials.receiverRequiresPass && pass !== state.settings.credentials.receiverPass){ alert('Wrong receiver password'); return; }
  }
  currentUser = { name, role };
  state.users.push({ name, role, when: new Date().toISOString() });
  document.getElementById('userLabel').innerText = name + ' (' + role + ')';
  document.getElementById('loginName').value=''; document.getElementById('loginPass').value='';
  closeLogin();
  document.getElementById('app').classList.remove('hidden');
  saveState();
  startObserver();
  toast('Logged in as '+role, true);
}

// MESSAGES
function addMessage(){
  if(!currentUser || currentUser.role !== 'admin'){ alert('Only admin can add messages'); return; }
  const title = document.getElementById('msgTitle').value.trim();
  const content = document.getElementById('msgContent').value.trim();
  const date = document.getElementById('msgDate').value || null;
  const time = document.getElementById('msgTime').value || null;
  if(!content){ alert('Write content'); return; }
  const msg = { id: state.nextId++, title, content, created: new Date().toISOString(), scheduled: date, scheduledTime: time, released: date? false : true, postedOn: date? null : new Date().toISOString(), comments: [], seenAt: null, preEdits: [] };
  state.messages.push(msg);
  state.activity.push('Admin added message \"'+(title||'untitled')+'\" at '+new Date().toLocaleString());
  document.getElementById('msgTitle').value=''; document.getElementById('msgContent').value='';
  saveState(); toast('Message added', true);
}

// RENDER
function renderAll(){
  try{
    document.getElementById('siteTitle').textContent = state.settings.title;
    document.getElementById('subtitle').textContent = state.settings.subtitle;
    if(state.settings.frontImage) document.getElementById('heartImage').src = state.settings.frontImage;
    const container = document.getElementById('messagesContainer'); container.innerHTML='';
    const msgs = state.messages.filter(m=>m.released);
    if(!msgs.length) container.innerHTML = '<div class=\"small center\">No messages yet</div>';
    msgs.slice().reverse().forEach(m=> container.appendChild(buildMsg(m)));
    document.getElementById('activityLog').innerHTML = state.activity.slice().reverse().map(a=>'<div class=\"small\">'+a+'</div>').join('<hr/>');
  }catch(e){ console.warn(e); }
}

function buildMsg(m){
  const el = document.createElement('div'); el.className='msg'; el.dataset.id = m.id;
  const meta = document.createElement('div'); meta.className='meta'; meta.innerHTML = '<strong>' + (m.title||'(No title)') + '</strong> • ' + fmt(m.created); el.appendChild(meta);
  const body = document.createElement('div'); body.style.whiteSpace='pre-line'; body.textContent = m.content; el.appendChild(body);
  if(currentUser && currentUser.role === 'admin'){ const seen = document.createElement('div'); seen.className='small'; seen.style.marginTop='6px'; seen.textContent = 'Status: ' + (m.seenAt ? ('Seen at ' + fmt(m.seenAt)) : 'Unseen'); el.appendChild(seen); }
  if(m.audio){ const a = document.createElement('audio'); a.controls = true; a.src = m.audio; el.appendChild(a); }
  const comments = document.createElement('div'); comments.style.marginTop='10px'; comments.innerHTML = '<div style=\"font-weight:700\">Aap kuch kehna chahenge ?</div>';
  (m.comments||[]).forEach(c=>{
    const cbox = document.createElement('div'); cbox.className='comment';
    const meta = document.createElement('div'); meta.className='small'; meta.textContent = c.by + ' • ' + fmt(c.when); cbox.appendChild(meta);
    const txt = document.createElement('div'); txt.textContent = c.text; cbox.appendChild(txt);
    if(c.history && c.history.length){ c.history.forEach(h=>{ const he = document.createElement('div'); he.className='history-entry'; he.textContent = 'Edited on ' + fmt(h.when) + ' → ' + h.text; cbox.appendChild(he); }); }
    if(currentUser && currentUser.name === c.by){ const eb = document.createElement('button'); eb.className='ghost'; eb.textContent='Edit'; eb.onclick=()=>{ const nt = prompt('Edit comment', c.text); if(nt!==null){ c.history = c.history||[]; c.history.push({when:new Date().toISOString(), text:c.text}); c.preEdits = c.preEdits||[]; c.preEdits.push({when:new Date().toISOString(), text:c.text}); c.text = nt; c.editedAt = new Date().toISOString(); state.activity.push(c.by + ' edited a comment on \"'+(m.title||'untitled')+'\" at ' + new Date().toLocaleString()); saveState(); vibrate(); toast('Comment updated', true); } }; cbox.appendChild(eb); }
    if(currentUser && currentUser.role === 'admin' && c.preEdits && c.preEdits.length){ const sep = document.createElement('div'); sep.className='small'; sep.style.marginTop='8px'; sep.textContent = 'Admin: previous versions (hidden from receiver):'; cbox.appendChild(sep); c.preEdits.forEach(pe=>{ const p = document.createElement('div'); p.className='history-entry'; p.style.opacity=0.7; p.textContent = 'On ' + fmt(pe.when) + ' → ' + pe.text; cbox.appendChild(p); }); }
    comments.appendChild(cbox);
  });
  if(currentUser && currentUser.role === 'receiver'){ const add = document.createElement('button'); add.className='btn-primary'; add.textContent='Add Comment'; add.onclick=()=>{ const txt = prompt('Write your comment'); if(txt){ const c = { id: state.nextId++, by: currentUser.name, when: new Date().toISOString(), text: txt, history: [], preEdits: [] }; m.comments = m.comments||[]; m.comments.push(c); state.activity.push(currentUser.name + ' commented on \"'+(m.title||'untitled')+'\" at ' + new Date().toLocaleString()); saveState(); vibrate(); toast('Comment added', true); } }; comments.appendChild(add); }
  el.appendChild(comments);
  if(currentUser && currentUser.role === 'admin'){
    const ar = document.createElement('div'); ar.style.marginTop='8px'; ar.style.display='flex'; ar.style.gap='8px';
    const ed = document.createElement('button'); ed.className='ghost'; ed.textContent='Edit'; ed.onclick=()=>{ const nc = prompt('Edit message', m.content); if(nc!==null){ m.preEdits = m.preEdits||[]; m.preEdits.push({when:new Date().toISOString(), text:m.content}); m.content = nc; state.activity.push('Admin edited message \"'+(m.title||'')+'\" at '+new Date().toLocaleString()); saveState(); toast('Message edited', true); } };
    const rem = document.createElement('button'); rem.className='delete-btn'; rem.textContent='Delete'; rem.onclick=()=>{ if(confirm('Delete message?')){ state.messages = state.messages.filter(x=>x.id!==m.id); state.activity.push('Admin deleted message \"'+(m.title||'')+'\" at '+new Date().toLocaleString()); saveState(); toast('Deleted', true); } };
    const addAudioBtn = document.createElement('button'); addAudioBtn.className='ghost'; addAudioBtn.textContent='Add Audio'; addAudioBtn.onclick=()=>{ const ip = document.createElement('input'); ip.type='file'; ip.accept='audio/*'; ip.onchange=(e)=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=(ev)=>{ m.audio = ev.target.result; saveState(); toast('Audio added to message', true); }; r.readAsDataURL(f); }; ip.click(); };
    ar.appendChild(ed); ar.appendChild(rem); ar.appendChild(addAudioBtn); el.appendChild(ar);
  }
  return el;
}

// AUDIO
function audioModeChange(e){ const v=e.target.value; document.getElementById('audioUpload').classList.add('hidden'); document.getElementById('audioLink').classList.add('hidden'); if(v==='upload') document.getElementById('audioUpload').classList.remove('hidden'); if(v==='link') document.getElementById('audioLink').classList.remove('hidden'); if(v==='none'){ state.settings.audioMode='none'; state.settings.audioData=null; bgPlayer.pause(); bgPlayer.src=''; document.getElementById('toggleAudioBtn').style.display='none'; saveState(); } }
function audioUploadChange(e){ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=(ev)=>{ state.settings.audioMode='upload'; state.settings.audioData=ev.target.result; configureAudioSource(ev.target.result); document.getElementById('toggleAudioBtn').style.display='inline-block'; state.activity.push('Admin set background audio (upload) at '+new Date().toLocaleString()); saveState(); attemptPlay(); toast('Background audio set', true); }; r.readAsDataURL(f); }
function audioLinkSet(e){ const v=e.target.value.trim(); if(!v) return; state.settings.audioMode='link'; state.settings.audioData=v; configureAudioSource(v); document.getElementById('toggleAudioBtn').style.display='inline-block'; state.activity.push('Admin set background audio (link) at '+new Date().toLocaleString()); saveState(); attemptPlay(); toast('Audio link set', true); }
function toggleAudio(){ if(!bgPlayer.src){ toast('No background audio'); return; } if(!playing){ bgPlayer.play().catch(()=>{ toast('Tap to allow audio'); }); playing=true; document.getElementById('toggleAudioBtn').textContent='Pause'; } else { bgPlayer.pause(); playing=false; document.getElementById('toggleAudioBtn').textContent='Play'; } }
function configureAudioSource(src){ bgPlayer.src = src; try{ bgPlayer.load(); }catch(e){ console.warn(e); } playing=false; document.getElementById('toggleAudioBtn').textContent='Play'; document.getElementById('toggleAudioBtn').style.display='inline-block'; }
function attemptPlay(){ try{ bgPlayer.play(); playing=true; document.getElementById('toggleAudioBtn').textContent='Pause'; }catch(e){ console.warn('autoplay blocked', e); } }

// IMPORT/EXPORT/RESET
function exportJson(){ const blob = new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'gift-backup.json'; a.click(); }
function importJson(){ const inp = document.createElement('input'); inp.type='file'; inp.accept='application/json'; inp.onchange=(e)=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=(ev)=>{ try{ const obj=JSON.parse(ev.target.result); state = obj; saveState(); toast('Imported data', true); }catch(err){ alert('Invalid JSON'); } }; r.readAsText(f); }; inp.click(); }
function resetAll(){ if(confirm('Reset local data? This cannot be undone (unless you exported).')){ localStorage.removeItem(STORAGE_KEY); location.reload(); } }

// OBSERVER
let observer = null;
function startObserver(){ if(observer) observer.disconnect(); observer = new IntersectionObserver(entries=>{ entries.forEach(ent=>{ if(ent.isIntersecting){ const id = Number(ent.target.dataset.id); const m = state.messages.find(x=>x.id===id); if(m && !m.seenAt){ m.seenAt = new Date().toISOString(); state.activity.push('Message \"'+(m.title||'')+'\" seen by receiver at '+new Date().toLocaleString()); saveState(); if(currentUser && currentUser.role==='admin'){ toast('Seen: '+(m.title||'(untitled)'), true); vibrate(); } } } }); },{threshold:0.6}); document.querySelectorAll('.msg').forEach(n=>observer.observe(n)); }

// Scheduled release
setInterval(()=>{ const now=new Date(); let changed=false; state.messages.forEach(m=>{ if(m.released) return; if(!m.scheduled) return; const time = m.scheduledTime || '09:00'; const when = new Date(m.scheduled + 'T' + time); if(when <= now){ m.released = true; m.postedOn = new Date().toISOString(); changed=true; state.activity.push('Message \"'+(m.title||'')+'\" released at '+new Date().toLocaleString()); } }); if(changed) saveState(); },30000);

// UI helpers
function fabTip(){ if(!currentUser){ openLogin(); return; } if(currentUser.role==='admin'){ alert('Admin tips:\\n• Use Composer to add messages\\n• Click heart to change image\\n• Upload background audio or paste link\\n• Export/Import to backup'); } else { alert('Receiver tips:\\n• Add comment below any message\\n• You can edit your comments\\n• Add reminders'); } }
function openSettings(){ if(!currentUser || currentUser.role!=='admin'){ alert('Only admin'); return; } const newT = prompt('Edit site title', state.settings.title); if(newT !== null){ state.settings.title = newT; state.activity.push('Admin changed title at '+new Date().toLocaleString()); } if(confirm('Change credentials?')){ const au = prompt('Admin user', state.settings.credentials.adminUser)||state.settings.credentials.adminUser; const ap = prompt('Admin pass', state.settings.credentials.adminPass)||state.settings.credentials.adminPass; const ru = prompt('Receiver user', state.settings.credentials.receiverUser)||state.settings.credentials.receiverUser; const rp = prompt('Receiver pass', state.settings.credentials.receiverPass)||state.settings.credentials.receiverPass; state.settings.credentials.adminUser=au; state.settings.credentials.adminPass=ap; state.settings.credentials.receiverUser=ru; state.settings.credentials.receiverPass=rp; state.activity.push('Admin updated credentials at '+new Date().toLocaleString()); } saveState(); toast('Settings updated', true); }

// init
(function init(){ state.messages.forEach(m=>{ if(!m.scheduled) m.released = true; }); saveState(); renderAll(); startObserver(); })();
setInterval(()=>{ saveState(); },3000);
window.__gift_state = state; window.__saveGift = saveState;
