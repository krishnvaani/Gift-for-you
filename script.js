
// gift_for_you final release - client-only
const STORAGE_KEY = 'gift_for_you_release_v1';
let state = localStorage.getItem(STORAGE_KEY) ? JSON.parse(localStorage.getItem(STORAGE_KEY)) : {
  settings:{ title:'Happy Birthday 💖', subtitle:'Every day with you is a new chapter in my favorite story.', frontImage:'heart.jpg', audioMode:'default', audioData:null, credentials:{adminUser:'admin',adminPass:'admin',receiverUser:'receiver',receiverPass:'receiver',receiverRequiresPass:true} },
  messages:[], nextId:1, activity:[], users:[], reminders:[]
};
let currentUser = null;
let observer = null;

function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); renderAll(); }
function toast(text, short=false){ const t=document.createElement('div'); t.className='toast'; t.textContent=text; document.body.appendChild(t); setTimeout(()=>t.remove(), short?1600:3600); }
function vibrate(){ if(navigator.vibrate) navigator.vibrate(60); }
function fmt(iso){ return iso ? new Date(iso).toLocaleString() : ''; }

document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('siteTitle').textContent = state.settings.title;
  document.getElementById('subtitle').textContent = state.settings.subtitle;
  if(state.settings.frontImage) document.getElementById('heartImage').src = state.settings.frontImage;

  // audio setup
  if(state.settings.audioMode === 'default'){ configureAudioSource('lofi.mp3'); attemptPlay(); document.getElementById('toggleAudioBtn').style.display='inline-block'; }
  else if(state.settings.audioData){ configureAudioSource(state.settings.audioData); document.getElementById('toggleAudioBtn').style.display='inline-block'; }
  else document.getElementById('toggleAudioBtn').style.display='none';

  // wire events
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
  document.getElementById('subtitle').addEventListener('click', ()=>{ if(!currentUser||currentUser.role!=='admin') return; const el=document.getElementById('subtitle'); el.contentEditable=true; el.focus(); });
  document.getElementById('subtitle').addEventListener('blur', ()=>{ state.settings.subtitle=document.getElementById('subtitle').textContent; saveState(); });
  document.getElementById('heartImage').addEventListener('click', ()=>{ if(!currentUser||currentUser.role!=='admin') return; uploadImageAndSet(); });

  renderAll();
  setTimeout(()=>document.body.classList.add('loaded'),300);
  startReminderChecker();
  setInterval(()=>{ scheduledReleaseCheck(); saveState(); },30000);
});

// login
function openLogin(){ document.getElementById('loginModal').classList.remove('hidden'); }
function closeLogin(){ document.getElementById('loginModal').classList.add('hidden'); }
function doLogin(){
  const name=document.getElementById('loginName').value.trim();
  const role=document.getElementById('loginRole').value;
  const pass=document.getElementById('loginPass').value;
  if(!name){ alert('Enter name'); return; }
  if(role==='admin'){ if(pass!==state.settings.credentials.adminPass){ alert('Wrong admin password'); return; } }
  else { if(state.settings.credentials.receiverRequiresPass && pass!==state.settings.credentials.receiverPass){ alert('Wrong receiver password'); return; } }
  currentUser={name,role};
  state.users.push({name,role,when:new Date().toISOString()});
  document.getElementById('userLabel').textContent = name+' ('+role+')';
  document.getElementById('loginName').value=''; document.getElementById('loginPass').value='';
  closeLogin();
  document.getElementById('app').classList.remove('hidden');
  saveState();
  startObserver();
  toast('Logged in as '+role,true);
}

// image upload
function uploadImageAndSet(){ const ip=document.createElement('input'); ip.type='file'; ip.accept='image/*'; ip.onchange=(e)=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=(ev)=>{ state.settings.frontImage=ev.target.result; document.getElementById('heartImage').src=ev.target.result; state.activity.push('Admin updated heart image at '+new Date().toLocaleString()); saveState(); toast('Image updated',true); }; r.readAsDataURL(f); }; ip.click(); }

// messages
function addMessage(){ if(!currentUser||currentUser.role!=='admin'){ alert('Only admin'); return; } const title=document.getElementById('msgTitle').value.trim(); const content=document.getElementById('msgContent').value.trim(); const date=document.getElementById('msgDate').value||null; const time=document.getElementById('msgTime').value||null; if(!content){ alert('Write content'); return; } const msg={ id: state.nextId++, title, content, created: new Date().toISOString(), scheduled: date, scheduledTime: time, released: date?false:true, postedOn: date?null:new Date().toISOString(), comments:[], seenAt:null, preEdits:[] }; state.messages.push(msg); state.activity.push('Admin added message \"'+(title||'untitled')+'\" at '+new Date().toLocaleString()); document.getElementById('msgTitle').value=''; document.getElementById('msgContent').value=''; saveState(); toast('Message added',true); }

// render
function renderAll(){ document.getElementById('siteTitle').textContent = state.settings.title; document.getElementById('subtitle').textContent = state.settings.subtitle; if(state.settings.frontImage) document.getElementById('heartImage').src=state.settings.frontImage; const container=document.getElementById('messagesContainer'); container.innerHTML=''; const msgs=state.messages.filter(m=>m.released); if(!msgs.length) container.innerHTML='<div class=\"small center\">No messages yet</div>'; msgs.slice().reverse().forEach(m=>container.appendChild(buildMsg(m))); document.getElementById('activityLog').innerHTML=state.activity.slice().reverse().map(a=>'<div class=\"small\">'+a+'</div>').join('<hr/>'); const remList=document.getElementById('remindersList'); if(remList){ remList.innerHTML = state.reminders.map(r=>'<div class=\"reminder\"><strong>'+r.title+'</strong><div class=\"small\">'+fmt(r.when)+'</div></div>').join('') || '<div class=\"small center\">No reminders</div>'; } }

function buildMsg(m){ const el=document.createElement('div'); el.className='msg'; el.dataset.id=m.id; const meta=document.createElement('div'); meta.className='meta'; meta.innerHTML='<strong>'+ (m.title||'(No title)') +'</strong> • '+fmt(m.created); el.appendChild(meta); const body=document.createElement('div'); body.style.whiteSpace='pre-line'; body.textContent=m.content; el.appendChild(body); if(currentUser&&currentUser.role==='admin'){ const seen=document.createElement('div'); seen.className='small'; seen.style.marginTop='6px'; seen.textContent='Status: '+(m.seenAt?('Seen at '+fmt(m.seenAt)):'Unseen'); el.appendChild(seen); } if(m.audio){ const a=document.createElement('audio'); a.controls=true; a.src=m.audio; el.appendChild(a); } const comments=document.createElement('div'); comments.style.marginTop='10px'; comments.innerHTML='<div style=\"font-weight:700\">Aap kuch kehna chahenge ?</div>'; (m.comments||[]).forEach(c=>{ const cbox=document.createElement('div'); cbox.className='comment'; const metaC=document.createElement('div'); metaC.className='small'; metaC.textContent=c.by+' • '+fmt(c.when); cbox.appendChild(metaC); const txt=document.createElement('div'); txt.textContent=c.text; cbox.appendChild(txt); if(c.history&&c.history.length){ c.history.forEach(h=>{ const he=document.createElement('div'); he.className='history-entry'; he.textContent='Edited on '+fmt(h.when)+' → '+h.text; cbox.appendChild(he); }); } if(currentUser&&currentUser.name===c.by){ const eb=document.createElement('button'); eb.className='ghost'; eb.textContent='Edit'; eb.onclick=()=>{ const nt=prompt('Edit comment', c.text); if(nt!==null){ c.history=c.history||[]; c.history.push({when:new Date().toISOString(), text:c.text}); c.preEdits=c.preEdits||[]; c.preEdits.push({when:new Date().toISOString(), text:c.text}); c.text=nt; c.editedAt=new Date().toISOString(); state.activity.push(c.by+' edited a comment on \"'+(m.title||'untitled')+'\" at '+new Date().toLocaleString()); saveState(); vibrate(); toast('Comment updated',true); } }; cbox.appendChild(eb); } if(currentUser&&currentUser.role==='admin'&&c.preEdits&&c.preEdits.length){ const psep=document.createElement('div'); psep.className='small'; psep.style.marginTop='8px'; psep.textContent='Admin: previous versions (hidden from receiver):'; cbox.appendChild(psep); c.preEdits.forEach(pe=>{ const p=document.createElement('div'); p.className='history-entry'; p.style.opacity=0.7; p.textContent='On '+fmt(pe.when)+' → '+pe.text; cbox.appendChild(p); }); } comments.appendChild(cbox); }); if(currentUser&&currentUser.role==='receiver'){ const add=document.createElement('button'); add.className='btn-primary'; add.textContent='Add Comment'; add.onclick=()=>{ const txt=prompt('Write your comment'); if(txt){ const c={ id: state.nextId++, by: currentUser.name, when:new Date().toISOString(), text:txt, history:[], preEdits:[] }; m.comments=m.comments||[]; m.comments.push(c); state.activity.push(currentUser.name+' commented on \"'+(m.title||'untitled')+'\" at '+new Date().toLocaleString()); saveState(); vibrate(); toast('Comment added',true); } }; comments.appendChild(add); } el.appendChild(comments); if(currentUser&&currentUser.role==='admin'){ const ar=document.createElement('div'); ar.style.marginTop='8px'; ar.style.display='flex'; ar.style.gap='8px'; const ed=document.createElement('button'); ed.className='ghost'; ed.textContent='Edit'; ed.onclick=()=>{ const nc=prompt('Edit message', m.content); if(nc!==null){ m.preEdits=m.preEdits||[]; m.preEdits.push({when:new Date().toISOString(), text:m.content}); m.content=nc; state.activity.push('Admin edited message \"'+(m.title||'')+'\" at '+new Date().toLocaleString()); saveState(); toast('Message edited',true); } }; const rem=document.createElement('button'); rem.className='ghost'; rem.textContent='Delete'; rem.onclick=()=>{ if(confirm('Delete message?')){ state.messages=state.messages.filter(x=>x.id!==m.id); state.activity.push('Admin deleted message \"'+(m.title||'')+'\" at '+new Date().toLocaleString()); saveState(); toast('Deleted',true); } }; const addAudioBtn=document.createElement('button'); addAudioBtn.className='ghost'; addAudioBtn.textContent='Add Audio'; addAudioBtn.onclick=()=>{ const ip=document.createElement('input'); ip.type='file'; ip.accept='audio/*'; ip.onchange=(e)=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=(ev)=>{ m.audio=ev.target.result; saveState(); toast('Audio added to message',true); }; r.readAsDataURL(f); }; ip.click(); }; const createRem=document.createElement('button'); createRem.className='ghost'; createRem.textContent='Add Reminder'; createRem.onclick=()=>{ const when=prompt('Reminder date-time (YYYY-MM-DD HH:MM)', ''); if(!when) return; const title = prompt('Reminder title', m.title||'Reminder'); try{ const iso = new Date(when.replace(' ','T')).toISOString(); state.reminders.push({ id: state.nextId++, title: title||'Reminder', when: iso, messageId: m.id, by: currentUser.name }); state.activity.push('Admin added reminder for \"'+(m.title||'untitled')+'\" at '+new Date().toLocaleString()); saveState(); toast('Reminder saved',true); }catch(err){ alert('Invalid date format'); } }; ar.appendChild(ed); ar.appendChild(rem); ar.appendChild(addAudioBtn); ar.appendChild(createRem); el.appendChild(ar); } else { if(currentUser){ const rbtn=document.createElement('button'); rbtn.className='ghost'; rbtn.textContent='Set Reminder'; rbtn.onclick=()=>{ const when=prompt('Reminder date-time (YYYY-MM-DD HH:MM)'); if(!when) return; const title = prompt('Reminder title', m.title||'Reminder'); try{ const iso = new Date(when.replace(' ','T')).toISOString(); state.reminders.push({ id: state.nextId++, title: title||'Reminder', when: iso, messageId: m.id, by: currentUser.name }); state.activity.push(currentUser.name+' set reminder for \"'+(m.title||'untitled')+'\" at '+new Date().toLocaleString()); saveState(); toast('Reminder saved',true); }catch(err){ alert('Invalid date format'); } }; el.appendChild(rbtn); } } return el; }

// audio functions
function audioModeChange(e){ const v=e.target.value; document.getElementById('audioUpload').classList.add('hidden'); document.getElementById('audioLink').classList.add('hidden'); if(v==='upload') document.getElementById('audioUpload').classList.remove('hidden'); if(v==='link') document.getElementById('audioLink').classList.remove('hidden'); if(v==='none'){ state.settings.audioMode='none'; state.settings.audioData=null; configureAudioSource(''); document.getElementById('toggleAudioBtn').style.display='none'; saveState(); } }
function audioUploadChange(e){ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=(ev)=>{ state.settings.audioMode='upload'; state.settings.audioData = ev.target.result; configureAudioSource(ev.target.result); document.getElementById('toggleAudioBtn').style.display='inline-block'; state.activity.push('Admin set background audio (upload) at '+new Date().toLocaleString()); saveState(); attemptPlay(); toast('Background audio set',true); }; r.readAsDataURL(f); }
function audioLinkSet(e){ const v=e.target.value.trim(); if(!v) return; state.settings.audioMode='link'; state.settings.audioData=v; configureAudioSource(v); document.getElementById('toggleAudioBtn').style.display='inline-block'; state.activity.push('Admin set background audio (link) at '+new Date().toLocaleString()); saveState(); attemptPlay(); toast('Audio link set',true); }
function toggleAudio(){ const bg=document.getElementById('bgPlayer'); if(!bg.src){ toast('No background audio'); return; } if(bg.paused){ bg.play().catch(()=>toast('Tap to allow audio')); document.getElementById('toggleAudioBtn').textContent='Pause'; } else { bg.pause(); document.getElementById('toggleAudioBtn').textContent='Play'; } }
function configureAudioSource(src){ const bg=document.getElementById('bgPlayer'); bg.src = src || ''; try{ bg.load(); }catch(e){ console.warn(e); } document.getElementById('toggleAudioBtn').textContent='Play'; document.getElementById('toggleAudioBtn').style.display = src ? 'inline-block' : 'none'; }
function attemptPlay(){ const bg=document.getElementById('bgPlayer'); try{ bg.play(); document.getElementById('toggleAudioBtn').textContent='Pause'; }catch(e){ console.warn('autoplay blocked', e); } }

// import/export/reset
function exportJson(){ const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='gift_for_you_backup.json'; a.click(); }
function importJson(){ const ip=document.createElement('input'); ip.type='file'; ip.accept='application/json'; ip.onchange=(e)=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=(ev)=>{ try{ const obj=JSON.parse(ev.target.result); state=obj; saveState(); toast('Imported data',true); }catch(err){ alert('Invalid JSON'); } }; r.readAsText(f); }; ip.click(); }
function resetAll(){ if(confirm('Reset local data? This will remove local messages (unless exported).')){ localStorage.removeItem(STORAGE_KEY); location.reload(); } }

// observer seen tracking
function startObserver(){ if(observer) observer.disconnect(); observer=new IntersectionObserver(entries=>{ entries.forEach(ent=>{ if(ent.isIntersecting){ const id=Number(ent.target.dataset.id); const m=state.messages.find(x=>x.id===id); if(m && !m.seenAt && currentUser && currentUser.role==='receiver'){ m.seenAt=new Date().toISOString(); state.activity.push('Message \"'+(m.title||'')+'\" seen by '+currentUser.name+' at '+new Date().toLocaleString()); saveState(); } } }); },{threshold:0.6}); document.querySelectorAll('.msg').forEach(n=>observer.observe(n)); }

// scheduled release check
function scheduledReleaseCheck(){ const now=new Date(); let changed=false; state.messages.forEach(m=>{ if(m.released) return; if(!m.scheduled) return; const time=m.scheduledTime||'09:00'; const when=new Date(m.scheduled + 'T' + time); if(when <= now){ m.released=true; m.postedOn=new Date().toISOString(); changed=true; state.activity.push('Message \"'+(m.title||'')+'\" released at '+new Date().toLocaleString()); } }); if(changed) saveState(); }

// reminders checker
function startReminderChecker(){ setInterval(()=>{ const now=new Date(); const due = state.reminders.filter(r=> !r.notified && new Date(r.when) <= now); due.forEach(r=>{ r.notified=true; toast('Reminder: '+r.title); vibrate(); state.activity.push('Reminder fired: '+r.title+' at '+new Date().toLocaleString()); }); saveState(); },10000); }

// init
(function init(){ state.messages.forEach(m=>{ if(!m.scheduled) m.released=true; }); saveState(); renderAll(); startObserver(); })();
setInterval(()=>{ saveState(); },3000);
window.__gift_state = state; window.__saveGift = saveState;
