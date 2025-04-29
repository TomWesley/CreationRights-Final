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
    console.log(`File details: name=${file.name}, size=${file.size}, type=${file.type}`);
    
    if (creationRightsId) {
      console.log(`Using creationRightsId: ${creationRightsId}`);
    }
    
    // Check if this is a large file or video that should use signed URLs
    if (file.size > 25 * 1024 * 1024 || file.type.startsWith('video/')) {
      console.log(`Large file or video detected, using signed URL approach`);
      return await uploadLargeFileWithSignedUrl(userId, file, creationRightsId);
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    
    // Include creationRightsId if provided
    if (creationRightsId) {
      formData.append('creationRightsId', creationRightsId);
    }
    
    // Add a timestamp to prevent caching issues
    formData.append('timestamp', Date.now().toString());
    
    // Send request with explicit POST method and retry logic
    console.log('Sending upload request...');
    
    // Use a timeout promise to handle network issues
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Upload request timeout')), 30000); // 30 second timeout
    });
    
    const fetchPromise = fetch(`${API_URL}/api/users/${sanitizedUserId}/upload`, {
      method: 'POST',
      body: formData,
      // Do not set Content-Type header - browser will set it with boundary for FormData
    });
    
    // Race the fetch against the timeout
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    if (!response.ok) {
      // Try to get the error response
      let errorMessage = `Upload failed with status ${response.status}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (parseError) {
        // If JSON parsing fails, try to get the text
        try {
          const errorText = await response.text();
          if (errorText) errorMessage += `: ${errorText}`;
        } catch (textError) {
          // Ignore if we can't get the text
        }
      }
      
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    console.log('Upload completed successfully:', result);
    return result;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Upload a large file using the signed URL approach
 * @param {string} userId - User ID (email)
 * @param {File} file - File object to upload
 * @param {string} creationRightsId - Creation Rights ID
 * @param {Function} progressCallback - Optional callback for progress updates
 * @returns {Promise<Object>} - Response with file info
 */
export const uploadLargeFileWithSignedUrl = async (userId, file, creationRightsId = null, progressCallback = null) => {
  try {
    // Get a signed URL for direct upload
    const signedUrlResult = await getSignedUploadUrl(userId, file, creationRightsId);
    
    if (progressCallback) progressCallback(10); // Signal that we got the signed URL
    
    // Upload the file directly to GCS
    await uploadFileWithSignedUrl(
      signedUrlResult.signedUrl, 
      file,
      (progress) => {
        if (progressCallback) {
          // Map progress to range 10-90
          progressCallback(10 + (progress * 0.8));
        }
      }
    );
    
    if (progressCallback) progressCallback(90); // Signal that the upload is complete
    
    // If it's a video, try to generate and upload a thumbnail
    if (file.type.startsWith('video/')) {
      try {
        const thumbnailDataUrl = await generateVideoThumbnail(file);
        
        // Convert data URL to blob
        const fetchResponse = await fetch(thumbnailDataUrl);
        const thumbnailBlob = await fetchResponse.blob();
        
        // Upload the thumbnail
        await uploadVideoThumbnail(
          userId,
          signedUrlResult.fileInfo.creationRightsId,
          thumbnailBlob
        );
      } catch (thumbnailError) {
        console.error('Error processing video thumbnail:', thumbnailError);
        // Continue without thumbnail
      }
    }
    
    if (progressCallback) progressCallback(95); // Signal that we're confirming the upload
    
    // Confirm the upload is complete
    const result = await confirmFileUpload(userId, signedUrlResult.fileInfo.creationRightsId);
    
    if (progressCallback) progressCallback(100); // Signal that everything is done
    
    return result;
  } catch (error) {
    console.error('Error with signed URL upload:', error);
    throw error;
  }
};

/**
 * Get a signed URL for direct upload to Google Cloud Storage
 * @param {string} userId - User ID (email)
 * @param {File} file - File object to upload
 * @param {string} creationRightsId - Optional creation rights ID
 * @returns {Promise<Object>} - Response with signed URL and file info
 */
export const getSignedUploadUrl = async (userId, file, creationRightsId = null) => {
  try {
    const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
    const sanitizedUserId = userId.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    console.log(`Getting signed URL for ${file.name}, type: ${file.type}, size: ${file.size}`);
    
    const response = await fetch(`${API_URL}/api/users/${sanitizedUserId}/generate-upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contentType: file.type,
        fileSize: file.size,
        creationRightsId: creationRightsId || undefined
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to get signed URL: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting signed URL:', error);
    throw error;
  }
};

/**
 * Upload a file directly to GCS using a signed URL
 * @param {string} signedUrl - The signed URL for upload
 * @param {File} file - File object to upload
 * @param {Function} progressCallback - Callback for upload progress
 * @returns {Promise<Object>} - Response from the upload
 */
export const uploadFileWithSignedUrl = async (signedUrl, file, progressCallback = null) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.open('PUT', signedUrl, true);
    xhr.setRequestHeader('Content-Type', file.type);
    
    if (progressCallback) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          progressCallback(progress);
        }
      });
    }
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ success: true });
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });
    
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });
    
    xhr.send(file);
  });
};

/**
 * Confirm that a file was uploaded successfully
 * @param {string} userId - User ID (email)
 * @param {string} creationRightsId - Creation Rights ID
 * @param {Object} metadata - Additional metadata for the file
 * @returns {Promise<Object>} - Response with file info
 */
export const confirmFileUpload = async (userId, creationRightsId, metadata = {}) => {
  try {
    const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
    const sanitizedUserId = userId.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    const response = await fetch(`${API_URL}/api/users/${sanitizedUserId}/${creationRightsId}/confirm-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ metadata })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to confirm upload: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error confirming upload:', error);
    throw error;
  }
};

/**
 * Upload a thumbnail for a video file
 * @param {string} userId - User ID (email)
 * @param {string} creationRightsId - Creation Rights ID
 * @param {File|Blob} thumbnailFile - Thumbnail file or blob
 * @returns {Promise<Object>} - Response with thumbnail URL
 */
export const uploadVideoThumbnail = async (userId, creationRightsId, thumbnailFile) => {
  try {
    const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
    const sanitizedUserId = userId.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    const formData = new FormData();
    formData.append('thumbnail', thumbnailFile);
    
    const response = await fetch(`${API_URL}/api/users/${sanitizedUserId}/${creationRightsId}/upload-thumbnail`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to upload thumbnail: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error uploading video thumbnail:', error);
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
    console.log('Generating thumbnail for video:', videoFile.name);
    
    // Create video element to load the file
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    
    // Create URL for the video file
    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;
    
    // Track if any errors occurred
    let errorOccurred = false;
    
    // Set up event listeners
    video.onloadeddata = () => {
      console.log('Video loaded, seeking to thumbnail position');
      // Seek to 25% of the video duration for the thumbnail
      try {
        if (video.duration && isFinite(video.duration)) {
          video.currentTime = video.duration * 0.25;
        } else {
          // If duration is not available, try to seek to 1 second
          video.currentTime = 1;
        }
      } catch (e) {
        console.error('Error seeking video:', e);
        errorOccurred = true;
        URL.revokeObjectURL(videoUrl);
        reject(e);
      }
    };
    
    video.onseeked = () => {
      if (errorOccurred) return;
      
      try {
        console.log('Video seeked, capturing thumbnail');
        // Create canvas to capture the frame
        const canvas = document.createElement('canvas');
        const width = video.videoWidth || 320;
        const height = video.videoHeight || 240;
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw the video frame to the canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, width, height);
        
        // Convert canvas to data URL
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
        console.log('Thumbnail generated successfully');
        
        // Clean up
        URL.revokeObjectURL(videoUrl);
        
        resolve(thumbnailUrl);
      } catch (error) {
        console.error('Error generating thumbnail:', error);
        URL.revokeObjectURL(videoUrl);
        reject(error);
      }
    };
    
    video.onerror = (e) => {
      console.error('Video loading error:', e);
      errorOccurred = true;
      URL.revokeObjectURL(videoUrl);
      reject(new Error('Error loading video for thumbnail generation'));
    };
    
    // Add timeout to avoid hanging
    const timeout = setTimeout(() => {
      if (!errorOccurred) {
        console.error('Thumbnail generation timed out');
        errorOccurred = true;
        URL.revokeObjectURL(videoUrl);
        reject(new Error('Thumbnail generation timed out'));
      }
    }, 10000); // 10 second timeout
    
    // Trigger loading of the video
    console.log('Loading video for thumbnail generation');
    video.load();
    
    // Catch any unhandled errors
    video.addEventListener('error', (e) => {
      console.error('Unhandled video error:', e);
      clearTimeout(timeout);
      URL.revokeObjectURL(videoUrl);
      reject(e);
    });
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

/**
 * Maps general file types to specific metadata categories 
 * @param {string} fileType - The general file type (Image, Music, Video, Text)
 * @returns {string} - The corresponding metadata category
 */
export const mapTypeToMetadataCategory = (fileType) => {
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

/**
 * Helper function to retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} initialDelay - Initial delay in ms
 * @returns {Promise<any>} - Result of the function
 */
export const retryWithBackoff = async (fn, maxRetries = 3, initialDelay = 1000) => {
  let retries = 0;
  let delay = initialDelay;
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      retries++;
      
      if (retries >= maxRetries) {
        throw error;
      }
      
      console.log(`Retrying after error: ${error.message} (Attempt ${retries}/${maxRetries})`);
      
      // Wait for the delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Exponential backoff
      delay *= 2;
    }
  }
};