import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class CreateAgentTokenFields1709846400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if column token_created_at exists, if not add it
    const tokenCreatedAtColumn = await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'agents'
      AND column_name = 'token_created_at'
    `);

    if (tokenCreatedAtColumn.length === 0) {
      await queryRunner.query(`
        ALTER TABLE agents
        ADD COLUMN token_created_at TIMESTAMP NULL
      `);
    }

    // Check if column last_api_call_at exists, if not add it
    const lastApiCallAtColumn = await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'agents'
      AND column_name = 'last_api_call_at'
    `);

    if (lastApiCallAtColumn.length === 0) {
      await queryRunner.query(`
        ALTER TABLE agents
        ADD COLUMN last_api_call_at TIMESTAMP NULL
      `);
    }

    // Create index on api_token if not exists
    const indexExists = await queryRunner.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'agents'
      AND indexname = 'idx_agents_api_token'
    `);

    if (indexExists.length === 0) {
      await queryRunner.createIndex(
        'agents',
        new TableIndex({
          name: 'idx_agents_api_token',
          columnNames: ['api_token'],
          isUnique: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.dropIndex('agents', 'idx_agents_api_token');

    // Drop columns
    await queryRunner.query(`ALTER TABLE agents DROP COLUMN IF EXISTS token_created_at`);
    await queryRunner.query(`ALTER TABLE agents DROP COLUMN IF EXISTS last_api_call_at`);
  }
}
