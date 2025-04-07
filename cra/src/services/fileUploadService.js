// src/services/fileUploadService.js

/**
 * Handles file uploads to Google Cloud Storage
 */

/**
 * Uploads a file to the server and GCS bucket
 * @param {string} userId - User ID (email)
 * @param {File} file - File object to upload
 * @param {string} creationRightsId - Creation Rights ID to associate with the file
 * @returns {Promise<Object>} - Response with file info
 */
export const uploadFile = async (userId, file, creationRightsId) => {
    try {
      // Fix API URL format - make sure it doesn't have trailing slashes
      const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
      const sanitizedUserId = userId.toLowerCase().replace(/[^a-z0-9]/g, '_');
      
      console.log(`Uploading file to ${API_URL}/api/users/${sanitizedUserId}/upload`);
      console.log(`File details: name=${file.name}, size=${file.size}, type=${file.type}`);
      console.log(`Using creationRightsId: ${creationRightsId}`);
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Include creationRightsId
      formData.append('creationRightsId', creationRightsId);
      
      // Add a timestamp to prevent caching issues
      formData.append('timestamp', Date.now().toString());
      
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
   * Saves the creation metadata to Google Cloud Storage
   * @param {string} userId - User ID (email)
   * @param {Object} creationData - Creation metadata
   * @returns {Promise<Object>} - Response from the server
   */
  export const saveCreationMetadata = async (userId, creationData) => {
    try {
      const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
      const sanitizedUserId = userId.toLowerCase().replace(/[^a-z0-9]/g, '_');
      
      console.log(`Saving metadata to ${API_URL}/api/users/${sanitizedUserId}/creations`);
      
      // Get existing creations first
      const response = await fetch(`${API_URL}/api/users/${sanitizedUserId}/creations`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch existing creations: ${response.status}`);
      }
      
      const existingCreations = await response.json();
      
      // Make sure existingCreations is an array
      const creationsArray = Array.isArray(existingCreations) ? existingCreations : [];
      
      // Check if creation with this ID already exists
      const existingIndex = creationsArray.findIndex(c => c.id === creationData.id);
      
      // Update or add the creation
      if (existingIndex >= 0) {
        creationsArray[existingIndex] = creationData;
      } else {
        creationsArray.push(creationData);
      }
      
      // Save the updated creations array
      const saveResponse = await fetch(`${API_URL}/api/users/${sanitizedUserId}/creations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(creationsArray)
      });
      
      if (!saveResponse.ok) {
        const errorData = await saveResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save metadata: ${saveResponse.status}`);
      }
      
      const result = await saveResponse.json();
      console.log('Metadata saved successfully:', result);
      return result;
    } catch (error) {
      console.error('Error saving creation metadata:', error);
      throw error;
    }
  };
  
  /**
   * Generate a unique creation rights ID
   * @returns {string} - Unique ID with CR- prefix
   */
  export const generateCreationRightsId = () => {
    return `CR-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };
  
  /**
   * Get a preview URL for a file
   * @param {File} file - The file to preview
   * @returns {string} - Object URL for the file
   */
  export const getFilePreviewUrl = (file) => {
    return URL.createObjectURL(file);
  };
  
  /**
   * Format file size in bytes to human-readable format
   * @param {number} bytes - Size in bytes
   * @returns {string} - Formatted size (e.g., "1.5 MB")
   */
  export const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
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
   * Check if a file was successfully uploaded to GCS
   * @param {string} userId - User ID (email)
   * @param {string} creationRightsId - Creation Rights ID
   * @returns {Promise<Object>} - Response with file check info
   */
  export const verifyFileUpload = async (userId, creationRightsId) => {
    try {
      const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
      const sanitizedUserId = userId.toLowerCase().replace(/[^a-z0-9]/g, '_');
      
      const response = await fetch(
        `${API_URL}/api/files/check/${sanitizedUserId}/${creationRightsId}`
      );
      
      if (!response.ok) {
        throw new Error(`Verification failed with status ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error verifying file upload:', error);
      throw error;
    }
  };