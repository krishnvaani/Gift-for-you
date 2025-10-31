// script.js - corrected login binding + credential-change UI
const STORAGE_KEY = 'gift_for_you_final_v3';

// load or init state
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

  // account inputs in admin
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

  // LOGIN handlers - bound now reliably
  doLogin.addEventListener('click', handleLogin);
  loginPass.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') handleLogin(); });
  loginName.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') handleLogin(); });

  function handleLogin(){
    const u = (loginName.value||'').trim();
    const p = (loginPass.value||'').trim();
    if(!u){ loginError.textContent = 'Enter username'; return; }
    if(u === state.settings.credentials.adminUser && p === state.settings.credentials.adminPass){
      currentUser = { name:u, role:'admin' };
    } else if(u === state.settings.credentials.receiverUser && p === state.settings.credentials.receiverPass){
      currentUser = { name:u, role:'receiver' };
    } else {
      loginError.textContent = 'Wrong credentials';
      return;
    }
    loginError.textContent = '';
    openApp();
    state.activity.push(${currentUser.name} logged in as ${currentUser.role} at ${new Date().toLocaleString()});
    save();
  }

  closeLogin.addEventListener('click', ()=>{ loginModal.classList.add('hidden-opacity'); lockBody(false); setTimeout(()=>loginModal.style.display='none',260); });

  function openApp(){
    loginModal.classList.add('hidden-opacity');
    lockBody(false);
    setTimeout(()=>{ loginModal.style.display='none'; },260);
    app.classList.remove('hidden-opacity'); app.classList.add('visible-opacity');
    userLabel.textContent = ${currentUser.name} (${currentUser.role});
    if(currentUser.role === 'admin') tabAdmin.classList.remove('hidden');
    toggleAudioBtn.classList.remove('hidden');
    renderAll();
    setTimeout(()=>{ if(state.settings.audioData){ bgPlayer.src = state.settings.audioData; bgPlayer.play().catch(()=>{}); toggleAudioBtn.textContent='Pause'; } },150);
  }

  logoutBtn.addEventListener('click', ()=>{ currentUser = null; location.reload(); });

  // credential save (admin only)
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
    // clear inputs
    adminPassInput.value=''; recPassInput.value='';
    // update label if admin changed own username
    userLabel.textContent = ${currentUser.name} (${currentUser.role});
  });

  // The rest of the app code (music, messages, comments, admin actions, scheduling, reminders, etc.)
  // For brevity we re-use the same logic as before — but ensure render & bindings are stable.

  // --- (the remaining implementation mirrors the previous script's functions) ---
  // To avoid repeating the entire large script inline here, we'll restore the rest of the logic
  // exactly as before but with the corrected login & credentials UI.
  // (In your local copy the rest of the script should be present unchanged.)

  // Minimal placeholders to ensure no runtime errors while you swap in the full script:
  // If you pasted the previous full script, keep everything below this comment removed/merged.
  function renderAll(){
    // very small safe renderer if full script not present
    document.getElementById('todayContent').innerHTML = '<div class="muted-note">If messages exist they will show here.</div>';
    document.getElementById('archiveContent').innerHTML = '<div class="muted-note">Archive will show messages.</div>';
  }

  // show login modal centered and lock scroll on start
  loginModal.style.display = 'flex';
  lockBody(true);

  // If admin fields exist prefill with current credentials for convenience (but hidden from login)
  adminUserInput.value = state.settings.credentials.adminUser || '';
  recUserInput.value = state.settings.credentials.receiverUser || '';

  // If you already had the rest of the app code, now call its init functions:
  // renderAll(); (we used small placeholder above)
});
