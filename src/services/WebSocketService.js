class WebSocketService {
  constructor() {
    this.ws = null;
    this.clientId = null;
    this.listeners = new Map();
    this.connect();
  }

  connect() {
    this.ws = new WebSocket('ws://localhost:8080');
    
    this.ws.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket connection closed');
      // Attempt to reconnect after 3 seconds
      setTimeout(() => this.connect(), 3000);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  handleMessage(message) {
    if (message.type === 'connected') {
      this.clientId = message.clientId;
    }

    // Notify listeners
    const listeners = this.listeners.get(message.type);
    if (listeners) {
      listeners.forEach(callback => callback(message));
    }
  }

  addListener(messageType, callback) {
    if (!this.listeners.has(messageType)) {
      this.listeners.set(messageType, []);
    }
    this.listeners.get(messageType).push(callback);
  }

  removeListener(messageType, callback) {
    const listeners = this.listeners.get(messageType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  createRoom(roomName) {
    this.sendMessage({
      type: 'create-room',
      roomName: roomName
    });
  }

  joinRoom(passkey) {
    this.sendMessage({
      type: 'join-room',
      passkey: passkey
    });
  }

  leaveRoom(roomId) {
    this.sendMessage({
      type: 'leave-room',
      roomId: roomId
    });
  }

  getRooms() {
    this.sendMessage({
      type: 'get-rooms'
    });
  }

  sendWebRTCOffer(roomId, offer, to = null) {
    this.sendMessage({
      type: 'webrtc-offer',
      roomId: roomId,
      offer: offer,
      to: to
    });
  }

  sendWebRTCAnswer(answer, to) {
    this.sendMessage({
      type: 'webrtc-answer',
      answer: answer,
      to: to
    });
  }

  sendICECandidate(roomId, candidate, to = null) {
    this.sendMessage({
      type: 'ice-candidate',
      roomId: roomId,
      candidate: candidate,
      to: to
    });
  }

  sendChatMessage(roomId, message) {
    this.sendMessage({
      type: 'chat-message',
      roomId: roomId,
      message: message
    });
  }

  sendMediaState(roomId, mediaState) {
    this.sendMessage({
      type: 'media-state',
      roomId: roomId,
      mediaState: mediaState
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }

  getClientId() {
    return this.clientId;
  }
}

export default WebSocketService;
