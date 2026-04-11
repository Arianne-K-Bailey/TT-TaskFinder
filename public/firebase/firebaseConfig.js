import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyD9MFIl-OIowXr2eRe4-m6DYhHAPQV99zc",
    authDomain: "tt-taskfinder.firebaseapp.com",
    projectId: "tt-taskfinder",
    storageBucket: "tt-taskfinder.firebasestorage.app",
    messagingSenderId: "708139007903",
    appId: "1:708139007903:web:95db4b7bae4b6a00e147aa"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);