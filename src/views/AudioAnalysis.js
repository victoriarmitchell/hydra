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
    this.bpmThreshold = 0.1  // Start with lower threshold
    this.energyHistory = []  // Track energy over time
    
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
    
    // Focus on lower frequency bins (bass/kick drums are typically here)
    const bassRange = Math.min(16, Math.floor(fft.length / 4)) // More bins for better detection
    let energy = 0
    
    // Calculate energy in bass frequencies (where kicks/beats usually are)
    for (let i = 2; i < bassRange; i++) { // Skip DC component at index 0
      energy += Math.abs(fft[i])
    }
    
    energy = energy / (bassRange - 2)
    
    // Track energy history for dynamic thresholding
    this.energyHistory.push(energy)
    if (this.energyHistory.length > 100) { // Keep last 10 seconds of history
      this.energyHistory.shift()
    }
    
    // Calculate adaptive threshold based on recent energy levels
    const avgEnergy = this.energyHistory.reduce((sum, e) => sum + e, 0) / this.energyHistory.length
    const dynamicThreshold = avgEnergy * 1.5 // Threshold is 1.5x average energy
    
    // Debug: Log energy levels periodically
    if (Math.random() < 0.05) { // 5% of the time
      console.log('🎵 BPM Debug:', {
        energy: energy.toFixed(4),
        avgEnergy: avgEnergy.toFixed(4),
        dynamicThreshold: dynamicThreshold.toFixed(4),
        staticThreshold: this.bpmThreshold.toFixed(4),
        bassRange: bassRange,
        peakCount: this.bpmPeaks.length,
        timeSinceLastPeak: (now - this.lastPeakTime).toFixed(2),
        fftSample: fft.slice(0, 8).map(x => x.toFixed(3))
      })
    }
    
    // Use either dynamic threshold or static threshold, whichever is lower
    const activeThreshold = Math.min(dynamicThreshold, this.bpmThreshold)
    
    // Peak detection with minimum time between peaks (300ms = max 200 BPM)
    if (energy > activeThreshold && now - this.lastPeakTime > 0.3) {
      console.log('🎵 BPM Peak detected!', {
        energy: energy.toFixed(4), 
        activeThreshold: activeThreshold.toFixed(4),
        timeSinceLastPeak: (now - this.lastPeakTime).toFixed(2)
      })
      
      this.bpmPeaks.push(now)
      this.lastPeakTime = now
      
      // Keep only recent peaks (last 10 seconds)
      this.bpmPeaks = this.bpmPeaks.filter(time => now - time < 10)
      
      // Calculate BPM from peak intervals (need at least 3 peaks = 2 intervals)
      if (this.bpmPeaks.length >= 3) {
        const intervals = []
        for (let i = 1; i < this.bpmPeaks.length; i++) {
          intervals.push(this.bpmPeaks[i] - this.bpmPeaks[i - 1])
        }
        
        // Use median interval to reduce noise
        intervals.sort((a, b) => a - b)
        const medianInterval = intervals[Math.floor(intervals.length / 2)]
        const bpm = 60 / medianInterval
        
        console.log('🎵 Calculated BPM:', bpm.toFixed(1), 'from', this.bpmPeaks.length, 'peaks', 'median interval:', medianInterval.toFixed(3))
        
        // Accept wider BPM range and update more aggressively
        if (bpm >= 50 && bpm <= 220) {
          this.currentBPM = bpm
          
          // Smooth the BPM
          if (this.smoothedBPM === 0) {
            this.smoothedBPM = bpm
          } else {
            // More responsive smoothing
            this.smoothedBPM = this.smoothedBPM * 0.7 + bpm * 0.3
          }
          
          console.log('✅ BPM updated:', this.smoothedBPM.toFixed(1))
        }
      }
    }
    
    // Adaptive threshold - slower adaptation to prevent drift
    this.bpmThreshold = this.bpmThreshold * 0.99 + energy * 0.01
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