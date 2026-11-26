/**
 * Authentication Controller for VEAYOS Homoeopathy ClinicalOS
 * Handles strict 2-account whitelist verification and session tokens.
 */

import jwt from 'jsonwebtoken';
import { AUTHORIZED_USERS, WHITELIST_EMAILS, JWT_SECRET, JWT_EXPIRES_IN } from '../config/constants.js';
import { apiResponse } from '../utils/apiResponse.js';
import { logger } from '../config/logger.js';

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

export const authController = {
  /**
   * GET /api/v1/auth/whitelist
   * Returns approved practitioner profiles
   */
  getWhitelist(req, res) {
    return apiResponse.success(res, {
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
  },

  /**
   * POST /api/v1/auth/google
   * Google Sign-In & strict whitelist enforcement
   */
  async googleAuth(req, res) {
    try {
      const { credential, token, email: rawEmail, role = 'doctor' } = req.body;
      let email = rawEmail;
      let name = null;
      let avatar = null;

      if (credential || token) {
        const decodedPayload = decodeJwtPayload(credential || token);
        if (decodedPayload && decodedPayload.email) {
          email = decodedPayload.email;
          name = decodedPayload.name;
          avatar = decodedPayload.picture;
        }
      }

      if (!email) {
        return apiResponse.error(res, 'Missing email or Google authentication credential.', 400);
      }

      const cleanEmail = email.trim().toLowerCase();

      // STRICT WHITELIST ENFORCEMENT
      if (!WHITELIST_EMAILS.includes(cleanEmail)) {
        logger.warn(`Unauthorized Google login attempt for email: ${cleanEmail}`);
        return apiResponse.error(
          res,
          `Access Denied: Account '${cleanEmail}' is not authorized. Only whitelisted practitioner accounts (Dr. V. P. Dixit & Dr. Ved Prakash) are permitted to access VEAYOS Homoeopathy ClinicalOS.`,
          403
        );
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
        avatar: avatar || practitioner.avatar,
        authProvider: 'google',
        loginTimestamp: new Date().toISOString()
      };

      const sessionToken = jwt.sign(userPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      logger.info(`Google login successful for ${practitioner.email}`);
      return apiResponse.success(res, {
        token: sessionToken,
        user: userPayload
      }, `Google authentication successful for ${practitioner.name}`);
    } catch (err) {
      logger.error('Google authentication error:', err);
      return apiResponse.error(res, `Google authentication failed: ${err.message}`, 500);
    }
  },

  /**
   * POST /api/v1/auth/login
   * Email login with strict practitioner whitelist verification
   */
  login(req, res) {
    const { email, role = 'doctor' } = req.body;
    if (!email) {
      return apiResponse.error(res, 'Email is required.', 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!WHITELIST_EMAILS.includes(cleanEmail)) {
      logger.warn(`Unauthorized login attempt for email: ${cleanEmail}`);
      return apiResponse.error(
        res,
        `Access Denied: Account '${cleanEmail}' is not authorized. Only whitelisted practitioner accounts are permitted to access VEAYOS Homoeopathy ClinicalOS.`,
        403
      );
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

    logger.info(`Doctor login successful for ${practitioner.email}`);
    return apiResponse.success(res, {
      token,
      user: userPayload
    }, `Login successful for ${practitioner.name}`);
  },

  /**
   * POST /api/v1/auth/verify
   * Validates active JWT session and checks whitelist authorization
   */
  verify(req, res) {
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
  },

  /**
   * GET /api/v1/auth/me
   * Returns current authenticated user profile
   */
  getMe(req, res) {
    return apiResponse.success(res, {
      user: req.user
    });
  }
};

export default authController;
