'use client';

import { DrawingElement, CanvasState } from '../types/drawingTypes';

export class LocalStorageService {
  private static readonly BOARD_DATA_KEY = 'sparkboard_data';
  private static readonly SESSION_KEY = 'sparkboard_session';
  private static readonly AUTO_SAVE_INTERVAL = 5000; // 5 seconds
  
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private onDataChanged?: (elements: DrawingElement[]) => void;

  constructor() {
    // Listen for storage changes in other tabs
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageChange.bind(this));
      
      // Listen for page visibility change to sync data
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
      
      // Listen for beforeunload to save final state
      window.addEventListener('beforeunload', this.saveCurrentState.bind(this));
    }
  }

  // Set callback for when data changes in another tab
  setDataChangeHandler(callback: (elements: DrawingElement[]) => void) {
    this.onDataChanged = callback;
  }

  // Start auto-saving
  startAutoSave(getElements: () => DrawingElement[]) {
    this.stopAutoSave();
    this.autoSaveTimer = setInterval(() => {
      this.saveElements(getElements());
    }, LocalStorageService.AUTO_SAVE_INTERVAL);
  }

  // Stop auto-saving
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  // Save whiteboard elements to localStorage
  saveElements(elements: DrawingElement[]) {
    try {
      const data = {
        elements,
        timestamp: Date.now(),
        version: '1.0'
      };
      
      localStorage.setItem(LocalStorageService.BOARD_DATA_KEY, JSON.stringify(data));
      console.log('Board data saved locally');
    } catch (error) {
      console.error('Failed to save board data:', error);
    }
  }

  // Load whiteboard elements from localStorage
  loadElements(): DrawingElement[] {
    try {
      const data = localStorage.getItem(LocalStorageService.BOARD_DATA_KEY);
      if (!data) return [];

      const parsed = JSON.parse(data);
      return parsed.elements || [];
    } catch (error) {
      console.error('Failed to load board data:', error);
      return [];
    }
  }

  // Save complete canvas state
  saveCanvasState(state: Partial<CanvasState>) {
    try {
      const existingData = this.loadCanvasState();
      const newData = {
        ...existingData,
        ...state,
        timestamp: Date.now()
      };
      
      localStorage.setItem(LocalStorageService.BOARD_DATA_KEY, JSON.stringify(newData));
    } catch (error) {
      console.error('Failed to save canvas state:', error);
    }
  }

  // Load complete canvas state
  loadCanvasState(): Partial<CanvasState> {
    try {
      const data = localStorage.getItem(LocalStorageService.BOARD_DATA_KEY);
      if (!data) return {};

      const parsed = JSON.parse(data);
      return {
        elements: parsed.elements || [],
        backgroundSettings: parsed.backgroundSettings,
        camera: parsed.camera,
        tool: parsed.tool,
        color: parsed.color,
        strokeWidth: parsed.strokeWidth,
        fontSize: parsed.fontSize
      };
    } catch (error) {
      console.error('Failed to load canvas state:', error);
      return {};
    }
  }

  // Save session information
  saveSessionInfo(sessionId: string, isHost: boolean = false) {
    try {
      const sessionData = {
        sessionId,
        isHost,
        joinedAt: Date.now()
      };
      
      localStorage.setItem(LocalStorageService.SESSION_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Failed to save session info:', error);
    }
  }

  // Load session information
  loadSessionInfo(): { sessionId: string | null; isHost: boolean } {
    try {
      const data = localStorage.getItem(LocalStorageService.SESSION_KEY);
      if (!data) return { sessionId: null, isHost: false };

      const parsed = JSON.parse(data);
      return {
        sessionId: parsed.sessionId || null,
        isHost: parsed.isHost || false
      };
    } catch (error) {
      console.error('Failed to load session info:', error);
      return { sessionId: null, isHost: false };
    }
  }

  // Clear session information
  clearSessionInfo() {
    try {
      localStorage.removeItem(LocalStorageService.SESSION_KEY);
    } catch (error) {
      console.error('Failed to clear session info:', error);
    }
  }

  // Clear all stored data
  clearAllData() {
    try {
      localStorage.removeItem(LocalStorageService.BOARD_DATA_KEY);
      localStorage.removeItem(LocalStorageService.SESSION_KEY);
      console.log('All board data cleared');
    } catch (error) {
      console.error('Failed to clear board data:', error);
    }
  }

  // Get data size for storage management
  getStorageInfo(): { totalSize: number; boardDataSize: number; sessionDataSize: number } {
    try {
      const boardData = localStorage.getItem(LocalStorageService.BOARD_DATA_KEY) || '';
      const sessionData = localStorage.getItem(LocalStorageService.SESSION_KEY) || '';
      
      return {
        totalSize: this.calculateStorageSize(),
        boardDataSize: new Blob([boardData]).size,
        sessionDataSize: new Blob([sessionData]).size
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { totalSize: 0, boardDataSize: 0, sessionDataSize: 0 };
    }
  }

  // Calculate total localStorage usage
  private calculateStorageSize(): number {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  }

  // Handle storage changes from other tabs
  private handleStorageChange(event: StorageEvent) {
    if (event.key === LocalStorageService.BOARD_DATA_KEY && event.newValue) {
      try {
        const data = JSON.parse(event.newValue);
        if (data.elements && this.onDataChanged) {
          console.log('Board data updated in another tab');
          this.onDataChanged(data.elements);
        }
      } catch (error) {
        console.error('Failed to handle storage change:', error);
      }
    }
  }

  // Handle page visibility change to sync data
  private handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      // Page became visible, check for updates
      const elements = this.loadElements();
      if (this.onDataChanged) {
        this.onDataChanged(elements);
      }
    }
  }

  // Save current state on page unload
  private saveCurrentState() {
    // This will be called by the main component
  }

  // Export data for backup
  exportData(): string {
    const boardData = localStorage.getItem(LocalStorageService.BOARD_DATA_KEY) || '{}';
    const sessionData = localStorage.getItem(LocalStorageService.SESSION_KEY) || '{}';
    
    return JSON.stringify({
      boardData: JSON.parse(boardData),
      sessionData: JSON.parse(sessionData),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  // Import data from backup
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.boardData) {
        localStorage.setItem(LocalStorageService.BOARD_DATA_KEY, JSON.stringify(data.boardData));
      }
      
      if (data.sessionData) {
        localStorage.setItem(LocalStorageService.SESSION_KEY, JSON.stringify(data.sessionData));
      }
      
      console.log('Data imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
}

// Create a singleton instance
export const localStorageService = new LocalStorageService();
