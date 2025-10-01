// js/notes.js
import { state } from './state.js';
import { elements, toggleActionMenu } from './ui.js';
import { triggerAutoSave } from './storage.js';

export function initNotes() {
    elements.addNoteBtn.addEventListener('click', addNote);
    elements.deleteCurrentNoteBtn.addEventListener('click', deleteCurrentNote);

    elements.notesEditor.addEventListener('input', () => {
        if (state.currentNoteId) {
            const note = state.notes.find(n => n.id === state.currentNoteId);
            if (note) {
                note.content = elements.notesEditor.innerHTML;
                triggerAutoSave();
            }
        }
    });

    elements.noteToolbar.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (button && button.dataset.command) {
            document.execCommand(button.dataset.command, false, button.dataset.value || null);
            elements.notesEditor.focus();
        }
    });
    
    elements.notesList.addEventListener('click', (e) => {
        const target = e.target;
        const noteItem = target.closest('.note-item');
        if (!noteItem) return;

        const noteId = Number(noteItem.dataset.id);
        const actionButton = target.closest('.actions-menu-item');

        if (target.closest('.note-name-container')) {
            selectNote(noteId);
        } else if (target.classList.contains('actions-menu-btn')) {
            toggleActionMenu(e);
        } else if (target.classList.contains('note-toggle')) {
            toggleNoteExpansion(noteId, e);
        } else if (actionButton) {
            const action = actionButton.dataset.action;
            if (action === 'add-sub') addSubNote(noteId, e);
            if (action === 'edit') editNoteTitle(noteId, e);
            if (action === 'delete') deleteNote(noteId, e);
        }
    });
}

function addNote() {
    const title = elements.noteTitleInput.value.trim();
    if (!title) return;
    const newNote = { id: Date.now(), parentId: null, title, content: `<p>New note: <b>${title}</b></p>`, isExpanded: true };
    state.notes.push(newNote);
    elements.noteTitleInput.value = '';
    renderNotesList();
    selectNote(newNote.id);
    triggerAutoSave();
}

function addSubNote(parentId, event) {
    event.stopPropagation();
    const title = prompt("Enter title for sub-note:");
    if (!title || !title.trim()) return;
    const parentNote = state.notes.find(n => n.id === parentId);
    if(parentNote) parentNote.isExpanded = true;
    const newNote = { id: Date.now(), parentId, title: title.trim(), content: `<p>New sub-note: <b>${title.trim()}</b></p>`, isExpanded: true };
    state.notes.push(newNote);
    renderNotesList();
    selectNote(newNote.id);
    triggerAutoSave();
}

function selectNote(id) {
    state.currentNoteId = id;
    const note = state.notes.find(n => n.id === id);
    if (!note) {
        elements.currentNoteTitle.innerText = "Select a note";
        elements.notesEditor.innerHTML = '';
        elements.noteEditorContainer.style.display = 'none';
        return;
    };
    elements.currentNoteTitle.innerText = note.title;
    elements.notesEditor.innerHTML = note.content;
    elements.noteEditorContainer.style.display = 'flex';
    renderNotesList();
}

function deleteCurrentNote() {
    if (state.currentNoteId) deleteNote(state.currentNoteId, null);
}

function deleteNote(id, event) {
    if (event) event.stopPropagation();
    const noteToDelete = state.notes.find(n => n.id === id);
    if (!noteToDelete || !confirm(`Delete "${noteToDelete.title}" and all its sub-notes?`)) return;

    const allIdsToDelete = new Set([id]);
    const findChildren = (parentId) => {
        state.notes.forEach(note => {
            if (note.parentId === parentId) {
                allIdsToDelete.add(note.id);
                findChildren(note.id);
            }
        });
    };
    findChildren(id);
    state.notes = state.notes.filter(n => !allIdsToDelete.has(n.id));
    if (allIdsToDelete.has(state.currentNoteId)) {
        state.currentNoteId = null;
        selectNote(null);
    }
    renderNotesList();
    triggerAutoSave();
}

function editNoteTitle(id, event) {
    event.stopPropagation();
    const note = state.notes.find(n => n.id === id);
    const newTitle = prompt("New title:", note.title);
    if (newTitle && newTitle.trim()) {
        note.title = newTitle.trim();
        if (state.currentNoteId === id) elements.currentNoteTitle.innerText = note.title;
        renderNotesList();
        triggerAutoSave();
    }
}

function toggleNoteExpansion(noteId, event) {
    event.stopPropagation();
    const note = state.notes.find(n => n.id === noteId);
    if (note) {
        note.isExpanded = !note.isExpanded;
        renderNotesList();
        triggerAutoSave();
    }
}

export function renderNotesList() {
    const list = elements.notesList;
    list.innerHTML = '';
    const notesByParent = state.notes.reduce((acc, note) => {
        const parentId = note.parentId || 'root';
        if (!acc[parentId]) acc[parentId] = [];
        acc[parentId].push(note);
        return acc;
    }, {});
    
    function buildNoteTree(parentId, level) {
        const children = notesByParent[parentId] || [];
        children.forEach((note) => {
            const hasChildren = (notesByParent[note.id] || []).length > 0;
            const item = document.createElement('div');
            item.className = 'note-item' + (note.id === state.currentNoteId ? ' active' : '');
            item.style.paddingLeft = `${level * 20}px`;
            item.dataset.id = note.id;

            const toggleIcon = hasChildren 
                ? `<span class="note-toggle ${note.isExpanded ? 'expanded' : ''}"></span>`
                : '<span class="note-toggle-placeholder"></span>';

            item.innerHTML = `
                <div class="note-name-container">
                    ${toggleIcon}
                    <span class="note-name">${note.title}</span>
                </div>
                <div class="actions-container">
                    <button class="actions-menu-btn">⋮</button>
                    <div class="actions-menu">
                        <button class="actions-menu-item" data-action="add-sub">Add Sub-note</button>
                        <button class="actions-menu-item" data-action="edit">Edit Title</button>
                        <button class="actions-menu-item" data-action="delete">Delete</button>
                    </div>
                </div>`;
            list.appendChild(item);

            if (hasChildren && note.isExpanded) {
                buildNoteTree(note.id, level + 1);
            }
        });
    }
    buildNoteTree('root', 0);
}