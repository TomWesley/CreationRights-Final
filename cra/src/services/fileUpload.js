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
export const generateVideoThumbnail = (videoFile) => {
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