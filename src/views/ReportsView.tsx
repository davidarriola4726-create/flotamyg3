import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, Printer, Download, Calendar, Filter, 
  Truck, DollarSign, Wrench, Fuel, Settings, Layers 
} from 'lucide-react';
import { Vehicle, ServiceRecord, RepairRecord, FuelLog, SparePartItem, FieldWorkSheet } from '../types';
import { formatQ, exportFleetReportPDF } from '../utils/pdfGenerator';

interface ReportsViewProps {
  vehicles: Vehicle[];
  services: ServiceRecord[];
  fuelLogs: FuelLog[];
  spareParts: SparePartItem[];
  fieldSheets: FieldWorkSheet[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  vehicles,
  services,
  fuelLogs,
  spareParts,
  fieldSheets,
}) => {
  const [selectedPlate, setSelectedPlate] = useState<string>('all');
  const [dateRangePreset, setDateRangePreset] = useState<string>('this_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [reportType, setReportType] = useState<'all' | 'fuel' | 'maintenance' | 'parts'>('all');

  // Filter logic based on plate and dates
  const filteredData = useMemo(() => {
    let now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (dateRangePreset === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (dateRangePreset === 'last_30_days') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      endDate = now;
    } else if (dateRangePreset === 'this_year') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    } else if (dateRangePreset === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59);
    }

    const isDateInRange = (dateStr: string) => {
      if (!startDate || !endDate) return true;
      const d = new Date(dateStr);
      return d >= startDate && d <= endDate;
    };

    const vFiltered = selectedPlate === 'all' 
      ? vehicles 
      : vehicles.filter(v => v.plate === selectedPlate);

    const fFiltered = fuelLogs.filter(f => {
      const matchPlate = selectedPlate === 'all' || f.vehiclePlate === selectedPlate;
      return matchPlate && isDateInRange(f.date);
    });

    const sFiltered = services.filter(s => {
      const matchPlate = selectedPlate === 'all' || s.vehiclePlate === selectedPlate;
      return matchPlate && isDateInRange(s.date);
    });

    const pFiltered = spareParts.filter(p => {
      const matchPlate = selectedPlate === 'all' || !p.assignedPlate || p.assignedPlate === selectedPlate;
      return matchPlate && isDateInRange(p.dateAdded);
    });

    const shFiltered = fieldSheets.filter(sh => {
      const matchPlate = selectedPlate === 'all' || sh.assignedPlate === selectedPlate;
      return matchPlate && isDateInRange(sh.date);
    });

    return {
      vehicles: vFiltered,
      fuelLogs: fFiltered,
      services: sFiltered,
      spareParts: pFiltered,
      fieldSheets: shFiltered,
    };
  }, [vehicles, services, fuelLogs, spareParts, fieldSheets, selectedPlate, dateRangePreset, customStartDate, customEndDate]);

  // Totals in Quetzales
  const totalFuelQ = filteredData.fuelLogs.reduce((sum, f) => sum + f.totalCostQ, 0);
  const totalServiceQ = filteredData.services.reduce((sum, s) => sum + s.costQ, 0);
  const totalPartsQ = filteredData.spareParts.reduce((sum, p) => sum + (p.totalPriceQ || (p.quantity * p.unitPriceQ)), 0);
  const grandTotalQ = totalFuelQ + totalServiceQ + totalPartsQ;
  const totalKm = filteredData.fieldSheets.reduce((sum, sh) => sum + sh.totalDistanceKm, 0);

  const handleExportPDF = () => {
    exportFleetReportPDF(
      filteredData.vehicles,
      filteredData.services,
      filteredData.fuelLogs,
      filteredData.spareParts,
      filteredData.fieldSheets,
      {
        plate: selectedPlate !== 'all' ? selectedPlate : undefined,
        startDate: customStartDate || undefined,
        endDate: customEndDate || undefined,
        reportTitle: `INFORME FINANCIERO Y OPERATIVO (${selectedPlate === 'all' ? 'TODA LA FLOTA' : `PLACA ${selectedPlate}`})`
      }
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Módulo de Informes y Auditoría</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Generación de reportes detallados por placa individual o rango de fechas, con exportación a PDF e impresión.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Generar Reporte PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-xl text-xs font-semibold transition"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Filter Parameters Box */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Filter className="w-3.5 h-3.5" />
          <span>Filtros del Informe</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
              Vehículo / Placa
            </label>
            <select
              value={selectedPlate}
              onChange={(e) => setSelectedPlate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold"
            >
              <option value="all">Toda la Flota MIG ({vehicles.length} vehículos)</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.plate}>
                  {v.plate} ({v.brand} {v.model})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
              Rango de Fechas
            </label>
            <select
              value={dateRangePreset}
              onChange={(e) => setDateRangePreset(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
            >
              <option value="this_month">Este Mes Actual</option>
              <option value="last_30_days">Últimos 30 Días</option>
              <option value="this_year">Año en Curso</option>
              <option value="all_time">Todo el Historial</option>
              <option value="custom">Rango Personalizado...</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
              Tipo de Desglose
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
            >
              <option value="all">Informe Integral (Todos los Rubros)</option>
              <option value="fuel">Solo Combustible (Q)</option>
              <option value="maintenance">Solo Mantenimiento y Servicios</option>
              <option value="parts">Solo Repuestos e Insumos</option>
            </select>
          </div>

          {dateRangePreset === 'custom' && (
            <div className="sm:col-span-3 grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-slate-500 mb-1">Desde Fecha</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Hasta Fecha</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI Financial Summary in Quetzales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <Fuel className="w-3.5 h-3.5" />
            <span>Gasto Combustible</span>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-black text-emerald-900 dark:text-emerald-200 mt-1">
            {formatQ(totalFuelQ)}
          </div>
          <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400 font-medium">
            {filteredData.fuelLogs.length} cargas
          </span>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-2xl">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800 dark:text-blue-300">
            <Wrench className="w-3.5 h-3.5" />
            <span>Servicios Taller</span>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-black text-blue-900 dark:text-blue-200 mt-1">
            {formatQ(totalServiceQ)}
          </div>
          <span className="text-[10px] text-blue-700/80 dark:text-blue-400 font-medium">
            {filteredData.services.length} servicios
          </span>
        </div>

        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
            <Settings className="w-3.5 h-3.5" />
            <span>Repuestos / Insumos</span>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-black text-amber-900 dark:text-amber-200 mt-1">
            {formatQ(totalPartsQ)}
          </div>
          <span className="text-[10px] text-amber-700/80 dark:text-amber-400 font-medium">
            {filteredData.spareParts.length} artículos
          </span>
        </div>

        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-800 dark:text-indigo-300">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Total Inversión (Q)</span>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-black text-indigo-900 dark:text-indigo-200 mt-1">
            {formatQ(grandTotalQ)}
          </div>
          <span className="text-[10px] text-indigo-700/80 dark:text-indigo-400 font-medium">
            Distancia: {totalKm.toLocaleString()} km
          </span>
        </div>
      </div>

      {/* Preview Table of Report Rows */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm">
          Vista Previa de Registros Consolidados
        </h3>

        {/* COMBUESTIBLE TABLE IF APPLICABLE */}
        {(reportType === 'all' || reportType === 'fuel') && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5" />
              <span>Registros de Combustible ({filteredData.fuelLogs.length})</span>
            </h4>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="p-2.5">Fecha</th>
                    <th className="p-2.5">Placa</th>
                    <th className="p-2.5">Piloto</th>
                    <th className="p-2.5">Galones</th>
                    <th className="p-2.5 text-right">Precio/Gal (Q)</th>
                    <th className="p-2.5 text-right">Total (Q)</th>
                    <th className="p-2.5">Estación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredData.fuelLogs.map(f => (
                    <tr key={f.id}>
                      <td className="p-2.5">{f.date}</td>
                      <td className="p-2.5 font-mono font-bold text-blue-600">{f.vehiclePlate}</td>
                      <td className="p-2.5">{f.driverName}</td>
                      <td className="p-2.5">{f.gallons} Gal</td>
                      <td className="p-2.5 text-right font-mono">{formatQ(f.pricePerGallonQ)}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-600">{formatQ(f.totalCostQ)}</td>
                      <td className="p-2.5">{f.gasStation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SERVICES TABLE IF APPLICABLE */}
        {(reportType === 'all' || reportType === 'maintenance') && (
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold uppercase text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" />
              <span>Servicios de Mantenimiento ({filteredData.services.length})</span>
            </h4>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="p-2.5">Fecha</th>
                    <th className="p-2.5">Placa</th>
                    <th className="p-2.5">Servicio Realizado</th>
                    <th className="p-2.5">Kilometraje</th>
                    <th className="p-2.5">Taller / Proveedor</th>
                    <th className="p-2.5 text-right">Costo (Q)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredData.services.map(s => (
                    <tr key={s.id}>
                      <td className="p-2.5">{s.date}</td>
                      <td className="p-2.5 font-mono font-bold text-blue-600">{s.vehiclePlate}</td>
                      <td className="p-2.5 font-medium">{s.title}</td>
                      <td className="p-2.5 font-mono">{s.mileage.toLocaleString()} km</td>
                      <td className="p-2.5">{s.workshop}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-blue-700">{formatQ(s.costQ)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
