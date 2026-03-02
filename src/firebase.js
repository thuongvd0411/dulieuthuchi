import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDD6eire_lFHEcQXEH_Tau96Y-oBwczJVg",
    authDomain: "dulieuthuchi.firebaseapp.com",
    projectId: "dulieuthuchi",
    storageBucket: "dulieuthuchi.firebasestorage.app",
    messagingSenderId: "992556296698",
    appId: "1:992556296698:web:451302e8b6c0df136edc43",
    measurementId: "G-DN00LVSQPS"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
