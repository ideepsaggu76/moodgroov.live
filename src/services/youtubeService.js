import axios from 'axios';

class YouTubeService {
  constructor() {
    this.apiKey = process.env.REACT_APP_YOUTUBE_API_KEY;
    this.baseUrl = 'https://www.googleapis.com/youtube/v3';
  }

  // Check if API key is available
  isApiKeyAvailable() {
    return !!this.apiKey;
  }

  // Search for videos
  async searchVideos(query, maxResults = 20) {
    try {
      if (!this.isApiKeyAvailable()) {
        console.warn('YouTube API key not found. Using mock data.');
        return this.getMockVideoData();
      }

      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          part: 'snippet',
          q: query,
          type: 'video',
          maxResults: maxResults,
          key: this.apiKey,
          videoCategoryId: '10', // Music category
          order: 'relevance'
        }
      });

      return response.data.items.map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`
      }));
    } catch (error) {
      console.error('YouTube search error:', error);
      throw error;
    }
  }

  // Search for music specifically
  async searchMusic(query, maxResults = 20) {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          part: 'snippet',
          q: query,
          type: 'video',
          maxResults: maxResults * 3, // Get more results to filter to ensure we have enough
          key: this.apiKey,
          videoCategoryId: '10', // Music category
          order: 'relevance',
          videoDuration: 'medium' // Exclude shorts
        }
      });

      // Get video details for duration filtering
      const videoIds = response.data.items.map(item => item.id.videoId).join(',');
      const detailsResponse = await axios.get(`${this.baseUrl}/videos`, {
        params: {
          part: 'contentDetails',
          id: videoIds,
          key: this.apiKey
        }
      });

      const videoDetails = {};
      detailsResponse.data.items.forEach(item => {
        videoDetails[item.id] = item.contentDetails;
      });

      return {
        items: response.data.items
          .filter(item => {
            const title = item.snippet.title.toLowerCase();
            const description = item.snippet.description.toLowerCase();
            const duration = videoDetails[item.id.videoId]?.duration || '';
            
            // Parse duration to exclude shorts
            const durationMatch = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            const hours = parseInt(durationMatch?.[1] || 0);
            const minutes = parseInt(durationMatch?.[2] || 0);
            const seconds = parseInt(durationMatch?.[3] || 0);
            const totalSeconds = hours * 3600 + minutes * 60 + seconds;
            
            // Only exclude shorts and obvious non-music content
            const isShort = totalSeconds < 60;
            const isObviouslyNotMusic = title.includes('tutorial') || 
                                      title.includes('how to') || 
                                      title.includes('lesson') ||
                                      title.includes('podcast') ||
                                      title.includes('interview') ||
                                      title.includes('news') ||
                                      description.includes('tutorial') ||
                                      description.includes('how to');
            
            return !isShort && !isObviouslyNotMusic;
          })
          .slice(0, maxResults)
          .map(item => ({
            id: { videoId: item.id.videoId },
            snippet: {
              title: item.snippet.title,
              description: item.snippet.description,
              thumbnails: {
                medium: { url: item.snippet.thumbnails.medium.url },
                high: { url: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium.url },
                maxres: { url: item.snippet.thumbnails.maxres?.url || item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium.url }
              },
              channelTitle: item.snippet.channelTitle,
              publishedAt: item.snippet.publishedAt
            },
            contentDetails: {
              duration: videoDetails[item.id.videoId]?.duration || ''
            },
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`
          }))
      };
    } catch (error) {
      console.error('YouTube music search error:', error);
      throw error;
    }
  }

  // Get video details
  async getVideoDetails(videoId) {
    try {
      const response = await axios.get(`${this.baseUrl}/videos`, {
        params: {
          part: 'snippet,contentDetails,statistics',
          id: videoId,
          key: this.apiKey
        }
      });

      const video = response.data.items[0];
      if (!video) {
        throw new Error('Video not found');
      }

      return {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail: video.snippet.thumbnails.maxres?.url || video.snippet.thumbnails.high.url,
        channelTitle: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt,
        duration: video.contentDetails.duration,
        viewCount: video.statistics.viewCount,
        likeCount: video.statistics.likeCount,
        url: `https://www.youtube.com/watch?v=${video.id}`
      };
    } catch (error) {
      console.error('YouTube video details error:', error);
      throw error;
    }
  }

  // Get trending music videos
  async getTrendingMusic(maxResults = 20) {
    try {
      const response = await axios.get(`${this.baseUrl}/videos`, {
        params: {
          part: 'snippet,statistics,contentDetails',
          chart: 'mostPopular',
          videoCategoryId: '10', // Music category
          maxResults: maxResults,
          key: this.apiKey,
          regionCode: 'US'
        }
      });

      return {
        items: response.data.items
          .filter(item => {
            // Filter out shorts and non-music content
            const duration = item.contentDetails?.duration || '';
            const title = item.snippet.title.toLowerCase();
            const description = item.snippet.description.toLowerCase();
            
            // Parse duration to exclude shorts (< 60 seconds)
            const durationMatch = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            const hours = parseInt(durationMatch?.[1] || 0);
            const minutes = parseInt(durationMatch?.[2] || 0);
            const seconds = parseInt(durationMatch?.[3] || 0);
            const totalSeconds = hours * 3600 + minutes * 60 + seconds;
            
            // Only exclude shorts (< 60 seconds) and obvious non-music content
            const isShort = totalSeconds < 60;
            const isObviouslyNotMusic = title.includes('tutorial') || 
                                      title.includes('how to') || 
                                      title.includes('lesson') ||
                                      title.includes('podcast') ||
                                      title.includes('interview') ||
                                      title.includes('news') ||
                                      description.includes('tutorial') ||
                                      description.includes('how to');
            
            return !isShort && !isObviouslyNotMusic;
          })
          .map(item => ({
            id: { videoId: item.id },
            snippet: {
              title: item.snippet.title,
              description: item.snippet.description,
              thumbnails: {
                medium: { url: item.snippet.thumbnails.medium.url },
                high: { url: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium.url },
                maxres: { url: item.snippet.thumbnails.maxres?.url || item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium.url }
              },
              channelTitle: item.snippet.channelTitle,
              publishedAt: item.snippet.publishedAt
            },
            contentDetails: {
              duration: item.contentDetails.duration
            },
            statistics: {
              viewCount: item.statistics.viewCount,
              likeCount: item.statistics.likeCount
            },
            url: `https://www.youtube.com/watch?v=${item.id}`
          }))
      };
    } catch (error) {
      console.error('YouTube trending error:', error);
      // Return fallback trending music for demo purposes
      return {
        items: [
          {
            id: { videoId: 'trending1' },
            snippet: {
              title: 'Trending Song 1 - Artist Name',
              description: 'Popular trending music video',
              thumbnails: {
                medium: { url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg' },
                high: { url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg' },
                maxres: { url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg' }
              },
              channelTitle: 'Popular Artist',
              publishedAt: '2024-01-01T12:00:00Z'
            }
          },
          {
            id: { videoId: 'trending2' },
            snippet: {
              title: 'Hit Song 2024 - Chart Topper',
              description: 'Latest hit song',
              thumbnails: {
                medium: { url: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/mqdefault.jpg' },
                high: { url: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg' },
                maxres: { url: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/maxresdefault.jpg' }
              },
              channelTitle: 'Chart Toppers',
              publishedAt: '2024-01-15T14:30:00Z'
            }
          },
          {
            id: { videoId: 'trending3' },
            snippet: {
              title: 'Viral Music Video - Dance Hit',
              description: 'Viral dance music',
              thumbnails: {
                medium: { url: 'https://i.ytimg.com/vi/9bZkp7q19f0/mqdefault.jpg' },
                high: { url: 'https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg' },
                maxres: { url: 'https://i.ytimg.com/vi/9bZkp7q19f0/maxresdefault.jpg' }
              },
              channelTitle: 'Viral Hits',
              publishedAt: '2024-02-01T10:15:00Z'
            }
          },
          {
            id: { videoId: 'trending4' },
            snippet: {
              title: 'Pop Sensation - New Release',
              description: 'Latest pop music sensation',
              thumbnails: {
                medium: { url: 'https://i.ytimg.com/vi/YQHsXMglC9A/mqdefault.jpg' },
                high: { url: 'https://i.ytimg.com/vi/YQHsXMglC9A/hqdefault.jpg' },
                maxres: { url: 'https://i.ytimg.com/vi/YQHsXMglC9A/maxresdefault.jpg' }
              },
              channelTitle: 'Pop Stars',
              publishedAt: '2024-02-10T16:45:00Z'
            }
          }
        ]
      };
    }
  }

  // Get music playlists
  async searchPlaylists(query, maxResults = 20) {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          part: 'snippet',
          q: query,
          type: 'playlist',
          maxResults: maxResults,
          key: this.apiKey,
          order: 'relevance'
        }
      });

      return response.data.items.map(item => ({
        id: item.id.playlistId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        url: `https://www.youtube.com/playlist?list=${item.id.playlistId}`
      }));
    } catch (error) {
      console.error('YouTube playlist search error:', error);
      throw error;
    }
  }

  // Get playlist videos
  async getPlaylistVideos(playlistId, maxResults = 50) {
    try {
      const response = await axios.get(`${this.baseUrl}/playlistItems`, {
        params: {
          part: 'snippet',
          playlistId: playlistId,
          maxResults: maxResults,
          key: this.apiKey
        }
      });

      return response.data.items.map(item => ({
        id: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`
      }));
    } catch (error) {
      console.error('YouTube playlist videos error:', error);
      throw error;
    }
  }

  // Extract video ID from YouTube URL
  extractVideoId(url) {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  // Format duration from ISO 8601 format
  formatDuration(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return '0:00';

    const hours = (match[1] || '').replace('H', '');
    const minutes = (match[2] || '').replace('M', '');
    const seconds = (match[3] || '').replace('S', '');

    let formatted = '';
    if (hours) {
      formatted += `${hours}:`;
    }
    
    if (minutes) {
      formatted += hours ? minutes.padStart(2, '0') : minutes;
    } else {
      formatted += '0';
    }
    
    formatted += ':';
    formatted += seconds ? seconds.padStart(2, '0') : '00';

    return formatted;
  }

  // Create YouTube embed URL
  getEmbedUrl(videoId, autoplay = false, controls = true) {
    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      controls: controls ? '1' : '0',
      rel: '0',
      showinfo: '0',
      modestbranding: '1'
    });

    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  }

  // Mock data for when API key is not available
  getMockVideoData() {
    const mockSongs = [
      {
        id: { videoId: 'dQw4w9WgXcQ' },
        snippet: {
          title: 'Sample Song 1 - Popular Hit',
          channelTitle: 'Sample Artist',
          description: 'A sample song for demo purposes',
          thumbnails: {
            medium: { url: 'https://via.placeholder.com/320x180/667eea/ffffff?text=Song+1' },
            default: { url: 'https://via.placeholder.com/120x90/667eea/ffffff?text=Song+1' }
          },
          publishedAt: new Date().toISOString()
        }
      },
      {
        id: { videoId: 'L_jWHffIx5E' },
        snippet: {
          title: 'Sample Song 2 - Trending Now',
          channelTitle: 'Demo Artist',
          description: 'Another sample song for demo',
          thumbnails: {
            medium: { url: 'https://via.placeholder.com/320x180/764ba2/ffffff?text=Song+2' },
            default: { url: 'https://via.placeholder.com/120x90/764ba2/ffffff?text=Song+2' }
          },
          publishedAt: new Date().toISOString()
        }
      },
      {
        id: { videoId: 'kJQP7kiw5Fk' },
        snippet: {
          title: 'Sample Song 3 - Chart Topper',
          channelTitle: 'Music Demo',
          description: 'Third sample song for the demo',
          thumbnails: {
            medium: { url: 'https://via.placeholder.com/320x180/ff6b6b/ffffff?text=Song+3' },
            default: { url: 'https://via.placeholder.com/120x90/ff6b6b/ffffff?text=Song+3' }
          },
          publishedAt: new Date().toISOString()
        }
      },
      {
        id: { videoId: 'QH2-TGUlwu4' },
        snippet: {
          title: 'Sample Song 4 - Billboard Hit',
          channelTitle: 'Sample Records',
          description: 'Fourth sample song',
          thumbnails: {
            medium: { url: 'https://via.placeholder.com/320x180/4ecdc4/ffffff?text=Song+4' },
            default: { url: 'https://via.placeholder.com/120x90/4ecdc4/ffffff?text=Song+4' }
          },
          publishedAt: new Date().toISOString()
        }
      },
      {
        id: { videoId: 'fJ9rUzIMcZQ' },
        snippet: {
          title: 'Sample Song 5 - Radio Favorite',
          channelTitle: 'Demo Music Co',
          description: 'Fifth sample song for demo',
          thumbnails: {
            medium: { url: 'https://via.placeholder.com/320x180/45b7d1/ffffff?text=Song+5' },
            default: { url: 'https://via.placeholder.com/120x90/45b7d1/ffffff?text=Song+5' }
          },
          publishedAt: new Date().toISOString()
        }
      },
      {
        id: { videoId: 'M7lc1UVf-VE' },
        snippet: {
          title: 'Sample Song 6 - Top 40',
          channelTitle: 'Sample Music Group',
          description: 'Sixth sample song',
          thumbnails: {
            medium: { url: 'https://via.placeholder.com/320x180/96ceb4/ffffff?text=Song+6' },
            default: { url: 'https://via.placeholder.com/120x90/96ceb4/ffffff?text=Song+6' }
          },
          publishedAt: new Date().toISOString()
        }
      }
    ];

    return { items: mockSongs };
  }
}

const youtubeServiceInstance = new YouTubeService();
export default youtubeServiceInstance;
