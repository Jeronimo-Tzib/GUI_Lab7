import { emitter } from './modules/event-emitter.js'
import { state } from './state.js'

function validate(payload) {
  const today = new Date().toISOString().split('T')[0]

  if (!payload.date)
    return 'Event date is required'

  if (payload.date <= today)
    return 'Date must be in the future'

  if (payload.tickets < 1 || payload.tickets > 5)
    return 'Tickets must be between 1 and 5'

  if (!payload.terms)
    return 'You must accept the terms and conditions'

  return null
}

function handleSubmit(e) {
  e.preventDefault()

  const data = new FormData(e.target)

  const payload = {
    date: data.get('date'),
    tickets: Number(data.get('tickets')),
    terms: data.get('terms') === 'on'
  }

  const err = validate(payload)

  if (err) {
    emitter.emit('form:error', err)
    return
  }

  emitter.emit('form:submit', payload)
}


function renderForm() {
  return `
    <form id="form" class="event-form">

      <label>
        Event Date (e.g., 2026-12-31)
        <input type="date" name="date" />
      </label>

      <label>
        Number of Tickets (1-5)
        <input type="number" name="tickets" min="1" max="5" />
      </label>

      <label class="terms">
        <input type="checkbox" name="terms" />
        I agree to the Terms and Conditions
      </label>

      ${state.formError
        ? `<div class="error">${state.formError}</div>`
        : ''}

      ${state.successMessage
        ? `<div class="success">${state.successMessage}</div>`
        : ''}

      <button type="submit" class="submit-btn">Submit</button>
    </form>
  `
}

export function render() {
  const app = document.querySelector('#app')

  if (app) {
    app.innerHTML = renderForm()
  }

  const form = document.querySelector('#form')
  if (form) {
    form.addEventListener('submit', handleSubmit)
  }

  const themeSelect = document.querySelector('#theme')
  const bgUpload = document.querySelector('#bgUpload')

  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
      const theme = e.target.value
      document.body.classList.remove('dark', 'light')
      if (theme) {
        document.body.classList.add(theme)
      }
      localStorage.setItem('theme', theme)
    })
  }

  if (bgUpload) {
    bgUpload.addEventListener('change', (e) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = () => {
          state.themeBackground = reader.result
          localStorage.setItem('bgImage', reader.result)

          let bgImg = document.querySelector('#bgImage')
          if (!bgImg) {
            bgImg = document.createElement('img')
            bgImg.id = 'bgImage'
            bgImg.style.position = 'fixed'
            bgImg.style.top = 0
            bgImg.style.left = 0
            bgImg.style.width = '100%'
            bgImg.style.height = '100%'
            bgImg.style.objectFit = 'cover'
            bgImg.style.zIndex = '-1'
            document.body.appendChild(bgImg)
          }
          bgImg.src = state.themeBackground
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    document.body.classList.remove('dark', 'light')
    document.body.classList.add(savedTheme)
    if (themeSelect) {
      themeSelect.value = savedTheme
    }
  }

  const savedBg = localStorage.getItem('bgImage')
  if (savedBg) {
    let bgImg = document.querySelector('#bgImage')
    if (!bgImg) {
      bgImg = document.createElement('img')
      bgImg.id = 'bgImage'
      bgImg.style.position = 'fixed'
      bgImg.style.top = 0
      bgImg.style.left = 0
      bgImg.style.width = '100%'
      bgImg.style.height = '100%'
      bgImg.style.objectFit = 'cover'
      bgImg.style.zIndex = '-1'
      document.body.appendChild(bgImg)
    }
    bgImg.src = savedBg
  }
}