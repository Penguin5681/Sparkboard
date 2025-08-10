# SparkBoard - Interactive Whiteboard Application

A modern, feature-rich whiteboard application built with Next.js, TypeScript, and HTML5 Canvas.

## Features

### Drawing Tools
- **Pen Tool**: Freehand drawing with customizable stroke width and color
- **Shapes**: Rectangle, circle, line, and arrow tools
- **Text Tool**: Add text by double-clicking anywhere on the canvas
- **Eraser**: Remove parts of drawings
- **Select Tool**: For future selection and manipulation features

### Enhanced UI Features
- **Modern Toolbar**: Clean, intuitive interface with SVG icons
- **Customizable Background**: Change canvas background color (defaults to black, remembers your preference)
- **Color Picker**: Separate color controls for stroke and background
- **Adjustable Settings**: 
  - Stroke width (1-50px)
  - Font size for text (12-72px)

### User Experience
- **Undo/Redo**: Full history management with visual feedback
- **Double-click Text**: Click anywhere on the canvas to add text at that position
- **Persistent Settings**: Background color preference is saved locally
- **Responsive Design**: Adapts to different screen sizes
- **Visual Feedback**: Hover effects and active states for all tools

### Technical Features
- Built with **Next.js 15** and **TypeScript**
- **HTML5 Canvas** for smooth drawing performance
- **Local Storage** for user preferences
- **Component-based architecture** for maintainability

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sparkboard
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Drawing
1. Select a tool from the toolbar
2. Click and drag on the canvas to draw
3. Use the color picker to change stroke color
4. Adjust stroke width with the slider

### Adding Text
1. Select the text tool or any tool
2. Double-click anywhere on the canvas
3. Enter your text in the prompt
4. Text will appear at the clicked position

### Customizing Background
1. Use the background color picker in the toolbar
2. Your preference will be saved automatically
3. The background will persist across sessions

### Undo/Redo
- Use the undo/redo buttons in the toolbar
- Visual feedback shows when actions are available
- Full history tracking for all drawing operations

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   └── Whiteboard/
│   │       ├── Whiteboard.tsx      # Main whiteboard component
│   │       ├── Toolbar.tsx         # Enhanced toolbar with icons
│   │       ├── DrawingTools.tsx    # Canvas rendering component
│   │       └── index.ts
│   ├── lib/
│   │   └── drawingUtils.ts         # Drawing utilities and functions
│   ├── types/
│   │   └── drawingTypes.ts         # TypeScript type definitions
│   ├── globals.css                 # Enhanced styling
│   ├── layout.tsx
│   └── page.tsx
└── backend/
    └── index.ts                    # Express server (for future features)
```

## Recent Improvements

1. **Enhanced Toolbar**: 
   - Modern SVG icons replacing emoji
   - Better visual hierarchy and spacing
   - Improved hover effects and active states

2. **Background Customization**:
   - Color picker for background
   - Local storage persistence
   - Default black background

3. **Improved Text Input**:
   - Double-click to add text anywhere
   - Better text positioning
   - Removed single-click text interference

4. **UI/UX Enhancements**:
   - Gradient backgrounds
   - Smooth animations and transitions
   - Better button styling and feedback
   - Responsive design improvements

## Future Features

- Real-time collaboration
- Save/load drawings
- Export to various formats
- More drawing tools and shapes
- Layers support
- Touch/mobile support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.
