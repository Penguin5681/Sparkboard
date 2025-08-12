'use client';

import { DrawingElement } from '../types/drawingTypes';

export interface CollaborationUser {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
}

export interface SessionInfo {
  sessionId: string;
  elements: DrawingElement[];
  participantCount: number;
}

export class CollaborationService {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private user: CollaborationUser | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;

  // Event handlers
  private onSessionJoined?: (sessionId: string, user: CollaborationUser, elements: DrawingElement[]) => void;
  private onElementsUpdate?: (elements: DrawingElement[], currentElement?: DrawingElement) => void;
  private onUserJoined?: (user: CollaborationUser) => void;
  private onUserLeft?: (userId: string) => void;
  private onCursorMove?: (userId: string, cursor: { x: number; y: number }) => void;
  private onError?: (error: string) => void;

  constructor() {
    // Load session from URL if available
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionParam = urlParams.get('session');
      if (sessionParam) {
        this.sessionId = sessionParam;
      }
    }
  }

  // Set event handlers
  setHandlers(handlers: {
    onSessionJoined?: (sessionId: string, user: CollaborationUser, elements: DrawingElement[]) => void;
    onElementsUpdate?: (elements: DrawingElement[], currentElement?: DrawingElement) => void;
    onUserJoined?: (user: CollaborationUser) => void;
    onUserLeft?: (userId: string) => void;
    onCursorMove?: (userId: string, cursor: { x: number; y: number }) => void;
    onError?: (error: string) => void;
  }) {
    this.onSessionJoined = handlers.onSessionJoined;
    this.onElementsUpdate = handlers.onElementsUpdate;
    this.onUserJoined = handlers.onUserJoined;
    this.onUserLeft = handlers.onUserLeft;
    this.onCursorMove = handlers.onCursorMove;
    this.onError = handlers.onError;
  }

  // Create a new collaboration session
  async createSession(): Promise<{ sessionId: string; inviteLink: string }> {
    try {
      const response = await fetch('http://localhost:5000/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to create session');
      }
      
      const data = await response.json();
      this.sessionId = data.sessionId;
      
      // Connect to WebSocket and join the session
      await this.connectWebSocket();
      
      if (this.ws) {
        this.ws.send(JSON.stringify({
          type: 'join_session',
          sessionId: data.sessionId,
          userName: 'Host'
        }));
      }
      
      // Update URL without page reload
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('session', data.sessionId);
        window.history.pushState({}, '', url.toString());
      }
      
      return data;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  // Join an existing session
  async joinSession(sessionId: string, userName: string = 'Anonymous'): Promise<void> {
    console.log('Attempting to join session:', sessionId);
    this.sessionId = sessionId;
    
    try {
      // First, check if session exists
      console.log('Checking if session exists...');
      const response = await fetch(`http://localhost:5000/api/sessions/${sessionId}`);
      if (!response.ok) {
        throw new Error('Session not found');
      }
      console.log('Session exists, proceeding to connect...');

      // Connect WebSocket
      await this.connectWebSocket();
      
      // Send join message
      if (this.ws) {
        console.log('Sending join_session message for session:', sessionId);
        this.ws.send(JSON.stringify({
          type: 'join_session',
          sessionId,
          userName
        }));
      }
    } catch (error) {
      console.error('Error joining session:', error);
      this.onError?.('Failed to join session');
      throw error;
    }
  }

  // Connect WebSocket with retry logic
  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket('ws://localhost:5000');
        
        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };
        
        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.handleReconnection();
        };
        
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  // Handle WebSocket messages
  private handleMessage(message: any) {
    console.log('Received WebSocket message:', message);
    
    switch (message.type) {
      case 'session_joined':
        console.log('Session joined successfully:', message.sessionId);
        this.user = message.user;
        this.onSessionJoined?.(message.sessionId, message.user, message.elements);
        break;
        
      case 'drawing_update':
        console.log('Received drawing update with', message.elements.length, 'elements');
        this.onElementsUpdate?.(message.elements, message.currentElement);
        break;
        
      case 'user_joined':
        console.log('User joined:', message.user);
        this.onUserJoined?.(message.user);
        break;
        
      case 'user_left':
        console.log('User left:', message.userId);
        this.onUserLeft?.(message.userId);
        break;
        
      case 'cursor_move':
        this.onCursorMove?.(message.userId, message.cursor);
        break;
        
      case 'error':
        console.error('Server error:', message.message);
        this.onError?.(message.message);
        break;
        
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  // Handle reconnection
  private handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.sessionId) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connectWebSocket().then(() => {
          if (this.sessionId && this.user) {
            this.ws?.send(JSON.stringify({
              type: 'join_session',
              sessionId: this.sessionId,
              userName: this.user.name
            }));
          }
        }).catch(console.error);
      }, this.reconnectInterval * this.reconnectAttempts);
    }
  }

  // Send drawing updates
  sendDrawingUpdate(elements: DrawingElement[], currentElement?: DrawingElement) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'drawing_update',
        elements,
        element: currentElement
      }));
    }
  }

  // Send cursor position
  sendCursorMove(cursor: { x: number; y: number }) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'cursor_move',
        cursor
      }));
    }
  }

  // Leave session
  leaveSession() {
    if (this.ws) {
      this.ws.send(JSON.stringify({ type: 'leave_session' }));
      this.ws.close();
      this.ws = null;
    }
    
    this.sessionId = null;
    this.user = null;
    
    // Remove session from URL
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('session');
      window.history.pushState({}, '', url.toString());
    }
  }

  // Get current session info
  getSessionInfo(): { sessionId: string | null; user: CollaborationUser | null } {
    return {
      sessionId: this.sessionId,
      user: this.user
    };
  }

  // Check if currently in a session
  isInSession(): boolean {
    return this.sessionId !== null && this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Create a singleton instance
export const collaborationService = new CollaborationService();
