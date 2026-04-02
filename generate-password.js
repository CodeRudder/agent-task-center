const bcrypt = require('bcrypt');

// 生成加密密码
async function generateHashedPassword() {
  const password = 'Test123456';
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log('Password:', password);
  console.log('Hashed Password:', hashedPassword);
}

generateHashedPassword();
