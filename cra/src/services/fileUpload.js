// src/services/fileUpload.js

/**
 * Uploads a file to the server
 * @param {string} userId - User ID (email)
 * @param {File} file - File object to upload
 * @returns {Promise<Object>} - Response with file info
 */
export const uploadFile = async (userId, file) => {
    try {CHANGES
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      const sanitizedUserId = userId.toLowerCase().replace(/[^a-z0-9]/g, '_');
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
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