// Full final script implementing requested features (pure HTML/JS)
// Storage key
const STORAGE_KEY = 'gift_for_you_final_v2';

// Initial load or defaults
let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
if (!state.settings) {
  state = {
    settings: {
      title: 'Happy Birthday 💖',
      subtitle: 'Every day with you is a new chapter in my favorite story.',
      frontImage: '', // user will upload
      audioMode: 'none', // none | upload | link
      audioData: null,
      credentials: { adminUser: 'admin', adminPass: 'admin', receiverUser: 'receiver', receiverPass: 'receiver' }
    },
    messages: [],
    comments: [],
    reminders: [],
    activity: [],
    nextId: 1
  };
  saveState();
}

// DOM refs
const loginModal = document.getElementById('loginModal');
const doLogin = document.getElementById('doLogin');
const closeLogin = document.getElementById('closeLogin');
const loginName = document.getElementById('loginName');
const loginPass = document.getElementById('loginPass');
const loginError = document.getElementById('loginError');
const app = document.getElementById('app');
const siteTitle = document.getElementById('siteTitle');
const subtitle = document.getElementById('subtitle');
const heartImage = document.getElementById('heartImage');
const userLabel = document.getElementById('userLabel');
const toggleAudioBtn = document.getElementById('toggleAudioBtn');
const logoutBtn = document.getElementById('logoutBtn');

const openRead = document.getElementById('openRead');
const openArchive = document.getElementById('openArchive');
const openAdmin = document.getElementById('openAdmin');
const openInfo = document.getElementById('openInfo');

const readView = document.getElementById('readView');
const archiveView = document.getElementById('archiveView');
const adminView = document.getElementById('adminView');
const infoView = document.getElementById('infoView');

const todayContent = document.getElementById('todayContent');
const archiveContent = document.getElementById('archiveContent');
const contentList = document.getElementById('contentList');
const activityLog = document.getElementById('activityLog');

const addContentBtn = document.getElementById('addContentBtn');
const contentType = document.getElementById('contentType');
const contentTitle = document.getElementById('contentTitle');
const contentText = document.getElementById('contentText');
const scheduleDate = document.getElementById('scheduleDate');
const scheduleTime = document.getElementById('scheduleTime');
const attachAudio = document.getElementById('attachAudio');

const fab = document.getElementById('fab');
const fabMenu = document.getElementById('fabMenu');
const fabAddMsg = document.getElementById('fabAddMsg');
const fabAddComment = document.getElementById('fabAddComment');
const fabAddRem = document.getElementById('fabAddRem');

const bgPlayer = document.getElementById('bgPlayer');

// current user
let currentUser = null;

// helpers
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function fmt(iso){ return iso ? new Date(iso).toLocaleString() : ''; }
function escapeHtml(s){ if(!s && s!==0) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// init UI values
siteTitle.textContent = state.settings.title;
subtitle.textContent = state.settings.subtitle;
if(state.settings.frontImage) heartImage.src = state.settings.frontImage;
if(state.settings.audioData){ bgPlayer.src = state.settings.audioData; toggleAudioBtn.classList.remove('hidden'); }

// login actions
doLogin.addEventListener('click', ()=> {
  const name = (loginName.value||'').trim();
  const pass = (loginPass.value||'').trim();
  if(!name){ loginError.textContent = 'Enter username'; return; }
  if(name === state.settings.credentials.adminUser && pass === state.settings.credentials.adminPass){
    currentUser = { name, role: 'admin' };
  } else if(name === state.settings.credentials.receiverUser && pass === state.settings.credentials.receiverPass){
    currentUser = { name, role: 'receiver' };
  } else {
    loginError.textContent = 'Wrong credentials';
    return;
  }
  loginError.textContent = '';
  localStorage.setItem('gift_user', JSON.stringify(currentUser));
  showApp();
  state.activity.push(`${currentUser.name} logged in as ${currentUser.role} at ${new Date().toLocaleString()}`);
  saveState();
});
closeLogin.addEventListener('click', ()=> { loginModal.classList.add('hidden'); });

// show app after login
function showApp(){
  loginModal.classList.add('hidden');
  app.classList.remove('hidden');
  userLabel.textContent = `${currentUser.name} (${currentUser.role})`;
  logoutBtn.classList.remove('hidden');
  if(currentUser.role === 'admin') openAdmin.classList.remove('hidden');
  toggleAudioBtn.classList.remove('hidden');
  renderAll();
  // attempt autoplay if audio set
  setTimeout(()=>{ if(bgPlayer.src) bgPlayer.play().catch(()=>{}); }, 150);
}

// logout
logoutBtn.addEventListener('click', ()=>{ localStorage.removeItem('gift_user'); location.reload(); });

// editable title & subtitle save
siteTitle.addEventListener('blur', ()=>{ state.settings.title = siteTitle.textContent || 'Happy Birthday 💖'; document.getElementById('pageTitle').textContent = state.settings.title; state.activity.push(`Title changed by ${currentUser?currentUser.name:'?' } at ${new Date().toLocaleString()}`); saveState(); });
subtitle.addEventListener('blur', ()=>{ state.settings.subtitle = subtitle.textContent || ''; state.activity.push(`Subtitle changed by ${currentUser?currentUser.name:'?' } at ${new Date().toLocaleString()}`); saveState(); });

// heart image upload (admin)
heartImage.addEventListener('click', ()=> {
  if(!currentUser || currentUser.role !== 'admin') return;
  const ip = document.createElement('input'); ip.type='file'; ip.accept='image/*';
  ip.onchange = (e)=> {
    const f = e.target.files[0]; if(!f) return;
    const r = new FileReader(); r.onload = (ev)=> {
      state.settings.frontImage = ev.target.result;
      heartImage.src = ev.target.result;
      state.activity.push(`Admin updated heart image at ${new Date().toLocaleString()}`);
      saveState();
    }; r.readAsDataURL(f);
  }; ip.click();
});

// navigation
openRead.addEventListener('click', ()=> { showSection('read'); });
openArchive.addEventListener('click', ()=> { showSection('archive'); });
openAdmin.addEventListener('click', ()=> { showSection('admin'); });
openInfo.addEventListener('click', ()=> { showSection('info'); });

function showSection(name){
  readView.classList.add('hidden'); archiveView.classList.add('hidden'); adminView.classList.add('hidden'); infoView.classList.add('hidden');
  if(name==='read') readView.classList.remove('hidden');
  if(name==='archive') archiveView.classList.remove('hidden');
  if(name==='admin') adminView.classList.remove('hidden');
  if(name==='info') infoView.classList.remove('hidden');
}

// content management
addContentBtn.addEventListener('click', async ()=> {
  if(!currentUser || currentUser.role !== 'admin'){ alert('Only admin can add content'); return; }
  const type = contentType.value;
  const title = contentTitle.value.trim();
  const content = contentText.value.trim();
  const date = scheduleDate.value || null;
  const time = scheduleTime.value || '09:00';
  if(!content){ alert('Write content'); return; }
  let audioData = null;
  if(attachAudio.files && attachAudio.files[0]){
    audioData = await fileToBase64(attachAudio.files[0]);
  }
  const msg = { id: state.nextId++, type, title, content, dateAdded: new Date().toISOString(), scheduled: date, scheduledTime: time, released: date?false:true, postedOn: date?null:new Date().toISOString(), audio: audioData, comments: [], preEdits: [], seenAt: null };
  state.messages.push(msg);
  state.activity.push(`Admin added message "${title||'(No title)'}" at ${new Date().toLocaleString()}`);
  // clear
  contentTitle.value=''; contentText.value=''; scheduleDate.value=''; scheduleTime.value='09:00'; attachAudio.value='';
  saveState();
  renderAll();
});

// file to base64
function fileToBase64(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); }); }

// render functions
function renderAll(){
  renderToday();
  renderArchive();
  renderAdminList();
  renderActivity();
}
function renderToday(){
  const today = new Date().toISOString().split('T')[0];
  let content = state.messages.find(m=> m.scheduled === today && m.released) || state.messages.filter(m=>m.released).slice(-1)[0];
  const container = todayContent;
  if(content){
    container.innerHTML = buildMessageCard(content, true);
  } else {
    container.innerHTML = '<div class="muted-note">No content for today. Add some in Admin Panel.</div>';
  }
}
function renderArchive(){
  archiveContent.innerHTML = state.messages.slice().reverse().map(m=>`<div class="msg">${buildMessageHTML(m)}${buildMessageControls(m)}</div>`).join('') || '<div class="muted-note">No messages yet</div>';
  // attach comment buttons via delegation later
}
function renderAdminList(){
  contentList.innerHTML = state.messages.slice().reverse().map(m=>`<div style="padding:8px;background:#fff;border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center"><div><strong>${escapeHtml(m.title||'(No title)')}</strong><div class="small">${m.type} • ${new Date(m.dateAdded).toLocaleDateString()}</div></div><div><button class="btn ghost" data-edit="${m.id}">Edit</button><button class="btn ghost" data-delete="${m.id}">Delete</button></div></div>`).join('') || '<div class="muted-note">No content scheduled yet.</div>';
  // attach handlers
  document.querySelectorAll('[data-edit]').forEach(b=> b.onclick = ()=> editContent(Number(b.dataset.edit)));
  document.querySelectorAll('[data-delete]').forEach(b=> b.onclick = ()=> deleteContent(Number(b.dataset.delete)));
}
function renderActivity(){ activityLog.innerHTML = (state.activity || []).slice().reverse().map(a=>`<div class="small">${escapeHtml(a)}</div>`).join('') || '<div class="small">No activity</div>'; }

// build message HTML and controls
function buildMessageHTML(m){
  return `<div class="meta"><strong>${escapeHtml(m.title||'(No title)')}</strong> • ${new Date(m.dateAdded).toLocaleDateString()}</div><div style="white-space:pre-line">${escapeHtml(m.content)}</div>${m.audio?`<div class="audio-section"><audio controls src="${m.audio}"></audio></div>`:''}`;
}
function buildMessageControls(m){
  let html = '<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">';
  html += `<button class="btn ghost" data-comment-toggle="${m.id}">Comments</button>`;
  if(currentUser && currentUser.role === 'admin'){ html += `<button class="btn ghost" data-editmsg="${m.id}">Edit</button><button class="btn ghost" data-addaudio="${m.id}">Add Audio</button><button class="btn ghost" data-reminder="${m.id}">Add Reminder</button>`; }
  else if(currentUser){ html += `<button class="btn ghost" data-setrem="${m.id}">Set Reminder</button>`; }
  html += '</div>';
  html += `<div id="comments-${m.id}" class="comments-area"></div>`;
  return html;
}

// comment UI via delegation
document.addEventListener('click', function(e){
  const cbtn = e.target.closest('[data-comment-toggle]');
  if(cbtn){ const id = Number(cbtn.dataset.commentToggle); toggleComments(id); return; }
  const ed = e.target.closest('[data-editmsg]');
  if(ed){ editContent(Number(ed.dataset.editmsg)); return; }
  const adda = e.target.closest('[data-addaudio]');
  if(adda){ addAudioToMessage(Number(adda.dataset.addaudio)); return; }
  const rem = e.target.closest('[data-reminder]');
  if(rem){ addReminderAdmin(Number(rem.dataset.reminder)); return; }
  const srem = e.target.closest('[data-setrem]');
  if(srem){ setReminderForUser(Number(srem.dataset.setrem)); return; }
});

// toggle comments
function toggleComments(id){
  const area = document.getElementById('comments-'+id);
  if(!area) return;
  if(area.innerHTML.trim()!==''){ area.innerHTML=''; return; }
  const m = state.messages.find(x=>x.id===id);
  if(!m) return;
  // render existing comments
  let html = '<div style="font-weight:700">Aap kuch kehna chahenge ?</div>';
  (m.comments||[]).forEach(c=>{
    html += `<div class="comment"><div class="small"><strong>${escapeHtml(c.by)}</strong> • ${fmt(c.when)}</div><div>${escapeHtml(c.text)}</div>`;
    if(currentUser && currentUser.name === c.by){ html += `<div style="margin-top:6px;"><button class="btn ghost" data-editcomment="${c.id}" data-msg="${m.id}">Edit</button></div>`; }
    if(currentUser && currentUser.role === 'admin' && c.edits && c.edits.length){ html += `<div class="history-entry">Admin: previous versions:<br>${c.edits.map(h=>'On '+fmt(h.when)+' → '+escapeHtml(h.old)).join('<br>')}</div>`; }
    html += '</div>';
  });
  // add comment button if logged in
  if(currentUser){
    html += `<div style="margin-top:8px;"><button class="btn primary" data-addcomment="${m.id}">Add Comment</button></div>`;
  } else {
    html += `<div style="margin-top:8px;" class="muted-note">Login to comment</div>`;
  }
  area.innerHTML = html;
}

// add comment via delegation
document.addEventListener('click', function(e){
  const ac = e.target.closest('[data-addcomment]');
  if(ac){ const mid = Number(ac.dataset.addcomment); addCommentUI(mid); return; }
});

// add comment UI
function addCommentUI(mid){
  if(!currentUser){ alert('Login to comment'); return; }
  const txt = prompt('Write comment');
  if(!txt) return;
  const m = state.messages.find(x=>x.id===mid);
  const comment = { id: Date.now(), text: txt, by: currentUser.name, when: new Date().toISOString(), edits: [] };
  m.comments = m.comments || []; m.comments.push(comment);
  state.activity.push(`${currentUser.name} commented on "${m.title||''}" at ${new Date().toLocaleString()}`);
  saveState(); renderAll();
  // notify admin via vibration activity push
  navigator.vibrate && navigator.vibrate(40);
}

// edit comment (delegation)
document.addEventListener('click', function(e){
  const ec = e.target.closest('[data-editcomment]');
  if(ec){ const msgId = Number(ec.dataset.msg); const cid = Number(ec.dataset.editcomment); const m = state.messages.find(x=>x.id===msgId); if(!m) return; const c = m.comments.find(x=>x.id===cid); if(!c) return; const nt = prompt('Edit comment', c.text); if(nt!==null){ c.edits = c.edits || []; c.edits.push({ old: c.text, when: new Date().toISOString() }); c.text = nt; c.editedAt = new Date().toISOString(); state.activity.push(`${c.by} edited a comment at ${new Date().toLocaleString()}`); saveState(); renderAll(); } }
});

// edit content admin
function editContent(id){
  const m = state.messages.find(x=>x.id===id);
  if(!m) return;
  const nc = prompt('Edit message content', m.content);
  if(nc!==null){
    m.preEdits = m.preEdits || [];
    m.preEdits.push({ old: m.content, when: new Date().toISOString() });
    m.content = nc;
    state.activity.push(`Admin edited message "${m.title||''}" at ${new Date().toLocaleString()}`);
    saveState(); renderAll();
  }
}

// delete content
function deleteContent(id){
  if(!confirm('Delete message?')) return;
  state.messages = state.messages.filter(x=>x.id!==id);
  state.activity.push(`Admin deleted a message at ${new Date().toLocaleString()}`);
  saveState(); renderAll();
}

// add audio to message (admin)
function addAudioToMessage(id){
  if(!currentUser || currentUser.role!=='admin'){ alert('Only admin'); return; }
  const ip = document.createElement('input'); ip.type='file'; ip.accept='audio/*';
  ip.onchange = async (e)=>{ const f = e.target.files[0]; if(!f) return; const data = await fileToBase64(f); const m = state.messages.find(x=>x.id===id); m.audio = data; state.activity.push(`Admin added audio to "${m.title||''}" at ${new Date().toLocaleString()}`); saveState(); renderAll(); };
  ip.click();
}

// reminders
function addReminderAdmin(id){ const when = prompt('Reminder date-time (YYYY-MM-DD HH:MM)'); if(!when) return; const title = prompt('Reminder title', state.messages.find(m=>m.id===id).title||'Reminder'); try{ const iso = new Date(when.replace(' ','T')).toISOString(); state.reminders.push({ id: state.nextId++, title: title||'Reminder', when: iso, messageId: id, by: currentUser.name }); state.activity.push(`Admin added reminder for "${title||''}" at ${new Date().toLocaleString()}`); saveState(); }catch(e){ alert('Invalid date format'); } }
function setReminderForUser(id){ if(!currentUser){ alert('Login to set reminder'); return; } const when = prompt('Reminder date-time (YYYY-MM-DD HH:MM)'); if(!when) return; const title = prompt('Reminder title', state.messages.find(m=>m.id===id).title||'Reminder'); try{ const iso = new Date(when.replace(' ','T')).toISOString(); state.reminders.push({ id: state.nextId++, title: title||'Reminder', when: iso, messageId: id, by: currentUser.name }); state.activity.push(`${currentUser.name} set reminder for "${title||''}" at ${new Date().toLocaleDateString()}`); saveState(); }catch(e){ alert('Invalid date format'); } }

// scheduled release check
function scheduledReleaseCheck(){ const now = new Date(); let changed=false; state.messages.forEach(m=>{ if(m.released) return; if(!m.scheduled) return; const when = new Date(m.scheduled + 'T' + (m.scheduledTime||'09:00')); if(when <= now){ m.released = true; m.postedOn = new Date().toISOString(); changed=true; state.activity.push(`Message "${m.title||''}" released at ${new Date().toLocaleString()}`); } }); if(changed) saveState(); }

// export/import
document.getElementById('exportJson').addEventListener('click', ()=>{ const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='gift_backup.json'; a.click(); });
document.getElementById('importJson').addEventListener('click', ()=>{ const ip=document.createElement('input'); ip.type='file'; ip.accept='application/json'; ip.onchange=(e)=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=(ev)=>{ try{ const obj=JSON.parse(ev.target.result); state = obj; saveState(); renderAll(); alert('Imported'); }catch(err){ alert('Invalid JSON'); } }; r.readAsText(f); }; ip.click(); });

// fab actions
fab.addEventListener('click', ()=> fabMenu.classList.toggle('hidden'));
fabAddMsg.addEventListener('click', ()=> { if(!currentUser || currentUser.role!=='admin'){ alert('Only admin'); return; } const title = prompt('Title (optional)'); const text = prompt('Message text'); if(!text) return; state.messages.push({ id: state.nextId++, title, content: text, dateAdded: new Date().toISOString(), scheduled: null, scheduledTime: null, released: true, comments: [], preEdits: [], audio: null }); state.activity.push(`Admin added "${title||''}" at ${new Date().toLocaleString()}`); saveState(); renderAll(); });
fabAddComment.addEventListener('click', ()=> { if(!currentUser){ alert('Login to comment'); return; } const mid = prompt('Message ID to comment on'); const m = state.messages.find(x=>x.id==mid); if(!m) return alert('Invalid ID'); const txt = prompt('Your comment'); if(!txt) return; m.comments = m.comments || []; m.comments.push({ id: Date.now(), text: txt, by: currentUser.name, when: new Date().toISOString(), edits: [] }); state.activity.push(`${currentUser.name} commented on "${m.title||''}" at ${new Date().toLocaleString()}`); saveState(); renderAll(); });
fabAddRem.addEventListener('click', ()=> { if(!currentUser){ alert('Login to set reminder'); return; } const mid = prompt('Message ID to set reminder for'); if(!mid) return; setReminderForUser(Number(mid)); });

// audio global controls
toggleAudioBtn.addEventListener('click', ()=> { if(!bgPlayer.src) return; if(bgPlayer.paused){ bgPlayer.play().catch(()=>{}); toggleAudioBtn.textContent='Pause'; } else { bgPlayer.pause(); toggleAudioBtn.textContent='Play'; } });
// attach background audio upload (if present in admin panel)
if(attachAudio){ attachAudio.addEventListener('change', async (e)=>{ const f = e.target.files[0]; if(!f) return; const data = await fileToBase64(f); state.settings.audioData = data; state.settings.audioMode = 'upload'; bgPlayer.src = data; saveState(); bgPlayer.play().catch(()=>{}); }); }

// comment edit handlers (delegation)
document.addEventListener('click', function(e){
  const editC = e.target.closest('[data-editcomment]');
  if(editC){ const mid = Number(editC.dataset.msg); const cid = Number(editC.dataset.editcomment); const m = state.messages.find(x=>x.id===mid); if(!m) return; const c = m.comments.find(x=>x.id===cid); if(!c) return; const nt = prompt('Edit comment', c.text); if(nt!==null){ c.edits = c.edits || []; c.edits.push({ old: c.text, when: new Date().toISOString() }); c.text = nt; c.editedAt = new Date().toISOString(); state.activity.push(`${c.by} edited a comment at ${new Date().toLocaleString()}`); saveState(); renderAll(); } }
});

// seen observer
let observer = null;
function startObserver(){
  if(observer) observer.disconnect();
  observer = new IntersectionObserver(entries=>{ entries.forEach(ent=>{ if(ent.isIntersecting){ const id = Number(ent.target.dataset.id); const m = state.messages.find(x=>x.id===id); if(m && !m.seenAt && currentUser && currentUser.role==='receiver'){ m.seenAt = new Date().toISOString(); state.activity.push(`Message "${m.title||''}" seen by ${currentUser.name} at ${new Date().toLocaleString()}`); saveState(); navigator.vibrate && navigator.vibrate(40); } } }); }, { threshold: 0.6 });
  document.querySelectorAll('.msg').forEach(n=> observer.observe(n));
}

// scheduled release check
setInterval(scheduledReleaseCheck, 30000);

// renderAll invocation
function renderAll(){ renderToday(); renderArchive(); renderAdminList(); renderActivity(); setTimeout(()=>startObserver(),200); }
function renderToday(){
  const today = new Date().toISOString().split('T')[0];
  let content = state.messages.find(m=> m.scheduled === today && m.released) || state.messages.filter(m=>m.released).slice(-1)[0];
  todayContent.innerHTML = content ? `<div class="msg" data-id="${content.id}">${buildMessageHTML(content)}${buildMessageControls(content)}</div>` : '<div class="muted-note">No content for today</div>';
}
function renderArchive(){ archiveContent.innerHTML = state.messages.slice().reverse().map(m=>`<div class="msg" data-id="${m.id}">${buildMessageHTML(m)}${buildMessageControls(m)}</div>`).join('') || '<div class="muted-note">No messages</div>'; }
function renderAdminList(){ contentList.innerHTML = state.messages.slice().reverse().map(m=>`<div style="padding:8px;background:#fff;border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center"><div><strong>${escapeHtml(m.title||'(No title)')}</strong><div class="small">${m.type} • ${new Date(m.dateAdded).toLocaleDateString()}</div></div><div><button class="btn ghost" data-edit="${m.id}">Edit</button><button class="btn ghost" data-delete="${m.id}">Delete</button></div></div>`).join('') || '<div class="muted-note">No content scheduled yet.</div>'; document.querySelectorAll('[data-edit]').forEach(b=> b.onclick = ()=> editContent(Number(b.dataset.edit))); document.querySelectorAll('[data-delete]').forEach(b=> b.onclick = ()=> deleteContent(Number(b.dataset.delete))); }
function renderActivity(){ activityLog.innerHTML = (state.activity || []).slice().reverse().map(a=>`<div class="small">${escapeHtml(a)}</div>`).join('') || '<div class="small">No activity</div>'; }

// helpers: edit content from admin list
function editContent(id){ const m = state.messages.find(x=>x.id===id); if(!m) return; // prefill admin view
  contentType.value = m.type || 'message'; contentTitle.value = m.title || ''; contentText.value = m.content || ''; scheduleDate.value = m.scheduled || ''; scheduleTime.value = m.scheduledTime || '09:00';
  // remove the old entry so admin can re-upload (simple edit flow)
  state.messages = state.messages.filter(x=>x.id!==id); saveState(); renderAll(); alert('Now edit the fields and click Upload Content to save changes.'); }

// utility
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
window.__saveState = saveState;

// initial restore of logged user
const savedUser = localStorage.getItem('gift_user');
if(savedUser){ currentUser = JSON.parse(savedUser); showApp(); } else { loginModal.classList.remove('hidden'); }

// helper: file to base64 (already defined earlier if needed)
function fileToBase64(file){ return new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(file); }); }

// end of script
