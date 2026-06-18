import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNebAndConfig1686550000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS neb_thresholds (
        id VARCHAR(36) PRIMARY KEY,
        \`min\` INT NOT NULL,
        neb_class VARCHAR(50) NOT NULL,
        equivalent VARCHAR(50) NOT NULL,
        meaning TEXT NOT NULL,
        neb_score INT NOT NULL,
        ordinal INT NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS config (
        id VARCHAR(36) PRIMARY KEY,
        \`key\` VARCHAR(255) NOT NULL UNIQUE,
        value TEXT NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS config`);
    await queryRunner.query(`DROP TABLE IF EXISTS neb_thresholds`);
  }
}
