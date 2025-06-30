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
        console.log('Text source initialized successfully:', this.textSource)
      } catch (e) {
        console.warn('Could not initialize text source:', e)
      }
    } else {
      console.warn('s0 not available for text source initialization')
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
    console.log('Drawing text to canvas:', text)
    
    // Calculate position
    const x = canvas.width * this.positionX
    const y = canvas.height * this.positionY
    
    // Draw text
    ctx.fillText(text, x, y)
    console.log('Text drawn at position:', x, y)
    
    // Try to initialize text source if not already done
    if (!this.textSource && window.s0) {
      try {
        console.log('Attempting to initialize s0 with canvas:', this.canvas)
        
        // Try different initialization methods
        if (typeof window.s0.init === 'function') {
          this.textSource = window.s0.init({src: this.canvas})
          console.log('s0.init() result:', this.textSource)
        }
        
        // Alternative: try direct assignment
        if (!this.textSource) {
          window.s0.src = this.canvas
          this.textSource = window.s0
          console.log('Direct s0 assignment result:', this.textSource)
          console.log('textSource has update method:', typeof this.textSource.update)
        }
        
      } catch (e) {
        console.warn('Could not initialize text source on demand:', e)
      }
    }
    
    // Update hydra source if available
    console.log('Checking text source for update:', !!this.textSource, typeof this.textSource?.update)
    if (this.textSource) {
      try {
        // Update the source canvas
        if (typeof this.textSource.update === 'function') {
          this.textSource.update()
        }
        
        // Auto-blend text with current output
        this.autoBlendText()
        
        console.log('Text source updated successfully')
      } catch (e) {
        console.warn('Could not update text source:', e)
      }
    } else {
      console.warn('Text source not available for update. s0 available:', !!window.s0, 'textSource:', !!this.textSource)
    }
  }

  autoBlendText() {
    try {
      if (this.textSource && this.state.textOverlayContent) {
        // Store text source globally for access
        window._textOverlay = this.textSource
        window._textOpacity = this.opacity
        
        console.log('Text overlay ready - use .layer(s0, 0.8) in your hydra chains')
        
        // Provide helper functions
        window.showTextOverlay = () => {
          console.log('To add text overlay, append this to your hydra chain:')
          console.log('.layer(s0, 0.8).out()')
          console.log('Example: osc(60, 0.1, 0.8).layer(s0, 0.8).out()')
        }
        
        // Add a function to test if a chain is safe for layering
        window.testChain = (chain) => {
          console.log('Chain object:', chain)
          console.log('Has layer method:', typeof chain?.layer === 'function')
          console.log('Is undefined:', chain === undefined)
          console.log('Is null:', chain === null)
          if (chain && typeof chain.layer === 'function') {
            console.log('✅ Safe to add .layer(s0, 0.8)')
          } else {
            console.log('❌ NOT safe - this will cause an error')
          }
          return chain
        }
      }
    } catch (e) {
      console.warn('Could not setup text overlay:', e)
    }
  }


  updateText(text) {
    this.emit('textOverlay:updateContent', text)
    this.updateTextCanvas()
  }

  openTextDialog() {
    console.log('Dialog button clicked!')
    const currentText = this.state.textOverlayContent || this.defaultText
    const newText = window.prompt('Enter text for overlay:', currentText)
    if (newText !== null) { // User didn't cancel
      this.updateText(newText)
    }
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
    // Always update canvas when text overlay is enabled (even without visible controls)
    if (this.state.showTextOverlay && this.canvas) {
      this.updateTextCanvas()
    }

    // Don't render any visible controls - they're broken
    // The text will still render on the canvas via the hidden canvas
    return html`<div id="text-overlay" style="display: none;"></div>`
  }
}