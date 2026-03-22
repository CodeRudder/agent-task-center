const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'agent_task_test',
  user: 'admin',
  password: 'admin123'
});

async function checkUsers() {
  try {
    const result = await pool.query('SELECT id, username, display_name, role FROM users LIMIT 10');
    console.log('=== Users in database ===');
    console.log(`Total users: ${result.rows.length}`);
    result.rows.forEach(user => {
      console.log(`  - ${user.username} (${user.display_name}) - Role: ${user.role}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsers();
