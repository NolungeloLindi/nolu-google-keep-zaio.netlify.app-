/* =========================================
DOM ELEMENTS
========================================= */

const addNoteButton = document.getElementById("addNoteButton");
const noteModal = document.getElementById("noteModal");
const closeModal = document.getElementById("closeModal");
const cancelButton = document.getElementById("cancelButton");

const noteForm = document.getElementById("noteForm");
const noteTitle = document.getElementById("noteTitle");
const noteContent = document.getElementById("noteContent");

const notesContainer = document.getElementById("notesContainer");
const emptyState = document.getElementById("emptyState");

const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");

const noteCount = document.getElementById("noteCount");
const sectionTitle = document.getElementById("sectionTitle");

const darkModeButton = document.getElementById("darkModeButton");
const sidebar = document.getElementById("sidebar");
const menuButton = document.getElementById("menuButton");

const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");

const navItems = document.querySelectorAll(".nav-item");

/* =========================================
APPLICATION STATE
========================================= */

function loadNotes() {
    try {
        const stored = localStorage.getItem("keepNotes");
        const parsed = stored ? JSON.parse(stored) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

let notes = loadNotes();

let currentView = "notes";
let editingNoteId = null;

/* =========================================
SAVE NOTES
========================================= */

function saveNotes() {
    localStorage.setItem(
        "keepNotes",
        JSON.stringify(notes)
    );
}

/* =========================================
OPEN MODAL
========================================= */

function openModal(note = null) {
    noteModal.classList.add("show");

    if (note) {
        editingNoteId = note.id;

        document.getElementById("modalTitle").textContent =
            "Edit Note";

        noteTitle.value = note.title;
        noteContent.value = note.content;
    } else {
        editingNoteId = null;

        document.getElementById("modalTitle").textContent =
            "Create Note";

        noteForm.reset();
    }

    setTimeout(() => {
        noteTitle.focus();
    }, 100);
}

/* =========================================
CLOSE MODAL
========================================= */

function closeNoteModal() {
    noteModal.classList.remove("show");
    editingNoteId = null;
    noteForm.reset();
}

/* =========================================
CREATE / UPDATE NOTE
========================================= */

function saveNote(event) {
    event.preventDefault();

    const title = noteTitle.value.trim();
    const content = noteContent.value.trim();

    if (!content) {
        showToast("Please write something first.");
        noteContent.focus();
        return;
    }

    /* Edit existing note */
    if (editingNoteId) {
        const note = notes.find(
            note => note.id === editingNoteId
        );

        if (note) {
            note.title = title;
            note.content = content;
            note.updatedAt = new Date().toISOString();
        }

        showToast("Note updated.");
    } else {
        /* Create new note */
        const newNote = {
            id: Date.now().toString(),
            title: title,
            content: content,
            archived: false,
            trashed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        notes.unshift(newNote);
        showToast("Note created.");
    }

    saveNotes();
    closeNoteModal();
    renderNotes();
}

/* =========================================
DISPLAY NOTES
========================================= */

function renderNotes() {
    notesContainer.innerHTML = "";

    let filteredNotes = notes.filter(note => {
        if (currentView === "notes") {
            return !note.archived && !note.trashed;
        }

        if (currentView === "archive") {
            return note.archived && !note.trashed;
        }

        if (currentView === "trash") {
            return note.trashed;
        }

        return false;
    });

    /* Search */
    const searchTerm =
        searchInput.value.trim().toLowerCase();

    if (searchTerm) {
        filteredNotes = filteredNotes.filter(note => {
            const title = (note.title || "").toLowerCase();
            const content = (note.content || "").toLowerCase();

            return (
                title.includes(searchTerm) ||
                content.includes(searchTerm)
            );
        });
    }

    /* Display empty state */
    if (filteredNotes.length === 0) {
        emptyState.style.display = "flex";
        updateEmptyMessage(searchTerm);
    } else {
        emptyState.style.display = "none";
    }

    /* Create note cards */
    filteredNotes.forEach(note => {
        const card = createNoteCard(note);
        notesContainer.appendChild(card);
    });

    updateNoteCount(filteredNotes.length);
}

/* =========================================
CREATE NOTE CARD
========================================= */

function createNoteCard(note) {
    const card = document.createElement("article");
    card.className = "note-card";

    const formattedDate =
        new Date(note.updatedAt).toLocaleDateString(
            "en-ZA",
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );

    card.innerHTML = `
        <div>
            ${
                note.title
                    ? `<h2 class="note-title">
                        ${escapeHTML(note.title)}
                       </h2>`
                    : ""
            }

            <p class="note-content">
                ${escapeHTML(note.content)}
            </p>

            <p class="note-date">
                ${formattedDate}
            </p>
        </div>

        <div class="note-actions">
            ${
                currentView !== "trash"
                    ? `
                    <button
                        class="icon-button tooltip"
                        data-action="archive"
                        data-id="${note.id}"
                        data-tooltip="${
                            note.archived
                                ? "Unarchive"
                                : "Archive"
                        }"
                        aria-label="${
                            note.archived
                                ? "Unarchive"
                                : "Archive"
                        }"
                    >
                        <span class="material-icons">
                            ${
                                note.archived
                                    ? "unarchive"
                                    : "archive"
                            }
                        </span>
                    </button>
                    `
                    : ""
            }

            ${
                currentView !== "trash"
                    ? `
                    <button
                        class="icon-button tooltip"
                        data-action="delete"
                        data-id="${note.id}"
                        data-tooltip="Move to trash"
                        aria-label="Move to trash"
                    >
                        <span class="material-icons">
                            delete
                        </span>
                    </button>
                    `
                    : `
                    <button
                        class="icon-button tooltip"
                        data-action="restore"
                        data-id="${note.id}"
                        data-tooltip="Restore"
                        aria-label="Restore"
                    >
                        <span class="material-icons">
                            restore
                        </span>
                    </button>

                    <button
                        class="icon-button tooltip"
                        data-action="permanent-delete"
                        data-id="${note.id}"
                        data-tooltip="Delete permanently"
                        aria-label="Delete permanently"
                    >
                        <span class="material-icons">
                            delete_forever
                        </span>
                    </button>
                    `
            }
        </div>
    `;

    /* Double click card to edit */
    card.addEventListener("dblclick", () => {
        if (currentView !== "trash") {
            openModal(note);
        }
    });

    return card;
}

/* =========================================
HANDLE NOTE ACTIONS
========================================= */

notesContainer.addEventListener("click", event => {
    const button =
        event.target.closest("[data-action]");

    if (!button) {
        return;
    }

    const action = button.dataset.action;
    const id = button.dataset.id;

    const note = notes.find(
        note => note.id === id
    );

    if (!note && action !== "permanent-delete") {
        return;
    }

    /* Archive / Unarchive */
    if (action === "archive") {
        note.archived = !note.archived;

        saveNotes();
        renderNotes();

        showToast(
            note.archived
                ? "Note archived."
                : "Note unarchived."
        );
    }

    /* Move to trash */
    if (action === "delete") {
        note.trashed = true;
        note.archived = false;

        saveNotes();
        renderNotes();

        showToast("Note moved to trash.");
    }

    /* Restore */
    if (action === "restore") {
        note.trashed = false;

        saveNotes();
        renderNotes();

        showToast("Note restored.");
    }

    /* Permanent delete */
    if (action === "permanent-delete") {
        const confirmed =
            confirm(
                "Delete this note permanently?"
            );

        if (!confirmed) {
            return;
        }

        notes = notes.filter(
            storedNote => storedNote.id !== id
        );

        saveNotes();
        renderNotes();

        showToast("Note permanently deleted.");
    }
});

/* =========================================
UPDATE EMPTY MESSAGE
========================================= */

function updateEmptyMessage(searchTerm = "") {
    const heading =
        emptyState.querySelector("h2");

    const paragraph =
        emptyState.querySelector("p");

    if (searchTerm) {
        heading.textContent = "No matching notes";
        paragraph.textContent =
            "Try a different search term.";
        return;
    }

    if (currentView === "notes") {
        heading.textContent = "No notes yet";
        paragraph.textContent =
            "Create your first note by clicking \"Take a note...\"";
    }

    if (currentView === "archive") {
        heading.textContent = "No archived notes";
        paragraph.textContent =
            "Archived notes will appear here.";
    }

    if (currentView === "trash") {
        heading.textContent = "Trash is empty";
        paragraph.textContent =
            "Deleted notes will appear here.";
    }
}

/* =========================================
NOTE COUNT
========================================= */

function updateNoteCount(count) {
    noteCount.textContent =
        `${count} ${count === 1 ? "note" : "notes"}`;
}

/* =========================================
CHANGE VIEW
========================================= */

function changeView(view) {
    currentView = view;

    navItems.forEach(item => {
        item.classList.toggle(
            "active",
            item.dataset.view === view
        );
    });

    if (view === "notes") {
        sectionTitle.textContent = "Notes";
    } else if (view === "archive") {
        sectionTitle.textContent = "Archive";
    } else if (view === "trash") {
        sectionTitle.textContent = "Trash";
    }

    renderNotes();
}

/* =========================================
SEARCH
========================================= */

searchInput.addEventListener(
    "input",
    () => {
        clearSearch.style.display =
            searchInput.value
                ? "flex"
                : "none";

        renderNotes();
    }
);

clearSearch.addEventListener(
    "click",
    () => {
        searchInput.value = "";
        clearSearch.style.display = "none";
        searchInput.focus();
        renderNotes();
    }
);

/* =========================================
DARK MODE
========================================= */

function toggleDarkMode() {
    document.body.classList.toggle(
        "dark-mode"
    );

    const darkModeEnabled =
        document.body.classList.contains(
            "dark-mode"
        );

    localStorage.setItem(
        "darkMode",
        darkModeEnabled
    );

    const icon =
        darkModeButton.querySelector(
            ".material-icons"
        );

    icon.textContent =
        darkModeEnabled
            ? "light_mode"
            : "dark_mode";
}

/* Load saved dark mode */
function loadDarkMode() {
    const darkMode =
        localStorage.getItem("darkMode");

    if (darkMode === "true") {
        document.body.classList.add(
            "dark-mode"
        );

        darkModeButton.querySelector(
            ".material-icons"
        ).textContent = "light_mode";
    }
}

/* =========================================
SIDEBAR TOGGLE
========================================= */

menuButton.addEventListener(
    "click",
    () => {
        sidebar.classList.toggle("hidden");
    }
);

/* =========================================
TOAST MESSAGE
========================================= */

let toastTimer;

function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

/* =========================================
ESCAPE HTML
Prevents HTML injection when displaying
user-created note content.
========================================= */

function escapeHTML(text) {
    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}

/* =========================================
EVENT LISTENERS
========================================= */

addNoteButton.addEventListener(
    "click",
    () => openModal()
);

closeModal.addEventListener(
    "click",
    closeNoteModal
);

cancelButton.addEventListener(
    "click",
    closeNoteModal
);

noteForm.addEventListener(
    "submit",
    saveNote
);

darkModeButton.addEventListener(
    "click",
    toggleDarkMode
);

/* Navigation */
navItems.forEach(item => {
    item.addEventListener(
        "click",
        () => {
            changeView(
                item.dataset.view
            );
        }
    );
});

/* Close modal by clicking outside */
noteModal.addEventListener(
    "click",
    event => {
        if (event.target === noteModal) {
            closeNoteModal();
        }
    }
);

/* Close modal with Escape */
document.addEventListener(
    "keydown",
    event => {
        if (
            event.key === "Escape" &&
            noteModal.classList.contains("show")
        ) {
            closeNoteModal();
        }
    }
);

/* =========================================
INITIALIZE APPLICATION
========================================= */

loadDarkMode();
renderNotes();
