import { BackgroundSettings } from '../types/drawingTypes';

export const drawBackgroundPattern = (
  context: CanvasRenderingContext2D,
  settings: BackgroundSettings,
  camera: { x: number; y: number; scale: number },
  canvasWidth: number,
  canvasHeight: number
) => {
  // Fill background color
  context.fillStyle = settings.color;
  context.fillRect(0, 0, canvasWidth, canvasHeight);

  if (settings.pattern === 'none') return;

  context.save();
  
  // Apply camera transformation for pattern
  context.translate(camera.x, camera.y);
  context.scale(camera.scale, camera.scale);
  
  // Set pattern style
  context.strokeStyle = settings.patternColor;
  context.globalAlpha = settings.patternOpacity;
  context.lineWidth = 1 / camera.scale;

  const size = settings.patternSize;
  
  // Calculate visible area in canvas coordinates
  const startX = Math.floor((-camera.x / camera.scale - size) / size) * size;
  const endX = Math.ceil((canvasWidth - camera.x) / camera.scale / size) * size;
  const startY = Math.floor((-camera.y / camera.scale - size) / size) * size;
  const endY = Math.ceil((canvasHeight - camera.y) / camera.scale / size) * size;

  switch (settings.pattern) {
    case 'grid':
      context.beginPath();
      // Vertical lines
      for (let x = startX; x <= endX; x += size) {
        context.moveTo(x, startY);
        context.lineTo(x, endY);
      }
      // Horizontal lines
      for (let y = startY; y <= endY; y += size) {
        context.moveTo(startX, y);
        context.lineTo(endX, y);
      }
      context.stroke();
      break;

    case 'dots':
      context.fillStyle = settings.patternColor;
      const dotRadius = 1 / camera.scale;
      for (let x = startX; x <= endX; x += size) {
        for (let y = startY; y <= endY; y += size) {
          context.beginPath();
          context.arc(x, y, dotRadius, 0, Math.PI * 2);
          context.fill();
        }
      }
      break;

    case 'lines':
      context.beginPath();
      // Only horizontal lines
      for (let y = startY; y <= endY; y += size) {
        context.moveTo(startX, y);
        context.lineTo(endX, y);
      }
      context.stroke();
      break;
  }
  
  context.restore();
};
