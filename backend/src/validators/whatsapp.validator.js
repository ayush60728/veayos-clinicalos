/**
 * WhatsApp & Aisensy Gateway Validators for VEAYOS Homoeopathy ClinicalOS
 */

import { dataStore } from '../services/dataStore.js';

export function validateWhatsAppTest(data = {}) {
  const { apiKey } = data;
  const keyToTest = apiKey || dataStore.getAisensySettings().apiKey || process.env.AISENSY_API_KEY;

  if (!keyToTest) {
    return {
      valid: false,
      status: 400,
      message: 'Please provide an Aisensy API key or configure it in server environment.'
    };
  }

  if (keyToTest.length < 8) {
    return {
      valid: false,
      status: 400,
      message: 'Invalid API key format. Key must be at least 8 characters.'
    };
  }

  return { valid: true };
}

export function validateWhatsAppSend(data = {}) {
  const { patient } = data;
  if (!patient || !patient.phone || typeof patient.phone !== 'string' || !patient.phone.trim()) {
    return {
      valid: false,
      status: 400,
      error: 'Patient information with valid phone number is required.'
    };
  }
  return { valid: true };
}

export default {
  validateWhatsAppTest,
  validateWhatsAppSend
};
