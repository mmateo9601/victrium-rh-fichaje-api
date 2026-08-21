export class ApiKeyResponseDto {
  id!: number;
  name!: string;
  description!: string | null;
  userId!: number;
  userNumero!: string;
  userNombreEmpleado!: string;
  companyId!: number | null;
  active!: boolean;
  expiresAt!: Date | null;
  lastUsedAt!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
  createdBy!: string | null;
  plainApiKey?: string;
}
