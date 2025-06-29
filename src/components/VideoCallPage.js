import React, { useState, useEffect, useRef } from 'react';
import './VideoCallPage.css';
import { useAuth } from '../contexts/AuthContext';
import { APP_CONFIG } from '../config/appConfig';
import WebRTCService from '../services/WebRTCService';

function VideoCallPage({ wsService, room, onLeaveRoom }) {
  const { user } = useAuth();
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState('excellent');
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [backgroundFilter, setBackgroundFilter] = useState('none');
  const [isRecording, setIsRecording] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const webRTCService = useRef(null);
  const callStartTime = useRef(Date.now());
  const originalVideoTrack = useRef(null);
  const screenShareRef = useRef(null);

  useEffect(() => {
    initializeMedia();
    
    // Call duration timer
    const timer = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000));
    }, 1000);
    
    // Simulate connection quality monitoring
    const qualityMonitor = setInterval(() => {
      const qualities = ['excellent', 'good', 'fair', 'poor'];
      const randomIndex = Math.floor(Math.random() * qualities.length);
      setConnectionQuality(qualities[randomIndex]);
    }, 10000);
    
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      clearInterval(timer);
      clearInterval(qualityMonitor);
    };
  }, []);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsConnected(true);
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        screenShareRef.current = screenStream;
        setIsScreenSharing(true);
        
        // In a real app, you'd replace video track in peer connection
        console.log('Screen sharing started');
      } else {
        if (screenShareRef.current) {
          screenShareRef.current.getTracks().forEach(track => track.stop());
          screenShareRef.current = null;
        }
        setIsScreenSharing(false);
        console.log('Screen sharing stopped');
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      alert('Screen sharing not supported or permission denied');
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      // Start recording simulation
      setIsRecording(true);
      console.log('Recording started');
      // In a real app, you'd start MediaRecorder
    } else {
      setIsRecording(false);
      console.log('Recording stopped');
      // In a real app, you'd stop MediaRecorder and save file
    }
  };

  const applyBackgroundFilter = (filter) => {
    setBackgroundFilter(filter);
    // In a real app, you'd apply the filter to the video stream
    console.log(`Background filter applied: ${filter}`);
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const sendChatMessage = () => {
    if (chatInput.trim() && wsService) {
      const message = {
        id: Date.now(),
        sender: room.userName,
        text: chatInput.trim(),
        timestamp: new Date().toLocaleTimeString()
      };
      
      setChatMessages(prev => [...prev, message]);
      setChatInput('');
      
      // Here you would send the message via WebSocket
      // wsService.sendChatMessage(message);
    }
  };

  const handleLeaveRoom = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    onLeaveRoom();
  };

  return (
    <div className="videocall-page">
      {/* Top Header Bar */}
      <div className="videocall-header">
        <div className="header-left">
          <div className="room-info">
            <h3>{room.name || `Room ${room.id.slice(0, 8)}`}</h3>
            <div className="call-stats">
              <span className={`connection-status ${connectionQuality}`}>
                {connectionQuality === 'excellent' && '🟢'}
                {connectionQuality === 'good' && '🟡'}
                {connectionQuality === 'fair' && '🟠'}
                {connectionQuality === 'poor' && '🔴'}
                {connectionQuality}
              </span>
              <span className="call-duration">⏱️ {formatDuration(callDuration)}</span>
              {isRecording && <span className="recording-indicator">🔴 REC</span>}
            </div>
          </div>
        </div>
        
        <div className="header-right">
          <button 
            className="header-btn"
            onClick={() => setShowParticipants(!showParticipants)}
            title="Participants"
          >
            👥 {participants.length + 1}
          </button>
          
          <button 
            className="header-btn"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            ⚙️
          </button>
          
          <button className="leave-btn" onClick={handleLeaveRoom}>
            📞 Leave
          </button>
        </div>
      </div>

      <div className="video-container">
        <div className="video-grid">
          <div className="video-wrapper local-video">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`video ${!isVideoEnabled ? 'video-disabled' : ''}`}
            />
            <div className="video-label">You ({room.userName})</div>
            {!isVideoEnabled && <div className="video-placeholder">📷</div>}
          </div>
          
          <div className="video-wrapper remote-video">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="video"
            />
            <div className="video-label">
              {participants.length > 0 ? participants[0].name : 'Waiting for others...'}
            </div>
            {participants.length === 0 && (
              <div className="video-placeholder">
                <div className="waiting-message">
                  <div className="waiting-icon">👥</div>
                  <p>Share the room ID to invite others:</p>
                  <div className="room-id-share">{room.id}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Controls Bar */}
        <div className="controls">
          <div className="control-group">
            <button 
              className={`control-btn ${!isAudioEnabled ? 'disabled' : ''}`}
              onClick={toggleAudio}
              title={isAudioEnabled ? 'Mute' : 'Unmute'}
            >
              {isAudioEnabled ? '🎤' : '🔇'}
            </button>
            
            <button 
              className={`control-btn ${!isVideoEnabled ? 'disabled' : ''}`}
              onClick={toggleVideo}
              title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {isVideoEnabled ? '📹' : '📷'}
            </button>
          </div>
          
          <div className="control-group">
            {APP_CONFIG.FEATURES.SCREEN_SHARE && (
              <button 
                className={`control-btn ${isScreenSharing ? 'active' : ''}`}
                onClick={toggleScreenShare}
                title="Share screen"
              >
                🖥️
              </button>
            )}
            
            {APP_CONFIG.FEATURES.RECORDING && (
              <button 
                className={`control-btn ${isRecording ? 'active recording' : ''}`}
                onClick={toggleRecording}
                title={isRecording ? 'Stop recording' : 'Start recording'}
              >
                ⏺️
              </button>
            )}
            
            <button 
              className={`control-btn ${showChat ? 'active' : ''}`}
              onClick={() => setShowChat(!showChat)}
              title="Chat"
            >
              💬 {chatMessages.length > 0 && <span className="notification-badge">{chatMessages.length}</span>}
            </button>
          </div>
          
          <div className="control-group">
            <button 
              className="control-btn danger"
              onClick={handleLeaveRoom}
              title="End call"
            >
              📞
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Chat Panel */}
      {showChat && (
        <div className="chat-panel">
          <div className="chat-header">
            <h4>💬 Chat</h4>
            <button onClick={() => setShowChat(false)} className="close-btn">×</button>
          </div>
          
          <div className="chat-messages">
            {chatMessages.length === 0 ? (
              <div className="no-messages">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              chatMessages.map(message => (
                <div key={message.id} className={`chat-message ${message.sender === user.name ? 'own-message' : ''}`}>
                  <div className="message-header">
                    <span className="sender">{message.sender}</span>
                    <span className="timestamp">{message.timestamp}</span>
                  </div>
                  <div className="message-text">{message.text}</div>
                </div>
              ))
            )}
          </div>
          
          <div className="chat-input">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message..."
              onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
            />
            <button onClick={sendChatMessage} disabled={!chatInput.trim()}>Send</button>
          </div>
        </div>
      )}
      
      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-panel">
          <div className="settings-header">
            <h4>⚙️ Settings</h4>
            <button onClick={() => setShowSettings(false)} className="close-btn">×</button>
          </div>
          
          <div className="settings-content">
            {APP_CONFIG.FEATURES.VIRTUAL_BACKGROUNDS && (
              <div className="setting-group">
                <h5>🖼️ Virtual Backgrounds</h5>
                <div className="background-options">
                  <button 
                    className={`bg-option ${backgroundFilter === 'none' ? 'active' : ''}`}
                    onClick={() => applyBackgroundFilter('none')}
                  >
                    None
                  </button>
                  <button 
                    className={`bg-option ${backgroundFilter === 'blur' ? 'active' : ''}`}
                    onClick={() => applyBackgroundFilter('blur')}
                  >
                    Blur
                  </button>
                  <button 
                    className={`bg-option ${backgroundFilter === 'office' ? 'active' : ''}`}
                    onClick={() => applyBackgroundFilter('office')}
                  >
                    Office
                  </button>
                  <button 
                    className={`bg-option ${backgroundFilter === 'nature' ? 'active' : ''}`}
                    onClick={() => applyBackgroundFilter('nature')}
                  >
                    Nature
                  </button>
                </div>
              </div>
            )}
            
            <div className="setting-group">
              <h5>📊 Debug Info</h5>
              <div className="debug-info">
                <div className="debug-item">
                  <span>Connection Quality:</span>
                  <span className={`quality-indicator ${connectionQuality}`}>{connectionQuality}</span>
                </div>
                <div className="debug-item">
                  <span>Call Duration:</span>
                  <span>{formatDuration(callDuration)}</span>
                </div>
                <div className="debug-item">
                  <span>User Role:</span>
                  <span>{user.role.toUpperCase()}</span>
                </div>
                <div className="debug-item">
                  <span>Room ID:</span>
                  <span>{room.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Participants Panel */}
      {showParticipants && (
        <div className="participants-panel">
          <div className="participants-header">
            <h4>👥 Participants ({participants.length + 1})</h4>
            <button onClick={() => setShowParticipants(false)} className="close-btn">×</button>
          </div>
          
          <div className="participants-list">
            <div className="participant-item you">
              <img src={user.picture} alt={user.name} className="participant-avatar" />
              <div className="participant-info">
                <span className="participant-name">{user.name} (You)</span>
                <span className="participant-status">
                  {isAudioEnabled ? '🎤' : '🔇'} {isVideoEnabled ? '📹' : '📷'}
                </span>
              </div>
            </div>
            
            {participants.map(participant => (
              <div key={participant.id} className="participant-item">
                <div className="participant-avatar">{participant.name.charAt(0)}</div>
                <div className="participant-info">
                  <span className="participant-name">{participant.name}</span>
                  <span className="participant-status">🎤 📹</span>
                </div>
              </div>
            ))}
            
            {participants.length === 0 && (
              <div className="no-participants">
                <p>No other participants yet</p>
                <p>Share the room link to invite others</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoCallPage;
