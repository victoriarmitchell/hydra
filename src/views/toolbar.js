import html from 'choo/html'

export default function toolbar(state, emit) {
    const hidden = state.showInfo ? 'hidden' : ''

    const { t } = state.translation

    const dispatch = (eventName) => (e) => emit(eventName, e)

    const icon = (id, className, title, event) => html`
        <i id="${id}-icon" class="fas icon ${className}" title="${title}" onclick=${dispatch(event)} aria-hidden="true"></i>`

    

    const toggleInfo = state.showInfo ? icon("close", "fa-times", t('toolbar.hide-info'), 'ui: toggle info') : icon("close", "fa-question-circle", t('toolbar.show-info'), 'ui: toggle info') 
    
    const toggleExtensions = !state.showExtensions ? icon("add", "fa-solid fa-puzzle-piece", t('toolbar.load-extension'), 'ui: show extensions') : icon("close", "fa-question-circle", t('toolbar.show-info'), 'ui: hide extensions')  

    const audioSourceSelect = html`
        <select id="audio-source-select" class="audio-source-select" onchange=${dispatch('audio: change source')} title="${t('toolbar.audio-source')}">
            <option value="microphone" ${state.currentAudioSource === 'microphone' ? 'selected' : ''}>${t('toolbar.microphone')}</option>
            <option value="desktop" ${state.currentAudioSource === 'desktop' ? 'selected' : ''}>${t('toolbar.desktop-audio')}</option>
        </select>
    `

    const toggleBPM = state.showBPM ? icon("bpm", "fa-music", t('toolbar.hide-bpm'), 'ui: toggle bpm') : icon("bpm", "fa-music", t('toolbar.show-bpm'), 'ui: toggle bpm')
    const toggleVolume = state.showVolume ? icon("volume", "fa-volume-up", t('toolbar.hide-volume'), 'ui: toggle volume') : icon("volume", "fa-volume-up", t('toolbar.show-volume'), 'ui: toggle volume')
    const toggleTextOverlay = state.showTextOverlay ? icon("text", "fa-font", t('toolbar.hide-text'), 'ui: toggle text overlay') : icon("text", "fa-font", t('toolbar.show-text'), 'ui: toggle text overlay')

    return html`<div id="toolbar-container">
        ${icon("run", `fa-play-circle ${hidden}`, t('toolbar.run'), 'editor: eval all')}
        ${icon("clear", `fa fa-trash ${hidden}`, t('toolbar.clear'), 'clear all')}
        ${toggleExtensions}
        ${audioSourceSelect}
        ${toggleBPM}
        ${toggleVolume}
        ${toggleTextOverlay}
        ${icon("shuffle", `fa-random`, t('toolbar.shuffle'), 'gallery:showExample')}
        ${icon("mutator", `fa-dice ${hidden}`, t('toolbar.random'), 'editor: randomize')}
        ${state.serverURL === null ? '' : icon("share", `fa-upload ${hidden}`, t('toolbar.upload'), 'gallery:shareSketch')}
        ${toggleInfo}
    </div>`

    //        ${icon("share", `fa-upload ${hidden}`, t('toolbar.upload'), 'gallery:shareSketch')}

}