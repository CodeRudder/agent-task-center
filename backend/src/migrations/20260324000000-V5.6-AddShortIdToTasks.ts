import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class V56AddShortIdToTasks1709846400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 添加short_id字段
    await queryRunner.addColumn(
      'tasks',
      new TableColumn({
        name: 'short_id',
        type: 'bigint',
        isGenerated: true,
        generationStrategy: 'increment',
        isUnique: true,
        isNullable: false,
      }),
    );

    // 创建索引
    await queryRunner.createIndex(
      'tasks',
      new TableIndex({
        name: 'IDX_tasks_short_id',
        columnNames: ['short_id'],
      }),
    );

    // 为现有数据生成short_id（如果表中有数据）
    // 注意：由于使用了generated: 'increment'，TypeORM会自动为新记录生成值
    // 但对于现有记录，我们需要手动设置值
    await queryRunner.query(`
      UPDATE tasks 
      SET short_id = nextval('tasks_short_id_seq')
      WHERE short_id IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除索引
    await queryRunner.dropIndex('tasks', 'IDX_tasks_short_id');

    // 删除字段
    await queryRunner.dropColumn('tasks', 'short_id');
  }
}
