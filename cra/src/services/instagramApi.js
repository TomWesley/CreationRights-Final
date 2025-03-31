// src/services/instagramApi.js

/**
 * Fetch Instagram posts for a username
 * @param {string} username - Instagram username
 * @returns {Promise<Array>} - Array of posts
 */
export const fetchInstagramPosts = async (username) => {
    try {
      const normalizedUsername = username.startsWith('@') ? username.substring(1) : username;
      const response = await fetch(`/api/instagram/${normalizedUsername}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch posts: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching Instagram posts:', error);
      throw error;
    }
  };
  
  /**
   * Convert Instagram posts to creation objects
   * @param {Array} posts - Instagram posts
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of creation objects
   */
  export const convertInstagramPosts = async (posts, userId) => {
    try {
      const response = await fetch('/api/instagram/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ posts, userId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to convert posts: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error converting Instagram posts:', error);
      throw error;
    }
  };