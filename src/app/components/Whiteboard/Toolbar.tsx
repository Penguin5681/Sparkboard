import React from 'react';
import { Tool } from '../../types/drawingTypes';

interface ToolbarProps {
  tool: Tool;
  setTool: (tool: Tool) => void;
  color: string;
  setColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

// ... existing code ...

const Toolbar: React.FC<ToolbarProps> = ({
  tool,
  setTool,
  color,
  setColor,
  strokeWidth,
  setStrokeWidth,
  fontSize,
  setFontSize,
  backgroundColor,
  setBackgroundColor,
  undo,
  redo,
  canUndo,
  canRedo,
}) => {
  const tools: Tool[] = ['pen', 'rectangle', 'circle', 'line', 'arrow', 'text', 'eraser', 'select'];
  
  const getToolIcon = (toolType: Tool) => {
    switch (toolType) {
      case 'pen': return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
        </svg>
      );
      case 'rectangle': return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        </svg>
      );
      case 'circle': return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
        </svg>
      );
      case 'line': return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14"/>
        </svg>
      );
      case 'arrow': return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14"/>
          <path d="M12 5l7 7-7 7"/>
        </svg>
      );
      case 'text': return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="4,7 4,4 20,4 20,7"/>
          <line x1="9" y1="20" x2="15" y2="20"/>
          <line x1="12" y1="4" x2="12" y2="20"/>
        </svg>
      );
      case 'eraser': return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 20H10l4.5-4.5L19 11a2.828 2.828 0 1 0-4-4l-4.5 4.5L7 8"/>
          <path d="M9 13l-3 3"/>
        </svg>
      );
      case 'select': return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
        </svg>
      );
      default: return toolType;
    }
  };
  
  return (
    <div className="toolbar">
      <div className="tool-section">
        <button 
          onClick={undo} 
          disabled={!canUndo}
          className={`toolbar-btn ${!canUndo ? 'disabled' : ''}`}
          title="Undo"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v6h6"/>
            <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>
          </svg>
        </button>
        <button 
          onClick={redo} 
          disabled={!canRedo}
          className={`toolbar-btn ${!canRedo ? 'disabled' : ''}`}
          title="Redo"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 7v6h-6"/>
            <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"/>
          </svg>
        </button>
      </div>
      
      <div className="tool-section">
        {tools.map((t) => (
          <button
            key={t}
            className={`toolbar-btn tool-btn ${tool === t ? 'active' : ''}`}
            onClick={() => setTool(t)}
            title={t.charAt(0).toUpperCase() + t.slice(1)}
          >
            {getToolIcon(t)}
          </button>
        ))}
      </div>
      
      <div className="tool-section">
        <div className="color-picker-container">
          <label htmlFor="stroke-color">Stroke Color:</label>
          <input
            id="stroke-color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="color-picker"
          />
        </div>
        
        <div className="color-picker-container">
          <label htmlFor="bg-color">Background:</label>
          <input
            id="bg-color"
            type="color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="color-picker"
          />
        </div>
        
        <div className="slider-container">
          <label>
            Stroke Width: {strokeWidth}px
            <input
              type="range"
              min="1"
              max="50"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
              className="slider"
            />
          </label>
        </div>
        
        {tool === 'text' && (
          <div className="slider-container">
            <label>
              Font Size: {fontSize}px
              <input
                type="range"
                min="12"
                max="72"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="slider"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

export default Toolbar;