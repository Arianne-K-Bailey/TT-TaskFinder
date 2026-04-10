import { auth } from "../firebase/firebaseConfig.js";
import { onAuthStateChanged, signOut } 
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

export function loadNavbar() {
  const navTarget = document.getElementById("navbar");
  fetch("/public/components/navbar.html")
    .then(res => res.text())
    .then(html => {
      navTarget.innerHTML = html;

      const navAuth = document.getElementById("navAuth");

      onAuthStateChanged(auth, (user) => {
        if (user) {
          navAuth.innerHTML = `
            <a href="profile.html">👤 ${user.email.split("@")[0]}</a>
            <a href="#" id="logoutBtn" class="action-btn">Logout</a>
          `;

          document.getElementById("logoutBtn").onclick = async () => {
            await signOut(auth);
            location.reload();
          };

        } else {
          navAuth.innerHTML = `
            <a href="Login.html?mode=login" class="login">Login</a>
            <a href="Login.html?mode=signup" class="action-btn">Sign Up</a>
          `;
        }
      });
    });
}