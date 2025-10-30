// creds
let adminUser="admin", adminPass="admin123";
let recvUser="receiver", recvPass="receiver123";

// state
let messages = JSON.parse(localStorage.getItem("msgs")||"[]");
let reminders = JSON.parse(localStorage.getItem("rems")||"[]");
let pwd = localStorage.getItem("pwd_receiver")||recvPass;
let currentUser=null;

// dom
const loginModal=document.getElementById("loginModal");
const app=document.getElementById("app");
const loginBtn=document.getElementById("loginBtn");
const loginUser=document.getElementById("loginUser");
const loginPass=document.getElementById("loginPass");
const loginErr=document.getElementById("loginErr");
const logoutBtn=document.getElementById("logoutBtn");
const heart=document.getElementById("heartImg");
const subtitle=document.getElementById("subtitle");
const addMsgBtn=document.getElementById("addMsgBtn");
const msgForm=document.getElementById("msgForm");
const saveMsg=document.getElementById("saveMsg");
const msgTitle=document.getElementById("msgTitle");
const msgText=document.getElementById("msgText");
const messagesDiv=document.getElementById("messages");
const remText=document.getElementById("remText");
const addRem=document.getElementById("addRem");
const remList=document.getElementById("remList");
const bg=document.getElementById("bgAudio");

// login
loginBtn.onclick=()=>{
 let u=loginUser.value, p=loginPass.value;
 if(u===adminUser && p===adminPass){ currentUser="admin"; openApp(); }
 else if(u===recvUser && p===pwd){ currentUser="receiver"; openApp(); }
 else loginErr.textContent="Wrong credentials";
};
function openApp(){
 loginModal.style.display="none";
 app.style.display="block";
 render();
}

// logout
logoutBtn.onclick=()=>location.reload();

// msg add
addMsgBtn.onclick=()=>msgForm.classList.toggle("hidden");
saveMsg.onclick=()=>{
 if(!msgText.value.trim())return;
 messages.push({
  t:msgTitle.value, x:msgText.value, by:"admin",
  seen:false, comments:[]
 });
 localStorage.setItem("msgs",JSON.stringify(messages));
 msgTitle.value=""; msgText.value="";
 msgForm.classList.add("hidden");
 render();
};

// upload heart
heart.onclick=()=>{
 if(currentUser!=="admin")return;
 let ip=document.createElement("input");
 ip.type="file"; ip.accept="image/*";
 ip.onchange=e=>{
  let r=new FileReader();
  r.onload=v=>heart.src=v.target.result;
  r.readAsDataURL(e.target.files[0]);
 };
 ip.click();
};

// reminders
addRem.onclick=()=>{
 if(!remText.value.trim())return;
 reminders.push({t:remText.value});
 localStorage.setItem("rems",JSON.stringify(reminders));
 remText.value="";
 render();
};

// music
document.getElementById("musicBtn").onclick=()=>document.getElementById("audioInput").click();
document.getElementById("audioInput").onchange=e=>{
 bg.src=URL.createObjectURL(e.target.files[0]);
 bg.play();
};
document.addEventListener("click",()=>bg.play().catch(()=>{}),{once:true});

// password change
document.getElementById("changePassBtn").onclick=()=>{
 if(currentUser!=="receiver")return alert("Receiver only");
 let np=prompt("New password:");
 if(np){
  pwd=np;
  localStorage.setItem("pwd_receiver",np);
  alert("Password updated");
 }
};

// comments & seen
function comment(idx){
 let txt=prompt("Write comment:");
 if(!txt)return;
 messages[idx].comments.push(txt);
 localStorage.setItem("msgs",JSON.stringify(messages));
 render();
}
function markSeen(idx){
 if(currentUser==="receiver" && !messages[idx].seen){
  messages[idx].seen=new Date().toLocaleString();
  localStorage.setItem("msgs",JSON.stringify(messages));
 }
}

// render
function render(){
 // adminOnly buttons
 document.querySelectorAll(".adminOnly").forEach(e=>{
  e.style.display = currentUser==="admin"?"inline-block":"none";
 });

 messagesDiv.innerHTML="";
 messages.forEach((m,i)=>{
  let d=document.createElement("div"); d.className="message";
  d.innerHTML=`<b>${m.t||""}</b><br>${m.x}<br>
  ${currentUser==="admin" ? `<small>Seen: ${m.seen||"No"}</small><br>`:""}
  <button onclick="comment(${i})">Comment</button>
  <div class="commentBox">${m.comments.map(c=>"<div>"+c+"</div>").join("")}</div>`;
  messagesDiv.append(d);
  markSeen(i);
 });

 remList.innerHTML=reminders.map(r=>"<div>"+r.t+"</div>").join("");
}
render();
