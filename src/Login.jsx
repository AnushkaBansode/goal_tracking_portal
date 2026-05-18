import { useState } from 'react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/api/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email, password }),
});



      const data = await response.json();

      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Server connection failed');
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f5f7fb',
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          width: '350px',
          padding: '30px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 0 20px rgba(0,0,0,0.1)',
        }}
      >
        <h2 style={{ marginBottom: '20px' }}>Login Portal</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: '15px',
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: '15px',
          }}
        />

        {error && (
          <p style={{ color: 'red', marginBottom: '10px' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '12px',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Login
        </button>

        <div style={{ marginTop: '20px', fontSize: '14px' }}>
          <p><b>Employee:</b> employee@test.com / 123456</p>
          <p><b>Manager:</b> manager@test.com / 123456</p>
          <p><b>Admin:</b> admin@test.com / 123456</p>
        </div>
      </form>
    </div>
  );
}