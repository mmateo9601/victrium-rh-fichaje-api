import { applyDecorators } from '@nestjs/common';
import { ApiExtension } from '@nestjs/swagger';

import { Roles } from './roles.decorator';

export const ApiRoles = (...roles: string[]) => applyDecorators(Roles(...roles), ApiExtension('x-roles', roles));
