import React, { useState } from 'react';
import { 
  X, Truck, User, Calendar, Gauge, Wrench, AlertTriangle, 
  Fuel, Settings, FileText, Download, Plus, CheckCircle2, 
  Clock, ShieldAlert, Phone, CreditCard, Droplets, MapPin, Tag
} from 'lucide-react';
import { Vehicle, ServiceRecord, RepairRecord, FuelLog, SparePartItem, FieldWorkSheet } from '../types';
import { calculateVehicleAlert, getAlertBadgeProps } from '../utils/alerts';
import { formatQ, exportVehicleDossierPDF } from '../utils/pdfGenerator';
import { motion, AnimatePresence } from 'motion/react';

interface VehicleDetailModalProps {
  vehicle: Vehicle;
  services: ServiceRecord[];
  repairs: RepairRecord[];
  fuelLogs: FuelLog[];
  spareParts: SparePartItem[];
  fieldSheets: FieldWorkSheet[];
  onClose: () => void;
  onUpdateMileage: (plate: string, newMileage: number) => void;
  onAddService: (service: Omit<ServiceRecord, 'id' | 'createdAt'>) => void;
  onAddRepair: (repair: Omit<RepairRecord, 'id' | 'createdAt'>) => void;
  onAddFuel: (fuel: Omit<FuelLog, 'id' | 'createdAt'>) => void;
}

type TabKey = 'resumen' | 'servicios' | 'reparaciones' | 'repuestos' | 'combustible' | 'campo';

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({
  vehicle,
  services,
  repairs,
  fuelLogs,
  spareParts,
  fieldSheets,
  onClose,
  onUpdateMileage,
  onAddService,
  onAddRepair,
  onAddFuel,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('resumen');
  const [mileageInput, setMileageInput] = useState(vehicle.currentMileage.toString());
  const [isEditingMileage, setIsEditingMileage] = useState(false);

  // Sub-modal states for quick entry
  const [showAddService, setShowAddService] = useState(false);
  const [showAddRepair, setShowAddRepair] = useState(false);
  const [showAddFuel, setShowAddFuel] = useState(false);

  // Form states
  const [srvTitle, setSrvTitle] = useState('');
  const [srvDesc, setSrvDesc] = useState('');
  const [srvWorkshop, setSrvWorkshop] = useState('Taller Central MIG');
  const [srvCost, setSrvCost] = useState('');
  const [srvMileage, setSrvMileage] = useState(vehicle.currentMileage.toString());
  const [srvDate, setSrvDate] = useState(new Date().toISOString().split('T')[0]);

  const [repDesc, setRepDesc] = useState('');
  const [repDiag, setRepDiag] = useState('');
  const [repSol, setRepSol] = useState('');
  const [repCost, setRepCost] = useState('');
  const [repWorkshop, setRepWorkshop] = useState('');
  const [repDate, setRepDate] = useState(new Date().toISOString().split('T')[0]);

  const [fuelGallons, setFuelGallons] = useState('');
  const [fuelPriceGal, setFuelPriceGal] = useState('28.50');
  const [fuelStation, setFuelStation] = useState('');
  const [fuelMileage, setFuelMileage] = useState(vehicle.currentMileage.toString());
  const [fuelDate, setFuelDate] = useState(new Date().toISOString().split('T')[0]);

  // Filter items for this vehicle
  const vehicleServices = services.filter(s => s.vehiclePlate === vehicle.plate);
  const vehicleRepairs = repairs.filter(r => r.vehiclePlate === vehicle.plate);
  const vehicleFuels = fuelLogs.filter(f => f.vehiclePlate === vehicle.plate);
  const vehicleParts = spareParts.filter(p => p.assignedPlate === vehicle.plate);
  const vehicleSheets = fieldSheets.filter(s => s.assignedPlate === vehicle.plate);

  const alert = calculateVehicleAlert(vehicle);
  const alertBadge = getAlertBadgeProps(alert.alertLevel);

  // Financial totals
  const totalServicesQ = vehicleServices.reduce((sum, s) => sum + s.costQ, 0);
  const totalRepairsQ = vehicleRepairs.reduce((sum, r) => sum + r.costQ, 0);
  const totalFuelQ = vehicleFuels.reduce((sum, f) => sum + f.totalCostQ, 0);
  const totalPartsQ = vehicleParts.reduce((sum, p) => sum + (p.totalPriceQ || p.quantity * p.unitPriceQ), 0);
  const grandTotalQ = totalServicesQ + totalRepairsQ + totalFuelQ + totalPartsQ;

  const handleSaveMileage = () => {
    const num = parseInt(mileageInput, 10);
    if (!isNaN(num) && num >= 0) {
      onUpdateMileage(vehicle.plate, num);
      setIsEditingMileage(false);
    }
  };

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(srvCost) || 0;
    const km = parseInt(srvMileage, 10) || vehicle.currentMileage;
    onAddService({
      vehiclePlate: vehicle.plate,
      date: srvDate,
      mileage: km,
      type: 'preventive',
      title: srvTitle || 'Mantenimiento Preventivo',
      description: srvDesc,
      workshop: srvWorkshop,
      costQ: cost,
      status: 'completed',
    });
    // also update vehicle mileage if higher
    if (km > vehicle.currentMileage) {
      onUpdateMileage(vehicle.plate, km);
    }
    setShowAddService(false);
    setSrvTitle('');
    setSrvDesc('');
    setSrvCost('');
  };

  const handleCreateRepair = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(repCost) || 0;
    onAddRepair({
      vehiclePlate: vehicle.plate,
      reportedDate: repDate,
      resolvedDate: repDate,
      breakdownDescription: repDesc,
      diagnosis: repDiag,
      solution: repSol,
      workshop: repWorkshop || 'Taller Central MIG',
      costQ: cost,
      driverInvolved: vehicle.assignedDriver,
      status: 'resolved',
    });
    setShowAddRepair(false);
    setRepDesc('');
    setRepDiag('');
    setRepSol('');
    setRepCost('');
  };

  const handleCreateFuel = (e: React.FormEvent) => {
    e.preventDefault();
    const gals = parseFloat(fuelGallons) || 0;
    const priceGal = parseFloat(fuelPriceGal) || 0;
    const totalQ = gals * priceGal;
    const km = parseInt(fuelMileage, 10) || vehicle.currentMileage;

    onAddFuel({
      vehiclePlate: vehicle.plate,
      date: fuelDate,
      mileage: km,
      gallons: gals,
      pricePerGallonQ: priceGal,
      totalCostQ: totalQ,
      fuelType: vehicle.fuelType,
      gasStation: fuelStation || 'Gasolinera',
      driverName: vehicle.assignedDriver,
      fullTank: true,
    });
    if (km > vehicle.currentMileage) {
      onUpdateMileage(vehicle.plate, km);
    }
    setShowAddFuel(false);
    setFuelGallons('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl sm:text-2xl font-mono font-black tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-lg border border-amber-400/20">
                  {vehicle.plate}
                </span>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${alertBadge.bg} ${alertBadge.color} border ${alertBadge.border}`}>
                  <span>{alertBadge.emoji}</span>
                  <span>{alertBadge.label}</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
                {vehicle.brand} {vehicle.model} ({vehicle.year}) • {vehicle.color}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => exportVehicleDossierPDF(vehicle, vehicleServices, vehicleRepairs, vehicleFuels, vehicleParts)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              title="Descargar PDF de expediente"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar Expediente PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Subfolder Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 sm:px-6 pt-3 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
          {[
            { key: 'resumen', label: 'Resumen y Ficha', icon: FileText, count: null },
            { key: 'servicios', label: 'Servicios', icon: Wrench, count: vehicleServices.length },
            { key: 'reparaciones', label: 'Reparaciones', icon: AlertTriangle, count: vehicleRepairs.length },
            { key: 'repuestos', label: 'Repuestos', icon: Settings, count: vehicleParts.length },
            { key: 'combustible', label: 'Combustible', icon: Fuel, count: vehicleFuels.length },
            { key: 'campo', label: 'Hojas de Campo', icon: MapPin, count: vehicleSheets.length },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabKey)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-xl transition whitespace-nowrap ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-t-2 border-blue-600 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white dark:bg-slate-900">
          {/* TAB 1: RESUMEN Y FICHA */}
          {activeTab === 'resumen' && (
            <div className="space-y-6">
              {/* Alert Status Banner */}
              <div className={`p-4 rounded-2xl border ${alertBadge.bg} ${alertBadge.border} flex items-start gap-3.5`}>
                <div className="text-2xl">{alertBadge.emoji}</div>
                <div className="flex-1">
                  <h4 className={`text-sm font-bold ${alertBadge.color}`}>
                    Estado de Mantenimiento: {alertBadge.label}
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                    {alert.reason}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs font-medium text-slate-600 dark:text-slate-400 flex-wrap">
                    <span>Próxima Fecha: <strong className="text-slate-900 dark:text-white">{alert.nextServiceDate}</strong></span>
                    <span>Próximo Kilometraje: <strong className="text-slate-900 dark:text-white">{alert.nextServiceMileage.toLocaleString()} km</strong></span>
                  </div>
                </div>
              </div>

              {/* Grid with Pilot info and Technical details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Piloto Asignado */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-3 text-slate-900 dark:text-white font-bold text-sm">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Piloto Asignado</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700/60">
                      <span className="text-slate-500">Nombre Completo:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{vehicle.assignedDriver}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700/60">
                      <span className="text-slate-500">Teléfono Móvil:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{vehicle.driverPhone || 'No registrado'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700/60">
                      <span className="text-slate-500">No. Licencia:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{vehicle.driverLicense || 'Tipo A'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Estado de Asignación:</span>
                      <span className="text-emerald-600 font-semibold">Titular Activo</span>
                    </div>
                  </div>
                </div>

                {/* Odómetro y Kilometraje */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                      <Gauge className="w-4 h-4 text-amber-500" />
                      <span>Odómetro Actual</span>
                    </div>
                    {!isEditingMileage ? (
                      <button
                        onClick={() => setIsEditingMileage(true)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        Actualizar
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={handleSaveMileage}
                          className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs font-semibold"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setIsEditingMileage(false)}
                          className="text-xs text-slate-400"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>

                  {!isEditingMileage ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-mono font-black text-slate-900 dark:text-white">
                        {vehicle.currentMileage.toLocaleString()}
                      </span>
                      <span className="text-sm font-semibold text-slate-500">kilómetros</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={mileageInput}
                        onChange={(e) => setMileageInput(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-bold"
                        autoFocus
                      />
                      <span className="text-xs text-slate-500">km</span>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
                    <span>Intervalo de Servicio:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Cada {vehicle.serviceIntervalKm?.toLocaleString() || '5,000'} km</span>
                  </div>
                </div>
              </div>

              {/* Ficha Técnica Detallada */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
                  Especificaciones del Vehículo
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Tipo:</span>
                    <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">{vehicle.type}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Combustible:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{vehicle.fuelType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Capacidad Tanque:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{vehicle.fuelTankCapacityGal} Galones</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">No. Chasis / VIN:</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{vehicle.chassisNumber || 'MHF-2918'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">No. Motor:</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{vehicle.engineNumber || '1GD-882'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Fecha Registro:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{new Date(vehicle.createdAt).toLocaleDateString('es-GT')}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block">Notas Operativas:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{vehicle.notes || 'Sin observaciones.'}</span>
                  </div>
                </div>
              </div>

              {/* Financial KPI Cards for this plate */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300">Servicios (Q)</span>
                  <div className="text-base font-bold font-mono text-blue-900 dark:text-blue-100 mt-0.5">{formatQ(totalServicesQ)}</div>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300">Reparaciones (Q)</span>
                  <div className="text-base font-bold font-mono text-amber-900 dark:text-amber-100 mt-0.5">{formatQ(totalRepairsQ)}</div>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">Combustible (Q)</span>
                  <div className="text-base font-bold font-mono text-emerald-900 dark:text-emerald-100 mt-0.5">{formatQ(totalFuelQ)}</div>
                </div>
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-300">Inversión Total (Q)</span>
                  <div className="text-base font-bold font-mono text-indigo-900 dark:text-indigo-100 mt-0.5">{formatQ(grandTotalQ)}</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SERVICIOS */}
          {activeTab === 'servicios' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Historial de Servicios de Mantenimiento ({vehicleServices.length})
                </h4>
                <button
                  onClick={() => setShowAddService(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrar Servicio</span>
                </button>
              </div>

              {showAddService && (
                <form onSubmit={handleCreateService} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-3">
                  <h5 className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase">Nuevo Servicio Preventivo / Correctivo</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-500 mb-1">Título del Servicio</label>
                      <input
                        type="text"
                        required
                        value={srvTitle}
                        onChange={(e) => setSrvTitle(e.target.value)}
                        placeholder="Ej. Cambio de aceite y filtros"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Fecha</label>
                      <input
                        type="date"
                        required
                        value={srvDate}
                        onChange={(e) => setSrvDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Kilometraje al Servicio</label>
                      <input
                        type="number"
                        required
                        value={srvMileage}
                        onChange={(e) => setSrvMileage(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Taller / Proveedor</label>
                      <input
                        type="text"
                        value={srvWorkshop}
                        onChange={(e) => setSrvWorkshop(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Costo en Quetzales (Q)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={srvCost}
                        onChange={(e) => setSrvCost(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-slate-500 mb-1">Descripción de Trabajos y Repuestos Cambiados</label>
                      <textarea
                        rows={2}
                        value={srvDesc}
                        onChange={(e) => setSrvDesc(e.target.value)}
                        placeholder="Detalle de trabajos realizados..."
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddService(false)}
                      className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                    >
                      Guardar Servicio
                    </button>
                  </div>
                </form>
              )}

              {vehicleServices.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No hay registros de servicio guardados para este vehículo.
                </div>
              ) : (
                <div className="space-y-3">
                  {vehicleServices.map(srv => (
                    <div key={srv.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h5 className="font-bold text-slate-900 dark:text-white text-sm">{srv.title}</h5>
                          <p className="text-slate-500 mt-0.5">{srv.workshop} • {srv.date} • {srv.mileage.toLocaleString()} km</p>
                        </div>
                        <span className="font-mono font-bold text-blue-700 dark:text-blue-400 text-sm">{formatQ(srv.costQ)}</span>
                      </div>
                      {srv.description && (
                        <p className="text-slate-600 dark:text-slate-300 mt-2 bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/60">
                          {srv.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REPARACIONES */}
          {activeTab === 'reparaciones' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Averías y Reparaciones ({vehicleRepairs.length})
                </h4>
                <button
                  onClick={() => setShowAddRepair(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Reportar Reparación</span>
                </button>
              </div>

              {showAddRepair && (
                <form onSubmit={handleCreateRepair} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-3">
                  <h5 className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase">Nueva Reparación o Corrección</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-500 mb-1">Fecha</label>
                      <input
                        type="date"
                        required
                        value={repDate}
                        onChange={(e) => setRepDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Costo Total (Q)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={repCost}
                        onChange={(e) => setRepCost(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-slate-500 mb-1">Falla / Avería Reportada</label>
                      <input
                        type="text"
                        required
                        value={repDesc}
                        onChange={(e) => setRepDesc(e.target.value)}
                        placeholder="Ej. Ruido en suspensión delantera"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Diagnóstico Mecánico</label>
                      <input
                        type="text"
                        value={repDiag}
                        onChange={(e) => setRepDiag(e.target.value)}
                        placeholder="Causa de la falla"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Solución Aplicada</label>
                      <input
                        type="text"
                        value={repSol}
                        onChange={(e) => setRepSol(e.target.value)}
                        placeholder="Cambio de pieza, ajuste..."
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddRepair(false)}
                      className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                    >
                      Guardar Reparación
                    </button>
                  </div>
                </form>
              )}

              {vehicleRepairs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No hay averías o reparaciones registradas.
                </div>
              ) : (
                <div className="space-y-3">
                  {vehicleRepairs.map(rep => (
                    <div key={rep.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h5 className="font-bold text-slate-900 dark:text-white text-sm">{rep.breakdownDescription}</h5>
                          <p className="text-slate-500 mt-0.5">{rep.reportedDate} • Piloto: {rep.driverInvolved || vehicle.assignedDriver}</p>
                        </div>
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">{formatQ(rep.costQ)}</span>
                      </div>
                      <div className="mt-2 space-y-1 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/60">
                        {rep.diagnosis && <p><strong>Diagnóstico:</strong> {rep.diagnosis}</p>}
                        {rep.solution && <p><strong>Solución:</strong> {rep.solution}</p>}
                        {rep.workshop && <p className="text-slate-400">Taller: {rep.workshop}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: REPUESTOS ASIGNADOS */}
          {activeTab === 'repuestos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Repuestos Asignados a la Placa {vehicle.plate} ({vehicleParts.length})
                </h4>
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                  Total Repuestos: {formatQ(totalPartsQ)}
                </span>
              </div>

              {vehicleParts.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No hay repuestos directamente vinculados a esta placa en el inventario. Puede asignarlos desde la sección de "Hoja de Repuestos".
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-3">Nombre del Repuesto</th>
                        <th className="p-3">Código</th>
                        <th className="p-3 text-center">Cant.</th>
                        <th className="p-3 text-right">Precio Unit. (Q)</th>
                        <th className="p-3 text-right">Subtotal (Q)</th>
                        <th className="p-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {vehicleParts.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-medium text-slate-900 dark:text-white">{p.name}</td>
                          <td className="p-3 font-mono text-slate-500">{p.partNumber || '-'}</td>
                          <td className="p-3 text-center">{p.quantity}</td>
                          <td className="p-3 text-right font-mono">{formatQ(p.unitPriceQ)}</td>
                          <td className="p-3 text-right font-mono font-bold text-blue-700 dark:text-blue-400">
                            {formatQ(p.totalPriceQ || p.quantity * p.unitPriceQ)}
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                              {p.status === 'in_stock' ? 'En Stock' : 'Instalado'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: COMBUSTIBLE */}
          {activeTab === 'combustible' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Cargas de Combustible ({vehicleFuels.length})
                  </h4>
                  <p className="text-xs text-slate-500">Suma acumulada para esta placa: {formatQ(totalFuelQ)}</p>
                </div>
                <button
                  onClick={() => setShowAddFuel(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrar Carga</span>
                </button>
              </div>

              {showAddFuel && (
                <form onSubmit={handleCreateFuel} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-3">
                  <h5 className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase">Nueva Carga de Combustible</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-500 mb-1">Fecha de Carga</label>
                      <input
                        type="date"
                        required
                        value={fuelDate}
                        onChange={(e) => setFuelDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Kilometraje Actual</label>
                      <input
                        type="number"
                        required
                        value={fuelMileage}
                        onChange={(e) => setFuelMileage(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Galones</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={fuelGallons}
                        onChange={(e) => setFuelGallons(e.target.value)}
                        placeholder="Ej. 15.5"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Precio por Galón (Q)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={fuelPriceGal}
                        onChange={(e) => setFuelPriceGal(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Total Calculado (Q)</label>
                      <div className="px-3 py-2 bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {formatQ((parseFloat(fuelGallons) || 0) * (parseFloat(fuelPriceGal) || 0))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Gasolinera / Estación</label>
                      <input
                        type="text"
                        value={fuelStation}
                        onChange={(e) => setFuelStation(e.target.value)}
                        placeholder="Ej. Shell Las Américas"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddFuel(false)}
                      className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                    >
                      Guardar Carga
                    </button>
                  </div>
                </form>
              )}

              {vehicleFuels.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No hay registros de combustible para este vehículo.
                </div>
              ) : (
                <div className="space-y-2">
                  {vehicleFuels.map(f => (
                    <div key={f.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{f.date}</span>
                          <span className="text-slate-400">•</span>
                          <span className="font-mono text-slate-600 dark:text-slate-300">{f.mileage.toLocaleString()} km</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500">{f.gasStation}</span>
                        </div>
                        <p className="text-slate-500 mt-0.5">{f.gallons} Galones a {formatQ(f.pricePerGallonQ)}/Gal ({f.fuelType})</p>
                      </div>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                        {formatQ(f.totalCostQ)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: HOJAS DE CAMPO VINCULADAS */}
          {activeTab === 'campo' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Hojas de Trabajo de Campo Asignadas ({vehicleSheets.length})
              </h4>

              {vehicleSheets.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No hay hojas de campo vinculadas a esta placa. Puede generar una nueva en la sección "Hoja Trabajo de Campo".
                </div>
              ) : (
                <div className="space-y-3">
                  {vehicleSheets.map(sh => (
                    <div key={sh.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{sh.folio}</span>
                            <span className="text-slate-400">•</span>
                            <span className="font-bold text-slate-900 dark:text-white">{sh.workType}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 mt-0.5">{sh.clientOrProjectName}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          {sh.status === 'signed' ? 'Firmada' : 'Completada'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-slate-500 text-[11px] pt-1">
                        <span>Fecha: {sh.date}</span>
                        <span>Ubicación: {sh.locationDetails} ({sh.locationDepartment})</span>
                        <span>Distancia: {sh.totalDistanceKm} km</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
