import { Point, DrawingElement, CanvasState, Tool } from '../types/drawingTypes';

export const screenToCanvas = (
  screenPoint: Point,
  camera: { x: number; y: number; scale: number }
): Point => {
  return {
    x: (screenPoint.x - camera.x) / camera.scale,
    y: (screenPoint.y - camera.y) / camera.scale,
  };
};

export const canvasToScreen = (
  canvasPoint: Point,
  camera: { x: number; y: number; scale: number }
): Point => {
  return {
    x: canvasPoint.x * camera.scale + camera.x,
    y: canvasPoint.y * camera.scale + camera.y,
  };
};

export const isPointInElement = (point: Point, element: DrawingElement): boolean => {
  const tolerance = 5;
  
  switch (element.type) {
    case 'pen':
    case 'eraser':
      return element.points.some(p => 
        Math.abs(p.x - point.x) < tolerance && Math.abs(p.y - point.y) < tolerance
      );
    
    case 'rectangle':
      const rect = element as any;
      return point.x >= Math.min(element.points[0].x, element.points[0].x + rect.width) &&
             point.x <= Math.max(element.points[0].x, element.points[0].x + rect.width) &&
             point.y >= Math.min(element.points[0].y, element.points[0].y + rect.height) &&
             point.y <= Math.max(element.points[0].y, element.points[0].y + rect.height);
    
    case 'circle':
      const circle = element as any;
      const distance = Math.sqrt(
        Math.pow(point.x - element.points[0].x, 2) + 
        Math.pow(point.y - element.points[0].y, 2)
      );
      return Math.abs(distance - circle.radius) < tolerance;
    
    case 'line':
    case 'arrow':
      const line = element as any;
      const lineDistance = distanceToLineSegment(
        point,
        element.points[0],
        { x: line.endX, y: line.endY }
      );
      return lineDistance < tolerance;
    
    case 'text':
      const text = element as any;
      const textWidth = text.width || text.text.length * text.fontSize * 0.6;
      const textHeight = text.height || text.fontSize;
      return point.x >= element.points[0].x &&
             point.x <= element.points[0].x + textWidth &&
             point.y >= element.points[0].y - textHeight &&
             point.y <= element.points[0].y;
    
    default:
      return false;
  }
};

const distanceToLineSegment = (point: Point, start: Point, end: Point): number => {
  const A = point.x - start.x;
  const B = point.y - start.y;
  const C = end.x - start.x;
  const D = end.y - start.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = start.x;
    yy = start.y;
  } else if (param > 1) {
    xx = end.x;
    yy = end.y;
  } else {
    xx = start.x + param * C;
    yy = start.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
};

export const createElement = (
  tool: Tool,
  startPoint: Point,
  color: string,
  strokeWidth: number,
  fontSize: number
): DrawingElement => {
  const id = Date.now().toString();
  const base = { id, type: tool, color, strokeWidth, points: [startPoint] };

  switch (tool) {
    case 'pen':
    case 'eraser':
      return { ...base, type: tool };
    case 'rectangle':
      return { ...base, type: 'rectangle', width: 0, height: 0 };
    case 'circle':
      return { ...base, type: 'circle', radius: 0 };
    case 'line':
    case 'arrow':
      return { ...base, type: tool, endX: startPoint.x, endY: startPoint.y };
    case 'text':
      return { ...base, type: 'text', text: '', fontSize };
    default:
      return { ...base, type: 'pen' };
  }
};

export const updateElement = (
  element: DrawingElement,
  currentPoint: Point,
  startPoint: Point
): DrawingElement => {
  switch (element.type) {
    case 'pen':
    case 'eraser':
      return {
        ...element,
        points: [...element.points, currentPoint]
      };
    case 'rectangle':
      return {
        ...element,
        width: currentPoint.x - startPoint.x,
        height: currentPoint.y - startPoint.y
      };
    case 'circle':
      const radius = Math.sqrt(
        Math.pow(currentPoint.x - startPoint.x, 2) + 
        Math.pow(currentPoint.y - startPoint.y, 2)
      );
      return { ...element, radius };
    case 'line':
    case 'arrow':
      return {
        ...element,
        endX: currentPoint.x,
        endY: currentPoint.y
      };
    default:
      return element;
  }
};

export const drawElement = (
  context: CanvasRenderingContext2D,
  element: DrawingElement,
  camera: { x: number; y: number; scale: number } = { x: 0, y: 0, scale: 1 }
) => {
  context.save();
  
  // Apply camera transformation
  context.translate(camera.x, camera.y);
  context.scale(camera.scale, camera.scale);
  
  context.strokeStyle = element.color;
  context.lineWidth = element.strokeWidth;
  context.lineCap = 'round';
  context.lineJoin = 'round';

  switch (element.type) {
    case 'pen':
      context.beginPath();
      element.points.forEach((point, i) => {
        if (i === 0) {
          context.moveTo(point.x, point.y);
        } else {
          context.lineTo(point.x, point.y);
        }
      });
      context.stroke();
      break;
    
    case 'eraser':
      context.globalCompositeOperation = 'destination-out';
      context.beginPath();
      element.points.forEach((point, i) => {
        if (i === 0) {
          context.moveTo(point.x, point.y);
        } else {
          context.lineTo(point.x, point.y);
        }
      });
      context.stroke();
      context.globalCompositeOperation = 'source-over';
      break;
    
    case 'rectangle':
      const rect = element as any;
      context.strokeRect(
        element.points[0].x,
        element.points[0].y,
        rect.width,
        rect.height
      );
      break;
    
    case 'circle':
      const circle = element as any;
      context.beginPath();
      context.arc(
        element.points[0].x,
        element.points[0].y,
        circle.radius,
        0,
        Math.PI * 2
      );
      context.stroke();
      break;
    
    case 'line':
      const line = element as any;
      context.beginPath();
      context.moveTo(element.points[0].x, element.points[0].y);
      context.lineTo(line.endX, line.endY);
      context.stroke();
      break;
    
    case 'arrow':
      const arrow = element as any;
      context.beginPath();
      context.moveTo(element.points[0].x, element.points[0].y);
      context.lineTo(arrow.endX, arrow.endY);
      
      // Draw arrow head
      const angle = Math.atan2(
        arrow.endY - element.points[0].y,
        arrow.endX - element.points[0].x
      );
      const headLength = 15;
      
      context.lineTo(
        arrow.endX - headLength * Math.cos(angle - Math.PI / 6),
        arrow.endY - headLength * Math.sin(angle - Math.PI / 6)
      );
      context.moveTo(arrow.endX, arrow.endY);
      context.lineTo(
        arrow.endX - headLength * Math.cos(angle + Math.PI / 6),
        arrow.endY - headLength * Math.sin(angle + Math.PI / 6)
      );
      context.stroke();
      break;
    
    case 'text':
      const text = element as any;
      context.font = `${text.fontSize}px Arial`;
      context.fillStyle = element.color;
      context.fillText(
        text.text || '',
        element.points[0].x,
        element.points[0].y
      );
      break;
  }
  
  // Draw selection box if selected
  if ((element as any).selected) {
    context.strokeStyle = '#007acc';
    context.lineWidth = 2 / camera.scale;
    context.setLineDash([5 / camera.scale, 5 / camera.scale]);
    
    // Get element bounds
    const bounds = getElementBounds(element);
    context.strokeRect(
      bounds.x - 5,
      bounds.y - 5,
      bounds.width + 10,
      bounds.height + 10
    );
    context.setLineDash([]);
  }
  
  context.restore();
};

export const getElementBounds = (element: DrawingElement) => {
  switch (element.type) {
    case 'pen':
    case 'eraser':
      const xs = element.points.map(p => p.x);
      const ys = element.points.map(p => p.y);
      return {
        x: Math.min(...xs),
        y: Math.min(...ys),
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys)
      };
    
    case 'rectangle':
      const rect = element as any;
      return {
        x: Math.min(element.points[0].x, element.points[0].x + rect.width),
        y: Math.min(element.points[0].y, element.points[0].y + rect.height),
        width: Math.abs(rect.width),
        height: Math.abs(rect.height)
      };
    
    case 'circle':
      const circle = element as any;
      return {
        x: element.points[0].x - circle.radius,
        y: element.points[0].y - circle.radius,
        width: circle.radius * 2,
        height: circle.radius * 2
      };
    
    case 'line':
    case 'arrow':
      const line = element as any;
      return {
        x: Math.min(element.points[0].x, line.endX),
        y: Math.min(element.points[0].y, line.endY),
        width: Math.abs(line.endX - element.points[0].x),
        height: Math.abs(line.endY - element.points[0].y)
      };
    
    case 'text':
      const text = element as any;
      const textWidth = text.width || (text.text?.length || 0) * text.fontSize * 0.6;
      const textHeight = text.height || text.fontSize;
      return {
        x: element.points[0].x,
        y: element.points[0].y - textHeight,
        width: textWidth,
        height: textHeight
      };
    
    default:
      return { x: 0, y: 0, width: 0, height: 0 };
  }
};

export const getCursor = (tool: Tool, isPanning: boolean = false, isSpacePressed: boolean = false) => {
  if (isPanning) return 'grabbing';
  if (isSpacePressed) return 'grab';
  
  switch (tool) {
    case 'pen': return 'crosshair';
    case 'eraser': return 'cell';
    case 'text': return 'text';
    case 'select': return 'default';
    default: return 'crosshair';
  }
};