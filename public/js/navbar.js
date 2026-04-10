// import { auth } from "../firebase/firebaseConfig.js";
// import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// export function loadNavbar() {
//   const navTarget = document.getElementById("navbar");

//   fetch("./components/navbar.html")
//     .then(res => res.text())
//     .then(html => {
//       navTarget.innerHTML = html;
      
//       // Dispatch a custom event to signal the Navbar is ready
//       window.dispatchEvent(new Event('navbarLoaded'));
//     });
// }

// // Separate the listener entirely
// window.addEventListener('navbarLoaded', () => {
//   const navAuth = document.getElementById("navAuth");
  
//   onAuthStateChanged(auth, (user) => {
//     if (user) {
//       navAuth.innerHTML = `
//         <a href="profile.html" class="login">👤 ${user.email.split("@")[0]}</a>
//         <a href="#" id="logoutBtn" class="signup">Logout</a>
//       `;
      
//       document.getElementById("logoutBtn").onclick = async (e) => {
//         e.preventDefault();
//         await signOut(auth);
//         location.reload();
//       };
//     } else {
//       navAuth.innerHTML = `
//         <a href="Login.html?mode=login" class="login">Login</a>
//         <a href="Login.html?mode=signup" class="signup">Sign Up</a>
//       `;
//     }
//   });
// });

// import { auth, db } from "../firebase/firebaseConfig.js";
// import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
// // Added these missing imports for the username lookup
// import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// export function loadNavbar() {
//   const navTarget = document.getElementById("navbar");

//   // Changed path to absolute (starting with /) to ensure it works on all pages
//   fetch("/components/navbar.html")
//     .then(res => {
//       if (!res.ok) throw new Error("Navbar not found");
//       return res.text();
//     })
//     .then(html => {
//       navTarget.innerHTML = html;

//       // We wait for the DOM to catch up
//       const checkExist = setInterval(() => {
//         const navAuth = document.getElementById("navAuth");

//         if (navAuth) {
//           clearInterval(checkExist);
//           initializeAuthListener(navAuth);
//         }
//       }, 50); 
//     })
//     .catch(err => console.error("Navbar fetch failed:", err));
// }

// async function initializeAuthListener(navAuth) {
//   onAuthStateChanged(auth, async (user) => {
//     if (user) {
//       let username = user.email.split("@")[0];

//       // Try to get the username from Firestore for the profile link
//       try {
//         const userRef = doc(db, "users", user.uid);
//         const snap = await getDoc(userRef);
//         if (snap.exists()) {
//           username = snap.data().username || username;
//         }
//       } catch (e) {
//         console.error("User data fetch failed", e);
//       }

//       navAuth.innerHTML = `
//         <a href="profile.html" class="login">👤 ${username}</a>
//         <a href="#" id="logoutBtn" class="signup">Logout</a>
//       `;

//       document.getElementById("logoutBtn").onclick = async (e) => {
//         e.preventDefault();
//         await signOut(auth);
//         location.reload();
//       };
//     } else {
//       navAuth.innerHTML = `
//         <a href="Login.html?mode=login" class="login">Login</a>
//         <a href="Login.html?mode=signup" class="signup">Sign Up</a>
//       `;
//     }
//   });
// }

// function initializeAuthListener(navAuth) {
//   onAuthStateChanged(auth, (user) => {
//     if (user) {
//       // User is signed in (e.g. Bob)
//       navAuth.innerHTML = `
//         <a href="profile.html" class="login">👤 ${user.email.split("@")[0]}</a>
//         <a href="#" id="logoutBtn" class="signup">Logout</a>
//       `;

//       // Assign the logout function
//       const logoutBtn = document.getElementById("logoutBtn");
//       if (logoutBtn) {
//         logoutBtn.onclick = async (e) => {
//           e.preventDefault();
//           await signOut(auth);
//           location.reload();
//         };
//       }
//     } else {
//       // User is signed out
//       navAuth.innerHTML = `
//         <a href="Login.html?mode=login" class="login">Login</a>
//         <a href="Login.html?mode=signup" class="signup">Sign Up</a>
//       `;
//     }
//   });
// }

// import { auth } from "../firebase/firebaseConfig.js";
// import { onAuthStateChanged, signOut } 
// from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// export function loadNavbar() {
//   const navTarget = document.getElementById("navbar");

//   fetch("./components/navbar.html")
//   .then(res => res.text())
//   .then(html => {
//     navTarget.innerHTML = html;

//     // Now query inside the navbar itself
//     const navAuth = navTarget.querySelector("#navAuth");
//     if (!navAuth) {
//       console.error("navAuth element not found in navbar.html!");
//       return;
//     }

//     onAuthStateChanged(auth, (user) => {
//       if (user) {
//         navAuth.innerHTML = `
//           <a href="profile.html" class="login">👤 ${user.email.split("@")[0]}</a>
//           <a href="#" id="logoutBtn" class="signup">Logout</a>
//         `;

//         navAuth.querySelector("#logoutBtn").onclick = async () => {
//           await signOut(auth);
//           location.reload();
//         };
//       } else {
//         navAuth.innerHTML = `
//           <a href="Login.html?mode=login" class="login">Login</a>
//           <a href="Login.html?mode=signup" class="signup">Sign Up</a>
//         `;
//       }
//     });
//   })
//   .catch(err => console.error("Failed to load navbar:", err));
// }


// export function loadNavbar() {
//   const navTarget = document.getElementById("navbar");

//   fetch("/public/components/navbar.html") // adjust if needed
//     .then(res => res.text())
//     .then(html => {
//       navTarget.innerHTML = html;

//       const navAuth = document.getElementById("navAuth");

//       if (!navAuth) {
//         console.error("navAuth not found — check navbar.html");
//         return;
//       }

//       onAuthStateChanged(auth, (user) => {
//         if (user) {
//           navAuth.innerHTML = `
//             <a href="profile.html" class="login">👤 ${user.email.split("@")[0]}</a>
//             <a href="#" id="logoutBtn" class="signup">Logout</a>
//           `;

//           document.getElementById("logoutBtn").onclick = async () => {
//             await signOut(auth);
//             location.reload();
//           };

//         } else {
//           navAuth.innerHTML = `
//             <a href="Login.html?mode=login" class="login">Login</a>
//             <a href="Login.html?mode=signup" class="signup">Sign Up</a>
//           `;
//         }
//       });
//     })
//     .catch(err => console.error("Navbar load failed:", err));
// }


import { auth } from "../firebase/firebaseConfig.js";
import { onAuthStateChanged, signOut } 
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// const navTarget = document.getElementById("navbar");

export function loadNavbar() {
  const navTarget = document.getElementById("navbar");
  fetch("./components/navbar.html")
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