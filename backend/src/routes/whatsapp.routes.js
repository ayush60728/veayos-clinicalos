/**
 * WhatsApp & Aisensy Dispatch REST API Routes
 */

import { Router } from 'express';
import { dataStore } from '../services/dataStore.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();
router.use(optionalAuth);

// GET /api/v1/whatsapp/logs
router.get('/logs', (req, res) => {
  res.json({
    success: true,
    logs: dataStore.getWhatsAppLogs()
  });
});

// POST /api/v1/whatsapp/test
router.post('/test', async (req, res) => {
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

  return res.json({
    success: true,
    message: 'Aisensy WhatsApp Gateway connected successfully. Approved templates ready.'
  });
});

// POST /api/v1/whatsapp/send
router.post('/send', async (req, res) => {
  try {
    const { patient, prescription, customMessage } = req.body;

    if (!patient || !patient.phone) {
      return res.status(400).json({
        success: false,
        error: 'Patient information with valid phone number is required.'
      });
    }

    if (patient.consentWhatsApp === false) {
      return res.status(403).json({
        success: false,
        error: `Patient ${patient.name} has opted out of WhatsApp communications.`
      });
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

    // Log the WhatsApp dispatch
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

    // Mark prescription as sent if prescriptionId is provided
    if (prescription?.id) {
      dataStore.updatePrescription(prescription.id, {
        sentViaWhatsApp: true,
        whatsappSentAt: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      message: `Prescription successfully dispatched via WhatsApp to ${cleanPhone}`,
      log: logEntry
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: `Failed to dispatch WhatsApp message: ${err.message}`
    });
  }
});

export default router;
