/**
 * Central Firebase App & Cloud Firestore Service
 * Supports configuration via:
 * 1. Vite environment variables (VITE_FIREBASE_API_KEY, etc.)
 * 2. User-provided configuration in Settings (stored in localStorage)
 * 3. Fallback to offline local mode if unconfigured or network is unavailable
 * 4. Multi-tab offline persistence via persistentLocalCache & persistentMultipleTabManager
 */

import { initializeApp, getApps, getApp, deleteApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  limit,
  writeBatch,
  terminate
} from 'firebase/firestore';

export const FIREBASE_STORAGE_KEY = 'veayos_firebase_config';

// Safely retrieve environment configuration across Vite, browser, and Node test runner
export function getEnvFirebaseConfig() {
  const env = (typeof import.meta !== 'undefined' && import.meta.env)
    ? import.meta.env
    : (typeof process !== 'undefined' && process.env)
      ? process.env
      : {};

  return {
    apiKey: env.VITE_FIREBASE_API_KEY || env.FIREBASE_API_KEY || '',
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || env.FIREBASE_AUTH_DOMAIN || '',
    projectId: env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || '',
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: env.VITE_FIREBASE_APP_ID || env.FIREBASE_APP_ID || ''
  };
}

// Retrieve currently active config (User localStorage override takes precedence over .env)
export function getFirebaseConfig() {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(FIREBASE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && (parsed.projectId || parsed.apiKey)) {
          return {
            apiKey: parsed.apiKey || '',
            authDomain: parsed.authDomain || '',
            projectId: parsed.projectId || '',
            storageBucket: parsed.storageBucket || '',
            messagingSenderId: parsed.messagingSenderId || '',
            appId: parsed.appId || '',
            source: 'settings'
          };
        }
      }
    }
  } catch {}

  const envConfig = getEnvFirebaseConfig();
  if (envConfig.projectId || envConfig.apiKey) {
    return {
      ...envConfig,
      source: 'env'
    };
  }

  return {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    source: 'none'
  };
}

// Parse Firebase config from raw JSON, JS code snippet, or env-style text
export function parseFirebaseConfigInput(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // 1. Try direct JSON parsing
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object') {
      return {
        apiKey: parsed.apiKey || parsed.VITE_FIREBASE_API_KEY || parsed.FIREBASE_API_KEY || '',
        authDomain: parsed.authDomain || parsed.VITE_FIREBASE_AUTH_DOMAIN || parsed.FIREBASE_AUTH_DOMAIN || '',
        projectId: parsed.projectId || parsed.VITE_FIREBASE_PROJECT_ID || parsed.FIREBASE_PROJECT_ID || '',
        storageBucket: parsed.storageBucket || parsed.VITE_FIREBASE_STORAGE_BUCKET || parsed.FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: parsed.messagingSenderId || parsed.VITE_FIREBASE_MESSAGING_SENDER_ID || parsed.FIREBASE_MESSAGING_SENDER_ID || '',
        appId: parsed.appId || parsed.VITE_FIREBASE_APP_ID || parsed.FIREBASE_APP_ID || ''
      };
    }
  } catch {}

  // 2. Extract using regex supporting JS objects (single/double quotes), env formats, comments, or script tags
  const result = {};
  const fieldPatterns = [
    { key: 'apiKey', regex: /(?:apiKey|(?:VITE_)?FIREBASE_API_KEY)\s*[:=]\s*["']?([^"',\s}]+)["']?/i },
    { key: 'authDomain', regex: /(?:authDomain|(?:VITE_)?FIREBASE_AUTH_DOMAIN)\s*[:=]\s*["']?([^"',\s}]+)["']?/i },
    { key: 'projectId', regex: /(?:projectId|(?:VITE_)?FIREBASE_PROJECT_ID)\s*[:=]\s*["']?([^"',\s}]+)["']?/i },
    { key: 'storageBucket', regex: /(?:storageBucket|(?:VITE_)?FIREBASE_STORAGE_BUCKET)\s*[:=]\s*["']?([^"',\s}]+)["']?/i },
    { key: 'messagingSenderId', regex: /(?:messagingSenderId|(?:VITE_)?FIREBASE_MESSAGING_SENDER_ID)\s*[:=]\s*["']?([^"',\s}]+)["']?/i },
    { key: 'appId', regex: /(?:appId|(?:VITE_)?FIREBASE_APP_ID)\s*[:=]\s*["']?([^"',\s}]+)["']?/i }
  ];

  for (const { key, regex } of fieldPatterns) {
    const match = trimmed.match(regex);
    if (match && match[1]) {
      result[key] = match[1].trim();
    }
  }

  if (result.projectId || result.apiKey) {
    return {
      apiKey: result.apiKey || '',
      authDomain: result.authDomain || '',
      projectId: result.projectId || '',
      storageBucket: result.storageBucket || '',
      messagingSenderId: result.messagingSenderId || '',
      appId: result.appId || ''
    };
  }

  return null;
}

let appInstance = null;
let dbInstance = null;
let connectionStatus = 'unconfigured'; // 'unconfigured' | 'connecting' | 'connected' | 'error' | 'offline'
let connectionMessage = 'Firebase Cloud Database is not configured.';
const statusListeners = new Set();

function notifyStatus(status, message) {
  connectionStatus = status;
  connectionMessage = message;
  const isConnected = isFirebaseConnected();
  statusListeners.forEach(listener => {
    try {
      listener({ status, message, isConnected, config: getFirebaseConfig() });
    } catch (e) {
      console.error('Error notifying Firebase status listener:', e);
    }
  });
}

/**
 * Initialize or reinitialize Firebase App & Firestore with multi-tab offline persistence
 */
export function initFirebase(customConfig = null) {
  const config = customConfig || getFirebaseConfig();

  // Check if minimum required keys are present
  if (!config.projectId || !config.apiKey) {
    notifyStatus('unconfigured', 'Firebase credentials not configured. Running in offline local mode.');
    return { success: false, reason: 'unconfigured' };
  }

  // Check network status
  const isOnline = typeof navigator === 'undefined' || navigator.onLine !== false;
  if (!isOnline) {
    notifyStatus('offline', 'Device is offline. Running in offline local mode with local persistence.');
    return { success: false, reason: 'offline' };
  }

  try {
    notifyStatus('connecting', `Connecting to Firebase project ${config.projectId}...`);

    // Clean up existing db and apps before initializing with new or updated credentials
    if (dbInstance) {
      try {
        terminate(dbInstance).catch(() => {});
      } catch {}
      dbInstance = null;
    }
    const existingApps = getApps();
    for (const app of existingApps) {
      try {
        deleteApp(app).catch(() => {});
      } catch {}
    }

    appInstance = initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId
    });

    // Initialize Firestore with IndexedDB multi-tab offline persistence
    try {
      dbInstance = initializeFirestore(appInstance, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      });
    } catch {
      // Fallback to default getFirestore if persistence was already configured on app
      dbInstance = getFirestore(appInstance);
    }

    notifyStatus('connected', `Connected to Cloud Firestore (${config.projectId}). Live cloud synchronization active.`);

    return { success: true, app: appInstance, db: dbInstance };
  } catch (err) {
    const msg = `Firebase initialization error: ${err.message}`;
    notifyStatus('error', msg);
    return { success: false, error: err.message };
  }
}

/**
 * Test connectivity with Firebase Firestore with timeout and guaranteed cleanup
 */
export async function testFirebaseConnection(configToTest = null) {
  const config = configToTest || getFirebaseConfig();
  if (!config.projectId || !config.apiKey) {
    return {
      success: false,
      message: 'Please provide both Project ID and API Key to test connection.'
    };
  }

  let testApp = null;
  try {
    // Use an isolated temporary test app name to avoid collisions
    const testAppName = `veayos-test-${Date.now()}`;
    testApp = initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId
    }, testAppName);

    const testDb = getFirestore(testApp);

    // Perform a lightweight query check on authorized_users with a 10-second timeout
    const testQuery = query(collection(testDb, 'authorized_users'), limit(1));
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timed out after 10 seconds. Check network or Firebase project credentials.')), 10000)
    );

    await Promise.race([getDocs(testQuery), timeoutPromise]);

    return {
      success: true,
      message: `Successfully connected to Firebase Firestore project "${config.projectId}". Cloud DB is reachable!`
    };
  } catch (err) {
    // If error is permission-denied, it proves Firestore project was reached and active!
    if (err.code === 'permission-denied') {
      return {
        success: true,
        message: `Connected to Firebase project "${config.projectId}", but Firestore security rules restricted read access. Please ensure your Firestore rules permit access.`
      };
    }

    return {
      success: false,
      message: `Failed to connect: ${err.message || 'Unknown network error'}`
    };
  } finally {
    if (testApp) {
      try {
        await deleteApp(testApp);
      } catch {}
    }
  }
}

/**
 * Save user config to localStorage and initialize
 */
export function saveFirebaseConfig(config) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(FIREBASE_STORAGE_KEY, JSON.stringify(config));
    }
  } catch (e) {
    console.error('Failed to save Firebase config to localStorage:', e);
  }

  return initFirebase(config);
}

/**
 * Clear custom config and reset to unconfigured
 */
export async function clearFirebaseConfig() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(FIREBASE_STORAGE_KEY);
    }
    if (dbInstance) {
      try {
        await terminate(dbInstance);
      } catch {}
      dbInstance = null;
    }
    const apps = getApps();
    for (const app of apps) {
      try {
        await deleteApp(app);
      } catch {}
    }
  } catch {}

  appInstance = null;
  dbInstance = null;
  notifyStatus('unconfigured', 'Firebase configuration cleared. App reverted to offline local mode.');
}

export function isFirebaseConfigured() {
  const config = getFirebaseConfig();
  return Boolean(config.projectId && config.apiKey);
}

export function isFirebaseConnected() {
  const isOnline = typeof navigator === 'undefined' || navigator.onLine !== false;
  return connectionStatus === 'connected' && dbInstance !== null && isOnline;
}

export function getDb() {
  if (!dbInstance && isFirebaseConfigured()) {
    initFirebase();
  }
  return dbInstance;
}

export function getFirebaseStatus() {
  return {
    status: connectionStatus,
    message: connectionMessage,
    isConnected: isFirebaseConnected(),
    config: getFirebaseConfig()
  };
}

export function onFirebaseStatusChange(callback) {
  statusListeners.add(callback);
  // Emit current status immediately
  callback(getFirebaseStatus());
  return () => statusListeners.delete(callback);
}

// Wire network online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (isFirebaseConfigured()) {
      initFirebase();
    }
  });
  window.addEventListener('offline', () => {
    notifyStatus('offline', 'Device is offline. Running in offline local mode with local persistence.');
  });
}

// Auto-initialize if configured
try {
  if (isFirebaseConfigured()) {
    initFirebase();
  }
} catch (e) {
  console.warn('Auto Firebase initialization skipped:', e);
}
