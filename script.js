let isAdmin = false;

document.addEventListener("DOMContentLoaded", () => {
  const loginButton = document.getElementById("loginButton");

  if (loginButton) {
    loginButton.addEventListener("click", function () {
      const username = document.getElementById("username").value.trim().toLowerCase();
      const password = document.getElementById("password").value.trim().toLowerCase();

      if (
        (username === "admin" && password === "admin") ||
        (username === "receiver" && password === "receiver")
      ) {
        // Hide login screen
        const loginScreen = document.getElementById("loginScreen");
        const mainApp = document.getElementById("mainApp");

        if (loginScreen && mainApp) {
          loginScreen.style.display = "none";
          mainApp.style.display = "block";
        }

        // Track who logged in
        isAdmin = username === "admin";

        initializeApp(isAdmin); // Initialize page content
      } else {
        alert("Incorrect username or password. Please try again!");
      }
    });
  }
});

// Called once user successfully logs in
function initializeApp(isAdminUser) {
  console.log("App initialized as:", isAdminUser ? "Admin" : "Receiver");

  // Example: show admin tools if admin
  const adminTools = document.getElementById("adminTools");
  if (adminTools) {
    adminTools.style.display = isAdminUser ? "block" : "none";
  }

  // Example: show receiver tools if receiver
  const receiverTools = document.getElementById("receiverTools");
  if (receiverTools) {
    receiverTools.style.display = isAdminUser ? "none" : "block";
  }

  // Auto-play background lofi (if enabled)
  const audio = document.getElementById("backgroundAudio");
  if (audio) {
    audio.loop = true;
    audio.volume = 0.5;
    audio.play().catch(() => {
      console.log("Audio autoplay blocked; user must interact first.");
    });
  }
}
