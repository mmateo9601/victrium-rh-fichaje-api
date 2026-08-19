import { DataSource } from 'typeorm';

import { TimeEntryEntity } from '../../database/entities/time-entry.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { UsersService } from '../users/users.service';
import { TimeEntriesService } from './time-entries.service';

describe('TimeEntriesService', () => {
  it('creates a clock in entry and toggles user state', async () => {
    const user = {
      id: 1,
      email: 'ada@example.com',
      numero: 'EMP001',
      nombreEmpleado: 'Ada Lovelace',
      working: false,
      roles: [],
      password: 'secret',
      dni: '12345678A',
      timeEntries: [],
      sessions: []
    } as unknown as UserEntity;

    const savedEntries: TimeEntryEntity[] = [];
    const usersRepository = {
      findOne: jest.fn().mockResolvedValue(user),
      save: jest.fn().mockImplementation(async (value) => value)
    };
    const timeEntriesRepository = {
      create: jest.fn().mockImplementation((value) => value),
      save: jest.fn().mockImplementation(async (value) => {
        savedEntries.push(value);
        return value;
      }),
      createQueryBuilder: jest.fn()
    };
    const manager = {
      getRepository: jest.fn().mockImplementation((entity) => {
        if (entity === UserEntity) {
          return usersRepository;
        }
        if (entity === TimeEntryEntity) {
          return timeEntriesRepository;
        }
        throw new Error('Unexpected entity');
      })
    };
    const dataSource = {
      transaction: jest.fn().mockImplementation(async (callback) => callback(manager))
    } as unknown as DataSource;

    const usersService = {
      findById: jest.fn(),
      toPublicUser: jest.fn()
    } as unknown as UsersService;

    const service = new TimeEntriesService(dataSource, timeEntriesRepository as never, usersService);
    const result = await service.clock(1, { origen: 'web' });

    expect(result.tipo).toBe('ENTRADA');
    expect(usersRepository.save).toHaveBeenCalledTimes(1);
    expect(timeEntriesRepository.save).toHaveBeenCalledTimes(1);
    expect(savedEntries).toHaveLength(1);
    expect(user.working).toBe(true);
  });
});
