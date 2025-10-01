// js/dashboard.js

import { state } from './state.js';
import { elements } from './ui.js';

export function renderDashboard() {
    const upcomingTasks = state.tasks
        .filter(t => t.dueDate && new Date(t.dueDate) >= new Date() && t.status !== 'done')
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)) // Sort by soonest
        .slice(0, 5); // Show top 5

    let tasksHTML = upcomingTasks.map(t => `
        <div class="task-item">
            <span class="task-name">${t.text}</span>
            <span class="task-due-date">Due: ${t.dueDate}</span>
        </div>
    `).join('');

    if (!tasksHTML) {
        tasksHTML = '<p class="text-muted">No upcoming tasks due.</p>';
    }

    elements.dashboard.innerHTML = `
        <h2>Dashboard</h2>
        <div class="dashboard-grid">
            <div class="dashboard-main">
                <div class="dashboard-card dashboard-tasks">
                    <h3>Upcoming Tasks</h3>
                    <div id="dashboardTaskList">${tasksHTML}</div>
                </div>
            </div>
            <div class="dashboard-side">
                </div>
        </div>
    `;
}