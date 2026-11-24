/**
 * Authentication Middleware for VEAYOS Homoeopathy ClinicalOS
 * Enforces strict whitelist verification via JWT tokens.
 */

import jwt from 'jsonwebtoken';
import { JWT_SECRET, WHITELIST_EMAILS } from '../config/constants.js';
import { dataStore } from '../services/dataStore.js';

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers['x-auth-token'];
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Authentication Required: No token provided. Please log in with a whitelisted practitioner account.'
    });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const email = (decoded.email || '').toLowerCase().trim();

    if (!WHITELIST_EMAILS.includes(email)) {
      return res.status(403).json({
        success: false,
        error: `Access Denied: Account '${email}' is not on the authorized practitioner whitelist.`
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: `Invalid or expired session token: ${err.message}`
    });
  }
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers['x-auth-token'];
  if (!authHeader) return next();

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const email = (decoded.email || '').toLowerCase().trim();
    if (WHITELIST_EMAILS.includes(email)) {
      req.user = decoded;
    }
  } catch {}
  next();
}

export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }
    const userRole = req.user.currentRole || req.user.role || 'doctor';
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Role '${userRole}' is not permitted to perform this action.`
      });
    }
    next();
  };
}
