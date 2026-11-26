/**
 * Prescriptions Validators for VEAYOS Homoeopathy ClinicalOS
 */

export function validatePrescription(data = {}) {
  const { patientName } = data;
  if (!patientName || typeof patientName !== 'string' || !patientName.trim()) {
    return {
      valid: false,
      error: 'Patient name is required.'
    };
  }
  return { valid: true };
}

export default {
  validatePrescription
};
