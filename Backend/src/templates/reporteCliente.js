import {
  Document, Page, View, Text, Image, StyleSheet, Svg, Circle, G,
} from '@react-pdf/renderer';
import React from 'react';
import { EMPRESA, LOGO_DATA_URI } from './brand.js';

const ce = React.createElement;

// ─────────────────────────────────────────────
// Paleta — idéntica al reporte general
// ─────────────────────────────────────────────

const BLUE   = '#00359a';
const ORANGE = '#ff6600';
const RED    = '#dc2626';
const GREEN  = '#16a34a';
const GRAY   = '#6b7280';
const LGRAY  = '#9ca3af';
const BORDER = '#e5e7eb';

const AGING_COLORS = ['#ff6600', '#1d4ed8', '#f59e0b', '#dc2626'];
const AGING_LABELS = ['1-30 días', '31-60 días', '61-90 días', '>90 días'];

// ─────────────────────────────────────────────
// Formatters — misma lógica que reporteGeneral
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
  if (num >= 1_000_000){
    return `$${(num / 1_000_000).toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}M`;}
  if (num >= 1_000)         return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toLocaleString('es-CO')}`;
}


function formatPct(value) {
  const n = Number(value);
  if (isNaN(n)) return '—';
  return `${n.toFixed(1)}%`;
}

function formatFecha(iso) {
  if (!iso) return '—';

  let date;

  if (typeof iso === 'string' && iso.length === 8) {
    const year  = parseInt(iso.slice(0, 4));
    const month = parseInt(iso.slice(4, 6)) - 1; // mes es 0-indexed
    const day   = parseInt(iso.slice(6, 8));
    date = new Date(year, month, day); // sin UTC, usa hora local
  } else {
    date = new Date(iso);
  }

  return date.toLocaleDateString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function formatFechaCorta(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('es-CO');
}

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

// ─────────────────────────────────────────────
// Estilos — Portrait A4
// ─────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica', fontSize: 8,
    color: '#1a1a1a', backgroundColor: '#fff',
    flexDirection: 'column',
    paddingBottom: 36, // espacio para el footer fijo
  },

  // ── Header ──
  header: {
    backgroundColor: BLUE,
    paddingHorizontal: 24, paddingVertical: 14,
  },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  headerTitle: { color: '#fff', fontSize: 14, fontFamily: 'Helvetica-Bold' },
  headerNit:   { color: '#90aee0', fontSize: 8, marginTop: 3 },
  headerSub:   { color: '#90aee0', fontSize: 7, marginTop: 1 },
  metaRow:     { flexDirection: 'row', marginTop: 10, gap: 6 },
  metaBox: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 4, padding: 5,
    alignItems: 'flex-start', flex: 1,
  },
  metaLabel: { color: '#90aee0', fontSize: 6.5 },
  metaValue: { color: '#fff', fontSize: 7.5, fontFamily: 'Helvetica-Bold', marginTop: 1 },
  brandBox:      { alignItems: 'flex-end' },
  logo:          { width: 36, height: 36, marginBottom: 3 },
  headerCompany: { color: '#fff', fontSize: 8, fontFamily: 'Helvetica-Bold' },

  // ── KPIs ──
  kpiRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5, borderBottomColor: BORDER,
  },
  kpiCard: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 10,
    borderRightWidth: 0.5, borderRightColor: BORDER,
  },
  kpiCardLast: { flex: 1, paddingHorizontal: 14, paddingVertical: 10 },
  kpiLabel:    { fontSize: 7, color: GRAY, marginBottom: 2 },
  kpiValue:    { fontSize: 15, fontFamily: 'Helvetica-Bold', lineHeight: 1.1 },
  kpiSub:      { fontSize: 6, color: LGRAY, marginTop: 2 },
  kpiAccent:   { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2 },

  // ── Info + Donut ──
  infoSection: {
    flexDirection: 'row',
    paddingHorizontal: 24, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: BORDER,
    gap: 20,
  },
  infoBlock: { flex: 1 },
  infoSectionTitle: {
    fontSize: 7, fontFamily: 'Helvetica-Bold',
    color: BLUE, letterSpacing: 0.5,
    marginBottom: 8, textTransform: 'uppercase',
  },
  infoRow: {
    flexDirection: 'row', marginBottom: 5,
    borderBottomWidth: 0.5, borderBottomColor: '#f3f4f6',
    paddingBottom: 4,
  },
  infoKey:   { flex: 1.2, fontSize: 7, color: GRAY },
  infoVal:   { flex: 2, fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#1a1a1a' },

  // Alerta mora
  alertBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff7ed',
    borderLeftWidth: 2.5, borderLeftColor: ORANGE,
    borderRadius: 3, paddingHorizontal: 8, paddingVertical: 5,
    marginTop: 8,
  },
  alertText:  { fontSize: 7, color: ORANGE, fontFamily: 'Helvetica-Bold' },
  alertSub:   { fontSize: 6.5, color: '#9a3412', marginTop: 1 },

  // Donut aging
  donutBlock:  { flex: 1, alignItems: 'flex-start' },
  donutTitle:  { fontSize: 7, fontFamily: 'Helvetica-Bold', color: BLUE, letterSpacing: 0.5, marginBottom: 8 },
  donutRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendWrap:  { flexDirection: 'column', minWidth: 110 },
  legendRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  legendDot:   { width: 7, height: 7, borderRadius: 3.5, marginRight: 5 },
  legendLabel: { fontSize: 6.5, color: GRAY, width: 52 },
  legendAmt:   { fontSize: 6.5, fontFamily: 'Helvetica-Bold', width: 36, textAlign: 'right' },
  legendPct:   { fontSize: 6, color: LGRAY, marginLeft: 4, width: 22, textAlign: 'right' },

  // ── Sección Facturas ──
  tableSection: { paddingHorizontal: 24, paddingTop: 12 },
  sectionHdr: {
    fontSize: 7, fontFamily: 'Helvetica-Bold',
    color: BLUE, letterSpacing: 0.5,
    marginBottom: 6,
  },
  tableWrap:   { width: '100%' },
  tableHeader: { flexDirection: 'row', backgroundColor: BLUE },
  tableRow:    { flexDirection: 'row', backgroundColor: '#fff' },
  tableRowAlt: { flexDirection: 'row', backgroundColor: '#f9fafb' },
  tableTotRow: { flexDirection: 'row', backgroundColor: BLUE },
  thCell: {
    fontSize: 6, fontFamily: 'Helvetica-Bold', color: '#fff',
    paddingHorizontal: 4, paddingVertical: 3.5,
  },
  tdCell: {
    fontSize: 6.5, paddingHorizontal: 4, paddingVertical: 3,
    borderBottomWidth: 0.5, borderBottomColor: '#f3f4f6',
  },

  // ── Footer ──
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#f9fafb',
    borderTopWidth: 0.5, borderTopColor: BORDER,
    paddingHorizontal: 24, paddingVertical: 5,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  footerText: { fontSize: 6.5, color: LGRAY },
});

// ─────────────────────────────────────────────
// Componentes
// ─────────────────────────────────────────────

function Header({ meta, cliente }) {
  return ce(View, { style: s.header },
    ce(View, { style: s.headerTop },
      ce(View, null,
        ce(Text, { style: s.headerTitle }, cliente.name ?? '—'),
        ce(Text, { style: s.headerNit   }, `NIT: ${cliente.nit ?? '—'}`),
        ce(Text, { style: s.headerSub   }, 'CarteraOS · Reporte Individual de Cliente'),
      ),
      ce(View, { style: s.brandBox },
        ce(Image, { src: LOGO_DATA_URI, style: s.logo }),
        ce(Text, { style: s.headerCompany }, EMPRESA),
      ),
    ),
    ce(View, { style: s.metaRow },
      ce(View, { style: s.metaBox },
        ce(Text, { style: s.metaLabel }, 'Fecha de corte'),
        ce(Text, { style: s.metaValue }, `${meta.modoCorte === 'hoy' ? 'Hoy · ' : ''}${formatFecha(meta.fechaCorte)}`),
      ),
      ce(View, { style: s.metaBox },
        ce(Text, { style: s.metaLabel }, 'Asesor'),
        ce(Text, { style: s.metaValue }, cliente.advisor ?? '—'),
      ),
      ce(View, { style: s.metaBox },
        ce(Text, { style: s.metaLabel }, 'Canal'),
        ce(Text, { style: s.metaValue }, cliente.channel ?? '—'),
      ),
      ce(View, { style: s.metaBox },
        ce(Text, { style: s.metaLabel }, 'Generado por'),
        ce(Text, { style: s.metaValue }, meta.generadoPor ?? '—'),
      ),
      ce(View, { style: s.metaBox },
        ce(Text, { style: s.metaLabel }, 'Generado el'),
        ce(Text, { style: s.metaValue }, formatDateTime(meta.generadoEn)),
      ),
    ),
  );
}

function KPICards({ cliente }) {
  const totalCartera = (cliente.current || 0) + (cliente.overdue || 0);
  const pctVencida   = totalCartera > 0 ? (cliente.overdue / totalCartera) * 100 : 0;

  const cards = [
    {
      label: 'Cartera Corriente',
      value: formatCOPCompact(cliente.current),
      sub:   'al día',
      color: GREEN,
    },
    {
      label: 'Cartera Vencida',
      value: formatCOPCompact(cliente.overdue),
      sub:   `${formatPct(pctVencida)} del total`,
      color: cliente.overdue > 0 ? RED : GREEN,
    },
    {
      label: 'Saldo Total',
      value: formatCOPCompact(cliente.totalBalance),
      sub:   'cartera activa',
      color: BLUE,
    },
    {
      label: 'Días Máx. Vencido',
      value: cliente.maxDaysOverdue > 0 ? `${cliente.maxDaysOverdue} días` : 'Al día',
      sub:   cliente.maxDaysOverdue > 90 ? 'Crítico' : cliente.maxDaysOverdue > 30 ? 'En mora' : 'Normal',
      color: cliente.maxDaysOverdue > 90 ? RED : cliente.maxDaysOverdue > 30 ? ORANGE : GREEN,
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

function InfoYDonut({ cliente, facturas }) {
  // ── Datos de aging derivados de las facturas ──
  const agingTotals = [
    facturas.reduce((s, f) => s + (Number(f.f1_saldo_vencido1) || 0), 0),
    facturas.reduce((s, f) => s + (Number(f.f1_saldo_vencido2) || 0), 0),
    facturas.reduce((s, f) => s + (Number(f.f1_saldo_vencido3) || 0), 0),
    facturas.reduce((s, f) => s + (Number(f.f1_saldo_vencido4) || 0), 0),
  ];
  const totalVencida = agingTotals.reduce((s, v) => s + v, 0);

  // ── Donut ──
  const CX = 70; const CY = 70;
  const R  = 42; const SW = 16;
  const C  = 2 * Math.PI * R;
  const total = totalVencida || 1;

  let accAngle = -90;
  const segments = agingTotals
    .map((monto, i) => {
      const frac  = monto / total;
      const dash  = frac * C;
      const gap   = Math.max(C - dash, 0.01);
      const rot   = accAngle;
      accAngle += frac * 360;
      return { monto, frac, dash, gap, rot, color: AGING_COLORS[i], label: AGING_LABELS[i] };
    })
    .filter(d => d.monto > 0)
    .sort((a, b) => b.frac - a.frac);

  return ce(View, { style: s.infoSection },

    // ── Datos del cliente ──
    ce(View, { style: s.infoBlock },
      ce(Text, { style: s.infoSectionTitle }, 'Información del cliente'),

      ce(View, { style: s.infoRow },
        ce(Text, { style: s.infoKey }, 'Condición de pago'),
        ce(Text, { style: s.infoVal }, cliente.paymentCondition ?? '—'),
      ),
      ce(View, { style: s.infoRow },
        ce(Text, { style: s.infoKey }, 'Cupo asignado'),
        ce(Text, { style: [s.infoVal, { color: ORANGE }] }, formatCOP(cliente.quota)),
      ),
      ce(View, { style: s.infoRow },
        ce(Text, { style: s.infoKey }, 'Sobrecupo'),
        ce(Text, { style: [s.infoVal, { color: (cliente.overcapacity || 0) > 0 ? RED : '#374151' }] },
          formatCOP(cliente.overcapacity),
        ),
      ),
      ce(View, { style: s.infoRow },
        ce(Text, { style: s.infoKey }, 'Total COP'),
        ce(Text, { style: s.infoVal }, formatCOP(cliente.totalCop)),
      ),
      ce(View, { style: s.infoRow },
        ce(Text, { style: s.infoKey }, 'Total facturas'),
        ce(Text, { style: s.infoVal }, String(facturas.length)),
      ),

      // Alerta si tiene mora
      cliente.maxDaysOverdue > 0
        ? ce(View, { style: s.alertBox },
            ce(View, null,
              ce(Text, { style: s.alertText }, `⚠ ${cliente.maxDaysOverdue} días máximo vencido`),
              ce(Text, { style: s.alertSub  },
                cliente.maxDaysOverdue > 90
                  ? 'Cartera en estado crítico — requiere gestión urgente'
                  : 'Cliente con facturas vencidas activas',
              ),
            ),
          )
        : null,
    ),

    // ── Donut aging ──
    ce(View, { style: s.donutBlock },
      ce(Text, { style: s.donutTitle }, 'Distribución Aging Vencido'),

      totalVencida > 0
        ? ce(View, { style: s.donutRow },
            ce(Svg, { width: '110', height: '110', viewBox: '0 0 140 140' },
              ce(Circle, { cx: String(CX), cy: String(CY), r: String(R), fill: 'none', stroke: '#e5e7eb', strokeWidth: String(SW) }),
              ...segments.map((d, i) =>
                ce(Circle, {
                  key: i,
                  cx: String(CX), cy: String(CY), r: String(R),
                  fill: 'none', stroke: d.color, strokeWidth: String(SW),
                  strokeDasharray: `${d.dash.toFixed(3)} ${d.gap.toFixed(3)}`,
                  strokeDashoffset: '0',
                  transform: `rotate(${d.rot}, ${CX}, ${CY})`,
                })
              ),
              ce(G, null,
                ce(Text, { x: String(CX), y: String(CY - 4), textAnchor: 'middle', fontSize: '10', fontWeight: 'bold', fill: '#1a1a1a' },
                  formatCOPCompact(totalVencida),
                ),
                ce(Text, { x: String(CX), y: String(CY + 9), textAnchor: 'middle', fontSize: '8', fill: GRAY },
                  'Vencida',
                ),
              ),
            ),
            // Leyenda con anchos fijos
            ce(View, { style: s.legendWrap },
              ...agingTotals.map((monto, i) =>
                ce(View, { key: i, style: s.legendRow },
                  ce(View, { style: [s.legendDot, { backgroundColor: AGING_COLORS[i] }] }),
                  ce(Text, { style: s.legendLabel }, AGING_LABELS[i]),
                  ce(Text, { style: [s.legendAmt, { color: AGING_COLORS[i] }] }, formatCOPCompact(monto)),
                  ce(Text, { style: s.legendPct },
                    monto > 0 ? `${((monto / totalVencida) * 100).toFixed(0)}%` : '—',
                  ),
                )
              ),
              ce(View, { style: [s.legendRow, { marginTop: 5, borderTopWidth: 0.5, borderTopColor: BORDER, paddingTop: 4 }] },
                ce(View, { style: [s.legendDot, { backgroundColor: 'transparent' }] }),
                ce(Text, { style: [s.legendLabel, { fontFamily: 'Helvetica-Bold', color: '#1a1a1a' }] }, 'Total'),
                ce(Text, { style: [s.legendAmt, { color: RED }] }, formatCOPCompact(totalVencida)),
              ),
            ),
          )
        : ce(View, { style: { backgroundColor: '#f0fdf4', borderRadius: 4, padding: 12, alignItems: 'center' } },
            ce(Text, { style: { fontSize: 8, color: GREEN, fontFamily: 'Helvetica-Bold' } }, '✓ Sin cartera vencida'),
            ce(Text, { style: { fontSize: 7, color: GRAY, marginTop: 3 } }, 'Todas las facturas al día'),
          ),
    ),
  );
}

function TablaFacturas({ facturas }) {
  const COLS = [
    { key: 'f1_docto_causacion',     label: 'Documento',   flex: 1.6, align: 'left'  },
    { key: 'f1_saldo_corriente_total', label: 'Corriente',  flex: 1.3, align: 'right', format: formatCOP },
    { key: 'f1_saldo_vencido1',      label: '1-30 días',    flex: 1.3, align: 'right', format: formatCOP },
    { key: 'f1_saldo_vencido2',      label: '31-60 días',   flex: 1.3, align: 'right', format: formatCOP },
    { key: 'f1_saldo_vencido3',      label: '61-90 días',   flex: 1.3, align: 'right', format: formatCOP },
    { key: 'f1_saldo_vencido4',      label: '>90 días',     flex: 1.3, align: 'right', format: formatCOP },
    { key: 'f1_saldo_vencido_total', label: 'Tot. Vencido', flex: 1.3, align: 'right', format: formatCOP, color: RED },
    { key: 'f1_saldo_total',         label: 'Saldo Total',  flex: 1.3, align: 'right', format: formatCOP },
  ];

  const sum = key => facturas.reduce((s, f) => s + (Number(f[key]) || 0), 0);

  const totals = {
    f1_docto_causacion:       `Totales — ${facturas.length} facturas`,
    f1_saldo_corriente_total: sum('f1_saldo_corriente_total'),
    f1_saldo_vencido1:        sum('f1_saldo_vencido1'),
    f1_saldo_vencido2:        sum('f1_saldo_vencido2'),
    f1_saldo_vencido3:        sum('f1_saldo_vencido3'),
    f1_saldo_vencido4:        sum('f1_saldo_vencido4'),
    f1_saldo_vencido_total:   sum('f1_saldo_vencido_total'),
    f1_saldo_total:           sum('f1_saldo_total'),
  };

  function renderRow(row, ri, isTotals) {
    const rowStyle = isTotals
      ? s.tableTotRow
      : ri % 2 === 0 ? s.tableRow : s.tableRowAlt;

    const cells = COLS.map((c, ci) => {
      const raw = row[c.key] ?? '—';
      let val   = raw;
      let color = isTotals ? '#fff' : '#374151';
      let font  = 'Helvetica';

      if (c.format && raw !== '—' && raw !== '') {
        val  = c.format(raw);
        font = 'Courier';
        if (!isTotals) color = c.color ?? color;
        else {
          // en fila de totales: vencido en rojo suave, saldo total en amarillo
          if (c.key === 'f1_saldo_vencido_total') color = '#fca5a5';
          else if (c.key !== 'f1_saldo_corriente_total') color = '#fcd34d';
        }
      }

      const cellStyle = isTotals
        ? [s.thCell, { flex: c.flex, textAlign: c.align, color, fontFamily: font }]
        : [s.tdCell,  { flex: c.flex, textAlign: c.align, color, fontFamily: font }];

      return ce(Text, { key: ci, style: cellStyle }, String(val));
    });

    return ce(View, { key: isTotals ? 'tot' : ri, style: rowStyle, wrap: false }, ...cells);
  }

  return ce(View, { style: s.tableSection },
    ce(Text, { style: s.sectionHdr }, 'DETALLE DE FACTURAS'),
    ce(View, { style: s.tableWrap },
      // Header fijo en cada página
      ce(View, { style: s.tableHeader, fixed: true },
        ...COLS.map((c, i) =>
          ce(Text, { key: i, style: [s.thCell, { flex: c.flex, textAlign: c.align }] }, c.label)
        ),
      ),
      ...facturas.map((f, ri) => renderRow(f, ri, false)),
      renderRow(totals, -1, true),
    ),
  );
}

function Footer({ meta, cliente }) {
  return ce(View, { style: s.footer, fixed: true },
    ce(Text, { style: s.footerText }, `CarteraOS — Reporte Cliente: ${cliente.name ?? '—'}`),
    ce(Text, { style: s.footerText }, `Corte: ${formatFechaCorta(meta.fechaCorte)} · ${meta.generadoPor ?? ''}`),
    ce(Text, { style: s.footerText, render: ({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}` }),
  );
}

// ─────────────────────────────────────────────
// Componente raíz — export nombrado
// ─────────────────────────────────────────────

export function ReporteCliente({ meta = {}, cliente = {}, facturas = [] }) {
  return ce(Document, null,
    ce(Page, { size: 'A4', orientation: 'portrait', style: s.page },
      ce(Header,      { meta, cliente }),
      ce(KPICards,    { cliente }),
      ce(InfoYDonut,  { cliente, facturas }),
      ce(TablaFacturas, { facturas }),
      ce(Footer,      { meta, cliente }),
    ),
  );
}