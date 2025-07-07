import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import pages
import Login from './pages/Login/Login.js';
import DashboardNew from './pages/Dashboard/DashboardNew.js';
import Callback from './pages/Callback/Callback.js';
import Debug from './pages/Debug/Debug.js';
import MoodTracking from './pages/MoodTracking/MoodTracking.js';
import MusicRecommendations from './pages/MusicRecommendations/MusicRecommendations.js';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/callback" element={<Callback />} />
          <Route path="/debug" element={<Debug />} />
          <Route path="/dashboard" element={<DashboardNew />} />
          <Route path="/mood-tracking" element={<MoodTracking />} />
          <Route path="/music-recommendations" element={<MusicRecommendations />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
