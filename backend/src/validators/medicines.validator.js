/**
 * Medicines Library Validators for VEAYOS Homoeopathy ClinicalOS
 */

export function validateMedicine(data = {}) {
  const { name } = data;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return {
      valid: false,
      error: 'Medicine name is required.'
    };
  }
  return { valid: true };
}

export default {
  validateMedicine
};
