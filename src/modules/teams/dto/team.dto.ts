export type TeamDto = {
  id: number;
  companyId: number | null;
  companyName: string | null;
  departmentId: number | null;
  departmentName: string | null;
  managerEmployeeId: number | null;
  managerEmployeeNombre: string | null;
  name: string;
  code: string | null;
  active: boolean;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateTeamDto = {
  companyId?: number;
  departmentId?: number | null;
  name: string;
  code?: string | null;
  managerEmployeeId?: number | null;
  active?: boolean;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type UpdateTeamDto = Partial<CreateTeamDto>;
