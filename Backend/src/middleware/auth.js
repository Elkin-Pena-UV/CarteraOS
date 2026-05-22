import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, message: 'Token de acceso requerido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    logger.warn(`[AUTH] Token inválido - ${err.message}`);
    const message = err.name === 'TokenExpiredError'
      ? 'La sesión ha expirado'
      : 'Token inválido';
    res.status(401).json({ ok: false, message });
  }
};

export default requireAuth;