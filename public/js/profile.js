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

let currentUserId = null;
let currentUserData = null;

let currentMode = "worker";
let currentTab = "main";

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

    // 🔥 RE-FETCH UPDATED DATA (IMPORTANT)
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

  // ---------------- VIEW CONTROL ----------------

  if (!isMain) {
    document.getElementById("workerView").style.display = "none";
    document.getElementById("clientView").style.display = "none";
    document.getElementById("saved").style.display = "block";
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

