'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Point } from '../../types/drawingTypes';

interface TextInputProps {
  position: Point;
  fontSize: number;
  color: string;
  initialValue?: string;
  onSubmit: (text: string) => void;
  onCancel: () => void;
  camera: { x: number; y: number; scale: number };
}

const TextInput: React.FC<TextInputProps> = ({
  position,
  fontSize,
  color,
  initialValue = '',
  onSubmit,
  onCancel,
  camera
}) => {
  const [text, setText] = useState(initialValue);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation(); // Prevent global keyboard shortcuts while editing
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(text);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleBlur = () => {
    if (text.trim()) {
      onSubmit(text);
    } else {
      onCancel();
    }
  };

  // Convert canvas position to screen position
  const screenPosition = {
    x: position.x * camera.scale + camera.x,
    y: position.y * camera.scale + camera.y
  };

  return (
    <textarea
      ref={inputRef}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      style={{
        position: 'absolute',
        left: screenPosition.x,
        top: screenPosition.y - (fontSize * camera.scale),
        fontSize: fontSize * camera.scale,
        color: color,
        background: 'rgba(255, 255, 255, 0.9)',
        border: '2px dashed #007acc',
        borderRadius: '4px',
        padding: '4px 8px',
        resize: 'none',
        outline: 'none',
        fontFamily: 'Arial, sans-serif',
        minWidth: '20px',
        minHeight: fontSize * camera.scale + 8,
        zIndex: 1000,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
        overflow: 'hidden'
      }}
      rows={1}
      autoComplete="off"
      spellCheck={false}
      placeholder="Type text..."
    />
  );
};

export default TextInput;
