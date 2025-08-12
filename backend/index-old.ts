import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = 5000;

// Enable CORS for frontend
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Types
interface DrawingElement {
  id: string;
  type: 'pen' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'text' | 'eraser';
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
  [key: string]: any;
}

interface BoardSession {
  id: string;
  elements: DrawingElement[];
  participants: Set<WebSocket>;
  createdAt: Date;
  lastActivity: Date;
}

interface User {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
}

// In-memory storage (in production, use Redis or database)
const sessions = new Map<string, BoardSession>();
const userSessions = new Map<WebSocket, { sessionId: string; user: User }>();

// Cleanup inactive sessions (older than 1 hour)
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  for (const [sessionId, session] of sessions.entries()) {
    if (session.lastActivity < oneHourAgo && session.participants.size === 0) {
      sessions.delete(sessionId);
      console.log(`Cleaned up inactive session: ${sessionId}`);
    }
  }
}, 30 * 60 * 1000); // Check every 30 minutes

// Helper functions
function generateSessionId(): string {
  return uuidv4().split('-')[0]; // Short session ID
}

function generateUserColor(): string {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function broadcastToSession(sessionId: string, message: any, excludeWs?: WebSocket) {
  const session = sessions.get(sessionId);
  if (!session) return;

  session.lastActivity = new Date();
  const messageStr = JSON.stringify(message);
  
  session.participants.forEach((ws) => {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
    }
  });
}

// REST API Routes

// Create a new session
app.post('/api/sessions', (req, res) => {
  const sessionId = generateSessionId();
  const session: BoardSession = {
    id: sessionId,
    elements: [],
    participants: new Set(),
    createdAt: new Date(),
    lastActivity: new Date()
  };
  
  sessions.set(sessionId, session);
  
  res.json({
    sessionId,
    inviteLink: `http://localhost:3000?session=${sessionId}`
  });
});

// Get session data
app.get('/api/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.json({
    sessionId: session.id,
    elements: session.elements,
    participantCount: session.participants.size
  });
});

// Save session elements
app.put('/api/sessions/:sessionId/elements', (req, res) => {
  const { sessionId } = req.params;
  const { elements } = req.body;
  const session = sessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  session.elements = elements;
  session.lastActivity = new Date();
  
  // Broadcast update to all participants
  broadcastToSession(sessionId, {
    type: 'elements_update',
    elements
  });
  
  res.json({ success: true });
});

// WebSocket handling
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'join_session':
          handleJoinSession(ws, message);
          break;
          
        case 'drawing_update':
          handleDrawingUpdate(ws, message);
          break;
          
        case 'cursor_move':
          handleCursorMove(ws, message);
          break;
          
        case 'leave_session':
          handleLeaveSession(ws);
          break;
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
  
  ws.on('close', () => {
    handleLeaveSession(ws);
  });
});

function handleJoinSession(ws: WebSocket, message: any) {
  const { sessionId, userName } = message;
  const session = sessions.get(sessionId);
  
  if (!session) {
    ws.send(JSON.stringify({ type: 'error', message: 'Session not found' }));
    return;
  }
  
  const user: User = {
    id: uuidv4(),
    name: userName || 'Anonymous',
    color: generateUserColor()
  };
  
  // Remove from previous session if any
  handleLeaveSession(ws);
  
  // Join new session
  session.participants.add(ws);
  userSessions.set(ws, { sessionId, user });
  
  // Send current state to new user
  ws.send(JSON.stringify({
    type: 'session_joined',
    sessionId,
    user,
    elements: session.elements
  }));
  
  // Notify other participants
  broadcastToSession(sessionId, {
    type: 'user_joined',
    user
  }, ws);
  
  console.log(`User ${user.name} joined session ${sessionId}`);
}

function handleDrawingUpdate(ws: WebSocket, message: any) {
  const userSession = userSessions.get(ws);
  if (!userSession) return;
  
  const { sessionId } = userSession;
  const session = sessions.get(sessionId);
  if (!session) return;
  
  // Update session elements
  if (message.elements) {
    session.elements = message.elements;
  }
  
  // Broadcast to other participants
  broadcastToSession(sessionId, {
    type: 'drawing_update',
    elements: session.elements,
    element: message.element
  }, ws);
}

function handleCursorMove(ws: WebSocket, message: any) {
  const userSession = userSessions.get(ws);
  if (!userSession) return;
  
  const { sessionId, user } = userSession;
  user.cursor = message.cursor;
  
  // Broadcast cursor position to other participants
  broadcastToSession(sessionId, {
    type: 'cursor_move',
    userId: user.id,
    cursor: message.cursor
  }, ws);
}

function handleLeaveSession(ws: WebSocket) {
  const userSession = userSessions.get(ws);
  if (!userSession) return;
  
  const { sessionId, user } = userSession;
  const session = sessions.get(sessionId);
  
  if (session) {
    session.participants.delete(ws);
    
    // Notify other participants
    broadcastToSession(sessionId, {
      type: 'user_left',
      userId: user.id
    });
    
    console.log(`User ${user.name} left session ${sessionId}`);
  }
  
  userSessions.delete(ws);
}

server.listen(PORT, () => {
  console.log(`🚀 Sparkboard server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for connections`);
});