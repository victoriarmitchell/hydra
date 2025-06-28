import html from 'choo/html'
import info from './info.js'
import Hydra from './Hydra.js'
import AudioAnalysis from './AudioAnalysis.js'
import TextOverlay from './TextOverlay.js'
import Editor from './EditorComponent.js'
// import Editor from './EditorCm6.js'


export default function mainView(state, emit) {
  return html`
  <body>
    <div id="hydra-ui">
      ${state.cache(Hydra, 'hydra-canvas').render(state, emit)}
      ${state.cache(AudioAnalysis, 'audio-analysis').render(state, emit)}
      ${state.cache(TextOverlay, 'text-overlay').render(state, emit)}
    </div>
  ${info(state, emit)}
  ${state.cache(Editor, 'editor').render(state, emit)}
  </body>
 `
}