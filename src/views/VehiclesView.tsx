import React, { useState } from 'react';
import { 
  Plus, Search, Filter, Truck, User, Gauge, AlertCircle, 
  ChevronRight, Calendar, ArrowUpDown, ShieldCheck, CheckCircle2,
  Trash2, Edit3, FolderOpen
} from 'lucide-react';
import { Vehicle, ServiceRecord, RepairRecord, FuelLog, SparePartItem, FieldWorkSheet } from '../types';
import { calculateVehicleAlert, getAlertBadgeProps } from '../utils/alerts';
import { VehicleDetailModal } from '../components/VehicleDetailModal';

interface VehiclesViewProps {
  vehicles: Vehicle[];
  services: ServiceRecord[];
  repairs: RepairRecord[];
  fuelLogs: FuelLog[];
  spareParts: SparePartItem[];
  fieldSheets: FieldWorkSheet[];
  onAddVehicle: (vehicle: Vehicle) => void;
  onUpdateVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  onUpdateMileage: (plate: string, newMileage: number) => void;
  onAddService: (service: Omit<ServiceRecord, 'id' | 'createdAt'>) => void;
  onAddRepair: (repair: Omit<RepairRecord, 'id' | 'createdAt'>) => void;
  onAddFuel: (fuel: Omit<FuelLog, 'id' | 'createdAt'>) => void;
}

export const VehiclesView: React.FC<VehiclesViewProps> = ({
  vehicles,
  services,
  repairs,
  fuelLogs,
  spareParts,
  fieldSheets,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  onUpdateMileage,
  onAddService,
  onAddRepair,
  onAddFuel,
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAlert, setFilterAlert] = useState<string>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for new vehicle
  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('Toyota');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(2023);
  const [color, setColor] = useState('Blanco');
  const [type, setType] = useState<Vehicle['type']>('pickup');
  const [driver, setDriver] = useState('');
  const [driverPhone, setDriverPhone] = useState('+502 ');
  const [mileage, setMileage] = useState(10000);
  const [fuelType, setFuelType] = useState<Vehicle['fuelType']>('Diesel');
  const [tankCap, setTankCap] = useState(20);
  const [nextDate, setNextDate] = useState('');
  const [nextKm, setNextKm] = useState(15000);

  const filteredVehicles = vehicles.filter(v => {
    const query = search.toLowerCase();
    const matchesQuery = 
      v.plate.toLowerCase().includes(query) ||
      v.brand.toLowerCase().includes(query) ||
      v.model.toLowerCase().includes(query) ||
      v.assignedDriver.toLowerCase().includes(query);

    const matchesType = filterType === 'all' || v.type === filterType;
    
    const alert = calculateVehicleAlert(v);
    const matchesAlert = filterAlert === 'all' || alert.alertLevel === filterAlert;

    return matchesQuery && matchesType && matchesAlert;
  });

  const handleCreateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedPlate = plate.toUpperCase().trim();
    if (!formattedPlate) return;

    const newVehicle: Vehicle = {
      id: `veh-${Date.now()}`,
      plate: formattedPlate,
      brand,
      model,
      year: Number(year),
      color,
      type,
      assignedDriver: driver || 'Sin Asignar',
      driverPhone,
      currentMileage: Number(mileage),
      fuelType,
      fuelTankCapacityGal: Number(tankCap),
      status: 'active',
      nextServiceDate: nextDate || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      nextServiceMileage: Number(nextKm) || (Number(mileage) + 5000),
      serviceIntervalKm: 5000,
      serviceIntervalDays: 90,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAddVehicle(newVehicle);
    setShowAddModal(false);
    // Reset
    setPlate('');
    setModel('');
    setDriver('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Truck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Gestión de Vehículos por Placa</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Cada placa cuenta con su subcarpeta interactiva de piloto, kilometraje, servicios, reparaciones, repuestos y combustible.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-lg shadow-blue-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nuevo Vehículo</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por placa única (ej. P-452FKZ), marca, modelo o piloto..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <option value="all">Todos los Tipos</option>
            <option value="pickup">Pickups 4x4</option>
            <option value="camion">Camiones</option>
            <option value="panel">Paneles de Carga</option>
            <option value="sedan">Sedanes</option>
            <option value="suv">SUVs</option>
            <option value="motocicleta">Motocicletas</option>
          </select>

          <select
            value={filterAlert}
            onChange={(e) => setFilterAlert(e.target.value)}
            className="px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <option value="all">Todas las Alertas</option>
            <option value="ok">🟢 Al Día</option>
            <option value="warning">🟡 Próximo a Vencer</option>
            <option value="danger">🔴 Vencido</option>
          </select>
        </div>
      </div>

      {/* Vehicle Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVehicles.map(vehicle => {
          const alert = calculateVehicleAlert(vehicle);
          const badge = getAlertBadgeProps(alert.alertLevel);
          const vFuels = fuelLogs.filter(f => f.vehiclePlate === vehicle.plate);
          const vServices = services.filter(s => s.vehiclePlate === vehicle.plate);

          return (
            <div
              key={vehicle.id}
              onClick={() => setSelectedVehicle(vehicle)}
              className="group bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-xl hover:border-blue-500/50 dark:hover:border-blue-500/50 transition duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Header with Plate and Alert Pill */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-lg sm:text-xl tracking-wider text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 group-hover:bg-blue-50 group-hover:text-blue-700 dark:group-hover:bg-blue-950/60 dark:group-hover:text-blue-300 transition">
                      {vehicle.plate}
                    </span>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${badge.bg} ${badge.color} border ${badge.border}`}>
                    <span>{badge.emoji}</span>
                    <span>{badge.label}</span>
                  </span>
                </div>

                {/* Model and Info */}
                <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                  {vehicle.brand} {vehicle.model}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 capitalize">
                  Año {vehicle.year} • {vehicle.color} • {vehicle.type}
                </p>

                {/* Info Blocks */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <User className="w-3.5 h-3.5" />
                      <span>Piloto:</span>
                    </span>
                    <span className="font-semibold">{vehicle.assignedDriver}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Gauge className="w-3.5 h-3.5 text-amber-500" />
                      <span>Kilometraje:</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {vehicle.currentMileage.toLocaleString()} km
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      <span>Próx. Servicio:</span>
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {vehicle.nextServiceDate || 'Pendiente'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Subfolder action */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 font-semibold group-hover:underline">
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Abrir Subcarpeta de Placa</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-blue-600 transition" />
              </div>
            </div>
          );
        })}
      </div>

      {filteredVehicles.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No se encontraron vehículos</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Intente con otro término de búsqueda o filtre por otra categoría de alertas.
          </p>
        </div>
      )}

      {/* MODAL: REGISTRAR VEHÍCULO */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              <span>Registrar Nuevo Vehículo en Flota MIG</span>
            </h3>

            <form onSubmit={handleCreateVehicle} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Número de Placa Única *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. P-123XYZ ó C-456ABC"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Vehículo
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="pickup">Pickup 4x4</option>
                    <option value="camion">Camión Pesado</option>
                    <option value="panel">Panel de Carga</option>
                    <option value="sedan">Sedán</option>
                    <option value="suv">Camioneta SUV</option>
                    <option value="motocicleta">Motocicleta</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Marca
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Toyota, Isuzu, Mitsubishi"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Línea / Modelo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Hilux 2.8 D-4D"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Año
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Color
                  </label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre del Piloto Asignado
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre completo"
                    value={driver}
                    onChange={(e) => setDriver(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono del Piloto
                  </label>
                  <input
                    type="text"
                    placeholder="+502 5555-0000"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kilometraje Actual (Odómetro)
                  </label>
                  <input
                    type="number"
                    required
                    value={mileage}
                    onChange={(e) => setMileage(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Combustible
                  </label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Regular">Regular</option>
                    <option value="Super">Super</option>
                    <option value="Gas LP">Gas LP</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md"
                >
                  Guardar Vehículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBFOLDER MODAL */}
      {selectedVehicle && (
        <VehicleDetailModal
          vehicle={selectedVehicle}
          services={services}
          repairs={repairs}
          fuelLogs={fuelLogs}
          spareParts={spareParts}
          fieldSheets={fieldSheets}
          onClose={() => setSelectedVehicle(null)}
          onUpdateMileage={onUpdateMileage}
          onAddService={onAddService}
          onAddRepair={onAddRepair}
          onAddFuel={onAddFuel}
        />
      )}
    </div>
  );
};
