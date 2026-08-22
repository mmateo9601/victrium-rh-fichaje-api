export type ShiftSegmentDto = {
  id: number;
  startTime: string | null;
  endTime: string | null;
  breakMinutes: number;
  workingMinutes: number | null;
  crossesMidnight: boolean;
};

export type ShiftRotationStepDto = {
  id: number;
  working: boolean;
  startTime: string | null;
  endTime: string | null;
  breakMinutes: number;
  workingMinutes: number | null;
  crossesMidnight: boolean;
};

export type ShiftDayDto = {
  id: number;
  dayOfWeek: number;
  working: boolean;
  startTime: string | null;
  endTime: string | null;
  breakMinutes: number;
  workingMinutes: number | null;
  crossesMidnight: boolean;
  segments: ShiftSegmentDto[];
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
  rotationStartDate: string | null;
  rotationPattern: ShiftRotationStepDto[];
  companyId: number | null;
  companyName: string | null;
  days: ShiftDayDto[];
  assignmentsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateShiftDayDto = Omit<ShiftDayDto, 'id' | 'segments'> & {
  segments?: Array<Omit<ShiftSegmentDto, 'id'>>;
};

export type CreateShiftRotationStepDto = Omit<ShiftRotationStepDto, 'id'>;

export type CreateShiftDto = {
  companyId?: number;
  name: string;
  code: string;
  description?: string | null;
  color?: string | null;
  active?: boolean;
  days: CreateShiftDayDto[];
  rotationStartDate?: string | null;
  rotationPattern?: CreateShiftRotationStepDto[];
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
  workLocationId: number | null;
  workLocationName: string | null;
  workLocationCode: string | null;
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
  workLocationId?: number | null;
  validFrom: string;
  validTo?: string | null;
  notes?: string | null;
  active?: boolean;
};

export type UpdateShiftAssignmentDto = Partial<CreateShiftAssignmentDto>;

export type ShiftOverrideKind = 'SHIFT' | 'OFF';

export type WorkPolicyEvaluationDto = {
  configured: boolean;
  maxDailyMinutes: number | null;
  minimumBreakMinutes: number | null;
  lateThresholdMinutes: number | null;
  overtimeWarningMinutes: number | null;
  nightWorkStart: string | null;
  nightWorkEnd: string | null;
  expectedBreakMinutes: number | null;
  actualBreakMinutes: number;
  overtimeMinutes: number;
  nightWorkMinutes: number;
  warnings: string[];
  violations: string[];
};

export type ShiftOverrideDto = {
  id: number;
  companyId: number | null;
  companyName: string | null;
  employeeId: number;
  employeeNumero: string;
  employeeNombre: string;
  shift: ShiftSummaryDto | null;
  workLocationId: number | null;
  workLocationName: string | null;
  workLocationCode: string | null;
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
  workLocationId?: number | null;
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
  workLocationId: number | null;
  workLocationName: string | null;
  workLocationCode: string | null;
  workLocationSource: 'override' | 'assignment' | 'employee_location' | 'terms' | 'default' | null;
  assignmentId: number | null;
  overrideId: number | null;
  overrideKind: ShiftOverrideKind | null;
  employmentTermsId: number | null;
  employmentTermsContractType: string | null;
  employmentTermsWeeklyContractMinutes: number | null;
  employmentTermsAnnualContractMinutes: number | null;
  employmentTermsWorkingPercentage: string | null;
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
  policy: WorkPolicyEvaluationDto | null;
};

export type ScheduleRowDto = {
  employeeId: number;
  employeeNumero: string;
  employeeNombre: string;
  companyId: number | null;
  companyName: string | null;
  days: ScheduleCellDto[];
};

export type ScheduleSummaryDto = {
  rangeDays: number;
  plannedMinutes: number;
  workedMinutes: number;
  coverageRate: number;
  plannedDays: number;
  workedDays: number;
  absenceDays: number;
  incidentDays: number;
  unplannedDays: number;
  weeklyTargetMinutes: number | null;
  monthlyTargetMinutes: number | null;
  targetMinutes: number | null;
  targetLabel: 'weekly' | 'monthly' | 'custom' | null;
  remainingMinutes: number | null;
  progressRate: number | null;
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
  summary: ScheduleSummaryDto;
  rows: ScheduleRowDto[];
};

export type EmployeeScheduleResponseDto = ScheduleResponseDto;
