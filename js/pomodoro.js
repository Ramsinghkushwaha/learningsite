// js/pomodoro.js
import { toggleActionMenu } from './ui.js';

const pomodoroDisplay = document.getElementById('pomodoro-display');
const startBtn = document.getElementById('pomodoro-start');
// FIXED: Get a reference to the main timer container for event listening
const timerContainer = document.querySelector('.pomodoro-timer');

let pomodoroInterval;
let timeLeft = 1500; // in seconds
let currentMode = 'pomodoro';

const modes = {
    pomodoro: 1500,
    shortBreak: 300,
    longBreak: 900
};

export function initPomodoro() {
    startBtn.addEventListener('click', startTimer);
    document.getElementById('pomodoro-reset').addEventListener('click', resetTimer);

    // FIXED: Use a single event listener on the container
    timerContainer.addEventListener('click', (e) => {
        const modeBtn = e.target.closest('button[data-mode]');
        
        // Handle clicks on the mode-switching buttons
        if (modeBtn) {
            setMode(modeBtn.dataset.mode);
        }
        
        // FIXED: Handle clicks on the three-dot menu button
        if (e.target.classList.contains('actions-menu-btn')) {
            toggleActionMenu(e);
        }
    });

    updateDisplay();
}

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    pomodoroDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function setMode(mode) {
    currentMode = mode;
    resetTimer();
    timerContainer.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('active'));
    timerContainer.querySelector(`[data-mode="${mode}"]`)?.classList.add('active');
}

function startTimer() {
    if (startBtn.textContent === 'Start') {
        startBtn.textContent = 'Pause';
        pomodoroInterval = setInterval(() => {
            timeLeft--;
            updateDisplay();
            if (timeLeft <= 0) {
                clearInterval(pomodoroInterval);
                alert("Time's up!");
                const nextMode = currentMode === 'pomodoro' ? 'shortBreak' : 'pomodoro';
                setMode(nextMode);
            }
        }, 1000);
    } else {
        startBtn.textContent = 'Start';
        clearInterval(pomodoroInterval);
    }
}

function resetTimer() {
    clearInterval(pomodoroInterval);
    startBtn.textContent = 'Start';
    timeLeft = modes[currentMode];
    updateDisplay();
}