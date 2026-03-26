import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class V57CreateCommentHistoriesTable1711430400002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建comment_histories表
    await queryRunner.createTable(
      new Table({
        name: 'comment_histories',
        columns: [
          { name: 'id', type: 'UUID', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'comment_id', type: 'UUID', isNullable: false },
          { name: 'content', type: 'TEXT', isNullable: false },
          { name: 'edited_by', type: 'UUID', isNullable: false },
          { name: 'edited_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // 创建外键
    await queryRunner.createForeignKey(
      'comment_histories',
      new TableForeignKey({
        name: 'fk_comment_histories_comment_id',
        columnNames: ['comment_id'],
        referencedTableName: 'comments',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'comment_histories',
      new TableForeignKey({
        name: 'fk_comment_histories_edited_by',
        columnNames: ['edited_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // 创建索引
    await queryRunner.createIndex(
      'comment_histories',
      new TableIndex({
        name: 'idx_comment_histories_comment_id',
        columnNames: ['comment_id'],
      }),
    );

    await queryRunner.createIndex(
      'comment_histories',
      new TableIndex({
        name: 'idx_comment_histories_edited_by',
        columnNames: ['edited_by'],
      }),
    );

    await queryRunner.createIndex(
      'comment_histories',
      new TableIndex({
        name: 'idx_comment_histories_edited_at',
        columnNames: ['edited_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除索引
    await queryRunner.dropIndex('comment_histories', 'idx_comment_histories_edited_at');
    await queryRunner.dropIndex('comment_histories', 'idx_comment_histories_edited_by');
    await queryRunner.dropIndex('comment_histories', 'idx_comment_histories_comment_id');

    // 删除外键
    await queryRunner.dropForeignKey('comment_histories', 'fk_comment_histories_edited_by');
    await queryRunner.dropForeignKey('comment_histories', 'fk_comment_histories_comment_id');

    // 删除表
    await queryRunner.dropTable('comment_histories');
  }
}
