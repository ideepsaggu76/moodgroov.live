import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import YouTube from 'react-youtube';
import './Dashboard.css';
import youtubeService from '../../services/youtubeService';

const Dashboard = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [trendingMusic, setTrendingMusic] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [backgroundImage, setBackgroundImage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlaylist, setCurrentPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const audioRef = useRef(null);
  const playerRef = useRef(null);
  const progressRef = useRef(null);
  const navigate = useNavigate();

  // Load trending music on component mount
  useEffect(() => {
    loadTrendingMusic();
  }, []);

  // Update background when song changes
  useEffect(() => {
    if (currentSong && currentSong.snippet.thumbnails.maxres) {
      setBackgroundImage(currentSong.snippet.thumbnails.maxres.url);
    } else if (currentSong && currentSong.snippet.thumbnails.high) {
      setBackgroundImage(currentSong.snippet.thumbnails.high.url);
    }
  }, [currentSong]);

  // Time tracking for YouTube player
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
          // Player not ready yet
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Additional time tracking to ensure we get duration
  useEffect(() => {
    let interval;
    if (playerRef.current && currentSong) {
      interval = setInterval(() => {
        try {
          const total = playerRef.current.getDuration();
          if (total !== undefined && total > 0 && duration === 0) {
            setDuration(total);
          }
        } catch (error) {
          // Player not ready yet
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [currentSong, duration]);

  // Audio time update
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const updateTime = () => {
        setCurrentTime(audio.currentTime);
        setDuration(audio.duration);
      };
      
      const handlePlay = () => {
        setIsPlaying(true);
      };
      
      const handlePause = () => {
        setIsPlaying(false);
      };
      
      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
      
      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', updateTime);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('ended', handleEnded);
      
      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('loadedmetadata', updateTime);
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [currentSong]);

  const loadTrendingMusic = async () => {
    try {
      setIsLoading(true);
      const trending = await youtubeService.getTrendingMusic();
      setTrendingMusic(trending.items || []);
      setCurrentPlaylist(trending.items || []);
    } catch (error) {
      console.error('Error loading trending music:', error);
      // Fallback with mock data for demo
      const fallbackData = [
        {
          id: { videoId: 'demo1' },
          snippet: {
            title: 'Popular Song 1',
            channelTitle: 'Artist 1',
            thumbnails: {
              medium: { url: 'https://via.placeholder.com/320x180' }
            }
          }
        }
      ];
      setTrendingMusic(fallbackData);
      setCurrentPlaylist(fallbackData);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setIsLoading(true);
      const results = await youtubeService.searchMusic(searchQuery);
      setSearchResults(results.items || []);
      setCurrentPlaylist(results.items || []);
      setCurrentView('search');
    } catch (error) {
      console.error('Error searching music:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const playSong = (song, playlist = currentPlaylist) => {
    setCurrentSong(song);
    setIsPlaying(true);
    
    // Set the current playlist if a new one is provided
    if (playlist && playlist.length > 0) {
      setCurrentPlaylist(playlist);
    }
    
    // Find the index of the song in the playlist
    const songIndex = playlist.findIndex(s => s.id.videoId === song.id.videoId);
    if (songIndex !== -1) {
      setCurrentIndex(songIndex);
    }
    
    // Update background with song poster
    if (song.snippet?.thumbnails?.maxres?.url) {
      setBackgroundImage(song.snippet.thumbnails.maxres.url);
    } else if (song.snippet?.thumbnails?.high?.url) {
      setBackgroundImage(song.snippet.thumbnails.high.url);
    } else if (song.snippet?.thumbnails?.medium?.url) {
      setBackgroundImage(song.snippet.thumbnails.medium.url);
    }
    
    // Load video in YouTube player
    if (playerRef.current) {
      playerRef.current.loadVideoById(song.id.videoId);
    }
    
    console.log('Playing song:', song.snippet?.title || song.title);
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
    } else {
      // If no player, just toggle the UI state
      setIsPlaying(!isPlaying);
    }
  };

  const playNext = () => {
    if (currentPlaylist.length > 0) {
      const nextIndex = (currentIndex + 1) % currentPlaylist.length;
      const nextSong = currentPlaylist[nextIndex];
      playSong(nextSong, currentPlaylist);
    }
  };

  const playPrevious = () => {
    if (currentPlaylist.length > 0) {
      const prevIndex = currentIndex === 0 ? currentPlaylist.length - 1 : currentIndex - 1;
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

  // YouTube player event handlers
  const onPlayerReady = (event) => {
    playerRef.current = event.target;
    // Try to get duration immediately
    try {
      const total = event.target.getDuration();
      if (total !== undefined && total > 0) {
        setDuration(total);
      }
    } catch (error) {
      // Player not ready yet
    }
  };

  const onPlayerStateChange = (event) => {
    // 1 = playing, 2 = paused, 0 = ended
    if (event.data === 1) {
      setIsPlaying(true);
      // Try to get duration when playing starts
      try {
        const total = event.target.getDuration();
        if (total !== undefined && total > 0) {
          setDuration(total);
        }
      } catch (error) {
        // Player not ready yet
      }
    } else if (event.data === 2) {
      setIsPlaying(false);
    } else if (event.data === 0) {
      setIsPlaying(false);
      // Video ended, play next song
      playNext();
    }
  };

  const onPlayerError = (event) => {
    console.error('YouTube player error:', event);
    setIsPlaying(false);
  };

  // YouTube player options
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

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDrawerToggle = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
    if (view === 'home') {
      loadTrendingMusic();
    }
  };

  const renderMusicGrid = (songs) => (
    <div className="music-grid">
      {songs.map((song, index) => (
        <div key={song.id.videoId || song.id || index} className="music-card" onClick={() => playSong(song, songs)}>
          <div className="music-thumbnail">
            <img 
              src={song.snippet.thumbnails.medium.url} 
              alt={song.snippet.title}
              loading="lazy"
            />
            <div className="play-overlay">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <polygon points="5,3 19,12 5,21" fill="white" />
              </svg>
            </div>
          </div>
          <div className="music-info">
            <h3 className="music-title">{song.snippet.title}</h3>
            <p className="music-artist">{song.snippet.channelTitle}</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="dashboard-container">
      {/* Dynamic Background */}
      <div 
        className="dashboard-background"
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <div className="background-overlay"></div>
      </div>

      {/* Header */}
      <header className="dashboard-header">
        <button className="menu-button" onClick={handleDrawerToggle}>
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" fill="white"/>
          </svg>
        </button>
        <h1 className="dashboard-title">MoodGroov</h1>
        <div className="header-actions">
          <button className="user-profile" onClick={() => navigate('/login')}>
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="white"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Drawer */}
      <div className={`drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="drawer-content">
          <div className="drawer-header">
            <h2>Menu</h2>
            <button className="close-drawer" onClick={handleDrawerToggle}>
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="white"/>
              </svg>
            </button>
          </div>
          
          <nav className="drawer-nav">
            <button 
              className={`nav-item ${currentView === 'home' ? 'active' : ''}`}
              onClick={() => handleViewChange('home')}
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor"/>
              </svg>
              Home
            </button>
            
            <button 
              className={`nav-item ${currentView === 'search' ? 'active' : ''}`}
              onClick={() => handleViewChange('search')}
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/>
              </svg>
              Search
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="dashboard-main">
        {currentView === 'home' && (
          <div className="home-content">
            <div className="section-header">
              <h2>Trending Music</h2>
              <button className="refresh-btn" onClick={loadTrendingMusic}>
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="white"/>
                </svg>
              </button>
            </div>
            
            {isLoading ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>Loading trending music...</p>
              </div>
            ) : (
              renderMusicGrid(trendingMusic)
            )}
          </div>
        )}

        {currentView === 'search' && (
          <div className="search-content">
            <div className="search-header">
              <div className="search-input-container">
                <input
                  type="text"
                  placeholder="Search for music..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="search-input"
                />
                <button className="search-button" onClick={handleSearch}>
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="white"/>
                  </svg>
                </button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>Searching...</p>
              </div>
            ) : searchResults.length > 0 ? (
              renderMusicGrid(searchResults)
            ) : (
              <div className="no-results">
                <p>No results found. Try a different search term.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Music Player */}
      {currentSong && (
        <div className="music-player">
          <div className="player-info">
            <img 
              src={currentSong.snippet.thumbnails.medium.url} 
              alt={currentSong.snippet.title}
              className="player-thumbnail"
            />
            <div className="player-details">
              <h4 className="player-title">{currentSong.snippet.title}</h4>
              <p className="player-artist">{currentSong.snippet.channelTitle}</p>
            </div>
          </div>
          
          <div className="player-controls">
            <button className="control-btn" onClick={playPrevious}>
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" fill="white"/>
              </svg>
            </button>
            
            <button className="control-btn play-pause" onClick={togglePlayPause}>
              {isPlaying ? (
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="white"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path d="M8 5v14l11-7z" fill="white"/>
                </svg>
              )}
            </button>
            
            <button className="control-btn" onClick={playNext}>
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" fill="white"/>
              </svg>
            </button>
          </div>
          
          <div className="player-progress">
            <span className="time-current">{formatTime(currentTime)}</span>
            <div 
              className="progress-bar" 
              ref={progressRef}
              onClick={seekTo}
            >
              <div 
                className="progress-fill"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              ></div>
            </div>
            <span className="time-total">{formatTime(duration)}</span>
          </div>
        </div>
      )}

      {/* Hidden YouTube Player */}
      {currentSong && (
        <YouTube
          videoId={currentSong.id.videoId}
          opts={playerOptions}
          onReady={onPlayerReady}
          onStateChange={onPlayerStateChange}
          onError={onPlayerError}
        />
      )}
    </div>
  );
};

export default Dashboard;
