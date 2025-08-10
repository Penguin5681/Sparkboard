'use client';

import React, { useState } from 'react';
import { Tool, BackgroundSettings } from '../../types/drawingTypes';

interface FloatingToolbarProps {
  tool: Tool;
  setTool: (tool: Tool) => void;
  color: string;
  setColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  backgroundSettings: BackgroundSettings;
  setBackgroundSettings: (settings: BackgroundSettings) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  tool,
  setTool,
  color,
  setColor,
  strokeWidth,
  setStrokeWidth,
  fontSize,
  setFontSize,
  backgroundSettings,
  setBackgroundSettings,
  undo,
  redo,
  canUndo,
  canRedo,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`floating-toolbar-top ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Main toolbar content */}
      <div className="toolbar-main">
        {/* Drawing Tools */}
        <div className="tool-group-horizontal">
          <button
            className={`tool-button-slim ${tool === 'pen' ? 'active' : ''}`}
            onClick={() => setTool('pen')}
            title="Pen"
          >
            ✏️
          </button>
          <button
            className={`tool-button-slim ${tool === 'rectangle' ? 'active' : ''}`}
            onClick={() => setTool('rectangle')}
            title="Rectangle"
          >
            ⬜
          </button>
          <button
            className={`tool-button-slim ${tool === 'circle' ? 'active' : ''}`}
            onClick={() => setTool('circle')}
            title="Circle"
          >
            ⭕
          </button>
          <button
            className={`tool-button-slim ${tool === 'line' ? 'active' : ''}`}
            onClick={() => setTool('line')}
            title="Line"
          >
            📏
          </button>
          <button
            className={`tool-button-slim ${tool === 'arrow' ? 'active' : ''}`}
            onClick={() => setTool('arrow')}
            title="Arrow"
          >
            ➡️
          </button>
          <button
            className={`tool-button-slim ${tool === 'text' ? 'active' : ''}`}
            onClick={() => setTool('text')}
            title="Text"
          >
            🔤
          </button>
          <button
            className={`tool-button-slim ${tool === 'eraser' ? 'active' : ''}`}
            onClick={() => setTool('eraser')}
            title="Eraser"
          >
            🧽
          </button>
          <button
            className={`tool-button-slim ${tool === 'select' ? 'active' : ''}`}
            onClick={() => setTool('select')}
            title="Select"
          >
            👆
          </button>
        </div>

        <div className="toolbar-divider"></div>

        {/* Color and Stroke Controls */}
        <div className="control-group-horizontal">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="color-input-slim"
            title="Drawing Color"
          />
          <div className="slider-control-slim">
            <span className="control-label">Stroke:</span>
            <input
              type="range"
              min="1"
              max="20"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="slider-slim"
            />
            <span className="control-value">{strokeWidth}</span>
          </div>
          <div className="slider-control-slim">
            <span className="control-label">Font:</span>
            <input
              type="range"
              min="12"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="slider-slim"
            />
            <span className="control-value">{fontSize}</span>
          </div>
        </div>

        <div className="toolbar-divider"></div>

        {/* Background Controls */}
        <div className="control-group-horizontal">
          <input
            type="color"
            value={backgroundSettings.color}
            onChange={(e) => setBackgroundSettings({
              ...backgroundSettings,
              color: e.target.value
            })}
            className="color-input-slim"
            title="Background Color"
          />
          <div className="pattern-group-horizontal">
            {(['none', 'grid', 'dots', 'lines'] as const).map((pattern) => (
              <button
                key={pattern}
                className={`pattern-button-slim ${backgroundSettings.pattern === pattern ? 'active' : ''}`}
                onClick={() => setBackgroundSettings({
                  ...backgroundSettings,
                  pattern
                })}
                title={`${pattern.charAt(0).toUpperCase()}${pattern.slice(1)} Pattern`}
              >
                {pattern === 'none' ? '○' : 
                 pattern === 'grid' ? '⊞' :
                 pattern === 'dots' ? '⋯' : '≡'}
              </button>
            ))}
          </div>
        </div>

        <div className="toolbar-divider"></div>

        {/* Action Buttons */}
        <div className="action-group-horizontal">
          <button
            className="action-button-slim"
            onClick={undo}
            disabled={!canUndo}
            title="Undo"
          >
            ↶
          </button>
          <button
            className="action-button-slim"
            onClick={redo}
            disabled={!canRedo}
            title="Redo"
          >
            ↷
          </button>
        </div>

        {/* Collapse Toggle */}
        <div className="toolbar-divider"></div>
        <button
          className="toolbar-toggle-slim"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand toolbar' : 'Collapse toolbar'}
        >
          {isCollapsed ? '▼' : '▲'}
        </button>
      </div>
      
      {/* Expanded settings panel */}
      {!isCollapsed && (
        <div className="toolbar-expanded">
          {backgroundSettings.pattern !== 'none' && (
            <div className="expanded-controls">
              <div className="control-row">
                <span className="control-label">Pattern Color:</span>
                <input
                  type="color"
                  value={backgroundSettings.patternColor}
                  onChange={(e) => setBackgroundSettings({
                    ...backgroundSettings,
                    patternColor: e.target.value
                  })}
                  className="color-input-slim"
                  title="Pattern Color"
                />
              </div>
              <div className="control-row">
                <span className="control-label">Size:</span>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={backgroundSettings.patternSize}
                  onChange={(e) => setBackgroundSettings({
                    ...backgroundSettings,
                    patternSize: Number(e.target.value)
                  })}
                  className="slider-slim"
                />
                <span className="control-value">{backgroundSettings.patternSize}px</span>
              </div>
              <div className="control-row">
                <span className="control-label">Opacity:</span>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={backgroundSettings.patternOpacity}
                  onChange={(e) => setBackgroundSettings({
                    ...backgroundSettings,
                    patternOpacity: Number(e.target.value)
                  })}
                  className="slider-slim"
                />
                <span className="control-value">{Math.round(backgroundSettings.patternOpacity * 100)}%</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FloatingToolbar;
