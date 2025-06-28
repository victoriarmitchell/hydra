import html from 'choo/html'
import Component from 'choo/component'

export default class AudioAnalysis extends Component {
  constructor(id, state, emit) {
    super(id)
    this.local = state.components[id] = {}
    this.state = state
    this.emit = emit
    
    // Audio analysis state
    this.currentBPM = 0.00
    this.smoothedBPM = 0.00
    this.currentVolume = -Infinity
    this.lastVolumeUpdate = 0
    
    // BPM detection variables
    this.bpmPeaks = []
    this.lastPeakTime = 0
    this.bpmThreshold = 0.3
    
    // Start analysis loop
    this.startAnalysis()
  }

  startAnalysis() {
    // Update audio analysis every 100ms
    setInterval(() => {
      if (window.a && window.a.fft && window.a.fft.length > 0) {
        this.analyzeAudio()
      } else {
        // Debug: Check audio system status
        console.log('Audio system status:', {
          windowAExists: !!window.a,
          fftExists: !!(window.a && window.a.fft),
          fftLength: window.a && window.a.fft ? window.a.fft.length : 0
        })
      }
    }, 100)
  }

  analyzeAudio() {
    const fft = window.a.fft
    if (!fft || fft.length === 0) {
      return
    }

    // Calculate volume (dB) - keep existing implementation
    this.calculateVolume(fft)
    
    // Simple BPM detection using 8 bins
    this.calculateBPM(fft)
    
    // Debug logging
    if (this.state.showBPM || this.state.showVolume) {
      console.log('Audio analysis:', {
        bpm: this.currentBPM.toFixed(2),
        smoothedBPM: this.smoothedBPM.toFixed(2),
        volume: this.currentVolume.toFixed(2),
        fftLength: fft.length
      })
      this.rerender()
    }
  }

  calculateVolume(fft) {
    // Calculate RMS of FFT data
    let sum = 0
    for (let i = 0; i < fft.length; i++) {
      sum += fft[i] * fft[i]
    }
    const rms = Math.sqrt(sum / fft.length)
    
    // Convert to dBA scale (environmental sound levels)
    if (rms > 0) {
      // Convert RMS to dB then map to dBA scale
      const dB = 20 * Math.log10(rms)
      // Map typical audio range (-60 to 0 dB) to dBA range (30-90 dBA)
      // Offset: add 90 to convert -60dB to 30dBA, 0dB to 90dBA
      this.currentVolume = Math.max(30, Math.min(130, dB + 90))
    } else {
      this.currentVolume = 30 // Minimum dBA for silence
    }
  }

  calculateBPM(fft) {
    // Simple BPM detection using energy in lower frequency bins
    const now = Date.now() / 1000
    
    // Focus on lower frequency bins (where beats are typically found)
    const lowFreqBins = Math.min(8, Math.floor(fft.length / 8))
    let energy = 0
    
    for (let i = 1; i < lowFreqBins; i++) {
      energy += Math.abs(fft[i])
    }
    
    energy = energy / lowFreqBins
    
    // Debug: Log energy levels periodically
    if (Math.random() < 0.1) { // 10% of the time
      console.log('BPM Debug:', {
        energy: energy.toFixed(4),
        threshold: this.bpmThreshold.toFixed(4),
        lowFreqBins: lowFreqBins,
        peakCount: this.bpmPeaks.length,
        timeSinceLastPeak: (now - this.lastPeakTime).toFixed(2)
      })
    }
    
    // Peak detection
    if (energy > this.bpmThreshold && now - this.lastPeakTime > 0.3) {
      console.log('🎵 BPM Peak detected!', {energy, threshold: this.bpmThreshold})
      this.bpmPeaks.push(now)
      this.lastPeakTime = now
      
      // Keep only recent peaks (last 10 seconds)
      this.bpmPeaks = this.bpmPeaks.filter(time => now - time < 10)
      
      // Calculate BPM from peak intervals
      if (this.bpmPeaks.length >= 4) {
        const intervals = []
        for (let i = 1; i < this.bpmPeaks.length; i++) {
          intervals.push(this.bpmPeaks[i] - this.bpmPeaks[i - 1])
        }
        
        // Calculate average interval
        const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
        const bpm = 60 / avgInterval
        
        console.log('🎵 Calculated BPM:', bpm.toFixed(1), 'from', this.bpmPeaks.length, 'peaks')
        
        // Only accept reasonable BPM values
        if (bpm >= 60 && bpm <= 200) {
          this.currentBPM = bpm
          
          // Smooth the BPM
          if (this.smoothedBPM === 0) {
            this.smoothedBPM = bpm
          } else {
            this.smoothedBPM = this.smoothedBPM * 0.8 + bpm * 0.2
          }
          
          console.log('✅ BPM updated:', this.smoothedBPM.toFixed(1))
        }
      }
    }
    
    // Adaptive threshold based on current energy levels
    this.bpmThreshold = this.bpmThreshold * 0.95 + energy * 0.05
  }

  unload() {
    // Clean up when component is destroyed
  }

  update() {
    return true // Allow re-render when state changes
  }

  createElement() {
    if (!this.state.showBPM && !this.state.showVolume) {
      return html`<div id="audio-analysis" style="display: none;"></div>`
    }

    const bpmDisplay = this.state.showBPM ? html`
      <div class="audio-metric">
        <span class="metric-value">${this.smoothedBPM.toFixed(1)}</span>
        <span class="metric-label">BPM</span>
      </div>
    ` : ''

    const volumeDisplay = this.state.showVolume ? html`
      <div class="audio-metric">
        <span class="metric-value">${this.currentVolume.toFixed(0)}</span>
        <span class="metric-label">dBA</span>
      </div>
    ` : ''

    return html`
      <div id="audio-analysis" class="audio-analysis-overlay">
        ${bpmDisplay}
        ${volumeDisplay}
      </div>
    `
  }
}