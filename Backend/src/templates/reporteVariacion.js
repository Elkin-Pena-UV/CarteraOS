import React from 'react';
import {
    Document, Page, View, Text, Svg, Circle, G,
    StyleSheet,
} from '@react-pdf/renderer';

const ce = React.createElement;

// ─────────────────────────────────────────────
// Helpers de formato
// ─────────────────────────────────────────────

function formatCOP(value) {
    if (value === null || value === undefined) return '$0';
    const num = Number(value);
    if (isNaN(num)) return '$0';
    return new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP',
        minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(num);
}

function formatCOPCompact(value) {
    if (value === null || value === undefined) return '$0';
    const num = Number(value);
    if (isNaN(num)) return '$0';
    if (Math.abs(num) >= 1_000_000)
        return `$${(num / 1_000_000).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}M`;
    if (Math.abs(num) >= 1_000)
        return `$${(num / 1_000).toFixed(1)}K`;
    return `$${num.toLocaleString('es-CO')}`;
}

function formatPct(value) {
    if (value === null || value === undefined) return '0.00%';
    const num = Number(value);
    const sign = num > 0 ? '+' : '';
    return `${sign}${num.toFixed(2)}%`;
}

function formatFecha(iso) {
    if (!iso) return '—';
    let date;
    if (typeof iso === 'string' && iso.length === 8) {
        const year = parseInt(iso.slice(0, 4));
        const month = parseInt(iso.slice(4, 6)) - 1;
        const day = parseInt(iso.slice(6, 8));
        date = new Date(year, month, day);
    } else {
        date = new Date(iso);
    }
    return date.toLocaleDateString('es-CO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
    });
}

function formatMes(iso) {
    if (!iso) return '—';
    let year, month;
    if (typeof iso === 'string' && iso.length === 8) {
        year = parseInt(iso.slice(0, 4));
        month = parseInt(iso.slice(4, 6)) - 1;
    } else {
        const d = new Date(iso);
        year = d.getFullYear();
        month = d.getMonth();
    }
    const formatted = new Date(year, month, 1).toLocaleDateString('es-CO', {
        month: 'long', year: 'numeric',
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatMesAnterior(iso) {
    if (!iso) return '—';
    let year, month;
    if (typeof iso === 'string' && iso.length === 8) {
        year = parseInt(iso.slice(0, 4));
        month = parseInt(iso.slice(4, 6)) - 1;
    } else {
        const d = new Date(iso);
        year = d.getFullYear();
        month = d.getMonth();
    }
    const prev = new Date(year, month - 1, 1);
    const formatted = prev.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatDateTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('es-CO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

// ─────────────────────────────────────────────
// Constantes de color
// ─────────────────────────────────────────────

const BLUE = '#00359a';
const ORANGE = '#ff6600';
const RED = '#dc2626';
const GREEN = '#16a34a';
const GRAY = '#6b7280';
const LGRAY = '#9ca3af';
const BORDER = '#e5e7eb';
const STRIPE = '#f9fafb';

// Semántica de negocio: cartera que sube = malo (rojo), baja = bueno (verde)
const variacionColor = (val) => {
    const num = Number(val);
    if (num > 0) return RED;
    if (num < 0) return GREEN;
    return GRAY;
};

// ─────────────────────────────────────────────
// Estilos
// ─────────────────────────────────────────────

const s = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica', fontSize: 8,
        color: '#1a1a1a', backgroundColor: '#fff',
        flexDirection: 'column',
        paddingBottom: 28,
    },

    // ── Header ──
    header: { backgroundColor: BLUE, paddingHorizontal: 20, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerLeft: { flexDirection: 'column' },
    headerTitle: { color: '#fff', fontSize: 13, fontFamily: 'Helvetica-Bold' },
    headerSub: { color: '#90aee0', fontSize: 7, marginTop: 2 },
    metaRow: { flexDirection: 'row' },
    metaBox: { backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: 4, padding: 5, alignItems: 'flex-end', marginLeft: 6 },
    metaLabel: { color: '#90aee0', fontSize: 7 },
    metaValue: { color: '#fff', fontSize: 8, fontFamily: 'Helvetica-Bold' },

    // ── KPIs ──
    kpiRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: BORDER },
    kpiCard: { flex: 1, paddingHorizontal: 14, paddingVertical: 8, borderRightWidth: 0.5, borderRightColor: BORDER },
    kpiCardLast: { flex: 1, paddingHorizontal: 14, paddingVertical: 8 },
    kpiLabel: { fontSize: 7, color: GRAY, marginBottom: 2 },
    kpiValue: { fontSize: 16, fontFamily: 'Helvetica-Bold', lineHeight: 1.1 },
    kpiSub: { fontSize: 6.5, color: LGRAY, marginTop: 2 },
    kpiAccent: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2 },

    // ── Body ──
    body: { flex: 1, paddingHorizontal: 20, paddingBottom: 4 },
    sectionHdr: {
        fontSize: 7, fontFamily: 'Helvetica-Bold', color: BLUE, letterSpacing: 0.6,
        borderBottomWidth: 1.5, borderBottomColor: BLUE, paddingBottom: 2, marginBottom: 5, marginTop: 5
    },

    // ── Gráfica de variación por canal ──
    chartsRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 8, gap: 12, borderBottomWidth: 0.5, borderBottomColor: BORDER },
    chartCard: { flex: 1, borderWidth: 0.5, borderColor: BORDER, borderRadius: 6, padding: 10 },
    chartTitle: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: GRAY, marginBottom: 6 },

    // Barras horizontales por canal
    barGroup: { marginBottom: 5 },
    barName: { fontSize: 6.5, color: '#374151', marginBottom: 2 },
    barRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    barTrackBg: { flex: 1, height: 8, backgroundColor: '#e5e7eb', borderRadius: 2, overflow: 'hidden' },
    barFillPos: { height: 8, backgroundColor: RED, borderRadius: 2 },   // sube → rojo
    barFillNeg: { height: 8, backgroundColor: GREEN, borderRadius: 2 },   // baja → verde
    barFillNeu: { height: 8, backgroundColor: LGRAY, borderRadius: 2 },   // neutro
    barPct: { fontSize: 6, color: GRAY, width: 38, textAlign: 'right' },

    // Eje X de la gráfica
    axisRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    axisLabel: { fontSize: 5.5, color: LGRAY },

    // Resumen por canal (lado derecho de la gráfica)
    summaryCard: { flex: 1, borderRadius: 6, padding: 10 },
    summaryTitle: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: GRAY, marginBottom: 6 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: BORDER },
    summaryRowLast: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 },
    summaryCanal: { fontSize: 6.5, color: '#374151', flex: 2 },
    summaryVal: { fontSize: 6.5, fontFamily: 'Courier', flex: 1.3, textAlign: 'right' },
    summaryPct: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', flex: 0.8, textAlign: 'right' },

    // ── Tabla ──
    tableWrap: { borderWidth: 0.5, borderColor: BORDER, borderRadius: 6, overflow: 'hidden' },
    tableHeader: { flexDirection: 'row', backgroundColor: BLUE },
    tableRow: { flexDirection: 'row', backgroundColor: '#fff' },
    tableRowAlt: { flexDirection: 'row', backgroundColor: STRIPE },
    tableTotRow: { flexDirection: 'row', backgroundColor: BLUE },
    thCell: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: '#fff', paddingHorizontal: 5, paddingVertical: 4 },
    tdCell: { fontSize: 6.5, paddingHorizontal: 5, paddingVertical: 3.5, borderBottomWidth: 0.5, borderBottomColor: '#f3f4f6' },
    tagCom: { backgroundColor: '#eff6ff', color: '#1e40af', borderRadius: 2, paddingHorizontal: 3, paddingVertical: 1, fontSize: 5.5 },
    tagInd: { backgroundColor: '#fff7ed', color: '#c2410c', borderRadius: 2, paddingHorizontal: 3, paddingVertical: 1, fontSize: 5.5 },

    // ── Footer ──
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#f9fafb', borderTopWidth: 0.5, borderTopColor: BORDER, paddingHorizontal: 20, paddingVertical: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    footerText: { fontSize: 6.5, color: LGRAY },
});

// ─────────────────────────────────────────────
// Configuración de columnas de la tabla
// ─────────────────────────────────────────────

const COL_CONFIG = {
    nit: { flex: 1.1, align: 'left' },
    razonSocial: { flex: 2.4, align: 'left' },
    tipoCliente: { flex: 1.3, align: 'left' },
    canal: { flex: 1.2, align: 'center' },
    cupo: { flex: 1.3, align: 'right', format: formatCOP, color: ORANGE },
    carteraMesActual: { flex: 1.4, align: 'right', format: formatCOP },
    carteraUltimoMes: { flex: 1.4, align: 'right', format: formatCOP },
    variacionCop: { flex: 1.4, align: 'right', format: formatCOP, colorFn: variacionColor },
    variacionPct: { flex: 0.9, align: 'right', format: formatPct, colorFn: variacionColor },
    sobrecupoCop: { flex: 1.3, align: 'right', format: formatCOP, colorFn: v => Number(v) > 0 ? RED : GREEN },
};

function buildCols(columnas) {
    if (!columnas || columnas.length === 0) {
        return Object.entries(COL_CONFIG).map(([key, cfg]) => ({ key, label: key, ...cfg }));
    }
    return columnas.map(col => ({
        key: col.key ?? col.id,
        label: col.label ?? col.id,
        ...(COL_CONFIG[col.key ?? col.id] ?? { flex: 1, align: 'left' }),
    }));
}

// ─────────────────────────────────────────────
// Componente: Header
// ─────────────────────────────────────────────

function Header({ meta }) {
    const filtros = meta.filtrosActivos ?? {};
    const partes = [];
    if (filtros.tipoCliente?.length) partes.push(`Tipo: ${filtros.tipoCliente.join(', ')}`);
    if (filtros.canal?.length) partes.push(`Canal: ${filtros.canal.join(', ')}`);
    if (filtros.search) partes.push(`Búsqueda: ${filtros.search}`);
    if (partes.length === 0) partes.push('Todos los filtros');

    const mesFecha = formatMes(meta.fechaCorte);
    const mesAnterior = formatMesAnterior(meta.fechaCorte);

    return ce(View, { style: s.header },
        ce(View, { style: s.headerLeft },
            ce(Text, { style: s.headerTitle }, 'Variación de Cartera'),
            ce(Text, { style: s.headerSub }, `CarteraOS · Comparativo ${mesAnterior} → ${mesFecha}`),
        ),
        ce(View, { style: s.metaRow },
            ce(View, { style: s.metaBox },
                ce(Text, { style: s.metaLabel }, 'Período'),
                ce(Text, { style: s.metaValue }, mesFecha),
            ),
            ce(View, { style: s.metaBox },
                ce(Text, { style: s.metaLabel }, 'Generado por'),
                ce(Text, { style: s.metaValue }, meta.generadoPor ?? '—'),
            ),
            ce(View, { style: s.metaBox },
                ce(Text, { style: s.metaLabel }, 'Filtros'),
                ce(Text, { style: s.metaValue }, partes.join(' · ')),
            ),
            ce(View, { style: s.metaBox },
                ce(Text, { style: s.metaLabel }, 'Generado el'),
                ce(Text, { style: s.metaValue }, formatDateTime(meta.generadoEn)),
            ),
        ),
    );
}

// ─────────────────────────────────────────────
// Componente: KPI Cards
// ─────────────────────────────────────────────

function KPICards({ kpis }) {
    const varColor = kpis.variacionTotalCop > 0 ? RED : kpis.variacionTotalCop < 0 ? GREEN : GRAY;

    const cards = [
        {
            label: 'Cartera Mes Actual',
            value: formatCOPCompact(kpis.carteraMesActual),
            sub: formatMes(kpis.fechaCorte),
            color: ORANGE,
        },
        {
            label: 'Cartera Mes Anterior',
            value: formatCOPCompact(kpis.carteraMesAnterior),
            sub: formatMesAnterior(kpis.fechaCorte),
            color: GRAY,
        },
        {
            label: 'Variación Total',
            value: formatCOPCompact(kpis.variacionTotalCop),
            sub: `${formatPct(kpis.variacionTotalPct)} vs mes anterior`,
            color: varColor,
        },
        {
            label: 'Clientes en Sobrecupo',
            value: String(kpis.clientesEnSobrecupo ?? 0),
            sub: `de ${kpis.totalClientes ?? '—'} clientes`,
            color: BLUE,
        },
    ];

    return ce(View, { style: s.kpiRow },
        ...cards.map((c, i) =>
            ce(View, { key: i, style: i === cards.length - 1 ? s.kpiCardLast : s.kpiCard },
                ce(Text, { style: s.kpiLabel }, c.label),
                ce(Text, { style: [s.kpiValue, { color: c.color }] }, c.value),
                ce(Text, { style: s.kpiSub }, c.sub),
                ce(View, { style: [s.kpiAccent, { backgroundColor: c.color }] }),
            )
        ),
    );
}

// ─────────────────────────────────────────────
// Componente: Gráfica — barras agrupadas por tipo de cliente
// ─────────────────────────────────────────────

function GraficaVariacion({ clientes }) {

    // ── 1. Agrupar por tipo de cliente ───────────────────────────────────────
    const tipoMap = {};
    for (const c of clientes) {
        const tipo = (c.tipoCliente ?? 'Sin tipo').trim();
        if (!tipoMap[tipo]) tipoMap[tipo] = { carteraActual: 0, carteraAnterior: 0, count: 0 };
        tipoMap[tipo].carteraActual += Number(c.carteraMesActual) || 0;
        tipoMap[tipo].carteraAnterior += Number(c.carteraUltimoMes) || 0;
        tipoMap[tipo].count += 1;
    }

    // Calcular cartera total (valor absoluto) para filtrar tipos significativos
    const totalAbs = Object.values(tipoMap)
        .reduce((s, t) => s + Math.abs(t.carteraActual) + Math.abs(t.carteraAnterior), 0);

    // Umbral: tipos con volumen menor al 0.5% del total se agrupan en "Otros"
    const UMBRAL = totalAbs * 0.005;
    const TOP_N = 8;

    // Separar significativos vs otros
    const todosTipos = Object.entries(tipoMap).map(([tipo, v]) => {
        const maxAbs = Math.max(Math.abs(v.carteraActual), Math.abs(v.carteraAnterior));
        return {
            tipo,
            carteraActual: v.carteraActual,
            carteraAnterior: v.carteraAnterior,
            count: v.count,
            maxAbs,
            variacion: v.carteraActual - v.carteraAnterior,
            variacionPct: v.carteraAnterior !== 0
                ? ((v.carteraActual - v.carteraAnterior) / Math.abs(v.carteraAnterior)) * 100
                : 0,
        };
    });

    // Ordenar por volumen y separar
    const ordenados = todosTipos.sort((a, b) => b.maxAbs - a.maxAbs);
    const principales = ordenados.filter(t => t.maxAbs >= UMBRAL).slice(0, TOP_N);
    const otros = ordenados.filter(t => !principales.includes(t));

    // Agrupar "Otros" si hay más de 1
    let tipos = principales;
    if (otros.length > 0) {
        const grupoOtros = otros.reduce(
            (acc, t) => ({
                tipo: `Otros (${otros.length} tipos)`,
                carteraActual: acc.carteraActual + t.carteraActual,
                carteraAnterior: acc.carteraAnterior + t.carteraAnterior,
                count: acc.count + t.count,
            }),
            { tipo: '', carteraActual: 0, carteraAnterior: 0, count: 0 }
        );
        grupoOtros.maxAbs = Math.max(Math.abs(grupoOtros.carteraActual), Math.abs(grupoOtros.carteraAnterior));
        grupoOtros.variacion = grupoOtros.carteraActual - grupoOtros.carteraAnterior;
        grupoOtros.variacionPct = grupoOtros.carteraAnterior !== 0
            ? ((grupoOtros.variacion / Math.abs(grupoOtros.carteraAnterior)) * 100)
            : 0;
        tipos = [...principales, grupoOtros];
    }

    // maxVal: valor absoluto máximo para escala de barras
    const maxVal = Math.max(...tipos.flatMap(t => [Math.abs(t.carteraActual), Math.abs(t.carteraAnterior)]), 1);

    const BAR_H = 5;
    const ROW_GAP = 7;
    const LBL_W = '15%';
    const VAL_W = '10%';

    // ── 2. Agrupar por canal (para el resumen lateral) ───────────────────────
    const canalMap = {};
    for (const c of clientes) {
        const canal = (c.canal ?? '—').trim();
        if (!canalMap[canal]) canalMap[canal] = { carteraActual: 0, carteraAnterior: 0 };
        canalMap[canal].carteraActual += Number(c.carteraMesActual) || 0;
        canalMap[canal].carteraAnterior += Number(c.carteraUltimoMes) || 0;
    }

    const canales = Object.entries(canalMap)
        .map(([canal, v]) => ({
            canal,
            carteraActual: v.carteraActual,
            carteraAnterior: v.carteraAnterior,
            variacion: v.carteraActual - v.carteraAnterior,
            variacionPct: v.carteraAnterior !== 0
                ? ((v.carteraActual - v.carteraAnterior) / Math.abs(v.carteraAnterior)) * 100
                : 0,
        }))
        .sort((a, b) => Math.abs(b.variacionPct) - Math.abs(a.variacionPct));

    const maxAbsCanal = Math.max(...canales.map(c => Math.abs(c.variacionPct)), 1);

    // Helper para truncar labels
    const truncar = (s, n) => s.length > n ? s.slice(0, n - 1) + '…' : s;

    return ce(View, { style: s.chartsRow },

        // ── Barras agrupadas por tipo de cliente ─────────────────────────────
        ce(View, { style: [s.chartCard, { flex: 1 }] },

            ce(Text, { style: s.chartTitle }, 'Cartera por Tipo de Cliente'),
            ce(Text, { style: { fontSize: 6, color: LGRAY, marginBottom: 6 } },
                `Top ${TOP_N} por volumen · Escala en valor absoluto`,
            ),

            // Leyenda
            ce(View, { style: { flexDirection: 'row', gap: 12, marginBottom: 8 } },
                ce(View, { style: { flexDirection: 'row', alignItems: 'center', gap: 3 } },
                    ce(View, { style: { width: 8, height: 5, backgroundColor: BLUE, borderRadius: 1 } }),
                    ce(Text, { style: { fontSize: 6, color: GRAY } }, 'Mes anterior'),
                ),
                ce(View, { style: { flexDirection: 'row', alignItems: 'center', gap: 3 } },
                    ce(View, { style: { width: 8, height: 5, backgroundColor: ORANGE, borderRadius: 1 } }),
                    ce(Text, { style: { fontSize: 6, color: GRAY } }, 'Mes actual'),
                ),
                ce(View, { style: { flexDirection: 'row', alignItems: 'center', gap: 3 } },
                    ce(View, { style: { width: 8, height: 5, backgroundColor: RED, borderRadius: 1 } }),
                    ce(Text, { style: { fontSize: 6, color: GRAY } }, 'Subió (negativo)'),
                ),
                ce(View, { style: { flexDirection: 'row', alignItems: 'center', gap: 3 } },
                    ce(View, { style: { width: 8, height: 5, backgroundColor: GREEN, borderRadius: 1 } }),
                    ce(Text, { style: { fontSize: 6, color: GRAY } }, 'Bajó (positivo)'),
                ),
            ),

            // Filas por tipo de cliente
            ...tipos.map((t, i) => {
                // Usamos valor absoluto para la escala, pero conservamos el signo en el texto
                const actualAbs = Math.abs(t.carteraActual);
                const anteriorAbs = Math.abs(t.carteraAnterior);
                const pctActual = (actualAbs / maxVal * 100).toFixed(1);
                const pctAnterior = (anteriorAbs / maxVal * 100).toFixed(1);
                const varColor = variacionColor(t.variacion);

                // Marcar tipos con saldo neto negativo
                const tieneNegativo = t.carteraActual < 0 || t.carteraAnterior < 0;
                const labelBase = truncar(t.tipo, 40);
                const label = tieneNegativo ? `${labelBase} ⊖` : labelBase;

                // Si la variación es exactamente 0, mostrar guion
                const pctTexto = t.variacionPct === 0 ? '—' : formatPct(t.variacionPct);

                return ce(View, { key: i, style: { flexDirection: 'row', alignItems: 'center', marginBottom: ROW_GAP } },

                    // Nombre del tipo
                    ce(Text, { style: { width: LBL_W, fontSize: 6, color: '#374151', textAlign: 'right', paddingRight: 5 } }, label),

                    // Par de barras
                    ce(View, { style: { flex: 1, gap: 2 } },
                        // Barra anterior (azul)
                        ce(View, { style: { height: BAR_H, backgroundColor: '#e5e7eb', borderRadius: 1 } },
                            ce(View, {
                                style: {
                                    width: `${pctAnterior}%`,
                                    height: BAR_H,
                                    backgroundColor: t.carteraAnterior < 0 ? '#93c5fd' : BLUE,  // azul claro si es negativo
                                    borderRadius: 1,
                                }
                            }),
                        ),
                        // Barra actual (naranja)
                        ce(View, { style: { height: BAR_H, backgroundColor: '#e5e7eb', borderRadius: 1 } },
                            ce(View, {
                                style: {
                                    width: `${pctActual}%`,
                                    height: BAR_H,
                                    backgroundColor: t.carteraActual < 0 ? '#fdba74' : ORANGE,  // naranja claro si es negativo
                                    borderRadius: 1,
                                }
                            }),
                        ),
                    ),

                    // % variación
                    ce(Text, { style: { width: VAL_W, fontSize: 6, fontFamily: 'Helvetica-Bold', color: varColor, textAlign: 'right', paddingLeft: 4 } },
                        pctTexto,
                    ),
                );
            }),

            // Eje X
            ce(View, { style: { flexDirection: 'row', marginTop: 4, paddingLeft: LBL_W, paddingRight: VAL_W } },
                ...[0, 0.25, 0.5, 0.75, 1].map((frac, i) =>
                    ce(Text, { key: i, style: [s.axisLabel, { flex: 1, textAlign: i === 0 ? 'left' : i === 4 ? 'right' : 'center' }] },
                        formatCOPCompact(maxVal * frac),
                    )
                ),
            ),

            // Nota al pie sobre el símbolo ⊖
            ce(Text, { style: { fontSize: 5.5, color: LGRAY, marginTop: 6, fontStyle: 'italic' } },
                '⊖ Tipo con saldo neto negativo (notas crédito / anticipos)',
            ),
        ),

        // ── Panel derecho: divergente por canal + tabla resumen ───────────────
        ce(View, { style: s.summaryCard },

            ce(Text, { style: s.summaryTitle }, 'Variación por Canal'),

            // Leyenda canal
            ce(View, { style: { flexDirection: 'row', gap: 10, marginBottom: 6 } },
                ce(View, { style: { flexDirection: 'row', alignItems: 'center', gap: 3 } },
                    ce(View, { style: { width: 8, height: 5, backgroundColor: GREEN, borderRadius: 1 } }),
                    ce(Text, { style: { fontSize: 6, color: GRAY } }, 'Bajó'),
                ),
                ce(View, { style: { flexDirection: 'row', alignItems: 'center', gap: 3 } },
                    ce(View, { style: { width: 8, height: 5, backgroundColor: RED, borderRadius: 1 } }),
                    ce(Text, { style: { fontSize: 6, color: GRAY } }, 'Subió'),
                ),
            ),

            // Barras divergentes por canal
            ...canales.map((c, i) => {
                const label = c.canal.replace(/^\d+\s*-\s*/i, '').trim();
                const color = variacionColor(c.variacion);
                const pctBar = (Math.abs(c.variacionPct) / maxAbsCanal) * 50;
                const bajo = c.variacionPct < 0;

                return ce(View, { key: i, style: { flexDirection: 'row', alignItems: 'center', marginBottom: 7 } },
                    ce(Text, { style: { width: '28%', fontSize: 6, color: '#374151', textAlign: 'right', paddingRight: 4 } }, truncar(label, 18)),
                    ce(View, { style: { flex: 1, flexDirection: 'row', alignItems: 'center', height: 8 } },
                        ce(View, { style: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', height: 8 } },
                            bajo
                                ? ce(View, { style: { width: `${pctBar * 2}%`, height: 8, backgroundColor: GREEN, borderTopLeftRadius: 2, borderBottomLeftRadius: 2 } })
                                : null,
                        ),
                        ce(View, { style: { width: 1.5, height: 12, backgroundColor: '#9ca3af' } }),
                        ce(View, { style: { flex: 1, flexDirection: 'row', justifyContent: 'flex-start', height: 8 } },
                            !bajo && c.variacion !== 0
                                ? ce(View, { style: { width: `${pctBar * 2}%`, height: 8, backgroundColor: RED, borderTopRightRadius: 2, borderBottomRightRadius: 2 } })
                                : null,
                        ),
                    ),
                    ce(Text, { style: { width: '18%', fontSize: 6, fontFamily: 'Helvetica-Bold', color, textAlign: 'right' } },
                        formatPct(c.variacionPct),
                    ),
                );
            }),

            // Separador
            ce(View, { style: { borderTopWidth: 0.5, borderTopColor: BORDER, marginVertical: 6 } }),

            // Tabla resumen numérico por canal
            ce(View, { style: s.summaryRow },
                ce(Text, { style: [s.summaryCanal, { fontFamily: 'Helvetica-Bold', color: GRAY }] }, 'Canal'),
                ce(Text, { style: [s.summaryVal, { fontFamily: 'Helvetica-Bold', color: GRAY }] }, 'Actual'),
                ce(Text, { style: [s.summaryVal, { fontFamily: 'Helvetica-Bold', color: GRAY }] }, 'Anterior'),
                ce(Text, { style: [s.summaryPct, { fontFamily: 'Helvetica-Bold', color: GRAY }] }, 'Var %'),
            ),
            ...canales.map((c, i) => {
                const isLast = i === canales.length - 1;
                const label = c.canal.replace(/^\d+\s*-\s*/i, '').trim();
                return ce(View, { key: i, style: isLast ? s.summaryRowLast : s.summaryRow },
                    ce(Text, { style: s.summaryCanal }, truncar(label, 18)),
                    ce(Text, { style: [s.summaryVal, { color: BLUE }] }, formatCOPCompact(c.carteraActual)),
                    ce(Text, { style: [s.summaryVal, { color: GRAY }] }, formatCOPCompact(c.carteraAnterior)),
                    ce(Text, { style: [s.summaryPct, { color: variacionColor(c.variacion) }] }, formatPct(c.variacionPct)),
                );
            }),
        ),
    );
}

// ─────────────────────────────────────────────
// Componente: Tabla de clientes
// ─────────────────────────────────────────────

function TablaVariacion({ clientes, columnas, sorting = [] }) {
    const COLS = buildCols(columnas);

    // Mapa rápido id → dirección para el header
    const sortMap = Object.fromEntries(sorting.map(s => [s.id, s.desc ? ' ↓' : ' ↑']));

    // Fila de totales
    const totals = clientes.reduce((acc, c) => {
        acc.cupo += Number(c.cupo) || 0;
        acc.carteraMesActual += Number(c.carteraMesActual) || 0;
        acc.carteraUltimoMes += Number(c.carteraUltimoMes) || 0;
        acc.variacionCop += Number(c.variacionCop) || 0;
        acc.sobrecupoCop += Number(c.sobrecupoCop) || 0;
        return acc;
    }, {
        nit: '', razonSocial: 'TOTALES', tipoCliente: '', canal: '', viaje: 0,
        cupo: 0, carteraMesActual: 0, carteraUltimoMes: 0,
        variacionCop: 0, variacionPct: 0, sobrecupoCop: 0
    });

    totals.variacionPct = totals.carteraUltimoMes !== 0
        ? ((totals.variacionCop / totals.carteraUltimoMes) * 100)
        : 0;

    function renderRow(cl, ri, isTotals) {
        const rowStyle = isTotals
            ? s.tableTotRow
            : ri % 2 === 0 ? s.tableRow : s.tableRowAlt;

        const cells = COLS.map((c, ci) => {
            let val = cl[c.key] ?? '—';
            let color = isTotals ? '#fff' : '#374151';
            let font = 'Helvetica';

            if (c.format && val !== '—' && val !== '') {
                if (isTotals) {
                    if (c.key === 'variacionCop' || c.key === 'variacionPct') {
                        color = Number(cl[c.key]) > 0 ? '#fca5a5' : Number(cl[c.key]) < 0 ? '#bbf7d0' : '#fff';
                    } else if (c.key === 'sobrecupoCop') {
                        color = Number(cl[c.key]) > 0 ? '#fca5a5' : '#bbf7d0';
                    } else {
                        color = '#fcd34d';
                    }
                } else {
                    color = c.color ?? color;
                    if (c.colorFn) color = c.colorFn(Number(cl[c.key]));
                }
                val = c.format(val);
                font = 'Courier';
            }

            // Badge de canal
            if (c.key === 'canal' && !isTotals) {
                const isCom = String(val).includes('01');
                const label = String(val).replace(/^\d+\s*-\s*/i, '').trim();
                return ce(View, { key: ci, style: [s.tdCell, { flex: c.flex, justifyContent: 'center' }] },
                    ce(Text, { style: isCom ? s.tagCom : s.tagInd }, label),
                );
            }

            const cellStyle = isTotals
                ? [s.thCell, { flex: c.flex, textAlign: c.align, color, fontFamily: font }]
                : [s.tdCell, { flex: c.flex, textAlign: c.align, color, fontFamily: font }];

            return ce(Text, { key: ci, style: cellStyle }, String(val));
        });

        return ce(View, { key: isTotals ? 'total' : ri, style: rowStyle, wrap: false }, ...cells);
    }

    return ce(View, { style: s.tableWrap },
        // Header fijo — muestra flecha si la columna tiene sorting activo
        ce(View, { style: s.tableHeader, fixed: true },
            ...COLS.map((c, i) => {
                const arrow = sortMap[c.key] ?? '';
                return ce(Text, { key: i, style: [s.thCell, { flex: c.flex, textAlign: c.align }] },
                    c.label + arrow,
                );
            }),
        ),
        // Filas de datos
        ...clientes.map((cl, ri) => renderRow(cl, ri, false)),
        // Fila de totales
        renderRow(totals, -1, true),
    );
}

// ─────────────────────────────────────────────
// Componente: Footer
// ─────────────────────────────────────────────

function Footer({ meta }) {
    return ce(View, { style: s.footer, fixed: true },
        ce(Text, { style: s.footerText }, 'CarteraOS — Reporte Variación de Cartera'),
        ce(Text, { style: s.footerText }, `Período: ${formatMes(meta.fechaCorte)} · ${meta.generadoPor ?? ''}`),
        ce(Text, { style: s.footerText, render: ({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}` }),
    );
}

// ─────────────────────────────────────────────
// Componente raíz — export nombrado
// ─────────────────────────────────────────────

export function ReporteVariacion({ meta = {}, kpis = {}, clientes = [], columnas = [], sorting = [] }) {
    return ce(Document, null,
        ce(Page, { size: 'A4', orientation: 'landscape', style: s.page },
            ce(Header, { meta }),
            ce(KPICards, { kpis: { ...kpis, fechaCorte: meta.fechaCorte } }),
            ce(View, { style: s.body },
                ce(Text, { style: s.sectionHdr }, 'VARIACIÓN POR CANAL'),
                ce(GraficaVariacion, { clientes }),
                ce(Text, { style: s.sectionHdr }, 'TABLA DE CLIENTES'),
                ce(TablaVariacion, { clientes, columnas, sorting }),
            ),
            ce(Footer, { meta }),
        ),
    );
}