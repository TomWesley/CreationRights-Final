// src/services/api.js

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * Helper function to sanitize email for use in filenames
 * @param {string} email - User email
 * @returns {string} - Sanitized string safe for use in filenames
 */
const sanitizeEmail = (email) => {
  if (!email) return '';
  const sanitized = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
  console.log(`Sanitizing email: ${email} => ${sanitized}`);
  return sanitized;
};

/**
 * Helper function to make API requests
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - Promise with response data
 */
const fetchAPI = async (endpoint, options = {}) => {
  try {
    const url = `${API_URL}${endpoint}`;
    
    // Default headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    // Handle non-2xx responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    // Log error and re-throw
    console.error('API request failed:', error);
    throw error;
  }
};

// User data operations
export const saveUserData = async (email, userData) => {
  try {
    const sanitizedEmail = sanitizeEmail(email);
    await fetchAPI(`/users/${sanitizedEmail}`, {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    return true;
  } catch (error) {
    console.error('Error saving user data:', error);
    return false;
  }
};

export const loadUserData = async (email) => {
  try {
    const sanitizedEmail = sanitizeEmail(email);
    console.log(`Loading user data for ${sanitizedEmail}`);
    
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
    const response = await fetch(`${API_URL}/users/${sanitizedEmail}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // User data not found
      }
      throw new Error(`Failed to load user data: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error loading user data:', error);
    return null;
  }
};


// Folders operations
export const saveFolders = async (email, folders) => {
  try {
    const sanitizedEmail = sanitizeEmail(email);
    console.log(`Saving folders for ${sanitizedEmail}`, folders);
    await fetchAPI(`/users/${sanitizedEmail}/folders`, {
      method: 'POST',
      body: JSON.stringify(folders)
    });
    
    return true;
  } catch (error) {
    console.error('Error saving folders:', error);
    return false;
  }
};

export const loadFolders = async (email) => {
  try {
    const sanitizedEmail = sanitizeEmail(email);
    console.log(`Loading folders for ${sanitizedEmail}`);
    
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
    const response = await fetch(`${API_URL}/users/${sanitizedEmail}/folders`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // Folders not found
      }
      throw new Error(`Failed to load folders: ${response.status}`);
    }
    
    const folders = await response.json();
    return folders;
  } catch (error) {
    console.error('Error loading folders:', error);
    return null;
  }
};

// Creations operations
export const saveCreations = async (email, creations) => {
  try {
    const sanitizedEmail = sanitizeEmail(email);
    console.log(`Saving ${creations.length} creations for ${sanitizedEmail}`);
    await fetchAPI(`/users/${sanitizedEmail}/creations`, {
      method: 'POST',
      body: JSON.stringify(creations)
    });
    
    return true;
  } catch (error) {
    console.error('Error saving creations:', error);
    return false;
  }
};

// Add this to your loadCreations function in src/services/api.js

// In src/services/api.js - Update the loadCreations function

export const loadCreations = async (email) => {
  try {
    const sanitizedEmail = sanitizeEmail(email);
    console.log(`Loading creations for ${sanitizedEmail}`);
    
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
    const response = await fetch(`${API_URL}/users/${sanitizedEmail}/creations`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return []; // No creations found
      }
      throw new Error(`Failed to load creations: ${response.status}`);
    }
    
    const creations = await response.json();
    console.log(`Loaded ${creations.length} creations from server`);
    
    // Process each creation to ensure URLs and metadata are correct
    return creations.map(creation => {
      // Ensure metadata exists
      if (!creation.metadata) {
        creation.metadata = {};
      }
      
      // Make sure we have the category set
      if (!creation.metadata.category) {
        creation.metadata.category = mapTypeToMetadataCategory(creation.type);
      }
      
      // Prefer GCS URLs as they are more reliable
      if (creation.gcsUrl) {
        creation.fileUrl = creation.gcsUrl;
      }
      
      return creation;
    });
  } catch (error) {
    console.error('Error loading creations:', error);
    return [];
  }
};

// Helper function to map types to metadata categories
const mapTypeToMetadataCategory = (type) => {
  switch (type) {
    case 'Image': return 'Photography';
    case 'Music': return 'Audio';
    case 'Text': return 'Literature';
    case 'Video': return 'Video';
    default: return type;
  }
};

// YouTube API integration
export const fetchYouTubeVideos = async (channelUrl) => {
  try {
    // Extract channel ID from URL
    const channelId = extractChannelId(channelUrl);
    
    if (!channelId) {
      throw new Error('Invalid YouTube channel URL');
    }

    // YouTube API requires an API key, configured in environment variable
    const apiKey = process.env.REACT_APP_YOUTUBE_API_KEY || 'YOUR_API_KEY_HERE';
    
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

/**
 * Update user profile data
 * @param {string} email 
 * @param {Object} userData 
 * @returns {Promise<boolean>}
 */
export const updateUserProfile = async (email, userData) => {
  try {
    const sanitizedEmail = sanitizeEmail(email);
    await fetchAPI(`/users/${sanitizedEmail}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
};

/**
 * Get user profile photo URL
 * @param {string} email 
 * @returns {Promise<string|null>}
 */
export const getUserProfilePhoto = async (email) => {
  try {
    const sanitizedEmail = sanitizeEmail(email);
    const userData = await loadUserData(email);
    return userData?.photoUrl || null;
  } catch (error) {
    console.error('Error getting profile photo URL:', error);
    return null;
  }
};

// Update the file upload function to work with the new folder structure
export const uploadFile = async (userId, file, creationRightsId = null) => {
  try {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
    const sanitizedUserId = userId.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    
    // Include creationRightsId if provided
    if (creationRightsId) {
      formData.append('creationRightsId', creationRightsId);
      console.log(`Including creationRightsId in upload: ${creationRightsId}`);
    }
    
    // Send request
    const response = await fetch(`${API_URL}/users/${sanitizedUserId}/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Upload failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Add a function for thumbnail upload
export const uploadThumbnail = async (userId, file, creationRightsId) => {
  try {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
    const sanitizedUserId = userId.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('creationRightsId', creationRightsId);
    
    // Send request
    const response = await fetch(`${API_URL}/users/${sanitizedUserId}/creation-thumbnail`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Thumbnail upload failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    throw error;
  }
};

// Update profile photo upload
export const uploadProfilePhoto = async (userId, file) => {
  try {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
    const sanitizedUserId = userId.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    
    // Send request
    const response = await fetch(`${API_URL}/users/${sanitizedUserId}/profile-photo`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Profile photo upload failed with status ${response.status}`);
    }
    
    const result = await response.json();
    
    // Return the URL - prefer GCS URL if available
    return result.file.gcsUrl || result.file.url;
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    throw error;
  }
};
