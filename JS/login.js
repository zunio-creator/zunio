/* =====================================================
   FIREBASE
===================================================== */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";


/* =====================================================
   FIREBASE CONFIG
===================================================== */

const firebaseConfig = {
    apiKey: "AIzaSyBJJsD3InZNJomK5Q0oESwqkxE-UqNxGRM",
    authDomain: "zunio-160de.firebaseapp.com",
    projectId: "zunio-160de",
    storageBucket: "zunio-160de.firebasestorage.app",
    messagingSenderId: "1058973279499",
    appId: "1:1058973279499:web:87b770b6d1e82bfb1cae0e",
    measurementId: "G-ZWV6ZMXZQQ"
};


/* =====================================================
   INITIALIZE FIREBASE
===================================================== */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);



/* =====================================================
   AUTH CONTAINER
===================================================== */

const authContainer =
    document.getElementById("authContainer");

const showSignUp =
    document.getElementById("showSignUp");

const showSignIn =
    document.getElementById("showSignIn");



/* =====================================================
   SIGN UP / SIGN IN SWITCH
===================================================== */

showSignUp.addEventListener("click", () => {

    authContainer.classList.add(
        "sign-up-active"
    );

});


showSignIn.addEventListener("click", () => {

    authContainer.classList.remove(
        "sign-up-active"
    );

});



/* =====================================================
   PASSWORD SHOW / HIDE
===================================================== */

const passwordButtons =
    document.querySelectorAll(
        ".password-toggle"
    );


passwordButtons.forEach(button => {

    button.addEventListener("click", () => {

        const target =
            button.dataset.target;

        const input =
            document.getElementById(target);


        if (input.type === "password") {

            input.type = "text";

        } else {

            input.type = "password";

        }

    });

});



/* =====================================================
   LOGIN FORM
===================================================== */

const loginForm =
    document.getElementById("loginForm");


loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const email =
            document
                .getElementById("loginEmail")
                .value
                .trim();


        const password =
            document
                .getElementById("loginPassword")
                .value;


        /* ===============================
           VALIDATION
        =============================== */

        if (!email || !password) {

            alert(
                "Please enter your email and password."
            );

            return;
        }


        /* ===============================
           FIREBASE LOGIN
        =============================== */

        try {

            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                userCredential.user;


            console.log(
                "LOGIN SUCCESS",
                user
            );


            alert(
                "Login successful!"
            );


            /*
               IMPORTANT:
               မင်းလိုချင်သလို Login ပြီးတာနဲ့
               profile.html ကို automatic redirect
               မလုပ်ထားပါဘူး။
            */


        } catch (error) {

            console.error(
                "LOGIN ERROR:",
                error
            );


            /* ===============================
               FIREBASE ERROR
            =============================== */

            if (
                error.code ===
                "auth/invalid-credential"
            ) {

                alert(
                    "Incorrect email or password."
                );

            }

            else if (
                error.code ===
                "auth/user-not-found"
            ) {

                alert(
                    "No account found with this email."
                );

            }

            else if (
                error.code ===
                "auth/wrong-password"
            ) {

                alert(
                    "Incorrect password."
                );

            }

            else if (
                error.code ===
                "auth/invalid-email"
            ) {

                alert(
                    "Please enter a valid email address."
                );

            }

            else {

                alert(
                    "Login failed. Please try again."
                );

            }

        }

    }
);



/* =====================================================
   SIGN UP FORM
===================================================== */

const signupForm =
    document.getElementById("signupForm");


signupForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const name =
            document
                .getElementById("signupName")
                .value
                .trim();


        const email =
            document
                .getElementById("signupEmail")
                .value
                .trim();


        const password =
            document
                .getElementById("signupPassword")
                .value;


        const confirmPassword =
            document
                .getElementById("confirmPassword")
                .value;


        const terms =
            document
                .getElementById("terms")
                .checked;



        /* ===============================
           VALIDATION
        =============================== */

        if (
            !name ||
            !email ||
            !password ||
            !confirmPassword
        ) {

            alert(
                "Please fill in all fields."
            );

            return;
        }



        if (password.length < 6) {

            alert(
                "Password must be at least 6 characters."
            );

            return;
        }



        if (
            password !==
            confirmPassword
        ) {

            alert(
                "Passwords do not match."
            );

            return;
        }



        if (!terms) {

            alert(
                "Please accept the Terms & Conditions."
            );

            return;
        }



        /* ===============================
           FIREBASE SIGN UP
        =============================== */

        try {

            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                userCredential.user;


            /* ===============================
               SAVE DISPLAY NAME
            =============================== */

            await updateProfile(
                user,
                {
                    displayName: name
                }
            );


            console.log(
                "SIGN UP SUCCESS",
                user
            );


            alert(
                "Account created successfully!"
            );


            /*
               Sign Up ပြီးတာနဲ့
               Sign In screen ကို ပြန်ပြမယ်။
            */

            authContainer.classList.remove(
                "sign-up-active"
            );


            /*
               Login form ထဲက email ကို
               အလိုအလျောက်ထည့်ပေးမယ်။
            */

            document
                .getElementById("loginEmail")
                .value = email;


        } catch (error) {

            console.error(
                "SIGN UP ERROR:",
                error
            );


            /* ===============================
               FIREBASE ERROR
            =============================== */

            if (
                error.code ===
                "auth/email-already-in-use"
            ) {

                alert(
                    "This email is already registered."
                );

            }

            else if (
                error.code ===
                "auth/invalid-email"
            ) {

                alert(
                    "Please enter a valid email address."
                );

            }

            else if (
                error.code ===
                "auth/weak-password"
            ) {

                alert(
                    "Password is too weak."
                );

            }

            else {

                alert(
                    "Sign up failed. Please try again."
                );

            }

        }

    }
);