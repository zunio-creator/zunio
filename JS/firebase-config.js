
/* ========================================
   ZUNIO - FIREBASE CONFIGURATION
======================================== */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

// Firebase Project Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBJJsD3InZNJomK5Q0oESwqkxE-UqNxGRM",
    authDomain: "zunio-160de.firebaseapp.com",
    projectId: "zunio-160de",
    storageBucket: "zunio-160de.firebasestorage.app",
    messagingSenderId: "1058973279499",
    appId: "1:1058973279499:web:87b770b6d1e82bfb1cae0e",
    measurementId: "G-ZWV6ZMXZQQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);
