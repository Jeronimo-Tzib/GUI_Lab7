import { emitter } from './event-emitter.js'

const BASE = 'http://localhost:4000/api'

export const DataService = {

  async createEvent(payload) {
    try {
    
      const res = await fetch(`${BASE}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)

      const data = await res.json()

      emitter.emit('registration:success', data)

    } catch (err) {
      console.error('Error creating event:', err.message)
    }
  }

}