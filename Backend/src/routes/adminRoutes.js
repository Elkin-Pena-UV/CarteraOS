import express from 'express';
import { invalidateCache, clearCache, getCacheStats } from '../middleware/cacheMiddleware.js';
import { getCartera } from '../services/carteraService.js';
import logger from '../config/logger.js';
import { getVariacion } from '../services/variacionService.js';
import { getUsuarios, postUsuario, patchUsuario, patchPassword } from '../controllers/userController.js';

const router = express.Router();

// middleware de rol admin — agregar después de los imports
const requireAdmin = (req, res, next) => {
  if (req.user?.rol !== 'admin') {
    return res.status(403).json({ ok: false, message: 'Acceso restringido a administradores' });
  }
  next();
};

// Estadísticas del cache
router.get('/cache/stats', (req, res) => {
  const stats = getCacheStats();
  const hitRate = stats.hits / (stats.hits + stats.misses) || 0;
  
  res.json({
    ok: true,
    stats: {
      hits: stats.hits,
      misses: stats.misses,
      hitRate: `${(hitRate * 100).toFixed(2)}%`,
      keys: stats.keys,
      ksize: stats.ksize,
      vsize: stats.vsize
    }
  });
});

// Invalidar por patrón
router.post('/cache/invalidate', (req, res) => {
  const { pattern } = req.query;
  if (!pattern) {
    return res.status(400).json({ ok: false, message: 'Se requiere parámetro: pattern' });
  }
  const count = invalidateCache(pattern);
  res.json({ ok: true, invalidated: count });
});

// Limpiar todo
router.post('/cache/clear', (req, res) => {
  clearCache();
  res.json({ ok: true, message: 'Cache limpiado completamente' });
});


// 🆕 Diagnóstico de performance de queries
router.get('/diagnostico/cartera', async (req, res) => {
  try {
    const { modo = 'corte' } = req.query;

    logger.info('🔍 Iniciando diagnóstico de cartera...');
    const inicio = Date.now();

    const result = await getCartera(modo, null);

    const diagnostico = {
      ok: true,
      resumen: {
        tiempoTotal: `${Date.now() - inicio}ms`,
        registros: result.tiempos.registros,
        tiempoConexion: `${result.tiempos.conexion}ms`,
        tiempoQuery: `${result.tiempos.query}ms`,
      },
      recomendaciones: []
    };

    // 🆕 Recomendaciones automáticas según tiempos
    if (result.tiempos.conexion > 100) {
      diagnostico.recomendaciones.push(
        '⚠️ Conexión lenta — revisar connection pooling en db.js'
      );
    }
    if (result.tiempos.query > 1000) {
      diagnostico.recomendaciones.push(
        '🔴 Query muy lenta (+1s) — se necesitan índices en SQL Server'
      );
    } else if (result.tiempos.query > 500) {
      diagnostico.recomendaciones.push(
        '🟡 Query moderada (+500ms) — índices recomendados'
      );
    } else {
      diagnostico.recomendaciones.push(
        '✅ Query rápida — no se necesitan índices urgentes'
      );
    }

    res.json(diagnostico);

  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Diagnóstico de performance de variación
router.get('/diagnostico/variacion', async (req, res) => {
  try {
    const { fecha } = req.query;

    if (!fecha) {
      return res.status(400).json({
        ok: false,
        message: "Se requiere el parámetro 'fecha' en formato YYYYMMDD"
      });
    }

    logger.info('🔍 Iniciando diagnóstico de variación...');
    const inicio = Date.now();

    const result = await getVariacion(fecha);

    const diagnostico = {
      ok: true,
      resumen: {
        tiempoTotal: `${Date.now() - inicio}ms`,
        registros: result.tiempos.registros,
        tiempoConexion: `${result.tiempos.conexion}ms`,
        tiempoQuery: `${result.tiempos.query}ms`,
        fecha: result.fecha,
      },
      recomendaciones: []
    };

    if (result.tiempos.conexion > 100) {
      diagnostico.recomendaciones.push(
        '⚠️ Conexión lenta — revisar connection pooling en db.js'
      );
    }
    if (result.tiempos.query > 1000) {
      diagnostico.recomendaciones.push(
        '🔴 Query muy lenta (+1s) — se necesitan índices en SQL Server'
      );
    } else if (result.tiempos.query > 500) {
      diagnostico.recomendaciones.push(
        '🟡 Query moderada (+500ms) — índices recomendados'
      );
    } else {
      diagnostico.recomendaciones.push(
        '✅ Query rápida — no se necesitan índices urgentes'
      );
    }

    res.json(diagnostico);

  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Diagnóstico de performance de rotación — aísla cada query individualmente
router.get('/diagnostico/rotacion', requireAdmin, async (req, res) => {
  const { fecha = '20260430' } = req.query;
  const { sql, poolPromise } = await import('../config/db_sm_real.js');
  const resultados = {};

  try {
    const pool = await poolPromise;

    // ── Query 1: vista de rotación (un solo mes) ──────────────────────────
    const t1 = Date.now();
    const r1 = pool.request();
    r1.input('fi', sql.VarChar(8), `${fecha.substring(0, 6)}01`);
    r1.input('ff', sql.VarChar(8), fecha);
    await r1.query(`
      SELECT FORMAT(f_fecha,'yyyyMM') AS periodo, f_referencia, SUM(f_valor_subtotal_local) AS total
      FROM v_ti_rotacion_cartera
      WHERE f_fecha BETWEEN @fi AND @ff
      GROUP BY FORMAT(f_fecha,'yyyyMM'), f_referencia
    `);
    resultados.ventas_1_mes_ms = Date.now() - t1;

    // ── Query 2: vista de rotación (12 meses) ─────────────────────────────
    const t2 = Date.now();
    const r2 = pool.request();
    // Primer día de hace 12 meses
    const inicio12 = new Date(
      parseInt(fecha.substring(0,4)),
      parseInt(fecha.substring(4,6)) - 1 - 11,
      1
    );
    const fi12 = `${inicio12.getFullYear()}${String(inicio12.getMonth()+1).padStart(2,'0')}01`;
    r2.input('fi12', sql.VarChar(8), fi12);
    r2.input('ff12', sql.VarChar(8), fecha);
    const res2 = await r2.query(`
      SELECT FORMAT(f_fecha,'yyyyMM') AS periodo, f_referencia, SUM(f_valor_subtotal_local) AS total
      FROM v_ti_rotacion_cartera
      WHERE f_fecha BETWEEN @fi12 AND @ff12
      GROUP BY FORMAT(f_fecha,'yyyyMM'), f_referencia
    `);
    resultados.ventas_12_meses_ms  = Date.now() - t2;
    resultados.ventas_filas        = res2.recordset.length;

    // ── Query 3: cartera auxiliar — una sola fecha ────────────────────────
    const t3 = Date.now();
    const r3 = pool.request();
    r3.input('f3', sql.VarChar(8), fecha);
    const res3 = await r3.query(`SELECT f1_saldo_total FROM dbo.fn_ti_cartera_x_aux(@f3)`);
    resultados.cartera_1_fecha_ms  = Date.now() - t3;
    resultados.cartera_filas       = res3.recordset.length;

    // ── Query 4: cartera — UNION ALL 3 fechas ─────────────────────────────
    const t4 = Date.now();
    const r4 = pool.request();
    // Últimos 3 meses a partir de fecha
    const fechas3 = [-2, -1, 0].map((offset) => {
      const d = new Date(
        parseInt(fecha.substring(0,4)),
        parseInt(fecha.substring(4,6)) - 1 + offset + 1,
        0
      );
      return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
    });
    fechas3.forEach((f, i) => r4.input(`f4_${i}`, sql.VarChar(8), f));
    await r4.query(
      fechas3.map((_, i) =>
        `SELECT @f4_${i} AS pf, f1_saldo_total FROM dbo.fn_ti_cartera_x_aux(@f4_${i})`
      ).join('\nUNION ALL\n')
    );
    resultados.cartera_3_fechas_union_ms = Date.now() - t4;

    // ── Diagnóstico ───────────────────────────────────────────────────────
    const cuello = Object.entries(resultados)
      .filter(([k]) => k.endsWith('_ms'))
      .sort(([, a], [, b]) => b - a)[0];

    res.json({
      ok: true,
      fecha_referencia: fecha,
      tiempos: resultados,
      cuello_de_botella: {
        query: cuello[0],
        ms: cuello[1],
        conclusion:
          cuello[0].startsWith('ventas')
            ? '🔴 La vista v_ti_rotacion_cartera es el problema — necesita índice en f_fecha o es una vista pesada'
            : '🔴 fn_ti_cartera_x_aux es el problema — recalcula todo sin caché por cada fecha',
      },
    });

  } catch (error) {
    res.status(500).json({ ok: false, error: error.message, resultados });
  }
});

// Diagnóstico condiciones de pago
router.get('/diagnostico/cond-pago', async (req, res) => {
  try {
    const { sql, poolPromise } = await import('../config/db_sm_real.js')
    const { getFechaCorte } = await import('../utils/fechaUtils.js')

    const pool = await poolPromise
    const fecha = getFechaCorte()

    const request = pool.request()
    request.input('fecha', sql.VarChar(8), fecha)

    const result = await request.query(`
      SELECT 
        TRIM(f1_id_cond_pago)    AS id_cond_pago,
        TRIM(f1_cond_pago_tipo)  AS cond_pago_tipo,
        COUNT(*)                 AS cantidad
      FROM dbo.fn_ti_cartera_x_aux(@fecha)
      GROUP BY TRIM(f1_id_cond_pago), TRIM(f1_cond_pago_tipo)
      ORDER BY TRIM(f1_id_cond_pago)
    `)

    res.json({ ok: true, fecha, total: result.recordset.length, data: result.recordset })
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message })
  }
})


router.get   ('/usuarios',              requireAdmin, getUsuarios);
router.post  ('/usuarios',              requireAdmin, postUsuario);
router.patch ('/usuarios/:id',          requireAdmin, patchUsuario);
router.patch ('/usuarios/:id/password', requireAdmin, patchPassword);

export default router;