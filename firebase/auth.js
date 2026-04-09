import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const auth = getAuth();

export const loginUser = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log("Login successful:", userCredential.user);
    })
    .catch((error) => {
      console.error("Login failed:", error.message);
    });
};