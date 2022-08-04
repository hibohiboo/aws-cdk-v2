import React from 'react'
import { Provider } from 'react-redux'
import { BrowserRouter as Router } from 'react-router-dom'
import { Amplify } from 'aws-amplify'
import * as ReactDOMClient from 'react-dom/client'
import { awsAuthConfigure } from './domain/auth/aws-config'
import { ProvideAuth } from './hooks/authHook'
import App from '@/router/RoutesApp'
import { store } from '@/store'

const elementId = 'react-root'
const container = document.getElementById(elementId)

if (!container) throw Error(`${elementId} の id を持つ要素がHTMLにありません`)

Amplify.configure({ Auth: awsAuthConfigure })

const root = ReactDOMClient.createRoot(container)
root.render(
  <Router basename={VITE_DEFINE_BASE_PATH}>
    <ProvideAuth>
      <Provider store={store}>
        <React.StrictMode>
          <App />
        </React.StrictMode>
      </Provider>
    </ProvideAuth>
  </Router>,
)
