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
// Update the saveUserData function in src/services/api.js

export const saveUserData = async (email, userData) => {
  try {
    const sanitizedEmail = sanitizeEmail(email);
    console.log(`Saving user data for ${sanitizedEmail}...`);
    
    // Use correct API URL format
    const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
    
    // Log the full URL for debugging
    // The correct path should match your server's expected structure: /api/users/{userId}
    // The server will then store this at users/{userId}/profile/info.json internally
    const url = `${API_URL}/api/users/${sanitizedEmail}`;
    console.log(`POST request to: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response (${response.status}):`, errorText);
      throw new Error(`Failed to save user data: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Save user data response:', result);
    return true;
  } catch (error) {
    console.error('Error saving user data:', error);
    return false;
  }
};

// Similarly, update the loadUserData function:
export const loadUserData = async (email) => {
  try {
    const sanitizedEmail = sanitizeEmail(email);
    console.log(`Loading user data for ${sanitizedEmail}`);
    
    // Use correct API URL format
    const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
    const url = `${API_URL}/api/users/${sanitizedEmail}`;
    console.log(`GET request to: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Error response (${response.status}):`, await response.text().catch(() => 'No response text'));
      if (response.status === 404) {
        return null; // User data not found
      }
      throw new Error(`Failed to load user data: ${response.status} ${response.statusText}`);
    }
    
    const userData = await response.json();
    console.log('User data loaded:', userData);
    return userData;
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
        console.log('No creations found, returning empty array');
        return []; // No creations found
      }
      throw new Error(`Failed to load creations: ${response.status}`);
    }
    
    const creations = await response.json();
    console.log(`Loaded ${creations.length} creations from server`);
    
    // Defensive programming - ensure creations is an array
    if (!Array.isArray(creations)) {
      console.warn('Received non-array creations data, initializing empty array');
      return [];
    }
    
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

/**
 * Get the profile photo URL for a user
 * @param {string} email - User email
 * @returns {Promise<string|null>} - URL to the profile photo or null if not found
 */
export const getProfilePhotoUrl = async (email) => {
  try {
    const sanitizedEmail = sanitizeEmail(email);
    console.log(`Getting profile photo URL for ${sanitizedEmail}`);
    
    // Use correct API URL format
    const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
    const url = `${API_URL}/api/users/${sanitizedEmail}/profile-photo-url`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log('No profile photo found');
        return null;
      }
      throw new Error(`Failed to get profile photo URL: ${response.status}`);
    }
    
    const data = await response.json();
    return data.photoUrl;
  } catch (error) {
    console.error('Error getting profile photo URL:', error);
    return null;
  }
};

/**
 * Get the direct profile photo URL (for use in img src attributes)
 * @param {string} email - User email
 * @returns {string} - URL to the profile photo
 */
export const getDirectProfilePhotoUrl = (email) => {
  const sanitizedEmail = sanitizeEmail(email);
  const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
  return `${API_URL}/api/users/${sanitizedEmail}/profile-photo?t=${Date.now()}`;
};

// Add these functions to your existing api.js file

/**
 * Save social profiles to storage
 * @param {string} userEmail - User's email to use as ID
 * @param {Object} socialProfiles - Object containing social media profile data
 * @returns {Promise<Object>} - A promise that resolves to the saved data
 */
export const saveSocialProfiles = async (userEmail, socialProfiles) => {
  try {
    if (!userEmail) {
      throw new Error('User email is required');
    }
    
    // Store in local storage as a fallback/demo mechanism
    localStorage.setItem(`socialProfiles_${userEmail}`, JSON.stringify(socialProfiles));
    console.log(`Saved social profiles for user ${userEmail} to localStorage`);
    
    // In a real application, you would make an API call here:
    // const response = await fetch(`/api/users/${userEmail}/social-profiles`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(socialProfiles)
    // });
    // return response.json();
    
    return socialProfiles;
  } catch (error) {
    console.error('Error saving social profiles:', error);
    throw error;
  }
};


/**
 * Retry a function with exponential backoff
 * @param {Function} fn - The function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} initialDelay - Initial delay in ms
 * @returns {Promise<any>} - Promise with result
 */
const retryWithBackoff = async (fn, maxRetries = 3, initialDelay = 300) => {
  let retries = 0;
  let delay = initialDelay;
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (retries >= maxRetries) throw error;
      
      console.log(`Retry ${retries + 1}/${maxRetries} after ${delay}ms`);
      
      // Wait for the delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase delay with some randomness for next attempt
      delay = delay * 2 * (0.8 + Math.random() * 0.4);
      retries++;
    }
  }
};

/**
 * Check if a user has the necessary folder structure and create if missing
 * @param {string} email - User's email 
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const checkUserFolderStructure = async (email) => {
  try {
    const sanitizedEmail = sanitizeEmail(email);
    console.log(`Checking folder structure for ${sanitizedEmail}`);
    
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
    
    // Make a request to creations endpoint which now ensures folders exist
    await fetch(`${API_URL}/users/${sanitizedEmail}/creations`);
    
    return true;
  } catch (error) {
    console.error('Error checking folder structure:', error);
    return false;
  }
};


/**
 * Load social profiles from storage
 * @param {string} userEmail - User's email to use as ID
 * @returns {Promise<Object>} - A promise that resolves to the loaded data
 */
export const loadSocialProfiles = async (userEmail) => {
  try {
    if (!userEmail) {
      throw new Error('User email is required');
    }
    
    // In a real application, you would make an API call here:
    // const response = await fetch(`/api/users/${userEmail}/social-profiles`);
    // return response.json();
    
    // As a fallback/demo, load from localStorage
    const socialProfilesJson = localStorage.getItem(`socialProfiles_${userEmail}`);
    
    if (socialProfilesJson) {
      const socialProfiles = JSON.parse(socialProfilesJson);
      console.log(`Loaded social profiles for user ${userEmail} from localStorage`);
      return socialProfiles;
    }
    
    // Return empty social data if nothing found
    return {
      instagram: null,
      twitter: null,
      tiktok: null,
      linkedin: null
    };
  } catch (error) {
    console.error('Error loading social profiles:', error);
    throw error;
  }
};