const loginBtn = document.getElementById("loginBtn");
const userField = document.getElementById("username");
const passField = document.getElementById("password");
const loginError = document.getElementById("loginError");
const togglePass = document.getElementById("togglePassword");

const pages = {
  login: document.getElementById("loginPage"),
  gift: document.getElementById("giftPage"),
  message: document.getElementById("messagePage"),
};

const greet = document.getElementById("greet");
const messageBox = document.getElementById("messageText");

const giftBox = document.getElementById("giftBox");
const bgMusic = document.getElementById("bgMusic");

const CORRECT_PASSWORD = "iloveyou";

function showPage(pageName) {
  Object.values(pages).forEach(p => p.classList.remove("active"));
  pages[pageName].classList.add("active");
}

togglePass.onclick = () => {
  passField.type = passField.type === "password" ? "text" : "password";
};

loginBtn.onclick = () => {
  if (!userField.value.trim() || !passField.value.trim()) {
    loginError.textContent = "Enter all fields ❤";
    return;
  }
  
  if (passField.value !== CORRECT_PASSWORD) {
    loginError.textContent = "Wrong secret code 💔";
    return;
  }

  greet.textContent = Hi ${userField.value} 💖;
  showPage("gift");
};

giftBox.onclick = () => {
  bgMusic.play();
  showPage("message");
  typeMessage();
  spawnHearts();
};

const msg = "You're one of the most special people in my life 💕 I made this just for you ✨ You deserve all the happiness in the world.";

let idx = 0;
function typeMessage() {
  messageBox.textContent = "";
  idx = 0;
  const interval = setInterval(() => {
    if (idx < msg.length) {
      messageBox.textContent += msg[idx++];
    } else clearInterval(interval);
  }, 40);
}

function spawnHearts() {
  setInterval(() => {
    const h = document.createElement("div");
    h.className = "hearts";
    h.style.left = Math.random() * 100 + "vw";
    document.body.appendChild(h);

    setTimeout(() => h.remove(), 4000);
  }, 400);
}
