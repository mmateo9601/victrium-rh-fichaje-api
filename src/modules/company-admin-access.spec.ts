import 'reflect-metadata';

import { ROLES_KEY } from '../common/auth/roles.decorator';
import { IncidentsController } from './incidents/incidents.controller';
import { PermissionsController } from './permissions/permissions.controller';
import { TimeEntriesController } from './time-entries/time-entries.controller';
import { VacationsController } from './vacations/vacations.controller';

function getRoles(controller: object, methodName: string) {
  const method = (controller as Record<string, unknown>)[methodName] as unknown;
  return Reflect.getMetadata(ROLES_KEY, method as object) as string[] | undefined;
}

describe('company admin access metadata', () => {
  it.each([
    [TimeEntriesController.prototype, 'list'],
    [TimeEntriesController.prototype, 'byId'],
    [TimeEntriesController.prototype, 'audits'],
    [TimeEntriesController.prototype, 'correct'],
    [VacationsController.prototype, 'list'],
    [VacationsController.prototype, 'byId'],
    [VacationsController.prototype, 'approve'],
    [VacationsController.prototype, 'deny'],
    [PermissionsController.prototype, 'list'],
    [PermissionsController.prototype, 'months'],
    [PermissionsController.prototype, 'users'],
    [PermissionsController.prototype, 'byId'],
    [PermissionsController.prototype, 'approve'],
    [PermissionsController.prototype, 'deny'],
    [PermissionsController.prototype, 'remove'],
    [IncidentsController.prototype, 'list'],
    [IncidentsController.prototype, 'update'],
    [IncidentsController.prototype, 'resolve'],
    [IncidentsController.prototype, 'months'],
    [IncidentsController.prototype, 'users'],
    [IncidentsController.prototype, 'top'],
    [IncidentsController.prototype, 'byId']
  ])('includes ROLE_COMPANY_ADMIN on %p.%s', (controller, methodName) => {
    expect(getRoles(controller, methodName)).toEqual(expect.arrayContaining(['ROLE_COMPANY_ADMIN']));
  });
});