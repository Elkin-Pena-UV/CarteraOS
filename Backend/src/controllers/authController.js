import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sql, poolPromise } from '../config/db.js';
import logger from '../config/logger.js';

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

    // Mismo mensaje para usuario no encontrado y clave incorrecta (seguridad)
    if (!user || !user.activo) {
      return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });
    }

    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });
    }

    // Actualizar last_login
    await pool.request()
      .input('id', sql.Int, user.id)
      .query('UPDATE usuarios SET last_login = GETDATE() WHERE id = @id');

    const token = jwt.sign(
      { id: user.id, username: user.username, nombre: user.nombre, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    logger.debug(`[AUTH] Login exitoso: ${user.username}`);

    res.json({
      ok: true,
      token,
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

export const me = (req, res) => {
  // req.user viene del middleware requireAuth
  res.json({ ok: true, user: req.user });
};