import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class V57CreateCommentMentionsTable1711430400001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建comment_mentions表
    await queryRunner.createTable(
      new Table({
        name: 'comment_mentions',
        columns: [
          { name: 'id', type: 'UUID', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'comment_id', type: 'UUID', isNullable: false },
          { name: 'mentioned_user_id', type: 'UUID', isNullable: false },
          { name: 'created_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
        ],
        uniques: [
          {
            name: 'uq_comment_mentions',
            columnNames: ['comment_id', 'mentioned_user_id'],
          },
        ],
      }),
      true,
    );

    // 创建外键
    await queryRunner.createForeignKey(
      'comment_mentions',
      new TableForeignKey({
        name: 'fk_comment_mentions_comment_id',
        columnNames: ['comment_id'],
        referencedTableName: 'comments',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'comment_mentions',
      new TableForeignKey({
        name: 'fk_comment_mentions_mentioned_user_id',
        columnNames: ['mentioned_user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // 创建索引
    await queryRunner.createIndex(
      'comment_mentions',
      new TableIndex({
        name: 'idx_comment_mentions_comment_id',
        columnNames: ['comment_id'],
      }),
    );

    await queryRunner.createIndex(
      'comment_mentions',
      new TableIndex({
        name: 'idx_comment_mentions_mentioned_user_id',
        columnNames: ['mentioned_user_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除索引
    await queryRunner.dropIndex('comment_mentions', 'idx_comment_mentions_mentioned_user_id');
    await queryRunner.dropIndex('comment_mentions', 'idx_comment_mentions_comment_id');

    // 删除外键
    await queryRunner.dropForeignKey('comment_mentions', 'fk_comment_mentions_mentioned_user_id');
    await queryRunner.dropForeignKey('comment_mentions', 'fk_comment_mentions_comment_id');

    // 删除表
    await queryRunner.dropTable('comment_mentions');
  }
}
