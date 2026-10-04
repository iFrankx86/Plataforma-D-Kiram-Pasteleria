import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Sale, Product, AuditLog, CashRegister } from '../types';

interface SalesPDFParams {
  sales: Sale[];
  products: Product[];
  periodLabel: string;
  generatedBy: string;
}

interface AuditPDFParams {
  auditLogs: AuditLog[];
  cashRegisters: CashRegister[];
  sales: Sale[];
  periodLabel: string;
  generatedBy: string;
}

/**
 * Generates and triggers download of the Official Sales & Accounting PDF Report
 */
export function generateSalesReportPDF({
  sales,
  products,
  periodLabel,
  generatedBy,
}: SalesPDFParams): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Calculate metrics
  const confirmedSales = sales.filter((s) => s.status === 'CONFIRMADA');
  const totalRevenue = confirmedSales.reduce((sum, s) => sum + s.total, 0);
  const totalDiscounts = confirmedSales.reduce((sum, s) => sum + (s.discount || 0), 0);

  const totalCost = confirmedSales.reduce((sum, s) => {
    return sum + s.items.reduce((iSum, item) => iSum + item.costPrice * item.quantity, 0);
  }, 0);

  const grossMargin = totalRevenue - totalCost;
  const marginPercentage =
    totalRevenue > 0 ? ((grossMargin / totalRevenue) * 100).toFixed(1) : '0';

  // Payment Breakdown
  let cashTotal = 0;
  let yapeTotal = 0;
  let plinTotal = 0;
  let cardTotal = 0;

  confirmedSales.forEach((s) => {
    s.payments.forEach((p) => {
      if (p.method === 'EFECTIVO') cashTotal += p.amount;
      else if (p.method === 'YAPE') yapeTotal += p.amount;
      else if (p.method === 'PLIN') plinTotal += p.amount;
      else if (p.method === 'TARJETA') cardTotal += p.amount;
    });
  });

  // Product sales aggregation
  const productMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
  confirmedSales.forEach((s) => {
    s.items.forEach((item) => {
      if (!productMap[item.productId]) {
        productMap[item.productId] = { name: item.productName, quantity: 0, revenue: 0 };
      }
      productMap[item.productId].quantity += item.quantity;
      productMap[item.productId].revenue += item.subtotal;
    });
  });

  const topProducts = Object.values(productMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  const totalItemsSold = confirmedSales.reduce(
    (sum, s) => sum + s.items.reduce((iSum, i) => iSum + i.quantity, 0),
    0
  );

  // --- HEADER SECTION ---
  doc.setFillColor(69, 26, 3); // Deep amber brown #451a03
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text("D'KIRAM PASTELERÍA FINA", 14, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Punto de Venta, Pastelería & Cafetería | RUC: 20608945123', 14, 18);

  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE CONTABLE DE VENTAS', pageWidth - 14, 12, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Emisión: ${dateFormatted} ${timeFormatted}`, pageWidth - 14, 18, { align: 'right' });

  // Metadata Bar
  let currentY = 32;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Período Contable:', 14, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(periodLabel, 48, currentY);

  doc.setFont('helvetica', 'bold');
  doc.text('Generado por:', 110, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(generatedBy, 136, currentY);

  currentY += 6;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 6;

  // --- TABLE 1: RESUMEN FINANCIERO Y MARGEN BRUTO ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(120, 53, 15); // amber-900
  doc.text('1. Resumen Ejecutivo y Utilidad Comercial', 14, currentY);
  currentY += 3;

  autoTable(doc, {
    startY: currentY,
    head: [['Indicador Contable', 'Valor Registrado', 'Observaciones / Criterio']],
    body: [
      ['Total Ventas Facturadas', `S/ ${totalRevenue.toFixed(2)}`, `${confirmedSales.length} comprobantes confirmados`],
      ['Costo de Ventas (COGS - Insumos)', `S/ ${totalCost.toFixed(2)}`, 'Costo estimado de materias primas y recetas'],
      ['Margen Bruto Comercial', `S/ ${grossMargin.toFixed(2)}`, `${marginPercentage}% de rentabilidad bruta sobre venta`],
      ['Unidades / Porciones Vendidas', `${totalItemsSold} unidades`, 'Total de productos despachados'],
      ['Descuentos Otorgados', `S/ ${totalDiscounts.toFixed(2)}`, 'Promociones y descuentos comerciales'],
      ['Ticket Promedio', `S/ ${(confirmedSales.length > 0 ? totalRevenue / confirmedSales.length : 0).toFixed(2)}`, 'Promedio facturado por comprobante'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [254, 252, 248] },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // --- TABLE 2: ARQUEO DE FONDOS POR MÉTODO DE PAGO ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(120, 53, 15);
  doc.text('2. Desglose de Recaudación por Canal de Cobro', 14, currentY);
  currentY += 3;

  autoTable(doc, {
    startY: currentY,
    head: [['Medio de Pago', 'Monto Total (S/)', '% Participación', 'Destino Contable']],
    body: [
      ['Efectivo Físico', `S/ ${cashTotal.toFixed(2)}`, `${totalRevenue > 0 ? ((cashTotal / totalRevenue) * 100).toFixed(1) : 0}%`, 'Gaveta / Arqueo de Caja Física'],
      ['Billetera Digital Yape', `S/ ${yapeTotal.toFixed(2)}`, `${totalRevenue > 0 ? ((yapeTotal / totalRevenue) * 100).toFixed(1) : 0}%`, 'Cuenta BCP Asociada (QR / Celular)'],
      ['Billetera Digital Plin', `S/ ${plinTotal.toFixed(2)}`, `${totalRevenue > 0 ? ((plinTotal / totalRevenue) * 100).toFixed(1) : 0}%`, 'Cuenta Interbancaria Asociada'],
      ['Tarjeta Crédito / Débito', `S/ ${cardTotal.toFixed(2)}`, `${totalRevenue > 0 ? ((cardTotal / totalRevenue) * 100).toFixed(1) : 0}%`, 'POS Terminal Bancario'],
      ['TOTAL CONSOLIDADO', `S/ ${totalRevenue.toFixed(2)}`, '100.0%', 'Balance General del Período'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [67, 56, 202], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // --- TABLE 3: TOP PRODUCTOS ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(120, 53, 15);
  doc.text('3. Demanda de Productos (Top Ventas)', 14, currentY);
  currentY += 3;

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Producto / Postre', 'Cantidad Vendida', 'Total Recaudado (S/)']],
    body: topProducts.length === 0
      ? [['-', 'Sin ventas registradas en el período', '0', 'S/ 0.00']]
      : topProducts.map((p, idx) => [
          `#${idx + 1}`,
          p.name,
          `${p.quantity} unid.`,
          `S/ ${p.revenue.toFixed(2)}`,
        ]),
    theme: 'grid',
    headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Check if we need a new page for detailed transactions table
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  // --- TABLE 4: RELACIÓN DE COMPROBANTES DE VENTA ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(120, 53, 15);
  doc.text('4. Detalle de Comprobantes Emitidos', 14, currentY);
  currentY += 3;

  const salesTableBody = sales.slice(0, 100).map((s) => [
    s.code,
    new Date(s.createdAt).toLocaleDateString('es-PE') + ' ' + new Date(s.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
    s.employeeName,
    s.payments.map((p) => `${p.method}: ${p.amount.toFixed(2)}`).join(' | '),
    `S/ ${s.total.toFixed(2)}`,
    s.status,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Ticket', 'Fecha y Hora', 'Cajero / Vendedor', 'Pagos', 'Total', 'Estado']],
    body: salesTableBody.length === 0 ? [['-', '-', 'No hay ventas', '-', 'S/ 0.00', '-']] : salesTableBody,
    theme: 'striped',
    headStyles: { fillColor: [68, 64, 60], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [250, 250, 249] },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        if (data.cell.raw === 'ANULADA') {
          data.cell.styles.textColor = [225, 29, 72];
          data.cell.styles.fontStyle = 'bold';
        } else if (data.cell.raw === 'CONFIRMADA') {
          data.cell.styles.textColor = [5, 150, 105];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  // --- FOOTER & SIGNATURES SECTION ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Decorative line
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 18, pageWidth - 14, pageHeight - 18);

    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.text(
      "D'Kiram Pastelería - Sistema de Gestión & POS | Documento de Control Contable",
      14,
      pageHeight - 12
    );
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - 14,
      pageHeight - 12,
      { align: 'right' }
    );
  }

  // Add signature block on the last page if space allows, or on a fresh footer section
  const lastPage = totalPages;
  doc.setPage(lastPage);
  const finalY = (doc as any).lastAutoTable?.finalY || currentY;

  if (finalY < pageHeight - 45) {
    const sigY = pageHeight - 32;
    doc.setDrawColor(148, 163, 184);
    doc.line(25, sigY, 80, sigY);
    doc.line(pageWidth - 80, sigY, pageWidth - 25, sigY);

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Firma del Cajero / Encargado', 52.5, sigY + 4, { align: 'center' });
    doc.text('Firma de Revisión Contable / Admin', pageWidth - 52.5, sigY + 4, { align: 'center' });
  }

  // Download trigger
  const fileName = `Reporte_Contable_Ventas_DKiram_${now.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

/**
 * Generates and triggers download of the Official Internal Audit & Security PDF Report
 */
export function generateAuditReportPDF({
  auditLogs,
  cashRegisters,
  sales,
  periodLabel,
  generatedBy,
}: AuditPDFParams): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Calculate audit statistics
  const annulledSales = sales.filter((s) => s.status === 'ANULADA');
  const annulledAmount = annulledSales.reduce((acc, s) => acc + s.total, 0);

  // --- HEADER SECTION ---
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text("D'KIRAM PASTELERÍA FINA", 14, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Control Interno, Auditoría & Seguridad Operacional', 14, 18);

  doc.setFont('helvetica', 'bold');
  doc.text('INFORME OFICIAL DE AUDITORÍA', pageWidth - 14, 12, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${dateFormatted} ${timeFormatted}`, pageWidth - 14, 18, { align: 'right' });

  // Metadata Bar
  let currentY = 32;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Período Auditado:', 14, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(periodLabel, 50, currentY);

  doc.setFont('helvetica', 'bold');
  doc.text('Auditor / Emisor:', 110, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(generatedBy, 142, currentY);

  currentY += 6;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 6;

  // --- TABLE 1: RESUMEN DE CONTROL INTERNO ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Resumen de Seguridad y Control Operativo', 14, currentY);
  currentY += 3;

  autoTable(doc, {
    startY: currentY,
    head: [['Rubro de Auditoría', 'Cantidad / Monto', 'Estado de Riesgo']],
    body: [
      ['Eventos Registrados en Bitácora', `${auditLogs.length} acciones registradas`, 'Normal / Trazabilidad completa'],
      ['Sesiones de Caja Aperturadas / Cerradas', `${cashRegisters.length} turnos`, 'Supervisado'],
      ['Comprobantes de Venta Anulados', `${annulledSales.length} ventas anuladas`, annulledSales.length > 0 ? 'Auditar motivos obligatorios' : 'Sin incidencias'],
      ['Impacto Económico por Anulaciones', `S/ ${annulledAmount.toFixed(2)}`, annulledAmount > 0 ? 'Verificar reposición de stock' : 'S/ 0.00'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // --- TABLE 2: AUDITORÍA DE TURNOS Y ARQUEOS DE CAJA ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Auditoría de Turnos y Arqueos de Caja', 14, currentY);
  currentY += 3;

  const cashTableBody = cashRegisters.map((cr) => {
    const diff = cr.difference || 0;
    const diffText =
      diff === 0 ? 'Cuadrado (0.00)' : diff > 0 ? `Sobrante: +S/ ${diff.toFixed(2)}` : `Faltante: -S/ ${Math.abs(diff).toFixed(2)}`;
    return [
      cr.code,
      cr.employeeName,
      new Date(cr.openedAt).toLocaleDateString('es-PE') + ' ' + new Date(cr.openedAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
      `S/ ${cr.openingAmount.toFixed(2)}`,
      `S/ ${cr.expectedCash.toFixed(2)}`,
      cr.closedAt ? `S/ ${(cr.countedCash || 0).toFixed(2)}` : 'En curso',
      diffText,
      cr.status,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Caja', 'Cajero', 'Apertura', 'Apertura (S/)', 'Esperado', 'Real', 'Diferencia', 'Estado']],
    body: cashTableBody.length === 0 ? [['-', '-', '-', '-', '-', '-', '-', 'Sin cajas']] : cashTableBody,
    theme: 'grid',
    headStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [254, 252, 248] },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Check page break
  if (currentY > pageHeight - 65) {
    doc.addPage();
    currentY = 20;
  }

  // --- TABLE 3: REGISTRO DE VENTAS ANULADAS (SI EXISTEN) ---
  if (annulledSales.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(225, 29, 72); // rose-600
    doc.text('3. Registro Crítico de Ventas Anuladas', 14, currentY);
    currentY += 3;

    const annulledTableBody = annulledSales.map((s) => [
      s.code,
      new Date(s.createdAt).toLocaleDateString('es-PE') + ' ' + new Date(s.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
      s.employeeName,
      `S/ ${s.total.toFixed(2)}`,
      s.voidReason || 'Sin motivo especificado',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Ticket Anulado', 'Fecha / Hora', 'Vendedor', 'Monto Afectado', 'Justificación Obligatoria']],
      body: annulledTableBody,
      theme: 'grid',
      headStyles: { fillColor: [190, 18, 60], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [255, 241, 242] },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Check page break
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  // --- TABLE 4: BITÁCORA DETALLADA DE EVENTOS ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('4. Pista de Auditoría Detallada (Últimos Eventos)', 14, currentY);
  currentY += 3;

  const logsTableBody = auditLogs.slice(0, 100).map((l) => [
    new Date(l.createdAt).toLocaleDateString('es-PE') + ' ' + new Date(l.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
    l.userName || l.userId,
    l.action,
    l.entity,
    l.details,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Fecha y Hora', 'Usuario Responsable', 'Acción', 'Entidad', 'Detalle Técnico']],
    body: logsTableBody.length === 0 ? [['-', '-', 'Sin registros de auditoría', '-', '-']] : logsTableBody,
    theme: 'striped',
    headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.2, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 18, pageWidth - 14, pageHeight - 18);

    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.text(
      "D'Kiram Pastelería - Módulo de Auditoría y Fiscalización Interna | Hash de Integridad Validado",
      14,
      pageHeight - 12
    );
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - 14,
      pageHeight - 12,
      { align: 'right' }
    );
  }

  // Signatures on last page
  doc.setPage(totalPages);
  const finalY = (doc as any).lastAutoTable?.finalY || currentY;
  if (finalY < pageHeight - 45) {
    const sigY = pageHeight - 32;
    doc.setDrawColor(148, 163, 184);
    doc.line(25, sigY, 80, sigY);
    doc.line(pageWidth - 80, sigY, pageWidth - 25, sigY);

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Firma del Auditor / Administrador', 52.5, sigY + 4, { align: 'center' });
    doc.text('Firma de Gerencia General', pageWidth - 52.5, sigY + 4, { align: 'center' });
  }

  const fileName = `Reporte_Auditoria_Control_DKiram_${now.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
