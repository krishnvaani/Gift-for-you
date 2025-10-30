const loginModal=document.getElementById("loginModal");
const app=document.getElementById("app");
const loginBtn=document.getElementById("loginBtn");
const logoutBtn=document.getElementById("logoutBtn");
const nameIn=document.getElementById("nameInput");
const passIn=document.getElementById("passInput");
const loginErr=document.getElementById("loginError");

loginBtn.onclick=()=>{
  if(nameIn.value==="receiver" && passIn.value==="receiver"){
    loginModal.className="hidden-opacity";
    app.className="visible-opacity";
    localStorage.setItem("logged","1");
  } else loginErr.innerText="Wrong credentials";
};
logoutBtn.onclick=()=>{localStorage.removeItem("logged");location.reload();};
if(localStorage.getItem("logged")){loginModal.className="hidden-opacity";app.className="visible-opacity";}

// audio
const audio=document.getElementById("bgAudio");
const musicBtn=document.getElementById("musicBtn");
let firstTouch=false;
document.addEventListener("click",()=>{
  if(!firstTouch){audio.play().catch(()=>{});firstTouch=true;}
});
musicBtn.onclick=()=> audio.paused?audio.play():audio.pause();
document.getElementById("audioUpload").onchange=e=>{
  audio.src=URL.createObjectURL(e.target.files[0]);
  audio.play();
};

// diary
const diaryInput=document.getElementById("diaryInput");
const diaryList=document.getElementById("diaryList");
const saveDiary=document.getElementById("saveDiary");
function renderDiary(){
  diaryList.innerHTML="";
  (JSON.parse(localStorage.getItem("diary")||"[]")).forEach(t=>{
    let d=document.createElement("div");d.textContent=t;diaryList.append(d);
  });
}
saveDiary.onclick=()=>{
  let a=JSON.parse(localStorage.getItem("diary")||"[]");
  if(diaryInput.value.trim()){a.push(diaryInput.value.trim());localStorage.setItem("diary",JSON.stringify(a));diaryInput.value="";renderDiary();}
};
renderDiary();

// comments
const commentInput=document.getElementById("commentInput");
const commentList=document.getElementById("commentList");
const addComment=document.getElementById("addComment");
function renderComments(){
  commentList.innerHTML="";
  (JSON.parse(localStorage.getItem("comments")||"[]")).forEach(t=>{
    let d=document.createElement("div");d.textContent=t;commentList.append(d);
  });
}
addComment.onclick=()=>{
  let a=JSON.parse(localStorage.getItem("comments")||"[]");
  if(commentInput.value.trim()){a.push(commentInput.value.trim());localStorage.setItem("comments",JSON.stringify(a));commentInput.value="";renderComments();}
};
renderComments();

// reminders
const reminderInput=document.getElementById("reminderInput");
const reminderList=document.getElementById("reminderList");
const addReminder=document.getElementById("addReminder");
function renderRem(){
  reminderList.innerHTML="";
  (JSON.parse(localStorage.getItem("rem")||"[]")).forEach(t=>{
    let d=document.createElement("div");d.textContent=t;reminderList.append(d);
  });
}
addReminder.onclick=()=>{
  let a=JSON.parse(localStorage.getItem("rem")||"[]");
  if(reminderInput.value.trim()){a.push(reminderInput.value.trim());localStorage.setItem("rem",JSON.stringify(a));reminderInput.value="";renderRem();}
};
renderRem();
