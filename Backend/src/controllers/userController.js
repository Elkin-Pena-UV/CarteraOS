import {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  resetearPassword,
} from '../services/userService.js';

// GET /api/admin/usuarios
export const getUsuarios = async (req, res, next) => {
  try {
    const data = await listarUsuarios();
    res.json({ ok: true, total: data.length, data });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/usuarios
export const postUsuario = async (req, res, next) => {
  try {
    const { username, nombre, password, rol } = req.body;

    if (!username || !nombre || !password || !rol) {
      return res.status(400).json({ ok: false, message: 'Campos requeridos: username, nombre, password, rol' });
    }

    const ROLES = ['admin', 'auxiliar_contable', 'analista_tesoreria', 'jefe_tesoreria'];
    if (!ROLES.includes(rol)) {
      return res.status(400).json({ ok: false, message: `Rol inválido. Valores permitidos: ${ROLES.join(', ')}` });
    }

    const usuario = await crearUsuario({ username, nombre, password, rol });
    res.status(201).json({ ok: true, data: usuario });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, message: err.message });
    next(err);
  }
};

// PATCH /api/admin/usuarios/:id
export const patchUsuario = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ ok: false, message: 'ID inválido' });

    // Proteger: un admin no puede desactivarse a sí mismo
    if (req.user.id === id && req.body.activo === false) {
      return res.status(400).json({ ok: false, message: 'No puedes desactivar tu propia cuenta' });
    }

    const { nombre, rol, activo } = req.body;
    if (!nombre || !rol || activo === undefined) {
      return res.status(400).json({ ok: false, message: 'Campos requeridos: nombre, rol, activo' });
    }

    const ROLES = ['admin', 'auxiliar_contable', 'analista_tesoreria', 'jefe_tesoreria'];
    if (!ROLES.includes(rol)) {
      return res.status(400).json({ ok: false, message: `Rol inválido. Valores permitidos: ${ROLES.join(', ')}` });
    }

    const usuario = await actualizarUsuario(id, { nombre, rol, activo });
    res.json({ ok: true, data: usuario });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, message: err.message });
    next(err);
  }
};

// PATCH /api/admin/usuarios/:id/password
export const patchPassword = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ ok: false, message: 'ID inválido' });

    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ ok: false, message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    await resetearPassword(id, password);
    res.json({ ok: true, message: 'Contraseña actualizada' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, message: err.message });
    next(err);
  }
};