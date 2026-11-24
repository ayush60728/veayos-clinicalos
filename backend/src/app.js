/**
 * Express Application Setup for VEAYOS Homoeopathy ClinicalOS Backend
 */

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import repertoryRoutes from './routes/repertory.routes.js';
import patientsRoutes from './routes/patients.routes.js';
import queueRoutes from './routes/queue.routes.js';
import prescriptionsRoutes from './routes/prescriptions.routes.js';
import testsRoutes from './routes/tests.routes.js';
import medicinesRoutes from './routes/medicines.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import whatsappRoutes from './routes/whatsapp.routes.js';

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'x-gemini-key']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
const healthPayload = () => ({
  status: 'healthy',
  service: 'VEAYOS Homoeopathy ClinicalOS API',
  version: '1.0.0',
  whitelistEnforced: true,
  whitelistedPractitioners: ['vpdixit75@gmail.com', 'ved@veayos.com'],
  timestamp: new Date().toISOString()
});

app.get('/api/health', (req, res) => res.json(healthPayload()));
app.get('/api/v1/health', (req, res) => res.json(healthPayload()));

// API v1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/repertory', repertoryRoutes);
app.use('/api/v1/patients', patientsRoutes);
app.use('/api/v1/queue', queueRoutes);
app.use('/api/v1/prescriptions', prescriptionsRoutes);
app.use('/api/v1/tests', testsRoutes);
app.use('/api/v1/medicines', medicinesRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/whatsapp', whatsappRoutes);

// 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API route '${req.originalUrl}' not found.`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

export default app;
