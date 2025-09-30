// js/tasks.js

import { state } from './state.js';
import { elements, toggleActionMenu } from './ui.js';
import { triggerAutoSave } from './storage.js';
import { renderDashboard } from './dashboard.js';

export function initTasks() {
    elements.addTaskBtn.addEventListener('click', addTask);
    
    // Event delegation for all task columns
    Object.values(elements.taskColumns).forEach(column => {
        column.addEventListener('click', e => {
            const target = e.target;
            const taskCard = target.closest('.task-card');
            if (!taskCard) return;
            
            const taskId = Number(taskCard.dataset.id);
            
            if(target.classList.contains('actions-menu-btn')) {
                toggleActionMenu(e);
            } else if (target.classList.contains('action-edit')) {
                editTask(taskId, e);
            } else if (target.classList.contains('action-delete')) {
                deleteTask(taskId, e);
            } else if (target.dataset.moveTo) {
                moveTask(taskId, target.dataset.moveTo, e);
            }
        });
    });
}

function addTask() {
    const text = elements.taskInput.value.trim();
    if (!text) return;
    state.tasks.push({
        id: Date.now(),
        text,
        dueDate: elements.taskDueDate.value,
        priority: elements.taskPriority.value,
        status: 'todo'
    });
    elements.taskInput.value = '';
    elements.taskDueDate.value = '';
    elements.taskPriority.value = 'low';
    renderDashboard();
    renderTasks();
    triggerAutoSave();
}

function moveTask(id, newStatus, event) {
    if (event) event.stopPropagation();
    const task = state.tasks.find(t => t.id === id);
    if (task) {
        task.status = newStatus;
        renderTasks();
        triggerAutoSave();
    }
}

function deleteTask(id, event) {
    if (event) event.stopPropagation();
    state.tasks = state.tasks.filter(t => t.id !== id);
    renderTasks();
    triggerAutoSave();
}

function editTask(id, event) {
    event.stopPropagation();
    const task = state.tasks.find(t => t.id === id);
    const newText = prompt("New description:", task.text);
    if (newText) {
        task.text = newText;
        renderTasks();
        triggerAutoSave();
    }
}

export function renderTasks() {
    Object.values(elements.taskColumns).forEach(c => c.innerHTML = '');
    state.tasks.forEach(task => {
        const card = document.createElement('div');
        card.className = `task-card priority-${task.priority} ${task.status === 'done' ? 'done' : ''}`;
        card.dataset.id = task.id;
        
        let moves = '';
        if (task.status === 'todo') moves = `<button class="actions-menu-item" data-move-to="inprogress">In Progress</button>`;
        else if (task.status === 'inprogress') moves = `<button class="actions-menu-item" data-move-to="todo">To Do</button><button class="actions-menu-item" data-move-to="done">Done</button>`;
        else moves = `<button class="actions-menu-item" data-move-to="inprogress">In Progress</button>`;
        
        card.innerHTML = `
            <div class="task-card-content"><p>${task.text}</p>${task.dueDate ? `<div class="task-meta">Due: ${task.dueDate}</div>` : ''}</div>
            <div class="actions-container">
                <button class="actions-menu-btn">⋮</button>
                <div class="actions-menu">
                    <button class="actions-menu-item action-edit">Edit</button>
                    ${moves}
                    <button class="actions-menu-item action-delete">Delete</button>
                </div>
            </div>`;
        elements.taskColumns[task.status].appendChild(card);
    });
}
