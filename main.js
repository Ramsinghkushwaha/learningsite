// js/main.js
import { elements, openTab, closeAllActionMenus, resetUI } from './ui.js';
import { initAuth } from './auth.js';
import { initStorage } from './storage.js';
import { initSubjects, renderSubjects } from './subjects.js';
import { initNotes, renderNotesList } from './notes.js';
import { initTasks, renderTasks } from './tasks.js';
import { initQuizzes, renderQuizUI } from './quizzes.js';
import { initPomodoro } from './pomodoro.js';
import { renderDashboard } from './dashboard.js';
import { renderProgress } from './progress.js';

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initStorage();
    initSubjects();
    initNotes();
    initTasks();
    initQuizzes();
    initPomodoro();

    elements.navButtons.addEventListener('click', (event) => {
        const button = event.target.closest('.nav-tab-btn');
        if (button) {
            const tabId = button.dataset.tab;
            openTab(tabId);
            if (tabId === 'dashboard') renderDashboard();
            if (tabId === 'progress') renderProgress();
            if (tabId === 'quizzes') renderQuizUI();
        }
    });

    window.addEventListener('click', () => closeAllActionMenus());

    renderAll();
});


// --- GLOBAL RENDER FUNCTION ---
export function renderAll() {
    renderSubjects();
    renderNotesList();
    renderTasks();
    renderQuizUI();
    renderDashboard();
    renderProgress();
    resetUI();
}