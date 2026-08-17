/**
 * Control de Vehículos MIG - Sistema de Gestión de Flota Automotriz
 * @license Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, AlertTriangle, Fuel, Settings, MapPin, 
  FileSpreadsheet, Cloud, Smartphone, LogOut, 
  Menu, X, Moon, Sun, ShieldCheck, Bell, RefreshCw, 
  ChevronRight, Car
} from 'lucide-react';

import { AppState, Vehicle, ServiceRecord, RepairRecord, FuelLog, SparePartItem, FieldWorkSheet } from './types';
import { loadInitialAppState, saveAppStateToStorage, checkAuthSession, setAuthSession, clearAuthSession } from './utils/storage';
import { calculateVehicleAlert } from './utils/alerts';

import { LoginModal } from './components/LoginModal';
import { VehicleDetailModal } from './components/VehicleDetailModal';

import { VehiclesView } from './views/VehiclesView';
import { AlertsView } from './views/AlertsView';
import { FuelView } from './views/FuelView';
import { SparePartsView } from './views/SparePartsView';
import { FieldWorkView } from './views/FieldWorkView';
import { ReportsView } from './views/ReportsView';
import { SyncBackupView } from './views/SyncBackupView';
import { AndroidCodeView } from './views/AndroidCodeView';

type TabKey = 'vehicles' | 'alerts' | 'fuel' | 'spare_parts' | 'field_work' | 'reports' | 'sync_backup' | 'android_code';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [appState, setAppState] = useState<AppState>(loadInitialAppState);
  const [activeTab, setActiveTab] = useState<TabKey>('vehicles');
  const [selectedVehicleForDetail, setSelectedVehicleForDetail] = useState<Vehicle | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Check auth session on mount
  useEffect(() => {
    const isAuth = checkAuthSession();
    setIsAuthenticated(isAuth);
  }, []);

  // Save state whenever modified
  useEffect(() => {
    saveAppStateToStorage(appState);
  }, [appState]);

  // Online / offline listeners
  useEffect(() => {
    const handleOnline = () => setAppState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setAppState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle Login
  const handleLoginSuccess = () => {
    setAuthSession(true);
    setIsAuthenticated(true);
  };

  // Handle Logout
  const handleLogout = () => {
    clearAuthSession();
    setIsAuthenticated(false);
  };

  // Calculate critical alert count
  const alertStats = useMemo(() => {
    let dangerCount = 0;
    let warningCount = 0;

    appState.vehicles.forEach(v => {
      const alert = calculateVehicleAlert(v);
      if (alert.alertLevel === 'danger') dangerCount++;
      else if (alert.alertLevel === 'warning') warningCount++;
    });

    return { dangerCount, warningCount, totalAlerts: dangerCount + warningCount };
  }, [appState.vehicles]);

  // Handlers for modifying fleet state
  const handleAddVehicle = (newVeh: Vehicle) => {
    setAppState(prev => ({
      ...prev,
      vehicles: [newVeh, ...prev.vehicles],
    }));
  };

  const handleUpdateVehicle = (updatedVeh: Vehicle) => {
    setAppState(prev => ({
      ...prev,
      vehicles: prev.vehicles.map(v => v.plate === updatedVeh.plate ? updatedVeh : v),
    }));
    if (selectedVehicleForDetail?.plate === updatedVeh.plate) {
      setSelectedVehicleForDetail(updatedVeh);
    }
  };

  const handleUpdateMileage = (plate: string, newMileage: number) => {
    setAppState(prev => ({
      ...prev,
      vehicles: prev.vehicles.map(v => {
        if (v.plate === plate) {
          return { ...v, currentMileage: Math.max(v.currentMileage, newMileage) };
        }
        return v;
      })
    }));
  };

  const handleAddService = (service: ServiceRecord) => {
    setAppState(prev => ({
      ...prev,
      services: [service, ...prev.services],
      vehicles: prev.vehicles.map(v => {
        if (v.plate === service.vehiclePlate) {
          return {
            ...v,
            currentMileage: Math.max(v.currentMileage, service.mileage),
            nextServiceMileage: service.nextServiceMileageEstimated || (v.currentMileage + 5000),
            nextServiceDate: service.nextServiceDateEstimated || v.nextServiceDate,
          };
        }
        return v;
      })
    }));
  };

  const handleAddRepair = (repair: RepairRecord) => {
    setAppState(prev => ({
      ...prev,
      repairs: [repair, ...prev.repairs],
    }));
  };

  const handleAddFuel = (fuelData: Omit<FuelLog, 'id' | 'createdAt'>) => {
    const newFuel: FuelLog = {
      ...fuelData,
      id: `fl-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setAppState(prev => ({
      ...prev,
      fuelLogs: [newFuel, ...prev.fuelLogs],
      vehicles: prev.vehicles.map(v => {
        if (v.plate === fuelData.vehiclePlate) {
          return {
            ...v,
            currentMileage: Math.max(v.currentMileage, fuelData.mileage),
          };
        }
        return v;
      })
    }));
  };

  const handleAddSparePart = (part: SparePartItem) => {
    setAppState(prev => ({
      ...prev,
      spareParts: [part, ...prev.spareParts],
    }));
  };

  const handleDeleteSparePart = (id: string) => {
    setAppState(prev => ({
      ...prev,
      spareParts: prev.spareParts.filter(p => p.id !== id),
    }));
  };

  const handleUpdatePartStatus = (id: string, newStatus: SparePartItem['status']) => {
    setAppState(prev => ({
      ...prev,
      spareParts: prev.spareParts.map(p => p.id === id ? { ...p, status: newStatus } : p),
    }));
  };

  const handleAddFieldSheet = (sheet: FieldWorkSheet) => {
    setAppState(prev => ({
      ...prev,
      fieldSheets: [sheet, ...prev.fieldSheets],
    }));
  };

  const handleCompleteServiceInAlerts = (plate: string, currentMileage: number, nextDate: string, nextKm: number) => {
    const serviceRecord: ServiceRecord = {
      id: `srv-${Date.now()}`,
      vehiclePlate: plate,
      date: new Date().toISOString().split('T')[0],
      mileage: currentMileage,
      type: 'preventive',
      title: 'Mantenimiento Preventivo Regular (Realizado por Alerta)',
      description: 'Cambio de aceite sintético, filtro de aceite, filtro de aire y revisión de frenos.',
      costQ: 850,
      workshop: 'Taller Central MIG',
      technicianName: 'Mecánico de Turno',
      nextServiceMileageEstimated: nextKm,
      nextServiceDateEstimated: nextDate,
      status: 'completed',
      createdAt: new Date().toISOString(),
    };

    handleAddService(serviceRecord);
  };

  const handleForceSync = async () => {
    // Simulate cloud Firestore replication
    await new Promise(resolve => setTimeout(resolve, 1400));
    setAppState(prev => ({
      ...prev,
      lastSyncTimestamp: new Date().toISOString(),
      isOnline: true,
    }));
  };

  const handleRestoreState = (newState: Partial<AppState>) => {
    setAppState(prev => ({
      ...prev,
      ...newState,
      lastSyncTimestamp: new Date().toISOString(),
    }));
  };

  const handleResetDemoData = () => {
    localStorage.removeItem('mig_fleet_app_state_v1');
    const fresh = loadInitialAppState();
    setAppState(fresh);
  };

  // Nav Items
  const navItems = [
    { id: 'vehicles' as TabKey, label: 'Vehículos', icon: Truck, badge: appState.vehicles.length },
    { id: 'alerts' as TabKey, label: 'Alertas', icon: AlertTriangle, badge: alertStats.totalAlerts, badgeColor: alertStats.dangerCount > 0 ? 'bg-red-600' : 'bg-amber-600' },
    { id: 'fuel' as TabKey, label: 'Combustible', icon: Fuel },
    { id: 'spare_parts' as TabKey, label: 'Repuestos', icon: Settings },
    { id: 'field_work' as TabKey, label: 'Trabajo de Campo', icon: MapPin },
    { id: 'reports' as TabKey, label: 'Informes', icon: FileSpreadsheet },
    { id: 'sync_backup' as TabKey, label: 'Sincronización', icon: Cloud },
    { id: 'android_code' as TabKey, label: 'Código Android', icon: Smartphone },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col font-sans transition-colors`}>
      {/* 1. AUTHENTICATION GATE (PASSWORD MIG2026) */}
      {!isAuthenticated && (
        <LoginModal onLoginSuccess={handleLoginSuccess} />
      )}

      {/* 2. TOP APP BAR (HEADER) */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Truck className="w-6 h-6" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                    Control de Vehículos <span className="text-blue-600 dark:text-blue-400">MIG</span>
                  </h1>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Flota 2026
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate max-w-[200px] sm:max-w-none">
                  Gestión integral, alertas por km, combustible en Q y hojas de campo
                </p>
              </div>
            </div>

            {/* Quick Status and Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Sync Status Badge */}
              <button
                onClick={() => setActiveTab('sync_backup')}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition"
              >
                <span className={`w-2 h-2 rounded-full ${appState.isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span>{appState.isOnline ? 'Cloud Sync Activo' : 'Modo Offline'}</span>
              </button>

              {/* Alert notification button */}
              <button
                onClick={() => setActiveTab('alerts')}
                className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Alertas de Mantenimiento"
              >
                <Bell className="w-5 h-5" />
                {alertStats.totalAlerts > 0 && (
                  <span className={`absolute top-1 right-1 w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center ${alertStats.dangerCount > 0 ? 'bg-red-600 animate-bounce' : 'bg-amber-500'}`}>
                    {alertStats.totalAlerts}
                  </span>
                )}
              </button>

              {/* Dark mode toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Modo Oscuro / Claro"
              >
                {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                title="Cerrar Sesión MIG2026"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 border-t border-slate-100 dark:border-slate-800/80 pt-1 pb-2 overflow-x-auto">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs shadow-blue-600/20'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex">
          <div className="w-72 bg-white dark:bg-slate-900 h-full p-5 flex flex-col justify-between shadow-2xl border-r border-slate-200 dark:border-slate-800">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <span>Menú Principal MIG</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold transition ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-slate-200 dark:bg-slate-700'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 text-center">
              Control de Vehículos MIG 2026 • v1.0
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* 3. MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-12">
        {activeTab === 'vehicles' && (
          <VehiclesView
            vehicles={appState.vehicles}
            services={appState.services}
            fuelLogs={appState.fuelLogs}
            onSelectVehicle={(veh) => setSelectedVehicleForDetail(veh)}
            onAddVehicle={handleAddVehicle}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsView
            vehicles={appState.vehicles}
            onSelectVehicle={(veh) => setSelectedVehicleForDetail(veh)}
            onCompleteService={handleCompleteServiceInAlerts}
          />
        )}

        {activeTab === 'fuel' && (
          <FuelView
            vehicles={appState.vehicles}
            fuelLogs={appState.fuelLogs}
            onAddFuel={handleAddFuel}
            onUpdateMileage={handleUpdateMileage}
          />
        )}

        {activeTab === 'spare_parts' && (
          <SparePartsView
            vehicles={appState.vehicles}
            spareParts={appState.spareParts}
            onAddPart={handleAddSparePart}
            onDeletePart={handleDeleteSparePart}
            onUpdatePartStatus={handleUpdatePartStatus}
          />
        )}

        {activeTab === 'field_work' && (
          <FieldWorkView
            vehicles={appState.vehicles}
            fieldSheets={appState.fieldSheets}
            onAddFieldSheet={handleAddFieldSheet}
            onUpdateMileage={handleUpdateMileage}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            vehicles={appState.vehicles}
            services={appState.services}
            fuelLogs={appState.fuelLogs}
            spareParts={appState.spareParts}
            fieldSheets={appState.fieldSheets}
          />
        )}

        {activeTab === 'sync_backup' && (
          <SyncBackupView
            appState={appState}
            onRestoreState={handleRestoreState}
            onResetDemoData={handleResetDemoData}
            onForceSync={handleForceSync}
          />
        )}

        {activeTab === 'android_code' && (
          <AndroidCodeView />
        )}
      </main>

      {/* 4. VEHICLE DETAIL MODAL (SUBCARPETA POR PLACA ÚNICA) */}
      {selectedVehicleForDetail && (
        <VehicleDetailModal
          vehicle={selectedVehicleForDetail}
          services={appState.services.filter(s => s.vehiclePlate === selectedVehicleForDetail.plate)}
          repairs={appState.repairs.filter(r => r.vehiclePlate === selectedVehicleForDetail.plate)}
          spareParts={appState.spareParts.filter(p => p.assignedPlate === selectedVehicleForDetail.plate)}
          fuelLogs={appState.fuelLogs.filter(f => f.vehiclePlate === selectedVehicleForDetail.plate)}
          fieldSheets={appState.fieldSheets.filter(sh => sh.assignedPlate === selectedVehicleForDetail.plate)}
          onClose={() => setSelectedVehicleForDetail(null)}
          onAddService={handleAddService}
          onAddRepair={handleAddRepair}
          onAddFuel={handleAddFuel}
          onUpdateVehicle={handleUpdateVehicle}
        />
      )}

      {/* 5. MOBILE BOTTOM NAVIGATION BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-semibold transition ${
            activeTab === 'vehicles' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500'
          }`}
        >
          <Truck className="w-5 h-5" />
          <span>Vehículos</span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-semibold transition relative ${
            activeTab === 'alerts' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
          <span>Alertas</span>
          {alertStats.totalAlerts > 0 && (
            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-red-600" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('fuel')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-semibold transition ${
            activeTab === 'fuel' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500'
          }`}
        >
          <Fuel className="w-5 h-5" />
          <span>Combustible</span>
        </button>

        <button
          onClick={() => setActiveTab('field_work')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-semibold transition ${
            activeTab === 'field_work' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500'
          }`}
        >
          <MapPin className="w-5 h-5" />
          <span>Campo</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-semibold transition ${
            activeTab === 'reports' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500'
          }`}
        >
          <FileSpreadsheet className="w-5 h-5" />
          <span>Informes</span>
        </button>
      </div>
    </div>
  );
}
