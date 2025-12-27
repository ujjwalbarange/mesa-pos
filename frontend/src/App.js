import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import the pages we created
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import Status from './pages/Status';
import Admin from './pages/Admin';

// Import global styles
import './styles/global.css';

function App() {
  return (
    <Router>
      <div className="App">
        {/* Navigation can be added here if you want a permanent header */}
        
        <Routes>
          {/* Customer Routes */}
          <Route path="/menu" element={<Menu />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/status" element={<Status />} />

          {/* Admin Route */}
          <Route path="/admin" element={<Admin />} />

          {/* Default Route: Redirect to menu if path is unknown */}
          <Route path="*" element={<Navigate to="/menu" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
