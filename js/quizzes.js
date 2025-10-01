// js/quizzes.js

import { state } from './state.js';
import { elements } from './ui.js';
import { triggerAutoSave } from './storage.js';

let currentQuizCardIndex = 0;

export function initQuizzes() {
    // Event delegation for the list of subjects
    elements.quizSubjectList.addEventListener('click', (e) => {
        const item = e.target.closest('.quiz-subject-item');
        if (item) {
            selectQuizSubject(Number(item.dataset.id));
        }
    });

    // Event delegation for the main quiz content area
    elements.quizContent.addEventListener('click', (e) => {
        const target = e.target;
        // Add a new flashcard
        if (target.id === 'addFlashcardBtn') {
            e.preventDefault();
            addFlashcard();
        }
        // Start the quiz
        if (target.id === 'startQuizBtn') {
            startQuiz();
        }
        // Flip the card
        if (target.closest('.flashcard')) {
            target.closest('.flashcard').classList.toggle('is-flipped');
        }
        // Go to the next card
        if (target.id === 'nextCardBtn') {
            nextCard();
        }
        // End the quiz session
        if (target.id === 'endQuizBtn') {
            renderQuizSubjectView();
        }
        // Restart the quiz
        if (target.id === 'restartQuizBtn') {
            startQuiz();
        }
        // Back to management view from results
        if (target.id === 'backToMgmtBtn') {
            renderQuizSubjectView();
        }
        // Edit or delete a flashcard from the list
        const actionButton = target.closest('.flashcard-list-actions button');
        if (actionButton) {
            const index = Number(actionButton.dataset.index);
            if (actionButton.dataset.action === 'edit') {
                editFlashcard(index);
            } else if (actionButton.dataset.action === 'delete') {
                deleteFlashcard(index);
            }
        }
    });
}

export function renderQuizUI() {
    const list = elements.quizSubjectList;
    if(!list) return;
    list.innerHTML = '';
    const quizSubjects = state.subjects.filter(s => s.flashcards && s.flashcards.length > 0);
    if (!quizSubjects.length) {
        list.innerHTML = '<p class="text-muted" style="padding: 1rem;">No subjects with flashcards.</p>';
        return;
    }
    
    quizSubjects.forEach((s) => {
        const div = document.createElement("div");
        div.className = "quiz-subject-item" + (state.currentQuizSubjectId === s.id ? " active" : "");
        div.dataset.id = s.id;
        div.innerHTML = `<span class="subject-name">${s.name}</span>`;
        list.appendChild(div);
    });
}

function selectQuizSubject(id) {
    state.currentQuizSubjectId = id;
    const subject = state.subjects.find(s => s.id === id);
    if (!subject) return;

    elements.quizSubjectTitle.innerText = subject.name;
    elements.quizContent.style.display = 'flex';
    renderQuizSubjectView();
    renderQuizUI(); // Re-render list to show active state
}

function renderQuizSubjectView() {
    const subject = state.subjects.find(s => s.id === state.currentQuizSubjectId);
    const hasCards = subject.flashcards && subject.flashcards.length > 0;
    
    let cardsListHTML = subject.flashcards.map((card, index) => `
        <div class="flashcard-list-item">
            <p><strong>Front:</strong> ${card.front}</p>
            <div class="flashcard-list-actions">
                <button data-action="edit" data-index="${index}">✏️</button>
                <button data-action="delete" data-index="${index}">🗑️</button>
            </div>
        </div>
    `).join('');

    elements.quizContent.innerHTML = `
        <div class="quiz-management-view">
            <form id="flashcardForm">
                <h4>New Flashcard</h4>
                <textarea id="flashcardFront" placeholder="Front" required></textarea>
                <textarea id="flashcardBack" placeholder="Back" required></textarea>
                <button id="addFlashcardBtn" type="submit" class="primary-btn">+ Add Card</button>
                ${hasCards ? `<button type="button" id="startQuizBtn" class="secondary-btn" style="margin-top: 10px;">Start Quiz</button>` : ''}
            </form>
            <div id="existingFlashcardsContainer">
                <h4>Existing Cards (${subject.flashcards.length})</h4>
                <div id="existingFlashcardsList">
                    ${subject.flashcards.length > 0 ? cardsListHTML : '<p class="text-muted">No flashcards yet.</p>'}
                </div>
            </div>
        </div>
    `;
}

function addFlashcard() {
    const subject = state.subjects.find(s => s.id === state.currentQuizSubjectId);
    const front = document.getElementById('flashcardFront').value.trim();
    const back = document.getElementById('flashcardBack').value.trim();
    if (!front || !back || !subject) return;

    if (!subject.flashcards) subject.flashcards = [];
    subject.flashcards.push({ front, back });
    renderQuizSubjectView();
    triggerAutoSave();
}

function deleteFlashcard(index) {
    const subject = state.subjects.find(s => s.id === state.currentQuizSubjectId);
    if (!subject || !confirm('Are you sure you want to delete this flashcard?')) return;
    
    subject.flashcards.splice(index, 1);
    renderQuizSubjectView();
    triggerAutoSave();
}

function editFlashcard(index) {
    const subject = state.subjects.find(s => s.id === state.currentQuizSubjectId);
    if (!subject) return;

    const card = subject.flashcards[index];
    const newFront = prompt('Edit the front of the card:', card.front);
    if (newFront === null) return;
    const newBack = prompt('Edit the back of the card:', card.back);
    if (newBack === null) return;

    card.front = newFront.trim();
    card.back = newBack.trim();
    renderQuizSubjectView();
    triggerAutoSave();
}

function startQuiz() {
    currentQuizCardIndex = 0;
    renderQuizCard();
}

function renderQuizCard() {
    const subject = state.subjects.find(s => s.id === state.currentQuizSubjectId);
    const cards = subject.flashcards;
    if (currentQuizCardIndex >= cards.length) {
        return renderQuizResults();
    }
    const card = cards[currentQuizCardIndex];
    const progressPercent = ((currentQuizCardIndex + 1) / cards.length) * 100;

    elements.quizContent.innerHTML = `
        <div class="quiz-session-view">
            <div id="quiz-progress-bar-container"><div id="quiz-progress-bar" style="width: ${progressPercent}%"></div></div>
            <div id="quiz-card-counter">${currentQuizCardIndex + 1} / ${cards.length}</div>
            <div class="flashcard">
                <div class="flashcard-face flashcard-face--front">${card.front}</div>
                <div class="flashcard-face flashcard-face--back">${card.back}</div>
            </div>
            <div class="quiz-session-controls">
                <button id="nextCardBtn" class="primary-btn">Next Card</button>
            </div>
            <button id="endQuizBtn" class="secondary-btn" style="margin-top: 24px;">End Quiz</button>
        </div>
    `;
}

function renderQuizResults() {
    elements.quizContent.innerHTML = `
        <div class="quiz-results-view">
            <h2>Quiz Complete!</h2>
            <p>You have reviewed all the flashcards for this subject.</p>
            <button id="restartQuizBtn" class="primary-btn">Restart Quiz</button>
            <button id="backToMgmtBtn" class="secondary-btn">Back to Management</button>
        </div>
    `;
}

function nextCard() {
    currentQuizCardIndex++;
    renderQuizCard();
}