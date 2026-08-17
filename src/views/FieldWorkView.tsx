import React, { useState } from 'react';
import { 
  MapPin, Plus, Printer, Download, Search, Filter, 
  Truck, User, Calendar, Gauge, PenTool, CheckCircle2, FileText, ChevronRight 
} from 'lucide-react';
import { Vehicle, FieldWorkSheet } from '../types';
import { exportFieldWorkSheetPDF } from '../utils/pdfGenerator';
import { SignaturePad } from '../components/SignaturePad';

interface FieldWorkViewProps {
  vehicles: Vehicle[];
  fieldSheets: FieldWorkSheet[];
  onAddFieldSheet: (sheet: FieldWorkSheet) => void;
  onUpdateMileage: (plate: string, newMileage: number) => void;
}

const GUATEMALA_DEPARTMENTS = [
  'Guatemala', 'Sacatepéquez', 'Chimaltenango', 'El Progreso', 'Escuintla',
  'Santa Rosa', 'Sololá', 'Totonicapán', 'Quetzaltenango', 'Suchitepéquez',
  'Retalhuleu', 'San Marcos', 'Huehuetenango', 'Quiché', 'Baja Verapaz',
  'Alta Verapaz', 'Petén', 'Izabal', 'Zacapa', 'Chiquimula', 'Jalapa', 'Jutiapa'
];

export const FieldWorkView: React.FC<FieldWorkViewProps> = ({
  vehicles,
  fieldSheets,
  onAddFieldSheet,
  onUpdateMileage,
}) => {
  const [selectedPlate, setSelectedPlate] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSheetDetail, setSelectedSheetDetail] = useState<FieldWorkSheet | null>(null);

  // Form states
  const [clientProject, setClientProject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [workType, setWorkType] = useState<FieldWorkSheet['workType']>('Mantenimiento en Ruta');
  const [department, setDepartment] = useState('Guatemala');
  const [locationDetails, setLocationDetails] = useState('');
  const [assignedPlate, setAssignedPlate] = useState(vehicles[0]?.plate || '');
  const [driverName, setDriverName] = useState(vehicles[0]?.assignedDriver || '');
  const [technicianName, setTechnicianName] = useState('Ing. Rodrigo Asturias');
  const [startMileage, setStartMileage] = useState(vehicles[0]?.currentMileage.toString() || '0');
  const [endMileage, setEndMileage] = useState(((vehicles[0]?.currentMileage || 0) + 120).toString());
  const [description, setDescription] = useState('');
  const [materials, setMaterials] = useState('');
  const [observations, setObservations] = useState('');
  const [driverSig, setDriverSig] = useState<string>('');
  const [techSig, setTechSig] = useState<string>('');

  const handlePlateChange = (plate: string) => {
    setAssignedPlate(plate);
    const v = vehicles.find(veh => veh.plate === plate);
    if (v) {
      setDriverName(v.assignedDriver);
      setStartMileage(v.currentMileage.toString());
      setEndMileage((v.currentMileage + 100).toString());
    }
  };

  const filteredSheets = fieldSheets.filter(sheet => {
    const matchPlate = selectedPlate === 'all' || sheet.assignedPlate === selectedPlate;
    const q = searchQuery.toLowerCase();
    const matchQuery = 
      sheet.folio.toLowerCase().includes(q) ||
      sheet.clientOrProjectName.toLowerCase().includes(q) ||
      sheet.assignedPlate.toLowerCase().includes(q) ||
      sheet.driverName.toLowerCase().includes(q) ||
      sheet.technicianName.toLowerCase().includes(q) ||
      sheet.locationDepartment.toLowerCase().includes(q);

    return matchPlate && matchQuery;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleCreateSheet = (e: React.FormEvent) => {
    e.preventDefault();
    const startKm = parseInt(startMileage, 10) || 0;
    const endKm = parseInt(endMileage, 10) || startKm;
    const dist = Math.max(endKm - startKm, 0);

    const newSheet: FieldWorkSheet = {
      id: `fws-${Date.now()}`,
      folio: `TC-2026-${String(fieldSheets.length + 42).padStart(4, '0')}`,
      clientOrProjectName: clientProject.trim(),
      date,
      workType,
      locationDepartment: department,
      locationDetails: locationDetails.trim(),
      assignedPlate,
      driverName,
      technicianName,
      startMileage: startKm,
      endMileage: endKm,
      totalDistanceKm: dist,
      descriptionOfWork: description.trim(),
      materialsUsed: materials.trim(),
      observations: observations.trim(),
      driverSignatureBase64: driverSig,
      technicianSignatureBase64: techSig,
      status: (driverSig && techSig) ? 'signed' : 'completed',
      createdAt: new Date().toISOString(),
    };

    onAddFieldSheet(newSheet);

    // Update vehicle mileage if higher
    if (endKm > startKm) {
      onUpdateMileage(assignedPlate, endKm);
    }

    setShowAddModal(false);
    // Reset
    setClientProject('');
    setLocationDetails('');
    setDescription('');
    setMaterials('');
    setObservations('');
    setDriverSig('');
    setTechSig('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <MapPin className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Hojas de Trabajo de Campo</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Órdenes de servicio técnico con vinculación a placa, kilometraje y firmas digitales de chofer y técnico.
          </p>
        </div>

        <button
          onClick={() => {
            if (vehicles.length > 0) handlePlateChange(vehicles[0].plate);
            setShowAddModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-lg shadow-indigo-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Hoja de Campo</span>
        </button>
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
            <option value="all">Todas las Placas ({fieldSheets.length} hojas)</option>
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
            placeholder="Buscar por folio, cliente, chofer o depto..."
            className="w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Grid of Field Sheets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSheets.map(sheet => {
          const v = vehicles.find(veh => veh.plate === sheet.assignedPlate);

          return (
            <div
              key={sheet.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      {sheet.folio}
                    </span>
                    <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                      {sheet.assignedPlate}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{sheet.status === 'signed' ? 'Firmas Completas' : 'Completado'}</span>
                  </span>
                </div>

                {/* Title & Client */}
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {sheet.clientOrProjectName}
                  </h3>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                    {sheet.workType} • {sheet.locationDepartment}
                  </p>
                </div>

                {/* Details list */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fecha de Ejecución:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{sheet.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Piloto / Chofer:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{sheet.driverName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Técnico Responsable:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{sheet.technicianName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Recorrido:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {sheet.startMileage.toLocaleString()} km → {sheet.endMileage.toLocaleString()} km ({sheet.totalDistanceKm} km)
                    </span>
                  </div>
                </div>

                {/* Description snippet */}
                {sheet.descriptionOfWork && (
                  <p className="text-xs text-slate-500 line-clamp-2 italic">
                    "{sheet.descriptionOfWork}"
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedSheetDetail(sheet)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Ver Detalle y Firmas</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportFieldWorkSheetPDF(sheet, v)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded-xl text-xs font-semibold border border-indigo-200 dark:border-indigo-800 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Guardar PDF</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: NUEVA HOJA DE CAMPO CON FIRMAS */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              <span>Nueva Hoja de Control y Trabajo de Campo</span>
            </h3>

            <form onSubmit={handleCreateSheet} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cliente o Nombre del Proyecto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Proyecto Hidroeléctrica / Cliente Corporativo"
                    value={clientProject}
                    onChange={(e) => setClientProject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha del Trabajo *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Trabajo
                  </label>
                  <select
                    value={workType}
                    onChange={(e) => setWorkType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
                  >
                    <option value="Mantenimiento en Ruta">Mantenimiento en Ruta</option>
                    <option value="Supervisión Técnica">Supervisión Técnica</option>
                    <option value="Entrega de Carga">Entrega de Carga</option>
                    <option value="Asistencia Vial">Asistencia Vial</option>
                    <option value="Instalación">Instalación</option>
                    <option value="Inspección Periódica">Inspección Periódica</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Departamento de Guatemala
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    {GUATEMALA_DEPARTMENTS.map(dep => (
                      <option key={dep} value={dep}>{dep}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Dirección / Ubicación Detallada *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Km 214 ruta al norte, Municipio..."
                    value={locationDetails}
                    onChange={(e) => setLocationDetails(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vincular a Placa de Vehículo *
                  </label>
                  <select
                    value={assignedPlate}
                    onChange={(e) => handlePlateChange(e.target.value)}
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
                    Nombre del Chofer / Piloto
                  </label>
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Técnico / Supervisor
                  </label>
                  <input
                    type="text"
                    required
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Km Inicial
                    </label>
                    <input
                      type="number"
                      required
                      value={startMileage}
                      onChange={(e) => setStartMileage(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Km Final
                    </label>
                    <input
                      type="number"
                      required
                      value={endMileage}
                      onChange={(e) => setEndMileage(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Descripción del Trabajo Realizado *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detalle de actividades, mediciones o entregas efectuadas..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Materiales / Herramientas Utilizadas
                  </label>
                  <input
                    type="text"
                    value={materials}
                    onChange={(e) => setMaterials(e.target.value)}
                    placeholder="Repuestos instalados, herramientas especiales..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              {/* Digital Signatures Section */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-3">
                  Firmas Digitales en Pantalla
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SignaturePad
                    label="Firma del Piloto / Chofer"
                    signerName={driverName}
                    signerRole="Chofer Responsable"
                    onSave={(dataUrl) => setDriverSig(dataUrl)}
                    onClear={() => setDriverSig('')}
                  />

                  <SignaturePad
                    label="Firma del Técnico / Supervisor"
                    signerName={technicianName}
                    signerRole="Supervisor de Campo"
                    onSave={(dataUrl) => setTechSig(dataUrl)}
                    onClear={() => setTechSig('')}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-500 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md cursor-pointer"
                >
                  Generar y Guardar Hoja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL WITH SIGNATURES VIEW */}
      {selectedSheetDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-mono font-bold text-indigo-600">{selectedSheetDetail.folio}</span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">{selectedSheetDetail.clientOrProjectName}</h3>
              </div>
              <button
                onClick={() => setSelectedSheetDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                <div><strong>Fecha:</strong> {selectedSheetDetail.date}</div>
                <div><strong>Placa:</strong> <span className="font-mono font-bold">{selectedSheetDetail.assignedPlate}</span></div>
                <div><strong>Tipo:</strong> {selectedSheetDetail.workType}</div>
                <div><strong>Ubicación:</strong> {selectedSheetDetail.locationDetails} ({selectedSheetDetail.locationDepartment})</div>
                <div><strong>Piloto:</strong> {selectedSheetDetail.driverName}</div>
                <div><strong>Técnico:</strong> {selectedSheetDetail.technicianName}</div>
                <div className="col-span-2">
                  <strong>Kilometraje:</strong> {selectedSheetDetail.startMileage.toLocaleString()} km → {selectedSheetDetail.endMileage.toLocaleString()} km (Total: {selectedSheetDetail.totalDistanceKm} km)
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <strong>Descripción de Trabajos:</strong>
                <p className="mt-1 text-slate-700 dark:text-slate-300">{selectedSheetDetail.descriptionOfWork}</p>
              </div>

              {/* Signatures display */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl text-center">
                  <div className="text-[11px] font-bold text-slate-500 mb-1">Firma Chofer ({selectedSheetDetail.driverName})</div>
                  {selectedSheetDetail.driverSignatureBase64 ? (
                    <img src={selectedSheetDetail.driverSignatureBase64} alt="Firma Chofer" className="h-16 mx-auto object-contain" />
                  ) : (
                    <div className="h-16 flex items-center justify-center text-slate-400 italic">Sin firma</div>
                  )}
                </div>

                <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl text-center">
                  <div className="text-[11px] font-bold text-slate-500 mb-1">Firma Técnico ({selectedSheetDetail.technicianName})</div>
                  {selectedSheetDetail.technicianSignatureBase64 ? (
                    <img src={selectedSheetDetail.technicianSignatureBase64} alt="Firma Técnico" className="h-16 mx-auto object-contain" />
                  ) : (
                    <div className="h-16 flex items-center justify-center text-slate-400 italic">Sin firma</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => exportFieldWorkSheetPDF(selectedSheetDetail, vehicles.find(v => v.plate === selectedSheetDetail.assignedPlate))}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Exportar PDF Oficial</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
