# Hydra Development with Claude Code

## Development Workflow

### Running Dev Server (Non-blocking)
To start the development server without blocking Claude Code:
```bash
npm run dev &
```

### Stopping Dev Server
To stop the background dev server:
```bash
pkill -f "vite.*--host"
```

### Testing Changes
1. Start dev server in background: `npm run dev &`
2. Open http://localhost:5173/ in browser
3. Make code changes
4. Refresh browser to see updates
5. Stop server when done: `pkill -f "vite.*--host"`

### Build and Deploy
```bash
# Build for production
NODE_ENV=production npm run build

# Deploy to GitHub Pages
npm run publish
```

### Text Overlay Feature
- Toggle with text icon (📝) in toolbar
- Controls appear in lower right corner
- Text is rendered as hydra source (s0)
- Use in code: `src(s0).out()`

## Project Structure
- `src/views/TextOverlay.js` - Text overlay component
- `src/stores/store.js` - State management
- `public/css/style.css` - Styling
- `src/views/toolbar.js` - UI controls