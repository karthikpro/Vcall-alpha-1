import React, { useState, useEffect } from 'react';
import './App.css';
import LandingPage from './components/LandingPage';
import SetupPage from './components/SetupPage';
import VideoCallPage from './components/VideoCallPage';
import AdminPanel from './components/AdminPanel';
import WebSocketService from './services/WebSocketService';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('landing');
  const [currentRoom, setCurrentRoom] = useState(null);
  const [wsService, setWsService] = useState(null);

  useEffect(() => {
    const ws = new WebSocketService();
    setWsService(ws);

    return () => {
      ws.disconnect();
    };
  }, []);

  const navigateToSetup = () => {
    setCurrentPage('setup');
  };

  const navigateToVideoCall = (room) => {
    setCurrentRoom(room);
    setCurrentPage('videocall');
  };

  const navigateToLanding = () => {
    setCurrentPage('landing');
    setCurrentRoom(null);
  };

  const navigateToAdmin = () => {
    setCurrentPage('admin');
  };

  if (loading) {
    return (
      <div className="App loading">
        <div className="loading-container">
          <h2>🔄 Loading...</h2>
          <p>Please wait while we initialize the application</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="App">
        <LandingPage onSetupNewCall={navigateToSetup} onAdminPanel={navigateToAdmin} />
      </div>
    );
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onSetupNewCall={navigateToSetup} onAdminPanel={navigateToAdmin} />;
      case 'setup':
        return (
          <SetupPage
            wsService={wsService}
            onRoomJoined={navigateToVideoCall}
            onBackToLanding={navigateToLanding}
          />
        );
      case 'videocall':
        return (
          <VideoCallPage
            wsService={wsService}
            room={currentRoom}
            onLeaveRoom={navigateToLanding}
          />
        );
      case 'admin':
        return (
          <AdminPanel
            onBackToLanding={navigateToLanding}
          />
        );
      default:
        return <LandingPage onSetupNewCall={navigateToSetup} onAdminPanel={navigateToAdmin} />;
    }
  };

  return (
    <div className="App">
      {renderCurrentPage()}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
