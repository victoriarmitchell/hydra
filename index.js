import devtools from 'choo-devtools'
import choo from 'choo'
import store from './src/stores/store.js'
import languageStore from './src/stores/language-store.js'
import extensionStore from './src/stores/extension-store.js'
import editorStore from './src/stores/editor-store.js'
import galleryStore from './src/stores/gallery-store.js'

import mainView from './src/views/main.js'

const app = choo()
// app.use(devtools())
app.use(store)
app.use(editorStore)
app.use(galleryStore)

app.use(languageStore)
app.use(extensionStore)
// Debug current location
console.log('Current pathname:', window.location.pathname)
console.log('Current href:', window.location.href)

app.route('/', mainView)
app.route('/dev', mainView)
app.route('/hydra', mainView)
app.route('/hydra/', mainView)
app.route('/*', mainView)  // Catch-all route
app.mount('body')



