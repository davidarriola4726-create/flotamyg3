import React, { useState, useRef } from 'react';
import { 
  Cloud, RefreshCw, Download, Upload, Database, 
  Wifi, WifiOff, CheckCircle2, AlertTriangle, ShieldCheck, 
  Server, HardDrive, Smartphone, Sparkles, Trash2
} from 'lucide-react';
import { AppState } from '../types';
import { downloadBackupFile, parseImportBackup } from '../utils/storage';

interface SyncBackupViewProps {
  appState: AppState;
  onRestoreState: (newState: Partial<AppState>) => void;
  onResetDemoData: () => void;
  onForceSync: () => Promise<void>;
}

export const SyncBackupView: React.FC<SyncBackupViewProps> = ({
  appState,
  onRestoreState,
  onResetDemoData,
  onForceSync,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [firestoreProjectId, setFirestoreProjectId] = useState('mig-control-vehiculos-2026');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncSuccess(false);
    try {
      await onForceSync();
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseImportBackup(text);
      if (parsed) {
        onRestoreState(parsed);
        setImportSuccess(true);
        setImportError('');
        setTimeout(() => setImportSuccess(false), 4000);
      } else {
        setImportError('El archivo seleccionado no tiene el formato de respaldo válido de MIG.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <Cloud className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <span>Sincronización Cloud y Respaldo de Base de Datos</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Arquitectura híbrida: funcionamiento 100% offline con almacenamiento local y sincronización bidireccional en tiempo real con Firebase Firestore.
        </p>
      </div>

      {/* Sync Status Live Card */}
      <div className="p-6 bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-950 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300 border border-white/10 shrink-0">
              {appState.isOnline ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6 text-red-400" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${appState.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <h3 className="font-bold text-lg">
                  {appState.isOnline ? 'Conexión Activa y Sincronizada' : 'Modo Sin Conexión (Offline)'}
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {appState.isOnline
                  ? 'Los cambios se guardan localmente y se replican en todos los dispositivos conectados.'
                  : 'Operando con base de datos local SQLite/IndexedDB. Los cambios se sincronizarán al detectar conexión.'}
              </p>
              <div className="text-[11px] text-blue-200 mt-2">
                Última sincronización: <strong>{new Date(appState.lastSyncTimestamp).toLocaleString('es-GT')}</strong>
              </div>
            </div>
          </div>

          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-slate-100 text-blue-950 font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition active:scale-95 disabled:opacity-60 cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-4 h-4 text-blue-700 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando con Cloud...' : 'Forzar Sincronización'}</span>
          </button>
        </div>

        {syncSuccess && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Sincronización completada exitosamente. Datos de la flota actualizados.</span>
          </div>
        )}
      </div>

      {/* Grid: Local Database Info and Backup Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Box 1: Respaldo y Restauración de Base de Datos */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <Database className="w-5 h-5 text-blue-600" />
            <span>Respaldo y Restauración de Base de Datos</span>
          </div>
          <p className="text-xs text-slate-500">
            Descargue una copia de seguridad íntegra de todos los vehículos, servicios, combustible y hojas de campo en formato JSON o restaure una copia previa.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => downloadBackupFile(appState)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-semibold shadow-md shadow-blue-600/20 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Respaldo (.json)</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-2xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Restaurar desde Archivo</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
          </div>

          {importSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Base de datos restaurada correctamente desde el archivo.</span>
            </div>
          )}

          {importError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">¿Desea recargar la flota demo?</span>
            <button
              onClick={onResetDemoData}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cargar Datos Demo MIG</span>
            </button>
          </div>
        </div>

        {/* Box 2: Almacenamiento Local Offline y Firestore */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <HardDrive className="w-5 h-5 text-emerald-600" />
            <span>Almacenamiento Local (SQLite / IndexedDB)</span>
          </div>
          <p className="text-xs text-slate-500">
            La app almacena localmente todos los registros en el dispositivo, asegurando disponibilidad total sin internet en rutas remotas de Guatemala.
          </p>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <span className="text-slate-500">Vehículos registrados:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{appState.vehicles.length} unidades</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <span className="text-slate-500">Registros de combustible:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{appState.fuelLogs.length} cargas</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <span className="text-slate-500">Hojas de campo guardadas:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{appState.fieldSheets.length} hojas</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <span className="text-slate-500">Proyecto Firestore:</span>
              <span className="font-mono font-semibold text-blue-600">{firestoreProjectId}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
