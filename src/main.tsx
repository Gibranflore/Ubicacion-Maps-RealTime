import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import SocketMapApp from './SocketMapApp'

import './index.css'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SocketMapApp />
  </StrictMode>,
)
