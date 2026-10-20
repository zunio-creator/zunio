
/* ==============================================
   ZUNIO PROFILE
   Firebase Authentication + Firestore
   Account Search + Follow + Text Notes
   Saved Notes: Own + Other Users
============================================== */

import { auth } from "./firebase-config.js";

import {
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail,
    signOut,
    deleteUser
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    onSnapshot,
    getDocs,
    addDoc,
    serverTimestamp,
    arrayUnion,
    arrayRemove
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const db = getFirestore(auth.app);
const THEME_KEY = "zunioTheme";
const LEGACY_SAVED_KEY = "zunioSavedNotes";

const $ = selector => document.querySelector(selector);

const profileAvatar = $("#profileAvatar");
const profileName = $("#profileName");
const profileEmail = $("#profileEmail");
const userIdElement = $("#userId");
const profileMessage = $("#profileMessage");
const notesCount = $("#notesCount");

const noteForm = $("#noteFormElement");
const noteTitle = $("#noteTitle");
const noteContent = $("#noteContent");
const publishButton = $("#publishButton");
const formMessage = $("#formMessage");

const myNotesList = $("#myNotesList");
const myNotesEmpty = $("#myNotesEmpty");
const myNotesMessage = $("#myNotesMessage");
const notesHeading = $("#notesHeading");

const followForm = $("#followForm");
const followUserId = $("#followUserId");
const followResult = $("#followResult");

const followersCount = $("#followersCount");
const followingCount = $("#followingCount");

const peopleSection = $("#peopleSection");
const peopleTitle = $("#peopleTitle");
const peopleList = $("#peopleList");

const settingsDialog = $("#settingsDialog");
const settingsMessage = $("#settingsMessage");
const loginButton = $("#loginButton");

let currentUser = null;
let currentTab = "uploaded";
let allNotes = [];
let savedNotes = [];
let followingIds = [];
let currentPeopleType = "followers";

let unsubscribeNotes = null;
let unsubscribeProfile = null;
let unsubscribeFollowers = null;

let savedLoadVersion = 0;

const escapeHTML = value =>
    String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);

function setMessage(element, message, error = false) {
    if (!element) return;

    element.textContent = message;
    element.style.color = error ? "#dc2626" : "";
}

/* ==============================================
   SAVED NOTES
   Both Community and Profile must use:
   zunioSavedNotes_USER_UID

   Storage format:
   ["firestoreNoteId1", "firestoreNoteId2"]
============================================== */

function getSavedKey() {
    return currentUser
        ? `zunioSavedNotes_${currentUser.uid}`
        : null;
}

/*
   Convert old formats into a consistent array
   of string IDs.
*/
function normalizeSavedIds(value) {
    if (!Array.isArray(value)) return [];

    const ids = value
        .map(item => {
            if (typeof item === "string") {
                return item;
            }

            if (
                item &&
                typeof item.id === "string"
            ) {
                return item.id;
            }

            return null;
        })
        .filter(id => typeof id === "string" && id.length > 0);

    return [...new Set(ids)];
}

function readSavedIds(key) {
    if (!key) return [];

    try {
        const raw = localStorage.getItem(key);

        if (!raw) return [];

        return normalizeSavedIds(JSON.parse(raw));
    } catch (error) {
        console.error("Read saved IDs error:", error);
        return [];
    }
}

function getSavedNotes() {
    const key = getSavedKey();

    if (!key) return [];

    let savedIds = readSavedIds(key);

    /*
       Migrate the old shared key only when this account
       does not already have its own saved-note list.
    */
    if (localStorage.getItem(key) === null) {
        const legacyIds = readSavedIds(LEGACY_SAVED_KEY);

        if (legacyIds.length > 0) {
            savedIds = legacyIds;

            try {
                localStorage.setItem(
                    key,
                    JSON.stringify(savedIds)
                );
            } catch (error) {
                console.error("Saved notes migration error:", error);
            }
        }
    }

    return savedIds;
}

function isSaved(noteId) {
    return getSavedNotes().includes(noteId);
}

function toggleSaved(noteId) {
    const key = getSavedKey();

    if (!key || !noteId) return false;

    const savedIds = getSavedNotes();
    const exists = savedIds.includes(noteId);

    const updatedIds = exists
        ? savedIds.filter(id => id !== noteId)
        : [...savedIds, noteId];

    try {
        localStorage.setItem(
            key,
            JSON.stringify(updatedIds)
        );
    } catch (error) {
        console.error("Save note error:", error);
        setMessage(myNotesMessage, "Could not save this note.", true);
        return exists;
    }

    return !exists;
}

/*
   Fetch saved notes by their Firestore document IDs.
   Do not filter saved notes through allNotes, because
   allNotes contains only the current user's own notes.
*/
async function loadSavedNotes() {
    if (!currentUser) {
        savedNotes = [];
        renderNotes();
        return;
    }

    const userAtStart = currentUser.uid;
    const version = ++savedLoadVersion;
    const savedIds = getSavedNotes();

    try {
        const results = await Promise.all(
            savedIds.map(async noteId => {
                try {
                    const snapshot = await getDoc(
                        doc(db, "studyNotes", noteId)
                    );

                    if (!snapshot.exists()) return null;

                    return {
                        id: snapshot.id,
                        ...snapshot.data()
                    };
                } catch (error) {
                    console.error(
                        `Could not fetch saved note ${noteId}:`,
                        error
                    );

                    return null;
                }
            })
        );

        // Do not display results from an old login session.
        if (
            !currentUser ||
            currentUser.uid !== userAtStart ||
            version !== savedLoadVersion
        ) {
            return;
        }

        savedNotes = results.filter(Boolean);

        // Remove IDs for notes that no longer exist.
        const validIds = new Set(
            savedNotes.map(note => note.id)
        );

        const validSavedIds = savedIds.filter(
            noteId => validIds.has(noteId)
        );

        const key = getSavedKey();

        if (key) {
            localStorage.setItem(
                key,
                JSON.stringify(validSavedIds)
            );
        }

        renderNotes();
    } catch (error) {
        console.error("Load saved notes error:", error);

        if (
            currentUser?.uid === userAtStart &&
            version === savedLoadVersion
        ) {
            setMessage(
                myNotesMessage,
                "Could not load saved notes. Check Firestore Rules.",
                true
            );
        }
    }
}

/* ==============================================
   THEME
============================================== */

function applyTheme(theme) {
    const validTheme = ["light", "dark", "system"].includes(theme)
        ? theme
        : "system";

    const resolved = validTheme === "system"
        ? (
            window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light"
        )
        : validTheme;

    document.documentElement.dataset.theme = resolved;

    const themeSelect = $("#themeSelect");

    if (themeSelect) {
        themeSelect.value = validTheme;
    }
}

/* ==============================================
   PROFILE
============================================== */

function getDisplayName(user, profile = {}) {
    return profile.displayName ||
        profile.name ||
        user?.displayName ||
        user?.email?.split("@")[0] ||
        "Learner";
}

async function getProfile(uid) {
    const snapshot = await getDoc(
        doc(db, "userProfiles", uid)
    );

    if (!snapshot.exists()) return null;

    return {
        uid: snapshot.id,
        ...snapshot.data()
    };
}

async function ensureProfile(user) {
    const ref = doc(db, "userProfiles", user.uid);
    const snapshot = await getDoc(ref);

    if (!snapshot.exists()) {
        await setDoc(ref, {
            uid: user.uid,
            displayName:
                user.displayName ||
                user.email?.split("@")[0] ||
                "Learner",
            email: user.email || "",
            following: [],
            createdAt: serverTimestamp()
        });
    } else if (!Array.isArray(snapshot.data().following)) {
        await updateDoc(ref, {
            following: []
        });
    }
}

async function loadProfile(user) {
    const profile = await getProfile(user.uid);

    if (currentUser?.uid !== user.uid) return;

    const name = getDisplayName(user, profile || {});

    profileName.textContent = name;
    profileEmail.textContent = user.email || profile?.email || "";
    userIdElement.textContent = user.uid;
    profileAvatar.textContent = name.charAt(0).toUpperCase();

    followingIds = Array.isArray(profile?.following)
        ? profile.following
        : [];
}

async function editDisplayName() {
    if (!currentUser) return;

    const answer = prompt(
        "Enter your display name:",
        profileName.textContent
    );

    if (answer === null) return;

    const name = answer.trim();

    if (!name || name.length > 60) {
        alert("Name must contain 1–60 characters.");
        return;
    }

    try {
        await updateProfile(currentUser, {
            displayName: name
        });

        await setDoc(
            doc(db, "userProfiles", currentUser.uid),
            {
                uid: currentUser.uid,
                displayName: name,
                email: currentUser.email || "",
                updatedAt: serverTimestamp()
            },
            { merge: true }
        );

        profileName.textContent = name;
        profileAvatar.textContent = name.charAt(0).toUpperCase();

        setMessage(profileMessage, "Profile updated.");
        setMessage(settingsMessage, "Display name updated.");
    } catch (error) {
        console.error(error);
        setMessage(profileMessage, error.message, true);
    }
}

/* ==============================================
   ACCOUNT SEARCH + FOLLOW
============================================== */

function renderFoundAccount(profile) {
    if (!profile || !currentUser || !followResult) return;

    const name = getDisplayName(null, profile);
    const isMe = profile.uid === currentUser.uid;
    const following = followingIds.includes(profile.uid);

    followResult.innerHTML = `
        <div class="follow-result-card">
            <div>
                <strong>${escapeHTML(name)}</strong>
                <p class="muted">${escapeHTML(profile.email || "")}</p>
                <p class="muted">
                    User ID: ${escapeHTML(profile.uid)}
                </p>
            </div>

            ${
                isMe
                    ? '<p class="muted">This is your account.</p>'
                    : `
                        <button
                            id="followToggle"
                            class="primary-button"
                            type="button"
                        >
                            ${following ? "Unfollow" : "Follow"}
                        </button>
                    `
            }
        </div>
    `;

    $("#followToggle")?.addEventListener(
        "click",
        async event => {
            const button = event.currentTarget;
            button.disabled = true;

            try {
                const ownRef = doc(
                    db,
                    "userProfiles",
                    currentUser.uid
                );

                if (followingIds.includes(profile.uid)) {
                    await updateDoc(ownRef, {
                        following: arrayRemove(profile.uid)
                    });

                    followingIds = followingIds.filter(
                        uid => uid !== profile.uid
                    );
                } else {
                    await updateDoc(ownRef, {
                        following: arrayUnion(profile.uid)
                    });

                    followingIds = [
                        ...new Set([...followingIds, profile.uid])
                    ];
                }

                renderFoundAccount(profile);
                await refreshFollowCounts();
            } catch (error) {
                console.error("Follow error:", error);
                button.disabled = false;

                alert(
                    "Follow မလုပ်နိုင်ပါ။ Firestore Rules ကိုစစ်ပါ။"
                );
            }
        }
    );
}

followForm?.addEventListener("submit", async event => {
    event.preventDefault();

    if (!currentUser) {
        setMessage(followResult, "Please log in first.", true);
        return;
    }

    const uid = followUserId.value.trim();

    if (!uid) return;

    followResult.textContent = "Searching...";

    try {
        const profile = await getProfile(uid);

        if (!profile) {
            followResult.textContent =
                "Account not found. Check the User ID.";
            return;
        }

        renderFoundAccount(profile);
    } catch (error) {
        console.error("Search error:", error);

        followResult.textContent =
            "Search failed. Check Firestore Rules.";
    }
});

/* ==============================================
   FOLLOWERS / FOLLOWING
============================================== */

async function refreshFollowCounts() {
    if (!currentUser) return;

    const uid = currentUser.uid;
    const profile = await getProfile(uid);

    if (currentUser?.uid !== uid) return;

    followingIds = Array.isArray(profile?.following)
        ? profile.following
        : [];

    followingCount.textContent = followingIds.length;
}

function renderPeople(people) {
    if (!peopleList) return;

    if (!people.length) {
        peopleList.innerHTML =
            '<p class="muted">No accounts to show yet.</p>';
        return;
    }

    peopleList.innerHTML = people.map(person => `
        <article class="follow-person-row">
            <div>
                <strong>
                    ${escapeHTML(getDisplayName(null, person))}
                </strong>

                <p class="muted">
                    ${escapeHTML(person.email || "")}
                </p>

                <small>
                    User ID: ${escapeHTML(person.uid)}
                </small>
            </div>

            <button
                class="text-button"
                type="button"
                data-view-user="${escapeHTML(person.uid)}"
            >
                View
            </button>
        </article>
    `).join("");

    peopleList.querySelectorAll("[data-view-user]")
        .forEach(button => {
            button.addEventListener("click", async () => {
                try {
                    const profile = await getProfile(
                        button.dataset.viewUser
                    );

                    if (!profile) {
                        alert("Account not found.");
                        return;
                    }

                    followUserId.value = profile.uid;
                    renderFoundAccount(profile);

                    followResult.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });
                } catch (error) {
                    console.error(error);
                    alert("Unable to load this profile.");
                }
            });
        });
}

async function openPeople(type) {
    if (!currentUser) return;

    const uid = currentUser.uid;

    currentPeopleType = type;
    peopleSection.hidden = false;

    peopleTitle.textContent =
        type === "followers" ? "Followers" : "Following";

    peopleList.innerHTML =
        '<p class="muted">Loading...</p>';

    try {
        if (type === "following") {
            const people = await Promise.all(
                followingIds.map(id => getProfile(id))
            );

            if (currentUser?.uid !== uid) return;

            renderPeople(people.filter(Boolean));
        } else {
            const q = query(
                collection(db, "userProfiles"),
                where("following", "array-contains", uid)
            );

            const snapshot = await getDocs(q);

            if (currentUser?.uid !== uid) return;

            renderPeople(
                snapshot.docs.map(item => ({
                    uid: item.id,
                    ...item.data()
                }))
            );
        }
    } catch (error) {
        console.error("Load people error:", error);

        peopleList.textContent =
            "Unable to load this list. Check Firestore Rules.";
    }
}

$("#showFollowers")?.addEventListener(
    "click",
    () => openPeople("followers")
);

$("#showFollowing")?.addEventListener(
    "click",
    () => openPeople("following")
);

$("#closePeople")?.addEventListener("click", () => {
    peopleSection.hidden = true;
});

async function startFollowListeners(user) {
    if (unsubscribeProfile) unsubscribeProfile();
    if (unsubscribeFollowers) unsubscribeFollowers();

    unsubscribeProfile = onSnapshot(
        doc(db, "userProfiles", user.uid),
        snapshot => {
            if (!snapshot.exists()) return;
            if (currentUser?.uid !== user.uid) return;

            followingIds = Array.isArray(
                snapshot.data().following
            )
                ? snapshot.data().following
                : [];

            followingCount.textContent = followingIds.length;

            const targetUid = followUserId?.value.trim();

            if (targetUid && $("#followToggle")) {
                getProfile(targetUid)
                    .then(profile => {
                        if (
                            profile &&
                            currentUser?.uid === user.uid
                        ) {
                            renderFoundAccount(profile);
                        }
                    })
                    .catch(console.error);
            }

            if (
                currentPeopleType === "following" &&
                peopleSection &&
                !peopleSection.hidden
            ) {
                openPeople("following");
            }
        },
        error => console.error("Profile listener error:", error)
    );

    unsubscribeFollowers = onSnapshot(
        query(
            collection(db, "userProfiles"),
            where("following", "array-contains", user.uid)
        ),
        snapshot => {
            if (currentUser?.uid !== user.uid) return;

            followersCount.textContent = snapshot.size;

            if (
                currentPeopleType === "followers" &&
                peopleSection &&
                !peopleSection.hidden
            ) {
                renderPeople(
                    snapshot.docs.map(item => ({
                        uid: item.id,
                        ...item.data()
                    }))
                );
            }
        },
        error => console.error("Followers listener error:", error)
    );
}

/* ==============================================
   NOTES
============================================== */

function formatDate(timestamp) {
    if (!timestamp?.toDate) return "Just now";

    return timestamp.toDate().toLocaleDateString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );
}

function renderNote(note) {
    const saved = isSaved(note.id);
    const owner = note.authorId === currentUser?.uid;

    return `
        <article class="note-card">
            <h3>
                ${escapeHTML(note.title || "Untitled note")}
            </h3>

            <div class="note-content">${escapeHTML(
                note.content || ""
            )}</div>

            <p class="note-meta">
                By ${escapeHTML(note.authorName || "Learner")}
                · ${formatDate(note.createdAt)}
            </p>

            <div class="note-actions">
                <button
                    type="button"
                    data-note-action="save"
                    data-note-id="${escapeHTML(note.id)}"
                >
                    ${saved ? "★ Saved" : "☆ Save"}
                </button>

                <button
                    type="button"
                    data-note-action="share"
                    data-note-id="${escapeHTML(note.id)}"
                >
                    Share
                </button>

                ${
                    owner
                        ? `
                            <button
                                type="button"
                                data-note-action="delete"
                                data-note-id="${escapeHTML(note.id)}"
                            >
                                Delete
                            </button>
                        `
                        : ""
                }
            </div>
        </article>
    `;
}

function renderNotes() {
    if (!myNotesList) return;

    let notes = currentTab === "saved"
        ? savedNotes
        : allNotes;

    notesHeading.textContent = currentTab === "saved"
        ? "Saved Notes"
        : "My Notes";

    notes = [...notes].sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;

        return bTime - aTime;
    });

    myNotesList.innerHTML = notes.map(renderNote).join("");

    myNotesEmpty.hidden = notes.length > 0;

    myNotesEmpty.textContent = !currentUser
        ? "Log in to view your notes."
        : currentTab === "saved"
            ? "You haven't saved any notes yet."
            : "You haven't published any notes yet.";

    notesCount.textContent = allNotes.length;
}

function listenToMyNotes(user) {
    if (unsubscribeNotes) unsubscribeNotes();

    const q = query(
        collection(db, "studyNotes"),
        where("authorId", "==", user.uid)
    );

    unsubscribeNotes = onSnapshot(
        q,
        snapshot => {
            if (currentUser?.uid !== user.uid) return;

            allNotes = snapshot.docs.map(item => ({
                id: item.id,
                ...item.data()
            }));

            setMessage(myNotesMessage, "");
            renderNotes();

            if (currentTab === "saved") {
                loadSavedNotes();
            }
        },
        error => {
            console.error("Notes listener error:", error);

            setMessage(
                myNotesMessage,
                "Could not load notes. Check Firestore Rules.",
                true
            );
        }
    );
}

noteForm?.addEventListener("submit", async event => {
    event.preventDefault();

    if (!currentUser) {
        setMessage(
            formMessage,
            "Please log in to publish a note.",
            true
        );
        return;
    }

    const title = noteTitle.value.trim();
    const content = noteContent.value.trim();

    if (!title || !content) {
        setMessage(
            formMessage,
            "Enter both a title and note content.",
            true
        );
        return;
    }

    publishButton.disabled = true;
    publishButton.textContent = "Publishing...";

    try {
        await addDoc(collection(db, "studyNotes"), {
            title,
            content,
            authorId: currentUser.uid,
            authorName: profileName.textContent || "Learner",
            authorEmail: currentUser.email || "",
            shared: true,
            createdAt: serverTimestamp()
        });

        noteForm.reset();

        setMessage(formMessage, "Your note has been published.");
    } catch (error) {
        console.error("Publish note error:", error);

        setMessage(
            formMessage,
            "Unable to publish note. Check Firestore Rules.",
            true
        );
    } finally {
        publishButton.disabled = false;
        publishButton.textContent = "Publish Note";
    }
});

/* ==============================================
   NOTE ACTIONS
============================================== */

myNotesList?.addEventListener("click", async event => {
    const button = event.target.closest("[data-note-action]");

    if (!button || !currentUser) return;

    const noteId = button.dataset.noteId;
    const action = button.dataset.noteAction;

    const note =
        allNotes.find(item => item.id === noteId) ||
        savedNotes.find(item => item.id === noteId);

    if (action === "save") {
        const nowSaved = toggleSaved(noteId);

        renderNotes();

        if (currentTab === "saved") {
            await loadSavedNotes();
        }

        setMessage(
            myNotesMessage,
            nowSaved
                ? "Note saved."
                : "Note removed from Saved Notes."
        );

        return;
    }

    if (action === "share" && note) {
        const text = `${note.title || ""}\n\n${note.content || ""}`;

        try {
            await navigator.clipboard.writeText(text);
            alert("Note copied. You can share it with others.");
        } catch {
            prompt("Copy your note:", text);
        }

        return;
    }

    if (
        action === "delete" &&
        note &&
        note.authorId === currentUser.uid
    ) {
        if (!confirm("Delete this note permanently?")) return;

        try {
            await deleteDoc(doc(db, "studyNotes", noteId));

            setMessage(myNotesMessage, "Note deleted.");

            const key = getSavedKey();

            if (key) {
                const remaining = getSavedNotes().filter(
                    id => id !== noteId
                );

                localStorage.setItem(
                    key,
                    JSON.stringify(remaining)
                );
            }

            await loadSavedNotes();
        } catch (error) {
            console.error(error);

            setMessage(
                myNotesMessage,
                "Unable to delete this note.",
                true
            );
        }
    }
});

/* ==============================================
   NOTE TABS
============================================== */

document.querySelectorAll(".notes-tab").forEach(button => {
    button.addEventListener("click", async () => {
        currentTab = button.dataset.tab;

        document.querySelectorAll(".notes-tab").forEach(tab => {
            tab.classList.toggle("active", tab === button);
        });

        renderNotes();

        if (currentTab === "saved" && currentUser) {
            await loadSavedNotes();
        }
    });
});

$("#savedNotesButton")?.addEventListener("click", async () => {
    currentTab = "saved";

    document.querySelectorAll(".notes-tab").forEach(tab => {
        tab.classList.toggle(
            "active",
            tab.dataset.tab === "saved"
        );
    });

    renderNotes();

    if (currentUser) {
        await loadSavedNotes();
    }

    document.querySelector(".notes-heading")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});

/* ==============================================
   SETTINGS
============================================== */

$("#settingsButton")?.addEventListener("click", () => {
    if (!settingsDialog) return;

    if (settingsDialog.open) {
        settingsDialog.close();
    } else {
        settingsDialog.showModal();
    }
});

$("#closeSettings")?.addEventListener("click", () => {
    settingsDialog?.close();
});

$("#editNameButton")?.addEventListener("click", editDisplayName);
$("#settingsEditName")?.addEventListener("click", editDisplayName);

$("#settingsCommunity")?.addEventListener("click", () => {
    window.location.href = "community.html";
});

$("#themeSelect")?.addEventListener("change", event => {
    const theme = event.target.value;

    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
});

$("#changePasswordButton")?.addEventListener(
    "click",
    async () => {
        if (!currentUser?.email) {
            setMessage(
                settingsMessage,
                "No email address is available.",
                true
            );
            return;
        }

        try {
            await sendPasswordResetEmail(auth, currentUser.email);

            setMessage(
                settingsMessage,
                "Password reset email sent."
            );
        } catch (error) {
            console.error(error);
            setMessage(settingsMessage, error.message, true);
        }
    }
);

$("#logoutButton")?.addEventListener("click", async () => {
    try {
        await signOut(auth);

        settingsDialog?.close();

        // Stay on Profile; do not redirect.
        currentUser = null;
        loginButton.hidden = false;
        $("#settingsButton").hidden = true;

        setMessage(profileMessage, "You have logged out.");
    } catch (error) {
        console.error(error);
        setMessage(settingsMessage, "Logout failed.", true);
    }
});

$("#deleteAccountButton")?.addEventListener(
    "click",
    async () => {
        if (!currentUser) return;

        const confirmed = confirm(
            "Delete your account permanently? This action cannot be undone."
        );

        if (!confirmed) return;

        try {
            const userToDelete = currentUser;
            const uid = userToDelete.uid;

            const ownNotes = await getDocs(query(
                collection(db, "studyNotes"),
                where("authorId", "==", uid)
            ));

            for (const item of ownNotes.docs) {
                await deleteDoc(item.ref);
            }

            await deleteDoc(doc(db, "userProfiles", uid));

            await deleteUser(userToDelete);

            const key = `zunioSavedNotes_${uid}`;
            localStorage.removeItem(key);

            currentUser = null;
            savedNotes = [];
            allNotes = [];

            loginButton.hidden = false;
            $("#settingsButton").hidden = true;

            settingsDialog?.close();

            setMessage(profileMessage, "Account deleted.");
        } catch (error) {
            console.error("Delete account error:", error);

            if (error.code === "auth/requires-recent-login") {
                setMessage(
                    settingsMessage,
                    "For security, log in again before deleting your account.",
                    true
                );
            } else {
                setMessage(
                    settingsMessage,
                    error.message || "Unable to delete account.",
                    true
                );
            }
        }
    }
);

$("#copyUserId")?.addEventListener("click", async () => {
    if (!currentUser) return;

    try {
        await navigator.clipboard.writeText(currentUser.uid);
        setMessage(profileMessage, "User ID copied.");
    } catch {
        prompt("Copy your User ID:", currentUser.uid);
    }
});

/* ==============================================
   AUTH INITIALIZATION
============================================== */

applyTheme(localStorage.getItem(THEME_KEY) || "system");

onAuthStateChanged(auth, async user => {
    currentUser = user;
    savedLoadVersion++;

    if (unsubscribeNotes) {
        unsubscribeNotes();
        unsubscribeNotes = null;
    }

    if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
    }

    if (unsubscribeFollowers) {
        unsubscribeFollowers();
        unsubscribeFollowers = null;
    }

    allNotes = [];
    savedNotes = [];
    followingIds = [];

    if (!user) {
        profileName.textContent = "Welcome to Zunio";
        profileEmail.textContent = "";
        userIdElement.textContent = "Not logged in";
        profileAvatar.textContent = "Z";

        followersCount.textContent = "0";
        followingCount.textContent = "0";
        notesCount.textContent = "0";

        myNotesList.innerHTML = "";

        myNotesEmpty.hidden = false;
        myNotesEmpty.textContent = "Log in to view your notes.";

        followResult.innerHTML = "";

        loginButton.hidden = false;
        $("#settingsButton").hidden = true;

        renderNotes();

        return;
    }

    loginButton.hidden = true;
    $("#settingsButton").hidden = false;

    try {
        await ensureProfile(user);

        if (currentUser?.uid !== user.uid) return;

        await loadProfile(user);

        if (currentUser?.uid !== user.uid) return;

        listenToMyNotes(user);

        await refreshFollowCounts();

        if (currentUser?.uid !== user.uid) return;

        await startFollowListeners(user);

        // Fetch saved notes from every author by document ID.
        await loadSavedNotes();
    } catch (error) {
        console.error("Profile initialization error:", error);

        setMessage(
            profileMessage,
            "Could not load profile. Check Firebase configuration and Firestore Rules.",
            true
        );
    }
});
