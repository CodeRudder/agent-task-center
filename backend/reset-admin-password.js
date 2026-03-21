const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

// 新的管理员密码
const NEW_PASSWORD = 'Admin123!';

async function resetAdminPassword() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'admin',
    password: process.env.DB_PASSWORD || 'admin123',
    database: process.env.DB_DATABASE || 'agent_task_system',
  });

  try {
    console.log('连接到数据库...');
    const client = await pool.connect();

    console.log('生成新的密码哈希...');
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);

    console.log('更新管理员密码...');
    const result = await client.query(
      `UPDATE users 
       SET password = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE email = 'admin@example.com'
       RETURNING id, email, display_name, role`,
      [hashedPassword]
    );

    if (result.rows.length > 0) {
      console.log('✅ 管理员密码重置成功！');
      console.log('管理员信息：', result.rows[0]);
      console.log('新密码：', NEW_PASSWORD);
    } else {
      console.log('❌ 未找到管理员账号 admin@example.com');
    }

    client.release();
  } catch (error) {
    console.error('❌ 重置密码失败：', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

resetAdminPassword();
