// js/state.js
export const state = {
    subjects: [],
    notes: [],
    tasks: [],

    currentSubjectId: null,
    currentNoteId: null,
    currentQuizSubjectId: null,

    gapiInited: false,
    gisInited: false,
    tokenClient: null,
    appDataFileId: null,
    isSaving: false,
};

export function resetState() {
    state.subjects = [];
    state.notes = [];
    state.tasks = [];
    state.currentSubjectId = null;
    state.currentNoteId = null;
    state.currentQuizSubjectId = null;
    state.appDataFileId = null;
}