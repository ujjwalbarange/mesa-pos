import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Menu from './pages/Menu';
import './styles/global.css'; // Global styles

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root URL to menu */}
        <Route path="/" element={<Navigate to="/menu" replace />} />
        
        {/* The Menu Route */}
        <Route path="/menu" element={<Menu />} />
        
        {/* Placeholder for Cart (we will build this next) */}
        <Route path="/cart" element={<div>Cart Page Coming Soon</div>} />
      </Routes>
    </Router>
  );
}

export default App;
