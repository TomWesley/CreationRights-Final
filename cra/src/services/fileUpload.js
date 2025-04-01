// src/services/fileUpload.js
/**
 * Uploads a file to the server
 * @param {string} userId - User ID (email)
 * @param {File} file - File object to upload
 * @param {string} creationRightsId - Creation Rights ID to associate with the file
 * @returns {Promise<Object>} - Response with file info
 */
export const uploadFile = async (userId, file, creationRightsId = null) => {
  try {
    // Fix API URL format - make sure it doesn't have trailing slashes
    const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
    const sanitizedUserId = userId.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    console.log(`Uploading file to ${API_URL}/api/users/${sanitizedUserId}/upload`);
    
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    
    // Include creationRightsId if provided
    if (creationRightsId) {
      formData.append('creationRightsId', creationRightsId);
    }
    
    // Send request - notice the path is now /api/users/...
    const response = await fetch(`${API_URL}/api/users/${sanitizedUserId}/upload`, {
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

/**
 * Get file preview URL (local or from server)
 * @param {File} file - File object
 * @returns {string} - URL for preview
 */
export const getFilePreviewUrl = (file) => {
  return URL.createObjectURL(file);
};

/**
 * Generate thumbnail from video file
 * @param {File} videoFile - Video file
 * @returns {Promise<string>} - Thumbnail data URL
 */
// Replace the generateVideoThumbnail function in fileUpload.js

export const generateVideoThumbnail = async (videoFile, userId) => {
  // First generate the thumbnail locally
  const thumbnailDataUrl = await generateVideoThumbnailLocal(videoFile);
  
  // Convert data URL to Blob for upload
  const thumbnailBlob = dataURLToBlob(thumbnailDataUrl);
  const thumbnailFile = new File([thumbnailBlob], 'thumbnail.jpg', { type: 'image/jpeg' });
  
  // If we have a user ID, upload the thumbnail to the server
  if (userId) {
    try {
      const result = await uploadFile(userId, thumbnailFile);
      return result.file.gcsUrl || result.file.url;
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      return thumbnailDataUrl; // Fallback to local thumbnail
    }
  }
  
  return thumbnailDataUrl;
};

// Generate thumbnail locally
const generateVideoThumbnailLocal = (videoFile) => {
  return new Promise((resolve, reject) => {
    // Create video element to load the file
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    
    // Create URL for the video file
    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;
    
    // Set up event listeners
    video.onloadeddata = () => {
      // Seek to 25% of the video duration for the thumbnail
      video.currentTime = video.duration * 0.25;
    };
    
    video.onseeked = () => {
      // Create canvas to capture the frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the video frame to the canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to data URL
      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      // Clean up
      URL.revokeObjectURL(videoUrl);
      
      resolve(thumbnailUrl);
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(videoUrl);
      reject(new Error('Error generating video thumbnail'));
    };
    
    // Trigger loading of the video
    video.load();
  });
};

// Convert data URL to Blob for uploading
const dataURLToBlob = (dataURL) => {
  const parts = dataURL.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  
  return new Blob([uInt8Array], { type: contentType });
};

/**
 * Get metadata for audio file
 * @param {File} audioFile - Audio file
 * @returns {Promise<Object>} - Audio metadata
 */
export const getAudioMetadata = (audioFile) => {
  return new Promise((resolve, reject) => {
    // Create audio element to load the file
    const audio = document.createElement('audio');
    
    // Create URL for the audio file
    const audioUrl = URL.createObjectURL(audioFile);
    audio.src = audioUrl;
    
    // Set up event listeners
    audio.onloadedmetadata = () => {
      // Format duration
      const duration = formatDuration(audio.duration);
      
      // Clean up
      URL.revokeObjectURL(audioUrl);
      
      resolve({ duration });
    };
    
    audio.onerror = () => {
      URL.revokeObjectURL(audioUrl);
      reject(new Error('Error reading audio metadata'));
    };
    
    // Trigger loading of the audio
    audio.load();
  });
};

/**
 * Format duration in seconds to MM:SS format
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration
 */
const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Extract URL from literature text if present
 * @param {string} text - Text to search for URLs
 * @returns {string|null} - Extracted URL or null
 */
export const extractUrlFromText = (text) => {
  if (!text) return null;
  
  // Look for URLs in the text
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  
  if (matches && matches.length > 0) {
    return matches[0];
  }
  
  return null;
};
/**
 * Maps general file types to specific metadata categories 
 * @param {string} fileType - The general file type (Image, Music, Video, Text)
 * @returns {string} - The corresponding metadata category
 */
const mapTypeToMetadataCategory = (fileType) => {
  switch (fileType.toLowerCase()) {
    case 'image':
      return 'Photography';
    case 'music':
      return 'Audio';
    case 'text':
      return 'Literature';
    case 'video':
      return 'Video';
    default:
      return fileType;
  }
};


/**
 * Uploads a profile photo for a user
 * @param {string} userId - User ID (email)
 * @param {File} photoFile - Photo file to upload
 * @returns {Promise<Object>} - Response with file info
 */
// Update this function in src/services/fileUpload.js
// Update this function in src/services/fileUpload.js
export const uploadProfilePhoto = async (userId, photoFile) => {
  try {
    // Fix API URL format - make sure it doesn't have trailing slashes
    const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
    const sanitizedUserId = userId.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    console.log(`Uploading profile photo to ${API_URL}/api/users/${sanitizedUserId}/profile-photo`);
    
    // Create form data
    const formData = new FormData();
    formData.append('file', photoFile);
    
    // Send request - notice the path is now /api/users/...
    const response = await fetch(`${API_URL}/api/users/${sanitizedUserId}/profile-photo`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Upload failed with status ${response.status}`);
    }
    
    const result = await response.json();
    
    // Return the URL - prefer GCS URL if available
    return result.file.gcsUrl || result.file.url;
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    throw error;
  }
};

// Add this to src/services/fileUpload.js

/**
 * Convert a Google Cloud Storage URL to a proxied URL
 * @param {string} gcsUrl - The GCS URL to convert
 * @param {string} userId - User ID (email)
 * @returns {string} - Proxied URL
 */
export const getProxiedImageUrl = (gcsUrl, userId) => {
  if (!gcsUrl) return null;
  if (!gcsUrl.includes('storage.googleapis.com')) return gcsUrl; // Not a GCS URL
  
  // Extract the path after the bucket name
  const sanitizedUserId = userId.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const bucketName = process.env.REACT_APP_GCS_BUCKET_NAME || 'demo-app-creationrights';
  const basePath = `https://storage.googleapis.com/${bucketName}/users/${sanitizedUserId}/`;
  
  // If URL doesn't match expected pattern, return unchanged
  if (!gcsUrl.startsWith(basePath)) return gcsUrl;
  
  // Extract the object path (everything after the user path)
  const objectPath = gcsUrl.substring(basePath.length);
  
  // Create the proxied URL
  const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
  return `${API_URL}/api/images/${sanitizedUserId}/${objectPath}`;
};