// src/services/youtubeApi.js

// This file handles YouTube API integration

/**
 * Fetches videos from a YouTube channel using the YouTube Data API
 * 
 * @param {string} channelUrl - The URL of the YouTube channel
 * @returns {Promise<Array>} - Array of video objects
 */
export const fetchYouTubeVideos = async (channelUrl) => {
    try {
      // Extract channel ID from URL
      const channelId = extractChannelId(channelUrl);
      
      if (!channelId) {
        throw new Error('Invalid YouTube channel URL');
      }
  
      // YouTube API requires an API key, configured in environment variable
      const apiKey = process.env.REACT_APP_YOUTUBE_API_KEY;
      
      if (!apiKey) {
        throw new Error('YouTube API key not configured');
      }
  
      // First get the uploads playlist ID from the channel
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
      );
  
      if (!channelResponse.ok) {
        throw new Error('Failed to fetch channel information');
      }
  
      const channelData = await channelResponse.json();
      
      if (!channelData.items || channelData.items.length === 0) {
        throw new Error('Channel not found or no access to channel data');
      }
  
      const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
  
      // Now fetch videos from the uploads playlist
      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${uploadsPlaylistId}&key=${apiKey}`
      );
  
      if (!videosResponse.ok) {
        throw new Error('Failed to fetch videos');
      }
  
      const videosData = await videosResponse.json();
  
      // Transform the response to a more usable format
      const videos = videosData.items.map(item => ({
        id: item.contentDetails.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.medium.url,
        publishedAt: item.snippet.publishedAt,
        channelTitle: item.snippet.channelTitle,
        type: 'Video', // This will be used for the creation type
        source: 'YouTube',
        sourceUrl: `https://www.youtube.com/watch?v=${item.contentDetails.videoId}`
      }));
  
      return videos;
    } catch (error) {
      console.error('Error fetching YouTube videos:', error);
      throw error;
    }
  };
  
  /**
   * Extract the channel ID from various forms of YouTube channel URLs
   * 
   * @param {string} url - The YouTube channel URL
   * @returns {string|null} - The channel ID or null if not found
   */
  const extractChannelId = (url) => {
    try {
      const urlObj = new URL(url);
      
      // Handle various YouTube URL formats
      
      // Format: youtube.com/channel/UC...
      if (urlObj.pathname.includes('/channel/')) {
        const parts = urlObj.pathname.split('/');
        const channelIndex = parts.indexOf('channel');
        if (channelIndex !== -1 && parts[channelIndex + 1]) {
          return parts[channelIndex + 1];
        }
      }
      
      // Format: youtube.com/c/ChannelName
      // This format requires an additional API call to resolve to a channel ID
      // For now, we'll guide users to use the channel ID format instead
      
      // Format: youtube.com/@username
      // This also requires an additional API call
      
      return null;
    } catch (error) {
      return null;
    }
  };
  
  /**
   * Convert YouTube video data to creation object format
   * 
   * @param {Object} video - Video data from YouTube API
   * @returns {Object} - Creation object compatible with the app
   */
  export const convertVideoToCreation = (video) => {
    return {
      id: `yt-${video.id}`,
      title: video.title,
      type: 'Video',
      dateCreated: new Date(video.publishedAt).toISOString().split('T')[0],
      rights: `Copyright © ${new Date(video.publishedAt).getFullYear()} ${video.channelTitle}`,
      notes: video.description.substring(0, 500) + (video.description.length > 500 ? '...' : ''),
      tags: ['youtube', 'video'],
      folderId: '',
      thumbnailUrl: video.thumbnailUrl,
      sourceUrl: video.sourceUrl,
      source: 'YouTube'
    };
  };