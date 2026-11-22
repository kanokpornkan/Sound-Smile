import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// ระบบ Animation กลาง — import หลัง App เพื่อให้ override สไตล์ได้เมื่อจำเป็น
import './motion/motion.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
