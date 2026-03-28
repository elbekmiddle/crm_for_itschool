const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    const parsed = JSON.parse(data);
    if (parsed.data && parsed.data.access_token) {
      testDashboard(parsed.data.access_token);
      testCourses(parsed.data.access_token);
    } else {
      console.log('Login failed:', data);
    }
  });
});
req.write(JSON.stringify({ email: 'admin@school.com', password: 'password123' }));
req.end();

function testDashboard(token) {
  const req2 = http.request({
    hostname: 'localhost', port: 3000,
    path: '/api/v1/analytics/teacher/dashboard',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  }, (res) => {
    let d = '';
    res.on('data', chunk => d += chunk);
    res.on('end', () => console.log('Dashboard Response:', res.statusCode, d));
  });
  req2.end();
}

function testCourses(token) {
  const req2 = http.request({
    hostname: 'localhost', port: 3000,
    path: '/api/v1/courses/22222222-2222-2222-2222-222222222222/students',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  }, (res) => {
    let d = '';
    res.on('data', chunk => d += chunk);
    res.on('end', () => console.log('Courses Response:', res.statusCode, d));
  });
  req2.end();
}
