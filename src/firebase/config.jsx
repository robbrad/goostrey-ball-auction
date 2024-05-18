import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCq3kbGkQaJs2AdYE4QrvKAwBDy4YDV_LE",
  authDomain: "goostrey-ball-auction.firebaseapp.com",
  projectId: "goostrey-ball-auction",
  storageBucket: "goostrey-ball-auction.appspot.com",
  messagingSenderId: "115965833145",
  appId: "1:115965833145:web:d643ac2a9a23ffdd041068",
  measurementId: "G-Q1B0MQ1N34"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Auth
export const db = getFirestore(app);
export const auth = getAuth(app);