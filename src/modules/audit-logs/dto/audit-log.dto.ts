export type AuditLogDto = {
  id: string;
  companyId: number | null;
  companyName: string | null;
  actorUserId: number | null;
  actorUserEmail: string | null;
  entityName: string;
  entityId: string;
  action: string;
  beforeData: Record<string, unknown> | null;
  afterData: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type CreateAuditLogDto = {
  companyId?: number | null;
  actorUserId?: number | null;
  entityName: string;
  entityId: string;
  action: string;
  beforeData?: Record<string, unknown> | null;
  afterData?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type UpdateAuditLogDto = Partial<CreateAuditLogDto>;
