let state=JSON.parse(localStorage.getItem('gift')||'{"msgs":[]}');
let user=null;
const save=()=>localStorage.setItem('gift',JSON.stringify(state));
const login=()=>{
 if(name.value=='admin'&&pass.value=='admin'){user='admin';}
 else if(name.value=='receiver'&&pass.value=='receiver'){user='receiver';}
 else{err.textContent='Wrong';return;}
 loginModal.classList.add('hidden');app.classList.remove('hidden');render();
};
const render=()=>{
 msgs.innerHTML='';
 state.msgs.forEach(m=>{
  let d=document.createElement('div');d.className='msg';
  d.innerHTML=`<b>${m.text}</b><br><small>${m.time}</small>`;
  msgs.append(d);
 });
};
loginBtn.onclick=()=>login();
logoutBtn.onclick=()=>{localStorage.clear();location.reload();};
fab.onclick=()=>menu.classList.toggle('hidden');
addMsg.onclick=()=>{
 if(user!=='admin')return alert('Admin only');
 let t=prompt('Write message');if(!t)return;
 state.msgs.push({text:t,time:new Date().toLocaleString()});save();render();
};
addRem.onclick=()=>alert('Reminder coming');
addHelp.onclick=()=>alert('+ = menu, 🎵 = music');
heartImg.onclick=()=>{
 if(user!=='admin')return;
 let ip=document.createElement('input');ip.type='file';ip.onchange=e=>{
  let r=new FileReader();r.onload=x=>{heartImg.src=x.target.result};r.readAsDataURL(e.target.files[0]);
 };ip.click();
};
musicBtn.onclick=()=>bgAudio.paused?bgAudio.play():bgAudio.pause();
nameInput=nameInput;passInput=passInput;loginBtn=loginBtn;err=loginError;msgs=messages;
loginModal=loginModal;app=app;fab=fab;menu=menu;
