// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// import { getFunctions } from "firebase/functions"; // Include this

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyDJtX7CBcXd0acX-1oIO5n1no41WRAASUg",
//   authDomain: "attendance-leave-management.firebaseapp.com",
//   projectId: "attendance-leave-management",
//   storageBucket: "attendance-leave-management.firebasestorage.app",
//   messagingSenderId: "471762551739",
//   appId: "1:471762551739:web:ad29bb4d1ca15e477c7a9e",
//   measurementId: "G-9NC1XD2YGP"
// };

const firebaseConfig = {
  apiKey: "AIzaSyA2V84qMJ-THgJqX0fEC9KS-DX_3At02JQ",
  authDomain: "attendence-locahost.firebaseapp.com",
  projectId: "attendence-locahost",
  storageBucket: "attendence-locahost.firebasestorage.app",
  messagingSenderId: "992561848299",
  appId: "1:992561848299:web:d67ea1464f65b0a82a43ae"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// const functions = getFunctions(app); // Export cloud functions

export {RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential };

