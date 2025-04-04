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
    try {
      console.log('Making API request to start Apify actor...');
      
      // 1. Start the actor run
      const startRunUrl = `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/runs`;
      
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append("Accept", "application/json");
      myHeaders.append("Authorization", `Bearer ${APIFY_API_TOKEN}`);
      
      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify({
          "usernames": [username]
        }),
        redirect: "follow"
      };
      
      // Start the run
      const runResponse = await fetch(startRunUrl, requestOptions);
      
      if (!runResponse.ok) {
        console.error(`HTTP error! Status: ${runResponse.status}`);
        const errorText = await runResponse.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error starting actor run! Status: ${runResponse.status}`);
      }
      
      const runData = await runResponse.json();
      console.log('Actor run started with ID:', runData.id);
      
      // 2. Wait for the run to complete (poll the status)
      const runId = runData.id;
      let runStatus = 'RUNNING';
      const statusUrl = `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/runs/${runId}`;
      
      console.log('Waiting for actor run to complete...');
      
      // Poll until the status is SUCCEEDED or FAILED
      while (runStatus === 'RUNNING' || runStatus === 'READY') {
        // Wait a bit before checking again (2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await fetch(statusUrl, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${APIFY_API_TOKEN}`
          }
        });
        
        if (!statusResponse.ok) {
          console.error(`Failed to get run status. Status: ${statusResponse.status}`);
          break;
        }
        
        const statusData = await statusResponse.json();
        runStatus = statusData.status;
        console.log('Current run status:', runStatus);
      }
      
      if (runStatus !== 'SUCCEEDED') {
        throw new Error(`Actor run failed with status: ${runStatus}`);
      }
      
      // 3. Get the results from the default dataset
      console.log('Actor run completed successfully, retrieving results...');
      const datasetId = runData.defaultDatasetId;
      const datasetUrl = `https://api.apify.com/v2/datasets/${datasetId}/items`;
      
      const dataResponse = await fetch(datasetUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${APIFY_API_TOKEN}`
        }
      });
      
      if (!dataResponse.ok) {
        console.error(`HTTP error getting dataset! Status: ${dataResponse.status}`);
        throw new Error(`Failed to get dataset results. Status: ${dataResponse.status}`);
      }
      
      const profileResults = await dataResponse.json();
      console.log('Successfully retrieved profile results');
      
      // Log the first part of the response to debug
      const responsePreview = JSON.stringify(profileResults).substring(0, 500);
      console.log('Results preview:', responsePreview + '...');
      
      if (!profileResults || !Array.isArray(profileResults) || profileResults.length === 0) {
        console.error('No profile data found in results');
        throw new Error('No profile data found in Apify results');
      }
      
      // Get the first result (the requested username's profile)
      const profileData = profileResults[0];
      
      // Continue with your formatting logic...
      console.log('Extracted profile data:', {
        username: profileData.username,
        followersCount: profileData.followersCount, 
        followsCount: profileData.followsCount,
        postsCount: profileData.postsCount
      });
      
      // Format the profile data for our app (rest of your original code)
      const formattedProfile = {
        username: profileData.username || username,
        profilePicture: profileData.profilePicUrl || `https://ui-avatars.com/api/?name=${username}&background=random&color=fff`,
        followers: profileData.followersCount || 0,
        following: profileData.followsCount || 0,
        posts: profileData.postsCount || 0,
        bio: profileData.biography || `Instagram profile for ${username}`,
        fullName: profileData.fullName || username,
        isVerified: profileData.verified || false,
        lastUpdated: new Date().toISOString(),
        
        // Rest of your formatting code...
        _debug: {
          rawFollowersCount: profileData.followersCount,
          rawFollowsCount: profileData.followsCount,
          rawPostsCount: profileData.postsCount
        },
        
        avgLikes: Math.floor(profileData.followersCount * 0.03) || 0,
        avgComments: Math.floor(profileData.followersCount * 0.002) || 0,
        
        monthlyEngagement: createPlaceholderEngagement(),
        
        contentDistribution: {
          photos: 70,
          videos: 20,
          carousels: 10
        },
        
        photoEngagement: {
          avgLikes: Math.floor(profileData.followersCount * 0.03) || 0,
          avgComments: Math.floor(profileData.followersCount * 0.002) || 0
        },
        
        videoEngagement: {
          avgViews: Math.floor(profileData.followersCount * 0.08) || 0,
          avgLikes: Math.floor(profileData.followersCount * 0.025) || 0,
          avgComments: Math.floor(profileData.followersCount * 0.001) || 0
        },
        
        recentPosts: []
      };
      
      console.log('Formatted profile data:', {
        username: formattedProfile.username,
        followers: formattedProfile.followers,
        following: formattedProfile.following
      });
      
      return formattedProfile;
      
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