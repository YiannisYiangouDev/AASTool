import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEvaluationFields1686460000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS obs DECIMAL(10,2);`);
    await queryRunner.query(`ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS neb_class VARCHAR(10);`);
    await queryRunner.query(`ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS average_raw_score DECIMAL(10,2);`);

    await queryRunner.query(`
      UPDATE evaluations
      SET obs = COALESCE(JSON_UNQUOTE(JSON_EXTRACT(result, '$.obs')), obs),
          neb_class = COALESCE(JSON_UNQUOTE(JSON_EXTRACT(result, '$.nebClass')), neb_class),
          average_raw_score = COALESCE(JSON_UNQUOTE(JSON_EXTRACT(result, '$.averageRawScore')), average_raw_score)
      WHERE result IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE evaluations DROP COLUMN IF EXISTS average_raw_score;`);
    await queryRunner.query(`ALTER TABLE evaluations DROP COLUMN IF EXISTS neb_class;`);
    await queryRunner.query(`ALTER TABLE evaluations DROP COLUMN IF EXISTS obs;`);
  }
}
