export const VacationStatus = {
  PENDIENTE: 'PENDIENTE',
  APROBADO: 'APROBADO',
  DENEGADO: 'DENEGADO'
} as const;

export type VacationStatus = (typeof VacationStatus)[keyof typeof VacationStatus];
