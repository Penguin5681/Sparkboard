'use client';

import React, { useRef, useState, useCallback } from 'react';
import Toolbar from './Toolbar';
import DrawingTools from './DrawingTools';
import { Point, Tool, DrawingElement, CanvasState } from '../../types/drawingTypes';
import { createElement, updateElement, getCursor } from '../../lib/drawingUtils';

const Whiteboard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    elements: [],
    selectedElement: null,
    currentElement: null,
    tool: 'pen',
    color: '#000000',
    strokeWidth: 5,
    fontSize: 24
  });
  
  const [history, setHistory] = useState<DrawingElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  
  const saveHistory = useCallback((elements: DrawingElement[]) => {
    const newHistory = [...history.slice(0, historyIndex + 1), elements];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);
  
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const point: Point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    if (canvasState.tool === 'text') {
      const textElement = createElement(
        'text',
        point,
        canvasState.color,
        canvasState.strokeWidth,
        canvasState.fontSize
      ) as DrawingElement;
      
      setCanvasState(prev => ({
        ...prev,
        elements: [...prev.elements, textElement],
        currentElement: textElement
      }));
      
      // Focus on text input
      const text = prompt('Enter text:', '');
      if (text !== null && canvasState.currentElement && canvasState.currentElement.type === 'text') {
        const updatedElement = {
          ...canvasState.currentElement,
          text
        };
        
        const updatedElements = [
          ...canvasState.elements.slice(0, -1),
          updatedElement
        ];
        
        setCanvasState(prev => ({
          ...prev,
          elements: updatedElements,
          currentElement: null
        }));
        
        saveHistory(updatedElements);
      } else {
        // Remove empty text element if canceled
        setCanvasState(prev => ({
          ...prev,
          elements: prev.elements.slice(0, -1),
          currentElement: null
        }));
      }
      
      return;
    }
    
    const newElement = createElement(
      canvasState.tool,
      point,
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
    if (!canvasState.currentElement || canvasState.currentElement.type === 'text') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const point: Point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    const startPoint = canvasState.currentElement.points[0];
    const updatedElement = updateElement(
      canvasState.currentElement,
      point,
      startPoint
    );
    
    setCanvasState(prev => ({
      ...prev,
      currentElement: updatedElement
    }));
  };
  
  const handleMouseUp = () => {
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
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      
      <div className="canvas-container">
        <DrawingTools 
          canvasState={canvasState} 
          canvasRef={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
      </div>
    </div>
  );
};

export default Whiteboard;