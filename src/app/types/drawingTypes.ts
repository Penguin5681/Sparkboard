export type Tool = 
  | 'pen'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'arrow'
  | 'text'
  | 'eraser'
  | 'select';

export interface Point {
  x: number;
  y: number;
}

export interface BaseElement {
  id: string;
  type: Tool;
  color: string;
  strokeWidth: number;
  points: Point[];
}

export interface PenElement extends BaseElement {
  type: 'pen' | 'eraser';
}

export interface RectangleElement extends BaseElement {
  type: 'rectangle';
  width: number;
  height: number;
}

export interface CircleElement extends BaseElement {
  type: 'circle';
  radius: number;
}

export interface LineElement extends BaseElement {
  type: 'line' | 'arrow';
  endX: number;
  endY: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
}

export type DrawingElement = 
  | PenElement 
  | RectangleElement 
  | CircleElement 
  | LineElement 
  | TextElement;

export interface CanvasState {
  elements: DrawingElement[];
  selectedElement: DrawingElement | null;
  currentElement: DrawingElement | null;
  tool: Tool;
  color: string;
  strokeWidth: number;
  fontSize: number;
}