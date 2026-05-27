import {
    Document, Page, View, Text, StyleSheet, Svg, Polyline, Circle, Line, G,
} from '@react-pdf/renderer';
import React from 'react';

const ce = React.createElement;

// ─────────────────────────────────────────────
// Paleta — idéntica al resto de reportes
// ─────────────────────────────────────────────

const BLUE = '#00359a';
const ORANGE = '#ff6600';
const RED = '#dc2626';
const YELLOW = '#e4c124';
const GREEN = '#16a34a';
const GRAY = '#6b7280';
const LGRAY = '#9ca3af';
const BORDER = '#e5e7eb';
const STRIPE = '#f9fafb';
const VIOLET = '#8b5cf6';

// ─────────────────────────────────────────────
// Formatters
// ─────────────────────────────────────────────

function formatCOP(value) {
    const n = Number(value);
    if (isNaN(n)) return '—';
    return new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP',
        minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(n);
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

function formatPeriodo(p) {
    if (!p || String(p).length < 6) return String(p ?? '—');
    const s = String(p);
    const y = s.slice(0, 4);
    const m = s.slice(4, 6);
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const label = meses[parseInt(m, 10) - 1] ?? m;
    return `${label} ${y}`;
}

function formatMes(yyyymmdd) {
    if (!yyyymmdd) return '—';
    const s = String(yyyymmdd);
    return formatPeriodo(s.slice(0, 6));
}

function formatDateTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

// Semáforo de rotación (días CxC)
function rotColor(dias, condPagoDias) {
    const d = Number(dias);
    if (condPagoDias != null) {
        // Client mode: 2 colors only
        return d <= condPagoDias ? GREEN : YELLOW;
    }
    // General mode: 3 colors
    if (d <= 20) return GREEN;
    if (d <= 25) return YELLOW;
    return RED;
}

// ─────────────────────────────────────────────
// Estilos
// ─────────────────────────────────────────────

const s = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica', fontSize: 8,
        color: '#1a1a1a', backgroundColor: '#fff',
        flexDirection: 'column', paddingBottom: 28,
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

    // ── Banner de filtros activos ──
    filterBanner: { backgroundColor: '#fffbeb', borderBottomWidth: 0.5, borderBottomColor: '#fde68a', paddingHorizontal: 20, paddingVertical: 5, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    filterBannerTitle: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: '#92400e', marginRight: 4 },
    filterTag: { backgroundColor: '#fef3c7', borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2, flexDirection: 'row', alignItems: 'center' },
    filterTagLabel: { fontSize: 6, color: '#78350f' },
    filterTagValue: { fontSize: 6, fontFamily: 'Helvetica-Bold', color: '#92400e', marginLeft: 2 },

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
    sectionHdr: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: BLUE, letterSpacing: 0.6, marginTop: 10, marginBottom: 6, textTransform: 'uppercase' },

    // ── Gráfico de línea ──
    chartCard: { borderWidth: 0.5, borderColor: BORDER, borderRadius: 6, padding: 10, marginBottom: 2 },
    chartTitle: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: GRAY, marginBottom: 6 },
    legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
    legendDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
    legendLabel: { fontSize: 6.5, color: GRAY },

    // ── Tabla ──
    tableWrap: { borderWidth: 0.5, borderColor: BORDER, borderRadius: 6, overflow: 'hidden' },
    tableHeader: { flexDirection: 'row', backgroundColor: BLUE },
    tableRow: { flexDirection: 'row', backgroundColor: '#fff' },
    tableRowAlt: { flexDirection: 'row', backgroundColor: STRIPE },
    tableTotRow: { flexDirection: 'row', backgroundColor: BLUE },
    thCell: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: '#fff', paddingHorizontal: 5, paddingVertical: 4 },
    tdCell: { fontSize: 6.5, paddingHorizontal: 5, paddingVertical: 3.5, borderBottomWidth: 0.5, borderBottomColor: '#f3f4f6' },

    // ── Badge de días ──
    badge: { borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1, alignSelf: 'flex-end' },
    badgeText: { fontSize: 6, fontFamily: 'Helvetica-Bold' },

    // ── Footer ──
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#f9fafb', borderTopWidth: 0.5, borderTopColor: BORDER, paddingHorizontal: 20, paddingVertical: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    footerText: { fontSize: 6.5, color: LGRAY },
});

// ─────────────────────────────────────────────
// Helpers de filtros
// ─────────────────────────────────────────────

function buildFiltrosActivos(filtros = {}) {
    const tags = [];
    if (filtros.canal?.length) tags.push({ label: 'Canal', value: filtros.canal.join(', ') });
    if (filtros.condPago?.length) tags.push({ label: 'Cond. pago', value: filtros.condPago.join(', ') });
    if (filtros.razonSocial) tags.push({ label: 'Cliente', value: filtros.razonSocial });
    return tags;
}

function tituloReporte(filtros = {}) {
    const tags = buildFiltrosActivos(filtros);
    if (tags.length === 0) return 'Rotación de Cartera — General';
    if (filtros.razonSocial) return `Rotación de Cartera — ${filtros.razonSocial}`;
    const partes = [];
    if (filtros.canal?.length) partes.push(filtros.canal.join(', '));
    if (filtros.condPago?.length) partes.push(filtros.condPago.join(', '));
    return `Rotación de Cartera — ${partes.join(' · ')}`;
}

// ─────────────────────────────────────────────
// Componente: Header
// ─────────────────────────────────────────────

function Header({ meta }) {
    const titulo = tituloReporte(meta.filtrosActivos);
    return ce(View, { style: s.header },
        ce(View, { style: s.headerLeft },
            ce(Text, { style: s.headerTitle }, titulo),
            ce(Text, { style: s.headerSub }, `Periodos: ${formatMes(meta.fechaCorte)} y 12 meses anteriores`),
        ),
        ce(View, { style: s.metaRow },
            ce(View, { style: s.metaBox },
                ce(Text, { style: s.metaLabel }, 'Periodo'),
                ce(Text, { style: s.metaValue }, `${formatMes(meta.fechaCorte)}`),
            ),
            ce(View, { style: s.metaBox },
                ce(Text, { style: s.metaLabel }, 'Generado por'),
                ce(Text, { style: s.metaValue }, meta.generadoPor ?? '—'),
            ),
            ce(View, { style: s.metaBox },
                ce(Text, { style: s.metaLabel }, 'Períodos'),
                ce(Text, { style: s.metaValue }, String(meta.totalPeriodos ?? '—')),
            ),
            ce(View, { style: s.metaBox },
                ce(Text, { style: s.metaLabel }, 'Generado en'),
                ce(Text, { style: s.metaValue }, formatDateTime(meta.generadoEn)),
            ),
        ),
    );
}

// ─────────────────────────────────────────────
// Componente: Banner de filtros activos
// ─────────────────────────────────────────────

function FilterBanner({ filtros }) {
    const tags = buildFiltrosActivos(filtros);
    if (tags.length === 0) return null;
    return ce(View, { style: s.filterBanner },
        ce(Text, { style: s.filterBannerTitle }, '⚠ FILTROS ACTIVOS:'),
        ...tags.map((t, i) =>
            ce(View, { key: i, style: s.filterTag },
                ce(Text, { style: s.filterTagLabel }, `${t.label}:`),
                ce(Text, { style: s.filterTagValue }, t.value),
            )
        ),
    );
}

// ─────────────────────────────────────────────
// Componente: KPI Cards
// ─────────────────────────────────────────────

function KPICards({ kpis }) {
    const rotActual = Number(kpis.rotCxCActual ?? 0);
    const rotColor_ = rotColor(rotActual);

    const cards = [
        { label: 'Rot. CxC Actual', value: `${rotActual} días`, sub: 'Último período', accent: rotColor_, mono: false },
        { label: 'Cartera Actual', value: formatCOPCompact(kpis.carteraActual), sub: 'Saldo último corte', accent: ORANGE, mono: true },
        { label: 'Promedio Venta 3m', value: formatCOPCompact(kpis.promedioVentas3m), sub: 'Últimos 3 meses', accent: VIOLET, mono: true },
        { label: 'Acum. Venta 12m', value: formatCOPCompact(kpis.acumuladoVenta12m), sub: 'Últimos 12 meses', accent: GREEN, mono: true },
        { label: 'Períodos analizados', value: String(kpis.totalPeriodos ?? '—'), sub: 'Meses con datos', accent: BLUE, mono: false },
    ];

    return ce(View, { style: s.kpiRow },
        ...cards.map((c, i) => {
            const isLast = i === cards.length - 1;
            return ce(View, { key: i, style: isLast ? s.kpiCardLast : s.kpiCard },
                ce(Text, { style: s.kpiLabel }, c.label),
                ce(Text, { style: [s.kpiValue, { color: c.accent}] }, c.value),
                ce(Text, { style: s.kpiSub }, c.sub),
                ce(View, { style: [s.kpiAccent, { backgroundColor: c.accent }] }),
            );
        }),
    );
}

// ─────────────────────────────────────────────
// Componente: Gráfico de línea — Rot CxC
// ─────────────────────────────────────────────

function GraficaRotacion({ serie, condPagoDias }) {
    if (!serie || serie.length < 2) return null;

    const W = 760, H = 110, PADL = 40, PADR = 10, PADT = 10, PADB = 22;
    const innerW = W - PADL - PADR;
    const innerH = H - PADT - PADB;

    const valores = serie.map(d => Number(d.rotCxC) || 0);
    const maxVal = Math.max(...valores, condPagoDias != null ? condPagoDias : 25);
    const minVal = 0;
    const range = maxVal - minVal || 1;

    const xOf = (i) => PADL + (i / (serie.length - 1)) * innerW;
    const yOf = (v) => PADT + innerH - ((v - minVal) / range) * innerH;

    // Líneas de referencia
    const refs = condPagoDias != null
        ? [{ val: condPagoDias, color: GREEN, label: `${condPagoDias}d` }]
        : [
            { val: 20, color: GREEN, label: '20d' },
            { val: 25, color: YELLOW, label: '25d' },
          ].filter(r => r.val <= maxVal);

    // Puntos de la línea
    const points = serie.map((d, i) => `${xOf(i).toFixed(1)},${yOf(Number(d.rotCxC) || 0).toFixed(1)}`).join(' ');

    // Etiquetas del eje X (máx 12 visibles)
    const step = Math.ceil(serie.length / 12);
    const xLabels = serie.filter((_, i) => i % step === 0 || i === serie.length - 1);

    return ce(View, { style: s.chartCard },
        ce(Text, { style: s.chartTitle }, 'ROTACIÓN CxC EN DÍAS — EVOLUCIÓN MENSUAL'),
        ce(Svg, { width: String(W), height: String(H), viewBox: `0 0 ${W} ${H}` },

            // Líneas de referencia
            ...refs.map((r, i) => ce(G, { key: `ref${i}` },
                ce(Line, { x1: String(PADL), y1: String(yOf(r.val).toFixed(1)), x2: String(W - PADR), y2: String(yOf(r.val).toFixed(1)), stroke: r.color, strokeWidth: '0.5', strokeDasharray: '3 2' }),
                ce(Text, { x: String(PADL - 3), y: String(yOf(r.val) + 2), textAnchor: 'end', fontSize: '5.5', fill: r.color }, r.label),
            )),

            // Línea principal
            ce(Polyline, { points, fill: 'none', stroke: BLUE, strokeWidth: '1.5', strokeLinejoin: 'round', strokeLinecap: 'round' }),

            // Puntos coloreados por semáforo
            ...serie.map((d, i) => {
                const dias = Number(d.rotCxC) || 0;
                const cx = xOf(i).toFixed(1);
                const cy = yOf(dias).toFixed(1);
                return ce(Circle, { key: `p${i}`, cx, cy, r: '2.5', fill: rotColor(dias, condPagoDias), stroke: '#fff', strokeWidth: '0.5' });
            }),

            // Etiquetas eje X
            ...xLabels.map((d, i) => {
                const idx = serie.indexOf(d);
                return ce(Text, { key: `xl${i}`, x: String(xOf(idx).toFixed(1)), y: String(H - 4), textAnchor: 'middle', fontSize: '5.5', fill: GRAY },
                    formatPeriodo(d.periodo),
                );
            }),

            // Eje Y — etiqueta máx y 0
            ce(Text, { x: String(PADL - 3), y: String(PADT + 4), textAnchor: 'end', fontSize: '5.5', fill: LGRAY }, String(Math.ceil(maxVal))),
            ce(Text, { x: String(PADL - 3), y: String(PADT + innerH), textAnchor: 'end', fontSize: '5.5', fill: LGRAY }, '0'),
        ),

        // Leyenda semáforo
        ce(View, { style: { flexDirection: 'row', gap: 12, marginTop: 4 } },
            ...(condPagoDias != null
                ? [
                    ce(View, { style: s.legendRow }, ce(View, { style: [s.legendDot, { backgroundColor: GREEN }] }), ce(Text, { style: s.legendLabel }, `≤ ${condPagoDias} días — Dentro del plazo`)),
                    ce(View, { style: s.legendRow }, ce(View, { style: [s.legendDot, { backgroundColor: YELLOW }] }), ce(Text, { style: s.legendLabel }, `> ${condPagoDias} días — Fuera del plazo`)),
                  ]
                : [
                    ce(View, { style: s.legendRow }, ce(View, { style: [s.legendDot, { backgroundColor: GREEN }] }), ce(Text, { style: s.legendLabel }, '≤ 20 días — Óptimo')),
                    ce(View, { style: s.legendRow }, ce(View, { style: [s.legendDot, { backgroundColor: YELLOW }] }), ce(Text, { style: s.legendLabel }, '21–25 días — Alerta')),
                    ce(View, { style: s.legendRow }, ce(View, { style: [s.legendDot, { backgroundColor: RED }] }), ce(Text, { style: s.legendLabel }, '> 25 días — Crítico')),
                  ]
            ),
        ),
    );
}

// ─────────────────────────────────────────────
// Componente: Tabla de serie
// ─────────────────────────────────────────────

const TABLA_COLS = [
    { key: 'periodo', label: 'Período', flex: 1.0, align: 'left', format: (v) => formatPeriodo(v) },
    { key: 'cartera', label: 'Cartera', flex: 1.4, align: 'left', format: formatCOP },
    { key: 'ventaBruta', label: 'Venta Bruta', flex: 1.4, align: 'left', format: formatCOP },
    { key: 'rebate', label: 'Rebate', flex: 1.2, align: 'left', format: formatCOP, color: ORANGE },
    { key: 'ventaNeta', label: 'Venta Neta', flex: 1.4, align: 'left', format: formatCOP, color: BLUE },
{ key: 'rotCxC', label: 'Rot CxC (días)', flex: 0.9, align: 'right', badge: true },
];

function TablaRotacion({ serie, condPagoDias }) {
    const rows = [...serie];

    function renderRow(row, ri, isTotals) {
        const rowStyle = isTotals
            ? s.tableTotRow
            : ri % 2 === 0 ? s.tableRow : s.tableRowAlt;

        const cells = TABLA_COLS.map((c, ci) => {
            const raw = row[c.key] ?? '—';

            if (c.badge) {
                const dias = Number(raw) || 0;
                const bg = rotColor(dias, condPagoDias) + '22';
                const fg = rotColor(dias, condPagoDias);
                return ce(View, { key: ci, style: [{ flex: c.flex, paddingHorizontal: 5, paddingVertical: 2, justifyContent: 'center', alignItems: 'center' }] },
                    ce(View, { style: [s.badge, { backgroundColor: bg }] },
                        ce(Text, { style: [s.badgeText, { color: fg }] }, `${dias}d`),
                    ),
                );
            }

            const val = c.format ? c.format(raw) : String(raw);
            const color = isTotals ? '#fff' : (c.color ?? '#374151');
            const font = c.format && raw !== '—' ? 'Courier' : 'Helvetica';

            return ce(Text, { key: ci, style: [isTotals ? s.thCell : s.tdCell, { flex: c.flex, textAlign: c.align, color, fontFamily: font, fontWeight: 'normal' }] }, val);
        });

        return ce(View, { key: isTotals ? 'tot' : ri, style: rowStyle, wrap: false }, ...cells);
    }

    return ce(View, { style: s.tableWrap },
        ce(View, { style: s.tableHeader, fixed: true },
            ...TABLA_COLS.map((c, i) =>
                ce(Text, { key: i, style: [s.thCell, { flex: c.flex, textAlign: c.align }] }, c.label),
            ),
        ),
        ...rows.map((row, ri) => renderRow(row, ri, false)),
    );
}

// ─────────────────────────────────────────────
// Componente: Footer
// ─────────────────────────────────────────────

function Footer({ meta }) {
    const filtros = meta.filtrosActivos ?? {};
    const tags = buildFiltrosActivos(filtros);
    const scope = tags.length === 0 ? 'General' : tags.map(t => `${t.label}: ${t.value}`).join(' · ');
    return ce(View, { style: s.footer, fixed: true },
        ce(Text, { style: s.footerText }, `CarteraOS — Reporte Rotación de Cartera`),
        ce(Text, { style: s.footerText }, `Corte: ${formatMes(meta.fechaCorte)} · ${scope} · ${meta.generadoPor ?? ''}`),
        ce(Text, { style: s.footerText, render: ({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}` }),
    );
}

// ─────────────────────────────────────────────
// Componente raíz — export nombrado
// ─────────────────────────────────────────────

export function ReporteRotacion({ meta = {}, kpis = {}, serie = [] }) {
    const condPagoDias = meta.condPagoDias ?? null;
    return ce(Document, null,
        ce(Page, { size: 'A4', orientation: 'landscape', style: s.page },
            ce(Header, { meta }),
            ce(FilterBanner, { filtros: meta.filtrosActivos ?? {} }),
            ce(KPICards, { kpis }),
            ce(View, { style: s.body },
                ce(Text, { style: s.sectionHdr }, 'Evolución de Rotación CxC'),
                ce(GraficaRotacion, { serie, condPagoDias }),
                ce(Text, { style: s.sectionHdr }, 'Serie Mensual Detallada'),
                ce(TablaRotacion, { serie, condPagoDias }),
            ),
            ce(Footer, { meta }),
        ),
    );
}