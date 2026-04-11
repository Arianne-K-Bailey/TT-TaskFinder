import { auth, db } from "../firebase/firebaseConfig.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ======================
// LOAD PROFILE
// ======================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
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
}


// ======================
// TASKER JOBS
// ======================
async function loadTaskerJobs(uid) {
  const q = query(
    collection(db, "jobs"),
    where("taskerId", "==", uid)
  );

  const snap = await getDocs(q);
  const container = document.getElementById("taskerJobs");

  if (snap.empty) {
    container.innerHTML = "<p>No posted jobs yet.</p>";
    return;
  }

  let html = "";

  snap.forEach(docSnap => {
    const job = docSnap.data();

    html += `
      <div class="item">
        <strong>${job.title}</strong>
        <span class="badge blue">${job.status}</span>
        <p>${job.location} • TTD $${job.pay}</p>

        <button onclick="deleteJob('${docSnap.id}')" class="btn delete-btn">
          Delete
        </button>
      </div>
    `;
  });

  container.innerHTML = html;
}


// ======================
// TOGGLE UI
// ======================
window.setMode = function (mode) {
  const isMainTab = document.getElementById("saved").style.display !== "block";

  document.getElementById("workerBtn").classList.toggle("active", mode === "worker");
  document.getElementById("clientBtn").classList.toggle("active", mode === "client");

  document.getElementById("workerView").style.display =
    isMainTab && mode === "worker" ? "block" : "none";

  document.getElementById("clientView").style.display =
    isMainTab && mode === "client" ? "block" : "none";
};


// tabs
window.showTab = function (tab) {
  const isMain = tab === "main";

  // Show/hide saved tab
  document.getElementById("saved").style.display = isMain ? "none" : "block";

  // Check which mode is active
  const isWorker = document.getElementById("workerBtn").classList.contains("active");

  // Only show views when on "Active Jobs"
  document.getElementById("workerView").style.display =
    isMain && isWorker ? "block" : "none";

  document.getElementById("clientView").style.display =
    isMain && !isWorker ? "block" : "none";
};




window.deleteJob = async function (jobId) {
  const confirmDelete = confirm("Are you sure you want to delete this job?");
  if (!confirmDelete) return;

  try {
    await deleteDoc(doc(db, "jobs", jobId));
    alert("Job deleted successfully");

    // refresh list
    const user = auth.currentUser;
    if (user) {
      loadTaskerJobs(user.uid);
    }

  } catch (error) {
    console.error("Delete failed:", error);
    alert("Failed to delete job");
  }
};