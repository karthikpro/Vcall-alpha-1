import React, { useState } from 'react';
import './LandingPage.css';
import { useAuth } from '../contexts/AuthContext';
import { APP_CONFIG } from '../config/appConfig';

function LandingPage({ onSetupNewCall, onAdminPanel }) {
  const { user, logout } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showGoogleSignIn, setShowGoogleSignIn] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setError('');
    
    try {
      // In production, implement actual Google OAuth
      if (!APP_CONFIG.IS_DEVELOPMENT) {
        // TODO: Implement real Google OAuth flow
        window.location.href = `https://accounts.google.com/oauth/authorize?client_id=${APP_CONFIG.GOOGLE_CLIENT_ID}&redirect_uri=${window.location.origin}/auth/callback&response_type=code&scope=openid%20email%20profile`;
        return;
      }
      
      // Development mode - show demo options
      if (APP_CONFIG.FEATURES.DEMO_LOGIN) {
        setShowGoogleSignIn(true);
      } else {
        throw new Error('Demo login is disabled. Please configure proper OAuth.');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSigningIn(false);
    }
  };

  const { login } = useAuth();
  
  const simulateGoogleLogin = async (email, name) => {
    if (!APP_CONFIG.FEATURES.DEMO_LOGIN) {
      setError('Demo login is not available in production.');
      return;
    }
    
    setIsSigningIn(true);
    setError('');
    
    try {
      await login({
        email,
        name,
        picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
        provider: 'google'
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSigningIn(false);
    }
  };

  if (!user) {
    return (
      <div className="landing-page">
        <div className="landing-container">
          <div className="logo-section">
            <h1 className="app-title">🎥 {APP_CONFIG.APP_NAME}</h1>
            <p className="app-subtitle">Secure, encrypted video calling made simple</p>
            <div className="version-badge">v{APP_CONFIG.VERSION}</div>
          </div>
          
          <div className="auth-section">
            <h2>Sign in to continue</h2>
            <p className="auth-description">Please authenticate with your Google account to access the application</p>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            {!showGoogleSignIn ? (
              <button 
                className="google-signin-btn" 
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
              >
                <span className="google-icon">🔐</span>
                {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
              </button>
            ) : (
              APP_CONFIG.FEATURES.DEMO_LOGIN && (
                <div className="demo-login">
                  <p>Demo Login Options (Development Only):</p>
                  <button 
                    className="demo-btn master"
                    onClick={() => simulateGoogleLogin('admin@company.com', 'Admin User')}
                    disabled={isSigningIn}
                  >
                    {isSigningIn ? 'Signing in...' : 'Login as Master User'}
                  </button>
                  <button 
                    className="demo-btn beta"
                    onClick={() => simulateGoogleLogin('beta1@company.com', 'Beta User')}
                    disabled={isSigningIn}
                  >
                    {isSigningIn ? 'Signing in...' : 'Login as Beta User'}
                  </button>
                  <button 
                    className="demo-btn unauthorized"
                    onClick={() => simulateGoogleLogin('unauthorized@example.com', 'Unauthorized User')}
                    disabled={isSigningIn}
                  >
                    {isSigningIn ? 'Signing in...' : 'Try Unauthorized User'}
                  </button>
                </div>
              )
            )}
          </div>
          
          <div className="features-section">
            <div className="feature">
              <div className="feature-icon">🔒</div>
              <h3>End-to-End Encrypted</h3>
              <p>Your conversations are completely private and secure</p>
            </div>
            
            <div className="feature">
              <div className="feature-icon">🚀</div>
              <h3>No Third-Party Dependencies</h3>
              <p>Direct peer-to-peer connections for maximum privacy</p>
            </div>
            
            <div className="feature">
              <div className="feature-icon">💬</div>
              <h3>Video + Chat</h3>
              <p>High-quality video calls with integrated messaging</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      <div className="landing-container">
        <div className="header-section">
          <div className="logo-section">
            <h1 className="app-title">🎥 {APP_CONFIG.APP_NAME}</h1>
            <p className="app-subtitle">Secure, encrypted video calling made simple</p>
            <div className="version-badge">v{APP_CONFIG.VERSION}</div>
          </div>
          
          <div className="user-section">
            <div className="user-info">
              <img src={user.picture} alt={user.name} className="user-avatar" />
              <div className="user-details">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role} user</span>
              </div>
            </div>
            <button className="logout-btn" onClick={logout}>Logout</button>
          </div>
        </div>
        
        <div className="features-section">
          <div className="feature">
            <div className="feature-icon">🔒</div>
            <h3>End-to-End Encrypted</h3>
            <p>Your conversations are completely private and secure</p>
          </div>
          
          <div className="feature">
            <div className="feature-icon">🚀</div>
            <h3>No Third-Party Dependencies</h3>
            <p>Direct peer-to-peer connections for maximum privacy</p>
          </div>
          
          <div className="feature">
            <div className="feature-icon">💬</div>
            <h3>Video + Chat</h3>
            <p>High-quality video calls with integrated messaging</p>
          </div>
        </div>
        
        <div className="action-section">
          <div className="main-actions">
            <button 
              className="setup-call-btn primary"
              onClick={onSetupNewCall}
            >
              🎥 Start Video Call
            </button>
            
            {user.isMaster && (
              <button 
                className="admin-panel-btn secondary"
                onClick={onAdminPanel}
              >
                ⚙️ Admin Panel
              </button>
            )}
          </div>
          
          <div className="user-stats">
            <div className="stat">
              <span className="stat-label">Access Level:</span>
              <span className="stat-value">{user.role.toUpperCase()}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Login Time:</span>
              <span className="stat-value">{new Date(user.loginTime).toLocaleTimeString()}</span>
            </div>
          </div>
          
          <p className="getting-started">
            Welcome back! Click "Start Video Call" to create or join a room
          </p>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
