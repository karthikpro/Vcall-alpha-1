// Application Configuration
export const APP_CONFIG = {
  // Google OAuth Configuration
  GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-google-client-id',
  
  // Development mode flag
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  
  // Auth configuration - moved to environment variables for security
  AUTH_BACKEND_URL: process.env.REACT_APP_AUTH_BACKEND_URL || 'http://localhost:3001/api/auth',
  
  // Application Settings
  APP_NAME: 'Warp Video Calling',
  VERSION: '2.0.0',
  
  // Feature Flags
  FEATURES: {
    ADMIN_PANEL: true,
    DEBUG_MODE: process.env.NODE_ENV === 'development',
    MONITORING: true,
    SCREEN_SHARE: true,
    RECORDING: true,
    VIRTUAL_BACKGROUNDS: true,
    DEMO_LOGIN: process.env.NODE_ENV === 'development' // Only allow demo login in development
  },
  
  // WebRTC Configuration
  WEBRTC: {
    // ICE servers should come from environment or be fetched from backend
    ICE_SERVERS: [
      { urls: 'stun:stun.l.google.com:19302' },
      // TURN servers should be configured via environment variables
      ...(process.env.REACT_APP_TURN_SERVER ? [{
        urls: process.env.REACT_APP_TURN_SERVER,
        username: process.env.REACT_APP_TURN_USERNAME,
        credential: process.env.REACT_APP_TURN_CREDENTIAL
      }] : [])
    ]
  },
  
  // API Endpoints
  API: {
    SERVER_URL: process.env.REACT_APP_SERVER_URL || 'http//localhost:8080',
    AUTH_ENDPOINT: '/api/auth',
    USERS_ENDPOINT: '/api/users',
    VALIDATE_ENDPOINT: '/api/validate'
  },

  // User Management - Default users for development
  // In production, these should be managed via backend database
  BETA_USERS: [
    'beta1@company.com'
  ],
  
  MASTER_USERS: [
    'admin@company.com'
  ]
};

// Secure authentication service
export class AuthService {
  static async validateUser(email) {
    try {
      const response = await fetch(`${APP_CONFIG.AUTH_BACKEND_URL}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) {
        throw new Error('Authentication failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Auth validation error:', error);
      return { hasAccess: false, role: null };
    }
  }
  
  static async getUserRole(email) {
    const validation = await this.validateUser(email);
    return validation.role || null;
  }
}

// Legacy functions for backward compatibility - now use secure backend validation
export const getUserRole = async (email) => {
  // In production, always validate via backend
  if (!APP_CONFIG.IS_DEVELOPMENT) {
    return await AuthService.getUserRole(email);
  }
  
  // Development-only demo users (for testing purposes)
  if (APP_CONFIG.FEATURES.DEMO_LOGIN) {
    const demoUsers = {
      'admin@company.com': 'master',
      'beta1@company.com': 'beta'
    };
    return demoUsers[email] || null;
  }
  
  return null;
};

// Check if user has access
export const hasAccess = async (email) => {
  if (!APP_CONFIG.IS_DEVELOPMENT) {
    const validation = await AuthService.validateUser(email);
    return validation.hasAccess;
  }
  
  // Development mode with demo users
  if (APP_CONFIG.FEATURES.DEMO_LOGIN) {
    const role = await getUserRole(email);
    return role !== null;
  }
  
  return false;
};

// Check if user is master
export const isMasterUser = async (email) => {
  const role = await getUserRole(email);
  return role === 'master';
};
