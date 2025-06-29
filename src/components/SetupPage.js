import React, { useState } from 'react';
import './SetupPage.css';

function SetupPage({ wsService, onRoomJoined, onBackToLanding }) {
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const generateRoomId = () => {
    const randomId = Math.random().toString(36).substr(2, 9);
    setRoomId(randomId);
  };

  const handleJoinRoom = async () => {
    if (!roomId.trim() || !userName.trim()) {
      setError('Please enter both room ID and your name');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      if (wsService) {
        await wsService.joinRoom(roomId, userName);
        onRoomJoined({ id: roomId, userName });
      }
    } catch (err) {
      setError('Failed to join room. Please try again.');
      setIsJoining(false);
    }
  };

  return (
    <div className="setup-page">
      <div className="setup-container">
        <div className="setup-header">
          <button className="back-btn" onClick={onBackToLanding}>
            ← Back
          </button>
          <h2>Setup Video Call</h2>
        </div>

        <div className="setup-form">
          <div className="form-group">
            <label htmlFor="userName">Your Name</label>
            <input
              id="userName"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              disabled={isJoining}
            />
          </div>

          <div className="form-group">
            <label htmlFor="roomId">Room ID</label>
            <div className="room-id-input">
              <input
                id="roomId"
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room ID or generate one"
                disabled={isJoining}
              />
              <button 
                className="generate-btn"
                onClick={generateRoomId}
                disabled={isJoining}
              >
                Generate
              </button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            className="join-btn"
            onClick={handleJoinRoom}
            disabled={isJoining || !roomId.trim() || !userName.trim()}
          >
            {isJoining ? 'Joining...' : 'Join Room'}
          </button>
        </div>

        <div className="setup-info">
          <h3>How it works:</h3>
          <ul>
            <li>Enter your name and either create a new room or join an existing one</li>
            <li>Share the room ID with others to invite them</li>
            <li>All video calls are encrypted end-to-end</li>
            <li>No data is stored on our servers</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default SetupPage;
