'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import Toolbar from './Toolbar';
import DrawingTools from './DrawingTools';
import TextInput from './TextInput';
import { Point, Tool, DrawingElement, CanvasState } from '../../types/drawingTypes';
import { createElement, updateElement, getCursor, screenToCanvas, isPointInElement, getElementBounds } from '../../lib/drawingUtils';

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
    backgroundColor: '#000000',
    camera: { x: 0, y: 0, scale: 1 },
    isTextEditing: false,
    textEditingElement: null,
    isPanning: false
  });
  
  const [history, setHistory] = useState<DrawingElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [lastPanPoint, setLastPanPoint] = useState<Point | null>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [showReturnToContent, setShowReturnToContent] = useState(false);
  
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  
  // Load background color from localStorage on component mount
  useEffect(() => {
    const savedBgColor = localStorage.getItem('whiteboard-bg-color');
    if (savedBgColor) {
      setCanvasState(prev => ({ ...prev, backgroundColor: savedBgColor }));
    }
  }, []);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !canvasState.isTextEditing) {
        e.preventDefault();
        setIsSpacePressed(true);
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
  }, [canvasState.isTextEditing]);

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
    if (canvasState.textEditingElement) {
      const updatedElement = {
        ...canvasState.textEditingElement,
        text
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
        // Deselect all
        const updatedElements = canvasState.elements.map(el => ({
          ...el,
          selected: false
        }));
        
        setCanvasState(prev => ({
          ...prev,
          elements: updatedElements,
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
  
  const undo = () => {
    if (canUndo) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCanvasState(prev => ({
        ...prev,
        elements: history[newIndex],
        currentElement: null
      }));
    }
  };
  
  const redo = () => {
    if (canRedo) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCanvasState(prev => ({
        ...prev,
        elements: history[newIndex],
        currentElement: null
      }));
    }
  };
  
  return (
    <div className="whiteboard-container">
      <Toolbar
        tool={canvasState.tool}
        setTool={(tool) => setCanvasState(prev => ({ ...prev, tool }))}
        color={canvasState.color}
        setColor={(color) => setCanvasState(prev => ({ ...prev, color }))}
        strokeWidth={canvasState.strokeWidth}
        setStrokeWidth={(width) => setCanvasState(prev => ({ ...prev, strokeWidth: width }))}
        fontSize={canvasState.fontSize}
        setFontSize={(size) => setCanvasState(prev => ({ ...prev, fontSize: size }))}
        backgroundColor={canvasState.backgroundColor}
        setBackgroundColor={setBackgroundColor}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      
      <div className="canvas-container">
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
    </div>
  );
};

export default Whiteboard;