// src/services/socialMediaService.js

/**
 * Service for handling social media profile data
 * Integrated with the existing server-side Apify API
 */

// Fetch Instagram profile data using the existing Apify integration

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/+$/, '');

export const fetchInstagramProfile = async (username) => {
    try {
      console.log(`Fetching Instagram profile for ${username}...`);
      
      // Normalize the username (remove @ if present)
      const normalizedUsername = username.startsWith('@') ? username.substring(1) : username;
      
      // Use the existing Instagram API endpoint which leverages Apify
      const response = await fetch(`${API_URL}/api/instagram/${normalizedUsername}`);
      
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
      let posts;
      try {
        posts = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        console.error('Response text:', responseText.substring(0, 200));
        throw new Error('Failed to parse Instagram data as JSON. The service may be returning invalid data.');
      }
      
      // Validate posts array
      if (!Array.isArray(posts)) {
        console.error('Response is not an array:', posts);
        throw new Error('Invalid response format from Instagram service. Expected an array of posts.');
      }
      
      if (posts.length === 0) {
        throw new Error('No posts found for this Instagram profile. The account may be private or have no posts.');
      }
      
      // Calculate analytics from posts data
      const profileData = processInstagramData(normalizedUsername, posts);
      
      // Save the data to user profile (this will also save to GCS via the API)
      await saveInstagramProfile(normalizedUsername, profileData);
      
      return profileData;
    } catch (error) {
      console.error('Error in fetchInstagramProfile:', error);
      throw error;
    }
  };
  
  // Process Instagram posts to extract analytics data
  function processInstagramData(username, posts) {
    // Validate posts array
    if (!Array.isArray(posts) || posts.length === 0) {
      throw new Error('No posts data found for this Instagram profile');
    }
    
    console.log(`Processing ${posts.length} posts for analytics...`);
    
    // Calculate analytics metrics
    let totalLikes = 0;
    let totalComments = 0;
    
    // Content type counts
    let photoCount = 0;
    let videoCount = 0;
    let carouselCount = 0;
    
    // Engagement by content type
    const photoEngagement = { totalLikes: 0, totalComments: 0 };
    const videoEngagement = { totalLikes: 0, totalComments: 0, totalViews: 0 };
    
    // Monthly engagement tracking
    const monthlyEngagement = {
      jan: { likes: 0, comments: 0, count: 0 },
      feb: { likes: 0, comments: 0, count: 0 },
      mar: { likes: 0, comments: 0, count: 0 },
      apr: { likes: 0, comments: 0, count: 0 },
      may: { likes: 0, comments: 0, count: 0 },
      jun: { likes: 0, comments: 0, count: 0 },
      jul: { likes: 0, comments: 0, count: 0 },
      aug: { likes: 0, comments: 0, count: 0 },
      sep: { likes: 0, comments: 0, count: 0 },
      oct: { likes: 0, comments: 0, count: 0 },
      nov: { likes: 0, comments: 0, count: 0 },
      dec: { likes: 0, comments: 0, count: 0 }
    };
    
    // Get profile data from the first post (should be the same in all)
    let followers = 0;
    let following = 0;
    let profilePicture = '';
    let bio = '';
    
    // Process each post
    posts.forEach(post => {
      // Update total likes and comments
      const likes = post.likes || 0;
      const comments = post.comments || 0;
      
      totalLikes += likes;
      totalComments += comments;
      
      // Categorize by content type
      const contentType = post.type || 'Image';
      if (contentType === 'Video') {
        videoCount++;
        videoEngagement.totalLikes += likes;
        videoEngagement.totalComments += comments;
        if (post.videoView) videoEngagement.totalViews += post.videoView;
      } else if (contentType === 'Carousel') {
        carouselCount++;
        // For simplicity, count carousels as photos in engagement metrics
        photoEngagement.totalLikes += likes;
        photoEngagement.totalComments += comments;
      } else {
        // Default to Image
        photoCount++;
        photoEngagement.totalLikes += likes;
        photoEngagement.totalComments += comments;
      }
      
      // Categorize by month (if timestamp is available)
      if (post.publishedAt) {
        const date = new Date(post.publishedAt);
        const monthAbbrs = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const monthKey = monthAbbrs[date.getMonth()];
        
        if (monthlyEngagement[monthKey]) {
          monthlyEngagement[monthKey].likes += likes;
          monthlyEngagement[monthKey].comments += comments;
          monthlyEngagement[monthKey].count++;
        }
      }
      
      // Extract profile data - use the first available values
      if (!followers && post.authorFollowers) followers = post.authorFollowers;
      if (!following && post.authorFollowing) following = post.authorFollowing;
      if (!profilePicture && post.authorPicture) profilePicture = post.authorPicture;
      if (!bio && post.authorBio) bio = post.authorBio;
    });
    
    // Calculate averages
    const avgLikes = posts.length > 0 ? Math.round(totalLikes / posts.length) : 0;
    const avgComments = posts.length > 0 ? Math.round(totalComments / posts.length) : 0;
    
    // Calculate content type percentages
    const totalPosts = posts.length;
    const photoPercentage = Math.round((photoCount / totalPosts) * 100);
    const videoPercentage = Math.round((videoCount / totalPosts) * 100);
    const carouselPercentage = Math.round((carouselCount / totalPosts) * 100);
    
    // Average engagement by content type
    if (photoCount > 0) {
      photoEngagement.avgLikes = Math.round(photoEngagement.totalLikes / photoCount);
      photoEngagement.avgComments = Math.round(photoEngagement.totalComments / photoCount);
    }
    
    if (videoCount > 0) {
      videoEngagement.avgLikes = Math.round(videoEngagement.totalLikes / videoCount);
      videoEngagement.avgComments = Math.round(videoEngagement.totalComments / videoCount);
      videoEngagement.avgViews = Math.round(videoEngagement.totalViews / videoCount);
    }
    
    // Normalize monthly engagement (average per post in that month)
    Object.keys(monthlyEngagement).forEach(month => {
      const data = monthlyEngagement[month];
      if (data.count > 0) {
        data.likes = Math.round(data.likes / data.count);
        data.comments = Math.round(data.comments / data.count);
        // Delete count as it's no longer needed
        delete data.count;
      }
    });
    
    // Construct profile data object
    return {
      username: username,
      profilePicture: profilePicture || `https://ui-avatars.com/api/?name=${username}&background=random&color=fff`,
      followers: followers || 0,
      following: following || 0,
      posts: totalPosts,
      avgLikes: avgLikes,
      avgComments: avgComments,
      bio: bio || `Instagram profile for ${username}`,
      lastUpdated: new Date().toISOString(),
      
      // Monthly engagement (already normalized to avg per post)
      monthlyEngagement: monthlyEngagement,
      
      // Content distribution
      contentDistribution: {
        photos: photoPercentage || 0,
        videos: videoPercentage || 0,
        carousels: carouselPercentage || 0
      },
      
      // Engagement by content type
      photoEngagement: {
        avgLikes: photoEngagement.avgLikes || 0,
        avgComments: photoEngagement.avgComments || 0
      },
      
      videoEngagement: {
        avgViews: videoEngagement.avgViews || 0,
        avgLikes: videoEngagement.avgLikes || 0,
        avgComments: videoEngagement.avgComments || 0
      },
      
      // Store raw post data (first 10 posts max) for potential display
      recentPosts: posts.slice(0, 10).map(post => ({
        id: post.id,
        type: post.type || 'Image',
        thumbnailUrl: post.thumbnailUrl || post.imageUrl,
        likes: post.likes || 0,
        comments: post.comments || 0,
        publishedAt: post.publishedAt || null,
        caption: post.caption || '',
        url: post.url || post.sourceUrl
      }))
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