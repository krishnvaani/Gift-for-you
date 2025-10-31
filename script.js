
const STORAGE='gift_v_final';
const LAST='gift_last_user';
let data = JSON.parse(localStorage.getItem(STORAGE)||'null')||{settings:{adminUser:'admin',adminPass:'admin',receiverUser:'receiver',receiverPass:'receiver',title:'Happy Birthday 💖',subtitle:'With love'},messages:[],nextId:1,activity:[],reminders:[]};
let user=null;
const $=(id)=>document.getElementById(id);

function save(){ localStorage.setItem(STORAGE,JSON.stringify(data)); render(); }
function log(s){ data.activity.push(s); save(); }
function checkCred(u,role,p){ if(role==='admin') return u===data.settings.adminUser && p===data.settings.adminPass; return u===data.settings.receiverUser && p===data.settings.receiverPass; }

document.addEventListener('DOMContentLoaded', ()=>{
  // prefill saved username (Option B)
  try{ const last=localStorage.getItem(LAST); if(last) $('loginName').value = last; }catch(e){}
  $('doLogin').onclick = ()=>{
    const u=$('loginName').value.trim(), r=$('loginRole').value, p=$('loginPass').value;
    if(!u){ alert('Enter username'); return; }
    if(!checkCred(u,r,p)){ alert('Wrong creds'); return; }
    user={name:u,role:r}; localStorage.setItem(LAST,u); log(u+' logged in '+r+' @ '+new Date().toLocaleString());
    $('loginModal').classList.add('hidden'); $('app').classList.remove('hidden');
    startObserver(); render();
    if(Notification && Notification.permission!=='granted') Notification.requestPermission();
  };
  $('logoutBtn').onclick = ()=> location.reload();
  $('openRead').onclick = ()=>{ $('readView').classList.remove('hidden'); $('archiveView').classList.add('hidden'); $('adminPanel').classList.add('hidden'); };
  $('openArchive').onclick = ()=>{ $('archiveView').classList.remove('hidden'); $('readView').classList.add('hidden'); $('adminPanel').classList.add('hidden'); };
  $('openAdmin').onclick = ()=>{ $('adminPanel').classList.remove('hidden'); $('readView').classList.add('hidden'); $('archiveView').classList.add('hidden'); };
  $('uploadMsg').onclick = ()=>{ if(!user||user.role!=='admin'){alert('Only admin');return;} const t=$('msgTitle').value||'Untitled', c=$('msgText').value||'', d=$('msgDate').value||null, tm=$('msgTime').value||'09:00'; const msg={id:data.nextId++,title:t,content:c,dateAdded:new Date().toISOString(),scheduled:d,scheduledTime:tm,released: d?false:true,postedOn: d?null:new Date().toISOString(),comments:[],seenAt:null}; data.messages.push(msg); log('Added '+t); save(); alert('Uploaded'); };
  $('saveCreds').onclick = ()=>{ if(!user||user.role!=='admin'){alert('Only admin');return;} const au=$('adminUser').value.trim(), ap=$('adminPass').value, ru=$('receiverUser').value.trim(), rp=$('receiverPass').value; if(au) data.settings.adminUser=au; if(ap) data.settings.adminPass=ap; if(ru) data.settings.receiverUser=ru; if(rp) data.settings.receiverPass=rp; log('Creds updated'); save(); alert('Saved'); };
  $('fab').onclick = ()=> $('helpModal').classList.toggle('hidden');
  $('musicBtn').onclick = ()=>{ let p=$('bgPlayer'); if(!p.src||p.src.indexOf('lofi.mp3')==-1) p.src='lofi.mp3'; if(p.paused) p.play().catch(()=>{}); else p.pause(); };
  $('exportBtn').onclick = ()=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})); a.download='gift_backup.json'; a.click(); };
  $('importBtn').onclick = ()=>{ const i=document.createElement('input'); i.type='file'; i.onchange=e=>{ const r=new FileReader(); r.onload=ev=>{ try{ data=JSON.parse(ev.target.result); save(); alert('Imported'); }catch(err){ alert('Invalid'); } }; r.readAsText(e.target.files[0]); }; i.click(); };
  $('resetBtn').onclick = ()=>{ if(confirm('Reset?')){ localStorage.removeItem(STORAGE); location.reload(); } };
  // periodic checks
  setInterval(checkScheduled,20000);
  setInterval(checkReminders,15000);
  // set header text
  $('siteTitle').textContent = data.settings.title; $('subtitle').textContent = data.settings.subtitle;
  // try autoplay
  try{ $('bgPlayer').src='lofi.mp3'; $('bgPlayer').play().catch(()=>{}); }catch(e){};
  render();
});

function render(){ // today's and archive
  const today=new Date().toISOString().split('T')[0];
  const todayMsg = data.messages.find(m=>m.scheduled===today && m.released) || data.messages.filter(m=>m.released).slice(-1)[0];
  $('readView').innerHTML = todayMsg? renderMsgCard(todayMsg) : '<div class="msg">No message today</div>';
  $('archiveView').innerHTML = data.messages.slice().reverse().map(m=>'<div class="msg" data-id="'+m.id+'">'+renderMsgHTML(m)+renderControls(m)+renderComments(m)+'</div>').join('');
  if($('adminPanel')){ $('adminUser').value = data.settings.adminUser; $('receiverUser').value = data.settings.receiverUser; $('msgList').innerHTML = data.messages.map(m=>m.title).join('<br>'); }
  if($('activity')) $('activity').innerHTML = data.activity.slice().reverse().join('<br>');
  startObserver();
}

function renderMsgCard(m){ return renderMsgHTML(m)+renderControls(m)+renderComments(m); }
function renderMsgHTML(m){ return '<b>'+escape(m.title)+'</b><div>'+escape(m.content)+'</div>' + (m.audio? '<audio controls src="'+m.audio+'"></audio>':''); }
function renderControls(m){ let html = '<div> '; html += '<button data-addcomment="'+m.id+'">Comment</button>'; if(user && user.role==='admin'){ html += ' <button data-editmsg="'+m.id+'">Edit</button> <button data-reminder="'+m.id+'">Add Reminder</button>'; } if(user && user.role!=='admin'){ html += ' <button data-setrem="'+m.id+'">Set Reminder</button>'; } html += '</div>'; html += '<div class="small">'+ (m.seenAt? 'Seen at '+new Date(m.seenAt).toLocaleString() : 'Not seen yet') +'</div>'; return html; }
function renderComments(m){ const cs=(m.comments||[]).map(c=>'<div class="comment"><small>'+escape(c.by)+' • '+new Date(c.when).toLocaleString()+'</small><div>'+escape(c.text)+'</div>' + ((user && user.name===c.by)? '<div><button data-editcomment="'+c.id+'" data-msg="'+m.id+'">Edit</button></div>':'') + ((user && user.role==='admin' && c.history && c.history.length)? '<div class="small">History:<br>'+ c.history.map(h=>'On '+new Date(h.when).toLocaleString()+' → '+escape(h.text)).join('<br>') +'</div>':'') + '</div>').join(''); return '<div>'+cs + (user? '<div><button data-addcomment="'+m.id+'">Add Comment</button></div>':'') +'</div>'; }

function escape(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// Comment handlers (delegated)
document.body.addEventListener('click', (e)=>{
  const t=e.target;
  if(t.dataset.addcomment){ const id=Number(t.dataset.addcomment); if(!user){ alert('Login'); return;} const txt=prompt('Comment'); if(!txt) return; const m=data.messages.find(x=>x.id===id); const c={id:Date.now(),by:user.name,when:new Date().toISOString(),text:txt,history:[]}; m.comments=m.comments||[]; m.comments.push(c); log(user.name+' commented'); save(); }
  if(t.dataset.editcomment){ const id=Number(t.dataset.editcomment), msgId=Number(t.dataset.msg); const m=data.messages.find(x=>x.id===msgId); const c=m.comments.find(x=>x.id===id); if(!c) return; if(!user||user.name!==c.by){ alert('Only author'); return;} const nt=prompt('Edit comment', c.text); if(nt===null) return; c.history=c.history||[]; c.history.push({when:new Date().toISOString(),text:c.text}); c.text=nt; log(c.by+' edited comment'); save(); }
  if(t.dataset.editmsg){ const id=Number(t.dataset.editmsg); const m=data.messages.find(x=>x.id===id); const nt=prompt('Edit message', m.content); if(nt!==null){ m.content=nt; log('Edited msg'); save(); } }
  if(t.dataset.reminder){ const id=Number(t.dataset.reminder); if(!user||user.role!=='admin'){alert('Only admin');return;} const when=prompt('YYYY-MM-DD HH:MM'); if(!when) return; const iso=new Date(when.replace(' ','T')).toISOString(); data.reminders.push({id:'r'+Math.random().toString(36).slice(2),title:(data.messages.find(m=>m.id===id)||{}).title||'Reminder',when:iso,messageId:id,by:user.name,fired:false}); log('Reminder set'); save(); }
  if(t.dataset.setrem){ const id=Number(t.dataset.setrem); if(!user){alert('Login');return;} const when=prompt('YYYY-MM-DD HH:MM'); if(!when) return; const iso=new Date(when.replace(' ','T')).toISOString(); data.reminders.push({id:'r'+Math.random().toString(36).slice(2),title:(data.messages.find(m=>m.id===id)||{}).title||'Reminder',when:iso,messageId:id,by:user.name,fired:false}); log('Reminder set'); save(); }
});

function checkScheduled(){ const now=new Date(); let changed=false; data.messages.forEach(m=>{ if(m.released) return; if(!m.scheduled) return; const when=new Date(m.scheduled+'T'+(m.scheduledTime||'09:00')); if(when<=now){ m.released=true; m.postedOn=new Date().toISOString(); changed=true; log('Released '+m.title); } }); if(changed) save(); }

function checkReminders(){ const now=new Date(); data.reminders.forEach(r=>{ if(!r.fired && new Date(r.when)<=now){ r.fired=true; log('[Reminder] '+r.title+' due '+r.when); if(Notification && Notification.permission==='granted'){ try{ new Notification('Reminder: '+r.title,{body:r.when}); }catch(e){} } save(); } }); }

// Seen tracking via simple loop + visibility
function startObserver(){ // simple fallback: mark visible messages seen when receiver is logged in
  if(!user || user.role!=='receiver') return;
  document.querySelectorAll('.msg').forEach(el=>{ const rect=el.getBoundingClientRect(); if(rect.top>=0 && rect.bottom<=window.innerHeight){ const id=Number(el.dataset.id); const m=data.messages.find(x=>x.id===id); if(m && !m.seenAt){ m.seenAt=new Date().toISOString(); log('Seen '+m.title); save(); } } });
}

// initial render on load already called
