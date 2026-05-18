import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Target, TrendingUp, Users, Calendar, 
  CheckCircle, MessageSquare, BarChart as BarChartIcon, Unlock,
  Search, Bell, LogOut, ChevronRight, LayoutDashboard, Plus, Trash2, Pencil
} from 'lucide-react';
import CreateGoalModal from '../components/CreateGoalModal';
import EditGoalModal from '../components/EditGoalModal';
import GoalAnalyticsSection from '../components/analytics/GoalAnalyticsSection';
import AISuggestionsSection from '../components/ai/AISuggestionsSection';
import { apiFetch } from '../api';
import { computeGoalAnalytics } from '../utils/goalAnalytics';
import { suggestionToInitialGoal } from '../utils/aiContext';
import './Dashboard.css';

const ROLE_CONFIGS = {
  employee: {
    title: 'Employee',
    welcomeMessage: "Here's your personal development tracking for today.",
    menuItems: [
      { id: 'overview', icon: <LayoutDashboard size={20} />, label: 'Overview' },
      { id: 'goals', icon: <Target size={20} />, label: 'My Goals' },
      { id: 'updates', icon: <Calendar size={20} />, label: 'Quarterly Updates' },
      { id: 'progress', icon: <TrendingUp size={20} />, label: 'Progress Tracking' },
    ],
    stats: [
      { label: 'Personal Goals', value: '5', trend: '↑ 2 completed', icon: <Target size={20} className="text-blue" />, bgClass: 'bg-blue-light' },
      { label: 'Quarterly OKRs', value: '3', trend: 'On track', icon: <Calendar size={20} className="text-purple" />, bgClass: 'bg-purple-light' },
      { label: 'Overall Progress', value: '78%', trend: '↑ 12% this month', icon: <TrendingUp size={20} className="text-green" />, bgClass: 'bg-green-light' },
    ]
  },
  manager: {
    title: 'Manager',
    welcomeMessage: "Overview of your team's performance and pending tasks.",
    menuItems: [
      { id: 'overview', icon: <LayoutDashboard size={20} />, label: 'Overview' },
      { id: 'team-goals', icon: <Users size={20} />, label: 'Team Goals' },
      { id: 'approvals', icon: <CheckCircle size={20} />, label: 'Approvals' },
      { id: 'check-ins', icon: <MessageSquare size={20} />, label: 'Employee Check-ins' },
    ],
    stats: [
      { label: 'Team Goals', value: '24', trend: '↑ 5 completed', icon: <Users size={20} className="text-blue" />, bgClass: 'bg-blue-light' },
      { label: 'Pending Approvals', value: '8', trend: 'Requires action', icon: <CheckCircle size={20} className="text-purple" />, bgClass: 'bg-purple-light' },
      { label: 'Team Velocity', value: '85%', trend: '↑ 5% this sprint', icon: <TrendingUp size={20} className="text-green" />, bgClass: 'bg-green-light' },
    ]
  },
  admin: {
    title: 'Admin',
    welcomeMessage: "System-wide analytics and access controls.",
    menuItems: [
      { id: 'overview', icon: <LayoutDashboard size={20} />, label: 'Overview' },
      { id: 'employees', icon: <Users size={20} />, label: 'All Employees' },
      { id: 'analytics', icon: <BarChartIcon size={20} />, label: 'System Analytics' },
      { id: 'controls', icon: <Unlock size={20} />, label: 'Goal Unlock Controls' },
    ],
    stats: [
      { label: 'Active Users', value: '1,248', trend: '↑ 12 this week', icon: <Users size={20} className="text-blue" />, bgClass: 'bg-blue-light' },
      { label: 'System Health', value: '99.9%', trend: 'Optimal', icon: <BarChartIcon size={20} className="text-green" />, bgClass: 'bg-green-light' },
      { label: 'Locked Goals', value: '15', trend: 'Awaiting unlock', icon: <Unlock size={20} className="text-purple" />, bgClass: 'bg-purple-light' },
    ]
  }
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createGoalPrefill, setCreateGoalPrefill] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);
  const [goals, setGoals] = useState([]);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [goalsError, setGoalsError] = useState(null);
  const [notification, setNotification] = useState(null);
  
  // Manager/Admin dashboard data states
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);
  
  const navigate = useNavigate();

  // Recomputed whenever goals change — keeps analytics in sync after CRUD
  const analytics = useMemo(
    () => (role === 'employee' ? computeGoalAnalytics(goals) : null),
    [goals, role]
  );

  /** Load goals from API (analytics derived from goals state automatically). */
  const refreshEmployeeData = useCallback(async () => {
    setGoalsLoading(true);
    setGoalsError(null);
    try {
      const { data } = await apiFetch('/api/goals?role=employee');
      setGoals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[Dashboard] refreshEmployeeData failed:', err);
      setGoalsError('Unable to load data');
      setGoals([]);
    } finally {
      setGoalsLoading(false);
    }
  }, []);

  /** Load manager/admin dashboard data from API */
  const refreshDashboardData = useCallback(async (currentRole) => {
    if (currentRole !== 'manager' && currentRole !== 'admin') return;
    
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      const endpoint = currentRole === 'manager' ? '/api/dashboard/manager' : '/api/dashboard/admin';
      const { data } = await apiFetch(endpoint);
      setDashboardData(data);
    } catch (err) {
      console.error(`[Dashboard] refreshDashboardData failed for ${currentRole}:`, err);
      setDashboardError(null);
      setDashboardData(null);
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedUserStr = localStorage.getItem('user');
    const savedRole = localStorage.getItem('userRole');
    
    if (!savedUserStr || !savedRole || !ROLE_CONFIGS[savedRole]) {
      navigate('/login');
    } else {
      const savedUser = JSON.parse(savedUserStr);
      setUser(savedUser);
      setRole(savedRole);
      if (savedRole === 'employee') {
        refreshEmployeeData();
      } else if (savedRole === 'manager' || savedRole === 'admin') {
        refreshDashboardData(savedRole);
      }
    }
  }, [navigate, refreshEmployeeData, refreshDashboardData]);

  const handleAcceptAISuggestion = (suggestion) => {
    setCreateGoalPrefill(suggestionToInitialGoal(suggestion));
    setIsModalOpen(true);
    showNotification('Review and save your AI-suggested goal');
  };

  const handleCloseCreateModal = () => {
    setIsModalOpen(false);
    setCreateGoalPrefill(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleGoalSuccess = (newGoal) => {
    setGoals(prev => [newGoal, ...prev]);
    setCreateGoalPrefill(null);
    showNotification('Goal created successfully!');
    
    const currentWeightage = [...goals, newGoal].reduce((sum, g) => sum + g.weightage, 0);
    if (currentWeightage === 100) {
      showNotification('Congratulations! You have reached 100% total weightage.', 'success');
    }
    refreshEmployeeData();
  };

  const handleGoalEditSuccess = (updatedGoal) => {
    setGoals(prev => prev.map(g => g._id === updatedGoal._id ? updatedGoal : g));
    showNotification('Goal updated successfully!');
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    
    try {
      await apiFetch(`/api/goals/${id}`, { method: 'DELETE' });
      setGoals(prev => prev.filter(g => g._id !== id));
      showNotification('Goal deleted successfully', 'success');
    } catch (err) {
      console.error('[Dashboard] handleDeleteGoal failed:', err);
      showNotification(err.message || 'Failed to connect to server', 'error');
    }
  };

  const handleUpdateProgress = async (id, newProgress) => {
    // Optimistic UI update
    setGoals(prev => prev.map(g => {
      if (g._id === id) {
        let status = 'In Progress';
        if (newProgress === 0) status = 'Not Started';
        else if (newProgress === 100) status = 'Completed';
        return { ...g, progress: newProgress, status };
      }
      return g;
    }));

    try {
      await apiFetch(`/api/goals/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ progress: newProgress })
      });
    } catch (err) {
      console.error('[Dashboard] handleUpdateProgress failed:', err);
      refreshEmployeeData();
      showNotification(err.message || 'Failed to connect to server', 'error');
    }
  };

  if (!role) return null;

  const config = ROLE_CONFIGS[role];

  // Sync legacy stat cards with live analytics for employees
  if (role === 'employee' && analytics) {
    config.stats[0].value = String(analytics.totalGoals);
    config.stats[1].value = String(analytics.completedGoals);
    config.stats[2].value = `${analytics.averageProgressPercentage}%`;
    config.stats[1].trend = analytics.completedGoals > 0 ? 'Goals completed' : 'None yet';
    config.stats[2].trend = `${analytics.overallCompletionPercentage}% overall completion`;
  }

  // Sync manager stats with real data
  if (role === 'manager' && dashboardData) {
    config.stats[0].value = String(dashboardData.totalGoals);
    config.stats[1].value = String(dashboardData.pendingApprovals);
    config.stats[2].value = `${dashboardData.teamVelocity}%`;
    config.stats[0].trend = `↑ ${dashboardData.completedGoals} completed`;
    config.stats[1].trend = dashboardData.pendingApprovals > 0 ? 'Requires action' : 'All clear';
    config.stats[2].trend = 'Average progress';
  }

  // Sync admin stats with real data
  if (role === 'admin' && dashboardData) {
    config.stats[0].value = String(dashboardData.totalUsers);
    config.stats[1].value = `${dashboardData.systemHealth}%`;
    config.stats[2].value = String(dashboardData.lockedGoals);
    config.stats[0].trend = `Total goals: ${dashboardData.totalGoals}`;
    config.stats[1].trend = dashboardData.systemHealth >= 80 ? 'Optimal' : 'Needs attention';
    config.stats[2].trend = 'Awaiting unlock';
  }

  // Render role-specific main content sections
  const renderDashboardContent = () => {
    return (
      <div className="content-wrapper">
        <div className="welcome-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 className="welcome-title">
                Welcome back, <span className="text-gradient">{config.title}</span>
              </h1>
              <p className="welcome-subtitle">
                {config.welcomeMessage}
              </p>
            </div>
            {role === 'employee' && (
              <button
                className="btn-primary flex items-center"
                onClick={() => {
                  setCreateGoalPrefill(null);
                  setIsModalOpen(true);
                }}
              >
                <Plus size={20} style={{ marginRight: '8px' }} />
                Create Goal
              </button>
            )}
          </div>
        </div>

        {role === 'employee' && (
          <GoalAnalyticsSection
            goals={goals}
            loading={goalsLoading}
            error={goalsError}
            onRetry={refreshEmployeeData}
          />
        )}

        <div className="stats-grid">
          {config.stats.map((stat, idx) => (
            <div key={idx} className="stat-card">
              <div className="stat-header">
                <span className="stat-label">{stat.label}</span>
                <div className={`stat-icon ${stat.bgClass}`}>
                  {stat.icon}
                </div>
              </div>
              <div className="stat-value">{dashboardLoading ? '...' : stat.value}</div>
              <div className={`stat-trend ${stat.trend.includes('↑') || stat.trend === 'Optimal' || stat.trend === 'On track' ? 'positive' : 'neutral'}`}>
                {stat.trend}
              </div>
            </div>
          ))}
        </div>

        {role === 'employee' && (
          <AISuggestionsSection
            goals={goals}
            analytics={analytics}
            role={role}
            onAcceptSuggestion={handleAcceptAISuggestion}
          />
        )}

        <div className="dashboard-row">
          <div className="recent-goals-card">
            <div className="card-header">
              <h3>{role === 'employee' ? 'My Goals' : role === 'manager' ? 'Team Progress' : 'System Alerts'}</h3>
              <button className="btn-link">View All</button>
            </div>
            <div className="goal-list">
              {role === 'employee' && goalsLoading ? (
                <div className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>
                  Loading...
                </div>
              ) : role === 'employee' && goals.length === 0 ? (
                <div className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>
                  No goals created yet. Click "Create Goal" to get started.
                </div>
              ) : role === 'employee' ? (
                goals.slice(0, 5).map((goal) => (
                  <div key={goal._id} className="goal-item">
                    <div className="goal-info">
                      <h4>{goal.title}</h4>
                      <p>{goal.thrustArea} • {goal.weightage}% Weight</p>
                    </div>
                    <div className="goal-progress-slider">
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={goal.progress} 
                        onChange={(e) => handleUpdateProgress(goal._id, Number(e.target.value))}
                        className="slider"
                        style={{ 
                          background: `linear-gradient(to right, var(--primary-blue) ${goal.progress}%, var(--border-light) ${goal.progress}%)` 
                        }}
                      />
                      <span className="progress-text">{goal.progress}%</span>
                    </div>
                    <div style={{ marginLeft: '1rem', minWidth: '100px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                       {goal.status}
                    </div>
                    <div className="goal-item-actions">
                      <button
                        className="btn-icon-small edit-btn"
                        onClick={() => setEditingGoal(goal)}
                        aria-label="Edit goal"
                      >
                        <Pencil size={16} />
                      </button>
                      <button className="btn-icon-small delete-btn" onClick={() => handleDeleteGoal(goal._id)} aria-label="Delete goal">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              ) : dashboardLoading ? (
                <div className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>
                  Loading...
                </div>
              ) : role === 'manager' && dashboardData?.recentGoals?.length > 0 ? (
                dashboardData.recentGoals.slice(0, 5).map((goal) => (
                  <div key={goal._id} className="goal-item">
                    <div className="goal-info">
                      <h4>{goal.title}</h4>
                      <p>{goal.thrustArea} • {goal.weightage}% Weight • {goal.role}</p>
                    </div>
                    <div className="goal-progress">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${goal.progress}%` }}></div>
                      </div>
                      <span className="progress-text">{goal.progress}%</span>
                    </div>
                    <div style={{ marginLeft: '1rem', minWidth: '100px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                       {goal.status}
                    </div>
                    <button className="btn-icon-small">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                ))
              ) : role === 'admin' && dashboardData?.systemAlerts?.length > 0 ? (
                dashboardData.systemAlerts.map((alert) => (
                  <div key={alert.id} className="goal-item">
                    <div className="goal-info">
                      <h4>{alert.title}</h4>
                      <p>{alert.status} • {alert.progress}% complete</p>
                    </div>
                    <div className="goal-progress">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${alert.progress}%` }}></div>
                      </div>
                      <span className="progress-text">{alert.progress}%</span>
                    </div>
                    <button className="btn-icon-small">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>
                  No {role === 'manager' ? 'team goals' : 'system alerts'} available.
                </div>
              )}
            </div>
          </div>

          <div className="action-required-card">
            <div className="card-header">
              <h3>Action Required</h3>
            </div>
            <div className="action-list">
              {dashboardLoading ? (
                <div className="text-muted" style={{ padding: '1rem', textAlign: 'center' }}>
                  Loading...
                </div>
              ) : role === 'manager' && dashboardData?.pendingApprovals > 0 ? (
                <div className="action-item alert">
                  <div className="action-icon">!</div>
                  <div className="action-details">
                    <h4>Review Pending Goals</h4>
                    <p>{dashboardData.pendingApprovals} goal(s) require approval</p>
                  </div>
                </div>
              ) : role === 'admin' && dashboardData?.lockedGoals > 0 ? (
                <div className="action-item alert">
                  <div className="action-icon">!</div>
                  <div className="action-details">
                    <h4>Unlock Goals</h4>
                    <p>{dashboardData.lockedGoals} goal(s) awaiting unlock</p>
                  </div>
                </div>
              ) : role === 'manager' ? (
                <div className="action-item warning">
                  <div className="action-icon">✓</div>
                  <div className="action-details">
                    <h4>All Clear</h4>
                    <p>No pending approvals at this time</p>
                  </div>
                </div>
              ) : role === 'admin' ? (
                <div className="action-item warning">
                  <div className="action-icon">✓</div>
                  <div className="action-details">
                    <h4>System Healthy</h4>
                    <p>No critical actions required</p>
                  </div>
                </div>
              ) : (
                <div className="action-item warning">
                  <div className="action-icon">!</div>
                  <div className="action-details">
                    <h4>Update Q2 OKRs</h4>
                    <p>Due tomorrow</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-layout fade-in">
      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-placeholder small">
            <div className="logo-icon small"></div>
          </div>
          <h2>GoalTracker</h2>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {config.menuItems.map((item) => (
              <li key={item.id}>
                <a 
                  href="#" 
                  className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); setActiveTab(item.id); }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">
              {user ? user.name.charAt(0) : config.title.charAt(0)}
            </div>
            <div className="user-info">
              <span className="user-name">{user ? user.name : `${config.title} User`}</span>
              <span className="user-role-badge">{config.title}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Header */}
        <header className="top-header">
          <div className="search-bar">
            <Search size={20} className="search-icon" />
            <input type="text" placeholder={`Search ${role === 'admin' ? 'system' : 'goals'}...`} />
          </div>
          
          <div className="header-actions">
            <button className="icon-btn">
              <Bell size={20} />
              <span className="notification-dot"></span>
            </button>
          </div>
        </header>

        {/* Dynamic Dashboard Content */}
        {renderDashboardContent()}
      </main>

      <CreateGoalModal 
        isOpen={isModalOpen} 
        onClose={handleCloseCreateModal}
        onSuccess={handleGoalSuccess}
        initialGoal={createGoalPrefill}
      />

      <EditGoalModal
        isOpen={!!editingGoal}
        goal={editingGoal}
        onClose={() => setEditingGoal(null)}
        onSuccess={handleGoalEditSuccess}
      />
    </div>
  );
}
