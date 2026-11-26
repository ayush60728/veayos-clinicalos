/**
 * Authentication Validators for VEAYOS Homoeopathy ClinicalOS
 */

export function validateLogin(data = {}) {
  const { email } = data;
  if (!email || typeof email !== 'string' || !email.trim()) {
    return {
      valid: false,
      error: 'Email is required.'
    };
  }
  return { valid: true };
}

export function validateGoogleAuth(data = {}) {
  const { credential, token, email } = data;
  if (!credential && !token && (!email || typeof email !== 'string' || !email.trim())) {
    return {
      valid: false,
      error: 'Missing email or Google authentication credential.'
    };
  }
  return { valid: true };
}

export default {
  validateLogin,
  validateGoogleAuth
};
