import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';

const requireAuth = (req, res, next) => {
  const token = req.cookies.accessToken;

  // Missing cookie: browser deleted it when maxAge elapsed — trigger refresh flow.
  if (!token) {
    return res.status(401).json({ ok: false, message: 'Token de acceso requerido', code: 'TOKEN_EXPIRED' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    logger.warn(`[AUTH] Token inválido - ${err.message}`);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ ok: false, message: 'La sesión ha expirado', code: 'TOKEN_EXPIRED' });
    }
    // Present but invalid signature/malformed — potential tampering, no refresh attempt.
    return res.status(401).json({ ok: false, message: 'Token inválido', code: 'UNAUTHORIZED' });
  }
};

export default requireAuth;
