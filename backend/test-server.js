const express = require('express');
const users = require('./users');
const app = express();

app.use(express.json());

console.log('users:', users);

app.get('/test', (req, res) => {
  res.send('Test GET works!');
});

app.post('/api/login', (req, res) => {
  console.log('POST /api/login received! req.body:', req.body);
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    res.json({ success: true, user });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.listen(5001, '127.0.0.1', () => {
  console.log('Test server listening on http://127.0.0.1:5001');
});