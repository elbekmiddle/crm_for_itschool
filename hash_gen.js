const fs = require('fs');
const bcrypt = require('bcrypt');

const pwd = 'password123';
const hash = bcrypt.hashSync(pwd, 10);
const isValid = bcrypt.compareSync(pwd, hash);

console.log("Generated Hash:", hash);
console.log("Is Valid:", isValid);

fs.writeFileSync('valid_hash.txt', hash);
