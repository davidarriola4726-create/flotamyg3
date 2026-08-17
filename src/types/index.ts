export type AlertLevel = 'ok' | 'warning' | 'danger';

export interface Vehicle {
  id: string;
  plate: string; // e.g. "P-452FKZ"
  brand: string; // e.g. "Toyota"
  model: string; // e.g. "Hilux 2.8 D-4D"
  year: number;
  color: string;
  type: 'pickup' | 'camion' | 'sedan' | 'panel' | 'suv' | 'motocicleta';
  vin?: string;
  chassisNumber?: string;
  engineNumber?: string;
  assignedDriver: string; // Nombre del piloto
  driverPhone?: string;
  driverLicense?: string;
  currentMileage: number; // km actuales
  fuelType: 'Diesel' | 'Regular' | 'Super' | 'Gas LP';
  fuelTankCapacityGal: number;
  status: 'active' | 'maintenance' | 'inactive';
  notes?: string;
  nextServiceDate?: string; // YYYY-MM-DD
  nextServiceMileage?: number; // km
  serviceIntervalKm: number; // ej. 5000 km
  serviceIntervalDays: number; // ej. 90 dias
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRecord {
  id: string;
  vehiclePlate: string;
  date: string; // YYYY-MM-DD
  mileage: number; // km al momento del servicio
  type: 'preventive' | 'corrective' | 'emergency';
  title: string; // ej. "Cambio de aceite y filtros"
  description: string;
  workshop: string; // Nombre del taller
  technicianName?: string;
  costQ: number; // Costo en Quetzales
  invoiceNumber?: string;
  nextServiceMileageEstimated?: number;
  nextServiceDateEstimated?: string;
  partsUsed?: string[];
  status: 'completed' | 'in_progress' | 'scheduled';
  createdAt: string;
}

export interface RepairRecord {
  id: string;
  vehiclePlate: string;
  reportedDate: string;
  resolvedDate?: string;
  breakdownDescription: string;
  diagnosis: string;
  solution: string;
  workshop: string;
  costQ: number; // Costo en Quetzales
  driverInvolved?: string;
  status: 'pending' | 'in_repair' | 'resolved';
  createdAt: string;
}

export interface FuelLog {
  id: string;
  vehiclePlate: string;
  date: string; // YYYY-MM-DD
  mileage: number; // Odómetro
  gallons: number;
  pricePerGallonQ: number;
  totalCostQ: number; // Monto total en Quetzales (Q)
  fuelType: 'Diesel' | 'Regular' | 'Super' | 'Gas LP';
  gasStation: string; // ej. "Shell Las Américas"
  invoiceNumber?: string;
  driverName: string;
  fullTank: boolean;
  notes?: string;
  createdAt: string;
}

export interface SparePartItem {
  id: string;
  partNumber?: string;
  name: string; // Nombre del repuesto
  category: 'motor' | 'frenos' | 'suspension' | 'electrico' | 'carroceria' | 'fluidos' | 'otros';
  quantity: number;
  unitPriceQ: number; // Precio unitario en Quetzales
  totalPriceQ: number; // quantity * unitPriceQ
  supplier?: string;
  assignedPlate?: string; // Vinculable a placa
  serviceId?: string;
  dateAdded: string;
  status: 'in_stock' | 'installed' | 'ordered';
}

export interface FieldWorkSheet {
  id: string;
  folio: string; // ej. "TC-2026-0042"
  clientOrProjectName: string;
  date: string;
  workType: 'Mantenimiento en Ruta' | 'Supervisión Técnica' | 'Entrega de Carga' | 'Asistencia Vial' | 'Instalación' | 'Inspección Periódica' | 'Otro';
  customWorkType?: string;
  locationDepartment: string; // ej. "Guatemala", "Quetzaltenango", "Escuintla"
  locationDetails: string;
  assignedPlate: string; // Vinculada a placa
  driverName: string;
  technicianName: string;
  startMileage: number;
  endMileage: number;
  totalDistanceKm: number;
  descriptionOfWork: string;
  materialsUsed?: string;
  observations?: string;
  driverSignatureBase64?: string; // Firma chofer en canvas
  technicianSignatureBase64?: string; // Firma técnico en canvas
  status: 'draft' | 'completed' | 'signed';
  createdAt: string;
}

export interface ServiceAlert {
  vehicle: Vehicle;
  alertLevel: AlertLevel; // 'ok' | 'warning' | 'danger'
  daysRemaining: number;
  kmRemaining: number;
  reason: string;
  nextServiceDate: string;
  nextServiceMileage: number;
}

export interface AppState {
  vehicles: Vehicle[];
  services: ServiceRecord[];
  repairs: RepairRecord[];
  fuelLogs: FuelLog[];
  spareParts: SparePartItem[];
  fieldSheets: FieldWorkSheet[];
  lastSyncTimestamp: number;
  isOnline: boolean;
  syncQueueCount: number;
}
