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
    
    // Use the direct API endpoint to run the actor
    const apiUrl = `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync?token=${APIFY_API_TOKEN}`;
    
    // Set up the actor input
    const payload = {
      username: username,
      resultsType: "posts",
      resultsLimit: 20,
      proxy: {
        useApifyProxy: true
      }
    };
    
    console.log('Starting API request to Apify...');
    const response = await axios.post(apiUrl, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Check if we have data
    if (!response.data || !Array.isArray(response.data)) {
      console.log('No valid data returned from Apify');
      return [];
    }
    
    console.log(`Retrieved ${response.data.length} items from Apify`);
    
    // Map the posts to the format we need
    const posts = response.data.map(post => ({
      id: post.id,
      caption: post.caption || '',
      type: determinePostType(post),
      thumbnailUrl: post.displayUrl || post.previewUrl,
      imageUrl: post.displayUrl,
      videoUrl: post.videoUrl || null,
      publishedAt: post.timestamp ? new Date(post.timestamp * 1000).toISOString() : new Date().toISOString(),
      url: post.url || `https://www.instagram.com/p/${post.shortCode}/`,
      likes: post.likesCount || 0,
      comments: post.commentsCount || 0,
      source: 'Instagram',
      sourceUrl: post.url || `https://www.instagram.com/p/${post.shortCode}/`
    }));
    
    console.log(`Processed ${posts.length} posts`);
    return posts;
  } catch (error) {
    console.error('Error fetching Instagram posts:', error);
    throw new Error(`Failed to fetch Instagram posts: ${error.message}`);
  }
}

/**
 * Determine the post type from Apify data
 */
function determinePostType(post) {
  if (post.type === 'Video' || post.videoUrl) {
    return 'Video';
  } else if (post.type === 'Carousel') {
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
    engagement: {
      likes: post.likes,
      comments: post.comments
    }
  };
}

module.exports = {
  fetchInstagramPosts,
  convertPostToCreation
};