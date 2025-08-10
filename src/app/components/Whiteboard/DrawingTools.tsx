'use client';

import React, { useEffect, useRef } from 'react';
import { CanvasState, DrawingElement } from '../../types/drawingTypes';
import { drawElement, getCursor } from '../../lib/drawingUtils';

interface DrawingToolsProps {
  canvasState: CanvasState;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onDoubleClick: (e: React.MouseEvent<HTMLCanvasElement>) => void;
}

const DrawingTools: React.FC<DrawingToolsProps> = ({ 
  canvasState, 
  canvasRef,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onDoubleClick
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
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight - 50; // Account for toolbar
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [canvasRef]);
  
  useEffect(() => {
    const context = contextRef.current;
    if (!context) return;
    
    // Clear canvas
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    
    // Set background color
    context.fillStyle = canvasState.backgroundColor;
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    
    // Draw all elements
    canvasState.elements.forEach(element => {
      drawElement(context, element);
    });
    
    // Draw current element
    if (canvasState.currentElement) {
      drawElement(context, canvasState.currentElement);
    }
  }, [canvasState]);
  
  return (
    <canvas
      ref={canvasRef}
      className="drawing-canvas"
      style={{ 
        backgroundColor: canvasState.backgroundColor,
        cursor: getCursor(canvasState.tool)
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onDoubleClick={onDoubleClick}
    />
  );
};

export default DrawingTools;