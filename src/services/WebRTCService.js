import { APP_CONFIG } from '../config/appConfig';

class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.dataChannel = null;
    this.iceGatheringComplete = false;
    this.onRemoteStreamCallback = null;
    this.onDataChannelMessageCallback = null;
    this.onConnectionStateChangeCallback = null;
  }

  async initializePeerConnection() {
    try {
      // Get ICE servers securely - never hardcode in client
      const iceServers = await this.getICEServers();
      
      const configuration = {
        iceServers: iceServers,
        iceCandidatePoolSize: 10,
        // Security configurations
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
        iceTransportPolicy: 'all' // In production, consider 'relay' for maximum security
      };

      this.peerConnection = new RTCPeerConnection(configuration);
      
      // Set up event handlers
      this.setupPeerConnectionHandlers();
      
      return this.peerConnection;
    } catch (error) {
      console.error('Failed to initialize peer connection:', error);
      throw error;
    }
  }

  async getICEServers() {
    try {
      // In production, fetch ICE servers from your backend for security
      if (!APP_CONFIG.IS_DEVELOPMENT) {
        const response = await fetch(`${APP_CONFIG.AUTH_BACKEND_URL}/ice-servers`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.iceServers;
        }
      }
      
      // Fallback to configured ICE servers (development only)
      return APP_CONFIG.WEBRTC.ICE_SERVERS;
    } catch (error) {
      console.error('Failed to fetch ICE servers:', error);
      // Fallback to basic STUN server
      return [{ urls: 'stun:stun.l.google.com:19302' }];
    }
  }

  getAuthToken() {
    // Get JWT token from localStorage or wherever you store it
    const userData = localStorage.getItem('warp_user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.token; // Assuming token is stored in user object
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
    return null;
  }

  setupPeerConnectionHandlers() {
    if (!this.peerConnection) return;

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      this.remoteStream = remoteStream;
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(remoteStream);
      }
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.onICECandidate(event.candidate);
      } else {
        this.iceGatheringComplete = true;
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection.connectionState;
      console.log('Connection state:', state);
      
      if (this.onConnectionStateChangeCallback) {
        this.onConnectionStateChangeCallback(state);
      }
      
      // Handle connection failures
      if (state === 'failed' || state === 'disconnected') {
        this.handleConnectionFailure();
      }
    };

    // Handle ICE connection state changes
    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection.iceConnectionState;
      console.log('ICE connection state:', state);
    };

    // Handle data channel
    this.peerConnection.ondatachannel = (event) => {
      const channel = event.channel;
      this.setupDataChannel(channel);
    };
  }

  setupDataChannel(channel) {
    this.dataChannel = channel;
    
    channel.onopen = () => {
      console.log('Data channel opened');
    };
    
    channel.onmessage = (event) => {
      if (this.onDataChannelMessageCallback) {
        this.onDataChannelMessageCallback(event.data);
      }
    };
    
    channel.onclose = () => {
      console.log('Data channel closed');
    };
  }

  async createDataChannel(label = 'chat') {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }
    
    this.dataChannel = this.peerConnection.createDataChannel(label, {
      ordered: true
    });
    
    this.setupDataChannel(this.dataChannel);
    return this.dataChannel;
  }

  async addLocalStream(stream) {
    if (!this.peerConnection) {
      await this.initializePeerConnection();
    }
    
    this.localStream = stream;
    
    // Add tracks to peer connection
    stream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, stream);
    });
  }

  async createOffer() {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }
    
    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
    
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(offer) {
    if (!this.peerConnection) {
      await this.initializePeerConnection();
    }
    
    await this.peerConnection.setRemoteDescription(offer);
    
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    
    return answer;
  }

  async handleAnswer(answer) {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }
    
    await this.peerConnection.setRemoteDescription(answer);
  }

  async addICECandidate(candidate) {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }
    
    try {
      await this.peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error('Failed to add ICE candidate:', error);
    }
  }

  handleConnectionFailure() {
    console.warn('WebRTC connection failed, attempting to reconnect...');
    // Implement reconnection logic here
    // For now, just log the failure
  }

  sendDataChannelMessage(message) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(message);
    } else {
      console.warn('Data channel not available for sending message');
    }
  }

  // Event handler setters
  setOnRemoteStream(callback) {
    this.onRemoteStreamCallback = callback;
  }

  setOnDataChannelMessage(callback) {
    this.onDataChannelMessageCallback = callback;
  }

  setOnConnectionStateChange(callback) {
    this.onConnectionStateChangeCallback = callback;
  }

  setOnICECandidate(callback) {
    this.onICECandidate = callback;
  }

  close() {
    if (this.dataChannel) {
      this.dataChannel.close();
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    
    // Reset state
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.dataChannel = null;
    this.iceGatheringComplete = false;
  }

  getConnectionStats() {
    if (!this.peerConnection) {
      return null;
    }
    
    return this.peerConnection.getStats();
  }
}

export default WebRTCService;
