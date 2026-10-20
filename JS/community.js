
/* =========================================
   ZUNIO — COMMUNITY
   File: JS/community.js
   Shared Saved Notes with Profile
========================================= */

import { auth } from "./firebase-config.js";

import {
    getFirestore,
    collection,
    query,
    orderBy,
    onSnapshot,
    updateDoc,
    doc,
    arrayUnion,
    arrayRemove
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

const db = getFirestore(auth.app);

const notesFeed = document.getElementById("notesFeed");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const feedMessage = document.getElementById("feedMessage");
const emptyState = document.getElementById("emptyState");

let allNotes = [];
let currentUser = null;

function getSavedKey() {
    return currentUser
        ? `zunioSavedNotes_${currentUser.uid}`
        : null;
}

function getSavedNotes() {
    const key = getSavedKey();
    if (!key) return [];

    try {
        const value = JSON.parse(localStorage.getItem(key) || "[]");

        if (!Array.isArray(value)) return [];

        // Supports both old formats:
        // ["noteId"] and [{ id: "noteId" }]
        return value
            .map(item => typeof item === "string" ? item : item?.id)
            .filter(id => typeof id === "string" && id.length > 0);
    } catch {
        return [];
    }
}

function saveSavedNotes(ids) {
    const key = getSavedKey();
    if (!key) return;

    localStorage.setItem(
        key,
        JSON.stringify([...new Set(ids)])
    );
}

function isSaved(noteId) {
    return getSavedNotes().includes(noteId);
}

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function formatDate(timestamp) {
    if (!timestamp?.toDate) return "Recently";

    return timestamp.toDate().toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function renderNote(note) {
    const likedBy = Array.isArray(note.likedBy) ? note.likedBy : [];
    const isLiked = currentUser
        ? likedBy.includes(currentUser.uid)
        : false;

    const saved = isSaved(note.id);

    const title = escapeHTML(note.title || "Untitled note");
    const content = escapeHTML(note.content || "");
    const author = escapeHTML(note.authorName || "Zunio learner");
    const date = formatDate(note.createdAt);

    let attachment = "";

    if (note.fileUrl && note.fileType === "image") {
        attachment = `
            <img
                class="note-image"
                src="${escapeHTML(note.fileUrl)}"
                alt="Study attachment"
                loading="lazy"
            >
        `;
    } else if (note.fileUrl && note.fileType === "pdf") {
        attachment = `
            <div class="pdf-card">
                <div class="pdf-icon">PDF</div>
                <div style="flex:1;min-width:0">
                    <strong>${escapeHTML(note.fileName || "Study attachment")}</strong>
                    <p class="muted">PDF study document</p>
                    <a
                        href="${escapeHTML(note.fileUrl)}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="orange-text"
                    >Open PDF ↗</a>
                </div>
            </div>
        `;
    }

    return `
        <article class="note-card" data-note-id="${escapeHTML(note.id)}">
            <div style="display:flex;align-items:center;gap:10px">
                <div class="avatar" style="width:42px;height:42px">
                    ${escapeHTML(author.charAt(0).toUpperCase())}
                </div>
                <div style="min-width:0;flex:1">
                    <strong>${author}</strong>
                    <div class="muted">${date}</div>
                </div>
                <span class="orange-text">Study Note</span>
            </div>

            <h3 style="margin-top:18px">${title}</h3>

            ${content ? `<p style="white-space:pre-wrap">${content}</p>` : ""}

            ${attachment}

            <div class="note-actions">
                <button
                    type="button"
                    data-action="like"
                    data-id="${escapeHTML(note.id)}"
                    class="${isLiked ? "active" : ""}"
                >
                    ${isLiked ? "♥ Liked" : "♡ Like"} (${likedBy.length})
                </button>

                <button
                    type="button"
                    data-action="save"
                    data-id="${escapeHTML(note.id)}"
                    class="${saved ? "active" : ""}"
                >
                    ${saved ? "✓ Saved" : "☆ Save"}
                </button>

                <button
                    type="button"
                    data-action="share"
                    data-id="${escapeHTML(note.id)}"
                >
                    ↗ Share
                </button>
            </div>
        </article>
    `;
}

function renderNotes() {
    if (!notesFeed) return;

    const searchTerm = (searchInput?.value || "").trim().toLowerCase();
    const sortOrder = sortSelect?.value || "newest";

    const filtered = allNotes.filter(note => {
        const searchableText = [
            note.title,
            note.content,
            note.authorName,
            note.fileName
        ].join(" ").toLowerCase();

        return searchableText.includes(searchTerm);
    });

    filtered.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;

        return sortOrder === "oldest"
            ? timeA - timeB
            : timeB - timeA;
    });

    notesFeed.innerHTML = filtered.map(renderNote).join("");

    if (feedMessage) {
        feedMessage.textContent = filtered.length
            ? `${filtered.length} study note${filtered.length === 1 ? "" : "s"}`
            : "";
    }

    if (emptyState) {
        emptyState.hidden = filtered.length !== 0;
    }
}

searchInput?.addEventListener("input", renderNotes);
sortSelect?.addEventListener("change", renderNotes);

notesFeed?.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const { action, id } = button.dataset;
    const note = allNotes.find(item => item.id === id);

    if (!note) return;

    if (action === "save") {
        if (!currentUser) {
            alert("Please log in to save notes.");
            return;
        }

        const saved = getSavedNotes();
        const exists = saved.includes(id);

        const updated = exists
            ? saved.filter(noteId => noteId !== id)
            : [...saved, id];

        saveSavedNotes(updated);
        renderNotes();

        return;
    }

    if (action === "share") {
        const shareURL = new URL(
            `community.html#note-${encodeURIComponent(id)}`,
            window.location.href
        ).href;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: note.title || "Zunio Study Note",
                    url: shareURL
                });
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(shareURL);
                alert("Note link copied!");
            } else {
                prompt("Copy this note link:", shareURL);
            }
        } catch (error) {
            if (error.name !== "AbortError") {
                alert("Unable to share this note right now.");
            }
        }

        return;
    }

    if (action === "like") {
        if (!currentUser) {
            alert("Please log in to like notes.");
            return;
        }

        const likedBy = Array.isArray(note.likedBy)
            ? note.likedBy
            : [];

        const alreadyLiked = likedBy.includes(currentUser.uid);

        try {
            await updateDoc(doc(db, "studyNotes", id), {
                likedBy: alreadyLiked
                    ? arrayRemove(currentUser.uid)
                    : arrayUnion(currentUser.uid)
            });
        } catch (error) {
            console.error("Like error:", error);
            alert("Could not update like. Check your connection and Firebase rules.");
        }
    }
});

onAuthStateChanged(auth, user => {
    currentUser = user;

    // Normalize any saved data from the older shared key
    // when the user has no account-specific list yet.
    if (user) {
        const accountKey = getSavedKey();
        const existing = localStorage.getItem(accountKey);

        if (existing === null) {
            try {
                const old = JSON.parse(
                    localStorage.getItem("zunioSavedNotes") || "[]"
                );

                const ids = Array.isArray(old)
                    ? old.map(item => typeof item === "string" ? item : item?.id)
                        .filter(id => typeof id === "string")
                    : [];

                saveSavedNotes(ids);
            } catch {
                saveSavedNotes([]);
            }
        }
    }

    renderNotes();
});

const notesQuery = query(
    collection(db, "studyNotes"),
    orderBy("createdAt", "desc")
);

onSnapshot(notesQuery, snapshot => {
    allNotes = snapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
    }));

    if (feedMessage) feedMessage.textContent = "";
    renderNotes();
}, error => {
    console.error("Loading notes failed:", error);

    if (feedMessage) {
        feedMessage.textContent =
            "Could not load notes. Check your Firestore setup and security rules.";
    }
});
