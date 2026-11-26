/**
 * Patient Intake & Profile Validators for VEAYOS Homoeopathy ClinicalOS
 */

export function validatePatientIntake(data = {}) {
  const { name, phone } = data;
  if (!name || typeof name !== 'string' || !name.trim() || !phone || typeof phone !== 'string' || !phone.trim()) {
    return {
      valid: false,
      error: 'Name and phone are required.'
    };
  }
  return { valid: true };
}

export function validatePatientUpdate(data = {}) {
  if (data && typeof data !== 'object') {
    return {
      valid: false,
      error: 'Update payload must be an object.'
    };
  }
  return { valid: true };
}

export default {
  validatePatientIntake,
  validatePatientUpdate
};
