import express from 'express';
import { fileURLToPath } from 'url';

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// GET /login - Login page
app.get('/login', (req, res) => {
  const errorMessage = req.query.error || '';
  res.send(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Login</title></head>
<body>
  <h1>Login</h1>
  <form action="/api/login" method="POST">
    <label for="username">Username:</label>
    <input id="username" name="username" data-testid="user-input" type="text" placeholder="Username" />
    <br/>
    <label for="password">Password:</label>
    <input id="password" name="password" type="password" data-testid="pass-input" placeholder="Password" />
    <br/><br/>
    <button id="login-btn" type="submit">Sign In</button>
  </form>
  <div id="error-message">${errorMessage}</div>
</body>
</html>`);
});

// POST /api/login - Authentication endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === '1234') {
    return res.redirect('/dashboard');
  }

  // Login failed - reload login page with error
  res.send(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Login</title></head>
<body>
  <h1>Login</h1>
  <form action="/api/login" method="POST">
    <label for="username">Username:</label>
    <input id="username" name="username" data-testid="user-input" type="text" placeholder="Username" />
    <br/>
    <label for="password">Password:</label>
    <input id="password" name="password" type="password" data-testid="pass-input" placeholder="Password" />
    <br/><br/>
    <button id="login-btn" type="submit">Sign In</button>
  </form>
  <div id="error-message">Invalid Credentials</div>
</body>
</html>`);
});

// GET /dashboard - Dashboard page
app.get('/dashboard', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Dashboard</title></head>
<body>
  <h1>Welcome to Dashboard</h1>
  <button id="logout-btn">Sign Out</button>
</body>
</html>`);
});

const PORT = 3000;

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  app.listen(PORT, () => {
    console.log(`🚀 Target server running at http://localhost:${PORT}`);
    console.log(`   → Login page: http://localhost:${PORT}/login`);
  });
}

export { app };
