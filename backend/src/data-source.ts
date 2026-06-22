import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Criterion } from './entities/Criterion';
import { BuildingType } from './entities/BuildingType';
import { Evaluation } from './entities/Evaluation';
import { NebThreshold } from './entities/NebThreshold';
import { Config } from './entities/Config';
import { DisabilityType } from './entities/DisabilityType';
import { AssessmentDimension } from './entities/AssessmentDimension';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required. Example: mysql://user:password@host:3306/dbname');
}
const dbTypeEnv = process.env.DB_TYPE || 'mariadb';

// Infer database type from connection URL
let inferredType: 'mariadb' | 'postgres' = 'mariadb';
if (/^postgres(ql)?:\/\//i.test(databaseUrl)) inferredType = 'postgres';
if (dbTypeEnv) inferredType = dbTypeEnv as 'mariadb' | 'postgres';

export const AppDataSource = new DataSource({
  type: inferredType,
  url: databaseUrl,
  synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true',
  logging: false,
  entities: [Criterion, BuildingType, Evaluation, NebThreshold, Config, DisabilityType, AssessmentDimension],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
});

export default AppDataSource;
