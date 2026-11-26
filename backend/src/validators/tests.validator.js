/**
 * Diagnostic Tests Validators for VEAYOS Homoeopathy ClinicalOS
 */

export function validateTest(data = {}) {
  const { testName, patientName } = data;
  if (!testName || typeof testName !== 'string' || !testName.trim() || !patientName || typeof patientName !== 'string' || !patientName.trim()) {
    return {
      valid: false,
      error: 'testName and patientName are required.'
    };
  }
  return { valid: true };
}

export default {
  validateTest
};
