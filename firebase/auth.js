import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

const auth = getAuth();
createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        // Signed up 
        const user = userCredential.user;
        console.log("User created:", user.email);
    })
    .catch((error) => {
        // const errorCode = error.code;
        // const errorMessage = error.message;
        console.error("Error:", error.message);
    });