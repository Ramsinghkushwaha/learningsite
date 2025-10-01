// js/subjects.js

import { state } from './state.js';
import { elements, toggleActionMenu } from './ui.js';
import { triggerAutoSave } from './storage.js';

// IMPORTANT: Replace with your YouTube API Key
const YOUTUBE_API_KEY = 'AIzaSyCG7aZrVrM77WQqUPGaJ_upAPNsckJnG6Y';

/**
 * Initializes all event listeners related to the subjects and lectures feature.
 */
export function initSubjects() {
    elements.addSubjectBtn.addEventListener('click', addSubject);
    elements.addLectureBtn.addEventListener('click', addLecture);

    elements.subjectList.addEventListener('click', (e) => {
        const target = e.target;
        const subjectItem = target.closest('.subject-item');
        if (!subjectItem) return;
        const subjectId = Number(subjectItem.dataset.id);
        const actionButton = target.closest('.actions-menu-item');
        if (target.closest('.subject-name-container')) {
            selectSubject(subjectId);
        } else if (target.classList.contains('actions-menu-btn')) {
            toggleActionMenu(e);
        } else if (target.classList.contains('subject-toggle')) {
            toggleSubjectExpansion(subjectId, e);
        } else if (actionButton) {
            const action = actionButton.dataset.action;
            if (action === 'add-sub') addSubSubject(subjectId, e);
            if (action === 'edit') editSubject(subjectId, e);
            if (action === 'delete') deleteSubject(subjectId, e);
            if (action === 'move-up') moveSubject(subjectId, 'up', e);
            if (action === 'move-down') moveSubject(subjectId, 'down', e);
        }
    });

    elements.lectureList.addEventListener('click', e => {
        const target = e.target;
        const lectureCard = target.closest('.lecture-card');
        if(!lectureCard) return;
        const lectureIndex = Number(lectureCard.dataset.index);
        const actionButton = target.closest('button');
        if(!actionButton) return;
        const action = actionButton.dataset.action;
        if (action === 'watch') window.open(actionButton.dataset.url, '_blank');
        if (action === 'toggle-complete') toggleCompleted(lectureIndex);
        if (action === 'edit-title') editLectureTitle(lectureIndex, e);
        if (action === 'move-up') moveLecture(lectureIndex, 'up', e);
        if (action === 'move-down') moveLecture(lectureIndex, 'down', e);
        if (action === 'remove') removeLecture(lectureIndex, e);
        if (action === 'toggle-menu') toggleActionMenu(e);
    });
}

// --- Subject Functions ---

function addSubject() {
    const name = elements.subjectNameInput.value.trim();
    if (!name) return alert("Please enter a subject name.");
    const newSubject = { id: Date.now(), parentId: null, name, lectures: [], flashcards: [], isExpanded: true };
    state.subjects.push(newSubject);
    elements.subjectNameInput.value = "";
    renderSubjects();
    triggerAutoSave();
}

function addSubSubject(parentId, event) {
    event.stopPropagation();
    const name = prompt("Enter title for the sub-subject:");
    if (!name || !name.trim()) return;
    const parentSubject = state.subjects.find(s => s.id === parentId);
    if (parentSubject) parentSubject.isExpanded = true;
    const newSubject = { id: Date.now(), parentId, name: name.trim(), lectures: [], flashcards: [], isExpanded: true };
    state.subjects.push(newSubject);
    renderSubjects();
    selectSubject(newSubject.id);
    triggerAutoSave();
}

function selectSubject(id) {
    state.currentSubjectId = id;
    const subject = state.subjects.find(s => s.id === id);
    if (!subject) {
        elements.subjectTitle.innerText = "Select a subject";
        elements.lectureControls.style.display = "none";
        elements.lectureHr.style.display = "none";
        elements.lectureList.innerHTML = "";
        return;
    }
    elements.subjectTitle.innerText = subject.name;
    elements.lectureControls.style.display = "flex";
    elements.lectureHr.style.display = "block";
    renderSubjects();
    renderLectures();
}

function editSubject(id, event) {
    event.stopPropagation();
    const subject = state.subjects.find(s => s.id === id);
    if (!subject) return;
    const newName = prompt("Enter new name for the subject:", subject.name);
    if (newName && newName.trim() !== "") {
        subject.name = newName.trim();
        if (state.currentSubjectId === id) elements.subjectTitle.innerText = subject.name;
        renderSubjects();
        triggerAutoSave();
    }
}

function deleteSubject(id, event) {
    event.stopPropagation();
    const subjectToDelete = state.subjects.find(s => s.id === id);
    if (!subjectToDelete || !confirm(`Delete "${subjectToDelete.name}" and all sub-subjects?`)) return;
    const allIdsToDelete = new Set([id]);
    const findChildrenRecursive = (parentId) => {
        state.subjects.forEach(subject => {
            if (subject.parentId === parentId) {
                allIdsToDelete.add(subject.id);
                findChildrenRecursive(subject.id);
            }
        });
    };
    findChildrenRecursive(id);
    state.subjects = state.subjects.filter(s => !allIdsToDelete.has(s.id));
    if (allIdsToDelete.has(state.currentSubjectId)) {
        state.currentSubjectId = null;
        selectSubject(null);
    }
    renderSubjects();
    triggerAutoSave();
}

function moveSubject(id, direction, event) {
    event.stopPropagation();
    const subjectIndex = state.subjects.findIndex(s => s.id === id);
    if (subjectIndex === -1) return;
    const subject = state.subjects[subjectIndex];
    const siblings = state.subjects.filter(s => s.parentId === subject.parentId);
    const localIndex = siblings.findIndex(s => s.id === id);
    if (direction === 'up' && localIndex > 0) {
        const swapWith = siblings[localIndex - 1];
        const swapIndex = state.subjects.findIndex(s => s.id === swapWith.id);
        [state.subjects[subjectIndex], state.subjects[swapIndex]] = [state.subjects[swapIndex], state.subjects[subjectIndex]];
    } else if (direction === 'down' && localIndex < siblings.length - 1) {
        const swapWith = siblings[localIndex + 1];
        const swapIndex = state.subjects.findIndex(s => s.id === swapWith.id);
         [state.subjects[subjectIndex], state.subjects[swapIndex]] = [state.subjects[swapIndex], state.subjects[subjectIndex]];
    }
    renderSubjects();
    triggerAutoSave();
}

function toggleSubjectExpansion(subjectId, event) {
    event.stopPropagation();
    const subject = state.subjects.find(s => s.id === subjectId);
    if (subject) {
        subject.isExpanded = !subject.isExpanded;
        renderSubjects();
        triggerAutoSave();
    }
}

export function renderSubjects() {
    const list = elements.subjectList;
    list.innerHTML = "";
    const subjectsByParent = state.subjects.reduce((acc, subject) => {
        const parentId = subject.parentId || 'root';
        if (!acc[parentId]) acc[parentId] = [];
        acc[parentId].push(subject);
        return acc;
    }, {});
    function buildSubjectTree(parentId, level) {
        const children = subjectsByParent[parentId] || [];
        children.forEach((subject, index) => {
            const hasChildren = (subjectsByParent[subject.id] || []).length > 0;
            const isFirst = index === 0;
            const isLast = index === children.length - 1;
            const upButton = !isFirst ? `<button class="actions-menu-item" data-action="move-up">Move Up</button>` : `<button class="actions-menu-item disabled">Move Up</button>`;
            const downButton = !isLast ? `<button class="actions-menu-item" data-action="move-down">Move Down</button>` : `<button class="actions-menu-item disabled">Move Down</button>`;
            const toggleIcon = hasChildren ? `<span class="subject-toggle ${subject.isExpanded ? 'expanded' : ''}"></span>` : '<span class="subject-toggle-placeholder"></span>';
            const item = document.createElement('div');
            item.className = 'subject-item' + (subject.id === state.currentSubjectId ? ' active' : '');
            item.style.paddingLeft = `${level * 20}px`;
            item.dataset.id = subject.id;
            item.innerHTML = `<div class="subject-name-container">${toggleIcon}<span class="subject-name">${subject.name}</span></div><div class="actions-container"><button class="actions-menu-btn">⋮</button><div class="actions-menu"><button class="actions-menu-item" data-action="add-sub">Add Sub-subject</button><button class="actions-menu-item" data-action="edit">Edit Title</button>${upButton}${downButton}<button class="actions-menu-item" data-action="delete">Delete</button></div></div>`;
            list.appendChild(item);
            if (hasChildren && subject.isExpanded) {
                buildSubjectTree(subject.id, level + 1);
            }
        });
    }
    buildSubjectTree('root', 0);
}


// --- Lecture Functions ---

async function addLecture() {
    if (state.currentSubjectId === null) return alert("Please select a subject first.");
    const currentSubject = state.subjects.find(s => s.id === state.currentSubjectId);
    if (!currentSubject) return;
    const url = elements.lectureUrlInput.value.trim();
    if (!url) return;
    if (YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY_HERE' || YOUTUBE_API_KEY === '') {
        return alert('⚠️ YouTube API key is not set. Please open js/subjects.js and paste your key to use this feature.');
    }
    const addButton = elements.addLectureBtn;
    addButton.disabled = true;
    addButton.innerText = 'Fetching...';
    try {
        const playlistId = new URL(url).searchParams.get('list');
        const videoId = new URL(url).searchParams.get('v');
        if (playlistId) {
            const videos = await fetchPlaylistVideos(playlistId);
            currentSubject.lectures.push(...videos);
            alert(`✅ Added ${videos.length} videos!`);
        } else if (videoId) {
            const videoDetails = await fetchVideoDetails(videoId);
            if(videoDetails) currentSubject.lectures.push(videoDetails);
        } else {
            alert('Invalid YouTube URL.');
        }
        elements.lectureUrlInput.value = "";
        renderLectures();
        triggerAutoSave();
    } catch (error) {
        console.error("Error fetching YouTube data:", error);
        alert("An error occurred. Check the console for details.");
    } finally {
        addButton.disabled = false;
        addButton.innerText = '+ Add Content';
    }
}

function renderLectures() {
    const list = elements.lectureList;
    list.innerHTML = "";
    const currentSubject = state.subjects.find(s => s.id === state.currentSubjectId);
    if (!currentSubject || !currentSubject.lectures) return;
    currentSubject.lectures.forEach((lec, i) => {
        const div = document.createElement("div");
        div.className = "lecture-card";
        div.dataset.index = i;
        const moveUpHTML = i > 0 ? `<button class="actions-menu-item" data-action="move-up">Up</button>` : `<button class="actions-menu-item disabled">Up</button>`;
        const moveDownHTML = i < currentSubject.lectures.length - 1 ? `<button class="actions-menu-item" data-action="move-down">Down</button>` : `<button class="actions-menu-item disabled">Down</button>`;
        const videoId = new URL(lec.url).searchParams.get('v');
        div.innerHTML = `
            <div class="lecture-right">
                <div class="lecture-title-header">
                    <h4>${lec.completed ? "✔ " : ""}${lec.title}</h4>
                    <div class="actions-container">
                        <button class="actions-menu-btn" data-action="toggle-menu">⋮</button>
                        <div class="actions-menu">
                            <button class="actions-menu-item" data-action="edit-title">Edit Title</button>
                            ${moveUpHTML} ${moveDownHTML}
                            <button class="actions-menu-item" data-action="remove">Remove</button>
                        </div>
                    </div>
                </div>
                <div class="lecture-actions">
                    <button class="watch-btn" data-action="watch" data-url="${lec.url}">▶ Watch</button>
                    <button class="completed-btn ${lec.completed ? "completed" : ""}" data-action="toggle-complete">${lec.completed ? "✔ Completed" : "Mark Done"}</button>
                </div>
            </div>
            <div class="lecture-left"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>`;
        list.appendChild(div);
    });
}

function toggleCompleted(lectureIndex) {
    const subject = state.subjects.find(s => s.id === state.currentSubjectId);
    if(subject) {
        subject.lectures[lectureIndex].completed = !subject.lectures[lectureIndex].completed;
        renderLectures();
        triggerAutoSave();
    }
}

function removeLecture(lectureIndex, event) {
    if(event) event.stopPropagation();
    const subject = state.subjects.find(s => s.id === state.currentSubjectId);
    if(subject) {
        subject.lectures.splice(lectureIndex, 1);
        renderLectures();
        triggerAutoSave();
    }
}

function editLectureTitle(lectureIndex, event) {
    event.stopPropagation();
    const subject = state.subjects.find(s => s.id === state.currentSubjectId);
    if(subject) {
        const newTitle = prompt("Enter new title:", subject.lectures[lectureIndex].title);
        if (newTitle && newTitle.trim()) {
            subject.lectures[lectureIndex].title = newTitle.trim();
            renderLectures();
            triggerAutoSave();
        }
    }
}

function moveLecture(lectureIndex, direction, event) {
    event.stopPropagation();
    const subject = state.subjects.find(s => s.id === state.currentSubjectId);
    if(subject) {
        const lectures = subject.lectures;
        if (direction === 'up' && lectureIndex > 0) {
            [lectures[lectureIndex], lectures[lectureIndex - 1]] = [lectures[lectureIndex - 1], lectures[lectureIndex]];
        } else if (direction === 'down' && lectureIndex < lectures.length - 1) {
            [lectures[lectureIndex], lectures[lectureIndex + 1]] = [lectures[lectureIndex + 1], lectures[lectureIndex]];
        }
        renderLectures();
        triggerAutoSave();
    }
}

async function fetchPlaylistVideos(playlistId) {
    let allVideos = [];
    let nextPageToken = '';
    const baseUrl = 'https://www.googleapis.com/youtube/v3/playlistItems';

    do {
        const params = new URLSearchParams({
            part: 'snippet',
            maxResults: 50,
            playlistId: playlistId,
            key: YOUTUBE_API_KEY,
            pageToken: nextPageToken,
        });

        const response = await fetch(`${baseUrl}?${params}`);
        if (!response.ok) throw new Error(`YouTube API responded with status: ${response.status}`);
        const data = await response.json();

        const newVideos = data.items
            .filter(item => item.snippet.title !== "Private video" && item.snippet.title !== "Deleted video")
            .map(item => ({
                title: item.snippet.title,
                url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
                completed: false,
            }));

        allVideos = allVideos.concat(newVideos);
        nextPageToken = data.nextPageToken;

    } while (nextPageToken);

    return allVideos;
}

async function fetchVideoDetails(videoId) {
    const baseUrl = 'https://www.googleapis.com/youtube/v3/videos';
    const params = new URLSearchParams({
        part: 'snippet',
        id: videoId,
        key: YOUTUBE_API_KEY,
    });

    const response = await fetch(`${baseUrl}?${params}`);
    if (!response.ok) throw new Error(`YouTube API responded with status: ${response.status}`);
    const data = await response.json();

    if (data.items.length > 0) {
        return {
            title: data.items[0].snippet.title,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            completed: false,
        };
    }
    return null;
}