
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.13.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.13.0/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDdWouovh_QSzCBHk4quTbLF9kWQgUKE3o",
  authDomain: "dressroom-446b1.firebaseapp.com",
  projectId: "dressroom-446b1",
  storageBucket: "dressroom-446b1.appspot.com",
  messagingSenderId: "999229468911",
  appId: "1:999229468911:web:6dd91a9c7a2e62b5d2eb1a",
  measurementId: "G-PM81FENNWH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const dbRef = firebase.database().ref();
const itemsRef = dbRef.child('items');
const measurementsRef = dbRef.child('measurements');