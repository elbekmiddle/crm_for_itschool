const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Login Response:', res.statusCode);
    console.log(data);
    try {
      const parsed = JSON.parse(data);
      if (parsed.access_token) {
        testPatch(parsed.access_token);
      }
    } catch {}
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(JSON.stringify({ email: 'admin@school.com', password: 'password123' }));
req.end();

function testPatch(token) {
  const patchOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/users/11111111-1111-1111-1111-111111111111',
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  };

  const pReq = http.request(patchOptions, (res) => {
    let pData = '';
    res.on('data', (d) => pData += d);
    res.on('end', () => {
      console.log('Patch Response:', res.statusCode);
      console.log(pData);
    });
  });
  pReq.write(JSON.stringify({ first_name: 'Admin2' })); // Wait, users table has no first_name. Let's try password update
  pReq.end();
}
