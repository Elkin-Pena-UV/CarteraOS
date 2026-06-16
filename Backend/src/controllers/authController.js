import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sql, poolPromise } from '../config/db.js';
import logger from '../config/logger.js';

// Converts a string like "15m", "8h", "7d" to milliseconds.
function parseExpiry(str) {
  const match = /^(\d+)(s|m|h|d)$/.exec(str);
  if (!match) throw new Error(`Invalid expiry format: "${str}"`);
  const n = parseInt(match[1], 10);
  const multipliers = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return n * multipliers[match[2]];
}

const cookieBase = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true',
  sameSite: 'lax',
};

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie('accessToken', accessToken, {
    ...cookieBase,
    path: '/',
    maxAge: parseExpiry(process.env.ACCESS_TOKEN_EXPIRES_IN || '15m'),
  });
  res.cookie('refreshToken', refreshToken, {
    ...cookieBase,
    path: '/',
    maxAge: parseExpiry(process.env.REFRESH_TOKEN_EXPIRES_IN || '8h'),
  });
}

function clearAuthCookies(res) {
  res.clearCookie('accessToken', { ...cookieBase, path: '/' });
  res.clearCookie('refreshToken', { ...cookieBase, path: '/' });
}

export const login = async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ ok: false, message: 'Usuario y contraseña son requeridos' });
  }

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .query(`
        SELECT id, username, password_hash, nombre, rol, activo
        FROM usuarios
        WHERE username = @username
      `);

    const user = result.recordset[0];

    if (!user || !user.activo) {
      return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });
    }

    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });
    }

    await pool.request()
      .input('id', sql.Int, user.id)
      .query('UPDATE usuarios SET last_login = GETDATE() WHERE id = @id');

    const payload = { id: user.id, username: user.username, nombre: user.nombre, rol: user.rol };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
    });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '8h',
    });

    setAuthCookies(res, accessToken, refreshToken);

    logger.debug(`[AUTH] Login exitoso: ${user.username}`);

    res.json({
      ok: true,
      user: {
        id:       user.id,
        username: user.username,
        nombre:   user.nombre,
        rol:      user.rol,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const refresh = (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ ok: false, message: 'Refresh token requerido', code: 'UNAUTHORIZED' });
  }

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    const payload = { id: decoded.id, username: decoded.username, nombre: decoded.nombre, rol: decoded.rol };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
    });

    res.cookie('accessToken', accessToken, {
      ...cookieBase,
      path: '/',
      maxAge: parseExpiry(process.env.ACCESS_TOKEN_EXPIRES_IN || '15m'),
    });

    logger.debug(`[AUTH] Token renovado: ${decoded.username}`);

    res.json({ ok: true });
  } catch (err) {
    logger.warn(`[AUTH] Refresh token inválido - ${err.message}`);
    clearAuthCookies(res);
    res.status(401).json({ ok: false, message: 'Sesión expirada, inicia sesión nuevamente', code: 'UNAUTHORIZED' });
  }
};

export const logout = (req, res) => {
  clearAuthCookies(res);
  res.json({ ok: true });
};

export const me = (req, res) => {
  res.json({ ok: true, user: req.user });
};
