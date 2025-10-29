document.addEventListener("DOMContentLoaded", () => {
  const loginButton = document.getElementById("loginButton");
  const musicButton = document.getElementById("musicToggle");
  const audio = document.getElementById("backgroundAudio");
  const loginScreen = document.getElementById("loginScreen");
  const mainApp = document.getElementById("mainApp");

  let isAdmin = false;

  loginButton.addEventListener("click", () => {
    const username = document.getElementById("username").value.trim().toLowerCase();
    const password = document.getElementById("password").value.trim().toLowerCase();

    if ((username === "admin" && password === "admin") || (username === "receiver" && password === "receiver")) {
      isAdmin = username === "admin";
      loginScreen.style.display = "none";
      mainApp.style.display = "block";

      document.getElementById("adminTools").style.display = isAdmin ? "block" : "none";
      document.getElementById("receiverTools").style.display = isAdmin ? "none" : "block";

      audio.volume = 0.5;
      audio.play().catch(() => console.log("Autoplay blocked"));
    } else {
      alert("❌ Wrong credentials. Try again!");
    }
  });

  // Music toggle button
  musicButton.addEventListener("click", () => {
    if (audio.paused) audio.play();
    else audio.pause();
  });
});
