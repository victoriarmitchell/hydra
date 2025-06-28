import html from 'choo/html'
import Component from 'choo/component'

export default class TextOverlay extends Component {
  constructor(id, state, emit) {
    super(id)
    this.local = state.components[id] = {}
    this.state = state
    this.emit = emit
    
    // Text overlay properties
    this.canvas = null
    this.ctx = null
    this.textSource = null
    this.animationFrame = null
    
    // Default text properties
    this.defaultText = 'HYDRA'
    this.fontSize = 72
    this.fontFamily = 'monospace'
    this.textColor = 'white'
    this.backgroundColor = 'transparent'
    this.opacity = 1.0
    this.positionX = 0.5  // Center
    this.positionY = 0.5  // Center
    
    this.initTextCanvas()
  }

  initTextCanvas() {
    // Create hidden canvas for text rendering
    this.canvas = document.createElement('canvas')
    this.canvas.width = 1920
    this.canvas.height = 1080
    this.canvas.style.display = 'none'
    document.body.appendChild(this.canvas)
    
    this.ctx = this.canvas.getContext('2d')
    
    // Initialize hydra source if available
    if (window.s0 && typeof window.s0.init === 'function') {
      try {
        this.textSource = window.s0.init({src: this.canvas})
      } catch (e) {
        console.warn('Could not initialize text source:', e)
      }
    }
    
    this.updateTextCanvas()
  }

  updateTextCanvas() {
    if (!this.ctx) return
    
    const canvas = this.canvas
    const ctx = this.ctx
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Set background if not transparent
    if (this.backgroundColor !== 'transparent') {
      ctx.fillStyle = this.backgroundColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    
    // Set text properties
    ctx.font = `${this.fontSize}px ${this.fontFamily}`
    ctx.fillStyle = this.textColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.globalAlpha = this.opacity
    
    // Get text to display
    const text = this.state.textOverlayContent || this.defaultText
    
    // Calculate position
    const x = canvas.width * this.positionX
    const y = canvas.height * this.positionY
    
    // Draw text
    ctx.fillText(text, x, y)
    
    // Update hydra source if available
    if (this.textSource && typeof this.textSource.update === 'function') {
      try {
        this.textSource.update()
      } catch (e) {
        console.warn('Could not update text source:', e)
      }
    }
  }

  updateText(text) {
    this.emit('textOverlay:updateContent', text)
    this.updateTextCanvas()
  }

  updateStyle(properties) {
    Object.assign(this, properties)
    this.updateTextCanvas()
  }

  unload() {
    // Clean up
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas)
    }
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
    }
  }

  update() {
    return true // Allow re-render when state changes
  }

  createElement() {
    if (!this.state.showTextOverlay) {
      return html`<div id="text-overlay" style="display: none;"></div>`
    }

    // Update canvas when visible
    if (this.canvas) {
      this.updateTextCanvas()
    }

    return html`
      <div id="text-overlay" class="text-overlay-controls">
        <div class="text-control-group">
          <input 
            type="text" 
            class="text-input" 
            placeholder="Enter text..."
            value="${this.state.textOverlayContent || ''}"
            oninput=${(e) => this.updateText(e.target.value)}
          />
          <div class="text-controls">
            <label>
              Size: 
              <input 
                type="range" 
                min="12" 
                max="200" 
                value="${this.fontSize}"
                oninput=${(e) => this.updateStyle({fontSize: parseInt(e.target.value)})}
              />
              <span>${this.fontSize}px</span>
            </label>
            <label>
              Opacity: 
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                value="${this.opacity}"
                oninput=${(e) => this.updateStyle({opacity: parseFloat(e.target.value)})}
              />
              <span>${Math.round(this.opacity * 100)}%</span>
            </label>
          </div>
        </div>
      </div>
    `
  }
}