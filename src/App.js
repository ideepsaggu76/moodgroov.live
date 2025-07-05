import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import pages
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import MoodTracking from './pages/MoodTracking/MoodTracking';
import MusicRecommendations from './pages/MusicRecommendations/MusicRecommendations';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/mood-tracking" element={<MoodTracking />} />
          <Route path="/music-recommendations" element={<MusicRecommendations />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
