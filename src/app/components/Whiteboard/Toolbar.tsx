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
  undo,
  redo,
  canUndo,
  canRedo,
}) => {
  const tools: Tool[] = ['pen', 'rectangle', 'circle', 'line', 'arrow', 'text', 'eraser', 'select'];
  
  return (
    <div className="toolbar">
      <div className="tool-section">
        <button 
          onClick={undo} 
          disabled={!canUndo}
          className={!canUndo ? 'disabled' : ''}
        >
          Undo
        </button>
        <button 
          onClick={redo} 
          disabled={!canRedo}
          className={!canRedo ? 'disabled' : ''}
        >
          Redo
        </button>
      </div>
      
      <div className="tool-section">
        {tools.map((t) => (
          <button
            key={t}
            className={tool === t ? 'active' : ''}
            onClick={() => setTool(t)}
            title={t.charAt(0).toUpperCase() + t.slice(1)}
          >
            {t === 'pen' && '✏️'}
            {t === 'rectangle' && '▭'}
            {t === 'circle' && '●'}
            {t === 'line' && '─'}
            {t === 'arrow' && '→'}
            {t === 'text' && 'T'}
            {t === 'eraser' && '🧹'}
            {t === 'select' && '☝️'}
          </button>
        ))}
      </div>
      
      <div className="tool-section">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        
        <label>
          Stroke:
          <input
            type="range"
            min="1"
            max="50"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
          />
          {strokeWidth}px
        </label>
        
        {tool === 'text' && (
          <label>
            Font:
            <input
              type="range"
              min="12"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
            />
            {fontSize}px
          </label>
        )}
      </div>
    </div>
  );
};

export default Toolbar;