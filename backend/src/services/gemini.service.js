/**
 * Server-side Gemini AI Service for VEAYOS Homoeopathy ClinicalOS
 * Proxies Gemini API calls to keep API keys secure on the backend.
 * Re-exports repertory analysis from repertoryService for centralized access.
 */

import { analyzeSymptomsWithGeminiOrFallback } from './repertoryService.js';

/**
 * Analyze symptoms using Gemini API (server-side, key never exposed to browser)
 * @param {Object} params - Symptom analysis parameters
 * @param {string} [params.customApiKey] - Optional per-request API key override
 * @param {string} [params.model] - Gemini model to use
 * @returns {Promise<Object>} Analysis result with source and data
 */
export async function analyzeSymptoms(params) {
  return analyzeSymptomsWithGeminiOrFallback(params);
}

/**
 * Test Gemini API connection with a simple prompt
 * @param {string} [apiKey] - API key to test
 * @param {string} [model] - Model to use for testing
 * @returns {Promise<Object>} Connection test result
 */
export async function testGeminiConnection(apiKey, model = 'gemini-1.5-flash') {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    return { success: false, message: 'No Gemini API key configured.' };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Respond with valid JSON: {"status": "ok", "message": "Gemini API connected"}' }]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
      };
    }

    return { success: true, message: 'Gemini API connected successfully.' };
  } catch (err) {
    return { success: false, message: `Connection error: ${err.message}` };
  }
}
