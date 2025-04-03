// server/services/instagramService.js
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Get the API token from environment variables
const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN || 'apify_api_IwtubPMgbGcCcfYqFhxy5zNkFKPXF14njt05';

/**
 * Fetch Instagram profile data
 * @param {string} username - Instagram username
 * @returns {Promise<Object>} - Profile data
 */
async function fetchInstagramProfile(username) {
  if (!username) {
    throw new Error('Username is required');
  }
  
  console.log(`Fetching Instagram profile for username: ${username}`);
  
  // Make API call to Apify
  try {
    const result = await fetchBasicProfileInfo(username);
    return result;
  } catch (error) {
    console.error('Error in fetchInstagramProfile:', error);
    throw error;
  }
}

/**
 * Make a simple API call to get Instagram profile info
 */
/**
 * Make a simple API call to get Instagram profile info
 */
async function fetchBasicProfileInfo(username) {
    // Use the standard instagram scraper
    const apiUrl = `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync`;
    
    // Simplest possible payload - just the username as the Apify docs specify
    const payload = {
      "usernames": [username]
    };
    
    console.log('Making API request to Apify...');
    
    try {
      // Create headers according to Apify docs
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append("Accept", "application/json");
      myHeaders.append("Authorization", `Bearer ${APIFY_API_TOKEN}`);
      
      // Create request options
      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify(payload),
        redirect: "follow"
      };
      
      // Make the fetch request
      const fetchResponse = await fetch(apiUrl, requestOptions);
      
      // Check if the response is OK
      if (!fetchResponse.ok) {
        console.error(`HTTP error! Status: ${fetchResponse.status}`);
        const errorText = await fetchResponse.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! Status: ${fetchResponse.status}`);
      }
      
      // Get the raw text first to debug
      const rawResponseText = await fetchResponse.text();
      console.log('Raw response text (first 500 chars):', rawResponseText.substring(0, 500));
      
      // Check if we have actual content
      if (!rawResponseText || rawResponseText.trim() === '') {
        console.error('Empty response received from Apify');
        throw new Error('Empty response received from Apify');
      }
      
      // Parse the text manually
      let responseData;
      try {
        responseData = JSON.parse(rawResponseText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Invalid JSON received (first 500 chars):', rawResponseText.substring(0, 500));
        throw new Error('Failed to parse JSON response from Apify');
      }
      
      console.log('Successfully received and parsed response from Apify');
      
      // Rest of the code remains the same...
      // Process the API response
      let profileData;
      
      // Log the actual response for debugging
      console.log('Response from Apify:', JSON.stringify(responseData).substring(0, 1000));
      
      // Check if we have a valid response structure
      if (responseData && Array.isArray(responseData) && responseData.length > 0) {
        profileData = responseData[0]; // Get the first result from the array
        console.log('Found profile data at index 0');
      } else if (responseData && !Array.isArray(responseData)) {
        // Handle case where response might not be an array
        profileData = responseData;
        console.log('Found profile data in response object');
      } else {
        console.error('Unexpected response format:', typeof responseData);
        console.error('Response data:', JSON.stringify(responseData).substring(0, 500));
        throw new Error('Unexpected response format from Apify');
      }
      
      // Continue with formatting the profile data...
      // (rest of your code)
    } catch (error) {
      console.error('Error fetching Instagram profile:', error);
      throw error;
    }
  }

/**
 * Create placeholder monthly engagement data
 */
function createPlaceholderEngagement() {
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

// Legacy functions for backwards compatibility
async function fetchInstagramPosts(username) {
  console.warn(`Legacy function fetchInstagramPosts called for ${username}, returning empty array`);
  return [];
}

function convertPostToCreation(post) {
  console.warn('Legacy function convertPostToCreation called, returning empty object');
  return {};
}

module.exports = {
  fetchInstagramProfile,
  fetchInstagramPosts,     // Legacy export for compatibility
  convertPostToCreation    // Legacy export for compatibility
};