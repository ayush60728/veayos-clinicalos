/**
 * Firebase Admin SDK Initialization for VEAYOS Homoeopathy ClinicalOS Backend
 * Provides server-side Firestore access for persistent data storage.
 *
 * Configuration via environment variables:
 * - FIREBASE_SERVICE_ACCOUNT_PATH: Path to service account JSON file
 * - FIREBASE_SERVICE_ACCOUNT_JSON: Inline JSON string for service account
 *
 * Falls back gracefully to in-memory dataStore when Firebase is not configured.
 */

let adminDb = null;
let firebaseInitialized = false;

export async function initFirebaseAdmin() {
  // Skip if already initialized
  if (firebaseInitialized) return adminDb;

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountPath && !serviceAccountJson) {
    console.log('⚠️  Firebase Admin SDK not configured — using in-memory data store.');
    console.log('   Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON in .env to enable Cloud Firestore.');
    firebaseInitialized = true;
    return null;
  }

  try {
    // Dynamic import to avoid hard dependency when not configured
    const { default: admin } = await import('firebase-admin');

    let credential;
    if (serviceAccountPath) {
      const { readFileSync } = await import('fs');
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
      credential = admin.credential.cert(serviceAccount);
    } else if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      credential = admin.credential.cert(serviceAccount);
    }

    if (!admin.apps.length) {
      admin.initializeApp({ credential });
    }

    adminDb = admin.firestore();
    firebaseInitialized = true;
    console.log('✅ Firebase Admin SDK initialized — Cloud Firestore connected.');
    return adminDb;
  } catch (err) {
    console.warn('⚠️  Firebase Admin SDK initialization failed:', err.message);
    console.log('   Falling back to in-memory data store.');
    firebaseInitialized = true;
    return null;
  }
}

export function getAdminDb() {
  return adminDb;
}

export function isFirebaseAdminConnected() {
  return adminDb !== null;
}
