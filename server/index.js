const WebSocket = require('ws');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

// Server statistics and monitoring
const serverStats = {
  startTime: Date.now(),
  totalConnections: 0,
  totalRoomsCreated: 0,
  totalMessagesExchanged: 0
};

// User authentication and logging
const authenticatedUsers = new Map();
const serverLogs = [];

// Helper function to log events
function logEvent(level, message, user = 'System') {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    user
  };
  serverLogs.push(logEntry);
  
  // Keep only last 1000 log entries
  if (serverLogs.length > 1000) {
    serverLogs.shift();
  }
  
  console.log(`[${logEntry.timestamp}] [${level}] ${message} (by ${user})`);
}

// Store rooms and their participants
const rooms = new Map();
const clients = new Map();

// Generate unique 8-digit passkey
function generatePasskey() {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

// Generate unique room ID
function generateRoomId() {
  return crypto.randomBytes(16).toString('hex');
}

// Custom STUN server implementation (simplified)
function handleICECandidate(clientId, message) {
  // The server should just relay the candidate, not generate its own.
  // const candidate = generateICECandidate(); // REMOVE THIS LINE

  if (message.to) {
    const targetClient = clients.get(message.to);
    if (targetClient) {
      targetClient.ws.send(JSON.stringify({
        type: 'ice-candidate',
        candidate: message.candidate, // Use the candidate from the message
        from: clientId
      }));
    }
  } else {
    broadcastToRoom(message.roomId, {
      type: 'ice-candidate',
      candidate: message.candidate, // Use the candidate from the message
      from: clientId
    }, clientId);
  }
}

wss.on('connection', (ws, req) => {
  const clientId = crypto.randomBytes(16).toString('hex');
  clients.set(clientId, { ws, rooms: new Set(), connectedAt: Date.now() });
  
  serverStats.totalConnections++;
  logEvent('INFO', `Client ${clientId} connected`, 'System');
  
  // Send server info
  ws.send(JSON.stringify({
    type: 'server-info',
    serverStats: {
      uptime: Date.now() - serverStats.startTime,
      totalConnections: serverStats.totalConnections,
      activeConnections: clients.size,
      totalRooms: rooms.size,
      totalRoomsCreated: serverStats.totalRoomsCreated,
      totalMessages: serverStats.totalMessagesExchanged
    }
  }));

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      handleMessage(clientId, message);
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    const client = clients.get(clientId);
    const sessionDuration = client ? Date.now() - client.connectedAt : 0;
    logEvent('INFO', `Client ${clientId} disconnected after ${Math.floor(sessionDuration / 1000)}s`, 'System');
    handleClientDisconnect(clientId);
  });

  // Send initial connection confirmation
  ws.send(JSON.stringify({
    type: 'connected',
    clientId: clientId
  }));
});

function handleMessage(clientId, message) {
  const client = clients.get(clientId);
  if (!client) return;

  switch (message.type) {
    case 'create-room':
      handleCreateRoom(clientId, message);
      break;
    case 'join-room':
      handleJoinRoom(clientId, message);
      break;
    case 'leave-room':
      handleLeaveRoom(clientId, message);
      break;
    case 'get-rooms':
      handleGetRooms(clientId);
      break;
    case 'webrtc-offer':
      handleWebRTCOffer(clientId, message);
      break;
    case 'webrtc-answer':
      handleWebRTCAnswer(clientId, message);
      break;
    case 'ice-candidate':
      handleICECandidate(clientId, message);
      break;
    case 'chat-message':
      handleChatMessage(clientId, message);
      break;
    case 'media-state':
      handleMediaState(clientId, message);
      break;
    case 'authenticate':
      handleAuthentication(clientId, message);
      break;
    case 'get-server-stats':
      handleGetServerStats(clientId);
      break;
    case 'get-logs':
      handleGetLogs(clientId, message);
      break;
  }
}

function handleCreateRoom(clientId, message) {
  const roomId = generateRoomId();
  const passkey = generatePasskey();
  const client = clients.get(clientId);
  
  const room = {
    id: roomId,
    name: message.roomName,
    passkey: passkey,
    participants: new Map(),
    createdAt: new Date(),
    messages: []
  };
  
  rooms.set(roomId, room);
  
  // Add client to room
  room.participants.set(clientId, {
    id: clientId,
    isCreator: true,
    mediaState: { video: true, audio: true },
    joinedAt: new Date()
  });
  
  client.rooms.add(roomId);
  
  client.ws.send(JSON.stringify({
    type: 'room-created',
    room: {
      id: roomId,
      name: room.name,
      passkey: passkey,
      participantCount: room.participants.size
    }
  }));
  
  broadcastRoomList();
}

function handleJoinRoom(clientId, message) {
  const room = Array.from(rooms.values()).find(r => r.passkey === message.passkey);
  
  if (!room) {
    const client = clients.get(clientId);
    client.ws.send(JSON.stringify({
      type: 'join-room-error',
      error: 'Invalid passkey'
    }));
    return;
  }
  
  const client = clients.get(clientId);
  
  // Add client to room
  room.participants.set(clientId, {
    id: clientId,
    isCreator: false,
    mediaState: { video: true, audio: true },
    joinedAt: new Date()
  });
  
  client.rooms.add(room.id);
  
  // Send room info to joining client
  client.ws.send(JSON.stringify({
    type: 'room-joined',
    room: {
      id: room.id,
      name: room.name,
      participantCount: room.participants.size,
      messages: room.messages
    }
  }));
  
  // Notify other participants
  broadcastToRoom(room.id, {
    type: 'participant-joined',
    participantId: clientId,
    participantCount: room.participants.size
  }, clientId);
  
  broadcastRoomList();
}

function handleLeaveRoom(clientId, message) {
  const room = rooms.get(message.roomId);
  if (!room || !room.participants.has(clientId)) return;
  
  room.participants.delete(clientId);
  const client = clients.get(clientId);
  client.rooms.delete(message.roomId);
  
  if (room.participants.size === 0) {
    rooms.delete(message.roomId);
  } else {
    broadcastToRoom(message.roomId, {
      type: 'participant-left',
      participantId: clientId,
      participantCount: room.participants.size
    });
  }
  
  client.ws.send(JSON.stringify({
    type: 'room-left',
    roomId: message.roomId
  }));
  
  broadcastRoomList();
}

function handleGetRooms(clientId) {
  const client = clients.get(clientId);
  const roomList = Array.from(rooms.values()).map(room => ({
    id: room.id,
    name: room.name,
    participantCount: room.participants.size,
    createdAt: room.createdAt
  }));
  
  client.ws.send(JSON.stringify({
    type: 'rooms-list',
    rooms: roomList
  }));
}

function handleWebRTCOffer(clientId, message) {
  broadcastToRoom(message.roomId, {
    type: 'webrtc-offer',
    offer: message.offer,
    from: clientId,
    to: message.to
  }, clientId);
}

function handleWebRTCAnswer(clientId, message) {
  const targetClient = clients.get(message.to);
  if (targetClient) {
    targetClient.ws.send(JSON.stringify({
      type: 'webrtc-answer',
      answer: message.answer,
      from: clientId
    }));
  }
}

function handleICECandidate(clientId, message) {
  // Generate our own ICE candidates
  const candidate = generateICECandidate();
  
  if (message.to) {
    const targetClient = clients.get(message.to);
    if (targetClient) {
      targetClient.ws.send(JSON.stringify({
        type: 'ice-candidate',
        candidate: candidate,
        from: clientId
      }));
    }
  } else {
    broadcastToRoom(message.roomId, {
      type: 'ice-candidate',
      candidate: candidate,
      from: clientId
    }, clientId);
  }
}

function handleChatMessage(clientId, message) {
  const room = rooms.get(message.roomId);
  if (!room || !room.participants.has(clientId)) return;
  
  const chatMessage = {
    id: crypto.randomBytes(8).toString('hex'),
    participantId: clientId,
    message: message.message,
    timestamp: new Date()
  };
  
  room.messages.push(chatMessage);
  
  broadcastToRoom(message.roomId, {
    type: 'chat-message',
    message: chatMessage
  });
}

function handleMediaState(clientId, message) {
  const room = rooms.get(message.roomId);
  if (!room || !room.participants.has(clientId)) return;
  
  const participant = room.participants.get(clientId);
  participant.mediaState = message.mediaState;
  
  broadcastToRoom(message.roomId, {
    type: 'media-state-changed',
    participantId: clientId,
    mediaState: message.mediaState
  }, clientId);
}

function handleClientDisconnect(clientId) {
  const client = clients.get(clientId);
  if (!client) return;
  
  // Remove client from all rooms
  client.rooms.forEach(roomId => {
    const room = rooms.get(roomId);
    if (room) {
      room.participants.delete(clientId);
      if (room.participants.size === 0) {
        rooms.delete(roomId);
      } else {
        broadcastToRoom(roomId, {
          type: 'participant-left',
          participantId: clientId,
          participantCount: room.participants.size
        });
      }
    }
  });
  
  clients.delete(clientId);
  broadcastRoomList();
}

function broadcastToRoom(roomId, message, excludeClientId = null) {
  const room = rooms.get(roomId);
  if (!room) return;
  
  room.participants.forEach((participant, participantId) => {
    if (participantId !== excludeClientId) {
      const client = clients.get(participantId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    }
  });
}

function broadcastRoomList() {
  const roomList = Array.from(rooms.values()).map(room => ({
    id: room.id,
    name: room.name,
    participantCount: room.participants.size,
    createdAt: room.createdAt
  }));
  
  clients.forEach(client => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({
        type: 'rooms-list',
        rooms: roomList
      }));
    }
  });
}

// Authentication handler
function handleAuthentication(clientId, message) {
  const client = clients.get(clientId);
  if (!client) return;
  
  const { email, name, role } = message.user;
  
  // Store authenticated user
  authenticatedUsers.set(clientId, {
    email,
    name,
    role,
    authenticatedAt: Date.now()
  });
  
  logEvent('INFO', `User authenticated: ${email} (${role})`, name);
  
  client.ws.send(JSON.stringify({
    type: 'authentication-success',
    user: { email, name, role }
  }));
}

// Server statistics handler
function handleGetServerStats(clientId) {
  const client = clients.get(clientId);
  if (!client) return;
  
  const stats = {
    uptime: Date.now() - serverStats.startTime,
    totalConnections: serverStats.totalConnections,
    activeConnections: clients.size,
    totalRooms: rooms.size,
    totalRoomsCreated: serverStats.totalRoomsCreated,
    totalMessages: serverStats.totalMessagesExchanged,
    authenticatedUsers: authenticatedUsers.size,
    memoryUsage: process.memoryUsage(),
    version: '2.0.0'
  };
  
  client.ws.send(JSON.stringify({
    type: 'server-stats',
    stats
  }));
}

// Logs handler
function handleGetLogs(clientId, message) {
  const client = clients.get(clientId);
  if (!client) return;
  
  const limit = message.limit || 100;
  const level = message.level || null;
  
  let filteredLogs = serverLogs;
  if (level) {
    filteredLogs = serverLogs.filter(log => log.level === level);
  }
  
  const logs = filteredLogs.slice(-limit);
  
  client.ws.send(JSON.stringify({
    type: 'server-logs',
    logs
  }));
}

// Log startup
logEvent('INFO', `WebSocket server started on port ${PORT}`, 'System');
console.log(`WebSocket server running on port ${PORT}`);
console.log('Features enabled:');
console.log('- User Authentication');
console.log('- Server Monitoring');
console.log('- Real-time Logging');
console.log('- Room Management');
