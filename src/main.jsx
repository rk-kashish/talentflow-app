import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { initDB } from './db.js' // Import Dexie init

// MSW and DB Initialization
async function enableMocking() {
  if (import.meta.env.MODE !== 'development') {
    return
  }
 
  // Start MSW
  const { worker } = await import('./mocks/browser.js')
  await worker.start({ onUnhandledRequest: 'bypass' });
  
  // Initialize and seed the database
  try {
    await initDB();
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}
 
enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
})
