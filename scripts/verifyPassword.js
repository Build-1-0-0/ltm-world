const bcrypt = require('bcryptjs');

const password = 'AdminLTM2025';
const hash = '$2a$10$kaW5FRClXtpJr5KI7dUEP.e9bUhxjhDrDgrNDYWJKju4yGrNmyHym';

bcrypt.compare(password, hash, (err, match) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Password match:', match);
    }
});