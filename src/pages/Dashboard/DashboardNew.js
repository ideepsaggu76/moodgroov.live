import React, { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import './DashboardNew.css';
import youtubeService from '../../services/youtubeService';

const Dashboard = () => {
  // Core State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Music State
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState('none');
  
  // Content State
  const [trendingMusic, setTrendingMusic] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [currentPlaylist, setCurrentPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Playlists state - for future implementation
  // const [playlists, setPlaylists] = useState([]);
  
  // Refs
  const playerRef = useRef(null);
  const progressRef = useRef(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Time tracking
  useEffect(() => {
    let interval;
    if (isPlaying && playerRef.current) {
      interval = setInterval(() => {
        try {
          const current = playerRef.current.getCurrentTime();
          const total = playerRef.current.getDuration();
          if (current !== undefined && total !== undefined) {
            setCurrentTime(current || 0);
            setDuration(total || 0);
          }
        } catch (error) {
          console.error('Time tracking error:', error);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Load initial data
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const trending = await youtubeService.getTrendingMusic(20);
      const recs = await youtubeService.searchMusic('popular music 2024', 12);
      setTrendingMusic(trending.items || []);
      setRecommendations(recs.items || []);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Music Control Functions
  const playSong = (song, playlist = []) => {
    setCurrentSong(song);
    setIsPlaying(true);
    
    if (playlist.length > 0) {
      setCurrentPlaylist(playlist);
      const songIndex = playlist.findIndex(s => s.id?.videoId === song.id?.videoId);
      setCurrentIndex(songIndex >= 0 ? songIndex : 0);
    }
    
    // Add to recently played
    setRecentlyPlayed(prev => {
      const filtered = prev.filter(s => s.id?.videoId !== song.id?.videoId);
      return [song, ...filtered].slice(0, 10);
    });
  };

  const togglePlayPause = () => {
    if (playerRef.current && currentSong) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    }
  };

  const playNext = () => {
    if (currentPlaylist.length > 0) {
      let nextIndex;
      if (isShuffled) {
        nextIndex = Math.floor(Math.random() * currentPlaylist.length);
      } else {
        nextIndex = (currentIndex + 1) % currentPlaylist.length;
      }
      const nextSong = currentPlaylist[nextIndex];
      playSong(nextSong, currentPlaylist);
    }
  };

  const playPrevious = () => {
    if (currentPlaylist.length > 0) {
      let prevIndex;
      if (isShuffled) {
        prevIndex = Math.floor(Math.random() * currentPlaylist.length);
      } else {
        prevIndex = currentIndex === 0 ? currentPlaylist.length - 1 : currentIndex - 1;
      }
      const prevSong = currentPlaylist[prevIndex];
      playSong(prevSong, currentPlaylist);
    }
  };

  const seekTo = (e) => {
    if (playerRef.current && duration > 0) {
      const progressBar = progressRef.current;
      const rect = progressBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;
      
      playerRef.current.seekTo(newTime);
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (playerRef.current) {
      playerRef.current.setVolume(newVolume * 100);
    }
  };

  const toggleShuffle = () => {
    setIsShuffled(!isShuffled);
  };

  const toggleRepeat = () => {
    const modes = ['none', 'one', 'all'];
    const currentModeIndex = modes.indexOf(repeatMode);
    const nextIndex = (currentModeIndex + 1) % modes.length;
    setRepeatMode(modes[nextIndex]);
  };

  // Search functionality
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const results = await youtubeService.searchMusic(searchQuery, 20);
      setSearchResults(results.items || []);
      setCurrentView('search');
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Playlist Management - Functions to be implemented
  // const createPlaylist = (name, description) => {
  //   const newPlaylist = {
  //     id: Date.now(),
  //     name,
  //     description,
  //     songs: [],
  //     created: new Date().toISOString()
  //   };
  //   setPlaylists(prev => [...prev, newPlaylist]);
  // };

  // const addToPlaylist = (playlistId, song) => {
  //   setPlaylists(prev => 
  //     prev.map(playlist => 
  //       playlist.id === playlistId 
  //         ? { ...playlist, songs: [...playlist.songs, song] }
  //         : playlist
  //     )
  //   );
  // };

  // YouTube Player Events
  const onPlayerReady = (event) => {
    playerRef.current = event.target;
    event.target.setVolume(volume * 100);
  };

  const onPlayerStateChange = (event) => {
    if (event.data === 1) { // Playing
      setIsPlaying(true);
    } else if (event.data === 2) { // Paused
      setIsPlaying(false);
    } else if (event.data === 0) { // Ended
      setIsPlaying(false);
      if (repeatMode === 'one') {
        playerRef.current.playVideo();
      } else if (repeatMode === 'all' || currentIndex < currentPlaylist.length - 1) {
        playNext();
      }
    }
  };

  // Utility Functions
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getThumbnail = (song) => {
    return song.snippet?.thumbnails?.medium?.url || song.snippet?.thumbnails?.default?.url || 'https://via.placeholder.com/320x180';
  };

  const getSongTitle = (song) => {
    return song.snippet?.title || 'Unknown Title';
  };

  const getArtistName = (song) => {
    return song.snippet?.channelTitle || 'Unknown Artist';
  };

  const playerOptions = {
    height: '0',
    width: '0',
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
    },
  };

  // Sidebar navigation items
  const sidebarItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'create', label: 'Create', icon: '➕' },
    { id: 'trending', label: 'Trending', icon: '🔥' },
    { id: 'billboard', label: 'Billboard', icon: '📊' },
  ];

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1 className="logo">MoodGroov</h1>
          <button className="sidebar-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${currentView === item.id ? 'active' : ''}`}
              onClick={() => setCurrentView(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <button className="menu-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              ☰
            </button>
            <div className="search-container">
              <input
                type="text"
                placeholder="Search for songs, artists, albums..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="search-input"
              />
              <button className="search-btn" onClick={handleSearch}>
                🔍
              </button>
            </div>
          </div>
          
          <div className="header-right">
            <button className="header-btn">⚙️</button>
            <div className="user-profile">
              <img src="https://via.placeholder.com/32x32" alt="User" className="user-avatar" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="content-area">
          {/* Home View */}
          {currentView === 'home' && (
            <div className="home-view">
              <section className="hero-section">
                <h2 className="hero-title">Top all over the world</h2>
                <div className="trending-grid">
                  {trendingMusic.slice(0, 6).map((song, index) => (
                    <div key={song.id?.videoId || index} className="trending-card" onClick={() => playSong(song, trendingMusic)}>
                      <img src={getThumbnail(song)} alt={getSongTitle(song)} />
                      <div className="play-overlay">
                        <div className="play-btn">▶️</div>
                      </div>
                      <h3>{getSongTitle(song)}</h3>
                      <p>{getArtistName(song)}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Recently Played */}
              {recentlyPlayed.length > 0 && (
                <section className="recently-played">
                  <h2>Recently Played</h2>
                  <div className="music-list">
                    {recentlyPlayed.map((song, index) => (
                      <div key={`recent-${index}`} className="music-item" onClick={() => playSong(song, recentlyPlayed)}>
                        <img src={getThumbnail(song)} alt={getSongTitle(song)} />
                        <div className="music-info">
                          <h3>{getSongTitle(song)}</h3>
                          <p>{getArtistName(song)}</p>
                        </div>
                        <button className="play-btn">▶️</button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Recommendations */}
              <section className="recommendations">
                <h2>Recommended for You</h2>
                <div className="music-grid">
                  {recommendations.map((song, index) => (
                    <div key={song.id?.videoId || index} className="music-card" onClick={() => playSong(song, recommendations)}>
                      <img src={getThumbnail(song)} alt={getSongTitle(song)} />
                      <div className="music-info">
                        <h3>{getSongTitle(song)}</h3>
                        <p>{getArtistName(song)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* Search View */}
          {currentView === 'search' && (
            <div className="search-view">
              <h2>Search Results</h2>
              <div className="music-grid">
                {searchResults.map((song, index) => (
                  <div key={song.id?.videoId || index} className="music-card" onClick={() => playSong(song, searchResults)}>
                    <img src={getThumbnail(song)} alt={getSongTitle(song)} />
                    <div className="music-info">
                      <h3>{getSongTitle(song)}</h3>
                      <p>{getArtistName(song)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending View */}
          {currentView === 'trending' && (
            <div className="trending-view">
              <h2>Trending Music</h2>
              <div className="music-grid">
                {trendingMusic.map((song, index) => (
                  <div key={song.id?.videoId || index} className="music-card" onClick={() => playSong(song, trendingMusic)}>
                    <img src={getThumbnail(song)} alt={getSongTitle(song)} />
                    <div className="music-info">
                      <h3>{getSongTitle(song)}</h3>
                      <p>{getArtistName(song)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create View */}
          {currentView === 'create' && (
            <div className="create-view">
              <h2>Create Playlist</h2>
              <div className="create-playlist-form">
                <input type="text" placeholder="Playlist name" className="playlist-input" />
                <textarea placeholder="Description" className="playlist-description"></textarea>
                <button className="create-btn">Create Playlist</button>
              </div>
              
              {/* Existing Playlists */}
              <div className="playlists-section">
                <h3>Your Playlists</h3>
                <div className="playlists-grid">
                  <div className="playlist-card">
                    <div className="playlist-cover">
                      <span>🎵</span>
                    </div>
                    <h4>My Favorites</h4>
                    <p>0 songs</p>
                  </div>
                  <div className="playlist-card">
                    <div className="playlist-cover">
                      <span>🎵</span>
                    </div>
                    <h4>Discover Weekly</h4>
                    <p>0 songs</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Billboard View */}
          {currentView === 'billboard' && (
            <div className="billboard-view">
              <h2>Billboard Charts</h2>
              <div className="billboard-sections">
                <div className="billboard-section">
                  <h3>Hot 100</h3>
                  <p>Coming soon - Billboard Hot 100 integration</p>
                </div>
                <div className="billboard-section">
                  <h3>Top Albums</h3>
                  <p>Coming soon - Billboard 200 integration</p>
                </div>
                <div className="billboard-section">
                  <h3>Global Charts</h3>
                  <p>Coming soon - Global charts integration</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Music Player */}
      {currentSong && (
        <div className="music-player">
          <div className="player-left">
            <img src={getThumbnail(currentSong)} alt={getSongTitle(currentSong)} className="player-artwork" />
            <div className="player-info">
              <h3>{getSongTitle(currentSong)}</h3>
              <p>{getArtistName(currentSong)}</p>
            </div>
          </div>
          
          <div className="player-center">
            <div className="player-controls">
              <button className={`control-btn ${isShuffled ? 'active' : ''}`} onClick={toggleShuffle}>
                🔀
              </button>
              <button className="control-btn" onClick={playPrevious}>
                ⏮️
              </button>
              <button className="play-pause-btn" onClick={togglePlayPause}>
                {isPlaying ? '⏸️' : '▶️'}
              </button>
              <button className="control-btn" onClick={playNext}>
                ⏭️
              </button>
              <button className={`control-btn ${repeatMode !== 'none' ? 'active' : ''}`} onClick={toggleRepeat}>
                🔁
              </button>
            </div>
            
            <div className="player-progress">
              <span className="time-current">{formatTime(currentTime)}</span>
              <div className="progress-bar" ref={progressRef} onClick={seekTo}>
                <div className="progress-fill" style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}></div>
              </div>
              <span className="time-total">{formatTime(duration)}</span>
            </div>
          </div>
          
          <div className="player-right">
            <div className="volume-control">
              <span>🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
            </div>
          </div>
        </div>
      )}

      {/* Hidden YouTube Player */}
      {currentSong && (
        <YouTube
          videoId={currentSong.id?.videoId}
          opts={playerOptions}
          onReady={onPlayerReady}
          onStateChange={onPlayerStateChange}
        />
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
