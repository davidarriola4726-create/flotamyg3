import React, { useState } from 'react';
import { 
  Settings, Plus, Printer, Download, Filter, Search, 
  DollarSign, Package, Truck, Trash2, CheckCircle2, Tag 
} from 'lucide-react';
import { Vehicle, SparePartItem } from '../types';
import { formatQ, exportSparePartsPDF } from '../utils/pdfGenerator';

interface SparePartsViewProps {
  vehicles: Vehicle[];
  spareParts: SparePartItem[];
  onAddPart: (part: SparePartItem) => void;
  onDeletePart: (id: string) => void;
  onUpdatePartStatus: (id: string, newStatus: SparePartItem['status']) => void;
}

export const SparePartsView: React.FC<SparePartsViewProps> = ({
  vehicles,
  spareParts,
  onAddPart,
  onDeletePart,
  onUpdatePartStatus,
}) => {
  const [selectedPlate, setSelectedPlate] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [category, setCategory] = useState<SparePartItem['category']>('fluidos');
  const [quantity, setQuantity] = useState(1);
  const [unitPriceQ, setUnitPriceQ] = useState('');
  const [assignedPlate, setAssignedPlate] = useState('');
  const [supplier, setSupplier] = useState('');

  const filteredParts = spareParts.filter(part => {
    const matchPlate = selectedPlate === 'all' || part.assignedPlate === selectedPlate;
    const q = searchQuery.toLowerCase();
    const matchQuery = 
      part.name.toLowerCase().includes(q) ||
      (part.partNumber && part.partNumber.toLowerCase().includes(q)) ||
      (part.supplier && part.supplier.toLowerCase().includes(q)) ||
      (part.assignedPlate && part.assignedPlate.toLowerCase().includes(q));

    return matchPlate && matchQuery;
  });

  const totalSumQ = filteredParts.reduce((sum, p) => sum + (p.totalPriceQ || (p.quantity * p.unitPriceQ)), 0);
  const totalItemsCount = filteredParts.reduce((sum, p) => sum + p.quantity, 0);

  const handleCreatePart = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(unitPriceQ) || 0;
    const qty = Number(quantity) || 1;

    const newPart: SparePartItem = {
      id: `prt-${Date.now()}`,
      name: name.trim(),
      partNumber: partNumber.trim() || undefined,
      category,
      quantity: qty,
      unitPriceQ: price,
      totalPriceQ: qty * price,
      supplier: supplier.trim() || undefined,
      assignedPlate: assignedPlate || undefined,
      dateAdded: new Date().toISOString().split('T')[0],
      status: 'in_stock',
    };

    onAddPart(newPart);
    setShowAddModal(false);
    // Reset
    setName('');
    setPartNumber('');
    setUnitPriceQ('');
    setSupplier('');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Export / Print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Hoja de Repuestos e Insumos</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Control de inventario con precios en Quetzales (Q), vinculación por placa, suma automática y exportación a PDF.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportSparePartsPDF(filteredParts, selectedPlate !== 'all' ? selectedPlate : undefined)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-blue-100 rounded-xl text-xs font-semibold border border-blue-200 dark:border-blue-800 transition"
          >
            <Download className="w-4 h-4" />
            <span>Exportar PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-xl text-xs font-semibold transition"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Repuesto</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Total Sum Q and Item count) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Suma Total Automática en Quetzales</span>
          <div className="text-2xl sm:text-3xl font-mono font-black text-blue-700 dark:text-blue-400 mt-2">
            {formatQ(totalSumQ)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Calculado automáticamente según precios unitarios y cantidades.
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Piezas / Unidades en Hoja</span>
          <div className="text-2xl sm:text-3xl font-mono font-black text-slate-900 dark:text-white mt-2">
            {totalItemsCount} <span className="text-sm font-normal text-slate-400">Unidades</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {filteredParts.length} líneas de repuestos registradas.
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Filtro de Placa Aplicado</span>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-2 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-500" />
            <span>{selectedPlate === 'all' ? 'Toda la Flota MIG' : `Placa ${selectedPlate}`}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {selectedPlate === 'all' ? 'Mostrando todos los repuestos' : 'Filtrado exclusivamente para este vehículo'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedPlate}
            onChange={(e) => setSelectedPlate(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 w-full sm:w-auto"
          >
            <option value="all">Todas las Placas ({spareParts.length} repuestos)</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.plate}>
                {v.plate} - {v.brand} {v.model}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, código o proveedor..."
            className="w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Table: Hoja de Repuestos */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5 text-center">#</th>
                <th className="p-3.5">Nombre / Descripción</th>
                <th className="p-3.5">Código / Parte</th>
                <th className="p-3.5">Placa Vinculada</th>
                <th className="p-3.5 text-center">Cantidad</th>
                <th className="p-3.5 text-right">Precio Unitario (Q)</th>
                <th className="p-3.5 text-right">Subtotal (Q)</th>
                <th className="p-3.5 text-center">Estado</th>
                <th className="p-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredParts.map((item, index) => {
                const subtotal = item.totalPriceQ || (item.quantity * item.unitPriceQ);

                return (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3.5 text-center text-slate-400 font-mono">{index + 1}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                      {item.supplier && <span className="text-[10px] text-slate-400">Prov: {item.supplier}</span>}
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">{item.partNumber || '-'}</td>
                    <td className="p-3.5">
                      {item.assignedPlate ? (
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800/60">
                          {item.assignedPlate}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">General</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-800 dark:text-slate-200">{item.quantity}</td>
                    <td className="p-3.5 text-right font-mono text-slate-600 dark:text-slate-300">
                      {formatQ(item.unitPriceQ)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-black text-blue-700 dark:text-blue-400 text-sm">
                      {formatQ(subtotal)}
                    </td>
                    <td className="p-3.5 text-center">
                      <select
                        value={item.status}
                        onChange={(e) => onUpdatePartStatus(item.id, e.target.value as any)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-full border cursor-pointer ${
                          item.status === 'in_stock'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : item.status === 'installed'
                            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        <option value="in_stock">En Stock</option>
                        <option value="installed">Instalado</option>
                        <option value="ordered">Pedido</option>
                      </select>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => onDeletePart(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                        title="Eliminar repuesto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Table Footer: Suma Total Automática */}
            <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t-2 border-slate-300 dark:border-slate-700">
              <tr>
                <td colSpan={6} className="p-4 text-right text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  SUMA TOTAL ACUMULADA EN QUETZALES (Q):
                </td>
                <td className="p-4 text-right font-mono text-base font-black text-blue-700 dark:text-blue-400">
                  {formatQ(totalSumQ)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* MODAL: AGREGAR REPUESTO */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              <span>Agregar Repuesto a la Hoja</span>
            </h3>

            <form onSubmit={handleCreatePart} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre / Descripción del Repuesto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Filtro de Aceite Hilux 1GD"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Código de Parte / OEM
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. TOY-04152-YZZA1"
                    value={partNumber}
                    onChange={(e) => setPartNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vincular a Placa
                  </label>
                  <select
                    value={assignedPlate}
                    onChange={(e) => setAssignedPlate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold"
                  >
                    <option value="">General / Stock Central</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.plate}>
                        {v.plate} ({v.brand} {v.model})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Precio Unitario en Quetzales (Q) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={unitPriceQ}
                    onChange={(e) => setUnitPriceQ(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-blue-600"
                  />
                </div>

                {/* Subtotal automático */}
                <div className="sm:col-span-2 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between">
                  <span className="font-bold text-blue-800 dark:text-blue-300">
                    Subtotal Calculado en Quetzales (Q):
                  </span>
                  <span className="text-lg font-mono font-black text-blue-700 dark:text-blue-300">
                    {formatQ((Number(quantity) || 1) * (parseFloat(unitPriceQ) || 0))}
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Categoría
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="fluidos">Fluidos / Lubricantes / Filtros</option>
                    <option value="frenos">Frenos</option>
                    <option value="suspension">Suspensión / Dirección / Llantas</option>
                    <option value="electrico">Sistema Eléctrico / Baterías</option>
                    <option value="motor">Motor / Inyección</option>
                    <option value="carroceria">Carrocería / Luces</option>
                    <option value="otros">Otros Insumos</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Proveedor
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Siebold, Cofiño, Vital"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md"
                >
                  Guardar en Hoja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
