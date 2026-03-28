const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/courses/22222222-2222-2222-2222-222222222222/students',
  method: 'GET',
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Courses Students Response:', res.statusCode);
    console.log(data);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});
req.end();
