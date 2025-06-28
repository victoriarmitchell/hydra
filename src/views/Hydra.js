import html from 'choo/html'
import Component from 'choo/component'
// import Hydra from 'hydra-synth'
// const HydraSynth = require('./../../../../../hydra-synth')
import P5 from './../lib/p5-wrapper.js'
import PatchBay from './../lib/patch-bay/pb-live.js'

let pb

// const SERVER_URL = process.env['SERVER_URL']

export default class HydraCanvas extends Component {
  constructor(id, state, emit) {
    super(id)
    this.local = state.components[id] = {}
    state.hydra = this // hacky
    this.state = state
    this.emit = emit
    this.audioDevices = []
    this.currentAudioSource = 'microphone'
    this.currentStream = null
  }

  async enumerateAudioDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      this.audioDevices = devices.filter(device => device.kind === 'audioinput')
      this.updateAudioSourceSelect()
    } catch (err) {
      console.warn('Failed to enumerate audio devices:', err)
    }
  }

  updateAudioSourceSelect() {
    const select = document.getElementById('audio-source-select')
    if (select && this.audioDevices.length > 0) {
      // Clear existing USB device options
      const options = select.querySelectorAll('option[value^="usb-"]')
      options.forEach(option => option.remove())
      
      // Add USB audio devices
      this.audioDevices.forEach(device => {
        if (device.deviceId !== 'default') {
          const option = document.createElement('option')
          option.value = `usb-${device.deviceId}`
          option.textContent = device.label || `USB Audio Device ${device.deviceId.slice(0, 8)}`
          select.appendChild(option)
        }
      })
    }
  }

  async changeAudioSource(sourceType, deviceId = null) {
    try {
      console.log('Changing audio source to:', sourceType)
      
      if (this.currentStream) {
        this.currentStream.getTracks().forEach(track => track.stop())
      }

      let stream
      if (sourceType === 'desktop') {
        console.log('Requesting desktop audio capture...')
        
        // Check if getDisplayMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          throw new Error('getDisplayMedia is not supported in this browser. Desktop audio requires Chrome/Edge.')
        }
        
        // For desktop audio, we need getDisplayMedia with audio
        // Note: video: false is not widely supported, so we'll capture video too but ignore it
        stream = await navigator.mediaDevices.getDisplayMedia({ 
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          },
          video: {
            mediaSource: 'screen',
            width: { ideal: 1 },
            height: { ideal: 1 }
          }
        })
        
        // If we got video tracks, remove them since we only want audio
        const videoTracks = stream.getVideoTracks()
        videoTracks.forEach(track => {
          stream.removeTrack(track)
          track.stop()
        })
        
        console.log('Desktop audio stream obtained:', stream)
        console.log('Audio tracks:', stream.getAudioTracks())
      } else if (sourceType.startsWith('usb-') || sourceType === 'microphone') {
        const constraints = { 
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          }
        }
        if (sourceType.startsWith('usb-')) {
          constraints.audio.deviceId = deviceId || sourceType.replace('usb-', '')
        }
        stream = await navigator.mediaDevices.getUserMedia(constraints)
        console.log('Microphone/USB audio stream obtained:', stream)
      }

      if (stream && this.hydra) {
        this.currentStream = stream
        this.currentAudioSource = sourceType
        
        // Update hydra's audio input - need to access the correct audio analyzer
        if (this.hydra.a && this.hydra.a.setStream) {
          this.hydra.a.setStream(stream)
          console.log('Audio stream set to hydra analyzer')
        } else if (this.hydra.synth && this.hydra.synth.a && this.hydra.synth.a.setStream) {
          this.hydra.synth.a.setStream(stream)
          console.log('Audio stream set to hydra synth analyzer')
        } else {
          console.warn('Could not find hydra audio analyzer to update')
        }
      }
    } catch (err) {
      console.error('Failed to change audio source:', err)
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        code: err.code
      })
      
      let userMessage = `Failed to change audio source: ${err.message}`
      
      // Provide specific guidance based on error type
      if (err.name === 'NotAllowedError') {
        userMessage = 'Permission denied. For desktop audio, you need to:\n1. Click "Share" in the permission dialog\n2. Select a Chrome tab or your entire screen\n3. Make sure "Share audio" is checked'
      } else if (err.name === 'NotSupportedError') {
        userMessage = 'Desktop audio is not supported in this browser. Please use Chrome or Edge.'
      } else if (err.name === 'AbortError') {
        userMessage = 'Screen sharing was cancelled. Please try again and click "Share" to enable desktop audio.'
      }
      
      alert(userMessage)
    }
  }

  load(element) {
    let isIOS =
      (/iPad|iPhone|iPod/.test(navigator.platform) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) &&
      !window.MSStream;
    let precisionValue = isIOS ? 'highp' : 'mediump'

    const hydraOptions = { 
      detectAudio: true, 
      canvas: element.querySelector("canvas"), 
      precision: precisionValue,
      audioSourceCallback: (stream) => {
        this.currentStream = stream
      }
    }
    
    if (this.state.serverURL === null) {
      console.log('LOCAL ONLY, WILL NOT INIT webRTC and gallery')
      this.hydra = new Hydra(hydraOptions)
    } else {
      this.pb = new PatchBay()
      hydraOptions.pb = this.pb
      this.hydra = new Hydra(hydraOptions)
      this.pb.init(this.hydra.captureStream, {
        // server: window.location.origin,
        server: this.state.serverURL,
        room: 'iclc'
      })
      window.pb = this.pb
    }

    window.hydraSynth = this.hydra
    //  if(environment !== 'local') {
    // osc().out()

    // }

    window.P5 = P5
    // window.pb = pb
    
    // Initialize audio device enumeration
    this.enumerateAudioDevices()
    
    // Add debug function to window for testing audio
    window.testAudio = () => {
      if (window.a && window.a.fft) {
        console.log('Audio FFT data:', window.a.fft.slice(0, 10))
        console.log('Audio level:', window.a.fft.reduce((sum, val) => sum + val, 0))
      } else {
        console.log('No audio data available')
      }
    }
    
    this.emit('hydra loaded')
  }

  update(center) {
    return false
  }

  createElement({ width = window.innerWidth, height = window.innerHeight } = {}) {

    return html`<div style="width:100%;height:100%;">
        <canvas id="hydra-canvas" class="bg-black" style="image-rendering:pixelated; width:100%;height:100%" width="${width}" height="${height}"></canvas></div>`
  }
}
