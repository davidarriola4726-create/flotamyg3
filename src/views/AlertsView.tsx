import React, { useState } from 'react';
import { 
  AlertTriangle, ShieldCheck, AlertCircle, Clock, Calendar, 
  Gauge, CheckCircle2, RefreshCw, Wrench, ChevronRight, Filter
} from 'lucide-react';
import { Vehicle, ServiceRecord, AlertLevel } from '../types';
import { calculateVehicleAlert, getAlertBadgeProps } from '../utils/alerts';
import { formatQ } from '../utils/pdfGenerator';

interface AlertsViewProps {
  vehicles: Vehicle[];
  onCompleteService: (vehiclePlate: string, mileage: number, costQ: number, notes: string) => void;
  onSelectVehiclePlate: (plate: string) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  vehicles,
  onCompleteService,
  onSelectVehiclePlate,
}) => {
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [selectedToComplete, setSelectedToComplete] = useState<Vehicle | null>(null);
  
  // Modal states for completing service
  const [costInput, setCostInput] = useState('1200.00');
  const [notesInput, setNotesInput] = useState('Mantenimiento preventivo periódico completado (Aceite + Filtros).');
  const [mileageInput, setMileageInput] = useState('');

  const alerts = vehicles.map(v => calculateVehicleAlert(v));

  const countDanger = alerts.filter(a => a.alertLevel === 'danger').length;
  const countWarning = alerts.filter(a => a.alertLevel === 'warning').length;
  const countOk = alerts.filter(a => a.alertLevel === 'ok').length;

  const filteredAlerts = alerts.filter(a => {
    if (filterLevel === 'all') return true;
    return a.alertLevel === filterLevel;
  });

  const handleOpenComplete = (vehicle: Vehicle) => {
    setSelectedToComplete(vehicle);
    setMileageInput(vehicle.currentMileage.toString());
  };

  const handleConfirmComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedToComplete) return;

    const km = parseInt(mileageInput, 10) || selectedToComplete.currentMileage;
    const cost = parseFloat(costInput) || 0;
    
    onCompleteService(selectedToComplete.plate, km, cost, notesInput);
    setSelectedToComplete(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
          <span>Alertas de Servicios Programados</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Monitoreo inteligente en tiempo real por fecha límite e intervalo de kilometraje para prevenir averías en carretera.
        </p>
      </div>

      {/* KPI Alert Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 🔴 Vencidos */}
        <div 
          onClick={() => setFilterLevel(filterLevel === 'danger' ? 'all' : 'danger')}
          className={`p-5 rounded-3xl border transition cursor-pointer ${
            filterLevel === 'danger' 
              ? 'ring-2 ring-red-500 shadow-lg' 
              : 'hover:shadow-md'
          } bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-900/60`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-300">
              🔴 Servicios Vencidos
            </span>
            <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-600 flex items-center justify-center font-bold text-sm">
              {countDanger}
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-red-800 dark:text-red-200 mt-2">
            {countDanger} {countDanger === 1 ? 'Unidad' : 'Unidades'}
          </div>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            Requieren ingreso inmediato a taller para evitar daño mecánico.
          </p>
        </div>

        {/* 🟡 Próximos */}
        <div 
          onClick={() => setFilterLevel(filterLevel === 'warning' ? 'all' : 'warning')}
          className={`p-5 rounded-3xl border transition cursor-pointer ${
            filterLevel === 'warning' 
              ? 'ring-2 ring-amber-500 shadow-lg' 
              : 'hover:shadow-md'
          } bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              🟡 Próximos (≤30d / ≤500km)
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold text-sm">
              {countWarning}
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-amber-800 dark:text-amber-200 mt-2">
            {countWarning} {countWarning === 1 ? 'Unidad' : 'Unidades'}
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            Programar cita de servicio con proveedores esta semana.
          </p>
        </div>

        {/* 🟢 Al día */}
        <div 
          onClick={() => setFilterLevel(filterLevel === 'ok' ? 'all' : 'ok')}
          className={`p-5 rounded-3xl border transition cursor-pointer ${
            filterLevel === 'ok' 
              ? 'ring-2 ring-emerald-500 shadow-lg' 
              : 'hover:shadow-md'
          } bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              🟢 Al Día
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold text-sm">
              {countOk}
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-emerald-800 dark:text-emerald-200 mt-2">
            {countOk} {countOk === 1 ? 'Unidad' : 'Unidades'}
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
            Mantenimiento al día con margen amplio de kilometraje y fecha.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-2">
          <Filter className="w-3.5 h-3.5" />
          <span>Filtro:</span>
        </span>
        {[
          { key: 'all', label: `Todos (${alerts.length})` },
          { key: 'danger', label: `🔴 Vencidos (${countDanger})` },
          { key: 'warning', label: `🟡 Próximos (${countWarning})` },
          { key: 'ok', label: `🟢 Al Día (${countOk})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterLevel(tab.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterLevel === tab.key
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alerts Detailed List */}
      <div className="space-y-3">
        {filteredAlerts.map(alert => {
          const badge = getAlertBadgeProps(alert.alertLevel);
          const v = alert.vehicle;

          return (
            <div
              key={v.id}
              className={`p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-3xl border ${badge.border} shadow-xs hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4`}
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl sm:text-4xl shrink-0 mt-1">
                  {badge.emoji}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span 
                      onClick={() => onSelectVehiclePlate(v.plate)}
                      className="font-mono font-black text-lg tracking-wider text-blue-600 hover:underline cursor-pointer bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800/80"
                    >
                      {v.plate}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                      {v.brand} {v.model} ({v.year})
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badge.bg} ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {alert.reason}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap pt-1">
                    <span className="flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5 text-amber-500" />
                      <span>Km actual: <strong className="text-slate-800 dark:text-slate-200">{v.currentMileage.toLocaleString()} km</strong></span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Wrench className="w-3.5 h-3.5 text-blue-500" />
                      <span>Meta de servicio: <strong className="text-slate-800 dark:text-slate-200">{alert.nextServiceMileage.toLocaleString()} km</strong></span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Fecha programada: <strong className="text-slate-800 dark:text-slate-200">{alert.nextServiceDate}</strong></span>
                    </span>
                    <span className="text-slate-400">
                      Piloto: <strong className="text-slate-700 dark:text-slate-300">{v.assignedDriver}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <button
                  onClick={() => handleOpenComplete(v)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Registrar Servicio Hecho</span>
                </button>
                <button
                  onClick={() => onSelectVehiclePlate(v.plate)}
                  className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 rounded-xl text-xs font-semibold transition"
                  title="Ver subcarpeta de placa"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: MARCAR SERVICIO HECHO Y REPROGRAMAR */}
      {selectedToComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Completar Mantenimiento ({selectedToComplete.plate})</span>
              </h3>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Al guardar, se registrará en el historial de la placa y el siguiente ciclo de mantenimiento se reprogramará automáticamente a +5,000 km y +90 días.
            </p>

            <form onSubmit={handleConfirmComplete} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kilometraje al Realizar el Servicio
                </label>
                <input
                  type="number"
                  required
                  value={mileageInput}
                  onChange={(e) => setMileageInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Costo Total del Servicio en Quetzales (Q)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={costInput}
                  onChange={(e) => setCostInput(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Detalles del Servicio Realizado
                </label>
                <textarea
                  rows={2}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300">
                <span className="font-bold">Ciclo Automático:</span> La próxima alerta se fijará en {((parseInt(mileageInput, 10) || selectedToComplete.currentMileage) + 5000).toLocaleString()} km (en 3 meses).
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedToComplete(null)}
                  className="px-3.5 py-2 text-slate-500 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm"
                >
                  Guardar y Reprogramar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
