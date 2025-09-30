// js/progress.js

import { state } from './state.js';
import { elements } from './ui.js';

export function renderProgress() {
    const allLectures = state.subjects.reduce((acc, sub) => acc.concat(sub.lectures), []);
    const totalLectures = allLectures.length;
    const completedLectures = allLectures.filter(l => l.completed).length;
    const tasksDone = state.tasks.filter(t => t.status === 'done').length;

    const overallCompletion = totalLectures > 0 ? (completedLectures / totalLectures) * 100 : 0;

    let subjectProgressHTML = state.subjects
        .filter(s => s.parentId === null) // Only show top-level subjects
        .map(s => {
            const total = s.lectures.length;
            const completed = s.lectures.filter(l => l.completed).length;
            const percentage = total > 0 ? (completed / total) * 100 : 0;
            return `
                <div class="subject-progress-item">
                    <h4>${s.name} (${completed}/${total})</h4>
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" style="width:${percentage}%;"></div>
                        <span class="progress-bar-label">${Math.round(percentage)}%</span>
                    </div>
                </div>
            `;
        }).join('');

    if (!subjectProgressHTML) {
        subjectProgressHTML = '<p class="text-muted">No subjects added yet.</p>';
    }

    elements.progress.innerHTML = `
        <h2>Progress</h2>
        <div class="progress-container">
            <div class="progress-summary">
                <div class="summary-card">
                    <div class="count">${state.subjects.length}</div>
                    <div class="label">Subjects</div>
                </div>
                <div class="summary-card">
                    <div class="count">${totalLectures}</div>
                    <div class="label">Lectures</div>
                </div>
                <div class="summary-card">
                    <div class="count">${tasksDone}</div>
                    <div class="label">Tasks Done</div>
                </div>
            </div>
            <h3>Overall Lecture Completion</h3>
            <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width:${overallCompletion}%;"></div>
                <span class="progress-bar-label">${completedLectures}/${totalLectures} (${Math.round(overallCompletion)}%)</span>
            </div>
            <hr>
            <h3>Progress By Subject</h3>
            <div id="subjectProgressList">${subjectProgressHTML}</div>
        </div>
    `;
}