export type DepartmentDto = {
  id: number;
  companyId: number | null;
  companyName: string | null;
  parentDepartmentId: number | null;
  parentDepartmentName: string | null;
  managerEmployeeId: number | null;
  managerEmployeeNombre: string | null;
  name: string;
  code: string;
  description: string | null;
  active: boolean;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateDepartmentDto = {
  companyId?: number;
  name: string;
  code: string;
  parentDepartmentId?: number | null;
  managerEmployeeId?: number | null;
  description?: string | null;
  active?: boolean;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type UpdateDepartmentDto = Partial<CreateDepartmentDto>;
