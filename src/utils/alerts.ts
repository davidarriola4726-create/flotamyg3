import { Vehicle, ServiceAlert, AlertLevel } from '../types';

export function calculateVehicleAlert(vehicle: Vehicle): ServiceAlert {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Default estimations if missing
  let nextDateStr = vehicle.nextServiceDate;
  if (!nextDateStr) {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + (vehicle.serviceIntervalDays || 90));
    nextDateStr = defaultDate.toISOString().split('T')[0];
  }

  const nextMileage = vehicle.nextServiceMileage || (vehicle.currentMileage + (vehicle.serviceIntervalKm || 5000));

  const targetDate = new Date(nextDateStr);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const kmRemaining = nextMileage - vehicle.currentMileage;

  let alertLevel: AlertLevel = 'ok';
  let reasons: string[] = [];

  // 🔴 Vencido: Date passed or mileage exceeded
  if (daysRemaining <= 0 || kmRemaining <= 0) {
    alertLevel = 'danger';
    if (daysRemaining <= 0 && kmRemaining <= 0) {
      reasons.push(`Vencido hace ${Math.abs(daysRemaining)} días y sobrepasó por ${Math.abs(kmRemaining).toLocaleString()} km`);
    } else if (daysRemaining <= 0) {
      reasons.push(`Vencido por fecha (hace ${Math.abs(daysRemaining)} días)`);
    } else {
      reasons.push(`Vencido por kilometraje (sobrepasó por ${Math.abs(kmRemaining).toLocaleString()} km)`);
    }
  } 
  // 🟡 Próximo: <= 30 days OR <= 500 km
  else if (daysRemaining <= 30 || kmRemaining <= 500) {
    alertLevel = 'warning';
    if (daysRemaining <= 30 && kmRemaining <= 500) {
      reasons.push(`Próximo en ${daysRemaining} días y ${kmRemaining.toLocaleString()} km`);
    } else if (daysRemaining <= 30) {
      reasons.push(`Próximo a vencer en ${daysRemaining} días`);
    } else {
      reasons.push(`Próximo a vencer en ${kmRemaining.toLocaleString()} km`);
    }
  } 
  // 🟢 Al día
  else {
    alertLevel = 'ok';
    reasons.push(`Al día (${daysRemaining} días y ${kmRemaining.toLocaleString()} km restantes)`);
  }

  return {
    vehicle,
    alertLevel,
    daysRemaining,
    kmRemaining,
    reason: reasons.join(' • '),
    nextServiceDate: nextDateStr,
    nextServiceMileage: nextMileage,
  };
}

export function getAlertBadgeProps(level: AlertLevel): {
  color: string;
  bg: string;
  border: string;
  label: string;
  emoji: string;
  iconClass: string;
} {
  switch (level) {
    case 'danger':
      return {
        color: 'text-red-700 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-950/40',
        border: 'border-red-200 dark:border-red-800/60',
        label: 'Vencido',
        emoji: '🔴',
        iconClass: 'text-red-600',
      };
    case 'warning':
      return {
        color: 'text-amber-700 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        border: 'border-amber-200 dark:border-amber-800/60',
        label: 'Próximo',
        emoji: '🟡',
        iconClass: 'text-amber-600',
      };
    case 'ok':
    default:
      return {
        color: 'text-emerald-700 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        border: 'border-emerald-200 dark:border-emerald-800/60',
        label: 'Al día',
        emoji: '🟢',
        iconClass: 'text-emerald-600',
      };
  }
}
