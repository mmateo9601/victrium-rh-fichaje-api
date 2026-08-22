import 'reflect-metadata';

import { DataSource } from 'typeorm';

import { createAppConfig } from '../config/env.validation';
import { createTypeOrmOptions } from './typeorm.options';

const config = createAppConfig(process.env);

export const AppDataSource = new DataSource(createTypeOrmOptions(config));

export default AppDataSource;
