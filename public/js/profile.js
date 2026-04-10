import { auth, db } from "../firebase/firebaseConfig.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// ======================
// LOAD PROFILE
// ======================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "Login.html";
    return;
  }

  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.error("User document missing");
      return;
    }

    const data = userSnap.data();

    document.getElementById("username").textContent = data.username || "No Username";
    document.getElementById("email").textContent = data.email || "No Email";
    document.getElementById("phone").textContent =
      data.phone ? `📞 ${data.phone}` : "📞 Not provided";

    await loadTaskeeJobs(user.uid);
    await loadTaskerJobs(user.uid);

  } catch (err) {
    console.error("Profile load failed:", err);
  }
});


// ======================
// TASKEE JOBS
// ======================
async function loadTaskeeJobs(uid) {
  const q = query(
    collection(db, "jobs"),
    where("acceptedBy", "==", uid)
  );

  const snap = await getDocs(q);

  const container = document.getElementById("taskeeJobs");
  container.innerHTML = "";

  if (snap.empty) {
    container.innerHTML = "<p>No accepted jobs yet.</p>";
    return;
  }

  let html = "";

  snap.forEach((doc) => {
    const job = doc.data();

    html += `
      <div class="item">
        <strong>${job.title}</strong>
        <span class="badge yellow">${job.status}</span>
        <p>${job.location} • TTD $${job.pay}</p>
      </div>
    `;
  });

  container.innerHTML = html;

  // snap.forEach(doc => {
  //   const job = doc.data();

  //   container.innerHTML += `
  //     <div class="item">
  //       <strong>${job.title}</strong>
  //       <span class="badge yellow">${job.status}</span>
  //       <p>${job.location} • TTD $${job.pay}</p>
  //     </div>
  //   `;
  // });
}


// ======================
// TASKER JOBS
// ======================
async function loadTaskerJobs(uid) {
  const q = query(
    collection(db, "jobs"),
    where("postedBy", "==", uid)
  );

  const snap = await getDocs(q);

  const container = document.getElementById("taskerJobs");
  container.innerHTML = "";

  if (snap.empty) {
    container.innerHTML = "<p>No posted jobs yet.</p>";
    return;
  }

  snap.forEach(doc => {
    const job = doc.data();

    container.innerHTML += `
      <div class="item">
        <strong>${job.title}</strong>
        <span class="badge blue">${job.status}</span>
        <p>${job.location} • TTD $${job.pay}</p>
      </div>
    `;
  });
}


// ======================
// TOGGLE UI
// ======================
window.setMode = function(mode) {
  document.getElementById("workerView").style.display =
    mode === "worker" ? "block" : "none";

  document.getElementById("clientView").style.display =
    mode === "client" ? "block" : "none";

  document.getElementById("workerBtn").classList.toggle("active", mode === "worker");
  document.getElementById("clientBtn").classList.toggle("active", mode === "client");
};


// tabs
window.showTab = function(tab) {
  document.getElementById("main").style.display = tab === "main" ? "block" : "none";
  document.getElementById("saved").style.display = tab === "saved" ? "block" : "none";
};