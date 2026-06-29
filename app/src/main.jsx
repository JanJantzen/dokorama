import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Temporärer Debug-Overlay: zeigt JS-Fehler direkt am Bildschirm an.
// Hilfreich für iPhone ohne angeschlossenen Mac (kein Web Inspector).
// Kann nach der Fehlerdiagnose wieder entfernt werden.
function showErrorOverlay(title, message) {
  const existing = document.getElementById('debug-error-overlay')
  if (existing) existing.remove()
  const el = document.createElement('div')
  el.id = 'debug-error-overlay'
  el.style.cssText = [
    'position:fixed', 'top:0', 'left:0', 'right:0', 'bottom:0',
    'background:rgba(0,0,0,0.85)', 'z-index:99999', 'padding:16px',
    'color:white', 'font-family:monospace', 'font-size:11px', 'overflow:auto',
  ].join(';')
  el.innerHTML = `
    <div style="background:#c00;padding:8px 12px;border-radius:8px;margin-bottom:10px;font-weight:bold">${title}</div>
    <pre style="white-space:pre-wrap;word-break:break-all">${message}</pre>
    <button onclick="document.getElementById('debug-error-overlay').remove()"
      style="margin-top:12px;padding:8px 20px;border-radius:8px;background:white;color:#333;border:none;font-weight:bold;cursor:pointer">
      Schließen
    </button>
  `
  document.body.appendChild(el)
}

window.addEventListener('error', (e) => {
  showErrorOverlay(
    'JS-Fehler',
    `${e.message}\n\n${e.filename}:${e.lineno}:${e.colno}\n\n${e.error?.stack ?? ''}`,
  )
})

window.addEventListener('unhandledrejection', (e) => {
  showErrorOverlay(
    'Unbehandelter Promise-Fehler',
    `${e.reason?.message ?? String(e.reason)}\n\n${e.reason?.stack ?? ''}`,
  )
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
