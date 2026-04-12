// ======================
// IMPORTS
// ======================
import { auth, db } from "./firebaseConfig.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// ======================
// SIGN UP
// ======================
export async function signUpUser(email, password, username, phone, dob) {
  // Normalize username
  username = username.toLowerCase();

  // Check if username already exists
  const q = query(collection(db, "users"), where("username", "==", username));
  const existing = await getDocs(q);

  if (!existing.empty) {
    throw new Error("Username already taken");
  }

  // Create Firebase Auth user
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  // Save extra user info in Firestore
  await setDoc(doc(db, "users", userCredential.user.uid), {
    username,
    email,
    phone,
    dob,
    createdAt: new Date()
  });

  return userCredential;
}


// ======================
// LOGIN (EMAIL OR USERNAME)
// ======================
export async function loginUser(identifier, password) {
  let email = identifier;

  // If it's a username → find email in Firestore
  if (!identifier.includes("@")) {
    const q = query(
      collection(db, "users"),
      where("username", "==", identifier.toLowerCase())
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error("Username not found");
    }

    email = snapshot.docs[0].data().email;
  }

  // Login with email
  return await signInWithEmailAndPassword(auth, email, password);
}