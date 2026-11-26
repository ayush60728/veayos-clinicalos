/**
 * Authentication & Access Control Service
 * Strict requirement: Default whitelisted practitioner accounts:
 * 1. vpdixit75@gmail.com (Dr. V. P. Dixit)
 * 2. ved@veayos.com (Dr. Ved Prakash)
 *
 * Synchronized dynamically with Cloud Firestore ('authorized_users' collection)
 * with automatic local fallback for full offline capability.
 */

import { getDb, isFirebaseConnected } from './firebase.js';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';

export const AUTHORIZED_USERS = [
  {
    email: 'vpdixit75@gmail.com',
    name: 'Dr. V. P. Dixit',
    title: 'Senior Homoeopath & Medical Director',
    defaultRole: 'doctor', // 'doctor' | 'staff' | 'admin'
    allowedRoles: ['doctor', 'admin', 'staff'],
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    clinic: 'VEAYOS Homoeopathic Clinic & Research Centre',
    regNo: 'BHMS-REG-84729'
  },
  {
    email: 'ved@veayos.com',
    name: 'Dr. Ved Prakash',
    title: 'Consultant Homoeopath & Operations Lead',
    defaultRole: 'doctor',
    allowedRoles: ['doctor', 'staff', 'admin'],
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80',
    clinic: 'VEAYOS Homoeopathic Clinic & Research Centre',
    regNo: 'MD-HOM-55102'
  }
];

const AUTH_STORAGE_KEY = 'veayos_auth_user';
const AUTHORIZED_USERS_CACHE_KEY = 'veayos_authorized_users';

const authSubscribers = new Set();
let unsubscribeFirestoreListener = null;

export const authService = {
  // Retrieve list of currently authorized practitioners (Firestore dynamic cache + fallback)
  getAuthorizedUsers() {
    try {
      if (typeof localStorage !== 'undefined') {
        const cached = localStorage.getItem(AUTHORIZED_USERS_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch {}

    return AUTHORIZED_USERS;
  },

  // Check if an email is authorized
  isAuthorizedEmail(email) {
    if (!email) return false;
    const cleanEmail = email.trim().toLowerCase();
    const users = this.getAuthorizedUsers();
    return users.some(u => u.email && u.email.trim().toLowerCase() === cleanEmail);
  },

  // Get current logged-in user with strict whitelist re-verification
  getCurrentUser() {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) return null;
      const user = JSON.parse(stored);
      // Verify stored user is strictly an authorized account
      if (this.isAuthorizedEmail(user?.email)) {
        return user;
      }
      this.logout();
      return null;
    } catch {
      return null;
    }
  },

  // Login with email validation
  login(email, role = null) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const authorizedUsers = this.getAuthorizedUsers();
    const authorizedUser = authorizedUsers.find(
      u => u.email && u.email.trim().toLowerCase() === cleanEmail
    );

    if (!authorizedUser) {
      throw new Error(
        `Access Denied: Account '${cleanEmail}' is not authorized. Only whitelisted practitioner accounts are permitted to access VEAYOS Homoeopathy ClinicalOS.`
      );
    }

    const sessionUser = {
      ...authorizedUser,
      currentRole: role || authorizedUser.defaultRole || 'doctor',
      loginTimestamp: new Date().toISOString()
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  },

  // Set active session from backend authentication response
  setSession(user) {
    if (!user || !user.email) return null;
    const cleanEmail = user.email.trim().toLowerCase();
    if (!this.isAuthorizedEmail(cleanEmail)) {
      throw new Error(`Access Denied: Account '${cleanEmail}' is not authorized.`);
    }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    return user;
  },

  // Switch role between Doctor, Staff, Admin (within allowed roles)
  switchRole(newRole) {
    const user = this.getCurrentUser();
    if (!user) throw new Error('No active session.');
    const allowed = user.allowedRoles || ['doctor', 'staff', 'admin'];
    if (!allowed.includes(newRole)) {
      throw new Error(`Role '${newRole}' is not permitted for this account.`);
    }

    user.currentRole = newRole;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    return user;
  },

  // Logout
  logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    try {
      localStorage.removeItem('veayos_auth_token');
    } catch {}
  },

  // --- Dynamic Firestore Sync for Authorized Users ---

  // Update local cache and notify listeners
  updateCachedUsers(users) {
    if (!Array.isArray(users)) return;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(AUTHORIZED_USERS_CACHE_KEY, JSON.stringify(users));
      }
    } catch {}

    authSubscribers.forEach(cb => {
      try {
        cb(users);
      } catch (err) {
        console.error('Auth subscriber notification error:', err);
      }
    });
  },

  // Subscribe to changes in authorized users
  subscribe(callback) {
    authSubscribers.add(callback);
    callback(this.getAuthorizedUsers());
    return () => authSubscribers.delete(callback);
  },

  // Seed default whitelisted practitioners to Cloud Firestore
  async seedDefaultUsersToFirestore() {
    try {
      const db = getDb();
      if (!db || !isFirebaseConnected()) return false;

      for (const user of AUTHORIZED_USERS) {
        const docId = user.email.toLowerCase().replace(/\//g, '_');
        await Promise.race([
          setDoc(doc(db, 'authorized_users', docId), user, { merge: true }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Seed timeout')), 2500))
        ]);
      }
      return true;
    } catch (err) {
      console.warn('Error seeding default users to Firestore:', err.message || err);
      return false;
    }
  },

  // Sync all current authorized users (default and dynamic) to Cloud Firestore
  async syncAllAuthorizedUsersToFirestore() {
    try {
      const db = getDb();
      if (!db || !isFirebaseConnected()) return false;

      const users = this.getAuthorizedUsers();
      for (const user of users) {
        const docId = user.email.toLowerCase().replace(/\//g, '_');
        await Promise.race([
          setDoc(doc(db, 'authorized_users', docId), user, { merge: true }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Sync timeout')), 2500))
        ]);
      }
      return true;
    } catch (err) {
      console.warn('Error syncing authorized users to Firestore:', err.message || err);
      return false;
    }
  },

  // Fetch authorized users from Firestore
  async fetchAuthorizedUsersFromFirestore() {
    try {
      const db = getDb();
      if (!db || !isFirebaseConnected()) return this.getAuthorizedUsers();

      const snapshot = await Promise.race([
        getDocs(collection(db, 'authorized_users')),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Fetch timeout')), 3000))
      ]);
      if (snapshot.empty) {
        // Automatically seed default accounts
        await this.seedDefaultUsersToFirestore();
        return AUTHORIZED_USERS;
      }

      const users = snapshot.docs.map(d => d.data());
      this.updateCachedUsers(users);
      return users;
    } catch (err) {
      console.warn('Error fetching authorized users from Firestore:', err.message || err);
      return this.getAuthorizedUsers();
    }
  },

  // Real-time listener for Firestore authorized_users
  initFirestoreAuthSync() {
    try {
      const db = getDb();
      if (!db || !isFirebaseConnected()) return;

      if (unsubscribeFirestoreListener) {
        unsubscribeFirestoreListener();
      }

      unsubscribeFirestoreListener = onSnapshot(
        collection(db, 'authorized_users'),
        async (snapshot) => {
          if (snapshot.empty) {
            // First time connection: automatically seed default authorized accounts
            await this.seedDefaultUsersToFirestore();
            return;
          }
          const users = snapshot.docs.map(d => d.data());
          this.updateCachedUsers(users);
        },
        (err) => {
          console.warn('Real-time authorized_users sync warning:', err);
        }
      );
    } catch (err) {
      console.warn('Failed to initialize Firestore auth sync:', err);
    }
  },

  // Stop real-time Firestore authorized_users listener
  stopFirestoreAuthSync() {
    if (unsubscribeFirestoreListener) {
      try {
        unsubscribeFirestoreListener();
      } catch {}
      unsubscribeFirestoreListener = null;
    }
  },

  // Dynamically add a new practitioner account to Firestore and local cache
  async addAuthorizedUser(userData) {
    if (!userData?.email) throw new Error('Email is required.');
    const cleanEmail = userData.email.trim().toLowerCase();

    const newUser = {
      email: cleanEmail,
      name: userData.name || 'Practitioner',
      title: userData.title || 'Consultant',
      defaultRole: userData.defaultRole || 'doctor',
      allowedRoles: userData.allowedRoles || ['doctor', 'staff', 'admin'],
      avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'Doctor')}&background=0d9488&color=fff`,
      clinic: userData.clinic || 'VEAYOS Homoeopathic Clinic & Research Centre',
      regNo: userData.regNo || 'REG-PENDING',
      addedAt: new Date().toISOString()
    };

    // Update local cache
    const current = this.getAuthorizedUsers();
    const updated = [newUser, ...current.filter(u => u.email.toLowerCase() !== cleanEmail)];
    this.updateCachedUsers(updated);

    // Sync to Firestore if connected
    try {
      const db = getDb();
      if (db && isFirebaseConnected()) {
        const docId = cleanEmail.replace(/\//g, '_');
        await Promise.race([
          setDoc(doc(db, 'authorized_users', docId), newUser, { merge: true }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Write timeout')), 2500))
        ]);
      }
    } catch (err) {
      console.warn('Firestore add authorized user error:', err.message || err);
    }

    return newUser;
  },

  // Delete an authorized practitioner account
  async deleteAuthorizedUser(email) {
    if (!email) return false;
    const cleanEmail = email.trim().toLowerCase();

    // Prevent deletion of the primary director account
    if (cleanEmail === 'vpdixit75@gmail.com') {
      throw new Error('Default Senior Homoeopath (vpdixit75@gmail.com) cannot be deleted.');
    }

    const current = this.getAuthorizedUsers();
    const updated = current.filter(u => u.email.toLowerCase() !== cleanEmail);
    this.updateCachedUsers(updated);

    try {
      const db = getDb();
      if (db && isFirebaseConnected()) {
        const docId = cleanEmail.replace(/\//g, '_');
        await Promise.race([
          deleteDoc(doc(db, 'authorized_users', docId)),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Delete timeout')), 2500))
        ]);
      }
    } catch (err) {
      console.warn('Firestore delete authorized user error:', err.message || err);
    }

    return true;
  }
};

// Start listening if Firebase is already connected
if (typeof window !== 'undefined') {
  try {
    if (isFirebaseConnected()) {
      authService.initFirestoreAuthSync();
    }
  } catch {}
}
