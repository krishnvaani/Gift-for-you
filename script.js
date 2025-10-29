document.addEventListener("DOMContentLoaded", function() {
  const loginButton = document.getElementById("loginButton");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginScreen = document.getElementById("loginScreen");
  const mainApp = document.getElementById("mainApp");
  const adminTools = document.getElementById("adminTools");
  const receiverTools = document.getElementById("receiverTools");
  const musicToggle = document.getElementById("musicToggle");
  const backgroundAudio = document.getElementById("backgroundAudio");

  let isAdmin = false;

  loginButton.addEventListener("click", function() {
    const username = usernameInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim().toLowerCase();

    if (
      (username === "admin" && password === "admin") ||
      (username === "receiver" && password === "receiver")
    ) {
      isAdmin = username === "admin";
      loginScreen.style.display = "none";
      mainApp.style.display = "block";
      adminTools.style.display = isAdmin ? "block" : "none";
      receiverTools.style.display = isAdmin ? "none" : "block";

      backgroundAudio.volume = 0.5;
      backgroundAudio.play().catch(err => console.log("Autoplay blocked", err));
    } else {
      alert("❌ Incorrect username or password.");
    }
  });

  // toggle music
  musicToggle.addEventListener("click", () => {
    if (backgroundAudio.paused) {
      backgroundAudio.play();
    } else {
      backgroundAudio.pause();
    }
  });
});
