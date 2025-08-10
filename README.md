# SparkBoard - Advanced Interactive Whiteboard Application

A modern, feature-rich infinite whiteboard application built with Next.js, TypeScript, and HTML5 Canvas, inspired by tools like Excalidraw.

## ✨ Key Features

### 🎨 Drawing Tools
- **Pen Tool**: Freehand drawing with customizable stroke width and color
- **Shapes**: Rectangle, circle, line, and arrow tools
- **Text Tool**: Add text by double-clicking anywhere on the canvas with inline editing
- **Eraser**: Remove parts of drawings
- **Select Tool**: Select, move, and manipulate drawings

### 🖼️ Infinite Canvas
- **Infinite Workspace**: Draw without boundaries - the canvas extends infinitely
- **Smooth Panning**: Navigate using:
  - Middle mouse button + drag
  - Spacebar + left mouse drag
- **Zoom**: Mouse wheel to zoom in/out with smart focal point
- **Return to Content**: Automatic button appears when you're far from your drawings

### 🎯 Advanced Interaction
- **Direct Text Input**: Double-click anywhere to add text at that exact position
- **Inline Text Editing**: Edit text directly on the canvas with a floating input
- **Element Selection**: Click on any drawing to select it
- **Drag and Drop**: Move selected elements around the canvas
- **Smart Cursor**: Context-aware cursor changes based on current tool and state

### 🎨 Enhanced UI Features
- **Modern Toolbar**: Clean, intuitive interface with professional SVG icons
- **Customizable Background**: Change canvas background color (defaults to black, persists across sessions)
- **Dual Color Controls**: Separate color pickers for stroke and background
- **Responsive Controls**: 
  - Stroke width (1-50px)
  - Font size for text (12-72px)
- **Visual Feedback**: Hover effects, active states, and selection indicators

### 💾 User Experience
- **Undo/Redo**: Full history management with visual feedback
- **Persistent Settings**: Background color and preferences saved locally
- **Keyboard Shortcuts**: Spacebar for panning mode
- **Context Prevention**: Right-click context menu disabled for smooth interaction
- **Selection Indicators**: Visual feedback for selected elements

## 🚀 Getting Started

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

## 🎮 Usage Guide

### Drawing
1. Select a tool from the toolbar
2. Click and drag on the canvas to draw
3. Use the color picker to change stroke color
4. Adjust stroke width with the slider

### Adding Text
1. Double-click anywhere on the canvas (works with any tool)
2. Type your text in the inline editor
3. Press Enter to confirm or Escape to cancel
4. Text appears exactly where you double-clicked

### Navigation
- **Pan**: Hold middle mouse button or spacebar + left mouse and drag
- **Zoom**: Use mouse wheel to zoom in/out
- **Return**: Click "Return to Content" when you're far from your drawings

### Selection and Manipulation
1. Select the **Select Tool** from the toolbar
2. Click on any element to select it (blue dashed outline appears)
3. Drag selected elements to move them around
4. Click elsewhere to deselect

### Customizing Workspace
1. Use the background color picker in the toolbar
2. Your preference saves automatically
3. The background persists across browser sessions

### Undo/Redo
- Use the undo/redo buttons in the toolbar
- Visual feedback shows when actions are available
- Full history tracking for all operations

## 🏗️ Technical Architecture

### Project Structure

```
src/
├── app/
│   ├── components/
│   │   └── Whiteboard/
│   │       ├── Whiteboard.tsx        # Main component with infinite canvas
│   │       ├── Toolbar.tsx           # Enhanced toolbar with icons
│   │       ├── DrawingTools.tsx      # Canvas rendering with camera system
│   │       ├── TextInput.tsx         # Inline text editing component
│   │       └── index.ts
│   ├── lib/
│   │   └── drawingUtils.ts           # Core drawing utilities and transformations
│   ├── types/
│   │   └── drawingTypes.ts           # TypeScript definitions with camera state
│   ├── globals.css                   # Enhanced styling with animations
│   ├── layout.tsx
│   └── page.tsx
└── backend/
    └── index.ts                      # Express server (for future features)
```

### Key Technical Features

#### Camera System
- **Viewport Transformation**: All drawing coordinates transformed through camera system
- **Screen-to-Canvas Mapping**: Accurate coordinate conversion for infinite canvas
- **Zoom Management**: Maintains drawing accuracy at all zoom levels

#### Element Management
- **Selection System**: Point-in-element detection for all shape types
- **Drag Operations**: Real-time element transformation during movement
- **History Management**: Comprehensive undo/redo with state snapshots

#### Text System
- **Inline Editing**: Floating textarea positioned at exact click location
- **Camera-Aware Rendering**: Text scales and positions correctly with zoom/pan
- **Smart Input Handling**: Enter/Escape key handling with auto-save

## 🆕 Recent Major Updates

### Advanced Canvas Features
1. **Infinite Canvas Implementation**:
   - Camera system with position and scale
   - Smooth panning with multiple input methods
   - Zoom with focal point preservation

2. **Enhanced Text System**:
   - Direct double-click text placement
   - Inline editing with floating input
   - Proper camera-space rendering

3. **Selection and Manipulation**:
   - Element selection with visual feedback
   - Drag-and-drop functionality
   - Smart cursor feedback

4. **Navigation Aids**:
   - "Return to Content" button for lost users
   - Distance-based content detection
   - Smooth camera transitions

5. **Improved User Experience**:
   - Keyboard shortcuts (spacebar for pan mode)
   - Context menu prevention
   - Multi-input panning support

### UI/UX Enhancements
- **Professional Icons**: SVG-based tool icons
- **Smart Cursor System**: Context-aware cursor changes
- **Enhanced Visual Feedback**: Selection outlines and hover effects
- **Responsive Design**: Improved layout and controls

## 🔮 Future Enhancements

- **Real-time Collaboration**: Multi-user editing with WebSocket
- **Advanced Selection**: Multi-select with Ctrl+click and selection rectangle
- **Shape Resizing**: Corner handles for resizing selected elements
- **Layer System**: Z-index management with bring-to-front/back
- **Export Options**: PNG, SVG, PDF export functionality
- **Templates**: Pre-built templates and shape libraries
- **Touch Support**: Full mobile and tablet compatibility
- **Snap-to-Grid**: Alignment helpers and grid system
- **Advanced Text**: Rich text formatting and fonts

## 🛠️ Development

### Core Components

1. **Whiteboard.tsx**: Main orchestrator handling:
   - Canvas state management
   - Event handling (mouse, keyboard, wheel)
   - Camera transformations
   - History management

2. **DrawingTools.tsx**: Canvas renderer handling:
   - Element drawing with camera transformations
   - Canvas setup and management
   - Event forwarding to main component

3. **TextInput.tsx**: Inline text editor providing:
   - Floating input positioned in camera space
   - Real-time text editing
   - Keyboard event handling

4. **drawingUtils.ts**: Core utilities including:
   - Element creation and manipulation
   - Camera coordinate transformations
   - Hit testing and bounds calculation
   - Drawing functions with camera support

### Key Algorithms

- **Coordinate Transformation**: Screen ↔ Canvas coordinate mapping
- **Hit Testing**: Point-in-element detection for various shapes
- **Camera Movement**: Smooth panning with momentum
- **Element Bounds**: Accurate bounding box calculation for all shapes

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Update documentation
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.
