// src/utils/dummyDataGenerator.js

/**
 * Generates random dummy data for social media profiles
 * @param {string} platform - The social media platform (instagram, twitter, tiktok, linkedin)
 * @param {string} username - The username to associate with the profile
 * @returns {Object} A dummy profile data object
 */
export const generateDummyProfileData = (platform, username) => {
    // Ensure username is correctly formatted
    const normalizedUsername = username.startsWith('@') ? username.substring(1) : username;
    
    // Generate random follower count (base + random)
    const getFollowerCount = () => {
      const base = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
      const multiplier = [100, 1000, 10000, 100000][Math.floor(Math.random() * 4)];
      return base * multiplier + Math.floor(Math.random() * multiplier);
    };
    
    // Generate likes as a percentage of followers
    const getLikeCount = (followers) => {
      const engagementRate = (Math.random() * 5 + 2) / 100; // 2-7% engagement rate
      return Math.floor(followers * engagementRate);
    };
    
    // Generate comment count as a percentage of likes
    const getCommentCount = (likes) => {
      return Math.floor(likes * (Math.random() * 0.1 + 0.05)); // 5-15% of likes
    };
    
    // Generate share/save count
    const getShareCount = (likes) => {
      return Math.floor(likes * (Math.random() * 0.08 + 0.02)); // 2-10% of likes
    };
    
    // Generate random content distribution
    const getContentDistribution = () => {
      const photos = Math.floor(Math.random() * 60) + 30; // 30-90%
      const videos = Math.floor(Math.random() * (95 - photos)) + 5; // 5-(95-photos)%
      const carousels = 100 - photos - videos; // Remainder
      
      return {
        photos,
        videos,
        carousels
      };
    };
    
    // Generate monthly engagement data
    const getMonthlyEngagement = (avgLikes, avgComments) => {
      const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const data = {};
      
      // Current month index
      const currentMonth = new Date().getMonth();
      
      months.forEach((month, index) => {
        // Generate some data variance around the average
        const variance = Math.random() * 0.4 + 0.8; // 0.8-1.2x multiplier
        
        // More recent months may have higher engagement (trend upward)
        const recencyBoost = index >= currentMonth - 6 ? 1 + ((index - (currentMonth - 6)) / 20) : 1;
        
        data[month] = {
          likes: Math.floor(avgLikes * variance * recencyBoost),
          comments: Math.floor(avgComments * variance * recencyBoost)
        };
      });
      
      return data;
    };
    
    // Generate random recent posts
    const generateRecentPosts = (platform, username, avgLikes, avgComments) => {
      const posts = [];
      const postTypes = ['Photo', 'Video', platform === 'twitter' ? 'Thread' : platform === 'linkedin' ? 'Article' : 'Carousel'];
      
      for (let i = 0; i < 9; i++) {
        const postType = postTypes[Math.floor(Math.random() * postTypes.length)];
        const likeVariance = Math.random() * 0.5 + 0.75; // 0.75-1.25x multiplier
        const commentVariance = Math.random() * 0.6 + 0.7; // 0.7-1.3x multiplier
        
        // Generate placeholder image for the post
        const colors = ['FF5733', '33FF57', '3357FF', 'F3FF33', 'FF33F3', '33FFF3'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        posts.push({
          id: `post-${i}`,
          type: postType,
          caption: generateCaption(platform),
          likes: Math.floor(avgLikes * likeVariance),
          comments: Math.floor(avgComments * commentVariance),
          thumbnailUrl: `https://via.placeholder.com/300/${color}/FFFFFF?text=${platform}+Post`,
          url: `https://${platform}.com/${platform === 'tiktok' ? '@' : ''}${normalizedUsername}/posts/${i}`
        });
      }
      
      return posts;
    };
    
    // Generate random caption
    const generateCaption = (platform) => {
      const captions = [
        "Enjoying this beautiful day! ✨ #blessed",
        "New project in the works - can't wait to share! 🚀",
        "This is what success looks like 💯",
        "Looking back on an amazing year 🎉",
        "Grateful for these moments ❤️",
        "The journey continues... 🌱",
        "Excited to announce our latest collaboration!",
        "Behind the scenes of our newest project 👀",
        "Sometimes you just need to take a break and reset",
        "What's your favorite part of this design? Let me know in the comments!"
      ];
      
      return captions[Math.floor(Math.random() * captions.length)];
    };
    
    // Generate random bio text
    const generateBio = (platform, username) => {
      const bios = [
        `${platform.charAt(0).toUpperCase() + platform.slice(1)} profile of ${username} | Digital Creator | Sharing insights on tech, design and creativity`,
        `Creator | Innovator | Speaker\nCollaborations: ${username}@example.com`,
        `CEO & Founder\nCreating content since 2018\nLiving my best life ✨`,
        `Content creator | ${platform.charAt(0).toUpperCase() + platform.slice(1)} strategist\nHelping brands grow their social presence\n👉 link.example.com/${username}`,
        `Just a person sharing my journey\nPhotography | Travel | Food\nBased in New York City 🗽`
      ];
      
      return bios[Math.floor(Math.random() * bios.length)];
    };
    
    // Generate best posting times
    const generateBestPostingTime = () => {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const times = [
        '8:00 AM - 10:00 AM',
        '12:00 PM - 2:00 PM', 
        '3:00 PM - 5:00 PM',
        '6:00 PM - 9:00 PM',
        '9:00 PM - 11:00 PM'
      ];
      
      return {
        day: days[Math.floor(Math.random() * days.length)],
        time: times[Math.floor(Math.random() * times.length)]
      };
    };
    
    // Generate profile picture URL (can be replaced with real avatar API)
    const getProfilePicture = (username) => {
      return `https://ui-avatars.com/api/?name=${username}&background=random&color=fff&size=200`;
    };
    
    // Base data common to all platforms
    const followers = getFollowerCount();
    const avgLikes = getLikeCount(followers);
    const avgComments = getCommentCount(avgLikes);
    const avgShares = getShareCount(avgLikes);
    const contentDistribution = getContentDistribution();
    const monthlyEngagement = getMonthlyEngagement(avgLikes, avgComments);
    const bestPosting = generateBestPostingTime();
    
    // Platform-specific adjustments
    let platformAdjustments = {};
    
    switch (platform) {
      case 'instagram':
        platformAdjustments = {
          avgShares: Math.floor(avgLikes * 0.05), // "Saves" instead of shares
          photoEngagement: {
            avgLikes: Math.floor(avgLikes * 1.1), // Photos do slightly better on Instagram
            avgComments: Math.floor(avgComments * 0.9)
          },
          videoEngagement: {
            avgLikes: Math.floor(avgLikes * 0.9),
            avgComments: Math.floor(avgComments * 1.2),
            avgViews: Math.floor(followers * 0.3) // 30% of followers view videos
          }
        };
        break;
        
      case 'twitter':
        platformAdjustments = {
          posts: Math.floor(Math.random() * 2000) + 500, // Twitter users often have more posts
          avgShares: Math.floor(avgLikes * 0.3), // Retweets are more common
          photoEngagement: {
            avgLikes: Math.floor(avgLikes * 0.8),
            avgComments: Math.floor(avgComments * 0.7)
          },
          videoEngagement: {
            avgLikes: Math.floor(avgLikes * 1.2),
            avgComments: Math.floor(avgComments * 1.3),
            avgViews: Math.floor(followers * 0.4)
          }
        };
        break;
        
      case 'tiktok':
        platformAdjustments = {
          followers: followers * 2, // TikTok often has higher follower counts
          posts: Math.floor(Math.random() * 100) + 20, // Usually fewer posts on TikTok
          contentDistribution: {
            photos: 5, // TikTok is primarily video
            videos: 90,
            carousels: 5
          },
          avgLikes: avgLikes * 3, // TikTok has higher engagement
          videoEngagement: {
            avgLikes: avgLikes * 3,
            avgComments: avgComments * 2,
            avgViews: Math.floor(followers * 1.5) // Videos often reach beyond just followers
          }
        };
        break;
        
      case 'linkedin':
        platformAdjustments = {
          followers: Math.floor(followers * 0.7), // LinkedIn usually has fewer followers
          posts: Math.floor(Math.random() * 200) + 50,
          contentDistribution: {
            photos: 40, // LinkedIn has more text/article content
            videos: 20,
            carousels: 40 // "Articles" in LinkedIn context
          },
          avgLikes: Math.floor(avgLikes * 0.6), // LinkedIn has lower engagement
          avgComments: Math.floor(avgComments * 1.2), // But more comments
          photoEngagement: {
            avgLikes: Math.floor(avgLikes * 0.7),
            avgComments: Math.floor(avgComments * 1.3)
          }
        };
        break;
    }
    
    // Create the final profile data object
    const profileData = {
      username: normalizedUsername,
      profilePicture: getProfilePicture(normalizedUsername),
      bio: generateBio(platform, normalizedUsername),
      followers: platformAdjustments.followers || followers,
      following: Math.floor(Math.random() * 2000) + 100,
      posts: platformAdjustments.posts || Math.floor(Math.random() * 500) + 30,
      avgLikes: platformAdjustments.avgLikes || avgLikes,
      avgComments: platformAdjustments.avgComments || avgComments,
      avgShares: platformAdjustments.avgShares || avgShares,
      contentDistribution: platformAdjustments.contentDistribution || contentDistribution,
      photoEngagement: platformAdjustments.photoEngagement || {
        avgLikes: Math.floor(avgLikes * 1.05),
        avgComments: Math.floor(avgComments * 0.95)
      },
      videoEngagement: platformAdjustments.videoEngagement || {
        avgLikes: Math.floor(avgLikes * 0.95),
        avgComments: Math.floor(avgComments * 1.05),
        avgViews: Math.floor(followers * 0.2)
      },
      monthlyEngagement: monthlyEngagement,
      recentPosts: generateRecentPosts(platform, normalizedUsername, avgLikes, avgComments),
      bestPostingDay: bestPosting.day,
      bestPostingTime: bestPosting.time,
      lastUpdated: new Date().toISOString()
    };
    
    return profileData;
  };