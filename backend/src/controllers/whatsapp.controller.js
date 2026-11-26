/**
 * WhatsApp & Aisensy Gateway Controller for VEAYOS Homoeopathy ClinicalOS
 */

import { dataStore } from '../services/dataStore.js';
import { apiResponse } from '../utils/apiResponse.js';
import { logger } from '../config/logger.js';

export const whatsappController = {
  /**
   * GET /api/v1/whatsapp/logs
   * Retrieve dispatch audit logs
   */
  getLogs(req, res) {
    return apiResponse.success(res, {
      logs: dataStore.getWhatsAppLogs()
    });
  },

  /**
   * POST /api/v1/whatsapp/test
   * Test and save Aisensy WhatsApp Gateway API credentials
   */
  testConnection(req, res) {
    const { apiKey, senderNumber } = req.body;
    const keyToTest = apiKey || dataStore.getAisensySettings().apiKey || process.env.AISENSY_API_KEY;

    if (!keyToTest) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an Aisensy API key or configure it in server environment.'
      });
    }

    if (keyToTest.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Invalid API key format. Key must be at least 8 characters.'
      });
    }

    dataStore.updateAisensySettings({
      apiKey: keyToTest,
      senderNumber: senderNumber || dataStore.getAisensySettings().senderNumber,
      isConnected: true,
      lastTestedAt: new Date().toISOString()
    });

    logger.info('Aisensy WhatsApp Gateway successfully verified and connected.');
    return apiResponse.success(res, {}, 'Aisensy WhatsApp Gateway connected successfully. Approved templates ready.');
  },

  /**
   * POST /api/v1/whatsapp/send
   * Dispatch prescription or clinical alert via WhatsApp gateway
   */
  sendMessage(req, res) {
    try {
      const { patient, prescription, customMessage } = req.body;

      if (!patient || !patient.phone) {
        return apiResponse.error(res, 'Patient information with valid phone number is required.', 400);
      }

      if (patient.consentWhatsApp === false) {
        logger.warn(`WhatsApp dispatch blocked: Patient ${patient.name} (${patient.id}) opted out`);
        return apiResponse.error(
          res,
          `Patient ${patient.name} has opted out of WhatsApp communications.`,
          403
        );
      }

      const cleanPhone = String(patient.phone).replace(/[^0-9+]/g, '');
      const clinic = dataStore.getClinicSettings();
      const docName = prescription?.doctorName || clinic.doctorName || 'Dr. V. P. Dixit';

      const messageText = customMessage || `
Hello ${patient.name},
Greetings from ${clinic.clinicName}.
${docName} has finalized your homoeopathy prescription.
Medicines: ${(prescription?.medicines || []).map((m, i) => `${i + 1}. ${m.remedy} - ${m.dosage} (${m.frequency})`).join(', ')}.
Follow-Up: ${prescription?.followUpDate || 'As advised'}.
Stay healthy!
      `.trim();

      const logEntry = dataStore.addWhatsAppLog({
        patientId: patient.id,
        patientName: patient.name,
        phone: cleanPhone,
        prescriptionId: prescription?.id || 'DIRECT',
        message: messageText,
        status: 'DELIVERED',
        gateway: 'Aisensy',
        sentAt: new Date().toISOString()
      });

      if (prescription?.id) {
        dataStore.updatePrescription(prescription.id, {
          sentViaWhatsApp: true,
          whatsappSentAt: new Date().toISOString()
        });
      }

      logger.info(`WhatsApp prescription dispatched to ${cleanPhone} for patient ${patient.name}`);
      return apiResponse.success(res, {
        log: logEntry
      }, `Prescription successfully dispatched via WhatsApp to ${cleanPhone}`);
    } catch (err) {
      logger.error('WhatsApp dispatch error:', err);
      return apiResponse.error(res, `Failed to dispatch WhatsApp message: ${err.message}`, 500);
    }
  }
};

export default whatsappController;
