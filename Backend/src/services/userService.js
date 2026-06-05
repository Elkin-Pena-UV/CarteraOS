import bcrypt from 'bcryptjs';
import { sql, poolPromise } from '../config/db.js';
import logger from '../config/logger.js';

// ─────────────────────────────────────────────
// Listar todos los usuarios
// ─────────────────────────────────────────────
export async function listarUsuarios() {
  const pool = await poolPromise;
  const result = await pool.request().query(`
  SELECT
    id, username, nombre, rol, activo,
    FORMAT(last_login, 'yyyy-MM-dd HH:mm:ss') AS last_login
  FROM usuarios
  ORDER BY nombre ASC
`);
  return result.recordset;
}

// ─────────────────────────────────────────────
// Crear usuario
// ─────────────────────────────────────────────
export async function crearUsuario({ username, nombre, password, rol }) {
  const pool = await poolPromise;

  // Verificar username duplicado
  const existe = await pool.request()
    .input('username', sql.NVarChar, username.trim())
    .query(`SELECT id FROM usuarios WHERE username = @username`);

  if (existe.recordset.length > 0) {
    const err = new Error('El nombre de usuario ya está en uso');
    err.status = 409;
    throw err;
  }

  const password_hash = await bcrypt.hash(password, 12);

  const result = await pool.request()
    .input('username',      sql.NVarChar, username.trim())
    .input('nombre',        sql.NVarChar, nombre.trim())
    .input('password_hash', sql.NVarChar, password_hash)
    .input('rol',           sql.NVarChar, rol)
    .query(`
      INSERT INTO usuarios (username, nombre, password_hash, rol, activo)
      OUTPUT INSERTED.id, INSERTED.username, INSERTED.nombre, INSERTED.rol, INSERTED.activo
      VALUES (@username, @nombre, @password_hash, @rol, 1)
    `);

  logger.debug(`[USERS] Usuario creado: ${username}`);
  return result.recordset[0];
}

// ─────────────────────────────────────────────
// Actualizar usuario (nombre, rol, activo)
// ─────────────────────────────────────────────
export async function actualizarUsuario(id, { nombre, rol, activo }) {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('id',     sql.Int,      id)
    .input('nombre', sql.NVarChar, nombre.trim())
    .input('rol',    sql.NVarChar, rol)
    .input('activo', sql.Bit,      activo ? 1 : 0)
    .query(`
      UPDATE usuarios
      SET nombre = @nombre, rol = @rol, activo = @activo
      OUTPUT INSERTED.id, INSERTED.username, INSERTED.nombre, INSERTED.rol, INSERTED.activo
      WHERE id = @id
    `);

  if (result.recordset.length === 0) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }

  logger.debug(`[USERS] Usuario actualizado: id=${id}`);
  return result.recordset[0];
}

// ─────────────────────────────────────────────
// Resetear contraseña
// ─────────────────────────────────────────────
export async function resetearPassword(id, nuevaPassword) {
  const pool = await poolPromise;
  const password_hash = await bcrypt.hash(nuevaPassword, 12);

  const result = await pool.request()
    .input('id',            sql.Int,      id)
    .input('password_hash', sql.NVarChar, password_hash)
    .query(`
      UPDATE usuarios SET password_hash = @password_hash WHERE id = @id
      SELECT @@ROWCOUNT AS affected
    `);

  if (result.recordset[0]?.affected === 0) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }

  logger.debug(`[USERS] Password reseteado: id=${id}`);
}