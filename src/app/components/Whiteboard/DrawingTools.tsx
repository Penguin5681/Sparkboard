'use client';

import React, { useEffect, useRef } from 'react';
import { CanvasState, DrawingElement } from '../../types/drawingTypes';
import { drawElement, getCursor } from '../../lib/drawingUtils';
import { drawBackgroundPattern } from '../../lib/backgroundUtils';

interface DrawingToolsProps {
  canvasState: CanvasState;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onDoubleClick: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onWheel: (e: React.WheelEvent<HTMLCanvasElement>) => void;
}

const DrawingTools: React.FC<DrawingToolsProps> = ({ 
  canvasState, 
  canvasRef,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onDoubleClick,
  onWheel
}) => {
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set up canvas
    const context = canvas.getContext('2d');
    if (!context) return;
    
    contextRef.current = context;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    
    // Set canvas dimensions
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const devicePixelRatio = window.devicePixelRatio || 1;
        const rect = parent.getBoundingClientRect();
        
        // Set actual canvas size
        canvas.width = rect.width * devicePixelRatio;
        canvas.height = (rect.height - 50) * devicePixelRatio; // Account for toolbar
        
        // Set display size
        canvas.style.width = rect.width + 'px';
        canvas.style.height = (rect.height - 50) + 'px';
        
        // Scale context to handle high DPI displays
        context.scale(devicePixelRatio, devicePixelRatio);
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [canvasRef]);
  
  useEffect(() => {
    const context = contextRef.current;
    if (!context) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Get actual canvas dimensions (accounting for device pixel ratio)
    const rect = canvas.getBoundingClientRect();
    
    // Clear canvas
    context.clearRect(0, 0, rect.width, rect.height);
    
    // Set background color
    context.fillStyle = canvasState.backgroundSettings.color;
    context.fillRect(0, 0, rect.width, rect.height);
    
    // Draw background pattern if needed
    if (canvasState.backgroundSettings.pattern !== 'none') {
      drawBackgroundPattern(
        context,
        canvasState.backgroundSettings,
        canvasState.camera,
        rect.width,
        rect.height
      );
    }
    
    // Apply camera transformation
    context.save();
    context.translate(canvasState.camera.x, canvasState.camera.y);
    context.scale(canvasState.camera.scale, canvasState.camera.scale);
    
    // Draw all elements
    canvasState.elements.forEach(element => {
      drawElement(context, element);
    });
    
    // Draw current element
    if (canvasState.currentElement) {
      drawElement(context, canvasState.currentElement);
    }
    
    // Draw drag selection rectangle
    if (canvasState.isDragSelecting && canvasState.dragSelectStart && canvasState.dragSelectEnd) {
      const start = canvasState.dragSelectStart;
      const end = canvasState.dragSelectEnd;
      
      context.strokeStyle = '#007acc';
      context.lineWidth = 1;
      context.setLineDash([5, 5]);
      context.fillStyle = 'rgba(0, 122, 204, 0.1)';
      
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const width = Math.abs(end.x - start.x);
      const height = Math.abs(end.y - start.y);
      
      context.fillRect(x, y, width, height);
      context.strokeRect(x, y, width, height);
      context.setLineDash([]);
    }
    
    context.restore();
  }, [canvasState]);
  
  return (
    <canvas
      ref={canvasRef}
      className="drawing-canvas"
      style={{ 
        backgroundColor: canvasState.backgroundSettings.color,
        cursor: getCursor(canvasState.tool, canvasState.isPanning, canvasState.isDragSelecting)
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onDoubleClick={onDoubleClick}
      onWheel={onWheel}
      onContextMenu={(e) => e.preventDefault()} // Prevent context menu on right click
    />
  );
};

export default DrawingTools;