import { AppState, Vehicle, ServiceRecord, RepairRecord, FuelLog, SparePartItem, FieldWorkSheet } from '../types';
import { INITIAL_VEHICLES, INITIAL_SERVICES, INITIAL_REPAIRS, INITIAL_FUEL_LOGS, INITIAL_SPARE_PARTS, INITIAL_FIELD_SHEETS } from '../data/initialData';

const STORAGE_KEY = 'MIG_VEHICLE_CONTROL_DATA_V1';
const AUTH_KEY = 'MIG_AUTH_SESSION_V1';

export function getInitialState(): AppState {
  if (typeof window === 'undefined') {
    return {
      vehicles: INITIAL_VEHICLES,
      services: INITIAL_SERVICES,
      repairs: INITIAL_REPAIRS,
      fuelLogs: INITIAL_FUEL_LOGS,
      spareParts: INITIAL_SPARE_PARTS,
      fieldSheets: INITIAL_FIELD_SHEETS,
      lastSyncTimestamp: Date.now(),
      isOnline: true,
      syncQueueCount: 0,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        vehicles: parsed.vehicles || INITIAL_VEHICLES,
        services: parsed.services || INITIAL_SERVICES,
        repairs: parsed.repairs || INITIAL_REPAIRS,
        fuelLogs: parsed.fuelLogs || INITIAL_FUEL_LOGS,
        spareParts: parsed.spareParts || INITIAL_SPARE_PARTS,
        fieldSheets: parsed.fieldSheets || INITIAL_FIELD_SHEETS,
        lastSyncTimestamp: parsed.lastSyncTimestamp || Date.now(),
        isOnline: navigator.onLine,
        syncQueueCount: parsed.syncQueueCount || 0,
      };
    }
  } catch (err) {
    console.error('Error reading storage state:', err);
  }

  return {
    vehicles: INITIAL_VEHICLES,
    services: INITIAL_SERVICES,
    repairs: INITIAL_REPAIRS,
    fuelLogs: INITIAL_FUEL_LOGS,
    spareParts: INITIAL_SPARE_PARTS,
    fieldSheets: INITIAL_FIELD_SHEETS,
    lastSyncTimestamp: Date.now(),
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    syncQueueCount: 0,
  };
}

export function saveStateToStorage(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      vehicles: state.vehicles,
      services: state.services,
      repairs: state.repairs,
      fuelLogs: state.fuelLogs,
      spareParts: state.spareParts,
      fieldSheets: state.fieldSheets,
      lastSyncTimestamp: state.lastSyncTimestamp,
      syncQueueCount: state.syncQueueCount,
    }));
  } catch (err) {
    console.error('Error saving state:', err);
  }
}

export function exportBackupJSON(state: AppState): string {
  const payload = {
    app: 'Control de Vehiculos MIG',
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    databaseType: 'SQLite_Firestore_Sync',
    data: {
      vehicles: state.vehicles,
      services: state.services,
      repairs: state.repairs,
      fuelLogs: state.fuelLogs,
      spareParts: state.spareParts,
      fieldSheets: state.fieldSheets,
    }
  };
  return JSON.stringify(payload, null, 2);
}

export function downloadBackupFile(state: AppState) {
  const jsonStr = exportBackupJSON(state);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `Respaldo_MIG_Vehiculos_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseImportBackup(jsonText: string): Partial<AppState> | null {
  try {
    const parsed = JSON.parse(jsonText);
    const data = parsed.data || parsed;
    if (Array.isArray(data.vehicles)) {
      return {
        vehicles: data.vehicles,
        services: Array.isArray(data.services) ? data.services : [],
        repairs: Array.isArray(data.repairs) ? data.repairs : [],
        fuelLogs: Array.isArray(data.fuelLogs) ? data.fuelLogs : [],
        spareParts: Array.isArray(data.spareParts) ? data.spareParts : [],
        fieldSheets: Array.isArray(data.fieldSheets) ? data.fieldSheets : [],
        lastSyncTimestamp: Date.now(),
        syncQueueCount: 0,
      };
    }
    return null;
  } catch (e) {
    console.error('Failed to parse backup JSON:', e);
    return null;
  }
}

export function isUserAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(AUTH_KEY) === 'true' || localStorage.getItem(AUTH_KEY) === 'true';
}

export function setAuthenticated(val: boolean, remember: boolean = true) {
  if (typeof window === 'undefined') return;
  if (val) {
    if (remember) {
      localStorage.setItem(AUTH_KEY, 'true');
    }
    sessionStorage.setItem(AUTH_KEY, 'true');
  } else {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(AUTH_KEY);
  }
}

export const loadInitialAppState = getInitialState;
export const saveAppStateToStorage = saveStateToStorage;
export const checkAuthSession = isUserAuthenticated;
export const setAuthSession = setAuthenticated;
export const clearAuthSession = () => setAuthenticated(false);
