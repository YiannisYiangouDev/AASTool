import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1686300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS building_types (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        disability_weights JSON NOT NULL,
        dimension_weights JSON NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS criteria (
        id VARCHAR(36) PRIMARY KEY,
        code VARCHAR(255) NOT NULL UNIQUE,
        name TEXT NOT NULL,
        definition TEXT NOT NULL,
        justification TEXT NOT NULL,
        value DOUBLE NOT NULL,
        disability INT NOT NULL,
        dimension INT NOT NULL,
        score INT NOT NULL DEFAULT 3,
        levels JSON NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS evaluations (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(255),
        building_type VARCHAR(255) NOT NULL,
        scores JSON NOT NULL,
        result JSON NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS evaluations`);
    await queryRunner.query(`DROP TABLE IF EXISTS criteria`);
    await queryRunner.query(`DROP TABLE IF EXISTS building_types`);
  }

}
