import { auth, db } from "../firebase/firebaseConfig.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export function loadNavbar() {
  const navTarget = document.getElementById("navbar");

  fetch("./components/navbar.html")
    .then(res => res.text())
    .then(html => {
      navTarget.innerHTML = html;

      const navAuth = document.getElementById("navAuth");
      const navAuthMobile = document.getElementById("navAuthMobile");

      let unsubscribeUser = null;

      // Firebase auth listener
      onAuthStateChanged(auth, (user) => {
        const postBtn = document.getElementById("postJobBtn");
        const postBtnMobile = document.getElementById("postJobBtnMobile");

        // User not logged in
        if (!user) {
          const authHtml = `
            <a href="Login.html?mode=login" class="login">Login</a>
            <a href="Login.html?mode=signup" class="action-btn">Sign Up</a>
          `;
          if (navAuth) navAuth.innerHTML = authHtml;
          if (navAuthMobile) navAuthMobile.innerHTML = authHtml;

          // Post Job buttons redirect to login
          if (postBtn) {
            postBtn.onclick = (e) => {
              e.preventDefault();
              window.location.href = "Login.html?redirect=post-job.html";
            };
          }
          if (postBtnMobile) {
            postBtnMobile.onclick = (e) => {
              e.preventDefault();
              window.location.href = "Login.html?redirect=post-job.html";
            };
          }

          if (unsubscribeUser) {
            unsubscribeUser();
            unsubscribeUser = null;
          }

          return;
        }

        // User is logged in
        const userRef = doc(db, "users", user.uid);

        if (unsubscribeUser) unsubscribeUser();

        unsubscribeUser = onSnapshot(userRef, (snap) => {
          if (!snap.exists()) return;
          const data = snap.data();

          const authHtml = `
            <a href="profile.html">👤 ${data.username || user.email.split("@")[0]}</a>
            <a href="#" id="logoutBtn" class="action-btn">Logout</a>
          `;

          if (navAuth) navAuth.innerHTML = authHtml;
          if (navAuthMobile) navAuthMobile.innerHTML = authHtml.replace('logoutBtn', 'logoutBtnMobile');

          // Logout buttons
          const logoutBtn = document.getElementById("logoutBtn");
          if (logoutBtn) {
            logoutBtn.onclick = async () => {
              await signOut(auth);
              location.reload();
            };
          }

          const logoutBtnMobile = document.getElementById("logoutBtnMobile");
          if (logoutBtnMobile) {
            logoutBtnMobile.onclick = async () => {
              await signOut(auth);
              location.reload();
            };
          }
        });

        // Post Job buttons for logged-in users
        if (postBtn) {
          postBtn.onclick = (e) => {
            e.preventDefault();
            window.location.href = "post-job.html";
          };
        }
        if (postBtnMobile) {
          postBtnMobile.onclick = (e) => {
            e.preventDefault();
            window.location.href = "post-job.html";
          };
        }
      });

      // Sidebar toggle functions
      window.openNav = function () {
        const sidebar = document.getElementById("mySidebar");
        if (sidebar) sidebar.style.width = "250px";
      };

      window.closeNav = function () {
        const sidebar = document.getElementById("mySidebar");
        if (sidebar) sidebar.style.width = "0";
      };
    });
}

// import { auth, db } from "../firebase/firebaseConfig.js";

// import { onAuthStateChanged, signOut }
//   from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// import { doc, onSnapshot }
//   from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// export function loadNavbar() {
//   const navTarget = document.getElementById("navbar");

//   fetch("./components/navbar.html")
//     .then(res => res.text())
//     .then(html => {
//       navTarget.innerHTML = html;

//       const navAuth = document.getElementById("navAuth");

//       let unsubscribeUser = null;

//       onAuthStateChanged(auth, (user) => {
//         const postBtn = document.getElementById("postJobBtn");

//         if (!user) {
//           navAuth.innerHTML = `
//             <a href="Login.html?mode=login" class="login">Login</a>
//             <a href="Login.html?mode=signup" class="action-btn">Sign Up</a>
//           `;

//           if (postBtn) {
//             postBtn.onclick = (e) => {
//               e.preventDefault();
//               window.location.href = "Login.html?redirect=post-job.html";
//             };
//           }

//           // cleanup listener if user logs out
//           if (unsubscribeUser) {
//             unsubscribeUser();
//             unsubscribeUser = null;
//           }

//           return;
//         }

//         const userRef = doc(db, "users", user.uid);

//         // prevent duplicate listeners
//         if (unsubscribeUser) {
//           unsubscribeUser();
//         }

//         unsubscribeUser = onSnapshot(userRef, (snap) => {
//           if (!snap.exists()) return;

//           const data = snap.data();

//           navAuth.innerHTML = `
//             <a href="profile.html">👤 ${data.username || user.email.split("@")[0]}</a>
//             <a href="#" id="logoutBtn" class="action-btn">Logout</a>
//           `;

//           const logoutBtn = document.getElementById("logoutBtn");

//           if (logoutBtn) {
//             logoutBtn.onclick = async () => {
//               await signOut(auth);
//               location.reload();
//             };
//           }
//         });

//         if (postBtn) {
//           postBtn.onclick = (e) => {
//             e.preventDefault();
//             window.location.href = "post-job.html";
//           };
//         }
//       });
//     });
// }