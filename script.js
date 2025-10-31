// Final full app script (with corrected login handling & pointer-events fix)
const STORAGE_KEY = 'gift_for_you_final_v3';

let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
if(!state.settings){
  state = {
    settings: {
      title: "My Heart's Journey",
      subtitle: "Every day with you is a new chapter in my favorite story.",
      frontImage: '',
      audioData: null,
      credentials: { adminUser:'admin', adminPass:'admin123', receiverUser:'receiver', receiverPass:'receiver123' }
    },
    messages: [],
    reminders: [],
    activity: [],
    nextId: 1
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

document.addEventListener('DOMContentLoaded', ()=>{

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

  const tabRead = document.getElementById('tabRead');
  const tabArchive = document.getElementById('tabArchive');
  const tabAdmin = document.getElementById('tabAdmin');
  const tabInfo = document.getElementById('tabInfo');

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

  const adminUserInput = document.getElementById('adminUserInput');
  const adminPassInput = document.getElementById('adminPassInput');
  const recUserInput = document.getElementById('recUserInput');
  const recPassInput = document.getElementById('recPassInput');
  const saveCredsBtn = document.getElementById('saveCredsBtn');

  let currentUser = null;
  let observer = null;

  function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function fmt(iso){ return iso ? new Date(iso).toLocaleString() : ''; }
  function escapeHtml(s){ if(!s && s!==0) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function fileToBase64(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); }); }
  function lockBody(lock){ document.body.style.overflow = lock ? 'hidden' : 'auto'; }

  // LOGIN handlers
  function handleLogin(){
    const u = (loginName.value||'').trim();
    const p = (loginPass.value||'').trim();
    if(!u){ loginError.textContent = 'Enter username'; return; }
    if(u === state.settings.credentials.adminUser && p === state.settings.credentials.adminPass){
      currentUser = { name:u, role:'admin' };
    } else if(u === state.settings.credentials.receiverUser && p === state.settings.credentials.receiverPass){
      currentUser = { name:u, role:'receiver' };
    } else { loginError.textContent = 'Wrong credentials'; return; }
    loginError.textContent = '';
    openApp();
    state.activity.push(`${currentUser.name} logged in as ${currentUser.role} at ${new Date().toLocaleString()}`);
    save();
  }

  doLogin.addEventListener('click', handleLogin);
  loginPass.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') handleLogin(); });
  loginName.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') handleLogin(); });

  closeLogin.addEventListener('click', ()=>{ loginModal.classList.add('hidden-opacity'); lockBody(false); setTimeout(()=>loginModal.style.display='none',260); });

  function openApp(){
    loginModal.classList.add('hidden-opacity');
    lockBody(false);
    setTimeout(()=>{ loginModal.style.display='none'; },260);
    app.classList.remove('hidden-opacity'); app.classList.add('visible-opacity');
    userLabel.textContent = `${currentUser.name} (${currentUser.role})`;
    if(currentUser.role === 'admin') tabAdmin.classList.remove('hidden');
    toggleAudioBtn.classList.remove('hidden');
    renderAll();
    setTimeout(()=>{ if(state.settings.audioData){ bgPlayer.src = state.settings.audioData; bgPlayer.play().catch(()=>{}); toggleAudioBtn.textContent='Pause'; } },150);
  }

  logoutBtn.addEventListener('click', ()=>{ currentUser = null; location.reload(); });

  saveCredsBtn.addEventListener('click', ()=>{
    if(!currentUser || currentUser.role !== 'admin'){ alert('Only admin can change credentials'); return; }
    const auser = (adminUserInput.value||'').trim();
    const apass = (adminPassInput.value||'').trim();
    const ruser = (recUserInput.value||'').trim();
    const rpass = (recPassInput.value||'').trim();
    if(auser) state.settings.credentials.adminUser = auser;
    if(apass) state.settings.credentials.adminPass = apass;
    if(ruser) state.settings.credentials.receiverUser = ruser;
    if(rpass) state.settings.credentials.receiverPass = rpass;
    save();
    alert('Credentials updated');
    adminPassInput.value=''; recPassInput.value='';
    userLabel.textContent = `${currentUser.name} (${currentUser.role})`;
  });

  siteTitle.addEventListener('blur', ()=>{ state.settings.title = siteTitle.textContent || "My Heart's Journey"; document.getElementById('pageTitle').textContent = state.settings.title; state.activity.push(`Title changed by ${(currentUser?currentUser.name:'?')} at ${new Date().toLocaleDateString()}`); save(); });
  subtitle.addEventListener('blur', ()=>{ state.settings.subtitle = subtitle.textContent || ''; state.activity.push(`Subtitle changed by ${(currentUser?currentUser.name:'?')} at ${new Date().toLocaleDateString()}`); save(); });

  heartImage.addEventListener('click', ()=>{ if(!currentUser || currentUser.role!=='admin') return; const ip=document.createElement('input'); ip.type='file'; ip.accept='image/*'; ip.onchange=(e)=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=(ev)=>{ state.settings.frontImage = ev.target.result; heartImage.src = ev.target.result; state.activity.push(`Admin updated heart image at ${new Date().toLocaleString()}`); save(); }; r.readAsDataURL(f); }; ip.click(); });

  tabRead.addEventListener('click', ()=>showSection('read')); tabArchive.addEventListener('click', ()=>showSection('archive')); tabAdmin.addEventListener('click', ()=>showSection('admin')); tabInfo.addEventListener('click', ()=>showSection('info'));
  function showSection(name){ document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active')); document.querySelectorAll('.panel').forEach(p=>p.classList.add('hidden')); if(name==='read'){ tabRead.classList.add('active'); readView.classList.remove('hidden'); } if(name==='archive'){ tabArchive.classList.add('active'); archiveView.classList.remove('hidden'); } if(name==='admin'){ tabAdmin.classList.add('active'); adminView.classList.remove('hidden'); } if(name==='info'){ tabInfo.classList.add('active'); infoView.classList.remove('hidden'); } }

  addContentBtn.addEventListener('click', async ()=>{
    if(!currentUser||currentUser.role!=='admin'){ alert('Only admin'); return; }
    const type = contentType.value; const title = contentTitle.value.trim(); const content = contentText.value.trim();
    const date = scheduleDate.value || null; const time = scheduleTime.value || '09:00';
    if(!content){ alert('Write content'); return; }
    let audioData = null;
    if(attachAudio.files && attachAudio.files[0]) audioData = await fileToBase64(attachAudio.files[0]);
    const msg = { id: state.nextId++, type, title, content, dateAdded:new Date().toISOString(), scheduled:date, scheduledTime:time, released: date?false:true, postedOn: date?null:new Date().toISOString(), audio:audioData, comments:[], preEdits:[], seenAt:null };
    state.messages.push(msg);
    state.activity.push(`Admin added message "${title||''}" at ${new Date().toLocaleDateString()}`);
    contentTitle.value=''; contentText.value=''; scheduleDate.value=''; scheduleTime.value='09:00'; attachAudio.value='';
    save(); renderAll();
  });

  document.getElementById('exportJson').addEventListener('click', ()=>{ const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='gift_backup.json'; a.click(); });
  document.getElementById('importJson').addEventListener('click', ()=>{ const ip=document.createElement('input'); ip.type='file'; ip.accept='application/json'; ip.onchange=(e)=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=(ev)=>{ try{ const obj=JSON.parse(ev.target.result); state = obj; save(); renderAll(); alert('Imported'); }catch(err){ alert('Invalid JSON'); } }; r.readAsText(f); }; ip.click(); });

  fab.addEventListener('click', ()=>fabMenu.classList.toggle('hidden'));
  fabAddMsg.addEventListener('click', ()=>{ if(!currentUser||currentUser.role!=='admin'){ alert('Only admin'); return; } const t = prompt('Title (optional)'); const txt = prompt('Message text'); if(!txt) return; state.messages.push({ id: state.nextId++, type:'message', title:t, content:txt, dateAdded:new Date().toISOString(), released:true, comments:[], preEdits:[], audio:null }); state.activity.push(`Admin added (FAB) "${t||''}"`); save(); renderAll(); });
  fabAddComment.addEventListener('click', ()=>{ if(!currentUser){ alert('Login to comment'); return; } const mid = prompt('Message ID to comment on'); const m = state.messages.find(x=>x.id==mid); if(!m) return alert('Invalid ID'); const txt = prompt('Your comment'); if(!txt) return; m.comments = m.comments || []; m.comments.push({ id: Date.now(), text:txt, by:currentUser.name, when:new Date().toISOString(), edits:[] }); state.activity.push(`${currentUser.name} commented`); save(); renderAll(); });
  fabAddRem.addEventListener('click', ()=>{ if(!currentUser){ alert('Login to set reminder'); return; } const mid = prompt('Message ID to set reminder for'); if(!mid) return; setReminderForUser(Number(mid)); });

  toggleAudioBtn.addEventListener('click', ()=>{ if(!bgPlayer.src) return; if(bgPlayer.paused){ bgPlayer.play().catch(()=>{}); toggleAudioBtn.textContent='Pause'; } else { bgPlayer.pause(); toggleAudioBtn.textContent='Play'; } });

  attachAudio.addEventListener('change', async (e)=>{ const f = e.target.files[0]; if(!f) return; const data = await fileToBase64(f); state.settings.audioData = data; bgPlayer.src = data; bgPlayer.play().catch(()=>{}); toggleAudioBtn.textContent='Pause'; state.activity.push(`Admin set background audio at ${new Date().toLocaleDateString()}`); save(); });

  document.addEventListener('click', function(e){
    const cbtn = e.target.closest('[data-comment-toggle]'); if(cbtn){ toggleComments(Number(cbtn.dataset.commentToggle)); return; }
    const ed = e.target.closest('[data-editmsg]'); if(ed){ editContent(Number(ed.dataset.editmsg)); return; }
    const adda = e.target.closest('[data-addaudio]'); if(adda){ addAudioToMessage(Number(adda.dataset.addaudio)); return; }
    const rem = e.target.closest('[data-reminder]'); if(rem){ addReminderAdmin(Number(rem.dataset.reminder)); return; }
    const srem = e.target.closest('[data-setrem]'); if(srem){ setReminderForUser(Number(srem.dataset.setrem)); return; }
    const ac = e.target.closest('[data-addcomment]'); if(ac){ addCommentUI(Number(ac.dataset.addcomment)); return; }
    const ec = e.target.closest('[data-editcomment]'); if(ec){ editComment(Number(ec.dataset.msg), Number(ec.dataset.editcomment)); return; }
  });

  function toggleComments(id){
    const area = document.getElementById('comments-'+id);
    if(!area) return;
    if(area.innerHTML.trim()!==''){ area.innerHTML=''; return; }
    const m = state.messages.find(x=>x.id===id);
    if(!m) return;
    let html = '<div style="font-weight:700">Aap kuch kehna chahenge ?</div>';
    (m.comments||[]).forEach(c=>{
      html += `<div class="comment"><div class="small"><strong>${escapeHtml(c.by)}</strong> • ${fmt(c.when)}</div><div>${escapeHtml(c.text)}</div>`;
      if(currentUser && currentUser.name===c.by){ html += `<div style="margin-top:6px;"><button class="btn ghost" data-editcomment="${c.id}" data-msg="${m.id}">Edit</button></div>`; }
      if(currentUser && currentUser.role==='admin' && c.edits && c.edits.length){ html += `<div class="history-entry">Admin: previous versions:<br>${c.edits.map(h=>'On '+fmt(h.when)+' → '+escapeHtml(h.old)).join('<br>')}</div>`; }
      html += '</div>';
    });
    if(currentUser){
      html += `<div style="margin-top:8px;"><button class="btn primary" data-addcomment="${m.id}">Add Comment</button></div>`;
    } else {
      html += `<div style="margin-top:8px;" class="muted-note">Login to comment</div>`;
    }
    area.innerHTML = html;
  }

  function addCommentUI(mid){ if(!currentUser){ alert('Login to comment'); return; } const txt = prompt('Write comment'); if(!txt) return; const m = state.messages.find(x=>x.id===mid); const comment = { id: Date.now(), text: txt, by: currentUser.name, when: new Date().toISOString(), edits: [] }; m.comments = m.comments || []; m.comments.push(comment); state.activity.push(`${currentUser.name} commented on "${m.title||''}" at ${new Date().toLocaleDateString()}`); save(); renderAll(); navigator.vibrate && navigator.vibrate(40); }

  function editComment(msgId, cid){ const m = state.messages.find(x=>x.id===msgId); if(!m) return; const c = m.comments.find(x=>x.id===cid); if(!c) return; if(currentUser && currentUser.name===c.by){ const nt = prompt('Edit comment', c.text); if(nt!==null){ c.edits = c.edits || []; c.edits.push({ old: c.text, when: new Date().toISOString() }); c.text = nt; c.editedAt = new Date().toISOString(); state.activity.push(`${c.by} edited a comment at ${new Date().toLocaleDateString()}`); save(); renderAll(); } } }

  function editContent(id){ const m = state.messages.find(x=>x.id===id); if(!m) return; const nc = prompt('Edit message', m.content); if(nc!==null){ m.preEdits = m.preEdits || []; m.preEdits.push({ old: m.content, when: new Date().toISOString() }); m.content = nc; state.activity.push(`Admin edited message "${m.title||''}" at ${new Date().toLocaleDateString()}`); save(); renderAll(); } }

  function addAudioToMessage(id){ if(!currentUser || currentUser.role!=='admin'){ alert('Only admin'); return; } const ip=document.createElement('input'); ip.type='file'; ip.accept='audio/*'; ip.onchange=async (e)=>{ const f=e.target.files[0]; if(!f) return; const data = await fileToBase64(f); const m = state.messages.find(x=>x.id===id); m.audio = data; state.activity.push(`Admin added audio to "${m.title||''}" at ${new Date().toLocaleDateString()}`); save(); renderAll(); }; ip.click(); }

  function addReminderAdmin(id){ const when = prompt('Reminder date-time (YYYY-MM-DD HH:MM)'); if(!when) return; const title = prompt('Reminder title', state.messages.find(m=>m.id===id).title||'Reminder'); try{ const iso = new Date(when.replace(' ','T')).toISOString(); state.reminders.push({ id: state.nextId++, title: title||'Reminder', when: iso, messageId: id, by: currentUser.name }); state.activity.push(`Admin added reminder for "${title||''}" at ${new Date().toLocaleDateString()}`); save(); }catch(e){ alert('Invalid date'); } }

  function setReminderForUser(id){ if(!currentUser){ alert('Login to set reminder'); return; } const when = prompt('Reminder date-time (YYYY-MM-DD HH:MM)'); if(!when) return; const title = prompt('Reminder title', state.messages.find(m=>m.id===id).title||'Reminder'); try{ const iso = new Date(when.replace(' ','T')).toISOString(); state.reminders.push({ id: state.nextId++, title: title||'Reminder', when: iso, messageId: id, by: currentUser.name }); state.activity.push(`${currentUser.name} set reminder for "${title||''}" at ${new Date().toLocaleDateString()}`); save(); }catch(e){ alert('Invalid date'); } }

  setInterval(scheduledReleaseCheck,30000);
  function scheduledReleaseCheck(){ const now = new Date(); let changed=false; state.messages.forEach(m=>{ if(m.released) return; if(!m.scheduled) return; const when = new Date(m.scheduled + 'T' + (m.scheduledTime||'09:00')); if(when <= now){ m.released = true; m.postedOn = new Date().toISOString(); changed=true; state.activity.push(`Message "${m.title||''}" released at ${new Date().toLocaleString()}`); } }); if(changed) save(); }

  function startReminderChecker(){ setInterval(()=>{ const now=new Date(); const due = state.reminders.filter(r=> !r.notified && new Date(r.when) <= now); due.forEach(r=>{ r.notified=true; navigator.vibrate && navigator.vibrate(60); state.activity.push('Reminder fired: '+r.title+' at '+new Date().toLocaleString()); }); if(due.length) save(); },10000); }

  function startObserver(){ if(observer) observer.disconnect(); if(!window.IntersectionObserver) return; observer = new IntersectionObserver(entries=>{ entries.forEach(ent=>{ if(ent.isIntersecting){ const el = ent.target; const id = Number(el.dataset.id); const m = state.messages.find(x=>x.id===id); if(m && !m.seenAt && currentUser && currentUser.role==='receiver'){ m.seenAt = new Date().toISOString(); state.activity.push(`Message "${m.title||''}" seen by ${currentUser.name} at ${new Date().toLocaleDateString()}`); save(); navigator.vibrate && navigator.vibrate(40); } } }); }, { threshold:0.6 }); document.querySelectorAll('.msg').forEach(n=> observer.observe(n)); }

  function renderAll(){ renderToday(); renderArchive(); renderAdminList(); renderActivity(); setTimeout(()=>startObserver(),200); }
  function renderToday(){ const today = new Date().toISOString().split('T')[0]; let content = state.messages.find(m=> m.scheduled === today && m.released) || state.messages.filter(m=>m.released).slice(-1)[0]; const container = document.getElementById('todayContent'); if(content){ container.innerHTML = `<div class="msg" data-id="${content.id}">${buildMessageHTML(content)}${buildMessageControls(content)}</div>`; document.getElementById('todayDate').textContent = content ? new Date(content.dateAdded).toLocaleDateString() : ''; } else { container.innerHTML = '<div class="muted-note">No content for today</div>'; } }
  function renderArchive(){ archiveContent.innerHTML = state.messages.slice().reverse().map(m=>`<div class="msg" data-id="${m.id}">${buildMessageHTML(m)}${buildMessageControls(m)}</div>`).join('') || '<div class="muted-note">No messages</div>'; }
  function renderAdminList(){ contentList.innerHTML = state.messages.slice().reverse().map(m=>`<div style="padding:8px;background:#fff;border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center"><div><strong>${escapeHtml(m.title||'(No title)')}</strong><div class="small">${m.type} • ${new Date(m.dateAdded).toLocaleDateString()}</div></div><div><button class="btn ghost" data-edit="${m.id}">Edit</button><button class="btn ghost" data-delete="${m.id}">Delete</button></div></div>`).join('') || '<div class="muted-note">No content scheduled yet.</div>'; document.querySelectorAll('[data-edit]').forEach(b=> b.onclick = ()=> editContent(Number(b.dataset.edit))); document.querySelectorAll('[data-delete]').forEach(b=> b.onclick = ()=> deleteContent(Number(b.dataset.delete))); }
  function renderActivity(){ activityLog.innerHTML = (state.activity || []).slice().reverse().map(a=>`<div class="small">${escapeHtml(a)}</div>`).join('') || '<div class="small">No activity</div>'; }
  function buildMessageHTML(m){ return `<div class="meta"><strong>${escapeHtml(m.title||'(No title)')}</strong> • ${new Date(m.dateAdded).toLocaleDateString()}</div><div style="white-space:pre-line">${escapeHtml(m.content)}</div>${m.audio?`<div class="audio-section"><audio controls src="${m.audio}"></audio></div>`:''}${m.seenAt?`<div class="small">Seen: ${fmt(m.seenAt)}</div>`:''}`; }
  function buildMessageControls(m){ let html = '<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">'; html += `<button class="btn ghost" data-comment-toggle="${m.id}">Comments</button>`; if(currentUser && currentUser.role === 'admin'){ html += `<button class="btn ghost" data-editmsg="${m.id}">Edit</button><button class="btn ghost" data-addaudio="${m.id}">Add Audio</button><button class="btn ghost" data-reminder="${m.id}">Add Reminder</button>`; } else if(currentUser){ html += `<button class="btn ghost" data-setrem="${m.id}">Set Reminder</button>`; } html += '</div>'; html += `<div id="comments-${m.id}" class="comments-area"></div>`; return html; }

  (function init(){
    if(state.settings.frontImage) heartImage.src = state.settings.frontImage;
    siteTitle.textContent = state.settings.title;
    subtitle.textContent = state.settings.subtitle;
    state.messages = state.messages || [];
    state.reminders = state.reminders || [];
    state.activity = state.activity || [];
    state.nextId = state.nextId || 1;
    loginModal.style.display = 'flex';
    lockBody(true);
    document.addEventListener('click', ()=>{ if(state.settings.audioData && !bgPlayer.src){ bgPlayer.src = state.settings.audioData; try{ bgPlayer.play(); toggleAudioBtn.textContent='Pause'; }catch(e){} } }, { once:true });
    startReminderChecker();
    renderAll();
  })();

});
