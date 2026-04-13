import { emitter } from './modules/event-emitter.js'
import { DataService } from './modules/data-service.js'
import { render } from './render.js'
import { state } from './state.js'

emitter.on('form:error', (msg) => {
  state.formError = msg
  render()
})

emitter.on('form:submit', (payload) => {
  state.formError = null
  render()
  DataService.createEvent(payload)
})

emitter.on('registration:success', (data) => {
  state.successMessage = `Registered! ID: ${data.id} | Date: ${data.date} | Tickets: ${data.tickets}`
  render()
})

render()