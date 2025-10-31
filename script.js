
// Replaced script.js - features injected, original UI preserved
const STORAGE_KEY = 'gift_for_you_final_v2';
const LAST_USER_KEY = STORAGE_KEY + '_lastUser';
let appData = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {
  settings: {
    title: 'Happy Birthday 💖',
    subtitle: 'Every day with you is a new chapter.',
    frontImage: 'heart.jpg',
    credentials: { adminUser: 'admin', adminPass: 'admin', receiverUser: 'receiver', receiverPass: 'receiver' }
  },
  messages: [], nextId: 1, activity: [], reminders: []
};
let currentUser = null;
let observer = null;

const $ = id => document.getElementById(id);

// utility
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(appData)); renderAll(); }
function logActivity(text){ appData.activity = appData.activity || []; appData.activity.push(text); localStorage.setItem(STORAGE_KEY, JSON.stringify(appData)); }
function escapeHTML(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// initial wiring
document.addEventListener('DOMContentLoaded', ()=> {
  // header texts
  $('pageTitle') && ($('pageTitle').textContent = appData.settings.title);
  $('siteTitle') && ($('siteTitle').textContent = appData.settings.title);
  $('subtitle') && ($('subtitle').textContent = appData.settings.subtitle);
  $('heartImage') && ($('heartImage').src = appData.settings.frontImage || 'heart.jpg');

  // remember username (Option B)
  try{
    const last = localStorage.getItem(LAST_USER_KEY);
    if(last) $('loginName').value = last;
  }catch(e){}

  // clear password field
  if($('loginPass')) $('loginPass').value = '';

  setupEvents();
  renderAll();
  // show login modal
  if($('loginModal')) {
    $('loginModal').classList.remove('hidden-opacity');
    $('loginModal').classList.add('visible-opacity');
  }
  // periodic checks
  setInterval(scheduledReleaseCheck, 30000);
  setInterval(reminderRunner, 15000);
});

// setup event listeners
function setupEvents(){
  $('doLogin').addEventListener('click', doLogin);
  $('closeLogin') && $('closeLogin').addEventListener('click', ()=>{ $('loginModal').classList.add('hidden'); });
  $('logoutBtn').addEventListener('click', ()=>{ location.reload(); });
  $('openAdminPanel') && $('openAdminPanel').addEventListener('click', ()=> showSection('admin'));
  $('openArchive') && $('openArchive').addEventListener('click', ()=> showSection('archive'));
  $('openRead') && $('openRead').addEventListener('click', ()=> showSection('read'));
  $('uploadMsg') && $('uploadMsg').addEventListener('click', addContent);
  $('saveCreds') && $('saveCreds').addEventListener('click', saveCredentials);
  $('toggleAudioBtn') && $('toggleAudioBtn').addEventListener('click', toggleMusic);
  $('fab') && $('fab').addEventListener('click', ()=> $('helpModal').classList.toggle('hidden'));
  $('closeHelp') && $('closeHelp').addEventListener('click', ()=> $('helpModal').classList.add('hidden'));

  // delegated dynamic actions
  document.body.addEventListener('click', function(e){
    const btn = e.target;
    if(btn.matches('[data-addcomment]')){ addCommentUI(Number(btn.dataset.addcomment)); }
    if(btn.matches('[data-editcomment]')){ editCommentHandler(btn); }
    if(btn.matches('[data-editmsg]')){ editContent(Number(btn.dataset.editmsg)); }
    if(btn.matches('[data-delete]')){ deleteContent(Number(btn.dataset.delete)); }
    if(btn.matches('[data-setrem]')){ setReminderForUser(Number(btn.dataset.setrem)); }
    if(btn.matches('[data-reminder]')){ addReminderAdmin(Number(btn.dataset.reminder)); }
  });
}

// Credentials check
function checkCredentials(name, role, pass){
  if(role === 'admin'){
    return name === appData.settings.credentials.adminUser && pass === appData.settings.credentials.adminPass;
  } else {
    return name === appData.settings.credentials.receiverUser && pass === appData.settings.credentials.receiverPass;
  }
}

function doLogin(){
  const name = $('loginName').value.trim();
  const role = $('loginRole').value;
  const pass = $('loginPass').value;
  if(!name){ alert('Enter name'); return; }
  if(!checkCredentials(name, role, pass)){ alert('Invalid credentials'); return; }
  currentUser = { name, role };
  // remember username only
  try{ localStorage.setItem(LAST_USER_KEY, name); }catch(e){}
  logActivity(`${name} logged in as ${role} at ${new Date().toLocaleString()}`);
  save();
  // hide login and show app UI
  $('loginModal').classList.add('hidden');
  $('app') && $('app').classList.remove('hidden');
  // clear password input after login
  if($('loginPass')) $('loginPass').value = '';
  // role-specific UI
  if(role === 'admin'){
    $('openAdminPanel') && $('openAdminPanel').classList.remove('hidden');
    $('logoutBtn') && $('logoutBtn').classList.remove('hidden');
  } else {
    $('logoutBtn') && $('logoutBtn').classList.remove('hidden');
  }
  // initialize observer for seen tracking
  setTimeout(()=> startObserver(), 400);
  // try autoplay music
  try{ const p = $('bgPlayer'); if(p){ if(!p.src || p.src.indexOf('lofi.mp3')===-1) p.src='lofi.mp3'; p.play().catch(()=>{}); } }catch(e){}
}

// save credentials (admin)
function saveCredentials(){
  if(!currentUser || currentUser.role !== 'admin'){ alert('Only admin can change credentials'); return; }
  const aUser = $('adminUser').value.trim();
  const aPass = $('adminPass').value;
  const rUser = $('receiverUser').value.trim();
  const rPass = $('receiverPass').value;
  if(aUser) appData.settings.credentials.adminUser = aUser;
  if(aPass) appData.settings.credentials.adminPass = aPass;
  if(rUser) appData.settings.credentials.receiverUser = rUser;
  if(rPass) appData.settings.credentials.receiverPass = rPass;
  logActivity('Admin updated credentials at ' + new Date().toLocaleString());
  save();
  alert('Credentials saved. Password fields cleared for security.');
  // clear UI password inputs
  if($('adminPass')) $('adminPass').value = '';
  if($('receiverPass')) $('receiverPass').value = '';
}

// Content functions
function addContent(){
  if(!currentUser || currentUser.role !== 'admin'){ alert('Only admin can add content'); return; }
  const title = $('contentTitle')? $('contentTitle').value.trim() : ($('msgTitle')? $('msgTitle').value.trim() : '');
  const content = $('contentText')? $('contentText').value.trim() : ($('msgText')? $('msgText').value.trim() : '');
  const date = $('scheduleDate')? $('scheduleDate').value : ($('msgDate')? $('msgDate').value : '');
  const time = $('scheduleTime')? $('scheduleTime').value : ($('msgTime')? $('msgTime').value : '09:00');
  if(!content){ alert('Write content'); return; }
  const msg = { id: appData.nextId++, type: $('contentType')? $('contentType').value : 'message', title: title||'Untitled', content, dateAdded: new Date().toISOString(), scheduled: date||null, scheduledTime: time||'09:00', released: date? false : true, postedOn: date? null : new Date().toISOString(), comments: [], audio: null, seenAt: null, preEdits: [] };
  appData.messages.push(msg);
  logActivity('Admin added "'+(title||'untitled')+'" at '+new Date().toLocaleString());
  save();
  alert('Content uploaded!');
  // clear form if present
  if($('contentTitle')) $('contentTitle').value = '';
  if($('contentText')) $('contentText').value = '';
  if($('scheduleDate')) $('scheduleDate').value = '';
  if($('scheduleTime')) $('scheduleTime').value = '09:00';
}

// Edit/delete content
function editContent(id){
  if(!currentUser || currentUser.role !== 'admin'){ alert('Only admin'); return; }
  const m = appData.messages.find(x=>x.id===id);
  if(!m) return;
  const nc = prompt('Edit message content', m.content);
  if(nc !== null){
    m.preEdits = m.preEdits || [];
    m.preEdits.push({ when: new Date().toISOString(), text: m.content });
    m.content = nc;
    logActivity('Admin edited "'+(m.title||'')+'" at '+new Date().toLocaleString());
    save();
  }
}
function deleteContent(id){
  if(!currentUser || currentUser.role !== 'admin'){ alert('Only admin'); return; }
  if(!confirm('Delete this message?')) return;
  appData.messages = appData.messages.filter(x=> x.id !== id);
  logActivity('Admin deleted a message at '+new Date().toLocaleString());
  save();
}

// Comments: add and edit (receiver editable), admin sees history
function addCommentUI(id){
  if(!currentUser){ alert('Login to comment'); return; }
  const txt = prompt('Write comment');
  if(!txt) return;
  const m = appData.messages.find(x=>x.id===id);
  if(!m) return;
  const c = { id: Date.now(), by: currentUser.name, when: new Date().toISOString(), text: txt, history: [] };
  m.comments = m.comments || [];
  m.comments.push(c);
  logActivity(currentUser.name + ' commented at ' + new Date().toLocaleString());
  save();
}
function editCommentHandler(btn){
  const msgId = Number(btn.dataset.msg);
  const commentId = Number(btn.dataset.editcomment);
  const m = appData.messages.find(x=>x.id===msgId);
  if(!m) return;
  const c = m.comments.find(x=>x.id===commentId);
  if(!c) return;
  if(!currentUser || currentUser.name !== c.by){ alert('Only the comment author can edit this'); return; }
  const nt = prompt('Edit your comment', c.text);
  if(nt === null) return;
  c.history = c.history || [];
  c.history.push({ when: new Date().toISOString(), text: c.text });
  c.text = nt;
  c.editedAt = new Date().toISOString();
  logActivity(c.by + ' edited a comment at ' + new Date().toLocaleString());
  save();
}

// Reminders
function scheduleReminderObj(rem){
  appData.reminders = appData.reminders || [];
  appData.reminders.push(rem);
  logActivity('Reminder set for ' + rem.when + ' by ' + rem.by);
  save();
}
function addReminderAdmin(id){
  if(!currentUser || currentUser.role !== 'admin'){ alert('Only admin'); return; }
  const when = prompt('Reminder date-time (YYYY-MM-DD HH:MM)');
  if(!when) return;
  const title = prompt('Reminder title', (appData.messages.find(m=>m.id===id)||{}).title || 'Reminder');
  try{
    const iso = new Date(when.replace(' ','T')).toISOString();
    scheduleReminderObj({ id: 'rem-'+Math.random().toString(36).slice(2), title, when: iso, messageId: id, by: currentUser.name, fired: false });
    alert('Reminder scheduled at ' + iso);
  }catch(e){ alert('Invalid date format'); }
}
function setReminderForUser(id){
  if(!currentUser){ alert('Login to set reminder'); return; }
  const when = prompt('Reminder date-time (YYYY-MM-DD HH:MM)');
  if(!when) return;
  const title = prompt('Reminder title', (appData.messages.find(m=>m.id===id)||{}).title || 'Reminder');
  try{
    const iso = new Date(when.replace(' ','T')).toISOString();
    scheduleReminderObj({ id: 'rem-'+Math.random().toString(36).slice(2), title, when: iso, messageId: id, by: currentUser.name, fired: false });
    alert('Reminder scheduled at ' + iso);
  }catch(e){ alert('Invalid date format'); }
}
function reminderRunner(){
  const now = new Date();
  (appData.reminders||[]).forEach(r=>{
    if(!r.fired && new Date(r.when) <= now){
      r.fired = true;
      logActivity('[Reminder] ' + r.title + ' — due ' + r.when);
      // browser notification if permission granted
      if('Notification' in window && Notification.permission === 'granted'){
        try{ new Notification('Reminder: ' + r.title, { body: r.when }); }catch(e){}
      } else {
        // basic alert fallback
        alert('Reminder: ' + r.title + ' — ' + r.when);
      }
      save();
    }
  });
}

// Scheduled release check
function scheduledReleaseCheck(){
  const now = new Date();
  let changed = false;
  appData.messages.forEach(m=>{
    if(m.released) return;
    if(!m.scheduled) return;
    const when = new Date(m.scheduled + 'T' + (m.scheduledTime || '09:00'));
    if(when <= now){
      m.released = true;
      m.postedOn = new Date().toISOString();
      logActivity('Message "'+(m.title||'')+'" released at '+new Date().toLocaleString());
      changed = true;
    }
  });
  if(changed) save();
}

// Seen tracking using IntersectionObserver
function startObserver(){
  if(observer) observer.disconnect();
  observer = new IntersectionObserver(entries=>{
    entries.forEach(ent=>{
      if(ent.isIntersecting){
        const id = Number(ent.target.dataset.id);
        const m = appData.messages.find(x=>x.id===id);
        if(m && !m.seenAt && currentUser && currentUser.role === 'receiver'){
          m.seenAt = new Date().toISOString();
          logActivity('Message "'+(m.title||'')+'" seen by '+currentUser.name+' at '+new Date().toLocaleString());
          save();
        }
      }
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('.msg[data-id]').forEach(n=> observer.observe(n));
}

// Render functions - keep UI structure unchanged
function renderAll(){
  try{
    $('siteTitle') && ($('siteTitle').textContent = appData.settings.title);
    $('subtitle') && ($('subtitle').textContent = appData.settings.subtitle);
    $('heartImage') && ($('heartImage').src = appData.settings.frontImage || 'heart.jpg');

    // today content
    const today = new Date().toISOString().split('T')[0];
    let content = appData.messages.find(m=> m.scheduled === today && m.released) || appData.messages.filter(m=> m.released).slice(-1)[0];
    if($('todayContent')) $('todayContent').innerHTML = content? renderMessageCard(content) : '<div class="muted-note">No content for today. Add some in the Admin Panel!</div>';

    // archive
    if($('archiveContent')) $('archiveContent').innerHTML = appData.messages.slice().reverse().map(m=> '<div class="msg" data-id="'+m.id+'">'+ renderMessageHTML(m) + renderControlsHTML(m) + renderCommentsHTML(m) +'</div>').join('') || '<div class="muted-note">No messages yet</div>';

    // admin content list
    if($('contentList')) $('contentList').innerHTML = appData.messages.slice().reverse().map(m=>'<div class="content-item"><div><strong>'+escapeHTML(m.title||'(No title)')+'</strong><div class="small">'+ (m.type||'') +' • '+ new Date(m.dateAdded).toLocaleDateString() +'</div></div><div style="display:flex;gap:6px"><button class="ghost" data-editmsg="'+m.id+'">Edit</button><button class="ghost" data-delete="'+m.id+'">Delete</button></div></div>').join('') || '<div class="muted-note">No content scheduled yet.</div>';

    // activity
    if($('activityLog')) $('activityLog').innerHTML = (appData.activity||[]).slice().reverse().map(a=>'<div class="small">'+escapeHTML(a)+'</div>').join('');

    // fill admin creds inputs if present
    if($('adminUser')) $('adminUser').value = appData.settings.credentials.adminUser || '';
    if($('receiverUser')) $('receiverUser').value = appData.settings.credentials.receiverUser || '';

    // show/hide admin panel button based on login
    if(currentUser && currentUser.role === 'admin'){
      $('openAdminPanel') && $('openAdminPanel').classList.remove('hidden');
      $('logoutBtn') && $('logoutBtn').classList.remove('hidden');
    } else {
      $('openAdminPanel') && $('openAdminPanel').classList.add('hidden');
    }

    // start observer after render
    setTimeout(()=> startObserver(), 250);
  }catch(e){ console.error(e); }
}

function renderMessageHTML(m){
  return '<div class="meta"><strong>'+escapeHTML(m.title||'(No title)')+'</strong> • '+ new Date(m.dateAdded).toLocaleString() +'</div><div style="white-space:pre-line">'+ escapeHTML(m.content) +'</div>' + (m.audio? '<div class="audio-section"><audio controls src="'+m.audio+'"></audio></div>':'');
}
function renderControlsHTML(m){
  let html = '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">';
  html += '<button class="ghost" data-addcomment="'+m.id+'">Comments</button>';
  if(currentUser && currentUser.role === 'admin'){
    html += '<button class="ghost" data-editmsg="'+m.id+'">Edit</button>';
    html += '<button class="ghost" data-reminder="'+m.id+'">Add Reminder</button>';
  }
  if(currentUser && currentUser.role !== 'admin'){
    html += '<button class="ghost" data-setrem="'+m.id+'">Set Reminder</button>';
  }
  html += '</div>';
  html += '<div class="small">'+ (m.seenAt ? 'Seen by receiver • ' + new Date(m.seenAt).toLocaleString() : 'Not seen yet') +'</div>';
  return html;
}
function renderMessageCard(m){
  return '<div class="msg" data-id="'+m.id+'">'+ renderMessageHTML(m) + renderControlsHTML(m) + renderCommentsHTML(m) +'</div>';
}
function renderCommentsHTML(m){
  const comments = (m.comments||[]).map(c=>{
    let s = '<div class="comment"><div class="small">'+ escapeHTML(c.by) + ' • ' + new Date(c.when).toLocaleString() +'</div><div>'+ escapeHTML(c.text) +'</div>';
    if(currentUser && currentUser.name === c.by){
      s += '<div><button class="ghost" data-editcomment="'+c.id+'" data-msg="'+m.id+'">Edit</button></div>';
    }
    if(currentUser && currentUser.role === 'admin' && c.history && c.history.length){
      s += '<div class="history-entry small">Previous versions:<br/>' + c.history.map(h=> 'On '+ new Date(h.when).toLocaleString() + ' → ' + escapeHTML(h.text)).join('<br/>') +'</div>';
    }
    s += '</div>';
    return s;
  }).join('');
  let add = '';
  if(currentUser){
    add = '<div style="margin-top:6px"><button class="btn" data-addcomment="'+m.id+'">Add Comment</button></div>';
  }
  return '<div class="comments-area" id="comments-'+m.id+'">' + comments + add + '</div>';
}

// Exports / Imports
function exportJson(){
  const blob = new Blob([JSON.stringify(appData,null,2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'gift_backup.json'; a.click();
}
function importJson(){
  const ip = document.createElement('input'); ip.type='file'; ip.accept='application/json'; ip.onchange=(e)=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=(ev)=>{ try{ const obj = JSON.parse(ev.target.result); appData = obj; save(); alert('Imported'); }catch(err){ alert('Invalid JSON'); } }; r.readAsText(f); }; ip.click();
}

// Music wiring
function toggleMusic(){
  const p = $('bgPlayer');
  if(!p) return;
  if(!p.src || p.src.indexOf('lofi.mp3')===-1) p.src = 'lofi.mp3';
  if(p.paused) { p.play().then(()=>{ $('toggleAudioBtn').textContent='Pause'; }).catch(()=>{ alert('Autoplay blocked — click Play to start music.'); }); }
  else { p.pause(); $('toggleAudioBtn').textContent='Play'; }
}

// Init: try to autoplay music
try{
  const bp = document.getElementById('bgPlayer');
  if(bp){ bp.src = 'lofi.mp3'; bp.loop = true; bp.play().catch(()=>{}); }
}catch(e){}

// helpers exposed
window.__gift_data = appData;
window.__gift_save = save;
