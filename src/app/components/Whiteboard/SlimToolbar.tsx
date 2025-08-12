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
  // Collaboration props
  onStartSession?: () => void;
  onJoinSession?: (sessionId: string) => void;
  onLeaveSession?: () => void;
  sessionInfo?: {
    sessionId: string | null;
    isHost: boolean;
    participantCount: number;
  };
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
  onStartSession,
  onJoinSession,
  onLeaveSession,
  sessionInfo,
}) => {
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [joinSessionId, setJoinSessionId] = useState('');

  return (
    <div className="floating-toolbar-top">
      {/* Main toolbar content */}
      <div className="toolbar-main">
        {/* Drawing Tools */}
        <div className="tool-group-horizontal">
          <button
            className={`tool-button-slim ${tool === 'pen' ? 'active' : ''}`}
            onClick={() => setTool('pen')}
            title="Draw"
          >
            ✏
          </button>
          <button
            className={`tool-button-slim ${tool === 'rectangle' ? 'active' : ''}`}
            onClick={() => setTool('rectangle')}
            title="Rectangle"
          >
            ▢
          </button>
          <button
            className={`tool-button-slim ${tool === 'circle' ? 'active' : ''}`}
            onClick={() => setTool('circle')}
            title="Circle"
          >
            ○
          </button>
          <button
            className={`tool-button-slim ${tool === 'line' ? 'active' : ''}`}
            onClick={() => setTool('line')}
            title="Line"
          >
            —
          </button>
          <button
            className={`tool-button-slim ${tool === 'arrow' ? 'active' : ''}`}
            onClick={() => setTool('arrow')}
            title="Arrow"
          >
            →
          </button>
          <button
            className={`tool-button-slim ${tool === 'text' ? 'active' : ''}`}
            onClick={() => setTool('text')}
            title="Text"
          >
            T
          </button>
          <button
            className={`tool-button-slim ${tool === 'eraser' ? 'active' : ''}`}
            onClick={() => setTool('eraser')}
            title="Eraser"
          >
            ⌫
          </button>
          <button
            className={`tool-button-slim ${tool === 'select' ? 'active' : ''}`}
            onClick={() => setTool('select')}
            title="Select"
          >
            ⟐
          </button>
        </div>

        <div className="toolbar-divider"></div>

        {/* Color and Size Controls */}
        <div className="control-group-horizontal">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="color-input-slim"
            title="Color"
          />
          <div className="slider-control-slim">
            <span className="control-label">Size:</span>
            <input
              type="range"
              min="1"
              max="60"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="slider-slim"
            />
            <span className="control-value">{strokeWidth}</span>
          </div>
          <input
            type="color"
            value={backgroundSettings.color}
            onChange={(e) => setBackgroundSettings({
              ...backgroundSettings,
              color: e.target.value,
              pattern: 'none'
            })}
            className="color-input-slim"
            title="Background Color"
          />
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

        <div className="toolbar-divider"></div>

        {/* TODO: Implement this in the future */}
        {/* Collaboration Controls */}
        {/* <div className="collaboration-group">
          {!sessionInfo?.sessionId ? (
            <>
              <button
                className="collaboration-button"
                onClick={onStartSession}
                title="Start Collaboration Session"
              >
                🌐 Start
              </button>
              <button
                className="collaboration-button"
                onClick={() => setShowSessionDialog(true)}
                title="Join Session"
              >
                ↗ Join
              </button>
            </>
          ) : (
            <>
              <div className="session-info">
                <span className="session-id">Session: {sessionInfo.sessionId.slice(0, 8)}...</span>
                <span className="participant-count">{sessionInfo.participantCount} users</span>
              </div>
              <button
                className="collaboration-button leave"
                onClick={onLeaveSession}
                title="Leave Session"
              >
                ❌ Leave
              </button>
            </>
          )}
        </div> */}
      </div>

      {/* Join Session Dialog */}
      {showSessionDialog && (
        <div className="session-dialog">
          <div className="dialog-content">
            <h3>Join Session</h3>
            <input
              type="text"
              placeholder="Enter Session ID"
              value={joinSessionId}
              onChange={(e) => setJoinSessionId(e.target.value)}
              className="session-input"
            />
            <div className="dialog-buttons">
              <button
                onClick={() => {
                  if (joinSessionId.trim() && onJoinSession) {
                    onJoinSession(joinSessionId.trim());
                    setShowSessionDialog(false);
                    setJoinSessionId('');
                  }
                }}
                className="dialog-button primary"
              >
                Join
              </button>
              <button
                onClick={() => {
                  setShowSessionDialog(false);
                  setJoinSessionId('');
                }}
                className="dialog-button secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingToolbar;
