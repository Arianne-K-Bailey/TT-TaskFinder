import { auth, db } from "../firebase/firebaseConfig.js";

import { updateProfile, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { JOB_LISTING } from "./API-jobs.js";

let currentUserId = null;
let currentUserData = null;

let currentMode = "worker";
let currentTab = "main";

let jobCache = {};

// ======================
// LOAD PROFILE
// ======================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  currentUserId = user.uid;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return;

  currentUserData = userSnap.data();

  document.getElementById("username").textContent =
    currentUserData.username || "No Username";

  document.getElementById("email").textContent =
    currentUserData.email || "No Email";

  const phone = currentUserData.phone;

  document.getElementById("phone").textContent =
    phone && phone.trim() !== ""
      ? `📞 ${phone}`
      : "📞 Not provided";

  await loadTaskeeJobs(user.uid);
  await loadTaskerJobs(user.uid);

  currentMode = "worker";
  currentTab = "main";
  renderTab();
});

window.openEditProfile = function () {
  document.getElementById("editModal").style.display = "flex";

  document.getElementById("editUsername").value =
    currentUserData.username || "";

  document.getElementById("editPhone").value =
    currentUserData.phone || "";
};

window.closeEditProfile = function () {
  document.getElementById("editModal").style.display = "none";
};


// ======================
// UPDATE PROFILE
// ======================
window.saveProfile = async function () {
  try {
    const userRef = doc(db, "users", currentUserId);

    const updatedData = {
      username: document.getElementById("editUsername").value,
      phone: document.getElementById("editPhone").value
    };

    await updateDoc(userRef, updatedData);

    // RE-FETCH UPDATED DATA
    const updatedSnap = await getDoc(userRef);
    currentUserData = updatedSnap.data();

    // update UI
    document.getElementById("username").textContent =
      currentUserData.username;

    document.getElementById("phone").textContent =
      currentUserData.phone
        ? `📞 ${currentUserData.phone}`
        : "📞 Not provided";

    closeEditProfile();

    alert("Profile updated!");

    await updateProfile(auth.currentUser, {
      displayName: updatedData.username
    });

  } catch (err) {
    console.error(err);
    alert("Failed to update profile");
  }
};


// ======================
// TASKEE JOBS
// ======================
async function loadTaskeeJobs(uid) {
  const q = query(collection(db, "applications"), where("userId", "==", uid));
  const snap = await getDocs(q);

  const container = document.getElementById("taskeeJobs");
  container.innerHTML = "";

  if (snap.empty) {
    container.innerHTML = "<p>No applied jobs yet.</p>";
    return;
  }

  let html = "";

  for (const docSnap of snap.docs) {
    const app = docSnap.data();
    const job = await fetchJob(app.jobId);
    if (!job) continue;

    html += `
      <div class="item">
        <strong>${job.title}</strong>
        <span class="badge yellow">${app.status || job.status || "applied"}</span>
        <p>${job.location} • TTD $${job.pay}</p>
        <button onclick="deleteApplication('${docSnap.id}')" class="btn delete-btn">
          Remove Application
        </button>
      </div>
    `;
  }

  container.innerHTML = html;
}

//Delete Taskee Application
window.deleteApplication = async function (applicationId) {
  const confirmDelete = confirm("Are you sure you want to remove this application?");
  if (!confirmDelete) return;

  try {
    await deleteDoc(doc(db, "applications", applicationId));
    alert("Application removed successfully");

    // Refresh the list
    if (auth.currentUser) {
      await loadTaskeeJobs(auth.currentUser.uid);
    }
  } catch (err) {
    console.error("Failed to remove application:", err);
    alert("Failed to remove application");
  }
};

// ===================
// LOAD SAVED JOBS
// ===================
async function loadSavedJobs(uid) {
  const q = query(collection(db, "savedJobs"), where("userId", "==", uid));
  const snap = await getDocs(q);

  const container = document.getElementById("saved");
  container.innerHTML = "";

  if (snap.empty) {
    container.innerHTML = "<p>No saved jobs yet.</p>";
    return;
  }

  let html = "";

  for (const docSnap of snap.docs) {
    const saved = docSnap.data();
    const job = await fetchJob(saved.jobId);
    if (!job) continue;

    html += `
      <div class="item">
        <strong>${job.title}</strong>
        <p>${job.location} • TTD $${job.pay}</p>
        <button onclick="deleteSavedJob('${docSnap.id}')" class="btn delete-btn">
          Remove Saved Job
        </button>
      </div>
    `;
  }

  container.innerHTML = html;
}

//Delete Saved Jobs
window.deleteSavedJob = async function (savedJobId) {
  const confirmDelete = confirm("Are you sure you want to remove this saved job?");
  if (!confirmDelete) return;

  try {
    await deleteDoc(doc(db, "savedJobs", savedJobId));
    alert("Saved job removed successfully");

    // Refresh saved jobs list
    if (auth.currentUser) {
      await loadSavedJobs(auth.currentUser.uid);
    }
  } catch (err) {
    console.error("Failed to remove saved job:", err);
    alert("Failed to remove saved job");
  }
};

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
  currentMode = mode;

  const isWorker = mode === "worker";

  document.getElementById("workerBtn").classList.toggle("active", isWorker);
  document.getElementById("clientBtn").classList.toggle("active", !isWorker);

  renderTab(); // unified renderer
};


// ======================
// SHOWING TABS
// ======================
window.showTab = function (tab) {
  currentTab = tab;

  document.getElementById("tab1").classList.toggle("active", tab === "main");
  document.getElementById("tab2").classList.toggle("active", tab === "saved");

  renderTab();
};


// ======================
// RENDER FUNCTION
// ======================
function renderTab() {
  const isWorker = currentMode === "worker";
  const isMain = currentTab === "main";

  if (!isMain) {
    document.getElementById("workerView").style.display = "none";
    document.getElementById("clientView").style.display = "none";
    document.getElementById("saved").style.display = "block";

    // ✅ Load saved jobs here
    if (currentUserId) loadSavedJobs(currentUserId);

    return;
  }

  document.getElementById("saved").style.display = "none";

  document.getElementById("workerView").style.display =
    isWorker ? "block" : "none";

  document.getElementById("clientView").style.display =
    !isWorker ? "block" : "none";
}


// ======================
// DELETE BUTTON
// ======================
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

// ================================
// FETCH JOB (CACHE + API FALLBACK)
// ================================
async function fetchJob(jobId) {
  // Return from cache if already fetched
  if (jobCache[jobId]) return jobCache[jobId];

  // Try Firestore first
  const docRef = doc(db, "jobs", jobId);
  const snap = await getDoc(docRef);

  if (snap.exists()) {
    jobCache[jobId] = snap.data();
    return jobCache[jobId];
  }

  // Fallback to API-JOBS
  const apiJob = JOB_LISTING.find(job => job.id === jobId);
  if (apiJob) {
    const normalizedJob = {
      id: apiJob.id,
      title: apiJob.title,
      category: apiJob.category,
      pay: apiJob.pay,
      location: apiJob.location,
      description: apiJob.description,
      poster: apiJob.poster,
      postedAt: apiJob.postedAt,
      status: "active" // default
    };

    jobCache[jobId] = normalizedJob;
    return normalizedJob;
  }

  console.warn(`Job ${jobId} not found in Firestore or API`);
  return null;
}