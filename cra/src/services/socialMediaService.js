// src/services/socialMediaService.js

/**
 * Service for handling social media profile data
 * Integrated with the existing server-side Apify API
 */

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/+$/, '');

export const fetchInstagramProfile = async (username) => {
    try {
      console.log(`Fetching Instagram profile for ${username}...`);
      
      // Normalize the username (remove @ if present)
      const normalizedUsername = username.startsWith('@') ? username.substring(1) : username;
      
      // Use the existing Instagram API endpoint which leverages Apify
      const response = await fetch(`${API_URL}/api/instagram/${normalizedUsername}`);
      console.log('trying things here', response);
      // Check if response is OK
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        
        try {
          // Try to parse the error as JSON
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || `Failed to fetch Instagram data: ${response.status} ${response.statusText}`;
        } catch (e) {
          // If parsing fails, use the raw error text or a default message
          errorMessage = errorText || `Failed to fetch Instagram data: ${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }
      
      // Get the response text first to check if it's HTML or JSON
      const responseText = await response.text();
      
      // Check if the response starts with HTML doctype (indicating an error page)
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.error('Received HTML response instead of JSON:', responseText.substring(0, 200));
        throw new Error('Instagram service returned an HTML error page. The service may be temporarily unavailable.');
      }
      
      // Parse the text as JSON
      let profileData;
      try {
        profileData = JSON.parse(responseText);
        // Log the raw profile data from API
        console.log('pure response', responseText)
        console.log('Raw API response data:', profileData);
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        console.error('Response text:', responseText.substring(0, 200));
        throw new Error('Failed to parse Instagram data as JSON. The service may be returning invalid data.');
      }
      
      // Validate profile data
      if (!profileData || typeof profileData !== 'object') {
        console.error('Response is not a valid profile object:', profileData);
        throw new Error('Invalid response format from Instagram service. Expected a profile object.');
      }
      
      // Make sure we have the essential profile fields
      if (!profileData.username) {
        profileData.username = normalizedUsername;
      }
      
      // Convert string number values to actual numbers
      if (typeof profileData.followers === 'string') {
        profileData.followers = parseInt(profileData.followers.replace(/,/g, ''), 10);
      }
      
      if (typeof profileData.following === 'string') {
        profileData.following = parseInt(profileData.following.replace(/,/g, ''), 10);
      }
      
      if (typeof profileData.posts === 'string') {
        profileData.posts = parseInt(profileData.posts.replace(/,/g, ''), 10);
      }
      
      // Ensure all required fields are present and properly formatted
      const formattedProfile = ensureProfileFormat(profileData);
      console.log('Formatted profile data:', formattedProfile);
      
      // Save the data to user profile (this will also save to GCS via the API)
      await saveInstagramProfile(normalizedUsername, formattedProfile);
      
      return formattedProfile;
    } catch (error) {
      console.error('Error in fetchInstagramProfile:', error);
      throw error;
    }
  };
  
  /**
   * Ensure the profile data has all required fields with proper format
   */
  function ensureProfileFormat(profileData) {
    const username = profileData.username || '';
    
    // Create a properly formatted profile with default values for missing fields
    return {
      username: username,
      profilePicture: profileData.profilePicture || `https://ui-avatars.com/api/?name=${username}&background=random&color=fff`,
      followers: profileData.followers || 0,
      following: profileData.following || 0,
      posts: profileData.posts || 0,
      avgLikes: profileData.avgLikes || 0,
      avgComments: profileData.avgComments || 0,
      bio: profileData.bio || `Instagram profile for ${username}`,
      lastUpdated: profileData.lastUpdated || new Date().toISOString(),
      
      // Monthly engagement - use existing or create empty structure
      monthlyEngagement: profileData.monthlyEngagement || createEmptyMonthlyEngagement(),
      
      // Content distribution
      contentDistribution: profileData.contentDistribution || {
        photos: 70,
        videos: 20,
        carousels: 10
      },
      
      // Engagement by content type
      photoEngagement: profileData.photoEngagement || {
        avgLikes: 0,
        avgComments: 0
      },
      
      videoEngagement: profileData.videoEngagement || {
        avgViews: 0,
        avgLikes: 0,
        avgComments: 0
      },
      
      // Recent posts - if available
      recentPosts: profileData.recentPosts || []
    };
  }
  
  /**
   * Create empty monthly engagement data structure
   */
  function createEmptyMonthlyEngagement() {
    return {
      jan: { likes: 0, comments: 0 },
      feb: { likes: 0, comments: 0 },
      mar: { likes: 0, comments: 0 },
      apr: { likes: 0, comments: 0 },
      may: { likes: 0, comments: 0 },
      jun: { likes: 0, comments: 0 },
      jul: { likes: 0, comments: 0 },
      aug: { likes: 0, comments: 0 },
      sep: { likes: 0, comments: 0 },
      oct: { likes: 0, comments: 0 },
      nov: { likes: 0, comments: 0 },
      dec: { likes: 0, comments: 0 }
    };
  }
  
  // Save Instagram profile data
  export const saveInstagramProfile = async (userEmail, profileData) => {
    if (!userEmail || !profileData) {
      throw new Error('Missing required parameters');
    }
    
    try {
      console.log(`Saving Instagram profile for ${userEmail}...`);
      
      // Make API call to save to GCS
      const response = await fetch(`${API_URL}/api/users/${userEmail}/social-profiles/instagram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });
      
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || `Failed to save Instagram profile: ${response.status} ${response.statusText}`;
        } catch (e) {
          errorMessage = `Failed to save Instagram profile: ${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      
      // Also update the local storage for persistence
      updateLocalStorage(userEmail, profileData);
      
      return result.data;
    } catch (error) {
      console.error('Error saving Instagram profile:', error);
      
      // Still update local storage even if API call fails
      updateLocalStorage(userEmail, profileData);
      
      // Return the profile data anyway so the UI can display it
      return {
        ...profileData,
        lastUpdated: new Date().toISOString()
      };
    }
  };
  
  // Helper to update localStorage with Instagram profile data
  function updateLocalStorage(userEmail, profileData) {
    try {
      const authStateStr = localStorage.getItem('authState');
      if (authStateStr) {
        const authState = JSON.parse(authStateStr);
        if (authState && authState.currentUser && authState.currentUser.email === userEmail) {
          // Update the Instagram profile data
          if (!authState.currentUser.socialProfiles) {
            authState.currentUser.socialProfiles = {};
          }
          
          authState.currentUser.socialProfiles.instagram = profileData;
          
          // Save back to localStorage
          localStorage.setItem('authState', JSON.stringify(authState));
        }
      }
    } catch (error) {
      console.error('Error updating localStorage:', error);
    }
  }