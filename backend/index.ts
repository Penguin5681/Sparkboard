import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:3000'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

interface DrawingElement {
  id: string;
  type: string;
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
}

interface Room {
  id: string;
  elements: DrawingElement[];
  participants: Set<WebSocket>;
}

// Storage
const rooms = new Map<string, Room>();

function createRoom(id: string): Room {
  const room: Room = {
    id,
    elements: [],
    participants: new Set()
  };
  rooms.set(id, room);
  return room;
}

function broadcast(room: Room, message: any, sender?: WebSocket) {
  const data = JSON.stringify(message);
  room.participants.forEach(ws => {
    if (ws !== sender && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });
}

// Routes
app.post('/api/sessions', (req, res) => {
  const sessionId = uuidv4().split('-')[0];
  createRoom(sessionId);
  res.json({
    sessionId,
    inviteLink: `http://localhost:3000?session=${sessionId}`
  });
});

app.get('/api/sessions/:id', (req, res) => {
  const room = rooms.get(req.params.id);
  if (!room) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json({
    sessionId: room.id,
    elements: room.elements,
    participantCount: room.participants.size
  });
});

// WebSocket
wss.on('connection', (ws) => {
  let currentRoom: Room | null = null;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'join_session':
          const room = rooms.get(message.sessionId) || createRoom(message.sessionId);
          room.participants.add(ws);
          currentRoom = room;
          
          const user = { id: uuidv4(), name: message.userName || 'Anonymous', color: '#4ECDC4' };
          
          ws.send(JSON.stringify({
            type: 'session_joined',
            sessionId: message.sessionId,
            user,
            elements: room.elements
          }));
          
          // Notify other participants
          broadcast(room, {
            type: 'user_joined',
            user
          }, ws);
          break;
          
        case 'drawing_update':
          if (currentRoom) {
            if (message.elements) {
              currentRoom.elements = message.elements;
            }
            broadcast(currentRoom, {
              type: 'drawing_update',
              elements: currentRoom.elements,
              currentElement: message.element
            }, ws);
          }
          break;
      }
    } catch (error) {
      console.error('WebSocket error:', error);
    }
  });

  ws.on('close', () => {
    if (currentRoom) {
      currentRoom.participants.delete(ws);
      broadcast(currentRoom, {
        type: 'user_left',
        userId: 'anonymous' 
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Backend URL: http://localhost:${PORT}`);
  console.log(`🗄️  API endpoints:`);
  console.log(`   POST /api/sessions - Create new session`);
  console.log(`   GET  /api/sessions/:id - Get session info`);
});
