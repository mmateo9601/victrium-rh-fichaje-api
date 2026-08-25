import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { AppError } from '../common/errors/app-error';
import { SuperAdminBootstrapService } from '../bootstrap/super-admin.bootstrap';
import { AuthSessionEntity } from '../database/entities/auth-session.entity';
import { CalendarDayEntity } from '../database/entities/calendar-day.entity';
import { CalendarEntity } from '../database/entities/calendar.entity';
import { CompanyEntity } from '../database/entities/company.entity';
import { EmployeeEntity } from '../database/entities/employee.entity';
import { EmploymentTermsEntity } from '../database/entities/employment-terms.entity';
import { IncidentEntity } from '../database/entities/incident.entity';
import { PermissionEntity } from '../database/entities/permission.entity';
import { PermissionStatus } from '../database/entities/permission-status.enum';
import { PlanningPeriodEntity } from '../database/entities/planning-period.entity';
import { RoleName } from '../database/entities/role-name.enum';
import { RoleEntity } from '../database/entities/role.entity';
import { EmployeeLocationAssignmentEntity } from '../database/entities/employee-location-assignment.entity';
import { ShiftAssignmentEntity } from '../database/entities/shift-assignment.entity';
import { ShiftDayEntity } from '../database/entities/shift-day.entity';
import { ShiftEntity } from '../database/entities/shift.entity';
import { ShiftOverrideEntity } from '../database/entities/shift-override.entity';
import { WorkLocationEntity } from '../database/entities/work-location.entity';
import { TimeEntryAuditEntity } from '../database/entities/time-entry-audit.entity';
import { TimeEntryEntity } from '../database/entities/time-entry.entity';
import { UserEntity } from '../database/entities/user.entity';
import { VacationEntity } from '../database/entities/vacation.entity';
import { VacationStatus } from '../database/entities/vacation-status.enum';

export type SeedRunMode = 'dev' | 'reset';

type SeededCompany = {
  code: string;
  name: string;
  year: number;
  calendarName: string;
  workPolicy: Record<string, unknown> | null;
  workLocations: SeededWorkLocation[];
};

type SeededWorkLocation = {
  code: string;
  name: string;
  city: string;
  province: string;
  timezone: string;
  address: string;
  postalCode: string;
};

type SeededUser = {
  email: string;
  numero: string;
  nombreEmpleado: string;
  dni: string;
  roles: RoleName[];
  admin: boolean;
  companyCode: string;
  calendarYear: number;
  diasVacaciones: number;
  horasGeneradas: number;
  working: boolean;
  enVacaciones: boolean;
  deBaja: boolean;
  weeklyContractMinutes?: number;
  annualContractMinutes?: number;
  workingPercentage?: string;
  contractType?: string;
  primaryWorkLocationCode?: string;
};

type SeedSummary = {
  companies: number;
  calendars: number;
  users: number;
  employees: number;
  shifts: number;
  assignments: number;
  overrides: number;
  planningPeriods: number;
  workLocations: number;
  locationAssignments: number;
  employmentTerms: number;
  timeEntries: number;
  audits: number;
  vacations: number;
  permissions: number;
  incidents: number;
};

type SeedResult = SeedSummary & {
  mode: SeedRunMode;
  referenceDate: string;
};

type SeedUserBundle = {
  user: UserEntity;
  employee: EmployeeEntity;
};

type SeedContext = {
  referenceDate: Date;
  generalDays: string[];
  lauraDays: string[];
  carlosDays: string[];
  acmeDays: string[];
};

type TimeEntryDayRecord = {
  dia: string;
  entrada?: TimeEntryEntity;
  salida?: TimeEntryEntity;
};

type SeedTimeEntryBundle = {
  byEmail: Map<string, TimeEntryDayRecord[]>;
  total: number;
};

const PASSWORD = 'Victrium123!';
const SEED_ORIGIN = 'seed:dev';
const ROLE_NAMES: RoleName[] = [
  RoleName.ROLE_SUPER_ADMIN,
  RoleName.ROLE_COMPANY_ADMIN,
  RoleName.ROLE_RRHH,
  RoleName.ROLE_MANAGER,
  RoleName.ROLE_USER,
  RoleName.ROLE_AUDITOR,
  RoleName.ROLE_WORKFORCE_REPRESENTATIVE
];
const SEED_COMPANIES: SeededCompany[] = [
  {
    code: 'VICTRIUM',
    name: 'Victrium RH Demo',
    year: 2026,
    calendarName: 'Victrium RH Demo 2026',
    workPolicy: {
      maxDailyMinutes: 510,
      minimumBreakMinutes: 30,
      lateThresholdMinutes: 10,
      earlyClockInMinutes: 10,
      weeklyTargetMinutes: 2400,
      monthlyTargetMinutes: 9600
    },
    workLocations: [
      {
        code: 'MAD-CENTRO',
        name: 'Madrid Centro',
        city: 'Madrid',
        province: 'Madrid',
        timezone: 'Europe/Madrid',
        address: 'Calle Gran Vía 1',
        postalCode: '28013'
      },
      {
        code: 'MAD-ALC',
        name: 'Alcobendas',
        city: 'Alcobendas',
        province: 'Madrid',
        timezone: 'Europe/Madrid',
        address: 'Avenida de Europa 12',
        postalCode: '28108'
      },
      {
        code: 'BCN-SANT',
        name: 'Barcelona Sant',
        city: 'Barcelona',
        province: 'Barcelona',
        timezone: 'Europe/Madrid',
        address: 'Carrer de Balmes 44',
        postalCode: '08007'
      }
    ]
  },
  {
    code: 'ACME',
    name: 'Acme Industrial',
    year: 2027,
    calendarName: 'Acme Industrial 2027',
    workPolicy: {
      maxDailyMinutes: 480,
      minimumBreakMinutes: 20,
      lateThresholdMinutes: 5,
      earlyClockInMinutes: 15,
      weeklyTargetMinutes: 2250,
      monthlyTargetMinutes: 9000
    },
    workLocations: [
      {
        code: 'SEV-NORTE',
        name: 'Sevilla Norte',
        city: 'Sevilla',
        province: 'Sevilla',
        timezone: 'Europe/Madrid',
        address: 'Calle Sierpes 10',
        postalCode: '41004'
      },
      {
        code: 'VLC-CENTRO',
        name: 'Valencia Centro',
        city: 'Valencia',
        province: 'Valencia',
        timezone: 'Europe/Madrid',
        address: 'Carrer de Colón 8',
        postalCode: '46004'
      }
    ]
  },
  {
    code: 'NEXA',
    name: 'Nexa Logistics',
    year: 2026,
    calendarName: 'Nexa Logistics 2026',
    workPolicy: {
      maxDailyMinutes: 500,
      minimumBreakMinutes: 30,
      lateThresholdMinutes: 8,
      earlyClockInMinutes: 10,
      weeklyTargetMinutes: 2380,
      monthlyTargetMinutes: 9520
    },
    workLocations: [
      {
        code: 'MAD-LOG',
        name: 'Madrid Logística',
        city: 'Madrid',
        province: 'Madrid',
        timezone: 'Europe/Madrid',
        address: 'Polígono Industrial Vallecas 7',
        postalCode: '28053'
      },
      {
        code: 'ALG-PLN',
        name: 'Algeciras Puerto',
        city: 'Algeciras',
        province: 'Cádiz',
        timezone: 'Europe/Madrid',
        address: 'Muelle de Levante 4',
        postalCode: '11201'
      }
    ]
  },
  {
    code: 'ORION',
    name: 'Orion Servicios',
    year: 2027,
    calendarName: 'Orion Servicios 2027',
    workPolicy: {
      maxDailyMinutes: 480,
      minimumBreakMinutes: 30,
      lateThresholdMinutes: 10,
      earlyClockInMinutes: 15,
      weeklyTargetMinutes: 2250,
      monthlyTargetMinutes: 9000
    },
    workLocations: [
      {
        code: 'MAD-SUR',
        name: 'Madrid Sur',
        city: 'Madrid',
        province: 'Madrid',
        timezone: 'Europe/Madrid',
        address: 'Avenida de Andalucía 155',
        postalCode: '28041'
      },
      {
        code: 'BIO-PORT',
        name: 'Bilbao Port',
        city: 'Bilbao',
        province: 'Bizkaia',
        timezone: 'Europe/Madrid',
        address: 'Muelle Zorrozaurre 2',
        postalCode: '48014'
      }
    ]
  },
  {
    code: 'LUMEN',
    name: 'Lumen Health',
    year: 2027,
    calendarName: 'Lumen Health 2027',
    workPolicy: {
      maxDailyMinutes: 450,
      minimumBreakMinutes: 20,
      lateThresholdMinutes: 5,
      earlyClockInMinutes: 10,
      weeklyTargetMinutes: 2100,
      monthlyTargetMinutes: 8400
    },
    workLocations: [
      {
        code: 'MAD-CLN',
        name: 'Madrid Clínica',
        city: 'Madrid',
        province: 'Madrid',
        timezone: 'Europe/Madrid',
        address: 'Paseo de la Castellana 101',
        postalCode: '28046'
      },
      {
        code: 'BCN-HUB',
        name: 'Barcelona Hub',
        city: 'Barcelona',
        province: 'Barcelona',
        timezone: 'Europe/Madrid',
        address: 'Avinguda Diagonal 612',
        postalCode: '08021'
      }
    ]
  }
];

const SEED_USERS: SeededUser[] = [
  {
    email: 'platform@victrium.local',
    numero: 'VIC-PLT',
    nombreEmpleado: 'Lucía Blanco Romero',
    dni: '90000000Z',
    roles: [RoleName.ROLE_SUPER_ADMIN],
    admin: false,
    companyCode: 'VICTRIUM',
    calendarYear: 2026,
    diasVacaciones: 30,
    horasGeneradas: 0,
    working: false,
    enVacaciones: false,
    deBaja: false,
    contractType: 'FULL_TIME',
    weeklyContractMinutes: 2400,
    annualContractMinutes: 86400,
    workingPercentage: '100.00',
    primaryWorkLocationCode: 'MAD-CENTRO'
  },
  {
    email: 'admin@victrium.local',
    numero: 'VIC-ADM',
    nombreEmpleado: 'Ana Martínez López',
    dni: '90000001A',
    roles: [RoleName.ROLE_COMPANY_ADMIN],
    admin: true,
    companyCode: 'VICTRIUM',
    calendarYear: 2026,
    diasVacaciones: 24,
    horasGeneradas: 0,
    working: false,
    enVacaciones: false,
    deBaja: false,
    contractType: 'FULL_TIME',
    weeklyContractMinutes: 2400,
    annualContractMinutes: 86400,
    workingPercentage: '100.00',
    primaryWorkLocationCode: 'MAD-CENTRO'
  },
  {
    email: 'company-admin@victrium.local',
    numero: 'VIC-CAD',
    nombreEmpleado: 'Sergio Moreno Gil',
    dni: '90000002B',
    roles: [RoleName.ROLE_COMPANY_ADMIN],
    admin: true,
    companyCode: 'VICTRIUM',
    calendarYear: 2026,
    diasVacaciones: 26,
    horasGeneradas: 0,
    working: false,
    enVacaciones: false,
    deBaja: false,
    contractType: 'FULL_TIME',
    weeklyContractMinutes: 2400,
    annualContractMinutes: 86400,
    workingPercentage: '100.00',
    primaryWorkLocationCode: 'BCN-SANT'
  },
  {
    email: 'rrhh@victrium.local',
    numero: 'VIC-RRHH',
    nombreEmpleado: 'Raúl Navarro Pérez',
    dni: '90000003C',
    roles: [RoleName.ROLE_RRHH],
    admin: false,
    companyCode: 'VICTRIUM',
    calendarYear: 2026,
    diasVacaciones: 22,
    horasGeneradas: 0,
    working: false,
    enVacaciones: false,
    deBaja: false,
    contractType: 'FULL_TIME',
    weeklyContractMinutes: 2400,
    annualContractMinutes: 86400,
    workingPercentage: '100.00',
    primaryWorkLocationCode: 'MAD-CENTRO'
  },
  {
    email: 'laura@victrium.local',
    numero: 'VIC-LAU',
    nombreEmpleado: 'Laura Pérez Martín',
    dni: '90000004D',
    roles: [RoleName.ROLE_USER],
    admin: false,
    companyCode: 'VICTRIUM',
    calendarYear: 2026,
    diasVacaciones: 30,
    horasGeneradas: 0,
    working: false,
    enVacaciones: false,
    deBaja: false,
    contractType: 'FULL_TIME',
    weeklyContractMinutes: 2400,
    annualContractMinutes: 86400,
    workingPercentage: '100.00',
    primaryWorkLocationCode: 'MAD-CENTRO'
  },
  {
    email: 'carlos@victrium.local',
    numero: 'VIC-CAR',
    nombreEmpleado: 'Carlos Gómez Ruiz',
    dni: '90000005E',
    roles: [RoleName.ROLE_USER],
    admin: false,
    companyCode: 'VICTRIUM',
    calendarYear: 2026,
    diasVacaciones: 28,
    horasGeneradas: 0,
    working: false,
    enVacaciones: false,
    deBaja: false,
    contractType: 'PART_TIME',
    weeklyContractMinutes: 1500,
    annualContractMinutes: 54000,
    workingPercentage: '62.50',
    primaryWorkLocationCode: 'MAD-ALC'
  },
  {
    email: 'admin@acme.local',
    numero: 'ACM-ADM',
    nombreEmpleado: 'Marta Sánchez León',
    dni: '90000006F',
    roles: [RoleName.ROLE_COMPANY_ADMIN],
    admin: true,
    companyCode: 'ACME',
    calendarYear: 2027,
    diasVacaciones: 22,
    horasGeneradas: 0,
    working: false,
    enVacaciones: false,
    deBaja: false,
    contractType: 'FULL_TIME',
    weeklyContractMinutes: 2250,
    annualContractMinutes: 81000,
    workingPercentage: '93.75',
    primaryWorkLocationCode: 'SEV-NORTE'
  },
  {
    email: 'company-admin@acme.local',
    numero: 'ACM-CAD',
    nombreEmpleado: 'Javier Ortiz Medina',
    dni: '90000007G',
    roles: [RoleName.ROLE_COMPANY_ADMIN],
    admin: true,
    companyCode: 'ACME',
    calendarYear: 2027,
    diasVacaciones: 26,
    horasGeneradas: 0,
    working: false,
    enVacaciones: false,
    deBaja: false,
    contractType: 'FULL_TIME',
    weeklyContractMinutes: 2250,
    annualContractMinutes: 81000,
    workingPercentage: '93.75',
    primaryWorkLocationCode: 'VLC-CENTRO'
  },
  {
    email: 'rrhh@acme.local',
    numero: 'ACM-RRHH',
    nombreEmpleado: 'Sara Molina Vega',
    dni: '90000008H',
    roles: [RoleName.ROLE_RRHH],
    admin: false,
    companyCode: 'ACME',
    calendarYear: 2027,
    diasVacaciones: 24,
    horasGeneradas: 0,
    working: false,
    enVacaciones: false,
    deBaja: false,
    contractType: 'FULL_TIME',
    weeklyContractMinutes: 2250,
    annualContractMinutes: 81000,
    workingPercentage: '93.75',
    primaryWorkLocationCode: 'SEV-NORTE'
  },
  {
    email: 'operations@acme.local',
    numero: 'ACM-OPS',
    nombreEmpleado: 'Lucía Torres Gil',
    dni: '90000009J',
    roles: [RoleName.ROLE_USER],
    admin: false,
    companyCode: 'ACME',
    calendarYear: 2027,
    diasVacaciones: 20,
    horasGeneradas: 0,
    working: false,
    enVacaciones: false,
    deBaja: false,
    contractType: 'FULL_TIME',
    weeklyContractMinutes: 2250,
    annualContractMinutes: 81000,
    workingPercentage: '93.75',
    primaryWorkLocationCode: 'VLC-CENTRO'
  },
  {
    email: 'company-admin@nexa.local',
    numero: 'NEX-CAD',
    nombreEmpleado: 'Pedro Ibáñez Cano',
    dni: '90000010K',
    roles: [RoleName.ROLE_COMPANY_ADMIN],
    admin: true,
    companyCode: 'NEXA',
    calendarYear: 2026,
    diasVacaciones: 26,
    horasGeneradas: 0,
    working: false,
    enVacaciones: false,
    deBaja: false,
    contractType: 'FULL_TIME',
    weeklyContractMinutes: 2380,
    annualContractMinutes: 85680,
    workingPercentage: '99.17',
    primaryWorkLocationCode: 'MAD-LOG'
  },
  {
    email: 'rrhh@nexa.local',
    numero: 'NEX-RRHH',
    nombreEmpleado: 'Irene Pastor Ruiz',
    dni: '90000011L',
    roles: [RoleName.ROLE_RRHH],
    admin: false,
    companyCode: 'NEXA',
    calendarYear: 2026,
    diasVacaciones: 22,
    horasGeneradas: 0,
    working: false,
    enVacaciones: false,
    deBaja: false,
    contractType: 'FULL_TIME',
    weeklyContractMinutes: 2380,
    annualContractMinutes: 85680,
    workingPercentage: '99.17',
    primaryWorkLocationCode: 'MAD-LOG'
  },
  {
    email: 'alba@nexa.local',
    numero: 'NEX-ALB',
    nombreEmpleado: 'Alba Reyes Núñez',
    dni: '90000012M',
    roles: [RoleName.ROLE_USER],
    admin: false,
    companyCode: 'NEXA',
    calendarYear: 2026,
    diasVacaciones: 22,
    horasGeneradas: 0,
    working: false,
    enVacaciones: false,
    deBaja: false,
    contractType: 'PART_TIME',
    weeklyContractMinutes: 1800,
    annualContractMinutes: 64800,
    workingPercentage: '75.00',
    primaryWorkLocationCode: 'ALG-PLN'
  },
  {
    email: 'diego@nexa.local',
    numero: 'NEX-DIE',
    nombreEmpleado: 'Diego Serrano León',
    dni: '90000013N',
    roles: [RoleName.ROLE_USER],
    admin: false,
    companyCode: 'NEXA',
    calendarYear: 2026,
    diasVacaciones: 20,
    horasGeneradas: 0,
    working: false,
    enVacaciones: false,
    deBaja: false,
    contractType: 'PART_TIME',
    weeklyContractMinutes: 1500,
    annualContractMinutes: 54000,
    workingPercentage: '62.50',
    primaryWorkLocationCode: 'MAD-LOG'
  },
  {
    email: 'company-admin@orion.local',
    numero: 'ORI-CAD',
    nombreEmpleado: 'Elena Sanz Prieto',
    dni: '90000014P',
    roles: [RoleName.ROLE_COMPANY_ADMIN],
    admin: true,
    companyCode: 'ORION',
    calendarYear: 2027,
    diasVacaciones: 25,
    horasGeneradas: 0,
    working: false,
    enVacaciones: false,
    deBaja: false,
    contractType: 'FULL_TIME',
    weeklyContractMinutes: 2250,
    annualContractMinutes: 81000,
    workingPercentage: '93.75',
    primaryWorkLocationCode: 'MAD-SUR'
  },
  {
    email: 'marcos@orion.local',
    numero: 'ORI-MAR',
    nombreEmpleado: 'Marcos Del Río Vidal',
    dni: '90000015Q',
    roles: [RoleName.ROLE_USER],
    admin: false,
    companyCode: 'ORION',
    calendarYear: 2027,
    diasVacaciones: 20,
    horasGeneradas: 0,
    working: false,
    enVacaciones: false,
    deBaja: false,
    contractType: 'FULL_TIME',
    weeklyContractMinutes: 2250,
    annualContractMinutes: 81000,
    workingPercentage: '93.75',
    primaryWorkLocationCode: 'BIO-PORT'
  },
  {
    email: 'ines@orion.local',
    numero: 'ORI-INE',
    nombreEmpleado: 'Inés Fuentes Aranda',
    dni: '90000016R',
    roles: [RoleName.ROLE_USER],
    admin: false,
    companyCode: 'ORION',
    calendarYear: 2027,
    diasVacaciones: 22,
    horasGeneradas: 0,
    working: false,
    enVacaciones: false,
    deBaja: false,
    contractType: 'PART_TIME',
    weeklyContractMinutes: 1800,
    annualContractMinutes: 64800,
    workingPercentage: '75.00',
    primaryWorkLocationCode: 'MAD-SUR'
  },
  {
    email: 'company-admin@lumen.local',
    numero: 'LUM-CAD',
    nombreEmpleado: 'Nuria Salvatierra Peña',
    dni: '90000017S',
    roles: [RoleName.ROLE_COMPANY_ADMIN],
    admin: true,
    companyCode: 'LUMEN',
    calendarYear: 2027,
    diasVacaciones: 26,
    horasGeneradas: 0,
    working: false,
    enVacaciones: false,
    deBaja: false,
    contractType: 'FULL_TIME',
    weeklyContractMinutes: 2100,
    annualContractMinutes: 75600,
    workingPercentage: '87.50',
    primaryWorkLocationCode: 'MAD-CLN'
  },
  {
    email: 'rrhh@lumen.local',
    numero: 'LUM-RRHH',
    nombreEmpleado: 'Daniel Varela Moreno',
    dni: '90000018T',
    roles: [RoleName.ROLE_RRHH],
    admin: false,
    companyCode: 'LUMEN',
    calendarYear: 2027,
    diasVacaciones: 24,
    horasGeneradas: 0,
    working: false,
    enVacaciones: false,
    deBaja: false,
    contractType: 'FULL_TIME',
    weeklyContractMinutes: 2100,
    annualContractMinutes: 75600,
    workingPercentage: '87.50',
    primaryWorkLocationCode: 'BCN-HUB'
  },
  {
    email: 'sofia@lumen.local',
    numero: 'LUM-SOF',
    nombreEmpleado: 'Sofía Campo Rueda',
    dni: '90000019U',
    roles: [RoleName.ROLE_USER],
    admin: false,
    companyCode: 'LUMEN',
    calendarYear: 2027,
    diasVacaciones: 20,
    horasGeneradas: 0,
    working: false,
    enVacaciones: false,
    deBaja: false,
    contractType: 'PART_TIME',
    weeklyContractMinutes: 1500,
    annualContractMinutes: 54000,
    workingPercentage: '62.50',
    primaryWorkLocationCode: 'BCN-HUB'
  },
  {
    email: 'pablo@lumen.local',
    numero: 'LUM-PAB',
    nombreEmpleado: 'Pablo León Miralles',
    dni: '90000020V',
    roles: [RoleName.ROLE_USER],
    admin: false,
    companyCode: 'LUMEN',
    calendarYear: 2027,
    diasVacaciones: 22,
    horasGeneradas: 0,
    working: false,
    enVacaciones: false,
    deBaja: false,
    contractType: 'FULL_TIME',
    weeklyContractMinutes: 2100,
    annualContractMinutes: 75600,
    workingPercentage: '87.50',
    primaryWorkLocationCode: 'MAD-CLN'
  }
];

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function timeString(hours: number, minutes: number, seconds = 0) {
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function subtractDays(date: Date, days: number) {
  return addDays(date, -days);
}

function formatMadridDate(date: Date) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

function startOfMadridWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  return addDays(copy, offset);
}

function endOfYearDate(year: number) {
  return formatMadridDate(new Date(Date.UTC(year, 11, 31, 12, 0, 0)));
}

function isMadridWeekend(date: Date) {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Madrid',
    weekday: 'short'
  }).format(date);
  return weekday === 'Sat' || weekday === 'Sun';
}

function buildBusinessDays(count: number, endDate: Date) {
  const days: string[] = [];
  for (let cursor = new Date(endDate); days.length < count; cursor = subtractDays(cursor, 1)) {
    if (!isMadridWeekend(cursor)) {
      days.push(formatMadridDate(cursor));
    }
  }
  return days.reverse();
}

function buildCalendarDays(year: number, _referenceDate: Date) {
  const days: { dia: string; horaInicio: string; horaFin: string }[] = [];
  const seen = new Set<string>();
  const pushDay = (dia: string, horaInicio: string, horaFin: string) => {
    if (seen.has(dia)) {
      return;
    }
    seen.add(dia);
    days.push({
      dia,
      horaInicio,
      horaFin
    });
  };
  const start = new Date(Date.UTC(year, 0, 5, 12, 0, 0));
  const end = new Date(Date.UTC(year, 0, 16, 12, 0, 0));

  for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
    if (!isMadridWeekend(cursor)) {
      pushDay(formatMadridDate(cursor), timeString(8, 0, 0), timeString(17, 0, 0));
    }
  }

  for (const day of buildBusinessDays(12, new Date(Date.UTC(year, 11, 31, 12, 0, 0)))) {
    pushDay(day, timeString(8, 0, 0), timeString(17, 0, 0));
  }

  for (const dia of [`${year}-01-01`, `${year}-05-01`, `${year}-08-15`, `${year}-12-25`]) {
    pushDay(dia, timeString(0, 0, 0), timeString(0, 0, 0));
  }

  return days;
}

function addMinutes(base: string, minutesToAdd: number) {
  const [hours, minutes, seconds] = base.split(':').map((part) => Number(part));
  const totalMinutes = hours * 60 + minutes + minutesToAdd;
  const nextHours = Math.floor(totalMinutes / 60) % 24;
  const nextMinutes = totalMinutes % 60;
  return timeString(nextHours, nextMinutes, seconds);
}

function sqlList(values: string[]) {
  return values.map((value) => `'${value.replace(/'/g, "''")}'`).join(', ');
}

@Injectable()
export class DevelopmentSeedService {
  constructor(private readonly dataSource: DataSource) {}

  async run(mode: SeedRunMode): Promise<SeedResult> {
    const context = this.buildContext();

    if (mode === 'reset') {
      await this.dataSource.transaction(async (manager) => {
        await this.cleanupAllData(manager);
        await this.seedRoles(manager);
      });

      const bootstrapResult = await new SuperAdminBootstrapService(this.dataSource).run();

      if (bootstrapResult === 'disabled') {
        throw new AppError(
          'SUPER_ADMIN_BOOTSTRAP_DISABLED',
          'BOOTSTRAP_SUPER_ADMIN debe estar activo para dejar solo el superadmin',
          400
        );
      }

      return {
        companies: 0,
        calendars: 0,
        users: 1,
        employees: 0,
        planningPeriods: 0,
        workLocations: 0,
        locationAssignments: 0,
        employmentTerms: 0,
        shifts: 0,
        assignments: 0,
        overrides: 0,
        timeEntries: 0,
        audits: 0,
        vacations: 0,
        permissions: 0,
        incidents: 0,
        mode,
        referenceDate: context.referenceDate.toISOString()
      };
    }

    return this.dataSource.transaction(async (manager) => {
      await this.cleanup(manager);

      const roles = await this.seedRoles(manager);
      const companies = await this.seedCompanies(manager);
      const calendars = await this.seedCalendars(manager, companies, context);
      const users = await this.seedUsersAndEmployees(manager, companies, calendars, roles);
      const locations = await this.seedWorkLocations(manager, companies, calendars, users, context);
      const planningPeriods = await this.seedPlanningPeriods(manager, companies, users, context);
      const shifts = await this.seedShifts(manager, users, context);
      const timeEntries = await this.seedTimeEntries(manager, users, context);
      const audits = await this.seedAudits(manager, users, timeEntries);
      const vacations = await this.seedVacations(manager, users, context);
      const permissions = await this.seedPermissions(manager, users, context);
      const incidents = await this.seedIncidents(manager, users, context);

      return {
        companies: companies.length,
        calendars: calendars.length,
        users: users.length,
        employees: users.length,
        planningPeriods,
        workLocations: locations.workLocations,
        locationAssignments: locations.locationAssignments,
        employmentTerms: locations.employmentTerms,
        shifts: shifts.shifts,
        assignments: shifts.assignments,
        overrides: shifts.overrides,
        timeEntries: timeEntries.total,
        audits,
        vacations,
        permissions,
        incidents,
        mode,
        referenceDate: context.referenceDate.toISOString()
      };
    });
  }

  private buildContext(): SeedContext {
    const referenceDate = new Date();
    return {
      referenceDate,
      generalDays: buildBusinessDays(20, referenceDate),
      lauraDays: buildBusinessDays(30, referenceDate),
      carlosDays: buildBusinessDays(25, referenceDate),
      acmeDays: buildBusinessDays(6, referenceDate)
    };
  }

  private async cleanup(manager: EntityManager) {
    const users = await manager.getRepository(UserEntity).find({
      where: SEED_USERS.map((user) => ({ email: user.email }))
    });
    const userIds = users.map((user) => user.id);

    const employees = await manager.getRepository(EmployeeEntity).find({
      where: SEED_USERS.map((user) => ({ email: user.email }))
    });
    const employeeIds = employees.map((employee) => employee.id);

    const calendars = await manager.getRepository(CalendarEntity).find({
      where: SEED_COMPANIES.map((company) => ({ year: company.year }))
    });
    const calendarIds = calendars.map((calendar) => calendar.id);

    const companyIds = (
      await manager.getRepository(CompanyEntity).find({
        where: SEED_COMPANIES.map((company) => ({ code: company.code }))
      })
    ).map((company) => company.id);

    if (userIds.length) {
      await manager
        .createQueryBuilder()
        .delete()
        .from(TimeEntryAuditEntity)
        .where('corrected_by_id IN (:...userIds)', { userIds })
        .execute();
      await manager.query(`DELETE FROM usuario_rol WHERE usuario_id IN (${sqlList(userIds.map(String))})`);
      await manager
        .createQueryBuilder()
        .delete()
        .from(AuthSessionEntity)
        .where('user_id IN (:...userIds)', { userIds })
        .execute();
      await manager
        .createQueryBuilder()
        .delete()
        .from(TimeEntryAuditEntity)
        .where('time_entry_id IN (SELECT id FROM fichajes WHERE usuario_id IN (:...userIds))', { userIds })
        .execute();
      await manager
        .createQueryBuilder()
        .delete()
        .from(TimeEntryEntity)
        .where('usuario_id IN (:...userIds)', { userIds })
        .execute();
      await manager.createQueryBuilder().delete().from(UserEntity).where('id IN (:...userIds)', { userIds }).execute();
    }

    if (employeeIds.length) {
      await manager
        .createQueryBuilder()
        .delete()
        .from(VacationEntity)
        .where('employee_id IN (:...employeeIds)', { employeeIds })
        .execute();
      await manager
        .createQueryBuilder()
        .delete()
        .from(PermissionEntity)
        .where('employee_id IN (:...employeeIds)', { employeeIds })
        .execute();
      await manager
        .createQueryBuilder()
        .delete()
        .from(IncidentEntity)
        .where('employee_id IN (:...employeeIds)', { employeeIds })
        .execute();
      await manager
        .createQueryBuilder()
        .delete()
        .from(EmploymentTermsEntity)
        .where('employee_id IN (:...employeeIds)', { employeeIds })
        .execute();
      await manager.createQueryBuilder().delete().from(EmployeeEntity).where('id IN (:...employeeIds)', { employeeIds }).execute();
    }

    await manager.createQueryBuilder().delete().from(EmployeeLocationAssignmentEntity).execute();
    await manager.createQueryBuilder().delete().from(WorkLocationEntity).execute();
    await manager.createQueryBuilder().delete().from(PlanningPeriodEntity).execute();
    await manager.createQueryBuilder().delete().from(ShiftOverrideEntity).execute();
    await manager.createQueryBuilder().delete().from(ShiftAssignmentEntity).execute();
    await manager.createQueryBuilder().delete().from(ShiftDayEntity).execute();
    await manager.createQueryBuilder().delete().from(ShiftEntity).execute();

    if (calendarIds.length) {
      await manager
        .createQueryBuilder()
        .delete()
        .from(CalendarDayEntity)
        .where('calendario_id IN (:...calendarIds)', { calendarIds })
        .execute();
      await manager
        .createQueryBuilder()
        .delete()
        .from(CalendarEntity)
        .where('id IN (:...calendarIds)', { calendarIds })
        .execute();
    }

    if (companyIds.length) {
      await manager.createQueryBuilder().delete().from(CompanyEntity).where('id IN (:...companyIds)', { companyIds }).execute();
    }
  }

  private async cleanupAllData(manager: EntityManager) {
    const queryRunner = manager.queryRunner;
    if (!queryRunner) {
      throw new AppError('QUERY_RUNNER_NOT_AVAILABLE', 'No se pudo iniciar la limpieza completa de la base de datos', 500);
    }

    const protectedTables = new Set(['migrations', 'typeorm_metadata']);
    const tableNames = this.dataSource.entityMetadatas
      .map((metadata) => metadata.tableName)
      .filter((tableName) => !protectedTables.has(tableName));

    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');
    try {
      for (const tableName of tableNames) {
        await queryRunner.query(`DELETE FROM \`${tableName}\``);
      }
    } finally {
      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
    }
  }

  private async seedRoles(manager: EntityManager) {
    const repository = manager.getRepository(RoleEntity);
    const existing = await repository.find({
      where: ROLE_NAMES.map((rolNombre) => ({ rolNombre }))
    });
    const present = new Set(existing.map((role) => role.rolNombre));
    const missing = ROLE_NAMES.filter((rolNombre) => !present.has(rolNombre)).map((rolNombre) =>
      repository.create({ rolNombre })
    );

    if (missing.length) {
      await repository.save(missing);
    }

    const roles = await repository.find({
      where: ROLE_NAMES.map((rolNombre) => ({ rolNombre }))
    });

    return new Map(roles.map((role) => [role.rolNombre, role]));
  }

  private async seedCompanies(manager: EntityManager) {
    const repository = manager.getRepository(CompanyEntity);
    const companies: CompanyEntity[] = [];

    for (const fixture of SEED_COMPANIES) {
      const company = repository.create({
        name: fixture.name,
        code: fixture.code,
        active: true,
        workPolicy: fixture.workPolicy
      });
      companies.push(await repository.save(company));
    }

    return companies;
  }

  private async seedCalendars(manager: EntityManager, companies: CompanyEntity[], context: SeedContext) {
    const repository = manager.getRepository(CalendarEntity);
    const companyRepository = manager.getRepository(CompanyEntity);
    const dayRepository = manager.getRepository(CalendarDayEntity);
    const calendars: CalendarEntity[] = [];

    for (const fixture of SEED_COMPANIES) {
      const company = companies.find((item) => item.code === fixture.code);
      if (!company) {
        throw new AppError('COMPANY_NOT_FOUND', `Empresa seed no encontrada: ${fixture.code}`, 404);
      }

      const savedCalendar = await repository.save(
        repository.create({
          company,
          nombre: fixture.calendarName,
          year: fixture.year,
          minutosMasEntrada: 10,
          minutosMenosEntrada: 5,
          active: true
        })
      );

      const days = buildCalendarDays(fixture.year, context.referenceDate).map((day) =>
        dayRepository.create({
          ...day,
          calendar: savedCalendar
        })
      );
      savedCalendar.days = await dayRepository.save(days);
      calendars.push(savedCalendar);

      company.defaultCalendar = savedCalendar;
      await companyRepository.save(company);
    }

    return calendars;
  }

  private async seedUsersAndEmployees(
    manager: EntityManager,
    companies: CompanyEntity[],
    calendars: CalendarEntity[],
    roles: Map<RoleName, RoleEntity>
  ) {
    const userRepository = manager.getRepository(UserEntity);
    const employeeRepository = manager.getRepository(EmployeeEntity);
    const hashedPassword = await bcrypt.hash(PASSWORD, 10);
    const bundles: SeedUserBundle[] = [];

    for (const fixture of SEED_USERS) {
      const company = companies.find((item) => item.code === fixture.companyCode);
      if (!company) {
        throw new AppError('COMPANY_NOT_FOUND', `Empresa seed no encontrada: ${fixture.companyCode}`, 404);
      }

      const calendar = company.defaultCalendar ?? calendars.find((item) => item.year === fixture.calendarYear) ?? null;
      const user = userRepository.create({
        email: fixture.email,
        password: hashedPassword,
        numero: fixture.numero,
        nombreEmpleado: fixture.nombreEmpleado,
        dni: fixture.dni,
        company,
        diasVacaciones: fixture.diasVacaciones,
        horasGeneradas: fixture.horasGeneradas,
        working: fixture.working,
        enVacaciones: fixture.enVacaciones,
        deBaja: fixture.deBaja,
        admin: fixture.admin,
        ultimoFichaje: null,
        roles: fixture.roles.map((roleName) => {
          const role = roles.get(roleName);
          if (!role) {
            throw new AppError('ROLE_NOT_FOUND', `Rol seed no encontrado: ${roleName}`, 404);
          }
          return role;
        })
      });

      const savedUser = await userRepository.save(user);
      const savedEmployee = await employeeRepository.save(
        employeeRepository.create({
          numero: fixture.numero,
          nombreEmpleado: fixture.nombreEmpleado,
          email: fixture.email,
          dni: fixture.dni,
          company,
          calendar,
          diasVacaciones: fixture.diasVacaciones,
          horasGeneradas: fixture.horasGeneradas,
          working: fixture.working,
          enVacaciones: fixture.enVacaciones,
          deBaja: fixture.deBaja,
          ultimoFichaje: null,
          user: savedUser,
          primaryWorkLocation: null
        })
      );

      savedUser.employee = savedEmployee;
      await userRepository.save(savedUser);
      bundles.push({ user: savedUser, employee: savedEmployee });
    }

    return bundles;
  }

  private async seedWorkLocations(
    manager: EntityManager,
    companies: CompanyEntity[],
    calendars: CalendarEntity[],
    users: SeedUserBundle[],
    context: SeedContext
  ) {
    const locationRepository = manager.getRepository(WorkLocationEntity);
    const assignmentRepository = manager.getRepository(EmployeeLocationAssignmentEntity);
    const employmentTermsRepository = manager.getRepository(EmploymentTermsEntity);
    const companyFixturesByCode = new Map(SEED_COMPANIES.map((fixture) => [fixture.code, fixture]));
    const locations: WorkLocationEntity[] = [];
    const locationMap = new Map<string, WorkLocationEntity>();

    for (const companyFixture of SEED_COMPANIES) {
      const company = companies.find((item) => item.code === companyFixture.code);
      if (!company) {
        throw new AppError('COMPANY_NOT_FOUND', `Empresa seed no encontrada: ${companyFixture.code}`, 404);
      }

      const calendar = calendars.find((item) => item.company?.code === companyFixture.code) ?? null;

      for (const locationFixture of companyFixture.workLocations) {
        const location = await locationRepository.save(
          locationRepository.create({
            company,
            calendar,
            name: locationFixture.name,
            code: locationFixture.code,
            city: locationFixture.city,
            province: locationFixture.province,
            timezone: locationFixture.timezone,
            address: locationFixture.address,
            postalCode: locationFixture.postalCode,
            active: true
          })
        );
        locations.push(location);
        locationMap.set(`${company.code}:${location.code}`, location);
      }
    }

    const userFixtureByEmail = new Map(SEED_USERS.map((fixture) => [fixture.email, fixture]));
    const validFrom = formatMadridDate(addDays(context.referenceDate, -30));
    const validTo = formatMadridDate(addDays(context.referenceDate, 120));
    const assignments: { employee: SeedUserBundle; location: WorkLocationEntity; primary: boolean }[] = [];

    for (const bundle of users) {
      const userFixture = userFixtureByEmail.get(bundle.user.email);
      if (!userFixture) {
        continue;
      }

      const companyFixture = companyFixturesByCode.get(bundle.user.company!.code);
      const defaultLocationCode = companyFixture?.workLocations[0]?.code ?? null;
      const locationCode = userFixture.primaryWorkLocationCode ?? defaultLocationCode;
      if (!locationCode) {
        throw new AppError('WORK_LOCATION_NOT_FOUND', `No se pudo determinar el centro principal de ${bundle.user.email}`, 404);
      }

      const location = locationMap.get(`${bundle.user.company!.code}:${locationCode}`);
      if (!location) {
        throw new AppError('WORK_LOCATION_NOT_FOUND', `Centro seed no encontrado: ${bundle.user.company!.code}:${locationCode}`, 404);
      }

      assignments.push({
        employee: bundle,
        location,
        primary: true
      });
    }

    await assignmentRepository.save(
      assignments.map((item) =>
        assignmentRepository.create({
          company: item.employee.user.company!,
          employee: item.employee.employee,
          workLocation: item.location,
          validFrom,
          validTo,
          primary: item.primary,
          notes: 'Asignación seed'
        })
      )
    );

    for (const item of assignments) {
      item.employee.employee.primaryWorkLocation = item.location;
      await manager.getRepository(EmployeeEntity).save(item.employee.employee);
    }

    await employmentTermsRepository.save(
      assignments.map((item) => {
        const fixture = userFixtureByEmail.get(item.employee.user.email);
        if (!fixture) {
          throw new AppError('USER_NOT_FOUND', `Usuario seed no encontrado: ${item.employee.user.email}`, 404);
        }

        const weeklyContractMinutes = fixture.weeklyContractMinutes ?? 2400;
        const annualContractMinutes = fixture.annualContractMinutes ?? Math.round(weeklyContractMinutes * 36);
        const workingPercentage = fixture.workingPercentage ?? '100.00';
        const contractType = fixture.contractType ?? 'FULL_TIME';
        const effectiveFrom = formatMadridDate(addDays(context.referenceDate, fixture.roles.includes(RoleName.ROLE_USER) ? -90 : -180));

        return employmentTermsRepository.create({
          company: item.employee.user.company!,
          employee: item.employee.employee,
          primaryWorkLocation: item.location,
          effectiveFrom,
          effectiveTo: null,
          weeklyContractMinutes,
          annualContractMinutes,
          workingPercentage,
          contractType,
          policyVersion: 1,
          policySnapshot: {
            weeklyContractMinutes,
            annualContractMinutes,
            workingPercentage,
            contractType,
            primaryWorkLocationCode: item.location.code
          },
          notes: `Condición laboral seed de ${fixture.companyCode}`,
          active: true
        });
      })
    );

    return {
      workLocations: locations.length,
      locationAssignments: assignments.length,
      employmentTerms: assignments.length
    };
  }

  private async seedPlanningPeriods(manager: EntityManager, companies: CompanyEntity[], users: SeedUserBundle[], context: SeedContext) {
    const repository = manager.getRepository(PlanningPeriodEntity);
    const publishedBy = users.find((bundle) => bundle.user.email === 'platform@victrium.local')?.user ?? users[0]?.user ?? null;
    const now = context.referenceDate;
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 12, 0, 0));
    const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 12, 0, 0));
    const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 12, 0, 0));
    const nextMonthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 2, 0, 12, 0, 0));

    const formatLabel = (date: Date) =>
      new Intl.DateTimeFormat('es-ES', {
        month: 'long',
        year: 'numeric',
        timeZone: 'Europe/Madrid'
      }).format(date);

    const fixtures = companies.flatMap((company) => [
      {
        company,
        name: `Planificación ${formatLabel(monthStart)} ${company.code}`,
        startDate: formatMadridDate(monthStart),
        endDate: formatMadridDate(monthEnd),
        status: 'PUBLISHED' as const,
        publishedAt: monthStart,
        publishedBy,
        notes: 'Periodo demo publicado'
      },
      {
        company,
        name: `Planificación ${formatLabel(nextMonthStart)} ${company.code}`,
        startDate: formatMadridDate(nextMonthStart),
        endDate: formatMadridDate(nextMonthEnd),
        status: 'DRAFT' as const,
        publishedAt: null,
        publishedBy: null,
        notes: 'Periodo demo en borrador'
      }
    ]);

    const saved = await repository.save(
      fixtures.map((fixture) =>
        repository.create({
          company: fixture.company,
          name: fixture.name,
          startDate: fixture.startDate,
          endDate: fixture.endDate,
          status: fixture.status,
          version: fixture.status === 'PUBLISHED' ? 2 : 1,
          publishedAt: fixture.publishedAt,
          publishedBy: fixture.publishedBy,
          notes: fixture.notes
        })
      )
    );

    return saved.length;
  }

  private async seedShifts(manager: EntityManager, users: SeedUserBundle[], context: SeedContext) {
    const shiftRepository = manager.getRepository(ShiftEntity);
    const dayRepository = manager.getRepository(ShiftDayEntity);
    const assignmentRepository = manager.getRepository(ShiftAssignmentEntity);
    const overrideRepository = manager.getRepository(ShiftOverrideEntity);

    const victrium = users.find((bundle) => bundle.user.company?.code === 'VICTRIUM');
    if (!victrium) {
      throw new AppError('COMPANY_NOT_FOUND', 'No se encontró la empresa Victrium para turnos', 404);
    }

    const company = victrium.user.company!;
    const rotationStartDate = formatMadridDate(startOfMadridWeek(context.referenceDate));
    const morningSegments = [
      { startTime: timeString(8, 0, 0), endTime: timeString(12, 0, 0), breakMinutes: 0, workingMinutes: 240, crossesMidnight: false },
      { startTime: timeString(13, 0, 0), endTime: timeString(17, 0, 0), breakMinutes: 0, workingMinutes: 240, crossesMidnight: false }
    ];
    const afternoonSegments = [
      { startTime: timeString(14, 0, 0), endTime: timeString(18, 0, 0), breakMinutes: 0, workingMinutes: 240, crossesMidnight: false },
      { startTime: timeString(18, 30, 0), endTime: timeString(22, 0, 0), breakMinutes: 0, workingMinutes: 210, crossesMidnight: false }
    ];
    const nightSegments = [
      { startTime: timeString(22, 0, 0), endTime: timeString(2, 0, 0), breakMinutes: 0, workingMinutes: 240, crossesMidnight: true },
      { startTime: timeString(3, 0, 0), endTime: timeString(6, 0, 0), breakMinutes: 0, workingMinutes: 180, crossesMidnight: false }
    ];
    const templateDays = [
      { dayOfWeek: 1, working: true, startTime: timeString(8, 0, 0), endTime: timeString(17, 0, 0), breakMinutes: 60, workingMinutes: 480, crossesMidnight: false, segments: morningSegments },
      { dayOfWeek: 2, working: true, startTime: timeString(8, 0, 0), endTime: timeString(17, 0, 0), breakMinutes: 60, workingMinutes: 480, crossesMidnight: false, segments: morningSegments },
      { dayOfWeek: 3, working: true, startTime: timeString(8, 0, 0), endTime: timeString(17, 0, 0), breakMinutes: 60, workingMinutes: 480, crossesMidnight: false, segments: morningSegments },
      { dayOfWeek: 4, working: true, startTime: timeString(8, 0, 0), endTime: timeString(17, 0, 0), breakMinutes: 60, workingMinutes: 480, crossesMidnight: false, segments: morningSegments },
      { dayOfWeek: 5, working: true, startTime: timeString(8, 0, 0), endTime: timeString(14, 0, 0), breakMinutes: 0, workingMinutes: 360, crossesMidnight: false, segments: [{ startTime: timeString(8, 0, 0), endTime: timeString(14, 0, 0), breakMinutes: 0, workingMinutes: 360, crossesMidnight: false }] },
      { dayOfWeek: 6, working: false, startTime: null, endTime: null, breakMinutes: 0, workingMinutes: 0, crossesMidnight: false, segments: [] },
      { dayOfWeek: 0, working: false, startTime: null, endTime: null, breakMinutes: 0, workingMinutes: 0, crossesMidnight: false, segments: [] }
    ];

    const shiftFixtures = [
      {
        name: 'Mañana',
        code: 'M',
        color: '#0f766e',
        description: 'Turno de mañana con jornada intensiva el viernes',
        rotationStartDate,
        rotationPattern: templateDays.map((day) => ({
          working: day.working,
          startTime: day.startTime,
          endTime: day.endTime,
          breakMinutes: day.breakMinutes,
          workingMinutes: day.workingMinutes,
          crossesMidnight: day.crossesMidnight
        })),
        days: templateDays
      },
      {
        name: 'Tarde',
        code: 'T',
        color: '#2f6fed',
        description: 'Turno de tarde para cobertura extendida',
        rotationStartDate,
        rotationPattern: templateDays.map((day) => ({
          working: day.working,
          startTime:
            day.dayOfWeek === 6 || day.dayOfWeek === 0
              ? null
              : day.dayOfWeek === 5
                ? timeString(14, 0, 0)
                : timeString(14, 0, 0),
          endTime:
            day.dayOfWeek === 6 || day.dayOfWeek === 0
              ? null
              : day.dayOfWeek === 5
                ? timeString(20, 0, 0)
                : timeString(22, 0, 0),
          breakMinutes: day.dayOfWeek === 5 ? 0 : 30,
          workingMinutes: day.dayOfWeek === 5 ? 360 : 450,
          crossesMidnight: false
        })),
        days: templateDays.map((day) =>
          day.dayOfWeek === 6 || day.dayOfWeek === 0
            ? day
            : {
                ...day,
                startTime: timeString(14, 0, 0),
                endTime: timeString(22, 0, 0),
                breakMinutes: 30,
                workingMinutes: 450,
                segments: day.dayOfWeek === 5 ? [{ startTime: timeString(14, 0, 0), endTime: timeString(20, 0, 0), breakMinutes: 0, workingMinutes: 360, crossesMidnight: false }] : afternoonSegments
              }
        )
      },
      {
        name: 'Noche',
        code: 'N',
        color: '#7c3aed',
        description: 'Turno nocturno que cruza medianoche',
        rotationStartDate,
        rotationPattern: templateDays.map((day) => ({
          working: day.working,
          startTime: day.dayOfWeek === 6 || day.dayOfWeek === 0 ? null : timeString(22, 0, 0),
          endTime: day.dayOfWeek === 6 || day.dayOfWeek === 0 ? null : timeString(6, 0, 0),
          breakMinutes: 30,
          workingMinutes: day.dayOfWeek === 6 || day.dayOfWeek === 0 ? 0 : 450,
          crossesMidnight: day.dayOfWeek === 6 || day.dayOfWeek === 0 ? false : true
        })),
        days: templateDays.map((day) =>
          day.dayOfWeek === 6 || day.dayOfWeek === 0
            ? day
            : {
                ...day,
                startTime: timeString(22, 0, 0),
                endTime: timeString(6, 0, 0),
                breakMinutes: 30,
                workingMinutes: 450,
                crossesMidnight: true,
                segments: nightSegments
              }
        )
      }
    ];

    const shifts: ShiftEntity[] = [];
    for (const fixture of shiftFixtures) {
      const savedShift = await shiftRepository.save(
        shiftRepository.create({
          company,
          name: fixture.name,
          code: fixture.code,
          description: fixture.description,
          color: fixture.color,
          active: true,
          rotationStartDate: fixture.rotationStartDate ?? null,
          rotationPattern: fixture.rotationPattern ?? null
        })
      );
      shifts.push(savedShift);

      const days = fixture.days.map((day) =>
        dayRepository.create({
          ...day,
          shift: savedShift
        })
      );
      await dayRepository.save(days);
    }

    const morning = shifts.find((shift) => shift.code === 'M');
    const afternoon = shifts.find((shift) => shift.code === 'T');
    const night = shifts.find((shift) => shift.code === 'N');
    const laura = users.find((bundle) => bundle.user.email === 'laura@victrium.local');
    const carlos = users.find((bundle) => bundle.user.email === 'carlos@victrium.local');
    const rrhh = users.find((bundle) => bundle.user.email === 'rrhh@victrium.local');
    if (!morning || !afternoon || !night || !laura || !carlos || !rrhh) {
      throw new AppError('SHIFT_NOT_FOUND', 'No se pudieron preparar los turnos seed', 404);
    }

    const today = context.referenceDate;
    const pastFrom = formatMadridDate(addDays(today, -14));
    const futureFrom = formatMadridDate(addDays(today, 7));
    const currentYearEnd = endOfYearDate(today.getUTCFullYear());
    const nextYearEnd = endOfYearDate(today.getUTCFullYear() + 1);

    await assignmentRepository.save([
      assignmentRepository.create({
        company,
        employee: laura.employee,
        shift: morning,
        validFrom: pastFrom,
        validTo: formatMadridDate(addDays(today, 6)),
        notes: 'Turno principal de Laura'
      }),
      assignmentRepository.create({
        company,
        employee: laura.employee,
        shift: afternoon,
        validFrom: futureFrom,
        validTo: currentYearEnd,
        notes: 'Cambio futuro planificado de Laura'
      }),
      assignmentRepository.create({
        company,
        employee: carlos.employee,
        shift: morning,
        validFrom: pastFrom,
        validTo: currentYearEnd,
        notes: 'Turno estable de Carlos'
      }),
      assignmentRepository.create({
        company,
        employee: rrhh.employee,
        shift: morning,
        validFrom: pastFrom,
        validTo: nextYearEnd,
        notes: 'Turno RRHH'
      })
    ]);

    await overrideRepository.save([
      overrideRepository.create({
        company,
        employee: laura.employee,
        shift: night,
        date: formatMadridDate(addDays(today, 1)),
        type: 'SHIFT',
        notes: 'Cobertura nocturna puntual'
      }),
      overrideRepository.create({
        company,
        employee: carlos.employee,
        shift: null,
        date: formatMadridDate(addDays(today, 2)),
        type: 'OFF',
        notes: 'Descanso excepcional'
      })
    ]);

    return {
      shifts: shifts.length,
      assignments: 4,
      overrides: 2
    };
  }

  private async seedTimeEntries(manager: EntityManager, users: SeedUserBundle[], context: SeedContext) {
    const repository = manager.getRepository(TimeEntryEntity);
    const bundles = new Map(users.map((bundle) => [bundle.user.email, bundle]));
    const recordsByEmail = new Map<string, TimeEntryDayRecord[]>();
    let total = 0;

    const createPair = async (
      bundle: SeedUserBundle,
      dia: string,
      entradaHora: string,
      salidaHora: string,
      recordDayIndex: number
    ) => {
      const entrada = await repository.save(
        repository.create({
          dia,
          hora: entradaHora,
          tipo: 'ENTRADA',
          origen: SEED_ORIGIN,
          usuario: bundle.user
        })
      );
      const salida = await repository.save(
        repository.create({
          dia,
          hora: salidaHora,
          tipo: 'SALIDA',
          origen: SEED_ORIGIN,
          usuario: bundle.user
        })
      );

      total += 2;
      const records = recordsByEmail.get(bundle.user.email) ?? [];
      records[recordDayIndex] = {
        dia,
        entrada,
        salida
      };
      recordsByEmail.set(bundle.user.email, records);
    };

    const laura = bundles.get('laura@victrium.local');
    const carlos = bundles.get('carlos@victrium.local');
    const acmeAdmin = bundles.get('admin@acme.local');
    if (!laura || !carlos || !acmeAdmin) {
      throw new AppError('USER_NOT_FOUND', 'No se pudieron preparar los usuarios seed', 404);
    }

    for (let index = 0; index < context.lauraDays.length; index += 1) {
      await createPair(laura, context.lauraDays[index], addMinutes('08:05:00', index % 10), addMinutes('17:10:00', index % 12), index);
    }

    for (let index = 0; index < 20; index += 1) {
      await createPair(carlos, context.carlosDays[index], addMinutes('08:20:00', index % 8), addMinutes('17:40:00', index % 10), index);
    }

    for (let index = 20; index < context.carlosDays.length; index += 1) {
      const offset = index - 20;
      await createPair(carlos, context.carlosDays[index], addMinutes('08:15:00', offset), addMinutes('17:15:00', offset), index);
    }

    for (let index = 0; index < context.acmeDays.length; index += 1) {
      await createPair(acmeAdmin, context.acmeDays[index], addMinutes('09:00:00', index % 6), addMinutes('18:00:00', index % 9), index);
    }

    laura.user.working = false;
    laura.user.ultimoFichaje = `${context.lauraDays[context.lauraDays.length - 1]} ${addMinutes('17:10:00', (context.lauraDays.length - 1) % 12)} - SALIDA`;
    carlos.user.working = false;
    carlos.user.ultimoFichaje = `${context.carlosDays[context.carlosDays.length - 1]} ${addMinutes('17:15:00', context.carlosDays.length - 21)} - SALIDA`;
    acmeAdmin.user.working = false;
    acmeAdmin.user.ultimoFichaje = `${context.acmeDays[context.acmeDays.length - 1]} ${addMinutes('18:00:00', (context.acmeDays.length - 1) % 9)} - SALIDA`;

    await manager.getRepository(UserEntity).save([laura.user, carlos.user, acmeAdmin.user]);
    return {
      byEmail: recordsByEmail,
      total
    };
  }

  private async seedAudits(manager: EntityManager, users: SeedUserBundle[], timeEntries: SeedTimeEntryBundle) {
    const userMap = new Map(users.map((bundle) => [bundle.user.email, bundle]));
    const laura = userMap.get('laura@victrium.local');
    const rrhh = userMap.get('rrhh@victrium.local');
    const carlos = userMap.get('carlos@victrium.local');
    if (!laura || !rrhh || !carlos) {
      throw new AppError('USER_NOT_FOUND', 'No se pudieron preparar los usuarios para auditoría', 404);
    }

    const lauraDays = timeEntries.byEmail.get(laura.user.email) ?? [];
    const carlosDays = timeEntries.byEmail.get(carlos.user.email) ?? [];
    const lauraEntry = lauraDays[4]?.entrada;
    const lauraExit = lauraDays[10]?.salida;
    const carlosEntry = carlosDays[2]?.entrada;
    const carlosExit = carlosDays[8]?.salida;

    if (!lauraEntry || !lauraExit || !carlosEntry || !carlosExit) {
      throw new AppError('TIME_ENTRY_NOT_FOUND', 'No se encontraron fichajes para auditar', 404);
    }

    await this.correctTimeEntry(manager, lauraEntry, {
      dia: lauraEntry.dia,
      hora: addMinutes(lauraEntry.hora, 13),
      tipo: 'ENTRADA',
      reason: 'Ajuste por incidencia administrativa del registro de entrada',
      correctedBy: rrhh.user
    });

    await this.correctTimeEntry(manager, carlosExit, {
      dia: carlosExit.dia,
      hora: addMinutes(carlosExit.hora, 22),
      tipo: 'SALIDA',
      reason: 'Corrección de hora de salida tras revisión manual',
      correctedBy: laura.user
    });

    return 2;
  }

  private async correctTimeEntry(
    manager: EntityManager,
    entry: TimeEntryEntity,
    change: {
      dia: string;
      hora: string;
      tipo: 'ENTRADA' | 'SALIDA';
      reason: string;
      correctedBy: UserEntity;
    }
  ) {
    const timeEntryRepository = manager.getRepository(TimeEntryEntity);
    const auditRepository = manager.getRepository(TimeEntryAuditEntity);

    const previousVersion = entry.version ?? 1;
    const previous = {
      dia: entry.dia,
      hora: entry.hora,
      tipo: entry.tipo
    };

    entry.dia = change.dia;
    entry.hora = change.hora;
    entry.tipo = change.tipo;

    const saved = await timeEntryRepository.save(entry);
    await auditRepository.save(
      auditRepository.create({
        timeEntry: saved,
        correctedBy: change.correctedBy,
        previousDia: previous.dia,
        previousHora: previous.hora,
        previousTipo: previous.tipo,
        newDia: saved.dia,
        newHora: saved.hora,
        newTipo: saved.tipo,
        previousVersion,
        newVersion: saved.version,
        reason: change.reason
      })
    );
  }

  private async seedVacations(manager: EntityManager, users: SeedUserBundle[], context: SeedContext) {
    const repository = manager.getRepository(VacationEntity);
    const userMap = new Map(users.map((bundle) => [bundle.user.email, bundle]));
    const laura = userMap.get('laura@victrium.local');
    const carlos = userMap.get('carlos@victrium.local');
    if (!laura || !carlos) {
      throw new AppError('USER_NOT_FOUND', 'No se pudieron preparar usuarios para vacaciones', 404);
    }

    const vacations = [
      {
        employee: laura.employee,
        company: laura.user.company!,
        inicio: context.generalDays[3],
        fin: context.generalDays[7],
        estado: VacationStatus.APROBADO,
        aprobado: true,
        consumidas: true
      },
      {
        employee: laura.employee,
        company: laura.user.company!,
        inicio: context.generalDays[10],
        fin: context.generalDays[12],
        estado: VacationStatus.PENDIENTE,
        aprobado: false,
        consumidas: false
      },
      {
        employee: carlos.employee,
        company: carlos.user.company!,
        inicio: context.generalDays[14],
        fin: context.generalDays[16],
        estado: VacationStatus.DENEGADO,
        aprobado: false,
        consumidas: false
      }
    ];

    await repository.save(vacations.map((vacation) => repository.create(vacation)));
    return vacations.length;
  }

  private async seedPermissions(manager: EntityManager, users: SeedUserBundle[], context: SeedContext) {
    const repository = manager.getRepository(PermissionEntity);
    const userMap = new Map(users.map((bundle) => [bundle.user.email, bundle]));
    const laura = userMap.get('laura@victrium.local');
    const carlos = userMap.get('carlos@victrium.local');
    if (!laura || !carlos) {
      throw new AppError('USER_NOT_FOUND', 'No se pudieron preparar usuarios para permisos', 404);
    }

    const permissions = [
      {
        employee: laura.employee,
        company: laura.user.company!,
        dia: context.generalDays[4],
        horaInicio: timeString(9, 0, 0),
        horaFin: timeString(12, 0, 0),
        descripcion: 'Permiso médico para revisión y analítica',
        estado: PermissionStatus.APROBADO,
        aprobado: true
      },
      {
        employee: carlos.employee,
        company: carlos.user.company!,
        dia: context.generalDays[8],
        horaInicio: timeString(15, 0, 0),
        horaFin: timeString(17, 0, 0),
        descripcion: 'Permiso personal pendiente de validación',
        estado: PermissionStatus.PENDIENTE,
        aprobado: false
      },
      {
        employee: laura.employee,
        company: laura.user.company!,
        dia: context.generalDays[13],
        horaInicio: timeString(16, 0, 0),
        horaFin: timeString(18, 0, 0),
        descripcion: 'Permiso denegado por cobertura insuficiente',
        estado: PermissionStatus.DENEGADO,
        aprobado: false
      }
    ];

    await repository.save(permissions.map((permission) => repository.create(permission)));
    return permissions.length;
  }

  private async seedIncidents(manager: EntityManager, users: SeedUserBundle[], context: SeedContext) {
    const repository = manager.getRepository(IncidentEntity);
    const userMap = new Map(users.map((bundle) => [bundle.user.email, bundle]));
    const laura = userMap.get('laura@victrium.local');
    const carlos = userMap.get('carlos@victrium.local');
    const acmeAdmin = userMap.get('admin@acme.local');
    if (!laura || !carlos || !acmeAdmin) {
      throw new AppError('USER_NOT_FOUND', 'No se pudieron preparar usuarios para incidencias', 404);
    }

    const incidents = [
      {
        employee: carlos.employee,
        company: carlos.user.company!,
        dia: context.carlosDays[6],
        descripcion: 'Olvido de fichaje al salir de una visita a cliente',
        resumen: 'Olvido de fichaje',
        resuelta: false,
        explicacion: null
      },
      {
        employee: carlos.employee,
        company: carlos.user.company!,
        dia: context.carlosDays[6],
        descripcion: 'Salida olvidada detectada en revisión de jornada',
        resumen: 'Salida olvidada',
        resuelta: true,
        explicacion: 'Corregida manualmente tras revisión del responsable'
      },
      {
        employee: laura.employee,
        company: laura.user.company!,
        dia: context.lauraDays[4],
        descripcion: 'Necesidad de corregir la hora de entrada por consulta médica',
        resumen: 'Corrección de horario',
        resuelta: true,
        explicacion: 'Ajuste validado por RRHH'
      },
      {
        employee: laura.employee,
        company: laura.user.company!,
        dia: context.generalDays[17],
        descripcion: 'Incidencia resuelta registrada para pruebas del detalle',
        resumen: 'Incidencia resuelta',
        resuelta: true,
        explicacion: 'Cierre documentado por el equipo'
      },
      {
        employee: acmeAdmin.employee,
        company: acmeAdmin.user.company!,
        dia: context.acmeDays[2],
        descripcion: 'Incidencia pendiente en la sede de Acme',
        resumen: 'Incidencia pendiente',
        resuelta: false,
        explicacion: null
      }
    ];

    await repository.save(incidents.map((incident) => repository.create(incident)));
    return incidents.length;
  }
}
