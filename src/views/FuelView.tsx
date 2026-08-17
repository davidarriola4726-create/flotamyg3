import React, { useState, useMemo } from 'react';
import { 
  Fuel, Plus, Calendar, DollarSign, Gauge, TrendingUp, 
  BarChart3, Search, Filter, Truck, Download, Sparkles 
} from 'lucide-react';
import { Vehicle, FuelLog } from '../types';
import { formatQ } from '../utils/pdfGenerator';

interface FuelViewProps {
  vehicles: Vehicle[];
  fuelLogs: FuelLog[];
  onAddFuel: (fuel: Omit<FuelLog, 'id' | 'createdAt'>) => void;
  onUpdateMileage: (plate: string, newMileage: number) => void;
}

export const FuelView: React.FC<FuelViewProps> = ({
  vehicles,
  fuelLogs,
  onAddFuel,
  onUpdateMileage,
}) => {
  const [selectedPlate, setSelectedPlate] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<'weekly' | 'monthly'>('monthly');

  // Form states
  const [formPlate, setFormPlate] = useState(vehicles[0]?.plate || '');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formMileage, setFormMileage] = useState('');
  const [formGallons, setFormGallons] = useState('');
  const [formPriceGal, setFormPriceGal] = useState('28.50');
  const [formFuelType, setFormFuelType] = useState<FuelLog['fuelType']>('Diesel');
  const [formStation, setFormStation] = useState('Shell');
  const [formDriver, setFormDriver] = useState('');
  const [formInvoice, setFormInvoice] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Auto set driver and mileage when plate changes in form
  const handleFormPlateChange = (plate: string) => {
    setFormPlate(plate);
    const v = vehicles.find(veh => veh.plate === plate);
    if (v) {
      setFormDriver(v.assignedDriver);
      setFormMileage(v.currentMileage.toString());
      setFormFuelType(v.fuelType);
    }
  };

  // Filter fuel logs
  const filteredLogs = useMemo(() => {
    return fuelLogs.filter(f => {
      const matchPlate = selectedPlate === 'all' || f.vehiclePlate === selectedPlate;
      const q = searchQuery.toLowerCase();
      const matchQuery = 
        f.vehiclePlate.toLowerCase().includes(q) ||
        f.driverName.toLowerCase().includes(q) ||
        f.gasStation.toLowerCase().includes(q) ||
        (f.invoiceNumber && f.invoiceNumber.toLowerCase().includes(q));
      return matchPlate && matchQuery;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [fuelLogs, selectedPlate, searchQuery]);

  // Current month calculations
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const currentMonthLogs = useMemo(() => {
    return fuelLogs.filter(f => f.date.startsWith(currentMonthStr));
  }, [fuelLogs, currentMonthStr]);

  const currentMonthTotalQ = currentMonthLogs.reduce((sum, f) => sum + f.totalCostQ, 0);
  const currentMonthGallons = currentMonthLogs.reduce((sum, f) => sum + f.gallons, 0);
  const grandTotalFuelQ = fuelLogs.reduce((sum, f) => sum + f.totalCostQ, 0);

  // Group by plate for current month
  const monthlyByPlate = useMemo(() => {
    const map: Record<string, { totalQ: number; gallons: number; count: number }> = {};
    vehicles.forEach(v => {
      map[v.plate] = { totalQ: 0, gallons: 0, count: 0 };
    });

    currentMonthLogs.forEach(log => {
      if (!map[log.vehiclePlate]) {
        map[log.vehiclePlate] = { totalQ: 0, gallons: 0, count: 0 };
      }
      map[log.vehiclePlate].totalQ += log.totalCostQ;
      map[log.vehiclePlate].gallons += log.gallons;
      map[log.vehiclePlate].count += 1;
    });

    return Object.entries(map).map(([plate, data]) => ({
      plate,
      totalQ: data.totalQ,
      gallons: data.gallons,
      count: data.count,
    })).sort((a, b) => b.totalQ - a.totalQ);
  }, [vehicles, currentMonthLogs]);

  // Handle new fuel submit
  const handleCreateFuel = (e: React.FormEvent) => {
    e.preventDefault();
    const gals = parseFloat(formGallons) || 0;
    const priceGal = parseFloat(formPriceGal) || 0;
    const totalQ = gals * priceGal;
    const km = parseInt(formMileage, 10) || 0;

    const matchedVeh = vehicles.find(v => v.plate === formPlate);
    const driver = formDriver || matchedVeh?.assignedDriver || 'Piloto';

    onAddFuel({
      vehiclePlate: formPlate,
      date: formDate,
      mileage: km,
      gallons: gals,
      pricePerGallonQ: priceGal,
      totalCostQ: totalQ,
      fuelType: formFuelType,
      gasStation: formStation,
      invoiceNumber: formInvoice,
      driverName: driver,
      fullTank: true,
      notes: formNotes,
    });

    if (matchedVeh && km > matchedVeh.currentMileage) {
      onUpdateMileage(formPlate, km);
    }

    setShowAddModal(false);
    setFormGallons('');
    setFormInvoice('');
    setFormNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Fuel className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Control de Combustible por Placa</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Registro con montos en Quetzales (Q), suma mensual automática y comparativas semanales y mensuales.
          </p>
        </div>

        <button
          onClick={() => {
            if (vehicles.length > 0) handleFormPlateChange(vehicles[0].plate);
            setShowAddModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Carga de Combustible</span>
        </button>
      </div>

      {/* KPI Cards (Monthly Sum in Q, Gallons, Total) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Gasto del Mes en Curso (Q)</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-emerald-700 dark:text-emerald-400 mt-2">
            {formatQ(currentMonthTotalQ)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Suma automática de todas las placas en el mes actual.
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Volumen Despachado este Mes</span>
            <Fuel className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-slate-900 dark:text-white mt-2">
            {currentMonthGallons.toFixed(1)} <span className="text-sm font-normal text-slate-400">Galones</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {currentMonthLogs.length} cargas registradas en este período.
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Inversión Histórica Acumulada</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-indigo-700 dark:text-indigo-400 mt-2">
            {formatQ(grandTotalFuelQ)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Total histórico de combustible registrado en el sistema.
          </p>
        </div>
      </div>

      {/* Gráfica Comparativa Mensual / Semanal por Placa */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Gráfica Comparativa de Consumo por Placa (Quetzales)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setChartPeriod('monthly')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                chartPeriod === 'monthly'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Mes Actual
            </button>
            <button
              onClick={() => setChartPeriod('weekly')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                chartPeriod === 'weekly'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Últimas Cargas
            </button>
          </div>
        </div>

        {/* Visual Bar Comparison */}
        <div className="space-y-3.5 pt-2">
          {monthlyByPlate.map(item => {
            const maxQ = Math.max(...monthlyByPlate.map(p => p.totalQ), 1);
            const percentage = Math.round((item.totalQ / maxQ) * 100);
            const v = vehicles.find(veh => veh.plate === item.plate);

            return (
              <div key={item.plate} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      {item.plate}
                    </span>
                    <span className="text-slate-500 font-normal truncate max-w-[160px] sm:max-w-xs">
                      {v ? `${v.brand} ${v.model} • ${v.assignedDriver}` : 'Vehículo'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 font-normal">{item.gallons.toFixed(1)} Gal</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {formatQ(item.totalQ)}
                    </span>
                  </div>
                </div>

                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(percentage, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Table of Fuel Logs */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedPlate}
              onChange={(e) => setSelectedPlate(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 w-full sm:w-auto"
            >
              <option value="all">Todas las Placas ({vehicles.length})</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.plate}>
                  {v.plate} - {v.brand} {v.model}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar gasolinera, factura, chofer..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Fecha</th>
                <th className="p-3">Placa</th>
                <th className="p-3">Piloto</th>
                <th className="p-3">Odómetro</th>
                <th className="p-3">Volumen</th>
                <th className="p-3 text-right">Precio/Gal (Q)</th>
                <th className="p-3 text-right">Monto Total (Q)</th>
                <th className="p-3">Estación / Factura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="p-3 font-medium text-slate-900 dark:text-white whitespace-nowrap">{log.date}</td>
                  <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{log.vehiclePlate}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{log.driverName}</td>
                  <td className="p-3 font-mono text-slate-500">{log.mileage.toLocaleString()} km</td>
                  <td className="p-3 text-slate-700 dark:text-slate-300">{log.gallons} Gal ({log.fuelType})</td>
                  <td className="p-3 text-right font-mono text-slate-500">{formatQ(log.pricePerGallonQ)}</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {formatQ(log.totalCostQ)}
                  </td>
                  <td className="p-3 text-slate-500">
                    <div>{log.gasStation}</div>
                    {log.invoiceNumber && <span className="text-[10px] text-slate-400 font-mono">Fac: {log.invoiceNumber}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: REGISTRAR CARGA DE COMBUSTIBLE */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Fuel className="w-5 h-5 text-emerald-600" />
              <span>Registrar Carga de Combustible</span>
            </h3>

            <form onSubmit={handleCreateFuel} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Seleccionar Placa *
                  </label>
                  <select
                    value={formPlate}
                    onChange={(e) => handleFormPlateChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold"
                  >
                    {vehicles.map(v => (
                      <option key={v.id} value={v.plate}>
                        {v.plate} ({v.brand} {v.model})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha de Carga *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Odómetro / Kilometraje Actual (km) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formMileage}
                    onChange={(e) => setFormMileage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Combustible
                  </label>
                  <select
                    value={formFuelType}
                    onChange={(e) => setFormFuelType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Regular">Regular</option>
                    <option value="Super">Super</option>
                    <option value="Gas LP">Gas LP</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cantidad en Galones *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ej. 16.5"
                    value={formGallons}
                    onChange={(e) => setFormGallons(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Precio por Galón en Quetzales (Q) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formPriceGal}
                    onChange={(e) => setFormPriceGal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              {/* Total Calculated in Quetzales */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
                <span className="font-bold text-emerald-800 dark:text-emerald-300">
                  Monto Total Calculado (Q):
                </span>
                <span className="text-lg font-mono font-black text-emerald-700 dark:text-emerald-300">
                  {formatQ((parseFloat(formGallons) || 0) * (parseFloat(formPriceGal) || 0))}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Gasolinera / Estación de Servicio
                  </label>
                  <input
                    type="text"
                    value={formStation}
                    onChange={(e) => setFormStation(e.target.value)}
                    placeholder="Ej. Shell Las Américas"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    No. de Factura / Ticket
                  </label>
                  <input
                    type="text"
                    value={formInvoice}
                    onChange={(e) => setFormInvoice(e.target.value)}
                    placeholder="Ej. FAC-12930"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Piloto que realizó la carga
                  </label>
                  <input
                    type="text"
                    value={formDriver}
                    onChange={(e) => setFormDriver(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-500 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-md"
                >
                  Guardar Carga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
