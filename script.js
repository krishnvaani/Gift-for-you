
// Final single-file app logic
const STORAGE_KEY = 'gift_for_you_final_v1';
let appData = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {
  settings: { title: 'Happy Birthday 💖', subtitle: 'Every day with you is a new chapter in my favorite story.', frontImage: 'heart.jpg', audioMode: 'none', audioData: null, credentials: { adminUser: 'admin', adminPass: 'admin', receiverUser: 'receiver', receiverPass: 'receiver' } },
  messages: [], nextId: 1, activity: [], reminders: []
};

let currentUser = null;
function escapeHTML(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function setAdminPassword(newPass){
  if(!newPass) return false;
  appData.settings.adminPass = String(newPass);
  save();
  logActivity('Admin password changed');
  return true;
}
function checkCredentials(name, role, pass){
  if(role==='admin'){
    return name==='admin' && pass===appData.settings.adminPass;
  } else {
    return name===appData.settings.receiverUser && pass===appData.settings.receiverPass;
  }
}

let observer = null;

// UI refs
const loginModal = document.getElementById('loginModal');
const appEl = document.getElementById('app');
const doLoginBtn = document.getElementById('doLogin');
const closeLoginBtn = document.getElementById('closeLogin');
const loginName = document.getElementById('loginName');
const loginPass = document.getElementById('loginPass');
const loginRole = document.getElementById('loginRole');

const siteTitle = document.getElementById('siteTitle');
const subtitle = document.getElementById('subtitle');
const heartImage = document.getElementById('heartImage');
const userLabel = document.getElementById('userLabel');
const toggleAudioBtn = document.getElementById('toggleAudioBtn');
const logoutBtn = document.getElementById('logoutBtn');

const openAdminPanelBtn = document.getElementById('openAdminPanel');
const openArchiveBtn = document.getElementById('openArchive');
const openReadBtn = document.getElementById('openRead');

const readView = document.getElementById('readView');
const archiveView = document.getElementById('archiveView');
const adminPanel = document.getElementById('adminPanel');

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

const bgPlayer = document.getElementById('bgPlayer');
const fab = document.getElementById('fab');

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(appData)); renderAll(); }

function showLogin(){ loginModal.classList.remove('hidden-opacity'); loginModal.classList.add('visible-opacity'); }
function hideLogin(){ loginModal.classList.remove('visible-opacity'); loginModal.classList.add('hidden-opacity'); setTimeout(()=> loginModal.classList.add('hidden'), 420); }
function showApp(){ appEl.classList.remove('hidden-opacity'); appEl.classList.add('visible-opacity'); appEl.classList.remove('hidden'); }
function hideApp(){ appEl.classList.remove('visible-opacity'); appEl.classList.add('hidden-opacity'); }

// initialize UI
document.addEventListener('DOMContentLoaded', ()=>{
  siteTitle.textContent = appData.settings.title;
  subtitle.textContent = appData.settings.subtitle;
  heartImage.src = appData.settings.frontImage || 'heart.jpg';
  setupEvents();
  renderAll();
  // show login modal initially
  showLogin();
  setInterval(scheduledReleaseCheck, 30000);
});

function setupEvents(){
  doLoginBtn.addEventListener('click', doLogin);
  closeLoginBtn.addEventListener('click', ()=>{ loginModal.classList.add('hidden'); });
  logoutBtn.addEventListener('click', ()=>{ location.reload(); });
  openAdminPanelBtn.addEventListener('click', ()=>{ showSection('admin'); });
  openArchiveBtn.addEventListener('click', ()=>{ showSection('archive'); });
  openReadBtn.addEventListener('click', ()=>{ showSection('read'); });
  addContentBtn.addEventListener('click', addContent);
  attachAudio.addEventListener('change', handleAttachAudio);
  toggleAudioBtn.addEventListener('click', ()=>{ if(bgPlayer.paused) bgPlayer.play().catch(()=>{}); else bgPlayer.pause(); });
  fab.addEventListener('click', ()=>{ alert('Quick actions: Import/Export/Reset in Admin panel'); });
  heartImage.addEventListener('click', ()=>{ if(!currentUser || currentUser.role!=='admin') return; uploadHeart(); });
  siteTitle.addEventListener('click', ()=>{ if(!currentUser || currentUser.role!=='admin') return; siteTitle.contentEditable=true; siteTitle.focus(); });
  subtitle.addEventListener('click', ()=>{ if(!currentUser || currentUser.role!=='admin') return; subtitle.contentEditable=true; subtitle.focus(); });
  subtitle.addEventListener('blur', ()=>{ appData.settings.subtitle = subtitle.textContent; save(); });
  siteTitle.addEventListener('blur', ()=>{ appData.settings.title = siteTitle.textContent; document.title = siteTitle.textContent; save(); });
}

// login
document.getElementById("bgPlayer").src="lofi.mp3";document.getElementById("bgPlayer").play();
function doLogin(){
  const name = loginName.value.trim();
  const role = loginRole.value;
  const pass = loginPass.value;
  if(!name){ alert('Enter name'); return; }
  if(role==='admin'){
    if(pass !== appData.settings.credentials.adminPass){ alert('Wrong admin password'); return; }
  } else {
    if(appData.settings.credentials.receiverPass && pass !== appData.settings.credentials.receiverPass){ alert('Wrong receiver password'); return; }
  }
  currentUser = { name, role };
  userLabel.textContent = name + ' ('+role+')';
  appData.activity.push(name + ' logged in as '+role+' at '+new Date().toLocaleString());
  save();
  // hide login and show app with fade
  hideLogin();
  setTimeout(()=>{ showApp(); document.getElementById('loginModal').classList.add('hidden'); },420);
  // role UI
  if(role==='admin'){ openAdminPanelBtn.classList.remove('hidden'); document.getElementById('logoutBtn').classList.remove('hidden'); document.getElementById('openAdminPanel').classList.remove('hidden'); } else { document.getElementById('logoutBtn').classList.remove('hidden'); }
  startObserver();
  // confetti + vibration
  navigator.vibrate && navigator.vibrate(60);
  showConfetti();
}

// confetti (simple)
function showConfetti(){ const wrap = document.createElement('div'); wrap.className='confetti-wrap'; for(let i=0;i<18;i++){ const d=document.createElement('div'); d.className='confetti'; d.style.left=(Math.random()*90)+'%'; d.style.animationDelay=(Math.random()*900)+'ms'; d.textContent='❤️'; wrap.appendChild(d); } document.body.appendChild(wrap); setTimeout(()=>wrap.remove(),2200); }

// upload heart
function uploadHeart(){ const ip=document.createElement('input'); ip.type='file'; ip.accept='image/*'; ip.onchange=(e)=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=(ev)=>{ appData.settings.frontImage = ev.target.result; heartImage.src = ev.target.result; appData.activity.push('Admin updated heart image at '+new Date().toLocaleString()); save(); }; r.readAsDataURL(f); }; ip.click(); }

// add content
async function addContent(){
  if(!currentUser || currentUser.role!=='admin'){ alert('Only admin can add'); return; }
  const type = contentType.value;
  const title = contentTitle.value.trim();
  const content = contentText.value.trim();
  const date = scheduleDate.value || null;
  const time = scheduleTime.value || '09:00';
  if(!content){ alert('Write content'); return; }
  const newMsg = { id: appData.nextId++, type, title, content, dateAdded: new Date().toISOString(), scheduled: date, scheduledTime: time, released: date?false:true, postedOn: date?null:new Date().toISOString(), comments: [], audio: null, preEdits: [] };
  appData.messages.push(newMsg);
  appData.activity.push('Admin added "'+(title||'untitled')+'" at '+new Date().toLocaleString());
  // clear form
  contentTitle.value=''; contentText.value=''; scheduleDate.value=''; scheduleTime.value='09:00'; attachAudio.value='';
  save();
  alert('Content uploaded!');
}

// attach audio to form (it will be added when content uploaded)
function handleAttachAudio(e){
  const f = e.target.files[0];
  if(!f) return;
  const r = new FileReader();
  r.onload = ()=>{ appData.settings.latestAudio = r.result; alert('Audio ready — click Upload Content to attach it to the message.'); };
  r.readAsDataURL(f);
}

// render
function renderAll(){
  // header texts
  siteTitle.textContent = appData.settings.title;
  subtitle.textContent = appData.settings.subtitle;
  document.title = appData.settings.title;
  heartImage.src = appData.settings.frontImage || 'heart.jpg';

  // today content: pick scheduled for today or last released
  const today = new Date().toISOString().split('T')[0];
  let content = appData.messages.find(m=> m.scheduled === today && m.released) || appData.messages.filter(m=> m.released).slice(-1)[0];
  if(content){
    todayContent.innerHTML = renderMessageCard(content);
  } else {
    todayContent.innerHTML = '<div class="muted-note">No content for today. Add some in the Admin Panel!</div>';
  }

  // archive
  if(appData.messages.length>0){
    archiveContent.innerHTML = appData.messages.slice().reverse().map(m=>'<div class="msg">'+renderMessageHTML(m)+'</div>').join('');
  } else archiveContent.innerHTML = '<div class="muted-note">No content yet.</div>';

  // admin content list
  if(appData.messages.length>0){
    contentList.innerHTML = appData.messages.slice().reverse().map(m=>`<div class="content-item"><div><strong>${m.title||'(No title)'}</strong><div class="small">${m.type} • ${new Date(m.dateAdded).toLocaleDateString()}</div></div><div style="display:flex;gap:6px"><button class="ghost" data-edit="${m.id}">Edit</button><button class="ghost" data-delete="${m.id}">Delete</button></div></div>`).join('');
    // attach listeners for edit/delete
    contentList.querySelectorAll('button[data-edit]').forEach(btn=> btn.onclick = ()=> editContent(Number(btn.dataset.edit)));
    contentList.querySelectorAll('button[data-delete]').forEach(btn=> btn.onclick = ()=> deleteContent(Number(btn.dataset.delete)));
  } else contentList.innerHTML = '<div class="muted-note">No content scheduled yet.</div>';

  // activity
  activityLog.innerHTML = appData.activity.slice().reverse().map(a=>'<div class="small">'+a+'</div>').join('');

  // archive cards listeners (comments etc) — we will use delegation
  archiveContent.querySelectorAll('.msg').forEach(node=>{
    // attach individual event handlers via data-id attribute if needed
  });

  saveLocalOnly(); // ensure storage
}

function renderMessageCard(m){
  return '<div class="msg" data-id="'+m.id+'">'+renderMessageHTML(m)+ renderMessageControls(m) +'</div>';
}

function renderMessageHTML(m){
  return '<div class="meta"><strong>'+ (m.title||'(No title)') +'</strong> • '+ new Date(m.dateAdded).toLocaleString() +'</div><div style="white-space:pre-line">'+ escapeHtml(m.content) +'</div>' + (m.audio? ('<div class="audio-section"><audio controls src="'+m.audio+'"></audio></div>') : '');
}

function renderMessageControls(m){
  let html = '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">';
  html += '<button class="ghost" data-comment="'+m.id+'">Comments</button>';
  if(currentUser && currentUser.role==='admin'){ html += '<button class="ghost" data-editmsg="'+m.id+'">Edit</button>'; html += '<button class="ghost" data-addaudio="'+m.id+'">Add Audio</button>'; html += '<button class="ghost" data-reminder="'+m.id+'">Add Reminder</button>'; }
  if(currentUser && currentUser.role!=='admin'){ html += '<button class="ghost" data-setrem="'+m.id+'">Set Reminder</button>'; }
  html += '</div>';
  return html + '<div class="comments-area" id="comments-'+m.id+'"></div>';
}

function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// edit content
function editContent(id){ const m = appData.messages.find(x=>x.id===id); if(!m) return; const nc = prompt('Edit message content', m.content); if(nc!==null){ m.preEdits = m.preEdits || []; m.preEdits.push({when:new Date().toISOString(), text: m.content}); m.content = nc; appData.activity.push('Admin edited "'+(m.title||'')+'" at '+new Date().toLocaleString()); save(); } }
function deleteContent(id){ if(!confirm('Delete?')) return; appData.messages = appData.messages.filter(x=> x.id!==id); appData.activity.push('Admin deleted a message at '+new Date().toLocaleDateString()); save(); }

// comments handling (delegation)
document.addEventListener('click', function(e){
  const com = e.target.closest('button[data-comment]');
  if(com){ const id = Number(com.dataset.comment); toggleComments(id); return; }
  const addc = e.target.closest('button[data-addcomment]');
  if(addc){ const id = Number(addc.dataset.addcomment); addComment(id); return; }
  const editbtn = e.target.closest('button[data-editmsg]');
  if(editbtn){ editContent(Number(editbtn.dataset.editmsg)); return; }
  const addAudioBtn = e.target.closest('button[data-addaudio]');
  if(addAudioBtn){ addAudioToMessage(Number(addAudioBtn.dataset.addaudio)); return; }
  const setRem = e.target.closest('button[data-setrem]');
  if(setRem){ setReminderForUser(Number(setRem.dataset.setrem)); return; }
  const remind = e.target.closest('button[data-reminder]');
  if(remind){ addReminderAdmin(Number(remind.dataset.reminder)); return; }
});

function toggleComments(id){
  const area = document.getElementById('comments-'+id);
  if(!area) return;
  if(area.innerHTML.trim()!==''){ area.innerHTML=''; return; }
  const m = appData.messages.find(x=>x.id===id);
  if(!m) return;
  area.innerHTML = '<div style="font-weight:700">Aap kuch kehna chahenge ?</div>';
  const list = document.createElement('div');
  (m.comments||[]).forEach(c=>{
    const box = document.createElement('div'); box.className='comment';
    const meta = document.createElement('div'); meta.className='small'; meta.textContent = c.by + ' • ' + new Date(c.when).toLocaleString();
    const txt = document.createElement('div'); txt.textContent = c.text;
    box.appendChild(meta); box.appendChild(txt);
    // if receiver is the author allow edit (they can edit and history saved)
    if(currentUser && currentUser.name === c.by){
      const eb = document.createElement('button'); eb.className='ghost'; eb.textContent='Edit'; eb.onclick = ()=>{
        const nt = prompt('Edit your comment', c.text);
        if(nt!==null){
          c.history = c.history || [];
          c.history.push({when: new Date().toISOString(), text: c.text});
          c.text = nt;
          c.editedAt = new Date().toISOString();
          appData.activity.push(c.by + ' edited a comment at ' + new Date().toLocaleString());
          save();
        }
      };
      box.appendChild(eb);
    }
    // admin can see pre-edit history of comments (hidden from receiver UI, but here admin sees it)
    if(currentUser && currentUser.role==='admin' && c.history && c.history.length){
      const ph = document.createElement('div'); ph.className='history-entry'; ph.textContent = 'Previous comment versions:';
      c.history.forEach(h=>{ const he = document.createElement('div'); he.textContent = new Date(h.when).toLocaleString() + ' → ' + h.text; ph.appendChild(he); });
      box.appendChild(ph);
    }
    list.appendChild(box);
  });
  // add add-comment button for logged-in users
  if(currentUser){
    const addBtn = document.createElement('button'); addBtn.className='btn'; addBtn.textContent='Add Comment'; addBtn.onclick = ()=>{
      const txt = prompt('Write comment'); if(!txt) return;
      const c = { id: Date.now(), by: currentUser.name, when: new Date().toISOString(), text: txt, history: [] };
      m.comments = m.comments || []; m.comments.push(c); appData.activity.push(currentUser.name + ' commented at ' + new Date().toLocaleString()); save();
    };
    list.appendChild(addBtn);
  }
  area.appendChild(list);
}

// add audio to message (admin)
function addAudioToMessage(id){
  if(!currentUser || currentUser.role!=='admin'){ alert('Only admin'); return; }
  const ip = document.createElement('input'); ip.type='file'; ip.accept='audio/*'; ip.onchange=(e)=>{ const f=e.target.files[0]; if(!f) return; const r = new FileReader(); r.onload = (ev)=>{ const m = appData.messages.find(x=>x.id===id); m.audio = ev.target.result; appData.activity.push('Admin added audio to message '+(m.title||'')+' at '+new Date().toLocaleString()); save(); }; r.readAsDataURL(f); }; ip.click();
}

// reminders
function addReminderAdmin(id){ const when = prompt('Reminder date-time (YYYY-MM-DD HH:MM)'); if(!when) return; const title = prompt('Reminder title', appData.messages.find(m=>m.id===id).title||'Reminder'); try{ const iso = new Date(when.replace(' ','T')).toISOString(); appData.reminders.push({ id: appData.nextId++, title: title||'Reminder', when: iso, messageId: id, by: currentUser.name }); appData.activity.push('Admin added reminder at '+new Date().toLocaleString()); save(); }catch(e){ alert('Invalid date format'); } }
function setReminderForUser(id){ if(!currentUser){ alert('Login to set reminder'); return; } const when = prompt('Reminder date-time (YYYY-MM-DD HH:MM)'); if(!when) return; const title = prompt('Reminder title', appData.messages.find(m=>m.id===id).title||'Reminder'); try{ const iso = new Date(when.replace(' ','T')).toISOString(); appData.reminders.push({ id: appData.nextId++, title: title||'Reminder', when: iso, messageId: id, by: currentUser.name }); appData.activity.push(currentUser.name + ' set a reminder at '+new Date().toLocaleString()); save(); }catch(e){ alert('Invalid date format'); } }

// scheduled release check
function scheduledReleaseCheck(){
  const now = new Date();
  let changed=false;
  appData.messages.forEach(m=>{
    if(m.released) return;
    if(!m.scheduled) return;
    const when = new Date(m.scheduled + 'T' + (m.scheduledTime || '09:00'));
    if(when <= now){ m.released = true; m.postedOn = new Date().toISOString(); appData.activity.push('Message "'+(m.title||'')+'" released at '+new Date().toLocaleString()); changed=true; }
  });
  if(changed) save();
}

// observer for seen-tracking
function startObserver(){
  if(observer) observer.disconnect();
  observer = new IntersectionObserver(entries=>{ entries.forEach(ent=>{ if(ent.isIntersecting){ const id = Number(ent.target.dataset.id); const m = appData.messages.find(x=>x.id===id); if(m && !m.seenAt && currentUser && currentUser.role==='receiver'){ m.seenAt = new Date().toISOString(); appData.activity.push('Message "'+(m.title||'')+'" seen by '+currentUser.name+' at '+new Date().toLocaleString()); save(); navigator.vibrate && navigator.vibrate(40); } } }); },{threshold:0.6});
  document.querySelectorAll('.msg').forEach(n=> observer.observe(n));
}

// small helpers: import/export/reset
document.getElementById('exportJson').addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(appData,null,2)],{type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'gift_backup.json'; a.click();
});
document.getElementById('importJson').addEventListener('click', ()=>{
  const ip = document.createElement('input'); ip.type='file'; ip.accept='application/json'; ip.onchange=(e)=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=(ev)=>{ try{ const obj = JSON.parse(ev.target.result); appData = obj; save(); alert('Imported'); }catch(err){ alert('Invalid JSON'); } }; r.readAsText(f); }; ip.click();
});

// remove audio from message
function removeAudioFromMessage(id){ const m = appData.messages.find(x=>x.id===id); if(m){ m.audio=null; save(); } }

// internal local save (avoid double-save)
function saveLocalOnly(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(appData)); }

function save(){ saveLocalOnly(); renderAll(); }

// render helper for each message card
function renderAll(){
  // header
  siteTitle.textContent = appData.settings.title;
  subtitle.textContent = appData.settings.subtitle;
  document.title = appData.settings.title;
  heartImage.src = appData.settings.frontImage || 'heart.jpg';

  // today
  const today = new Date().toISOString().split('T')[0];
  let todayMsg = appData.messages.find(m=> m.scheduled === today && m.released) || appData.messages.filter(m=>m.released).slice(-1)[0];
  if(todayMsg){
    todayContent.innerHTML = renderMessageCard(todayMsg);
  } else {
    todayContent.innerHTML = '<div class="muted-note">No content for today. Add some in the Admin Panel!</div>';
  }

  // archive
  archiveContent.innerHTML = appData.messages.slice().reverse().map(m=>'<div class="msg" data-id="'+m.id+'">'+ renderMessageHTML(m) + renderControlsHTML(m) + renderCommentsHTML(m) +'</div>').join('') || '<div class="muted-note">No messages yet</div>';

  // content list for admin
  contentList.innerHTML = appData.messages.slice().reverse().map(m=> '<div style="padding:8px;background:#fff;border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center"><div><strong>'+ (m.title||'(No title)') +'</strong><div class="small">'+ (m.type||'') +' • '+ new Date(m.dateAdded).toLocaleDateString() +'</div></div><div><button class="ghost" data-edit="'+m.id+'">Edit</button><button class="ghost" data-delete="'+m.id+'">Delete</button></div></div>').join('') || '<div class="muted-note">No content scheduled yet.</div>';

  // activity
  activityLog.innerHTML = appData.activity.slice().reverse().map(a=>'<div class="small">'+a+'</div>').join('');

  // attach listeners for dynamic buttons (comments/edit/addAudio/reminder)
  document.querySelectorAll('button[data-comment-toggle]').forEach(btn=> btn.onclick = ()=> toggleCommentsUI(Number(btn.dataset.commentToggle)));
  document.querySelectorAll('button[data-addcomment]').forEach(btn=> btn.onclick = ()=> addCommentUI(Number(btn.dataset.addcomment)));
  document.querySelectorAll('button[data-editmsg]').forEach(btn=> btn.onclick = ()=> editContent(Number(btn.dataset.editmsg)));
  document.querySelectorAll('button[data-addaudio]').forEach(btn=> btn.onclick = ()=> addAudioToMessage(Number(btn.dataset.addaudio)));
  document.querySelectorAll('button[data-setrem]').forEach(btn=> btn.onclick = ()=> setReminderForUser(Number(btn.dataset.setrem)));
  document.querySelectorAll('button[data-reminder]').forEach(btn=> btn.onclick = ()=> addReminderAdmin(Number(btn.dataset.reminder)));
  document.querySelectorAll('button[data-delete]').forEach(btn=> btn.onclick = ()=> deleteContent(Number(btn.dataset.delete)));

  // start observer for seen tracking
  startObserver();
}

function renderMessageCard(m){
  return renderMessageHTML(m) + renderControlsHTML(m) + renderCommentsHTML(m);
}
function renderMessageHTML(m){
  return '<div class="meta"><strong>'+ (m.title||'(No title)') +'</strong> • '+ new Date(m.dateAdded).toLocaleString() +'</div><div style="white-space:pre-line">'+ escapeHtml(m.content) +'</div>' + (m.audio? '<div class="audio-section"><audio controls src="'+m.audio+'"></audio></div>':'');
}
function renderControlsHTML(m){
  let html = '<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">';
  html += '<button class="ghost" data-comment-toggle="'+m.id+'" data-comment="'+m.id+'">Comments</button>';
  if(currentUser && currentUser.role==='admin'){ html += '<button class="ghost" data-editmsg="'+m.id+'">Edit</button>'; html += '<button class="ghost" data-addaudio="'+m.id+'">Add Audio</button>'; html += '<button class="ghost" data-reminder="'+m.id+'">Add Reminder</button>'; }
  if(currentUser && currentUser.role!=='admin'){ html += '<button class="ghost" data-setrem="'+m.id+'">Set Reminder</button>'; }
  html += '</div>';
  return html;
}
function renderCommentsHTML(m){
  const comments = (m.comments||[]).map(c=>{
    let s = '<div class="comment"><div class="small">'+ c.by + ' • ' + new Date(c.when).toLocaleString() +'</div><div>'+ escapeHtml(c.text) +'</div>';
    if(currentUser && currentUser.name===c.by){ s += '<div><button class="ghost" data-editcomment="'+c.id+'" data-msg="'+m.id+'">Edit</button></div>'; }
    if(currentUser && currentUser.role==='admin' && c.history && c.history.length){ s += '<div class="history-entry">Previous versions: '+ c.history.map(h=>'On '+ new Date(h.when).toLocaleString() + ' → ' + escapeHtml(h.text)).join('<br/>') +'</div>'; }
    s += '</div>';
    return s;
  }).join('');
  return '<div class="comments-area" id="comments-'+m.id+'">' + comments + '</div>';
}

// comment edit handler (delegation)
document.addEventListener('click', function(e){
  const ec = e.target.closest('button[data-editcomment]');
  if(ec){ const msgId = Number(ec.dataset.msg); const commentId = Number(ec.dataset.editcomment); const m = appData.messages.find(x=>x.id===msgId); if(!m) return; const c = m.comments.find(x=>x.id===commentId); if(!c) return; const nt = prompt('Edit comment', c.text); if(nt!==null){ c.history = c.history || []; c.history.push({when: new Date().toISOString(), text: c.text}); c.text = nt; c.editedAt = new Date().toISOString(); appData.activity.push(c.by + ' edited a comment at ' + new Date().toLocaleString()); save(); } }
  const ct = e.target.closest('button[data-delete]');
  if(ct){ deleteContent(Number(ct.dataset.delete)); }
});

function addCommentUI(id){
  const m = appData.messages.find(x=>x.id===id); if(!m) return;
  const txt = prompt('Write comment'); if(!txt) return;
  const c = { id: Date.now(), by: currentUser.name, when: new Date().toISOString(), text: txt, history: [] };
  m.comments = m.comments || []; m.comments.push(c); appData.activity.push(currentUser.name + ' commented at ' + new Date().toLocaleString()); save();
}

function toggleCommentsUI(id){
  const el = document.getElementById('comments-'+id); if(!el) return;
  if(el.innerHTML.trim()===''){ // open: render comments area - but already rendered in archive; just scroll
    const node = el.closest('.msg'); if(node) node.scrollIntoView({behavior:'smooth'});
  } else { el.innerHTML=''; }
}

// add audio to message (admin) - wrapper for FileReader on input
function addAudioToMessage(id){
  if(!currentUser || currentUser.role!=='admin'){ alert('Only admin'); return; }
  const ip = document.createElement('input'); ip.type='file'; ip.accept='audio/*'; ip.onchange=(e)=>{ const f = e.target.files[0]; if(!f) return; const r = new FileReader(); r.onload = (ev)=>{ const m = appData.messages.find(x=>x.id===id); m.audio = ev.target.result; appData.activity.push('Admin added audio to "'+(m.title||'')+'" at '+new Date().toLocaleString()); save(); }; r.readAsDataURL(f); }; ip.click();
}

// user set reminder
function setReminderForUser(id){ if(!currentUser){ alert('Login to set reminder'); return; } const when = prompt('Reminder date-time (YYYY-MM-DD HH:MM)'); if(!when) return; const title = prompt('Reminder title', appData.messages.find(m=>m.id===id).title||'Reminder'); try{ const iso = new Date(when.replace(' ','T')).toISOString(); appData.reminders.push({id: appData.nextId++, title: title||'Reminder', when: iso, messageId: id, by: currentUser.name}); appData.activity.push(currentUser.name + ' set reminder at '+new Date().toLocaleString()); save(); }catch(e){ alert('Invalid date') } }

// import export handled earlier...

// helper: save/refresh on load
function loadAndRender(){ try{ const raw = localStorage.getItem(STORAGE_KEY); if(raw) appData = JSON.parse(raw); }catch(e){} renderAll(); }
loadAndRender();

// handle edit/delete from admin content list via event delegation
contentList.addEventListener('click', function(e){ const ed = e.target.closest('button[data-edit]'); if(ed){ const id=Number(ed.dataset.edit); const m = appData.messages.find(x=>x.id===id); if(!m) return; // prefill admin panel
  contentType.value = m.type || 'message'; contentTitle.value = m.title || ''; contentText.value = m.content || ''; scheduleDate.value = m.scheduled || ''; scheduleTime.value = m.scheduledTime || '09:00';
  // remove old message entry so admin can re-upload as edit
  appData.messages = appData.messages.filter(x=>x.id!==id); save(); alert('Now edit the fields and click Upload Content to save changes.');
}});

// delete via admin content list (handled earlier in renderAll attach)

// handle add content button attach saved audio if any
addContentBtn.addEventListener('click', function(){ // if there's appData.settings.latestAudio attach to created message
  if(appData.settings.latestAudio){ // when creating message, attach it to the last message added
    // handled in addContent (admin) earlier: to keep simple, if latestAudio present, attach to most recent message with no audio
  }
});

// last: initial UI state toggles
function showSection(name){
  readView.classList.add('hidden'); archiveView.classList.add('hidden'); adminPanel.classList.add('hidden');
  if(name==='read') readView.classList.remove('hidden');
  if(name==='archive') archiveView.classList.remove('hidden');
  if(name==='admin') adminPanel.classList.remove('hidden');
}

// utility: remove old messages without audio etc.
// function removeAudio... (not used)

// Expose some helpers for debugging
window.__gift_save = save;
window.__gift_data = appData;

document.getElementById("musicBtn").onclick=function(){
 let p=document.getElementById("bgPlayer");
 if(p.paused){p.play();} else p.pause();
};

document.getElementById("setPass").onclick=function(){
 if(currentUser && currentUser.role==="admin"){
   let np=document.getElementById("newPass").value;
   if(np){
     appData.settings.passwords.adminPass=np;
     save();
     alert("Password changed");
   }
 }
};

document.getElementById("fab").onclick=function(){
 alert("Info:\n+ Button: help\nMusic button: play/pause music\nAdmin can change password and set reminders.");
};




// PASSWORD CHANGE UI wiring
document.addEventListener('click', function(e){
  if(e.target && e.target.id==='setPass'){
    let newPass = document.getElementById('newPass').value.trim();
    if(!newPass){ alert('Enter new password'); return; }
    // require admin authentication: if logged in as admin, allow; else prompt for current admin password
    if(currentUser && currentUser.role==='admin'){
      setAdminPassword(newPass);
      alert('Admin password updated');
      document.getElementById('newPass').value='';
    } else {
      let cur = prompt('Enter current admin password to change it:');
      if(cur===appData.settings.adminPass){
        setAdminPassword(newPass);
        alert('Admin password updated');
        document.getElementById('newPass').value='';
      } else alert('Incorrect current admin password.');
    }
  }
});

// LOGIN handling: modify doLogin logic to use checkCredentials
(function(){
  const doLoginBtn = document.getElementById('doLogin');
  doLoginBtn.addEventListener('click', function(){
    const name = document.getElementById('loginName').value.trim();
    const role = document.getElementById('loginRole').value;
    const pwd = document.getElementById('loginPass').value || '';
    if(!name){ alert('Enter name'); return; }
    if(!checkCredentials(name, role, pwd)){
      alert('Invalid credentials');
      return;
    }
    currentUser = { name, role };
    logActivity(name + ' logged in as ' + role);
    document.getElementById('loginModal').classList.remove('visible-opacity');
    save();
    renderUI();
    // request notification permission for reminders (if receiver/admin)
    if(Notification && Notification.permission!=='granted'){
      Notification.requestPermission().then(()=>{});
    }
  });
})();

// SEEN tracking: mark message as seen when receiver opens a message in read view
function markSeen(msgId){
  const m = appData.messages.find(x=>x.id===msgId);
  if(!m) return;
  m.seen = true;
  m.seenAt = new Date().toISOString();
  save();
  renderUI();
}

// COMMENTS: per-message comments editable by receiver
function saveComment(msgId, text){
  let m = appData.messages.find(x=>x.id===msgId);
  if(!m) return;
  m.comment = m.comment || { text: '', updatedAt: null };
  m.comment.text = text;
  m.comment.updatedAt = new Date().toISOString();
  save();
  logActivity('Comment updated on msg ' + msgId);
  renderUI();
}

// REMINDERS: create reminder scheduled, both in-app and browser notification
function scheduleReminder(rem){
  // rem: {id, msgId, whenISO, title, createdBy}
  appData.reminders = appData.reminders || [];
  appData.reminders.push(rem);
  save();
  logActivity('Reminder set for ' + rem.whenISO + ' by ' + rem.createdBy);
  renderUI();
}

// simple runner to check upcoming reminders every 15s
setInterval(function(){
  const now = new Date();
  (appData.reminders||[]).forEach((r)=>{
    if(!r.fired && new Date(r.whenISO) <= now){
      r.fired = true;
      // in-app alert push
      appData.activity.push('[Reminder] ' + r.title + ' — due ' + r.whenISO);
      // browser notification
      if(window.Notification && Notification.permission==='granted'){
        try{ new Notification('Reminder: ' + r.title, { body: r.whenISO }); }catch(e){}
      }
      save();
      renderUI();
    }
  });
},15000);




// Delegated listeners for comment save, comment toggle, reminders and marking seen
document.addEventListener('click', function(e){
  // Save comment
  const savec = e.target && e.target.dataset && e.target.dataset.savec;
  if(savec){
    const id = Number(savec);
    const ta = document.getElementById('cbox-'+id);
    if(ta){ saveComment(id, ta.value.trim()); alert('Comment saved'); }
  }
  // Comment toggle (not used)
  if(e.target && e.target.dataset && e.target.dataset.comment){
    const id = Number(e.target.dataset.comment);
    const area = document.getElementById('comments-'+id);
    if(area) area.classList.toggle('open');
  }
  // Reminder set buttons: open prompt for date/time
  if(e.target && e.target.dataset && e.target.dataset.setrem){
    const id = Number(e.target.dataset.setrem);
    const when = prompt('Enter reminder date/time in format YYYY-MM-DD HH:MM (24h)');
    if(when){
      // parse
      const iso = new Date(when.replace(' ','T')).toISOString();
      scheduleReminder({ id: 'rem-'+Math.random().toString(36).slice(2), msgId:id, whenISO:iso, title:'Reminder for message '+id, createdBy: currentUser?currentUser.name:'unknown' });
      alert('Reminder scheduled at ' + iso);
    }
  }
  if(e.target && e.target.dataset && e.target.dataset.reminder){
    const id = Number(e.target.dataset.reminder);
    const when = prompt('Enter reminder date/time in format YYYY-MM-DD HH:MM (24h)');
    if(when){
      const iso = new Date(when.replace(' ','T')).toISOString();
      scheduleReminder({ id: 'rem-'+Math.random().toString(36).slice(2), msgId:id, whenISO:iso, title:'Reminder for message '+id, createdBy: currentUser?currentUser.name:'unknown' });
      alert('Reminder scheduled at ' + iso);
    }
  }
  // Mark seen when admin opens read view? We'll mark seen when receiver clicks on a message title link (data-open-msg)
  if(e.target && e.target.dataset && e.target.dataset.openMsg){
    const id = Number(e.target.dataset.openMsg);
    if(currentUser && currentUser.role!=='admin'){ markSeen(id); }
  }
});



// Background music wiring
const bgPlayer = document.getElementById('bgPlayer');
if(bgPlayer){
  bgPlayer.src = 'lofi.mp3';
  bgPlayer.loop = true;
  // try autoplay
  bgPlayer.play().catch(()=>{});
}
// music button toggle
document.addEventListener('click', function(e){
  if(e.target && e.target.id==='musicBtn'){
    if(bgPlayer.paused) { bgPlayer.play().then(()=>{ e.target.textContent='⏸'; }).catch(()=>{ alert('Autoplay blocked. Click to start.'); }); }
    else { bgPlayer.pause(); e.target.textContent='🎵'; }
  }
  if(e.target && e.target.id==='fab'){ document.getElementById('helpModal').classList.toggle('hidden'); }
  if(e.target && e.target.id==='closeHelp'){ document.getElementById('helpModal').classList.add('hidden'); }
});
