/**
 * Frontend API Service Layer
 * Connects the PWA client with the dedicated Node.js backend (/api/v1/...)
 * Automatically handles JWT Authorization headers and graceful offline fallbacks.
 */

const API_BASE = '/api/v1';
const TOKEN_KEY = 'veayos_auth_token';

export const apiService = {
  // Store / Retrieve JWT
  getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || null;
    } catch {
      return null;
    }
  },

  setToken(token) {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch {}
  },

  clearToken() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
  },

  // Base request helper with headers
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({ success: false, error: 'Non-JSON response' }));

    if (!response.ok) {
      const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  },

  // Backend Health Check
  async checkHealth() {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        return await res.json();
      }
      return { status: 'offline' };
    } catch {
      return { status: 'offline' };
    }
  },

  // --- Authentication Routes ---
  async loginWithGoogle({ email, credential, token, role = 'doctor' }) {
    const data = await this.request('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ email, credential, token, role })
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  },

  async loginWithEmail(email, role = 'doctor') {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, role })
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  },

  async verifyToken(token) {
    return await this.request('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token: token || this.getToken() })
    });
  },

  async getMe() {
    return await this.request('/auth/me');
  },

  async getWhitelist() {
    return await this.request('/auth/whitelist');
  },

  // --- Repertory AI Proxy ---
  async analyzeRepertory(symptoms, apiKey = null) {
    const headers = {};
    if (apiKey) {
      headers['x-gemini-key'] = apiKey;
    }
    return await this.request('/repertory/analyze', {
      method: 'POST',
      headers,
      body: JSON.stringify(symptoms)
    });
  },

  // --- Patients ---
  async getPatients(search = '') {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return await this.request(`/patients${qs}`);
  },

  async getPatient(id) {
    return await this.request(`/patients/${id}`);
  },

  async createPatient(patientData) {
    return await this.request('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData)
    });
  },

  async updatePatient(id, patientData) {
    return await this.request(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patientData)
    });
  },

  async deletePatient(id) {
    return await this.request(`/patients/${id}`, {
      method: 'DELETE'
    });
  },

  // --- Live Queue ---
  async getQueue(status = '') {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return await this.request(`/queue${qs}`);
  },

  async addToQueue(queueData) {
    return await this.request('/queue', {
      method: 'POST',
      body: JSON.stringify(queueData)
    });
  },

  async updateQueueStatus(id, status) {
    return await this.request(`/queue/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
  },

  async removeFromQueue(id) {
    return await this.request(`/queue/${id}`, {
      method: 'DELETE'
    });
  },

  // --- Prescriptions ---
  async getPrescriptions(patientId = '') {
    const qs = patientId ? `?patientId=${encodeURIComponent(patientId)}` : '';
    return await this.request(`/prescriptions${qs}`);
  },

  async savePrescription(prescriptionData) {
    return await this.request('/prescriptions', {
      method: 'POST',
      body: JSON.stringify(prescriptionData)
    });
  },

  // --- Lab Tests ---
  async getTests(patientId = '') {
    const qs = patientId ? `?patientId=${encodeURIComponent(patientId)}` : '';
    return await this.request(`/tests${qs}`);
  },

  async createTest(testData) {
    return await this.request('/tests', {
      method: 'POST',
      body: JSON.stringify(testData)
    });
  },

  // --- Medicines ---
  async getMedicines(search = '') {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return await this.request(`/medicines${qs}`);
  },

  // --- Settings ---
  async getSettings() {
    return await this.request('/settings');
  },

  async updateClinicSettings(settings) {
    return await this.request('/settings/clinic', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  },

  // --- WhatsApp / Aisensy ---
  async sendWhatsApp({ patient, prescription, customMessage }) {
    return await this.request('/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify({ patient, prescription, customMessage })
    });
  },

  async testWhatsAppConnection(apiKey, senderNumber) {
    return await this.request('/whatsapp/test', {
      method: 'POST',
      body: JSON.stringify({ apiKey, senderNumber })
    });
  }
};
