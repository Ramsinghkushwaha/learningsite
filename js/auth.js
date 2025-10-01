// js/auth.js
import { state, resetState } from './state.js';
import { elements } from './ui.js';
import { loadDataFromDrive } from './storage.js';
import { renderAll } from './main.js';

// IMPORTANT: Replace with your actual Google Cloud Client ID
const CLIENT_ID = '938237083591-f237ct41avtntpk32lmvst40cdlsfebi.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
let authFlowCompleted = false;

export function initAuth() {
    window.onGapiLoaded = () => gapi.load('client', initializeGapiClient);
    window.onGisLoaded = initializeGisClient;
    elements.authButton.addEventListener('click', handleAuthClick);
}

async function initializeGapiClient() {
    await gapi.client.init({ discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'] });
    state.gapiInited = true;
    attemptSilentLogin();
}

function initializeGisClient() {
    state.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: handleAuthResponse,
    });
    state.gisInited = true;
    attemptSilentLogin();
}

function attemptSilentLogin() {
    if (localStorage.getItem("decodePlus_loggedOut") === "true") {
        updateAuthUI(false);
        return;
    }
    if (state.gapiInited && state.gisInited) {
        setTimeout(() => {
            if (!authFlowCompleted) {
                handleAuthResponse({ error: 'timeout' });
            }
        }, 5000);
        state.tokenClient.requestAccessToken({ prompt: 'none' });
    }
}

function handleAuthClick() {
    if (gapi.client.getToken() === null) {
        authFlowCompleted = false;
        elements.authButton.disabled = true;
        elements.authButton.innerText = 'Logging in...';
        state.tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        gapi.client.setToken(null);
        localStorage.setItem("decodePlus_loggedOut", "true");
        updateAuthUI(false);
        resetState();
        renderAll();
        alert('You have been logged out.');
    }
}

async function handleAuthResponse(resp) {
    authFlowCompleted = true;
    if (resp.error) {
        console.log("Auth failed or timed out.");
        updateAuthUI(false);
        return;
    }
    localStorage.removeItem("decodePlus_loggedOut");
    gapi.client.setToken(resp);
    updateAuthUI(true);
    await loadDataFromDrive();
}

function updateAuthUI(isLoggedIn) {
    elements.authButton.innerText = isLoggedIn ? 'Logout' : 'Login';
    elements.authButton.disabled = false;
    elements.syncButton.style.display = isLoggedIn ? 'block' : 'none';
}