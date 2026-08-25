export type CompanySettingDto = {
  id: number;
  companyId: number | null;
  companyName: string | null;
  settingKey: string;
  settingValue: Record<string, unknown>;
  dataType: string | null;
  active: boolean;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCompanySettingDto = {
  companyId?: number;
  settingKey: string;
  settingValue: Record<string, unknown>;
  dataType?: string | null;
  active?: boolean;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type UpdateCompanySettingDto = Partial<CreateCompanySettingDto>;
