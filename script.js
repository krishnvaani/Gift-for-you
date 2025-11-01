// script.js - robust wiring and fixes
document.addEventListener('DOMContentLoaded', () => {
  // elements
  const loginBtn = document.getElementById('loginBtn');
  const userField = document.getElementById('username');
  const passField = document.getElementById('password');
  const loginError = document.getElementById('loginError');
  const togglePass = document.getElementById('togglePassword');

  const pages = {
    login: document.getElementById('loginPage'),
    gift: document.getElementById('giftPage'),
    message: document.getElementById('messagePage')
  };

  const greet = document.getElementById('greet');
  const messageBox = document.getElementById('messageText');

  const giftBox = document.getElementById('giftBox');
  const bgMusic = document.getElementById('bgMusic');

  const backBtn = document.getElementById('backBtn');
  const replayBtn = document.getElementById('replayBtn');

  // config
  const CORRECT_PASSWORD = 'iloveyou'; // change if you want
  const MESSAGE = "You're one of the most special people in my life 💕\nI made this just for you ✨\nYou deserve all the happiness in the world.";

  // state
  let heartSpawner = null;
  let typingInterval = null;

  // helpers
  function showPage(name) {
    Object.keys(pages).forEach(k => pages[k].classList.remove('active'));
    if (pages[name]) pages[name].classList.add('active');
  }

  function safePlayAudio() {
    if (!bgMusic) return;
    // set src if missing (defensive)
    if (!bgMusic.src) {
      const src = 'assets/lofi.mp3';
      bgMusic.src = src;
    }
    bgMusic.play().catch(err => {
      // autoplay might be blocked — that's ok, user can press play
      console.warn('Audio play blocked:', err);
    });
  }

  function stopHearts() {
    if (heartSpawner) {
      clearInterval(heartSpawner);
      heartSpawner = null;
    }
  }

  function startHearts() {
    stopHearts();
    heartSpawner = setInterval(() => {
      const h = document.createElement('div');
      h.className = 'hearts';
      h.style.left = Math.min(Math.max(4, Math.random() * 96), 96) + 'vw';
      document.body.appendChild(h);
      // remove after its animation duration
      setTimeout(() => {
        try { h.remove(); } catch (e) {}
      }, 4200);
    }, 380);
  }

  function typeMessage(text, speed = 36) {
    if (typingInterval) clearInterval(typingInterval);
    messageBox.textContent = '';
    let i = 0;
    typingInterval = setInterval(() => {
      if (i < text.length) {
        messageBox.textContent += text[i++];
      } else {
        clearInterval(typingInterval);
        typingInterval = null;
      }
    }, speed);
  }

  // events
  togglePass.addEventListener('click', () => {
    passField.type = passField.type === 'password' ? 'text' : 'password';
  });

  // allow Enter to trigger login (on username and password)
  [userField, passField].forEach(el => {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        loginBtn.click();
      }
    });
  });

  loginBtn.addEventListener('click', () => {
    loginError.textContent = '';
    const name = userField.value.trim();
    const pw = passField.value.trim();
    if (!name || !pw) {
      loginError.textContent = 'Please enter name and secret code ❤';
      return;
    }
    if (pw !== CORRECT_PASSWORD) {
      loginError.textContent = 'Secret code is incorrect 💔';
      return;
    }

    // success
    greet.textContent = Hi ${name} 💖;
    showPage('gift');
    // reset fields for next time
    userField.value = '';
    passField.value = '';
  });

  // keyboard accessibility for gift box
  giftBox.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      giftBox.click();
    }
  });

  giftBox.addEventListener('click', () => {
    // play music (best-effort)
    safePlayAudio();

    // show the message page and start effects
    showPage('message');
    typeMessage(MESSAGE);

    // start hearts
    startHearts();
  });

  backBtn.addEventListener('click', () => {
    showPage('gift');
    stopHearts();
    if (typingInterval) {
      clearInterval(typingInterval);
      typingInterval = null;
    }
  });

  replayBtn.addEventListener('click', () => {
    // replay the typing and hearts
    if (typingInterval) clearInterval(typingInterval);
    typeMessage(MESSAGE);
    startHearts();
  });

  // defensive: pause audio when user leaves page (visibility API)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // optional: pause to save battery
      try { bgMusic.pause(); } catch(e){}
    }
  });

  // initial setup: ensure audio element exists and is preloaded
  try {
    if (bgMusic && bgMusic.readyState < 2) {
      bgMusic.load();
    }
  } catch (e) {
    console.warn('Audio init error', e);
  }

  // expose debug on window for dev (safe)
  window._giftApp = { startHearts, stopHearts, typeMessage, showPage };
});
