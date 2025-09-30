// js/ui.js
export const elements = {
    // Navigation & Auth
    navButtons: document.querySelector('.nav-buttons'),
    authButton: document.getElementById('authButton'),
    syncButton: document.getElementById('syncButton'),

    // Subjects Tab
    subjectNameInput: document.getElementById('subjectNameInput'),
    addSubjectBtn: document.getElementById('addSubjectBtn'),
    subjectList: document.getElementById('subjectList'),
    subjectTitle: document.getElementById('subjectTitle'),
    lectureControls: document.getElementById('lectureControls'),
    lectureUrlInput: document.getElementById('lectureUrlInput'),
    addLectureBtn: document.getElementById('addLectureBtn'),
    lectureHr: document.getElementById('lectureHr'),
    lectureList: document.getElementById('lectureList'),

    // Notes Tab
    noteTitleInput: document.getElementById('noteTitleInput'),
    addNoteBtn: document.getElementById('addNoteBtn'),
    notesList: document.getElementById('notesList'),
    currentNoteTitle: document.getElementById('currentNoteTitle'),
    noteEditorContainer: document.getElementById('noteEditorContainer'),
    noteToolbar: document.querySelector('.note-toolbar'),
    notesEditor: document.getElementById('notesEditor'),
    deleteCurrentNoteBtn: document.getElementById('deleteCurrentNoteBtn'),

    // Tasks Tab
    taskInput: document.getElementById('taskInput'),
    taskDueDate: document.getElementById('taskDueDate'),
    taskPriority: document.getElementById('taskPriority'),
    addTaskBtn: document.getElementById('addTaskBtn'),
    taskColumns: {
        todo: document.getElementById('todo-tasks'),
        inprogress: document.getElementById('inprogress-tasks'),
        done: document.getElementById('done-tasks')
    },

    // Quizzes Tab
    quizSubjectList: document.getElementById('quizSubjectList'),
    quizSubjectTitle: document.getElementById('quizSubjectTitle'),
    quizContent: document.getElementById('quizContent'),

    // Other Tabs
    dashboard: document.getElementById('dashboard'),
    progress: document.getElementById('progress'),
};

export function openTab(tabId) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId)?.classList.add('active');
    document.querySelector(`.nav-tab-btn[data-tab="${tabId}"]`)?.classList.add('active');
}

export function toggleActionMenu(event) {
    event.stopPropagation();
    
    // FIXED: This now correctly finds the button that was clicked,
    // instead of the container the event listener is on.
    const button = event.target.closest('.actions-menu-btn');
    if (!button) return;

    const menu = button.nextElementSibling;
    if (!menu) return;

    // Check if the menu is already shown. If so, and we are clicking the same button, it will be closed.
    const isAlreadyOpen = menu.classList.contains('show');
    
    closeAllActionMenus();
    
    // If it was not already open, show it.
    if(!isAlreadyOpen) {
        menu.classList.add('show');
    }

    if (menu.classList.contains('show')) {
        const listContainer = button.closest('.list-scroll-area, .task-board, .lecture-list, .pomodoro-timer');
        if (!listContainer) return;
        const menuRect = menu.getBoundingClientRect();
        const containerRect = listContainer.getBoundingClientRect();
        if (menuRect.bottom > containerRect.bottom && menuRect.top > containerRect.top + menuRect.height) {
            menu.classList.add('opens-up');
        } else {
            menu.classList.remove('opens-up');
        }
    } else {
        menu.classList.remove('opens-up');
    }
}

export function closeAllActionMenus() {
    document.querySelectorAll('.actions-menu.show').forEach(menu => {
        menu.classList.remove('show');
        menu.classList.remove('opens-up');
    });
}

export function resetUI() {
    elements.subjectTitle.innerText = "Select a subject";
    elements.lectureControls.style.display = "none";
    elements.lectureHr.style.display = "none";
    elements.lectureList.innerHTML = "";
    elements.currentNoteTitle.innerText = "Select a note to get started";
    if (elements.notesEditor) elements.notesEditor.innerHTML = '';
    elements.noteEditorContainer.style.display = 'none';
}