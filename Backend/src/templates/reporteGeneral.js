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
  if (num >= 1_000_000){
    return `$${(num / 1_000_000).toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}M`;}
  if (num >= 1_000)         return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toLocaleString('es-CO')}`;
}

function formatPct(value) {
  if (value === null || value === undefined) return '0%';
  return `${Number(value).toFixed(1)}%`;
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

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────

const BLUE   = '#00359a';
const ORANGE = '#ff6600';
const RED    = '#dc2626';
const GREEN  = '#16a34a';
const GRAY   = '#6b7280';
const LGRAY  = '#9ca3af';
const BORDER = '#e5e7eb';
const STRIPE = '#f9fafb';

const AGING_COLORS = ['#ff6600', '#1d4ed8', '#f59e0b', '#dc2626'];
const AGING_LABELS = ['1-30 días', '31-60 días', '61-90 días', '>90 días'];

// ─────────────────────────────────────────────
// Estilos
// ─────────────────────────────────────────────

const s = StyleSheet.create({
  page:         { fontFamily: 'Helvetica', fontSize: 8, color: '#1a1a1a', backgroundColor: '#fff', flexDirection: 'column' },

  // Header
  header:       { backgroundColor: BLUE, paddingHorizontal: 20, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle:  { color: '#fff', fontSize: 13, fontFamily: 'Helvetica-Bold' },
  headerSub:    { color: '#90aee0', fontSize: 7, marginTop: 2 },
  metaRow:      { flexDirection: 'row' },
  metaBox:      { backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: 4, padding: 5, alignItems: 'flex-end', marginLeft: 6 },
  metaLabel:    { color: '#90aee0', fontSize: 7 },
  metaValue:    { color: '#fff', fontSize: 8, fontFamily: 'Helvetica-Bold' },

  // KPIs
  kpiRow:       { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: BORDER },
  kpiCard:      { flex: 1, paddingHorizontal: 14, paddingVertical: 8, borderRightWidth: 0.5, borderRightColor: BORDER },
  kpiCardLast:  { flex: 1, paddingHorizontal: 14, paddingVertical: 8 },
  kpiLabel:     { fontSize: 7, color: GRAY, marginBottom: 2 },
  kpiValue:     { fontSize: 16, fontFamily: 'Helvetica-Bold', lineHeight: 1.1 },
  kpiSub:       { fontSize: 6.5, color: LGRAY, marginTop: 2 },
  kpiAccent:    { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2 },

  // Body
  body:         { flex: 1, paddingHorizontal: 20, paddingVertical: 6 },
  sectionHdr:   { fontSize: 7, fontFamily: 'Helvetica-Bold', color: BLUE, letterSpacing: 0.6,
                  borderBottomWidth: 1.5, borderBottomColor: BLUE, paddingBottom: 2, marginBottom: 5, marginTop: 5 },

  // Charts
  chartsRow:    { flexDirection: 'row', gap: 8, marginBottom: 6 },
  chartCard:    { flex: 1, borderWidth: 0.5, borderColor: BORDER, borderRadius: 6, padding: 8 },
  chartTitle:   { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#1a1a1a', marginBottom: 8 },

  // Barras
  barGroup:     { marginBottom: 6 },
  barName:      { fontSize: 7, color: GRAY, marginBottom: 2 },
  barRow:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  barTrack:     { flex: 1, height: 16, backgroundColor: '#f3f4f6', borderRadius: 3 },
  barFill:      { height: 16, backgroundColor: ORANGE, borderRadius: 3 },
  barPct:       { fontSize: 7, color: GRAY, width: 34, textAlign: 'right' },
  axisRow:      { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingTop: 4, borderTopWidth: 0.5, borderTopColor: BORDER },
  axisLabel:    { fontSize: 6.5, color: LGRAY },

  // Donut
  donutWrap:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 0 },
  legendRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 5 },
  legendDot:    { width: 8, height: 8, borderRadius: 4 },
  legendLabel:  { fontSize: 7, color: '#374151', width: 44 },
  legendVal:    { fontSize: 7, fontFamily: 'Helvetica-Bold' },
  legendPct:    { fontSize: 7, color: '#6b7280', marginLeft: 3 },

  // Tabla
  tableWrap:    { borderWidth: 0.5, borderColor: BORDER, borderRadius: 6, overflow: 'hidden' },
  tableHeader:  { flexDirection: 'row', backgroundColor: BLUE },
  tableRow:     { flexDirection: 'row' },
  tableRowAlt:  { flexDirection: 'row', backgroundColor: STRIPE },
  tableTotRow:  { flexDirection: 'row', backgroundColor: BLUE },
  thCell:       { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: '#fff', paddingHorizontal: 5, paddingVertical: 4 },
  tdCell:       { fontSize: 6.5, paddingHorizontal: 5, paddingVertical: 3.5, borderBottomWidth: 0.5, borderBottomColor: '#f3f4f6' },
  tagCom:       { backgroundColor: '#eff6ff', color: '#1e40af', borderRadius: 2, paddingHorizontal: 3, paddingVertical: 1, fontSize: 5.5 },
  tagInd:       { backgroundColor: '#fff7ed', color: '#c2410c', borderRadius: 2, paddingHorizontal: 3, paddingVertical: 1, fontSize: 5.5 },

  // Footer
  footer:       { backgroundColor: '#f9fafb', borderTopWidth: 0.5, borderTopColor: BORDER, paddingHorizontal: 20, paddingVertical: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText:   { fontSize: 6.5, color: LGRAY },
});

// ─────────────────────────────────────────────
// Columnas de la tabla
// ─────────────────────────────────────────────

const COL_CONFIG = {
  nit:              { flex: 1.1, align: 'left'   },
  name:             { flex: 2.2, align: 'left'   },
  channel:          { flex: 1.35, align: 'center'   },
  paymentCondition: { flex: 0.7, align: 'center' },
  overdue1:         { flex: 1.5, align: 'right', format: formatCOP },
  overdue2:         { flex: 1.5, align: 'right', format: formatCOP },
  overdue3:         { flex: 1.5, align: 'right', format: formatCOP },
  overdue4:         { flex: 1.5, align: 'right', format: formatCOP },
  quota:            { flex: 1.5, align: 'right', format: formatCOP, color: ORANGE },
  current:          { flex: 1.5, align: 'right', format: formatCOP },
  overdue:          { flex: 1.5, align: 'right', format: formatCOP },
  totalBalance:     { flex: 1.4, align: 'right', format: formatCOP },
  totalCop:         { flex: 1.5, align: 'right', format: formatCOP, colorFn: v => v > 1_000_000_000 ? '#1d4ed8' : ORANGE },
  overcapacity:     { flex: 1.4, align: 'right', format: formatCOP, colorFn: v => v > 0 ? RED : '#374151' },
  remittanceValue:  { flex: 1.3, align: 'right', format: formatCOP },
};

function buildCols(columnas) {
  if (!columnas || columnas.length === 0) {
    return Object.entries(COL_CONFIG).map(([key, cfg]) => ({ key, label: key, ...cfg }));
  }
  return columnas.map(col => ({
    key:   col.key ?? col.id,
    label: col.label ?? col.id,
    ...(COL_CONFIG[col.key ?? col.id] ?? { flex: 1, align: 'left' }),
  }));
}

// ─────────────────────────────────────────────
// Componentes como funciones puras
// ─────────────────────────────────────────────

function Header({ meta }) {
  const filtros = meta.filtrosActivos ?? {};
  const partes  = [];
  if (filtros.canal)    partes.push(`Canal: ${filtros.canal}`);
  if (filtros.asesor)   partes.push(`Asesor: ${filtros.asesor}`);
  if (filtros.cliente)  partes.push(`Cliente: ${filtros.cliente}`);
  if (partes.length === 0) partes.push('Todos los filtros');

  return ce(View, { style: s.header },
    ce(View, null,
      ce(Text, { style: s.headerTitle }, 'Dashboard de Cartera — Resumen General'),
      ce(Text, { style: s.headerSub },   'CarteraOS · Gestión y seguimiento de cartera de clientes'),
    ),
    ce(View, { style: s.metaRow },
      ce(View, { style: s.metaBox },
        ce(Text, { style: s.metaLabel }, 'Fecha de corte'),
        ce(Text, { style: s.metaValue }, `${meta.modoCorte === 'hoy' ? 'Hoy · ' : ''}${formatFecha(meta.fechaCorte)}`),
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

function KPICards({ kpis }) {
  const cards = [
    { label: 'Total Cartera Corriente', value: formatCOPCompact(kpis.totalCorriente),    sub: 'facturas al día',                              color: ORANGE },
    { label: 'Total Cartera Vencida',   value: formatCOPCompact(kpis.totalVencida),      sub: 'facturas vencidas',                            color: RED    },
    { label: 'Clientes en Mora',        value: String(kpis.clientesEnMora ?? 0),  sub: `de ${kpis.totalClientes ?? '—'} clientes activos`, color: BLUE   },
    { label: '% Vencida sobre Total',   value: formatPct(kpis.porcentajeVencida), sub: 'Meta: < 25%',                                  color: GREEN  },
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

function BarrasCOP({ channels }) {
  const maxCop = Math.max(...channels.map(c => Number(c.totalCop) || 0), 1);

  return ce(View, { style: s.chartCard },
    ce(Text, { style: s.chartTitle }, 'Total COP por Canal'),
    ...channels.map((c, i) => {
      const pct    = ((Number(c.totalCop) / maxCop) * 100).toFixed(1);
      const partic = formatPct(c.participacion ?? (Number(c.totalCop) / maxCop * 100));
      return ce(View, { key: i, style: s.barGroup },
        ce(Text, { style: s.barName }, c.canal ?? c.channel ?? '—'),
        ce(View, { style: s.barRow },
          ce(View, { style: s.barTrack },
            ce(View, { style: [s.barFill, { width: `${pct}%` }] }),
          ),
          ce(Text, { style: s.barPct }, partic),
        ),
      );
    }),
    ce(View, { style: s.axisRow },
      ...[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
        const val = maxCop * frac;
        return ce(Text, { key: i, style: s.axisLabel }, formatCOPCompact(val));
      }),
    ),
  );
}

function DonutAging({ distribution, totalVencida }) {
  const CX = 100; const CY = 100;
  const R   = 55;
  const SW  = 22;
  const C   = 2 * Math.PI * R;
  const total = distribution.reduce((s, d) => s + (Number(d.monto) || 0), 0) || 1;

  // Cada segmento usa rotate en su transform para posicionarse correctamente.
  // strokeDasharray = [dash, gap] donde dash = porcion del arco y gap = resto.
  // rotate(angulo, CX, CY) gira el punto de inicio del segmento.
  // Esto evita depender de strokeDashoffset que React PDF calcula distinto al browser.
  let accAngle = -90; // arrancamos desde las 12 en punto

  const items = distribution.map((d, i) => {
    const monto     = Number(d.monto) || 0;
    const frac      = monto / total;
    const angleDeg  = frac * 360;
    const dash      = frac * C;
    const gap       = Math.max(C - dash, 0.01);
    const rotate    = accAngle;
    accAngle += angleDeg;
    return { i, monto, frac, dash, gap, rotate, color: AGING_COLORS[i], label: AGING_LABELS[i] };
  });

  const segments = items
    .filter(d => d.monto > 0)
    .slice()
    .sort((a, b) => b.frac - a.frac) // mayor primero → los pequeños quedan encima
    .map(d => ce(Circle, {
      key: `s${d.i}`,
      cx: String(CX), cy: String(CY), r: String(R),
      fill: 'none',
      stroke: d.color,
      strokeWidth: String(SW),
      strokeDasharray: `${d.dash.toFixed(3)} ${d.gap.toFixed(3)}`,
      strokeDashoffset: '0',
      transform: `rotate(${d.rotate}, ${CX}, ${CY})`,
    }));

  return ce(View, { style: s.chartCard },
    ce(Text, { style: s.chartTitle }, 'Distribución Total Aging'),
    ce(View, { style: s.donutWrap },
      ce(Svg, { width: '170', height: '170', viewBox: '0 0 200 200' },
        ce(Circle, { cx: String(CX), cy: String(CY), r: String(R), fill: 'none', stroke: '#e5e7eb', strokeWidth: String(SW) }),
        ...segments,
        ce(G, null,
          ce(Text, { x: String(CX), y: String(CY - 5), textAnchor: 'middle', fontSize: '11', fontWeight: 'bold', fill: '#1a1a1a' },
            formatCOPCompact(totalVencida),
          ),
          ce(Text, { x: String(CX), y: String(CY + 10), textAnchor: 'middle', fontSize: '9', fill: GRAY },
            'Vencida',
          ),
        ),
      ),
      ce(View, null,
        ...items.map(d =>
          ce(View, { key: `l${d.i}`, style: s.legendRow },
            ce(View, { style: [s.legendDot, { backgroundColor: d.color }] }),
            ce(Text, { style: s.legendLabel }, d.label),
            ce(Text, { style: [s.legendVal, { color: d.color }] }, `${(d.frac * 100).toFixed(1)}%`),
          )
        ),
      ),
    ),
  );
}

function TablaClientes({ clientes, columnas }) {
  const COLS = buildCols(columnas);
  const sum = key => clientes.reduce((s, c) => s + (Number(c[key]) || 0), 0);

  const totals = {
    nit: '', name: `Totales — ${clientes.length} clientes`, channel: '', paymentCondition: '',
    quota: sum('quota'), current: sum('current'), overdue: sum('overdue'),
    totalBalance: sum('totalBalance'), totalCop: sum('totalCop'), overcapacity: sum('overcapacity'),
  };

  function renderRow(cl, ri, isTotals) {
    const rowStyle = isTotals ? s.tableTotRow : (ri % 2 === 0 ? s.tableRow : s.tableRowAlt);

    const cells = COLS.map((c, ci) => {
      let val   = cl[c.key] ?? '—';
      let color = isTotals ? '#fff' : '#374151';
      let font  = 'Helvetica';

      if (c.format && val !== '—' && val !== '') {
        if (isTotals) {
          if (c.key === 'overdue' || (c.key === 'overcapacity' && val > 0)) color = '#fca5a5';
          else if (['quota', 'current', 'totalCop'].includes(c.key)) color = '#fcd34d';
        } else {
          color = c.color ?? color;
          if (c.colorFn) color = c.colorFn(Number(cl[c.key]));
        }
        val  = c.format(val);
        font = 'Courier';
      }

      if (c.key === 'channel' && !isTotals) {
        const isCom = String(val).includes('01');
        const label = String(val).replace(/^\d+\s*-\s*/i, '').trim();
        return ce(View, { key: ci, style: [s.tdCell, { flex: c.flex, justifyContent: 'center' }] },
          ce(Text, { style: isCom ? s.tagCom : s.tagInd }, label),
        );
      }

      const cellStyle = isTotals
        ? [s.thCell, { flex: c.flex, textAlign: c.align, color, fontFamily: font }]
        : [s.tdCell,  { flex: c.flex, textAlign: c.align, color, fontFamily: font }];

      return ce(Text, { key: ci, style: cellStyle }, String(val));
    });

    return ce(View, { key: isTotals ? 'total' : ri, style: rowStyle, wrap: false }, ...cells);
  }

  return ce(View, { style: s.tableWrap },
    // Header fijo
    ce(View, { style: s.tableHeader, fixed: true },
      ...COLS.map((c, i) =>
        ce(Text, { key: i, style: [s.thCell, { flex: c.flex, textAlign: c.align }] }, c.label)
      ),
    ),
    // Filas de datos
    ...clientes.map((cl, ri) => renderRow(cl, ri, false)),
    // Fila de totales
    renderRow(totals, -1, true),
  );
}

function Footer({ meta }) {
  return ce(View, { style: s.footer, fixed: true },
    ce(Text, { style: s.footerText }, 'CarteraOS — Reporte Resumen General'),
    ce(Text, { style: s.footerText }, `Corte: ${formatFecha(meta.fechaCorte)} · ${meta.generadoPor ?? ''}`),
    ce(Text, { style: s.footerText, render: ({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}` }),
  );
}

// ─────────────────────────────────────────────
// Componente raíz — export nombrado
// ─────────────────────────────────────────────

export function ReporteGeneral({ meta = {}, kpis = {}, aging = {}, clientes = [], columnas = [] }) {
  return ce(Document, null,
    ce(Page, { size: 'A4', orientation: 'landscape', style: s.page },
      ce(Header, { meta }),
      ce(KPICards, { kpis }),
      ce(View, { style: s.body },
        ce(Text, { style: s.sectionHdr }, 'AGING — DISTRIBUCIÓN CARTERA VENCIDA'),
        ce(View, { style: s.chartsRow },
          ce(BarrasCOP,  { channels: aging.totalCopByChannel ?? [] }),
          ce(DonutAging, { distribution: aging.distribution ?? [], totalVencida: aging.totalVencida }),
        ),
        ce(Text, { style: s.sectionHdr }, 'TABLA DE CLIENTES'),
        ce(TablaClientes, { clientes, columnas }),
      ),
      ce(Footer, { meta }),
    ),
  );
}