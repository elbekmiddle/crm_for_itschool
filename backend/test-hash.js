const bcrypt = require('bcrypt');
const hash = '$2b$10$8wBdolp.IOlANqubyQzwSusBxNHUTbdVg12WzkDBLIcDsO0tV1B5q';

async function test() {
  const isMatch1 = await bcrypt.compare('password123', hash);
  const isMatch2 = await bcrypt.compare('admin', hash);
  const isMatch3 = await bcrypt.compare('123456', hash);
  const isMatch4 = await bcrypt.compare('12345678', hash);
  console.log('password123:', isMatch1);
  console.log('admin:', isMatch2);
  console.log('123456:', isMatch3);
  console.log('12345678:', isMatch4);
}
test();
