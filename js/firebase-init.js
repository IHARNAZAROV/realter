// /js/firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCqZp8BeZ_nQG-z5lFG3bCAlp6LQhgeCt8",
  authDomain: "turko-by.firebaseapp.com",
  projectId: "turko-by",
  storageBucket: "turko-by.firebasestorage.app",
  messagingSenderId: "679951213642",
  appId: "1:679951213642:web:59b693e7100a2f3bab72b3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.__DB__ = db;

console.log("firebase-init OK: window.__DB__ ready");