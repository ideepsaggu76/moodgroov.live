import React, { useState, useEffect } from 'react';
import './Hi.css';

const Dashboard = () => {
  const [currentMood, setCurrentMood] = useState('happy');
  const [user, setUser] = useState(null);

  const moods = [
    { id: 'happy', name: 'Happy', emoji: '😊', color: '#FFD700' },
    { id: 'calm', name: 'Calm', emoji: '😌', color: '#87CEEB' },
    { id: 'energetic', name: 'Energetic', emoji: '⚡', color: '#FF6B6B' },
    { id: 'melancholic', name: 'Melancholic', emoji: '😔', color: '#9370DB' },
    { id: 'focused', name: 'Focused', emoji: '🎯', color: '#2E8B57' }
  ];

  useEffect(() => {
    // Get user info from localStorage if available
    const token = localStorage.getItem('spotify_access_token');
    if (token) {
      // You can fetch user data here if needed
      setUser({ name: 'User' }); // Placeholder
    }
  }, []);

  const handleMoodChange = (mood) => {
    setCurrentMood(mood);
  };

  const getMoodTheme = (mood) => {
    const themes = {
      happy: {
        gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF6347 100%)',
        animation: 'sunburst',
        particles: 'golden'
      },
      calm: {
        gradient: 'linear-gradient(135deg, #87CEEB 0%, #4682B4 50%, #2E8B57 100%)',
        animation: 'waves',
        particles: 'floating'
      },
      energetic: {
        gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF1493 50%, #8A2BE2 100%)',
        animation: 'pulse',
        particles: 'electric'
      },
      melancholic: {
        gradient: 'linear-gradient(135deg, #9370DB 0%, #483D8B 50%, #2F4F4F 100%)',
        animation: 'rain',
        particles: 'bokeh'
      },
      focused: {
        gradient: 'linear-gradient(135deg, #2E8B57 0%, #20B2AA 50%, #008B8B 100%)',
        animation: 'geometric',
        particles: 'minimal'
      }
    };
    return themes[mood] || themes.happy;
  };

  const currentTheme = getMoodTheme(currentMood);

  return (
    <div className={`dashboard-container ${currentMood}`} style={{background: currentTheme.gradient}}>
      <div className="dashboard-overlay">
        {/* Header */}
        <header className="dashboard-header">
          <div className="welcome-section">
            <h1>Welcome back{user?.name ? `, ${user.name}` : ''}!</h1>
            <p>How are you feeling today?</p>
          </div>
          <div className="user-actions">
            <button className="logout-btn">Logout</button>
          </div>
        </header>

        {/* Mood Selector */}
        <section className="mood-selector">
          <h2>Select Your Mood</h2>
          <div className="mood-grid">
            {moods.map((mood) => (
              <button
                key={mood.id}
                className={`mood-card ${currentMood === mood.id ? 'active' : ''}`}
                onClick={() => handleMoodChange(mood.id)}
                style={{ '--mood-color': mood.color }}
              >
                <span className="mood-emoji">{mood.emoji}</span>
                <span className="mood-name">{mood.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Dashboard Content */}
        <main className="dashboard-main">
          <div className="dashboard-grid">
            {/* Current Mood Display */}
            <div className="widget current-mood-widget">
              <h3>Current Mood</h3>
              <div className="mood-display">
                <span className="current-mood-emoji">
                  {moods.find(m => m.id === currentMood)?.emoji}
                </span>
                <span className="current-mood-name">
                  {moods.find(m => m.id === currentMood)?.name}
                </span>
              </div>
            </div>

            {/* Music Recommendations */}
            <div className="widget music-widget">
              <h3>Music for Your Mood</h3>
              <div className="music-recommendations">
                <p>Discovering {currentMood} music...</p>
                <button className="explore-btn">Explore Music</button>
              </div>
            </div>

            {/* Mood Statistics */}
            <div className="widget stats-widget">
              <h3>Mood Statistics</h3>
              <div className="stats-content">
                <div className="stat-item">
                  <span className="stat-label">Most Common Mood</span>
                  <span className="stat-value">Happy 😊</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Mood Streak</span>
                  <span className="stat-value">5 days</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="widget actions-widget">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button className="action-btn">Track Mood</button>
                <button className="action-btn">Find Music</button>
                <button className="action-btn">View History</button>
              </div>
            </div>
          </div>
        </main>

        {/* Animated Background Elements */}
        <div className={`background-animation ${currentTheme.animation}`}>
          <div className="particle particle-1"></div>
          <div className="particle particle-2"></div>
          <div className="particle particle-3"></div>
          <div className="particle particle-4"></div>
          <div className="particle particle-5"></div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
