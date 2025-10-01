// js/storage.js

import { state } from './state.js';
import { elements } from './ui.js';
import { renderAll } from './main.js';

const APP_DATA_FILE_NAME = 'decodePlusData.json';
let autoSaveTimer = null;

export function initStorage() {
    elements.syncButton.addEventListener('click', () => saveDataToDrive(false));
}

export function triggerAutoSave() {
    if (gapi.client.getToken() === null || state.isSaving) return;
    
    // Set icon to spinner for auto-save, as per original code
    elements.syncButton.innerHTML = `<svg class="sync-icon sync-icon-spinning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`;
    elements.syncButton.disabled = true;

    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
        saveDataToDrive(true); // Call save with isAutoSave = true
    }, 2500);
}

export async function saveDataToDrive(isAutoSave = false) {
    if (gapi.client.getToken() === null) {
        if (!isAutoSave) alert("Please log in before saving.");
        return;
    }
    if (state.isSaving) return;

    state.isSaving = true;
    clearTimeout(autoSaveTimer);

    // If this is a MANUAL save, show the upload icon, as per original code
    if (!isAutoSave) {
        elements.syncButton.innerHTML = `<svg class="sync-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;
        elements.syncButton.disabled = true;
    }

    const allData = {
        subjects: state.subjects,
        notes: state.notes,
        tasks: state.tasks
    };
    const fileContent = JSON.stringify(allData, null, 2);

    try {
        if (!state.appDataFileId) {
            state.appDataFileId = await findFileId();
        }
        
        // Logic for creating/updating the file in Google Drive
        const method = state.appDataFileId ? 'PATCH' : 'POST';
        const path = state.appDataFileId
            ? `/upload/drive/v3/files/${state.appDataFileId}`
            : '/upload/drive/v3/files';

        const metadata = { name: APP_DATA_FILE_NAME, mimeType: 'application/json', appProperties: { isDecodePlusDataFile: 'true' } };
        if (!state.appDataFileId) metadata.parents = ['root'];

        const boundary = '-------314159265358979323846';
        const delimiter = `\r\n--${boundary}\r\n`;
        const close_delim = `\r\n--${boundary}--`;
        const multipartRequestBody = delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata) + delimiter + 'Content-Type: application/json\r\n\r\n' + fileContent + close_delim;

        const response = await gapi.client.request({
            path, method, params: { uploadType: 'multipart' },
            headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
            body: multipartRequestBody
        });

        if (!state.appDataFileId) state.appDataFileId = response.result.id;
        if (!isAutoSave) alert('Data saved to Google Drive!');
        
        // Set icon to success checkmark, as per original code
        elements.syncButton.innerHTML = `<svg class="sync-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><polyline points="16 16 18 18 22 14"/></svg>`;

    } catch (error) {
        if (!isAutoSave) alert('Error saving data. Please check the console.');
        console.error('Save Error:', error);
        // Set icon to error X, as per original code
        elements.syncButton.innerHTML = `<svg class="sync-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><line x1="19" y1="13" x2="15" y2="17"/><line x1="15" y1="13" x2="19" y2="17"/></svg>`;
    } finally {
        state.isSaving = false;
        elements.syncButton.disabled = false;
    }
}

export async function loadDataFromDrive() {
    // Set icon to spinner for loading, as per original code
    elements.syncButton.innerHTML = `<svg class="sync-icon sync-icon-spinning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`;
    elements.syncButton.disabled = true;

    state.appDataFileId = await findFileId();

    if (!state.appDataFileId) {
        console.log('No data file found. Starting fresh.');
        renderAll();
        // Set icon to success checkmark after attempting to load
        elements.syncButton.innerHTML = `<svg class="sync-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><polyline points="16 16 18 18 22 14"/></svg>`;
        elements.syncButton.disabled = false;
        return;
    }
    try {
        const response = await gapi.client.drive.files.get({ fileId: state.appDataFileId, alt: 'media' });
        const data = response.result;

        state.subjects = (data.subjects || []).map((s, i) => ({ ...s, id: s.id || Date.now() + i, parentId: s.parentId || null, flashcards: s.flashcards || [] }));
        state.notes = (data.notes || []).map((n, i) => ({ ...s, id: n.id || Date.now() + i, parentId: n.parentId || null }));
        state.tasks = data.tasks || [];

        console.log('Data successfully loaded from Google Drive!');
    } catch (error) {
        alert('Could not load data from Google Drive.');
        console.error('Load Error:', error);
    } finally {
        renderAll();
        // Set icon to success checkmark after loading
        elements.syncButton.innerHTML = `<svg class="sync-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><polyline points="16 16 18 18 22 14"/></svg>`;
        elements.syncButton.disabled = false;
    }
}

async function findFileId() {
    try {
        const response = await gapi.client.drive.files.list({
            q: "appProperties has { key='isDecodePlusDataFile' and value='true' } and trashed=false",
            spaces: 'drive',
            fields: 'files(id, name)'
        });
        const files = response.result.files;
        return (files && files.length > 0) ? files[0].id : null;
    } catch (error) {
        console.error('Find File Error:', error);
        return null;
    }
}