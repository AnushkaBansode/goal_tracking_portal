import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, UserCircle, Shield, ArrowRight } from 'lucide-react';
import './Login.css';

const roles = [
  {
    id: 'employee',
    title: 'Employee',
    icon: <UserCircle size={40} className="role-icon" />,
    description: 'Track your personal goals and development plan.',
    color: '#0A3D91'
  },
  {
    id: 'manager',
    title: 'Manager',
    icon: <Briefcase size={40} className="role-icon" />,
    description: 'Oversee team objectives and performance reviews.',
    color: '#0070E0'
  },
  {
    id: 'admin',
    title: 'Admin',
    icon: <Shield size={40} className="role-icon" />,
    description: 'Manage system settings and organizational goals.',
    color: '#00C3FF'
  }
];

export default function Login() {
  const [selectedRole, setSelectedRole] = useState(null);
  const navigate = useNavigate();

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
  };

  const handleContinue = () => {
    if (selectedRole) {
      localStorage.setItem('userRole', selectedRole);
      navigate('/dashboard');
    }
  };

  return (
    <div className="login-container fade-in">
      <div className="login-content">
        <div className="login-header">
          <div className="logo-placeholder">
            <div className="logo-icon"></div>
          </div>
          <h1 className="text-gradient">Goal Tracking Portal</h1>
          <p className="login-subtitle">Select your role to access the platform</p>
        </div>

        <div className="roles-grid">
          {roles.map((role) => (
            <div
              key={role.id}
              className={`role-card ${selectedRole === role.id ? 'selected' : ''}`}
              onClick={() => handleRoleSelect(role.id)}
            >
              <div className="role-card-inner">
                <div className="icon-wrapper" style={{ color: role.color }}>
                  {role.icon}
                </div>
                <h3 className="role-title">{role.title}</h3>
                <p className="role-desc">{role.description}</p>
                <div className="selection-indicator">
                  <div className="indicator-circle"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button 
          className={`continue-btn ${selectedRole ? 'active' : ''}`}
          onClick={handleContinue}
          disabled={!selectedRole}
        >
          <span>Continue to Portal</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
