import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../App';
import InAppAlert from './components/InAppAlert';
import './web.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <div className="app-shell-container">
      <div className="mobile-frame">
        <App />
        <InAppAlert />
      </div>
    </div>
  </React.StrictMode>
);
