// Final single-file app logic
const STORAGE_KEY = 'gift_for_you_final_v2';
let appData = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {
  settings: { 
    title: 'Happy Birthday 💖', 
    subtitle: 'Every day with you is a new chapter in my favorite story.', 
    frontImage: 'heart.jpg', 
    audioMode: 'none', 
    audioData: null, 
    bgMusic: 'lofi.mp3',
    credentials: { 
      adminUser: 'admin', 
      adminPass: 'admin', 
      receiverUser: 'receiver', 
      receiverPass: 'receiver' 
    } 
  },
  messages: [], 
  nextId: 1, 
  activity: [], 
  reminders: []
};
let currentUser = null;
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

// New elements
const changeAdminPassBtn = document.getElementById('changeAdminPass');
const changeReceiverPassBtn = document.getElementById('changeReceiverPass');
const adminPassword = document.getElementById('adminPassword');
const receiverPassword = document.getElementById('receiverPassword');
const changeBgMusic = document.getElementById('changeBgMusic');
const resetBgMusic = document.getElementById('resetBgMusic');

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
  // Auto-play background music
  setTimeout(() => {
    if (appData.settings.bgMusic) {
      bgPlayer.src = appData.settings.bgMusic;
      bgPlayer.play().catch(e => console.log('Auto-play prevented:', e));
    }
  }, 1000);
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
  toggleAudioBtn.addEventListener('click', toggleBackgroundMusic);
  fab.addEventListener('click', showInfo);
  heartImage.addEventListener('click', ()=>{ if(!currentUser || currentUser.role!=='admin') return; uploadHeart(); });
  siteTitle.addEventListener('click', ()=>{ if(!currentUser || currentUser.role!=='admin') return; siteTitle.contentEditable=true; siteTitle.focus(); });
  subtitle.addEventListener('click', ()=>{ if(!currentUser || currentUser.role!=='admin') return; subtitle.contentEditable=true; subtitle.focus(); });
  subtitle.addEventListener('blur', ()=>{ appData.settings.subtitle = subtitle.textContent; save(); });
  siteTitle.addEventListener('blur', ()=>{ appData.settings.title = siteTitle.textContent; document.title = siteTitle.textContent; save(); });
  
  // New event listeners
  changeAdminPassBtn.addEventListener('click', changeAdminPassword);
  changeReceiverPassBtn.addEventListener('click', changeReceiverPassword);
  changeBgMusic.addEventListener('change', handleBgMusicChange);
  resetBgMusic.addEventListener('click', resetBgMusicToDefault);
}

// login
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
  if(role==='admin'){ 
    openAdminPanelBtn.classList.remove('hidden'); 
    document.getElementById('logoutBtn').classList.remove('hidden'); 
    document.getElementById('openAdminPanel').classList.remove('hidden'); 
    toggleAudioBtn.classList.remove('hidden');
  } else { 
    document.getElementById('logoutBtn').classList.remove('hidden'); 
    toggleAudioBtn.classList.remove('hidden');
  }
  startObserver();
  // confetti + vibration
  navigator.vibrate && navigator.vibrate(60);
  showConfetti();
  
  // Update audio button text
  updateAudioButton();
}

// Change passwords
function changeAdminPassword() {
  if (!currentUser || currentUser.role !== 'admin') {
    alert('Only admin can change passwords');
    return;
  }
  const newPass = adminPassword.value.trim();
  if (!newPass) {
    alert('Enter new admin password');
    return;
  }
  appData.settings.credentials.adminPass = newPass;
  adminPassword.value = '';
  appData.activity.push('Admin changed admin password at ' + new Date().toLocaleString());
  save();
  alert('Admin password changed successfully!');
}

function changeReceiverPassword() {
  if (!currentUser || currentUser.role !== 'admin') {
    alert('Only admin can change passwords');
    return;
  }
  const newPass = receiverPassword.value.trim();
  if (!newPass) {
    alert('Enter new receiver password');
    return;
  }
  appData.settings.credentials.receiverPass = newPass;
  receiverPassword.value = '';
  appData.activity.push('Admin changed receiver password at ' + new Date().toLocaleString());
  save();
  alert('Receiver password changed successfully!');
}

// Background music functions
function toggleBackgroundMusic() {
  if (bgPlayer.paused) {
    bgPlayer.play().then(() => {
      updateAudioButton();
    }).catch(e => {
      console.log('Play failed:', e);
      alert('Could not play audio. Please check if audio file exists.');
    });
  } else {
    bgPlayer.pause();
    updateAudioButton();
  }
}

function updateAudioButton() {
  toggleAudioBtn.textContent = bgPlayer.paused ? 'Play Music' : 'Pause Music';
}

function handleBgMusicChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(ev) {
    appData.settings.bgMusic = ev.target.result;
    bgPlayer.src = ev.target.result;
    bgPlayer.play().then(() => {
      updateAudioButton();
      appData.activity.push((currentUser?.name || 'User') + ' changed background music at ' + new Date().toLocaleString());
      save();
      alert('Background music updated!');
    }).catch(err => {
      console.log('Play failed:', err);
    });
  };
  reader.readAsDataURL(file);
}

function resetBgMusicToDefault() {
  appData.settings.bgMusic = 'lofi.mp3';
  bgPlayer.src = 'lofi.mp3';
  bgPlayer.play().then(() => {
    updateAudioButton();
    appData.activity.push((currentUser?.name || 'User') + ' reset background music to default at ' + new Date().toLocaleString());
    save();
    alert('Background music reset to default!');
  }).catch(err => {
    console.log('Default music play failed:', err);
  });
}

// Info button
function showInfo() {
  const info = `
App Features:
• Login as Admin or Receiver
• Admin can send scheduled messages/poems
• Receiver can view messages and add comments
• Both can set reminders for messages
• Change background music (supports lofi.mp3)
• Admin can change passwords
• Edit comments (Receiver can edit their own comments)
• Auto-play background music
• Beautiful responsive design

Tips:
- Admin: Click heart to change image, click text to edit
- Receiver: Add comments under "Aap kuch kehna chahenge"
- Use reminders to remember important messages
- Export/Import data in Admin panel
  `;
  alert(info);
}

// confetti (simple)
function showConfetti(){ 
  const wrap = document.createElement('div'); 
  wrap.className='confetti-wrap'; 
  for(let i=0;i<18;i++){ 
    const d=document.createElement('div'); 
    d.className='confetti'; 
    d.style.left=(Math.random()*90)+'%'; 
    d.style.animationDelay=(Math.random()*900)+'ms'; 
    d.textContent='❤'; 
    wrap.appendChild(d); 
  } 
  document.body.appendChild(wrap); 
  setTimeout(()=>wrap.remove(),2200); 
}

// upload heart
function uploadHeart(){ 
  const ip=document.createElement('input'); 
  ip.type='file'; 
  ip.accept='image/*'; 
  ip.onchange=(e)=>{ 
    const f=e.target.files[0]; 
    if(!f) return; 
    const r=new FileReader(); 
    r.onload=(ev)=>{ 
      appData.settings.frontImage = ev.target.result; 
      heartImage.src = ev.target.result; 
      appData.activity.push('Admin updated heart image at '+new Date().toLocaleString()); 
      save(); 
    }; 
    r.readAsDataURL(f); 
  }; 
  ip.click(); 
}

// add content
async function addContent(){
  if(!currentUser || currentUser.role!=='admin'){ alert('Only admin can add'); return; }
  const type = contentType.value;
  const title = contentTitle.value.trim();
  const content = contentText.value.trim();
  const date = scheduleDate.value || null;
  const time = scheduleTime.value || '09:00';
  if(!content){ alert('Write content'); return; }
  
  const newMsg = { 
    id: appData.nextId++, 
    type, 
    title, 
    content, 
    dateAdded: new Date().toISOString(), 
    scheduled: date, 
    scheduledTime: time, 
    released: date?false:true, 
    postedOn: date?null:new Date().toISOString(), 
    comments: [], 
    audio: appData.settings.latestAudio || null, 
    preEdits: [] 
  };
  
  appData.messages.push(newMsg);
  appData.activity.push('Admin added "'+(title||'untitled')+'" at '+new Date().toLocaleString());
  
  // Clear audio after attaching to message
  appData.settings.latestAudio = null;
  
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
  r.onload = ()=>{ 
    appData.settings.latestAudio = r.result; 
    alert('Audio ready — click Upload Content to attach it to the message.'); 
  };
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
    archiveContent.innerHTML = appData.messages.slice().reverse().map(m=>'<div class="msg" data-id="'+m.id+'">'+renderMessageCard(m)+'</div>').join('');
  } else archiveContent.innerHTML = '<div class="muted-note">No content yet.</div>';

  // admin content list
  if(appData.messages.length>0){
    contentList.innerHTML = appData.messages.slice().reverse().map(m=>`
      <div class="content-item">
        <div>
          <strong>${m.title||'(No title)'}</strong>
          <div class="small">${m.type} • ${new Date(m.dateAdded).toLocaleDateString()}</div>
        </div>
        <div style="display:flex;gap:6px">
          <button class="ghost" data-edit="${m.id}">Edit</button>
          <button class="ghost" data-delete="${m.id}">Delete</button>
        </div>
      </div>
    `).join('');
    // attach listeners for edit/delete
    contentList.querySelectorAll('button[data-edit]').forEach(btn=> btn.onclick = ()=> editContent(Number(btn.dataset.edit)));
    contentList.querySelectorAll('button[data-delete]').forEach(btn=> btn.onclick = ()=> deleteContent(Number(btn.dataset.delete)));
  } else contentList.innerHTML = '<div class="muted-note">No content scheduled yet.</div>';

  // activity
  activityLog.innerHTML = appData.activity.slice().reverse().map(a=>'<div class="small">'+a+'</div>').join('');

  saveLocalOnly(); // ensure storage
  
  // Update audio button
  updateAudioButton();
}

function renderMessageCard(m){
  return renderMessageHTML(m) + renderMessageControls(m);
}

function renderMessageHTML(m){
  return `
    <div class="meta">
      <strong>${m.title||'(No title)'}</strong> • ${new Date(m.dateAdded).toLocaleString()}
    </div>
    <div style="white-space:pre-line">${escapeHtml(m.content)}</div>
    ${m.audio ? <div class="audio-section"><audio controls src="${m.audio}"></audio></div> : ''}
  `;
}

function renderMessageControls(m){
  let html = '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">';
  html += <button class="ghost" data-comment="${m.id}">Aap kuch kehna chahenge?</button>;
  if(currentUser && currentUser.role==='admin'){ 
    html += <button class="ghost" data-editmsg="${m.id}">Edit</button>; 
    html += <button class="ghost" data-addaudio="${m.id}">Add Audio</button>; 
    html += <button class="ghost" data-reminder="${m.id}">Add Reminder</button>; 
  }
  if(currentUser && currentUser.role!=='admin'){ 
    html += <button class="ghost" data-setrem="${m.id}">Set Reminder</button>; 
  }
  html += '</div>';
  html += <div class="comments-area" id="comments-${m.id}"></div>;
  return html;
}

function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// edit content
function editContent(id){ 
  const m = appData.messages.find(x=>x.id===id); 
  if(!m) return; 
  const nc = prompt('Edit message content', m.content); 
  if(nc!==null){ 
    m.preEdits = m.preEdits || []; 
    m.preEdits.push({when:new Date().toISOString(), text: m.content}); 
    m.content = nc; 
    appData.activity.push('Admin edited "'+(m.title||'')+'" at '+new Date().toLocaleString()); 
    save(); 
  } 
}

function deleteContent(id){ 
  if(!confirm('Delete?')) return; 
  appData.messages = appData.messages.filter(x=> x.id!==id); 
  appData.activity.push('Admin deleted a message at '+new Date().toLocaleDateString()); 
  save(); 
}

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
  
  const editCommentBtn = e.target.closest('button[data-editcomment]');
  if(editCommentBtn){ 
    const msgId = Number(editCommentBtn.dataset.msgid);
    const commentId = Number(editCommentBtn.dataset.commentid);
    editComment(msgId, commentId); 
    return; 
  }
});

function toggleComments(id){
  const area = document.getElementById('comments-'+id);
  if(!area) return;
  
  if(area.innerHTML.trim()!==''){ 
    area.innerHTML=''; 
    return; 
  }
  
  const m = appData.messages.find(x=>x.id===id);
  if(!m) return;
  
  // Show comments
  let commentsHTML = '';
  if (m.comments && m.comments.length > 0) {
    commentsHTML = m.comments.map(c => `
      <div class="comment">
        <div class="small">${c.by} • ${new Date(c.when).toLocaleString()}</div>
        <div>${escapeHtml(c.text)}</div>
        ${(currentUser && currentUser.name === c.by) ? 
          <button class="ghost" data-editcomment data-msgid="${m.id}" data-commentid="${c.id}">Edit</button> : ''}
      </div>
    `).join('');
  } else {
    commentsHTML = '<div class="muted-note">No comments yet.</div>';
  }
  
  // Add comment form
  if(currentUser){
    commentsHTML += `
      <div style="margin-top: 10px;">
        <textarea id="commentText-${m.id}" placeholder="Type your comment here..." style="width:100%; padding:8px; border-radius:8px; border:1px solid #eee;"></textarea>
        <button class="btn ghost" data-addcomment="${m.id}" style="margin-top:5px;">Add Comment</button>
      </div>
    `;
  }
  
  area.innerHTML = commentsHTML;
}

function addComment(id){
  const m = appData.messages.find(x=>x.id===id);
  if(!m || !currentUser) return;
  
  const commentText = document.getElementById('commentText-'+id)?.value.trim();
  if(!commentText){ alert('Please write a comment'); return; }
  
  const comment = { 
    id: Date.now(), 
    by: currentUser.name, 
    when: new Date().toISOString(), 
    text: commentText, 
    history: [] 
  };
  
  m.comments = m.comments || [];
  m.comments.push(comment);
  appData.activity.push(currentUser.name + ' commented at ' + new Date().toLocaleString());
  save();
  
  // Clear textarea
  document.getElementById('commentText-'+id).value = '';
}

function editComment(msgId, commentId){
  const m = appData.messages.find(x=>x.id===msgId);
  if(!m || !m.comments) return;
  
  const comment = m.comments.find(c=>c.id===commentId);
  if(!comment) return;
  
  if(currentUser && currentUser.name !== comment.by){
    alert('You can only edit your own comments');
    return;
  }
  
  const newText = prompt('Edit your comment', comment.text);
  if(newText !== null){
    comment.history = comment.history || [];
    comment.history.push({
      when: new Date().toISOString(),
      text: comment.text
    });
    comment.text = newText;
    comment.editedAt = new Date().toISOString();
    appData.activity.push(currentUser.name + ' edited a comment at ' + new Date().toLocaleString());
    save();
  }
}

// add audio to message (admin)
function addAudioToMessage(id){
  if(!currentUser || currentUser.role!=='admin'){ alert('Only admin'); return; }
  const ip = document.createElement('input'); 
  ip.type='file'; 
  ip.accept='audio/*'; 
  ip.onchange=(e)=>{ 
    const f=e.target.files[0]; 
    if(!f) return; 
    const r = new FileReader(); 
    r.onload = (ev)=>{ 
      const m = appData.messages.find(x=>x.id===id); 
      m.audio = ev.target.result; 
      appData.activity.push('Admin added audio to message "'+(m.title||'')+'" at '+new Date().toLocaleString()); 
      save(); 
    }; 
    r.readAsDataURL(f); 
  }; 
  ip.click();
}

// reminders
function addReminderAdmin(id){ 
  const when = prompt('Reminder date-time (YYYY-MM-DD HH:MM)'); 
  if(!when) return; 
  const title = prompt('Reminder title', appData.messages.find(m=>m.id===id).title||'Reminder'); 
  try{ 
    const iso = new Date(when.replace(' ','T')).toISOString(); 
    appData.reminders.push({ 
      id: appData.nextId++, 
      title: title||'Reminder', 
      when: iso, 
      messageId: id, 
      by: currentUser.name 
    }); 
    appData.activity.push('Admin added reminder at '+new Date().toLocaleString()); 
    save(); 
    alert('Reminder set!');
  }catch(e){ alert('Invalid date format'); } 
}

function setReminderForUser(id){ 
  if(!currentUser){ alert('Login to set reminder'); return; } 
  const when = prompt('Reminder date-time (YYYY-MM-DD HH:MM)'); 
  if(!when) return; 
  const title = prompt('Reminder title', appData.messages.find(m=>m.id===id).title||'Reminder'); 
  try{ 
    const iso = new Date(when.replace(' ','T')).toISOString(); 
    appData.reminders.push({ 
      id: appData.nextId++, 
      title: title||'Reminder', 
      when: iso, 
      messageId: id, 
      by: currentUser.name 
    }); 
    appData.activity.push(currentUser.name + ' set a reminder at '+new Date().toLocaleString()); 
    save(); 
    alert('Reminder set!');
  }catch(e){ alert('Invalid date format'); } 
}

// scheduled release check
function scheduledReleaseCheck(){
  const now = new Date();
  let changed=false;
  appData.messages.forEach(m=>{
    if(m.released) return;
    if(!m.scheduled) return;
    const when = new Date(m.scheduled + 'T' + (m.scheduledTime || '09:00'));
    if(when <= now){ 
      m.released = true; 
      m.postedOn = new Date().toISOString(); 
      appData.activity.push('Message "'+(m.title||'')+'" released at '+new Date().toLocaleString()); 
      changed=true; 
    }
  });
  if(changed) save();
}

// observer for seen-tracking
function startObserver(){
  if(observer) observer.disconnect();
  observer = new IntersectionObserver(entries=>{ 
    entries.forEach(ent=>{ 
      if(ent.isIntersecting){ 
        const id = Number(ent.target.dataset.id); 
        const m = appData.messages.find(x=>x.id===id); 
        if(m && !m.seenAt && currentUser && currentUser.role==='receiver'){ 
          m.seenAt = new Date().toISOString(); 
          appData.activity.push('Message "'+(m.title||'')+'" seen by '+currentUser.name+' at '+new Date().toLocaleString()); 
          save(); 
          navigator.vibrate && navigator.vibrate(40); 
        } 
      } 
    }); 
  },{threshold:0.6});
  document.querySelectorAll('.msg').forEach(n=> observer.observe(n));
}

// import/export
document.getElementById('exportJson').addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(appData,null,2)],{type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'gift_backup.json'; a.click();
});

document.getElementById('importJson').addEventListener('click', ()=>{
  const ip = document.createElement('input'); ip.type='file'; ip.accept='application/json'; ip.onchange=(e)=>{ 
    const f=e.target.files[0]; 
    if(!f) return; 
    const r=new FileReader(); 
    r.onload=(ev)=>{ 
      try{ 
        const obj = JSON.parse(ev.target.result); 
        appData = obj; 
        save(); 
        alert('Imported successfully!'); 
        location.reload();
      }catch(err){ alert('Invalid JSON file'); } 
    }; 
    r.readAsText(f); 
  }; 
  ip.click();
});

// internal local save (avoid double-save)
function saveLocalOnly(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(appData)); }

function save(){ saveLocalOnly(); renderAll(); }

// last: initial UI state toggles
function showSection(name){
  readView.classList.add('hidden'); 
  archiveView.classList.add('hidden'); 
  adminPanel.classList.add('hidden');
  if(name==='read') readView.classList.remove('hidden');
  if(name==='archive') archiveView.classList.remove('hidden');
  if(name==='admin') adminPanel.classList.remove('hidden');
}

// Expose some helpers for debugging
window.__gift_save = save;
window.__gift_data = appData;
