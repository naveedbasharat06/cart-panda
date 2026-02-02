# Funnel Builder - Cartpanda Practical Test

A drag-and-drop upsell funnel builder built with React, TypeScript, and React Flow.

**Live Demo:** [Deploy URL will be here]

**GitHub:** [Repository URL]

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Features

### Core Features (MVP)

- **Infinite Canvas** - Pan and zoom with grid background
- **5 Node Types** - Sales Page, Order Page, Upsell, Downsell, Thank You
- **Drag from Palette** - Drag node types from sidebar onto canvas
- **Visual Connections** - Connect nodes with animated arrows
- **Funnel Rules**:
  - Thank You pages cannot have outgoing edges
  - Sales Page shows warning if more than one outgoing edge
  - Auto-incrementing labels (Upsell 1, Upsell 2, etc.)
- **Persistence** - Auto-saves to localStorage
- **Export/Import** - Download and upload funnel as JSON

### Nice-to-Have Features Implemented

- Zoom controls
- Snap to grid (20px)
- Minimap
- Node deletion (Delete/Backspace key or button)
- Edge deletion (select and delete)
- Validation panel showing orphan nodes and rule violations

## Architecture Decisions

### Why React Flow?

React Flow is the industry standard for node-based editors:
- Battle-tested in production (used by Stripe, Zapier, etc.)
- Built-in pan/zoom, minimap, controls
- Excellent TypeScript support
- Handles edge rendering and routing
- Accessible out of the box

Alternative considered: Building from scratch with SVG/Canvas. Rejected because it would take significantly longer without providing meaningful differentiation.

### Why Zustand for State?

- Minimal boilerplate compared to Redux
- No providers needed (simpler component tree)
- Built-in persistence middleware available
- Easy to test and debug
- Small bundle size (~1KB)

### Component Structure

```
src/
├── components/
│   ├── nodes/
│   │   ├── FunnelNode.tsx    # Custom node component
│   │   └── index.ts          # Node type exports
│   ├── Palette.tsx           # Draggable node palette
│   ├── Toolbar.tsx           # Import/Export/Clear actions
│   └── ValidationPanel.tsx   # Shows funnel validation issues
├── store/
│   └── funnelStore.ts        # Zustand store with all state logic
├── types/
│   └── index.ts              # TypeScript types and configs
├── App.tsx                   # Main app with React Flow
└── main.tsx                  # Entry point
```

### State Management Pattern

All state lives in a single Zustand store (`funnelStore.ts`):
- `nodes` - Array of funnel nodes
- `edges` - Array of connections
- `nodeCounters` - Tracks count per node type for auto-labeling

Actions are co-located with state:
- `addNode`, `deleteNode`, `updateNodeLabel`
- `onConnect`, `onNodesChange`, `onEdgesChange`
- `saveToStorage`, `loadFromStorage`, `exportJSON`, `importJSON`
- `getValidationIssues` - Computed validation

### Persistence Strategy

- **localStorage** for auto-save (immediate, no network)
- **JSON export** for sharing/backup
- Auto-saves on every change (debounced 100ms)
- Loads from localStorage on mount

## Accessibility Notes

### WCAG Compliance

- **Keyboard Navigation**: All interactive elements are focusable and operable with keyboard
- **Focus Visible**: Custom focus rings for all interactive elements (`:focus-visible`)
- **Screen Reader Support**:
  - Proper ARIA labels on canvas, controls, and palette
  - `role="application"` on canvas with descriptive label
  - Live regions (`aria-live`) for validation feedback
- **Skip Link**: Skip to main content link for keyboard users

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Delete/Backspace | Remove selected nodes/edges |
| Shift + Click | Multi-select nodes |
| Double-click | Edit node label |
| Tab | Navigate between elements |

### Color Contrast

All text meets WCAG AA contrast requirements (4.5:1 minimum).

## Tradeoffs & Future Improvements

### What I'd Improve Next

1. **Undo/Redo** - Would add using Zustand's temporal middleware or custom history stack
2. **Keyboard node placement** - Add nodes via keyboard for full accessibility
3. **Mobile support** - Touch gestures for pan/zoom/drag (not prioritized for dashboard tool)
4. **Real-time collaboration** - Could integrate with Yjs/Liveblocks for multiplayer editing
5. **More validation rules** - Check for cycles, validate typical funnel flow patterns
6. **Node templates** - Pre-built funnel templates to start from

### Intentional Omissions

- **Backend/Auth** - Not required per brief
- **Real page editing** - Visual only per brief
- **Complex animations** - Kept minimal for performance
- **Dark/light theme toggle** - Single theme sufficient for test

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Flow** - Node-based editor
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Performance Considerations

- Memoized node components (`React.memo`)
- Debounced auto-save (100ms)
- Virtualized rendering via React Flow
- Minimal re-renders with Zustand selectors

## Testing Strategy

If I had more time, I would add:

- **Unit tests** - Zustand store logic (add node, connect, validate)
- **Component tests** - Node rendering, palette drag behavior
- **E2E tests** - Full funnel building workflow with Playwright

---

Built by Naveed for Cartpanda Lead Front-end Engineer application.
