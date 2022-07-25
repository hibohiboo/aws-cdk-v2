import React from 'react'
import { Provider } from 'react-redux'
import { BrowserRouter as Router } from 'react-router-dom'
import * as ReactDOMClient from 'react-dom/client'
import App from '@/router/RoutesApp'
import { store } from '@/store'

const elementId = 'react-root'
const container = document.getElementById(elementId)

if (!container) throw Error(`${elementId} の id を持つ要素がHTMLにありません`)
const root = ReactDOMClient.createRoot(container)
root.render(
  <Router basename={VITE_DEFINE_BASE_PATH}>
    <Provider store={store}>
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </Provider>
  </Router>,
)
