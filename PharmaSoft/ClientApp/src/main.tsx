import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './components/pharmasoft/App'
import { bootstrap } from './lib/persist'
import './index.css'

// Tải dữ liệu từ server trước, rồi mới hiện giao diện
bootstrap().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
})
