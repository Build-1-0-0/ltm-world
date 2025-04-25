require('dotenv').config();
const bcrypt = require('bcryptjs');

const password = process.argv[2] || process.env.ADMIN_PASSWORD || 'AdminLTM2025';
const hash = bcrypt.hashSync(password, 10);
console.log('Plaintext Password:', password);
console.log('Hashed Password:', hash);
console.log('Escaped for SQL:', hash.replace(/\$/g, '\\$'));