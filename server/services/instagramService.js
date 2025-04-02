// server/services/instagramService.js
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Get the API token from environment variables
const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN || 'apify_api_IwtubPMgbGcCcfYqFhxy5zNkFKPXF14njt05';

/**
 * Fetch Instagram posts for a username
 * @param {string} username - Instagram username
 * @returns {Promise<Array>} - Array of posts
 */
async function fetchInstagramPosts(username) {
  if (!username) {
    throw new Error('Username is required');
  }

  try {
    console.log(`Fetching Instagram posts for username: ${username}`);
    
    // Try the primary method first
    try {
      return await fetchWithProfileScraper(username);
    } catch (primaryError) {
      console.error('Primary scraper failed:', primaryError);
      console.log('Trying fallback scraper...');
      
      // If the primary method fails, try the fallback
      return await fetchWithBasicScraper(username);
    }
  } catch (error) {
    console.error('All Instagram fetching methods failed:', error);
    throw new Error(`Failed to fetch Instagram posts: ${error.message}`);
  }
}

/**
 * Primary method using instagram-profile-scraper
 */
async function fetchWithProfileScraper(username) {
  // Use the instagram-profile-scraper which is more reliable
  const apiUrl = `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/runs?token=${APIFY_API_TOKEN}`
  
  // Set up the actor input with more optimal parameters
  const payload = {
    username: username,
    resultsLimit: 20,
    addPosts: true,
    proxy: {
      useApifyProxy: true,
      apifyProxyGroups: ["RESIDENTIAL"] // Use residential proxies for better success
    },
    // Add additional options for better reliability
    maxConcurrency: 1,
    maxRequestRetries: 3,
    maxErrorCount: 5
  };
    
    console.log('Starting API request to Apify...');
    const response = await axios.post(apiUrl, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000, // Increase timeout to 60 seconds
      validateStatus: (status) => true, // Don't throw error on any status code
      responseType: 'text' // Get response as text so we can check if it's HTML or JSON
    });
    
    // Check if the response is HTML (starts with <!DOCTYPE or <html)
    const responseText = response.data;
    console.log('Received response from Apify');
    
    // Check status code first
    if (response.status !== 200) {
      console.error(`Apify returned error status: ${response.status}`);
      throw new Error(`Apify API error: ${response.status} ${response.statusText}`);
    }
    
    // Check if the response is HTML
    if (typeof responseText === 'string' && 
        (responseText.trim().startsWith('<!DOCTYPE') || 
         responseText.trim().startsWith('<html'))) {
      console.error('Received HTML response instead of JSON');
      throw new Error('Instagram scraping service returned an error. Please try again later.');
    }
    
    // Parse the response as JSON
    let responseData;
    try {
      responseData = typeof responseText === 'string' ? JSON.parse(responseText) : responseText;
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      throw new Error('Failed to parse Instagram data. Please try again later.');
    }
    
    // Process the data into a standardized format
    let posts = [];
    
    if (responseData && responseData.posts && Array.isArray(responseData.posts)) {
      posts = responseData.posts.map(post => ({
        id: post.id || `instagram-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        caption: post.caption || '',
        type: determinePostType(post),
        thumbnailUrl: post.displayUrl || post.previewUrl || post.imageUrl,
        imageUrl: post.displayUrl || post.imageUrl,
        videoUrl: post.videoUrl || null,
        publishedAt: post.timestamp ? new Date(post.timestamp * 1000).toISOString() : new Date().toISOString(),
        url: post.url || post.permalink || `https://www.instagram.com/p/${post.shortCode || post.code}/`,
        likes: post.likesCount || post.likes || 0,
        comments: post.commentsCount || post.comments || 0,
        source: 'Instagram',
        sourceUrl: post.url || post.permalink || `https://www.instagram.com/p/${post.shortCode || post.code}/`
      }));
    } else if (responseData && Array.isArray(responseData)) {
      // Handle array response format
      const postItems = responseData.filter(item => item.type === 'post' || item.isPost);
      posts = postItems.map(post => ({
        id: post.id || `instagram-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        caption: post.caption || '',
        type: determinePostType(post),
        thumbnailUrl: post.displayUrl || post.thumbnailUrl || post.imageUrl || post.previewUrl,
        imageUrl: post.displayUrl || post.imageUrl,
        videoUrl: post.videoUrl || null,
        publishedAt: post.timestamp ? new Date(post.timestamp * 1000).toISOString() : new Date().toISOString(),
        url: post.url || post.permalink || `https://www.instagram.com/p/${post.shortCode || post.code}/`,
        likes: post.likesCount || post.likes || 0,
        comments: post.commentsCount || post.comments || 0,
        source: 'Instagram',
        sourceUrl: post.url || post.permalink || `https://www.instagram.com/p/${post.shortCode || post.code}/`
      }));
    } else {
      console.log('Unexpected response format:', responseData);
      throw new Error('Unexpected response format from Apify');
    }
    
    console.log(`Processed ${posts.length} posts`);
    return posts;
  }

/**
 * Determine the post type from Apify data
 */
function determinePostType(post) {
  if (post.type === 'Video' || post.videoUrl) {
    return 'Video';
  } else if (post.type === 'Carousel' || post.carousel) {
    return 'Image'; // Default carousel to Image type
  } else {
    return 'Image';
  }
}

/**
 * Convert Instagram post to creation object format
 */
function convertPostToCreation(post) {
  return {
    id: `ig-${post.id}`,
    title: post.caption ? 
      (post.caption.length > 60 ? post.caption.substring(0, 57) + '...' : post.caption) : 
      `Instagram post from ${new Date(post.publishedAt).toLocaleDateString()}`,
    type: post.type,
    dateCreated: new Date(post.publishedAt).toISOString().split('T')[0],
    rights: `Copyright © ${new Date(post.publishedAt).getFullYear()} Instagram User`,
    notes: post.caption || '',
    tags: ['instagram', post.type.toLowerCase()],
    folderId: '',
    thumbnailUrl: post.thumbnailUrl,
    sourceUrl: post.sourceUrl,
    source: 'Instagram',
    // For video posts
    videoUrl: post.videoUrl,
    // Engagement metrics
    metadata: {
      category: post.type === 'Video' ? 'Video' : 'Photography',
      creationRightsId: `CR-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      platform: 'Instagram',
      engagement: {
        likes: post.likes,
        comments: post.comments
      },
      url: post.sourceUrl
    }
  };
}

/**
 * Fallback method using instagram-scraper
 */
async function fetchWithBasicScraper(username) {
  // Use the basic instagram-scraper for fallback
  const apiUrl = `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync?token=${APIFY_API_TOKEN}`;
  
  // Set up the actor input with simpler parameters
  const payload = {
    usernames: [username],
    resultsType: "posts",
    resultsLimit: 20,
    proxy: {
      useApifyProxy: true
    },
    maxRequestRetries: 3
  };
  
  console.log('Starting fallback API request to Apify...');
  const response = await axios.post(apiUrl, payload, {
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 90000, // Increase timeout to 90 seconds for fallback
    validateStatus: (status) => true, // Don't throw error on any status code
    responseType: 'text' // Get response as text so we can check if it's HTML or JSON
  });
  
  // Check if the response is HTML (starts with <!DOCTYPE or <html)
  const responseText = response.data;
  console.log('Received fallback response from Apify');
  
  // Check status code first
  if (response.status !== 200) {
    console.error(`Fallback Apify returned error status: ${response.status}`);
    throw new Error(`Fallback Apify API error: ${response.status} ${response.statusText}`);
  }
  
  // Check if the response is HTML
  if (typeof responseText === 'string' && 
      (responseText.trim().startsWith('<!DOCTYPE') || 
       responseText.trim().startsWith('<html'))) {
    console.error('Received HTML response instead of JSON from fallback');
    throw new Error('Instagram fallback scraping service returned an error. Please try again later.');
  }
  
  // Parse the response as JSON
  let responseData;
  try {
    responseData = typeof responseText === 'string' ? JSON.parse(responseText) : responseText;
  } catch (error) {
    console.error('Error parsing JSON response from fallback:', error);
    throw new Error('Failed to parse Instagram fallback data. Please try again later.');
  }

  // Process the data into a standardized format
  let posts = [];
  
  if (responseData && Array.isArray(responseData)) {
    // Find the result for the username we're looking for
    const userResult = responseData.find(item => 
      item.username && item.username.toLowerCase() === username.toLowerCase()
    );
    
    if (userResult && userResult.latestPosts && Array.isArray(userResult.latestPosts)) {
      posts = userResult.latestPosts.map(post => ({
        id: post.id || `instagram-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        caption: post.caption || '',
        type: determinePostType(post),
        thumbnailUrl: post.displayUrl || post.thumbnailUrl || post.imageUrl || post.previewUrl,
        imageUrl: post.displayUrl || post.imageUrl,
        videoUrl: post.videoUrl || null,
        publishedAt: post.timestamp ? new Date(post.timestamp * 1000).toISOString() : new Date().toISOString(),
        url: post.url || post.permalink || `https://www.instagram.com/p/${post.shortCode || post.code}/`,
        likes: post.likesCount || post.likes || 0,
        comments: post.commentsCount || post.comments || 0,
        source: 'Instagram',
        sourceUrl: post.url || post.permalink || `https://www.instagram.com/p/${post.shortCode || post.code}/`
      }));
    }
  }
  
  console.log(`Processed ${posts.length} posts from fallback`);
  
  if (posts.length === 0) {
    throw new Error('No posts found in fallback. The account may be private or have no posts.');
  }
  
  return posts;
}

module.exports = {
  fetchInstagramPosts,
  convertPostToCreation
};
