// ======================
// IMPORTS
// ======================
import { loadNavbar } from "./navbar.js";
import { JOB_LISTING } from "./API-jobs.js";

import { auth, db } from "../firebase/firebaseConfig.js";

import {
    collection,
    getDocs,
    getDoc,
    setDoc,
    doc,
    serverTimestamp,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";


// ======================
// INIT
// ======================
loadNavbar();

let allJobs = [];
let activeCategory = "All";
let currentUser = null;
let activeSearch = "";

let appliedJobs = new Set();
let savedJobs = new Set();


// ======================
// AUTH STATE
// ======================
onAuthStateChanged(auth, async (user) => {
    currentUser = user;

    if (user) {
        await loadUserData(); // load saved + applied
    }

    filterJobs();
});


// ======================
// NORMALIZE JOB
// ======================
function normalizeJob(job) {
    return {
        id: job.id,
        title: job.title || "",
        description: job.description || "",
        category: job.category || "Other",
        location: job.location || "Unknown",
        pay: Number(job.pay || 0),
        poster: job.poster || job.taskerName || "User",
        postedAt: job.postedAt || job.createdAt || new Date()
    };
}

// ======================
// RENDER JOBS
// ======================
function renderJobs(jobs) {

    const grid = document.getElementById("jobsGrid");
    const countEl = document.getElementById("jobCount");

    countEl.textContent = jobs.length;

    if (!jobs.length) {
        grid.innerHTML = `<div class="empty-state">No jobs found.</div>`;
        return;
    }

    let html = "";

    jobs.forEach(job => {

        const postedDate =
            job.postedAt instanceof Date
                ? job.postedAt
                : new Date(job.postedAt);

        const daysAgo = Math.floor((Date.now() - postedDate) / 86400000);

        const timeLabel =
            daysAgo === 0 ? "Today" :
                daysAgo === 1 ? "Yesterday" :
                    `${daysAgo}d ago`;

        // AUTH-BASED BUTTONS
        let actions = "";

        if (!currentUser) {
            actions = `<button onclick="redirectToLogin()">Login to Apply</button>`;
        } else {

            const isApplied = appliedJobs.has(job.id);
            const isSaved = savedJobs.has(job.id);

            actions = `
                <button 
                    onclick="${isApplied ? `unapplyJob('${job.id}')` : `applyJob('${job.id}')`}"
                >
                    ${isApplied ? "Applied ✅ (Click to remove)" : "Apply"}
                </button>

                <button 
                    onclick="${isSaved ? `unsaveJob('${job.id}')` : `saveJob('${job.id}')`}"
                >
                    ${isSaved ? "Saved ❤️ (Click to remove)" : "Save"}
                </button>
            `;
        }

        html += `
            <div class="job-card">

                <div class="card-top">
                    <span class="category-badge">${job.category}</span>
                    <div class="pay-amount">$${job.pay} <small>TTD</small></div>
                </div>

                <div class="job-title">${job.title}</div>
                <div class="job-desc">${job.description}</div>

                <div class="card-meta">
                    <span>📍 ${job.location}</span>
                    <span>🕐 ${timeLabel}</span>
                </div>

                <div class="card-footer">
                    <span class="poster">Posted by ${job.poster}</span>
                    <a class="view-btn" href="#" onclick="openJobModal('${job.id}')">
                        View Details
                    </a>
                </div>

                <div class="job-actions">
                    ${actions}
                </div>

            </div>
        `;
    });

    grid.innerHTML = html;
}


// ======================
// LOAD USER DATA
// ======================
async function loadUserData() {

    appliedJobs.clear();
    savedJobs.clear();

    // LOAD APPLICATIONS
    const appSnap = await getDocs(collection(db, "applications"));
    appSnap.forEach(doc => {
        const data = doc.data();
        if (data.userId === currentUser.uid) {
            appliedJobs.add(data.jobId);
        }
    });

    // LOAD SAVED
    const saveSnap = await getDocs(collection(db, "savedJobs"));
    saveSnap.forEach(doc => {
        const data = doc.data();
        if (data.userId === currentUser.uid) {
            savedJobs.add(data.jobId);
        }
    });
}


// ======================
// LOAD JOBS
// ======================
async function getJobs() {

    let firebaseJobs = [];

    try {
        const snapshot = await getDocs(collection(db, "jobs"));

        firebaseJobs = snapshot.docs.map(docSnap => {
            const data = docSnap.data();

            return normalizeJob({
                id: docSnap.id,
                ...data,
                postedAt: data.createdAt?.toDate()
            });
        });

    } catch (err) {
        console.error("Firestore failed:", err);
    }

    const apiJobs = JOB_LISTING.map(job => normalizeJob(job));

    // MERGE THE API AND USER JOB INPUT
    allJobs = [...apiJobs, ...firebaseJobs];

    filterJobs();
}


// ======================
// FILTER + SORT
// ======================
function filterJobs() {
    const searchVal = (activeSearch || "").toLowerCase();

    const sortVal = document.getElementById("sortSelect")?.value || "newest";

    // const searchVal = document.getElementById("searchInput").value.toLowerCase();
    // const sortVal = document.getElementById("sortSelect").value;

    let filtered = allJobs.filter(job => {

        const matchCategory =
            activeCategory === "All" ||
            job.category.toLowerCase() === activeCategory.toLowerCase();

        const matchSearch =
            job.title.toLowerCase().includes(searchVal) ||
            job.category.toLowerCase().includes(searchVal) ||
            job.location.toLowerCase().includes(searchVal);

        return matchCategory && matchSearch;
    });

    // SORT
    if (sortVal === "pay_high") {
        filtered.sort((a, b) => b.pay - a.pay);
    }
    else if (sortVal === "pay_low") {
        filtered.sort((a, b) => a.pay - b.pay);
    }
    else {
        filtered.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
    }

    renderJobs(filtered);
}


// ======================
// CATEGORY
// ======================
function setCategory(cat, el) {

    activeCategory = cat;

    document.querySelectorAll(".categories span")
        .forEach(s => s.classList.remove("active"));

    el.classList.add("active");

    filterJobs();
}


// ======================
// APPLY JOB
// ======================
async function applyJob(jobId) {

    if (!currentUser) {
        return redirectToLogin();
    }

    const docId = `${currentUser.uid}_${jobId}`;
    const appRef = doc(db, "applications", docId);

    const existing = await getDoc(appRef);

    if (existing.exists()) {
        alert("You already applied to this job");
        return;
    }

    await setDoc(appRef, {
        userId: currentUser.uid,
        jobId,
        status: "applied",
        createdAt: serverTimestamp()
    });

    // update local state
    appliedJobs.add(jobId);
    await loadUserData();
    renderJobs(allJobs);

    alert("Application submitted!");
}


// ======================
// SAVE JOB
// ======================
async function saveJob(jobId) {
    if (!currentUser) {
        return redirectToLogin();
    }

    const docId = `${currentUser.uid}_${jobId}`;
    const saveRef = doc(db, "savedJobs", docId);

    const existing = await getDoc(saveRef);

    if (existing.exists()) {
        alert("Job already saved");
        return;
    }

    await setDoc(saveRef, {
        userId: currentUser.uid,
        jobId,
        createdAt: serverTimestamp()
    });

    // update local state
    savedJobs.add(jobId);
    await loadUserData();
    renderJobs(allJobs);

    alert("Job saved!");
}

// ======================
// UNSAVE A JOB
// ======================
async function unsaveJob(jobId) {
    if (!currentUser) return redirectToLogin();

    const docId = `${currentUser.uid}_${jobId}`;
    const saveRef = doc(db, "savedJobs", docId);

    try {
        await deleteDoc(saveRef);

        savedJobs.delete(jobId);

        await loadUserData();
        renderJobs(allJobs);

        alert("Removed from saved jobs!");
    } catch (err) {
        console.error(err);
        alert("Failed to remove saved job");
    }
}


// ======================
// UNAPPLY FOR A JOB
// ======================
async function unapplyJob(jobId) {
    if (!currentUser) return redirectToLogin();

    const docId = `${currentUser.uid}_${jobId}`;
    const appRef = doc(db, "applications", docId);

    try {
        await deleteDoc(appRef);

        appliedJobs.delete(jobId);

        await loadUserData();
        renderJobs(allJobs);

        alert("Application removed!");
    } catch (err) {
        console.error(err);
        alert("Failed to remove application");
    }
}

// ======================
// OPEN MODAL
// ======================
window.openJobModal = function (jobId) {

    const job = allJobs.find(j => j.id === jobId);

    if (!job) return;

    const modal = document.getElementById("jobModal");
    const body = document.getElementById("modalBody");

    body.innerHTML = `
        <div class="job-detail-card">

            <h2>${job.title}</h2>

            <p><strong>Category:</strong> ${job.category}</p>
            <p><strong>Location:</strong> ${job.location}</p>
            <p><strong>Pay:</strong> TTD $${job.pay}</p>

            <hr>

            <h3>Description</h3>
            <p>${job.description}</p>

            <hr>

            <p><strong>Posted by:</strong> ${job.poster}</p>

        </div>
    `;

    modal.classList.remove("hidden");
};

// ======================
// CLOSE MODAL
// ======================
window.closeJobModal = function () {
    const modal = document.getElementById("jobModal");
    modal.classList.add("hidden");
};


// ======================
// REDIRECT LOGIN
// ======================
function redirectToLogin() {
    window.location.href = "Login.html";
}


// ======================
// REDIRECT HOME SEARCH
// ======================
function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

function applyUrlSearch() {
    const query = getQueryParam("q");

    if (query) {
        const input = document.getElementById("searchInput");

        if (input) input.value = query;

        activeSearch = query;

        filterJobs();
    }
}


// =========================
// GLOBAL (for HTML onclick)
// =========================
window.filterJobs = filterJobs;
window.setCategory = setCategory;
window.applyJob = applyJob;
window.saveJob = saveJob;
window.redirectToLogin = redirectToLogin;
window.unapplyJob = unapplyJob;
window.unsaveJob = unsaveJob;


// ======================
// START
// ======================
async function startBrowsePage() {
    const input = document.getElementById("searchInput");

    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get("q");
    const categoryParam = urlParams.get("category");

    if (query) {
        activeSearch = query;
        if (input) input.value = query;
    }

    if (categoryParam) {
        activeCategory = categoryParam;
    }

    await getJobs(); // sets allJobs

    filterJobs();

    if (input) {
        input.addEventListener("input", () => {
            activeSearch = input.value.trim();
            filterJobs();
        });
    }

    const sortSelect = document.getElementById("sortSelect");
    if (sortSelect) {
        sortSelect.addEventListener("change", filterJobs);
    }
}

startBrowsePage();