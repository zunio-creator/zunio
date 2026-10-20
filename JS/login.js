
/* ========================================
   ZUNIO - LOGIN
======================================== */

import { auth } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");

const loginButton = document.getElementById("loginButton");
const buttonText = document.getElementById("buttonText");
const loginMessage = document.getElementById("loginMessage");
const forgotPassword = document.getElementById("forgotPassword");

function showMessage(message, type = "error") {
    loginMessage.textContent = message;
    loginMessage.className = `message show ${type}`;
}

// Show / hide password
document.querySelectorAll(".password-toggle").forEach((button) => {
    button.addEventListener("click", () => {
        const target = document.getElementById(button.dataset.target);

        if (!target) return;

        const showPassword = target.type === "password";

        target.type = showPassword ? "text" : "password";
        button.textContent = showPassword ? "Hide" : "Show";
        button.setAttribute(
            "aria-label",
            showPassword ? "Hide password" : "Show password"
        );
    });
});

// Login
loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    loginMessage.className = "message";
    loginMessage.textContent = "";

    loginButton.disabled = true;
    buttonText.textContent = "Signing in...";

    try {
        await setPersistence(auth, browserLocalPersistence);

        await signInWithEmailAndPassword(auth, email, password);

        showMessage("Login successful!", "success");

        window.location.assign(
        new URL("./community.html", window.location.href).href
        );
        
        return;


        // No automatic redirect.

    } catch (error) {
        console.error("Login error:", error);

        const messages = {
            "auth/invalid-credential":
                "Incorrect email or password. Please try again.",
            "auth/user-not-found":
                "No account found with this email.",
            "auth/wrong-password":
                "Incorrect password. Please try again.",
            "auth/invalid-email":
                "Please enter a valid email address.",
            "auth/too-many-requests":
                "Too many attempts. Please try again later.",
            "auth/network-request-failed":
                "Network error. Please check your internet connection."
        };

        showMessage(
            messages[error.code] ||
            "Unable to log in. Please try again."
        );

    } finally {
        loginButton.disabled = false;
        buttonText.textContent = "Log In";
    }
});

// Forgot password
forgotPassword?.addEventListener("click", async () => {
    const email = loginEmail.value.trim();

    if (!email) {
        showMessage(
            "Please enter your email address first."
        );
        loginEmail.focus();
        return;
    }

    forgotPassword.disabled = true;
    forgotPassword.textContent = "Sending...";

    try {
        await sendPasswordResetEmail(auth, email);

        showMessage(
            "If an account exists for this email, a password reset link has been sent.",
            "success"
        );

    } catch (error) {
        console.error("Password reset error:", error);

        if (error.code === "auth/invalid-email") {
            showMessage("Please enter a valid email address.");
        } else if (error.code === "auth/too-many-requests") {
            showMessage("Too many requests. Please try again later.");
        } else {
            showMessage("Unable to send reset email. Please try again.");
        }

    } finally {
        forgotPassword.disabled = false;
        forgotPassword.textContent = "Forgot Password?";
    }
});
