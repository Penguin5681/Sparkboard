'use client';

import React, { useState } from 'react';
import { Tool, BackgroundSettings, BackgroundPattern } from '../../types/drawingTypes';

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
  const [showBackgroundPanel, setShowBackgroundPanel] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  const patterns: { value: BackgroundPattern; label: string; icon: string }[] = [
    { value: 'none', label: 'None', icon: '⬜' },
    { value: 'grid', label: 'Grid', icon: '⊞' },
    { value: 'dots', label: 'Dots', icon: '⚈' },
    { value: 'lines', label: 'Lines', icon: '≡' },
  ];
  
  return (
    <>
      <div className={`floating-toolbar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="toolbar-header">
          <button 
            className="collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand toolbar' : 'Collapse toolbar'}
          >
            {isCollapsed ? '⊕' : '⊖'}
          </button>
          {!isCollapsed && <span className="toolbar-title">Sparkboard</span>}
        </div>

        {!isCollapsed && (
          <>
            {/* Undo/Redo Section */}
            <div className="toolbar-section">
              <button 
                onClick={undo} 
                disabled={!canUndo}
                className={`toolbar-btn ${!canUndo ? 'disabled' : ''}`}
                title="Undo (Ctrl+Z)"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7v6h6"/>
                  <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>
                </svg>
              </button>
              <button 
                onClick={redo} 
                disabled={!canRedo}
                className={`toolbar-btn ${!canRedo ? 'disabled' : ''}`}
                title="Redo (Ctrl+Y)"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 7v6h-6"/>
                  <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"/>
                </svg>
              </button>
            </div>

            {/* Tools Section */}
            <div className="toolbar-section tools-grid">
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

            {/* Color and Settings Section */}
            <div className="toolbar-section">
              <div className="setting-group">
                <label>Stroke</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="color-input"
                />
              </div>
              
              <div className="setting-group">
                <label>Width</label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                  className="range-input"
                />
                <span className="value-display">{strokeWidth}</span>
              </div>
              
              {tool === 'text' && (
                <div className="setting-group">
                  <label>Font Size</label>
                  <input
                    type="range"
                    min="12"
                    max="72"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="range-input"
                  />
                  <span className="value-display">{fontSize}</span>
                </div>
              )}
            </div>

            {/* Background Section */}
            <div className="toolbar-section">
              <button
                className="toolbar-btn settings-btn"
                onClick={() => setShowBackgroundPanel(!showBackgroundPanel)}
                title="Background Settings"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="9" cy="9" r="2"/>
                  <path d="M21 15l-3.086-3.086a2 2 0 00-2.828 0L6 21"/>
                </svg>
                Background
              </button>
            </div>
          </>
        )}
      </div>

      {/* Background Settings Panel */}
      {showBackgroundPanel && (
        <div className="background-panel">
          <div className="panel-header">
            <h3>Background Settings</h3>
            <button onClick={() => setShowBackgroundPanel(false)}>×</button>
          </div>
          
          <div className="setting-group">
            <label>Background Color</label>
            <input
              type="color"
              value={backgroundSettings.color}
              onChange={(e) => setBackgroundSettings({
                ...backgroundSettings,
                color: e.target.value
              })}
              className="color-input"
            />
          </div>

          <div className="setting-group">
            <label>Pattern</label>
            <div className="pattern-grid">
              {patterns.map((pattern) => (
                <button
                  key={pattern.value}
                  className={`pattern-btn ${backgroundSettings.pattern === pattern.value ? 'active' : ''}`}
                  onClick={() => setBackgroundSettings({
                    ...backgroundSettings,
                    pattern: pattern.value
                  })}
                  title={pattern.label}
                >
                  <span className="pattern-icon">{pattern.icon}</span>
                  <span className="pattern-label">{pattern.label}</span>
                </button>
              ))}
            </div>
          </div>

          {backgroundSettings.pattern !== 'none' && (
            <>
              <div className="setting-group">
                <label>Pattern Color</label>
                <input
                  type="color"
                  value={backgroundSettings.patternColor}
                  onChange={(e) => setBackgroundSettings({
                    ...backgroundSettings,
                    patternColor: e.target.value
                  })}
                  className="color-input"
                />
              </div>

              <div className="setting-group">
                <label>Pattern Size</label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={backgroundSettings.patternSize}
                  onChange={(e) => setBackgroundSettings({
                    ...backgroundSettings,
                    patternSize: parseInt(e.target.value)
                  })}
                  className="range-input"
                />
                <span className="value-display">{backgroundSettings.patternSize}</span>
              </div>

              <div className="setting-group">
                <label>Pattern Opacity</label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={backgroundSettings.patternOpacity}
                  onChange={(e) => setBackgroundSettings({
                    ...backgroundSettings,
                    patternOpacity: parseFloat(e.target.value)
                  })}
                  className="range-input"
                />
                <span className="value-display">{Math.round(backgroundSettings.patternOpacity * 100)}%</span>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default FloatingToolbar;
