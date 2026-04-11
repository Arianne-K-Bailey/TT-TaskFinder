import { auth, db } from "../firebase/firebaseConfig.js";

import { onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { doc, onSnapshot }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export function loadNavbar() {
  const navTarget = document.getElementById("navbar");

  fetch("/public/components/navbar.html")
    .then(res => res.text())
    .then(html => {
      navTarget.innerHTML = html;

      const navAuth = document.getElementById("navAuth");

      let unsubscribeUser = null;

      onAuthStateChanged(auth, (user) => {
        const postBtn = document.getElementById("postJobBtn");

        if (!user) {
          navAuth.innerHTML = `
            <a href="Login.html?mode=login" class="login">Login</a>
            <a href="Login.html?mode=signup" class="action-btn">Sign Up</a>
          `;

          if (postBtn) {
            postBtn.onclick = (e) => {
              e.preventDefault();
              window.location.href = "Login.html?redirect=post-job.html";
            };
          }

          // cleanup listener if user logs out
          if (unsubscribeUser) {
            unsubscribeUser();
            unsubscribeUser = null;
          }

          return;
        }

        const userRef = doc(db, "users", user.uid);

        // prevent duplicate listeners
        if (unsubscribeUser) {
          unsubscribeUser();
        }

        unsubscribeUser = onSnapshot(userRef, (snap) => {
          if (!snap.exists()) return;

          const data = snap.data();

          navAuth.innerHTML = `
            <a href="profile.html">👤 ${data.username || user.email.split("@")[0]}</a>
            <a href="#" id="logoutBtn" class="action-btn">Logout</a>
          `;

          const logoutBtn = document.getElementById("logoutBtn");

          if (logoutBtn) {
            logoutBtn.onclick = async () => {
              await signOut(auth);
              location.reload();
            };
          }
        });

        if (postBtn) {
          postBtn.onclick = (e) => {
            e.preventDefault();
            window.location.href = "post-job.html";
          };
        }
      });
    });
}