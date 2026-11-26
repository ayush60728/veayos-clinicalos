/**
 * Live Queue Validators for VEAYOS Homoeopathy ClinicalOS
 */

export function validateQueueEntry(data = {}) {
  const { patientName, phone } = data;
  if (!patientName || typeof patientName !== 'string' || !patientName.trim() || !phone || typeof phone !== 'string' || !phone.trim()) {
    return {
      valid: false,
      error: 'Patient name and phone are required.'
    };
  }
  return { valid: true };
}

export function validateQueueStatus(data = {}) {
  const { status } = data;
  if (!status || typeof status !== 'string' || !status.trim()) {
    return {
      valid: false,
      error: 'Status is required.'
    };
  }
  return { valid: true };
}

export default {
  validateQueueEntry,
  validateQueueStatus
};
