// Final single-file app logic
const STORAGE_KEY = 'gift_for_you_final_v5';
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

// SIMPLE AND WORKING LOGIN FUNCTION
function doLogin(){
  console.log('Login function called');
  
  const name = document.getElementById('loginName').value.trim();
  const role = document.getElementById('loginRole').value;
  const pass = document.getElementById('loginPass').value;
  
  console.log('Login attempt:', { name, role, pass });
  
  // Basic validation
  if(!name){ 
    alert('Please enter your name'); 
    return; 
  }
  
  if(!pass){ 
    alert('Please enter password'); 
    return; 
  }
  
  // Check credentials
  let isValid = false;
  if(role === 'admin'){
    isValid = (pass === appData.settings.credentials.adminPass);
    if(!isValid) {
      alert('Wrong admin password');
      return;
    }
  } else {
    isValid = (pass === appData.settings.credentials.receiverPass);
    if(!isValid) {
      alert('Wrong receiver password');
      return;
    }
  }
  
  // Login successful
  console.log('Login successful');
  currentUser = { name, role };
  document.getElementById('userLabel').textContent = name + ' (' + role + ')';
  
  // Add to activity log
  appData.activity.push(name + ' logged in as ' + role + ' at ' + new Date().toLocaleString());
  save();
  
  // Hide login and show app
  document.getElementById('loginModal').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  
  // Show appropriate UI based on role
  if(role === 'admin'){
    document.getElementById('openAdminPanel').classList.remove('hidden');
  }
  document.getElementById('logoutBtn').classList.remove('hidden');
  document.getElementById('toggleAudioBtn').classList.remove('hidden');
  
  startObserver();
  
  // Confetti effect
  showConfetti();
  
  // Update audio button
  updateAudioButton();
  
  console.log('Login process completed');
}

// Initialize UI
document.addEventListener('DOMContentLoaded', ()=>{
  console.log('DOM loaded - setting up login button');
  
  // DIRECT EVENT LISTENER - NO COMPLEX SETUP
  document.getElementById('doLogin').addEventListener('click', doLogin);
  
  // Also allow Enter key in password field
  document.getElementById('loginPass').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      doLogin();
    }
  });
  
  // Close button
  document.getElementById('closeLogin').addEventListener('click', () => {
    document.getElementById('loginModal').classList.add('hidden');
  });
  
  // Setup other events
  setupOtherEvents();
  renderAll();
  
  // Show login modal initially
  document.getElementById('loginModal').classList.remove('hidden');
  
  // Auto-play background music after a delay
  setTimeout(() => {
    if (appData.settings.bgMusic) {
      document.getElementById('bgPlayer').src = appData.settings.bgMusic;
      document.getElementById('bgPlayer').play().catch(e => console.log('Auto-play prevented'));
    }
  }, 1000);
  
  setInterval(scheduledReleaseCheck, 30000);
});

function setupOtherEvents(){
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => { 
    location.reload(); 
  });
  
  // Navigation
  document.getElementById('openAdminPanel').addEventListener('click', () => { 
    showSection('admin'); 
  });
  document.getElementById('openArchive').addEventListener('click', () => { 
    showSection('archive'); 
  });
  document.getElementById('openRead').addEventListener('click', () => { 
    showSection('read'); 
  });
  
  // Content management
  document.getElementById('addContentBtn').addEventListener('click', addContent);
  document.getElementById('attachAudio').addEventListener('change', handleAttachAudio);
  document.getElementById('toggleAudioBtn').addEventListener('click', toggleBackgroundMusic);
  
  // Info button
  document.getElementById('fab').addEventListener('click', showInfo);
  
  // Admin features
  document.getElementById('heartImage').addEventListener('click', () => { 
    if(!currentUser || currentUser.role!=='admin') return; 
    uploadHeart(); 
  });
  
  document.getElementById('siteTitle').addEventListener('click', () => { 
    if(!currentUser || currentUser.role!=='admin') return; 
    document.getElementById('siteTitle').contentEditable=true; 
    document.getElementById('siteTitle').focus(); 
  });
  
  document.getElementById('subtitle').addEventListener('click', () => { 
    if(!currentUser || currentUser.role!=='admin') return; 
    document.getElementById('subtitle').contentEditable=true; 
    document.getElementById('subtitle').focus(); 
  });
  
  document.getElementById('subtitle').addEventListener('blur', () => { 
    appData.settings.subtitle = document.getElementById('subtitle').textContent; 
    save(); 
  });
  
  document.getElementById('siteTitle').addEventListener('blur', () => { 
    appData.settings.title = document.getElementById('siteTitle').textContent; 
    document.title = document.getElementById('siteTitle').textContent; 
    save(); 
  });
  
  // New feature event listeners
  document.getElementById('changeAdminPass').addEventListener('click', changeAdminPassword);
  document.getElementById('changeReceiverPass').addEventListener('click', changeReceiverPassword);
  document.getElementById('changeBgMusic').addEventListener('change', handleBgMusicChange);
  document.getElementById('resetBgMusic').addEventListener('click', resetBgMusicToDefault);
  
  // Import/Export
  document.getElementById('exportJson').addEventListener('click', exportData);
  document.getElementById('importJson').addEventListener('click', importData);
}

// Password change functions
function changeAdminPassword() {
  if (!currentUser || currentUser.role !== 'admin') {
    alert('Only admin can change passwords');
    return;
  }
  const newPass = document.getElementById('adminPassword').value.trim();
  if (!newPass) {
    alert('Enter new admin password');
    return;
  }
  appData.settings.credentials.adminPass = newPass;
  document.getElementById('adminPassword').value = '';
  appData.activity.push('Admin changed admin password at ' + new Date().toLocaleString());
  save();
  alert('Admin password changed successfully!');
}

function changeReceiverPassword() {
  if (!currentUser || currentUser.role !== 'admin') {
    alert('Only admin can change passwords');
    return;
  }
  const newPass = document.getElementById('receiverPassword').value.trim();
  if (!newPass) {
    alert('Enter new receiver password');
    return;
  }
  appData.settings.credentials.receiverPass = newPass;
  document.getElementById('receiverPassword').value = '';
  appData.activity.push('Admin changed receiver password at ' + new Date().toLocaleString());
  save();
  alert('Receiver password changed successfully!');
}

// Background music functions
function toggleBackgroundMusic() {
  const bgPlayer = document.getElementById('bgPlayer');
  if (bgPlayer.paused) {
    bgPlayer.play().then(() => {
      updateAudioButton();
    }).catch(e => {
      console.log('Play failed:', e);
    });
  } else {
    bgPlayer.pause();
    updateAudioButton();
  }
}

function updateAudioButton() {
  const bgPlayer = document.getElementById('bgPlayer');
  document.getElementById('toggleAudioBtn').textContent = bgPlayer.paused ? 'Play' : 'Pause';
}

function handleBgMusicChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(ev) {
    appData.settings.bgMusic = ev.target.result;
    const bgPlayer = document.getElementById('bgPlayer');
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
  const bgPlayer = document.getElementById('bgPlayer');
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

Default Passwords:
Admin: admin/admin
Receiver: receiver/receiver
  `;
  alert(info);
}

// Confetti effect
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

// Upload heart image
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
      document.getElementById('heartImage').src = ev.target.result; 
      appData.activity.push('Admin updated heart image at '+new Date().toLocaleString()); 
      save(); 
    }; 
    r.readAsDataURL(f); 
  }; 
  ip.click(); 
}

// Add content
function addContent(){
  if(!currentUser || currentUser.role!=='admin'){ 
    alert('Only admin can add content'); 
    return; 
  }
  
  const type = document.getElementById('contentType').value;
  const title = document.getElementById('contentTitle').value.trim();
  const content = document.getElementById('contentText').value.trim();
  const date = document.getElementById('scheduleDate').value || null;
  const time = document.getElementById('scheduleTime').value || '09:00';
  
  if(!content){ 
    alert('Please write some content'); 
    return; 
  }
  
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
  
  // Clear form
  document.getElementById('contentTitle').value=''; 
  document.getElementById('contentText').value=''; 
  document.getElementById('scheduleDate').value=''; 
  document.getElementById('scheduleTime').value='09:00'; 
  document.getElementById('attachAudio').value='';
  
  save();
  alert('Content uploaded successfully!');
}

// Attach audio to form
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

// Render function
function renderAll(){
  // Header texts
  document.getElementById('siteTitle').textContent = appData.settings.title;
  document.getElementById('subtitle').textContent = appData.settings.subtitle;
  document.title = appData.settings.title;
  document.getElementById('heartImage').src = appData.settings.frontImage || 'heart.jpg';

  // Today content
  const today = new Date().toISOString().split('T')[0];
  let content = appData.messages.find(m=> m.scheduled === today && m.released) || appData.messages.filter(m=> m.released).slice(-1)[0];
  
  if(content){
    document.getElementById('todayContent').innerHTML = renderMessageCard(content);
  } else {
    document.getElementById('todayContent').innerHTML = '<div class="muted-note">No content for today. Add some in the Admin Panel!</div>';
  }

  // Archive
  if(appData.messages.length>0){
    document.getElementById('archiveContent').innerHTML = appData.messages.slice().reverse().map(m=>
      '<div class="msg" data-id="'+m.id+'">'+renderMessageCard(m)+'</div>'
    ).join('');
  } else {
    document.getElementById('archiveContent').innerHTML = '<div class="muted-note">No content yet.</div>';
  }

  // Admin content list
  if(appData.messages.length>0){
    document.getElementById('contentList').innerHTML = appData.messages.slice().reverse().map(m=>`
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
    
    // Attach listeners for edit/delete
    document.getElementById('contentList').querySelectorAll('button[data-edit]').forEach(btn=> 
      btn.onclick = ()=> editContent(Number(btn.dataset.edit))
    );
    document.getElementById('contentList').querySelectorAll('button[data-delete]').forEach(btn=> 
      btn.onclick = ()=> deleteContent(Number(btn.dataset.delete))
    );
  } else {
    document.getElementById('contentList').innerHTML = '<div class="muted-note">No content scheduled yet.</div>';
  }

  // Activity
  document.getElementById('activityLog').innerHTML = appData.activity.slice().reverse().map(a=>
    '<div class="small">'+a+'</div>'
  ).join('');

  saveLocalOnly();
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

function escapeHtml(s){ 
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); 
}

// Edit content
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
  if(!confirm('Are you sure you want to delete this message?')) return; 
  appData.messages = appData.messages.filter(x=> x.id!==id); 
  appData.activity.push('Admin deleted a message at '+new Date().toLocaleDateString()); 
  save(); 
}

// Comments handling
document.addEventListener('click', function(e){
  const com = e.target.closest('button[data-comment]');
  if(com){ 
    const id = Number(com.dataset.comment); 
    toggleComments(id); 
    return; 
  }
  
  const addc = e.target.closest('button[data-addcomment]');
  if(addc){ 
    const id = Number(addc.dataset.addcomment); 
    addComment(id); 
    return; 
  }
  
  const editbtn = e.target.closest('button[data-editmsg]');
  if(editbtn){ 
    editContent(Number(editbtn.dataset.editmsg)); 
    return; 
  }
  
  const addAudioBtn = e.target.closest('button[data-addaudio]');
  if(addAudioBtn){ 
    addAudioToMessage(Number(addAudioBtn.dataset.addaudio)); 
    return; 
  }
  
  const setRem = e.target.closest('button[data-setrem]');
  if(setRem){ 
    setReminderForUser(Number(setRem.dataset.setrem)); 
    return; 
  }
  
  const remind = e.target.closest('button[data-reminder]');
  if(remind){ 
    addReminderAdmin(Number(remind.dataset.reminder)); 
    return; 
  }
  
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
  if(!commentText){ 
    alert('Please write a comment'); 
    return; 
  }
  
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
  
  // Clear textarea and refresh comments
  document.getElementById('commentText-'+id).value = '';
  toggleComments(id); // Refresh to show new comment
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
    toggleComments(msgId); // Refresh comments
  }
}

// Add audio to message
function addAudioToMessage(id){
  if(!currentUser || currentUser.role!=='admin'){ 
    alert('Only admin can add audio'); 
    return; 
  }
  
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

// Reminders
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
    alert('Reminder set successfully!');
  }catch(e){ 
    alert('Invalid date format. Please use YYYY-MM-DD HH:MM'); 
  } 
}

function setReminderForUser(id){ 
  if(!currentUser){ 
    alert('Please login to set reminder'); 
    return; 
  } 
  
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
    alert('Reminder set successfully!');
  }catch(e){ 
    alert('Invalid date format. Please use YYYY-MM-DD HH:MM'); 
  } 
}

// Scheduled release check
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

// Observer for seen-tracking
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
          if(navigator.vibrate) navigator.vibrate(40); 
        } 
      } 
    }); 
  },{threshold:0.6});
  document.querySelectorAll('.msg').forEach(n=> observer.observe(n));
}

// Import/Export
function exportData(){
  const blob = new Blob([JSON.stringify(appData,null,2)],{type:'application/json'});
  const a = document.createElement('a'); 
  a.href = URL.createObjectURL(blob); 
  a.download = 'gift_backup.json'; 
  a.click();
}

function importData(){
  const ip = document.createElement('input'); 
  ip.type='file'; 
  ip.accept='application/json'; 
  ip.onchange=(e)=>{ 
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
      }catch(err){ 
        alert('Invalid JSON file'); 
      } 
    }; 
    r.readAsText(f); 
  }; 
  ip.click();
}

function saveLocalOnly(){ 
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData)); 
}

function save(){ 
  saveLocalOnly(); 
  renderAll(); 
}

function showSection(name){
  document.getElementById('readView').classList.add('hidden'); 
  document.getElementById('archiveView').classList.add('hidden'); 
  document.getElementById('adminPanel').classList.add('hidden');
  
  if(name==='read') document.getElementById('readView').classList.remove('hidden');
  if(name==='archive') document.getElementById('archiveView').classList.remove('hidden');
  if(name==='admin') document.getElementById('adminPanel').classList.remove('hidden');
}
