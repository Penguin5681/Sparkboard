import { Point, DrawingElement, CanvasState, Tool } from '../types/drawingTypes';

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
      return { ...base, type: 'text', text: 'Click to type', fontSize };
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
  element: DrawingElement
) => {
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
      context.strokeRect(
        element.points[0].x,
        element.points[0].y,
        element.width,
        element.height
      );
      break;
    
    case 'circle':
      context.beginPath();
      context.arc(
        element.points[0].x,
        element.points[0].y,
        element.radius,
        0,
        Math.PI * 2
      );
      context.stroke();
      break;
    
    case 'line':
      context.beginPath();
      context.moveTo(element.points[0].x, element.points[0].y);
      context.lineTo(element.endX, element.endY);
      context.stroke();
      break;
    
    case 'arrow':
      context.beginPath();
      context.moveTo(element.points[0].x, element.points[0].y);
      context.lineTo(element.endX, element.endY);
      
      // Draw arrow head
      const angle = Math.atan2(
        element.endY - element.points[0].y,
        element.endX - element.points[0].x
      );
      const headLength = 15;
      
      context.lineTo(
        element.endX - headLength * Math.cos(angle - Math.PI / 6),
        element.endY - headLength * Math.sin(angle - Math.PI / 6)
      );
      context.moveTo(element.endX, element.endY);
      context.lineTo(
        element.endX - headLength * Math.cos(angle + Math.PI / 6),
        element.endY - headLength * Math.sin(angle + Math.PI / 6)
      );
      context.stroke();
      break;
    
    case 'text':
      context.font = `${element.fontSize}px Arial`;
      context.fillStyle = element.color;
      context.fillText(
        element.text,
        element.points[0].x,
        element.points[0].y
      );
      break;
  }
};

export const getCursor = (tool: Tool) => {
  switch (tool) {
    case 'pen': return 'crosshair';
    case 'eraser': return 'cell';
    case 'text': return 'text';
    case 'select': return 'default';
    default: return 'crosshair';
  }
};