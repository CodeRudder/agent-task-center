const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'agent_task_test',
  user: 'admin',
  password: 'admin123'
});

async function checkUsersDetailed() {
  try {
    // 1. 检查用户总数
    const countResult = await pool.query('SELECT COUNT(*) FROM users');
    console.log('=== 用户统计 ===');
    console.log(`总用户数: ${countResult.rows[0].count}`);

    // 2. 检查所有用户详细信息
    const usersResult = await pool.query(`
      SELECT 
        id, 
        username, 
        email, 
        display_name, 
        role, 
        status,
        feishu_open_id,
        created_at
      FROM users
      ORDER BY created_at
    `);
    
    console.log('\n=== 用户列表 ===');
    usersResult.rows.forEach((user, index) => {
      console.log(`\n用户 ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  用户名: ${user.username}`);
      console.log(`  邮箱: ${user.email}`);
      console.log(`  显示名: ${user.display_name}`);
      console.log(`  角色: ${user.role}`);
      console.log(`  状态: ${user.status}`);
      console.log(`  飞书ID: ${user.feishu_open_id || '未设置'}`);
      console.log(`  创建时间: ${user.created_at}`);
    });

    // 3. 检查feishu_open_id字段是否存在
    const fieldCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users' 
      AND column_name = 'feishu_open_id'
      AND table_schema = 'public'
    `);
    
    console.log('\n=== feishu_open_id字段检查 ===');
    if (fieldCheck.rows.length > 0) {
      console.log('✅ feishu_open_id字段存在');
      console.log(`   数据类型: ${fieldCheck.rows[0].data_type}`);
      console.log(`   可为空: ${fieldCheck.rows[0].is_nullable}`);
    } else {
      console.log('❌ feishu_open_id字段不存在');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsersDetailed();
