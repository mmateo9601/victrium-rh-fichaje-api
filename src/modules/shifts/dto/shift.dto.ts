export type ShiftDayDto = {
  id: number;
  dayOfWeek: number;
  working: boolean;
  startTime: string | null;
  endTime: string | null;
  breakMinutes: number;
  workingMinutes: number | null;
  crossesMidnight: boolean;
};

export type ShiftSummaryDto = {
  id: number;
  name: string;
  code: string;
  color: string | null;
};

export type ShiftDto = ShiftSummaryDto & {
  description: string | null;
  active: boolean;
  companyId: number | null;
  companyName: string | null;
  days: ShiftDayDto[];
  assignmentsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateShiftDayDto = Omit<ShiftDayDto, 'id'>;

export type CreateShiftDto = {
  companyId?: number;
  name: string;
  code: string;
  description?: string | null;
  color?: string | null;
  active?: boolean;
  days: CreateShiftDayDto[];
};

export type UpdateShiftDto = Partial<CreateShiftDto>;

export type ShiftAssignmentDto = {
  id: number;
  companyId: number | null;
  companyName: string | null;
  employeeId: number;
  employeeNumero: string;
  employeeNombre: string;
  shift: ShiftSummaryDto;
  validFrom: string;
  validTo: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateShiftAssignmentDto = {
  companyId?: number;
  employeeId: number;
  shiftId: number;
  validFrom: string;
  validTo?: string | null;
  notes?: string | null;
  active?: boolean;
};

export type UpdateShiftAssignmentDto = Partial<CreateShiftAssignmentDto>;

export type ShiftOverrideKind = 'SHIFT' | 'OFF';

export type ShiftOverrideDto = {
  id: number;
  companyId: number | null;
  companyName: string | null;
  employeeId: number;
  employeeNumero: string;
  employeeNombre: string;
  shift: ShiftSummaryDto | null;
  date: string;
  kind: ShiftOverrideKind;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateShiftOverrideDto = {
  companyId?: number;
  employeeId: number;
  shiftId?: number | null;
  date: string;
  kind?: ShiftOverrideKind;
  notes?: string | null;
};

export type UpdateShiftOverrideDto = Partial<CreateShiftOverrideDto>;

export type ScheduleCellDto = {
  date: string;
  dayOfWeek: number;
  label: string;
  workingDay: boolean;
  isHoliday: boolean;
  status: 'WORKING' | 'VACATION' | 'PERMISSION' | 'HOLIDAY' | 'OFF' | 'NO_SHIFT';
  statusLabel: string;
  shift: ShiftSummaryDto | null;
  assignmentId: number | null;
  overrideId: number | null;
  overrideKind: ShiftOverrideKind | null;
  expectedStart: string | null;
  expectedEnd: string | null;
  expectedMinutes: number;
  breakMinutes: number;
  workedMinutes: number;
  differenceMinutes: number;
  lateMinutes: number;
  vacationId: number | null;
  permissionId: number | null;
  incidentId: number | null;
  firstEntry: string | null;
  lastExit: string | null;
};

export type ScheduleRowDto = {
  employeeId: number;
  employeeNumero: string;
  employeeNombre: string;
  companyId: number | null;
  companyName: string | null;
  days: ScheduleCellDto[];
};

export type ScheduleEmployeeDto = {
  employeeId: number;
  employeeNumero: string;
  employeeNombre: string;
  companyId: number | null;
  companyName: string | null;
};

export type ScheduleResponseDto = {
  from: string;
  to: string;
  employees: ScheduleEmployeeDto[];
  days: Array<{ date: string; dayOfWeek: number; label: string }>;
  rows: ScheduleRowDto[];
};

export type EmployeeScheduleResponseDto = ScheduleResponseDto;
