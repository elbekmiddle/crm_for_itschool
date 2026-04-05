
const bcrypt = require('bcrypt');
const hash = "$2b$10$8wBdolp.IOlANqubyQzwSusBxNHUTbdVg12WzkDBLIcDsO0tV1B5q";
const password = "webdev20091";

async function verify() {
  const result = await bcrypt.compare(password, hash);
  console.log('Password valid:', result);
}

verify().catch(console.error);
