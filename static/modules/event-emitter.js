const events = {}

export const emitter = {

  on(event, fn) {
    if (!events[event]) events[event] = []
    events[event].push(fn)
  },

  emit(event, data) {
    if (events[event]) {
      events[event].forEach(fn => fn(data))
    }
  }

}