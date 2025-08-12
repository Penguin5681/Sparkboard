'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import SlimToolbar from './SlimToolbar';
import DrawingTools from './DrawingTools';
import TextInput from './TextInput';
import { Point, Tool, DrawingElement, CanvasState, BackgroundSettings } from '../../types/drawingTypes';
import { createElement, updateElement, getCursor, screenToCanvas, isPointInElement, getElementBounds } from '../../lib/drawingUtils';
import { collaborationService } from '../../lib/collaborationService';
import { localStorageService } from '../../lib/localStorageService';
import './whiteboard.css';

const Whiteboard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    elements: [],
    selectedElement: null,
    currentElement: null,
    tool: 'pen',
    color: '#ffffff',
    strokeWidth: 5,
    fontSize: 24,
    backgroundSettings: {
      pattern: 'none',
      color: '#000000',
      patternColor: '#333333',
      patternSize: 20,
      patternOpacity: 0.5
    },
    camera: { x: 0, y: 0, scale: 1 },
    isTextEditing: false,
    textEditingElement: null,
    isPanning: false,
    isDragSelecting: false,
    dragSelectStart: null,
    dragSelectEnd: null
  });
  
  const [history, setHistory] = useState<DrawingElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [lastPanPoint, setLastPanPoint] = useState<Point | null>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [showReturnToContent, setShowReturnToContent] = useState(false);
  
  // Collaboration state
  const [sessionInfo, setSessionInfo] = useState<{
    sessionId: string | null;
    isHost: boolean;
    participantCount: number;
  }>({
    sessionId: null,
    isHost: false,
    participantCount: 0,
  });
  
  // Store local board backup when joining sessions
  const [localBoardBackup, setLocalBoardBackup] = useState<{
    elements: DrawingElement[];
    backgroundSettings: BackgroundSettings;
    camera: { x: number; y: number; scale: number };
  } | null>(null);
  
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  
  // Load background settings from localStorage on component mount
  useEffect(() => {
    const savedBgSettings = localStorage.getItem('whiteboard-bg-settings');
    if (savedBgSettings) {
      setCanvasState(prev => ({ 
        ...prev, 
        backgroundSettings: JSON.parse(savedBgSettings) 
      }));
    }
  }, []);
  
  // Save background settings to localStorage when they change
  const setBackgroundSettings = (settings: BackgroundSettings) => {
    setCanvasState(prev => ({ ...prev, backgroundSettings: settings }));
    localStorage.setItem('whiteboard-bg-settings', JSON.stringify(settings));
  };

  // Initialize collaboration and local storage services
  useEffect(() => {
    let isInitializing = true;
    
    // Check if there's a session ID in the URL first
    const urlParams = new URLSearchParams(window.location.search);
    const sessionParam = urlParams.get('session');
    
    // Only load local data if not joining a collaborative session
    if (!sessionParam) {
      const savedState = localStorageService.loadCanvasState();
      if (savedState.elements && savedState.elements.length > 0) {
        setCanvasState(prev => ({ 
          ...prev, 
          elements: savedState.elements!,
          backgroundSettings: savedState.backgroundSettings || prev.backgroundSettings,
          camera: savedState.camera || prev.camera,
        }));
        setHistory([savedState.elements!]);
        setHistoryIndex(0);
      }
    }

    // Set up collaboration event handlers
    collaborationService.setHandlers({
      onSessionJoined: (sessionId, user, elements) => {
        console.log('Session joined, switching to collaborative board');
        
        // Backup current local board before switching to collaborative board
        setLocalBoardBackup((prevBackup) => {
          if (!prevBackup) {
            // Get current state from localStorage as fallback
            const currentElements = JSON.parse(localStorage.getItem('sparkboard_data') || '{"elements": []}').elements || [];
            const currentBg = JSON.parse(localStorage.getItem('whiteboard-bg-settings') || '{"pattern": "none", "color": "#000000"}');
            return {
              elements: currentElements,
              backgroundSettings: currentBg,
              camera: { x: 0, y: 0, scale: 1 },
            };
          }
          return prevBackup;
        });
        
        // Update session info first to stop local storage sync
        setSessionInfo({
          sessionId,
          isHost: false,
          participantCount: 1, // Will be updated by other events
        });
        
        // Switch to collaborative board
        setCanvasState(prev => ({ ...prev, elements }));
        setHistory([elements]);
        setHistoryIndex(0);
      },
      onElementsUpdate: (elements, currentElement) => {
        // Update elements with smooth real-time updates
        setCanvasState(prev => ({ 
          ...prev, 
          elements,
          currentElement: currentElement || null // Show other users' current drawing
        }));
        
        // Only update history for completed elements (not currentElement)
        if (!currentElement) {
          setHistory(prev => [...prev.slice(0, historyIndex + 1), elements]);
          setHistoryIndex(prev => prev + 1);
        }
      },
      onUserJoined: (user) => {
        setSessionInfo(prev => ({ 
          ...prev, 
          participantCount: prev.participantCount + 1 
        }));
      },
      onUserLeft: (userId) => {
        setSessionInfo(prev => ({ 
          ...prev, 
          participantCount: Math.max(1, prev.participantCount - 1) 
        }));
      },
      onError: (error) => {
        console.error('Collaboration error:', error);
        alert(`Collaboration error: ${error}`);
      },
    });

    // Auto-join session if URL parameter exists
    if (sessionParam) {
      setTimeout(() => {
        // Get current state for backup
        setLocalBoardBackup((prevBackup) => {
          if (!prevBackup) {
            const currentElements = JSON.parse(localStorage.getItem('sparkboard_data') || '{"elements": []}').elements || [];
            const currentBg = JSON.parse(localStorage.getItem('whiteboard-bg-settings') || '{"pattern": "none", "color": "#000000"}');
            return {
              elements: currentElements,
              backgroundSettings: currentBg,
              camera: { x: 0, y: 0, scale: 1 },
            };
          }
          return prevBackup;
        });
        
        collaborationService.joinSession(sessionParam, 'Anonymous User').catch((error) => {
          console.error('Failed to auto-join session:', error);
          alert('Failed to join session from URL');
        });
      }, 500); // Reduced delay for faster connection
    }

    // Set up data change handler for multi-tab sync (only for local boards)
    localStorageService.setDataChangeHandler((elements) => {
      // Critical fix: Only sync if not in a collaborative session
      if (!sessionInfo.sessionId && !isInitializing) {
        setCanvasState(prev => ({ ...prev, elements }));
      }
    });

    // Only set up auto-save for local boards
    if (!sessionParam) {
      localStorageService.startAutoSave(() => canvasState.elements);
    }

    // Mark initialization as complete
    setTimeout(() => {
      isInitializing = false;
    }, 1000);

    return () => {
      collaborationService.leaveSession();
      localStorageService.stopAutoSave();
    };
  }, []); // Empty dependency array to run only once

  // Auto-save canvas state when elements change (only for local boards)
  useEffect(() => {
    // Only save to local storage if not in a collaborative session
    if (!sessionInfo.sessionId) {
      localStorageService.saveCanvasState({
        elements: canvasState.elements,
        backgroundSettings: canvasState.backgroundSettings,
        camera: canvasState.camera,
      });
    }
  }, [canvasState.elements, canvasState.backgroundSettings, canvasState.camera, sessionInfo.sessionId]);

  // Send updates to collaboration service when elements change
  useEffect(() => {
    if (sessionInfo.sessionId) {
      collaborationService.sendDrawingUpdate(canvasState.elements, canvasState.currentElement || undefined);
    }
  }, [canvasState.elements, canvasState.currentElement, sessionInfo.sessionId]);

  const undo = useCallback(() => {
    if (canUndo) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCanvasState(prev => ({
        ...prev,
        elements: history[newIndex],
        currentElement: null
      }));
    }
  }, [canUndo, historyIndex, history]);
  
  const redo = useCallback(() => {
    if (canRedo) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCanvasState(prev => ({
        ...prev,
        elements: history[newIndex],
        currentElement: null
      }));
    }
  }, [canRedo, historyIndex, history]);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts while editing text
      if (canvasState.isTextEditing) return;
      
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePressed(true);
      }
      
      // Handle Ctrl+Z (Undo) and Ctrl+Y (Redo)
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          redo();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setCanvasState(prev => ({ ...prev, isPanning: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [canvasState.isTextEditing, undo, redo]);

  // Check if user is far from content
  useEffect(() => {
    if (canvasState.elements.length === 0) {
      setShowReturnToContent(false);
      return;
    }

    const viewportCenter = screenToCanvas(
      { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      canvasState.camera
    );

    // Find content bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    canvasState.elements.forEach(element => {
      const bounds = getElementBounds(element);
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.width);
      maxY = Math.max(maxY, bounds.y + bounds.height);
    });

    const contentCenter = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
    const distance = Math.sqrt(
      Math.pow(viewportCenter.x - contentCenter.x, 2) + 
      Math.pow(viewportCenter.y - contentCenter.y, 2)
    );

    setShowReturnToContent(distance > 1000); // Show if more than 1000 units away
  }, [canvasState.camera, canvasState.elements]);
  
  // Save background color to localStorage when it changes
  const setBackgroundColor = (color: string) => {
    setCanvasState(prev => ({ ...prev, backgroundColor: color }));
    localStorage.setItem('whiteboard-bg-color', color);
  };
  
  const saveHistory = useCallback((elements: DrawingElement[]) => {
    const newHistory = [...history.slice(0, historyIndex + 1), elements];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);
  
  const getMousePosition = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const returnToContent = () => {
    if (canvasState.elements.length === 0) return;

    // Find content bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    canvasState.elements.forEach(element => {
      const bounds = getElementBounds(element);
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.width);
      maxY = Math.max(maxY, bounds.y + bounds.height);
    });

    const contentCenter = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
    const canvas = canvasRef.current;
    if (!canvas) return;

    setCanvasState(prev => ({
      ...prev,
      camera: {
        x: canvas.width / 2 - contentCenter.x,
        y: canvas.height / 2 - contentCenter.y,
        scale: 1
      }
    }));
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    // Only zoom when Ctrl is pressed, otherwise allow normal scrolling
    if (!e.ctrlKey && !e.metaKey) {
      return;
    }
    
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mousePos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, canvasState.camera.scale * scaleFactor));
    
    setCanvasState(prev => ({
      ...prev,
      camera: {
        x: mousePos.x - (mousePos.x - prev.camera.x) * (newScale / prev.camera.scale),
        y: mousePos.y - (mousePos.y - prev.camera.y) * (newScale / prev.camera.scale),
        scale: newScale
      }
    }));
  };

  const handleTextSubmit = (text: string) => {
    if (canvasState.textEditingElement && text.trim()) {
      const updatedElement = {
        ...canvasState.textEditingElement,
        text: text.trim()
      };
      
      const updatedElements = canvasState.elements.map(el => 
        el.id === canvasState.textEditingElement!.id ? updatedElement : el
      );
      
      setCanvasState(prev => ({
        ...prev,
        elements: updatedElements,
        isTextEditing: false,
        textEditingElement: null
      }));
      
      saveHistory(updatedElements);
    } else {
      handleTextCancel();
    }
  };

  const handleTextCancel = () => {
    if (canvasState.textEditingElement) {
      const updatedElements = canvasState.elements.filter(
        el => el.id !== canvasState.textEditingElement!.id
      );
      
      setCanvasState(prev => ({
        ...prev,
        elements: updatedElements,
        isTextEditing: false,
        textEditingElement: null
      }));
    }
  };
  
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const screenPos = getMousePosition(e);
    const canvasPos = screenToCanvas(screenPos, canvasState.camera);
    
    const textElement = createElement(
      'text',
      canvasPos,
      canvasState.color,
      canvasState.strokeWidth,
      canvasState.fontSize
    ) as DrawingElement;
    
    setCanvasState(prev => ({
      ...prev,
      elements: [...prev.elements, textElement],
      isTextEditing: true,
      textEditingElement: textElement
    }));
  };
  
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (canvasState.isTextEditing) return;
    
    const screenPos = getMousePosition(e);
    const canvasPos = screenToCanvas(screenPos, canvasState.camera);
    
    // Handle panning with middle mouse or space + left click
    if (e.button === 1 || (isSpacePressed && e.button === 0)) {
      setCanvasState(prev => ({ ...prev, isPanning: true }));
      setLastPanPoint(screenPos);
      return;
    }
    
    // Handle selection
    if (canvasState.tool === 'select') {
      const clickedElement = canvasState.elements
        .slice()
        .reverse()
        .find(element => isPointInElement(canvasPos, element));
      
      if (clickedElement) {
        // Deselect all others and select this one
        const updatedElements = canvasState.elements.map(el => ({
          ...el,
          selected: el.id === clickedElement.id
        }));
        
        setCanvasState(prev => ({
          ...prev,
          elements: updatedElements,
          selectedElement: clickedElement
        }));
        
        setDragStart(canvasPos);
      } else {
        // Start drag selection
        setCanvasState(prev => ({
          ...prev,
          isDragSelecting: true,
          dragSelectStart: canvasPos,
          dragSelectEnd: canvasPos,
          // Deselect all elements
          elements: prev.elements.map(el => ({ ...el, selected: false })),
          selectedElement: null
        }));
      }
      return;
    }
    
    // Skip regular mouse down handling for text tool - only use double-click
    if (canvasState.tool === 'text') {
      return;
    }
    
    const newElement = createElement(
      canvasState.tool,
      canvasPos,
      canvasState.color,
      canvasState.strokeWidth,
      canvasState.fontSize
    );
    
    setCanvasState(prev => ({
      ...prev,
      currentElement: newElement
    }));
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (canvasState.isTextEditing) return;
    
    const screenPos = getMousePosition(e);
    
    // Handle panning
    if (canvasState.isPanning && lastPanPoint) {
      const deltaX = screenPos.x - lastPanPoint.x;
      const deltaY = screenPos.y - lastPanPoint.y;
      
      setCanvasState(prev => ({
        ...prev,
        camera: {
          ...prev.camera,
          x: prev.camera.x + deltaX,
          y: prev.camera.y + deltaY
        }
      }));
      
      setLastPanPoint(screenPos);
      return;
    }
    
    // Handle drag selection
    if (canvasState.isDragSelecting && canvasState.dragSelectStart) {
      const canvasPos = screenToCanvas(screenPos, canvasState.camera);
      setCanvasState(prev => ({
        ...prev,
        dragSelectEnd: canvasPos
      }));
      return;
    }
    
    // Handle element dragging
    if (canvasState.selectedElement && dragStart && canvasState.tool === 'select') {
      const canvasPos = screenToCanvas(screenPos, canvasState.camera);
      const deltaX = canvasPos.x - dragStart.x;
      const deltaY = canvasPos.y - dragStart.y;
      
      const updatedElements = canvasState.elements.map(el => {
        if (el.id === canvasState.selectedElement!.id) {
          const updatedPoints = el.points.map(p => ({
            x: p.x + deltaX,
            y: p.y + deltaY
          }));
          
          let updatedElement: DrawingElement = { ...el, points: updatedPoints };
          
          // Handle different element types
          if (el.type === 'line' || el.type === 'arrow') {
            const lineEl = el as any;
            (updatedElement as any).endX = lineEl.endX + deltaX;
            (updatedElement as any).endY = lineEl.endY + deltaY;
          }
          
          return updatedElement;
        }
        return el;
      });
      
      setCanvasState(prev => ({
        ...prev,
        elements: updatedElements
      }));
      
      setDragStart(canvasPos);
      return;
    }
    
    // Handle drawing
    if (!canvasState.currentElement || canvasState.currentElement.type === 'text') return;
    
    const canvasPos = screenToCanvas(screenPos, canvasState.camera);
    const startPoint = canvasState.currentElement.points[0];
    const updatedElement = updateElement(
      canvasState.currentElement,
      canvasPos,
      startPoint
    );
    
    setCanvasState(prev => ({
      ...prev,
      currentElement: updatedElement
    }));
  };
  
  const handleMouseUp = () => {
    if (canvasState.isPanning) {
      setCanvasState(prev => ({ ...prev, isPanning: false }));
      setLastPanPoint(null);
      return;
    }
    
    // Handle drag selection completion
    if (canvasState.isDragSelecting && canvasState.dragSelectStart && canvasState.dragSelectEnd) {
      const start = canvasState.dragSelectStart;
      const end = canvasState.dragSelectEnd;
      
      // Create selection rectangle
      const selectionRect = {
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        width: Math.abs(end.x - start.x),
        height: Math.abs(end.y - start.y)
      };
      
      // Select elements that intersect with selection rectangle
      const selectedElements = canvasState.elements.filter(element => {
        const bounds = getElementBounds(element);
        return (
          bounds.x < selectionRect.x + selectionRect.width &&
          bounds.x + bounds.width > selectionRect.x &&
          bounds.y < selectionRect.y + selectionRect.height &&
          bounds.y + bounds.height > selectionRect.y
        );
      });
      
      const updatedElements = canvasState.elements.map(el => ({
        ...el,
        selected: selectedElements.some(selected => selected.id === el.id)
      }));
      
      setCanvasState(prev => ({
        ...prev,
        elements: updatedElements,
        isDragSelecting: false,
        dragSelectStart: null,
        dragSelectEnd: null,
        selectedElement: selectedElements.length === 1 ? selectedElements[0] : null
      }));
      
      return;
    }
    
    if (dragStart) {
      if (canvasState.selectedElement) {
        saveHistory(canvasState.elements);
      }
      setDragStart(null);
      return;
    }
    
    if (canvasState.currentElement && canvasState.currentElement.type !== 'text') {
      const updatedElements = [...canvasState.elements, canvasState.currentElement];
      
      setCanvasState(prev => ({
        ...prev,
        elements: updatedElements,
        currentElement: null
      }));
      
      saveHistory(updatedElements);
    }
  };
  
  const handleMouseLeave = () => {
    handleMouseUp();
  };

  // Collaboration handlers
  const handleStartSession = useCallback(async () => {
    try {
      // Backup current board before starting session
      setLocalBoardBackup({
        elements: canvasState.elements,
        backgroundSettings: canvasState.backgroundSettings,
        camera: canvasState.camera,
      });
      
      const { sessionId, inviteLink } = await collaborationService.createSession();
      setSessionInfo({
        sessionId,
        isHost: true,
        participantCount: 1,
      });
      
      // Copy invite link to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(inviteLink);
        alert(`Session started! Invite link copied to clipboard:\n${inviteLink}\n\nShare this link with others to collaborate on your board.`);
      } else {
        alert(`Session started! Share this link:\n${inviteLink}`);
      }
    } catch (error) {
      console.error('Failed to start session:', error);
      alert('Failed to start collaboration session');
    }
  }, [canvasState.elements, canvasState.backgroundSettings, canvasState.camera]);

  const handleJoinSession = useCallback(async (sessionId: string) => {
    try {
      // Backup current board before joining
      setLocalBoardBackup({
        elements: canvasState.elements,
        backgroundSettings: canvasState.backgroundSettings,
        camera: canvasState.camera,
      });
      
      await collaborationService.joinSession(sessionId, 'Anonymous User');
      // Session info will be updated by the onSessionJoined handler
    } catch (error) {
      console.error('Failed to join session:', error);
      alert('Failed to join session. Please check the session ID.');
    }
  }, [canvasState.elements, canvasState.backgroundSettings, canvasState.camera]);

  const handleLeaveSession = useCallback(() => {
    collaborationService.leaveSession();
    
    if (localBoardBackup) {
      setCanvasState(prev => ({
        ...prev,
        elements: localBoardBackup.elements,
        backgroundSettings: localBoardBackup.backgroundSettings,
        camera: localBoardBackup.camera,
      }));
      setHistory([localBoardBackup.elements]);
      setHistoryIndex(0);
      
      localStorageService.saveCanvasState({
        elements: localBoardBackup.elements,
        backgroundSettings: localBoardBackup.backgroundSettings,
        camera: localBoardBackup.camera,
      });
      
      setLocalBoardBackup(null);
    }
    
    setSessionInfo({
      sessionId: null,
      isHost: false,
      participantCount: 0,
    });
  }, [localBoardBackup]);
  
  return (
    <div className="whiteboard-fullscreen">
      <SlimToolbar
        tool={canvasState.tool}
        setTool={(tool: Tool) => setCanvasState(prev => ({ ...prev, tool }))}
        color={canvasState.color}
        setColor={(color: string) => setCanvasState(prev => ({ ...prev, color }))}
        strokeWidth={canvasState.strokeWidth}
        setStrokeWidth={(width: number) => setCanvasState(prev => ({ ...prev, strokeWidth: width }))}
        fontSize={canvasState.fontSize}
        setFontSize={(size: number) => setCanvasState(prev => ({ ...prev, fontSize: size }))}
        backgroundSettings={canvasState.backgroundSettings}
        setBackgroundSettings={setBackgroundSettings}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onStartSession={handleStartSession}
        onJoinSession={handleJoinSession}
        onLeaveSession={handleLeaveSession}
        sessionInfo={sessionInfo}
      />
      
      {showReturnToContent && (
        <button 
          className="return-to-content-btn"
          onClick={returnToContent}
        >
          Return to Content
        </button>
      )}
      
      <DrawingTools 
        canvasState={canvasState} 
        canvasRef={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
      />
      
      {canvasState.isTextEditing && canvasState.textEditingElement && (
        <TextInput
          position={canvasState.textEditingElement.points[0]}
          fontSize={(canvasState.textEditingElement as any).fontSize || canvasState.fontSize}
          color={canvasState.textEditingElement.color}
          initialValue={(canvasState.textEditingElement as any).text || ''}
          onSubmit={handleTextSubmit}
          onCancel={handleTextCancel}
          camera={canvasState.camera}
        />
      )}
    </div>
  );
};

export default Whiteboard;