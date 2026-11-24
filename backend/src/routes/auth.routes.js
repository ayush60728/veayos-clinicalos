/**
 * Authentication Routes for VEAYOS Homoeopathy ClinicalOS
 * Strict 2-Account Whitelist: vpdixit75@gmail.com, ved@veayos.com
 */

import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { AUTHORIZED_USERS, WHITELIST_EMAILS, JWT_SECRET, JWT_EXPIRES_IN } from '../config/constants.js';
import { requireAuth } from '../middleware/auth.js';
import { dataStore } from '../services/dataStore.js';

const router = Router();

// Helper to decode base64 JWT payload without verifying signature (for extracting Google email in mock/direct mode)
function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
      return JSON.parse(payload);
    }
  } catch {}
  return null;
}

/**
 * GET /api/v1/auth/whitelist
 * Returns authorized practitioner profiles
 */
router.get('/whitelist', (req, res) => {
  res.json({
    success: true,
    count: AUTHORIZED_USERS.length,
    users: AUTHORIZED_USERS.map(u => ({
      email: u.email,
      name: u.name,
      title: u.title,
      defaultRole: u.defaultRole,
      allowedRoles: u.allowedRoles,
      clinic: u.clinic,
      regNo: u.regNo
    }))
  });
});

/**
 * POST /api/v1/auth/google
 * Google Sign-In & Verification Endpoint
 * Validates Google credential/token or email and strictly enforces whitelist.
 */
router.post('/google', async (req, res) => {
  try {
    const { credential, token, email: rawEmail, role = 'doctor' } = req.body;
    let email = rawEmail;
    let name = null;
    let avatar = null;

    // If Google ID token / credential was passed, extract payload
    if (credential || token) {
      const decodedPayload = decodeJwtPayload(credential || token);
      if (decodedPayload && decodedPayload.email) {
        email = decodedPayload.email;
        name = decodedPayload.name;
        avatar = decodedPayload.picture;
      }
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Missing email or Google authentication credential.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // STRICT WHITELIST ENFORCEMENT
    if (!WHITELIST_EMAILS.includes(cleanEmail)) {
      return res.status(403).json({
        success: false,
        error: `Access Denied: Account '${cleanEmail}' is not authorized. Only whitelisted practitioner accounts (Dr. V. P. Dixit & Dr. Ved Prakash) are permitted to access VEAYOS Homoeopathy ClinicalOS.`
      });
    }

    // Retrieve matching practitioner profile
    const practitioner = AUTHORIZED_USERS.find(u => u.email.toLowerCase() === cleanEmail);
    const chosenRole = practitioner.allowedRoles.includes(role) ? role : practitioner.defaultRole;

    const userPayload = {
      email: practitioner.email,
      name: practitioner.name,
      title: practitioner.title,
      currentRole: chosenRole,
      allowedRoles: practitioner.allowedRoles,
      clinic: practitioner.clinic,
      regNo: practitioner.regNo,
      avatar: avatar || practitioner.avatar,
      authProvider: 'google',
      loginTimestamp: new Date().toISOString()
    };

    // Sign session JWT
    const sessionToken = jwt.sign(userPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.status(200).json({
      success: true,
      message: `Google authentication successful for ${practitioner.name}`,
      token: sessionToken,
      user: userPayload
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: `Google authentication failed: ${err.message}`
    });
  }
});

/**
 * POST /api/v1/auth/login
 * Standard email login with strict whitelist validation
 */
router.post('/login', (req, res) => {
  const { email, role = 'doctor' } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!WHITELIST_EMAILS.includes(cleanEmail)) {
    return res.status(403).json({
      success: false,
      error: `Access Denied: Account '${cleanEmail}' is not authorized. Only whitelisted practitioner accounts are permitted to access VEAYOS Homoeopathy ClinicalOS.`
    });
  }

  const practitioner = AUTHORIZED_USERS.find(u => u.email.toLowerCase() === cleanEmail);
  const chosenRole = practitioner.allowedRoles.includes(role) ? role : practitioner.defaultRole;

  const userPayload = {
    email: practitioner.email,
    name: practitioner.name,
    title: practitioner.title,
    currentRole: chosenRole,
    allowedRoles: practitioner.allowedRoles,
    clinic: practitioner.clinic,
    regNo: practitioner.regNo,
    avatar: practitioner.avatar,
    authProvider: 'email_whitelist',
    loginTimestamp: new Date().toISOString()
  };

  const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return res.status(200).json({
    success: true,
    token,
    user: userPayload
  });
});

/**
 * POST /api/v1/auth/verify
 * Verifies JWT token and checks whitelist validity
 */
router.post('/verify', (req, res) => {
  const authHeader = req.headers.authorization || req.headers['x-auth-token'] || req.body?.token;
  if (!authHeader) {
    return res.status(401).json({ success: false, valid: false, error: 'No token provided' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const email = (decoded.email || '').toLowerCase().trim();

    if (!WHITELIST_EMAILS.includes(email)) {
      return res.status(403).json({
        success: false,
        valid: false,
        error: `Account '${email}' is no longer authorized.`
      });
    }

    return res.json({
      success: true,
      valid: true,
      user: decoded
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      valid: false,
      error: err.message
    });
  }
});

/**
 * GET /api/v1/auth/me
 * Protected endpoint returning current user profile
 */
router.get('/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

export default router;
