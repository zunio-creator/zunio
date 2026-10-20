
/* ========================================
   ZUNIO - SIGN UP
======================================== */

import { auth } from "./firebase-config.js";

import {
    createUserWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

const signupForm = document.getElementById("signupForm");
const signupName = document.getElementById("signupName");
const signupEmail = document.getElementById("signupEmail");
const signupPassword = document.getElementById("signupPassword");
const confirmPassword = document.getElementById("confirmPassword");

const signupButton = document.getElementById("signupButton");
const buttonText = document.getElementById("buttonText");
const signupMessage = document.getElementById("signupMessage");

// Show messages on the page
function showMessage(message, type = "error") {
    signupMessage.textContent = message;
    signupMessage.className = `message show ${type}`;
}

// Show / hide passwords
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

// Create account
signupForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = signupName.value.trim();
    const email = signupEmail.value.trim();
    const password = signupPassword.value;
    const confirm = confirmPassword.value;

    signupMessage.className = "message";
    signupMessage.textContent = "";

    if (password !== confirm) {
        showMessage("Passwords do not match. Please try again.");
        confirmPassword.focus();
        return;
    }

    if (password.length < 6) {
        showMessage("Password must contain at least 6 characters.");
        signupPassword.focus();
        return;
    }

    signupButton.disabled = true;
    buttonText.textContent = "Creating account...";

    try {
        // Remember the user across browser sessions
        await setPersistence(auth, browserLocalPersistence);

        // Create a Firebase Authentication account
        const credential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        // Save the name in the user's Firebase Auth profile
        await updateProfile(credential.user, {
            displayName: name
        });

        showMessage(
            "Account created successfully! You can now log in.",
            "success"
        );

        signupForm.reset();

        document.querySelectorAll(".password-toggle").forEach((button) => {
            button.textContent = "Show";

            const target = document.getElementById(button.dataset.target);
            if (target) target.type = "password";
        });

        // No automatic page redirect.

    } catch (error) {
        console.error("Sign up error:", error);

        const messages = {
            "auth/email-already-in-use":
                "This email already has an account. Please log in.",
            "auth/invalid-email":
                "Please enter a valid email address.",
            "auth/weak-password":
                "Your password is too weak. Please use at least 6 characters.",
            "auth/network-request-failed":
                "Network error. Please check your internet connection.",
            "auth/operation-not-allowed":
                "Email and password sign-up is not enabled in Firebase."
        };

        showMessage(
            messages[error.code] ||
            "Unable to create your account. Please try again."
        );

    } finally {
        signupButton.disabled = false;
        buttonText.textContent = "Create Account";
    }
});
