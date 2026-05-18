import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, User, Lock, ArrowRight } from 'lucide-react';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validUsers = [
    { id: 1, name: 'Test Employee', email: 'employee@test.com', password: '123456', role: 'employee' },
    { id: 2, name: 'Test Manager', email: 'manager@test.com', password: '123456', role: 'manager' },
    { id: 3, name: 'Test Admin', email: 'admin@test.com', password: '123456', role: 'admin' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Hardcoded credential validation for hackathon deployment
    const user = validUsers.find(u => u.email === email && u.password === password);

    if (user) {
      localStorage.setItem('user', JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }));
      localStorage.setItem('userRole', user.role);
      navigate('/dashboard');
    } else {
      setError('Invalid email or password');
    }
    setLoading(false);
  };

  return (
    <div className="login-container fade-in">
      <div className="login-content login-form-content">
        <div className="login-header">
          <div className="logo-placeholder">
            <div className="logo-icon"></div>
          </div>
          <h1 className="text-gradient">Goal Tracking Portal</h1>
          <p className="login-subtitle">Sign in to continue to your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              <User size={18} />
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              <Lock size={18} />
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button
            type="submit"
            className={`continue-btn ${email && password ? 'active' : ''}`}
            disabled={!email || !password || loading}
          >
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            {!loading && <LogIn size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
}