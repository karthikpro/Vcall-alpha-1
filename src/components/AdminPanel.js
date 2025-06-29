import React, { useState, useEffect } from 'react';
import './AdminPanel.css';
import { useAuth } from '../contexts/AuthContext';
import { APP_CONFIG } from '../config/appConfig';

function AdminPanel({ onBackToLanding }) {
  const { user } = useAuth();
  const [betaUsers, setBetaUsers] = useState([...APP_CONFIG.BETA_USERS]);
  const [masterUsers, setMasterUsers] = useState([...APP_CONFIG.MASTER_USERS]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserType, setNewUserType] = useState('beta');
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    activeSessions: 0,
    totalRooms: 0,
    serverUptime: '0h 0m'
  });
  const [logs, setLogs] = useState([
    { id: 1, timestamp: new Date(), level: 'INFO', message: 'System started', user: 'System' },
    { id: 2, timestamp: new Date(), level: 'INFO', message: 'Admin panel accessed', user: user?.name || 'Unknown' }
  ]);

  useEffect(() => {
    // Simulate system stats updates
    const interval = setInterval(() => {
      setSystemStats(prev => ({
        ...prev,
        totalUsers: betaUsers.length + masterUsers.length,
        activeSessions: Math.floor(Math.random() * 10) + 1,
        totalRooms: Math.floor(Math.random() * 5),
        serverUptime: `${Math.floor(Date.now() / 3600000)}h ${Math.floor((Date.now() % 3600000) / 60000)}m`
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [betaUsers.length, masterUsers.length]);

  const addUser = () => {
    if (!newUserEmail || !newUserEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    if (betaUsers.includes(newUserEmail) || masterUsers.includes(newUserEmail)) {
      alert('User already exists');
      return;
    }

    if (newUserType === 'beta') {
      setBetaUsers([...betaUsers, newUserEmail]);
      // In a real app, this would sync with the config
      APP_CONFIG.BETA_USERS.push(newUserEmail);
    } else {
      setMasterUsers([...masterUsers, newUserEmail]);
      APP_CONFIG.MASTER_USERS.push(newUserEmail);
    }

    // Add log entry
    setLogs(prev => [{
      id: Date.now(),
      timestamp: new Date(),
      level: 'INFO',
      message: `Added ${newUserType} user: ${newUserEmail}`,
      user: user.name
    }, ...prev]);

    setNewUserEmail('');
  };

  const removeUser = (email, type) => {
    if (type === 'beta') {
      setBetaUsers(betaUsers.filter(u => u !== email));
      const index = APP_CONFIG.BETA_USERS.indexOf(email);
      if (index > -1) APP_CONFIG.BETA_USERS.splice(index, 1);
    } else {
      if (masterUsers.length <= 1) {
        alert('Cannot remove the last master user');
        return;
      }
      setMasterUsers(masterUsers.filter(u => u !== email));
      const index = APP_CONFIG.MASTER_USERS.indexOf(email);
      if (index > -1) APP_CONFIG.MASTER_USERS.splice(index, 1);
    }

    // Add log entry
    setLogs(prev => [{
      id: Date.now(),
      timestamp: new Date(),
      level: 'WARNING',
      message: `Removed ${type} user: ${email}`,
      user: user.name
    }, ...prev]);
  };

  const exportLogs = () => {
    const logData = logs.map(log => 
      `${log.timestamp.toISOString()} [${log.level}] ${log.message} (by ${log.user})`
    ).join('\n');
    
    const blob = new Blob([logData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `warp-video-logs-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    setLogs([{
      id: Date.now(),
      timestamp: new Date(),
      level: 'INFO',
      message: 'Logs cleared by admin',
      user: user.name
    }]);
  };

  if (!user?.isMaster) {
    return (
      <div className="admin-panel">
        <div className="admin-container">
          <div className="access-denied">
            <h2>❌ Access Denied</h2>
            <p>You don't have administrator privileges to access this panel.</p>
            <button onClick={onBackToLanding} className="back-btn">
              Back to Landing
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-container">
        <div className="admin-header">
          <div className="header-info">
            <h1>⚙️ Admin Panel</h1>
            <p>System Administration & User Management</p>
          </div>
          <button onClick={onBackToLanding} className="back-btn">
            ← Back to Landing
          </button>
        </div>

        <div className="admin-grid">
          {/* System Statistics */}
          <div className="admin-section stats-section">
            <h3>📊 System Statistics</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{systemStats.totalUsers}</div>
                <div className="stat-label">Total Users</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{systemStats.activeSessions}</div>
                <div className="stat-label">Active Sessions</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{systemStats.totalRooms}</div>
                <div className="stat-label">Active Rooms</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{systemStats.serverUptime}</div>
                <div className="stat-label">Server Uptime</div>
              </div>
            </div>
          </div>

          {/* User Management */}
          <div className="admin-section user-management">
            <h3>👥 User Management</h3>
            
            <div className="add-user-form">
              <h4>Add New User</h4>
              <div className="form-group">
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="email-input"
                />
                <select
                  value={newUserType}
                  onChange={(e) => setNewUserType(e.target.value)}
                  className="user-type-select"
                >
                  <option value="beta">Beta User</option>
                  <option value="master">Master User</option>
                </select>
                <button onClick={addUser} className="add-btn">
                  Add User
                </button>
              </div>
            </div>

            <div className="user-lists">
              <div className="user-list">
                <h4>Master Users ({masterUsers.length})</h4>
                <div className="users">
                  {masterUsers.map(email => (
                    <div key={email} className="user-item master">
                      <span className="user-email">{email}</span>
                      <button
                        onClick={() => removeUser(email, 'master')}
                        className="remove-btn"
                        disabled={masterUsers.length <= 1}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="user-list">
                <h4>Beta Users ({betaUsers.length})</h4>
                <div className="users">
                  {betaUsers.map(email => (
                    <div key={email} className="user-item beta">
                      <span className="user-email">{email}</span>
                      <button
                        onClick={() => removeUser(email, 'beta')}
                        className="remove-btn"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Monitoring & Logs */}
          <div className="admin-section logs-section">
            <h3>📋 System Logs & Monitoring</h3>
            
            <div className="logs-controls">
              <button onClick={exportLogs} className="export-btn">
                📤 Export Logs
              </button>
              <button onClick={clearLogs} className="clear-btn">
                🗑️ Clear Logs
              </button>
            </div>

            <div className="logs-container">
              {logs.slice(0, 20).map(log => (
                <div key={log.id} className={`log-entry ${log.level.toLowerCase()}`}>
                  <span className="log-timestamp">
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                  <span className="log-level">{log.level}</span>
                  <span className="log-message">{log.message}</span>
                  <span className="log-user">by {log.user}</span>
                </div>
              ))}
            </div>
          </div>

          {/* System Health */}
          <div className="admin-section health-section">
            <h3>💚 System Health</h3>
            <div className="health-indicators">
              <div className="health-item">
                <div className="health-indicator online"></div>
                <span>WebSocket Server</span>
              </div>
              <div className="health-item">
                <div className="health-indicator online"></div>
                <span>Video Processing</span>
              </div>
              <div className="health-item">
                <div className="health-indicator online"></div>
                <span>Authentication</span>
              </div>
              <div className="health-item">
                <div className="health-indicator warning"></div>
                <span>Storage (Demo Mode)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
