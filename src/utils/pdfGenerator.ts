import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Vehicle, ServiceRecord, RepairRecord, FuelLog, SparePartItem, FieldWorkSheet } from '../types';

// Helper to format Quetzales currency
export function formatQ(amount: number): string {
  return `Q ${amount.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// 1. PDF Hoja de Repuestos
export function exportSparePartsPDF(parts: SparePartItem[], plateFilter?: string) {
  const doc = new jsPDF();
  const title = plateFilter 
    ? `HOJA DE REPUESTOS - VEHÍCULO ${plateFilter}` 
    : 'CONTROL DE VEHÍCULOS MIG - HOJA GENERAL DE REPUESTOS';

  // Header Banner
  doc.setFillColor(15, 76, 129); // MIG Navy Blue
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTROL DE VEHÍCULOS MIG', 14, 13);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Gestión de Flota y Control de Inventario', 14, 20);

  doc.setFontSize(9);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-GT')}`, 155, 13);
  doc.text(`Doc Ref: MIG-REP-${Date.now().toString().slice(-6)}`, 155, 20);

  // Subtitle
  doc.setTextColor(33, 37, 41);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 38);

  const totalSumQ = parts.reduce((sum, p) => sum + (p.totalPriceQ || (p.quantity * p.unitPriceQ)), 0);

  const tableData = parts.map((item, index) => [
    (index + 1).toString(),
    item.name,
    item.partNumber || 'N/A',
    item.assignedPlate || 'General',
    item.quantity.toString(),
    formatQ(item.unitPriceQ),
    formatQ(item.totalPriceQ || (item.quantity * item.unitPriceQ)),
    item.status === 'in_stock' ? 'En Stock' : item.status === 'installed' ? 'Instalado' : 'Pedido'
  ]);

  autoTable(doc, {
    startY: 44,
    head: [['#', 'Nombre / Descripción', 'Código / Parte', 'Placa', 'Cant.', 'Precio Unit. (Q)', 'Subtotal (Q)', 'Estado']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 76, 129],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 45 },
      2: { cellWidth: 25 },
      3: { cellWidth: 20, fontStyle: 'bold' },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 28, halign: 'right' },
      6: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      7: { cellWidth: 20, halign: 'center' },
    },
    foot: [[
      { content: 'TOTAL ACUMULADO (Q):', colSpan: 6, styles: { halign: 'right', fontStyle: 'bold', fontSize: 10 } },
      { content: formatQ(totalSumQ), styles: { halign: 'right', fontStyle: 'bold', fontSize: 10, textColor: [15, 76, 129] } },
      { content: '', styles: {} }
    ]]
  });

  // Footer Note
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : 200;
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  doc.text('Generado automáticamente por el Sistema Control de Vehículos MIG.', 14, Math.min(finalY, 275));
  doc.text('Todos los montos expresados en Quetzales guatemaltecos (Q). Documento válido para auditoría interna.', 14, Math.min(finalY + 5, 280));

  doc.save(`MIG_Hoja_Repuestos_${plateFilter || 'General'}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// 2. PDF Hoja Trabajo de Campo (con firmas digitales incrustadas)
export function exportFieldWorkSheetPDF(sheet: FieldWorkSheet, vehicle?: Vehicle) {
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(15, 76, 129); // MIG Navy
  doc.rect(0, 0, 210, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTROL DE VEHÍCULOS MIG', 14, 13);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('HOJA DE CONTROL Y TRABAJO DE CAMPO', 14, 21);

  doc.setFontSize(9);
  doc.text(`Folio: ${sheet.folio}`, 155, 13);
  doc.text(`Fecha: ${sheet.date}`, 155, 20);

  // Info Box
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 35, 182, 35, 3, 3, 'FD');

  doc.setTextColor(15, 76, 129);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN DE LA ORDEN DE TRABAJO', 18, 42);

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  doc.text(`Cliente / Proyecto: `, 18, 49);
  doc.setFont('helvetica', 'bold');
  doc.text(sheet.clientOrProjectName, 55, 49);

  doc.setFont('helvetica', 'normal');
  doc.text(`Tipo de Trabajo: `, 18, 56);
  doc.setFont('helvetica', 'bold');
  doc.text(sheet.workType, 55, 56);

  doc.setFont('helvetica', 'normal');
  doc.text(`Ubicación / Depto: `, 18, 63);
  doc.text(`${sheet.locationDetails} (${sheet.locationDepartment})`, 55, 63);

  // Columna 2 de info box
  doc.text(`Placa Asignada: `, 115, 49);
  doc.setFont('helvetica', 'bold');
  doc.text(sheet.assignedPlate, 145, 49);

  doc.setFont('helvetica', 'normal');
  doc.text(`Km Inicial: `, 115, 56);
  doc.text(`${sheet.startMileage.toLocaleString()} km`, 145, 56);

  doc.text(`Km Final: `, 115, 63);
  doc.text(`${sheet.endMileage.toLocaleString()} km  (Recorrido: ${sheet.totalDistanceKm} km)`, 145, 63);

  // Details Section
  let y = 76;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 76, 129);
  doc.text('DESCRIPCIÓN DE ACTIVIDADES REALIZADAS', 14, y);

  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, y + 3, 182, 30, 2, 2, 'FD');

  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const splitDesc = doc.splitTextToSize(sheet.descriptionOfWork || 'Sin descripción detallada.', 175);
  doc.text(splitDesc, 18, y + 10);

  y += 38;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 76, 129);
  doc.setFontSize(10);
  doc.text('MATERIALES, REPUESTOS Y HERRAMIENTAS UTILIZADAS', 14, y);

  doc.roundedRect(14, y + 3, 182, 22, 2, 2, 'FD');
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const splitMat = doc.splitTextToSize(sheet.materialsUsed || 'Ninguno reportado.', 175);
  doc.text(splitMat, 18, y + 9);

  y += 30;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 76, 129);
  doc.setFontSize(10);
  doc.text('OBSERVACIONES GENERALES / ESTADO DE RUTA', 14, y);

  doc.roundedRect(14, y + 3, 182, 20, 2, 2, 'FD');
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const splitObs = doc.splitTextToSize(sheet.observations || 'Sin observaciones.', 175);
  doc.text(splitObs, 18, y + 9);

  // Signatures Section (Chofer & Técnico)
  y += 32;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, y, 182, 60, 3, 3, 'FD');

  doc.setTextColor(15, 76, 129);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('CONFORMIDAD Y FIRMAS DIGITALES', 18, y + 7);

  // Driver box
  doc.setDrawColor(180, 180, 180);
  doc.setFillColor(255, 255, 255);
  doc.rect(20, y + 12, 80, 32, 'FD');
  
  if (sheet.driverSignatureBase64 && sheet.driverSignatureBase64.startsWith('data:image')) {
    try {
      doc.addImage(sheet.driverSignatureBase64, 'PNG', 22, y + 13, 76, 30);
    } catch (e) {
      console.error('Error adding driver signature:', e);
    }
  }

  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.text(`Piloto: ${sheet.driverName}`, 20, y + 49);
  doc.setFont('helvetica', 'normal');
  doc.text('Firma y Conformidad de Chofer', 20, y + 54);

  // Technician box
  doc.rect(110, y + 12, 80, 32, 'FD');
  if (sheet.technicianSignatureBase64 && sheet.technicianSignatureBase64.startsWith('data:image')) {
    try {
      doc.addImage(sheet.technicianSignatureBase64, 'PNG', 112, y + 13, 76, 30);
    } catch (e) {
      console.error('Error adding tech signature:', e);
    }
  }

  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.text(`Técnico: ${sheet.technicianName}`, 110, y + 49);
  doc.setFont('helvetica', 'normal');
  doc.text('Firma y Aprobación de Supervisor', 110, y + 54);

  // Footer
  doc.setFontSize(7.5);
  doc.setTextColor(130, 130, 130);
  doc.text(`Generado en Sistema MIG • Código de Verificación Digital: ${sheet.id} • ${new Date().toLocaleString('es-GT')}`, 14, 285);

  doc.save(`MIG_Hoja_Campo_${sheet.folio}_${sheet.assignedPlate}.pdf`);
}

// 3. PDF Ficha Técnica y Expediente Completo de Vehículo
export function exportVehicleDossierPDF(
  vehicle: Vehicle, 
  services: ServiceRecord[], 
  repairs: RepairRecord[], 
  fuels: FuelLog[],
  spareParts: SparePartItem[]
) {
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(15, 76, 129);
  doc.rect(0, 0, 210, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`EXPEDIENTE DE VEHÍCULO - PLACA ${vehicle.plate}`, 14, 14);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${vehicle.brand} ${vehicle.model} (${vehicle.year}) • ${vehicle.assignedDriver}`, 14, 22);

  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-GT')}`, 155, 14);
  doc.text(`Odómetro: ${vehicle.currentMileage.toLocaleString()} km`, 155, 22);

  // Section 1: Ficha Técnica
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(14, 35, 182, 38, 2, 2, 'FD');

  doc.setTextColor(15, 76, 129);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS TÉCNICOS Y ASIGNACIÓN', 18, 42);

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  
  doc.text(`Marca/Modelo: ${vehicle.brand} ${vehicle.model}`, 18, 49);
  doc.text(`Año: ${vehicle.year} | Color: ${vehicle.color}`, 18, 55);
  doc.text(`Combustible: ${vehicle.fuelType} (Tanque: ${vehicle.fuelTankCapacityGal} Gal)`, 18, 61);
  doc.text(`Chasis/VIN: ${vehicle.chassisNumber || 'No registrado'}`, 18, 67);

  doc.text(`Piloto Asignado: ${vehicle.assignedDriver}`, 105, 49);
  doc.text(`Teléfono: ${vehicle.driverPhone || 'N/A'}`, 105, 55);
  doc.text(`Licencia: ${vehicle.driverLicense || 'N/A'}`, 105, 61);
  doc.text(`Próx. Servicio: ${vehicle.nextServiceDate || 'Pendiente'} (${vehicle.nextServiceMileage?.toLocaleString() || 0} km)`, 105, 67);

  // Section 2: Resumen de Gastos Acumulados
  const totalServicesQ = services.reduce((s, x) => s + x.costQ, 0);
  const totalRepairsQ = repairs.reduce((s, x) => s + x.costQ, 0);
  const totalFuelQ = fuels.reduce((s, x) => s + x.totalCostQ, 0);
  const totalPartsQ = spareParts.reduce((s, x) => s + (x.totalPriceQ || x.unitPriceQ * x.quantity), 0);
  const grandTotalQ = totalServicesQ + totalRepairsQ + totalFuelQ + totalPartsQ;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 76, 129);
  doc.text('HISTORIAL DE SERVICIOS PREVENTIVOS Y CORRECTIVOS', 14, 80);

  const serviceRows = services.map((s, idx) => [
    (idx + 1).toString(),
    s.date,
    `${s.mileage.toLocaleString()} km`,
    s.title,
    s.workshop,
    formatQ(s.costQ)
  ]);

  autoTable(doc, {
    startY: 84,
    head: [['#', 'Fecha', 'Kilometraje', 'Descripción del Servicio', 'Taller', 'Costo (Q)']],
    body: serviceRows.length > 0 ? serviceRows : [['-', '-', '-', 'Sin servicios registrados para esta placa', '-', 'Q 0.00']],
    theme: 'striped',
    headStyles: { fillColor: [15, 76, 129], fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      5: { halign: 'right', fontStyle: 'bold' }
    }
  });

  // Next Table: Fuel Summary
  let curY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 76, 129);
  doc.text('ÚLTIMOS REGISTROS DE COMBUSTIBLE', 14, curY);

  const fuelRows = fuels.slice(0, 8).map((f, idx) => [
    (idx + 1).toString(),
    f.date,
    `${f.mileage.toLocaleString()} km`,
    `${f.gallons} Gal (${f.fuelType})`,
    formatQ(f.pricePerGallonQ),
    formatQ(f.totalCostQ),
    f.gasStation
  ]);

  autoTable(doc, {
    startY: curY + 4,
    head: [['#', 'Fecha', 'Odómetro', 'Volumen', 'P/Gal (Q)', 'Total (Q)', 'Estación']],
    body: fuelRows.length > 0 ? fuelRows : [['-', '-', '-', '-', '-', 'Q 0.00', 'Sin registros']],
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      5: { halign: 'right', fontStyle: 'bold', textColor: [15, 76, 129] }
    }
  });

  // Summary footer box
  curY = (doc as any).lastAutoTable.finalY + 8;
  if (curY > 240) {
    doc.addPage();
    curY = 20;
  }

  doc.setFillColor(240, 249, 255);
  doc.roundedRect(14, curY, 182, 28, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 76, 129);
  doc.text('RESUMEN FINANCIERO TOTAL ASOCIADO A ESTA PLACA', 18, curY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text(`• Total Servicios: ${formatQ(totalServicesQ)}`, 18, curY + 14);
  doc.text(`• Total Reparaciones: ${formatQ(totalRepairsQ)}`, 18, curY + 21);

  doc.text(`• Total Combustible: ${formatQ(totalFuelQ)}`, 75, curY + 14);
  doc.text(`• Total Repuestos: ${formatQ(totalPartsQ)}`, 75, curY + 21);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 76, 129);
  doc.text(`INVERSIÓN TOTAL:`, 130, curY + 14);
  doc.setFontSize(12);
  doc.text(formatQ(grandTotalQ), 130, curY + 22);

  doc.save(`MIG_Expediente_${vehicle.plate}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// 4. PDF Reporte Ejecutivo Flota (por placa o rango de fechas)
export function exportFleetReportPDF(
  vehicles: Vehicle[],
  services: ServiceRecord[],
  fuelLogs: FuelLog[],
  spareParts: SparePartItem[],
  fieldSheets: FieldWorkSheet[],
  filters: { plate?: string; startDate?: string; endDate?: string; reportTitle?: string }
) {
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(15, 76, 129);
  doc.rect(0, 0, 210, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTROL DE VEHÍCULOS MIG', 14, 13);

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'normal');
  doc.text(filters.reportTitle || 'INFORME EJECUTIVO DE GESTIÓN DE FLOTA', 14, 21);

  doc.setFontSize(8.5);
  doc.text(`Fecha Emisión: ${new Date().toLocaleDateString('es-GT')}`, 150, 13);
  doc.text(`Filtro Placa: ${filters.plate || 'Todas'}`, 150, 20);

  // Summary Metrics Bar
  const totalFuelQ = fuelLogs.reduce((s, f) => s + f.totalCostQ, 0);
  const totalFuelGal = fuelLogs.reduce((s, f) => s + f.gallons, 0);
  const totalServiceQ = services.reduce((s, sv) => s + sv.costQ, 0);
  const totalPartsQ = spareParts.reduce((s, p) => s + (p.totalPriceQ || p.quantity * p.unitPriceQ), 0);
  const totalKmRecorded = fieldSheets.reduce((s, sh) => s + sh.totalDistanceKm, 0);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 35, 182, 22, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('TOTAL COMBUSTIBLE', 18, 42);
  doc.text('TOTAL SERVICIOS', 60, 42);
  doc.text('TOTAL REPUESTOS', 105, 42);
  doc.text('KM EN CAMPO', 150, 42);

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 76, 129);
  doc.text(formatQ(totalFuelQ), 18, 51);
  doc.text(formatQ(totalServiceQ), 60, 51);
  doc.text(formatQ(totalPartsQ), 105, 51);
  doc.text(`${totalKmRecorded.toLocaleString()} km`, 150, 51);

  // Table 1: Estado de Flota y Alertas
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 76, 129);
  doc.text('ESTADO DE LA FLOTA Y SERVICIOS PROGRAMADOS', 14, 65);

  const fleetRows = vehicles.map(v => [
    v.plate,
    `${v.brand} ${v.model}`,
    v.assignedDriver,
    `${v.currentMileage.toLocaleString()} km`,
    v.nextServiceDate || 'N/A',
    `${v.nextServiceMileage?.toLocaleString() || 0} km`,
    v.status === 'active' ? 'Operativo' : 'Taller'
  ]);

  autoTable(doc, {
    startY: 69,
    head: [['Placa', 'Vehículo', 'Piloto Asignado', 'Km Actual', 'Próx. Fecha', 'Próx. Km', 'Estado']],
    body: fleetRows,
    theme: 'grid',
    headStyles: { fillColor: [15, 76, 129], fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold' } }
  });

  // Table 2: Desglose de Combustible
  let nextY = (doc as any).lastAutoTable.finalY + 8;
  if (nextY > 220) {
    doc.addPage();
    nextY = 20;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 76, 129);
  doc.text('DESGLOSE DE CONSUMO DE COMBUSTIBLE', 14, nextY);

  const fuelTableRows = fuelLogs.map((fl, i) => [
    (i + 1).toString(),
    fl.date,
    fl.vehiclePlate,
    fl.driverName,
    `${fl.gallons} Gal`,
    formatQ(fl.pricePerGallonQ),
    formatQ(fl.totalCostQ),
    fl.gasStation
  ]);

  autoTable(doc, {
    startY: nextY + 4,
    head: [['#', 'Fecha', 'Placa', 'Piloto', 'Galones', 'P/Gal (Q)', 'Total (Q)', 'Gasolinera']],
    body: fuelTableRows,
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      6: { halign: 'right', fontStyle: 'bold', textColor: [15, 76, 129] }
    },
    foot: [[
      { content: 'TOTAL COMBUSTIBLE (Q):', colSpan: 6, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: formatQ(totalFuelQ), styles: { halign: 'right', fontStyle: 'bold', textColor: [15, 76, 129] } },
      { content: `${totalFuelGal.toFixed(1)} Gal`, styles: { fontStyle: 'bold' } }
    ]]
  });

  // Final Signature Section for Audit
  nextY = (doc as any).lastAutoTable.finalY + 12;
  if (nextY > 240) {
    doc.addPage();
    nextY = 25;
  }

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text('_______________________________', 30, nextY + 20);
  doc.text('Jefe de Flota y Mantenimiento', 32, nextY + 26);
  doc.text('Control de Vehículos MIG', 38, nextY + 31);

  doc.text('_______________________________', 125, nextY + 20);
  doc.text('Gerencia Administrativa / Auditoría', 120, nextY + 26);
  doc.text('Aprobación Financiera', 137, nextY + 31);

  doc.save(`MIG_Informe_Flota_${new Date().toISOString().split('T')[0]}.pdf`);
}
