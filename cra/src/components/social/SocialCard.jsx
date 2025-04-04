// src/components/social/SocialCard.jsx

import React, { useState } from 'react';
import { Instagram, Twitter, Linkedin, Users, Heart, MessageCircle, RefreshCw, X, Play, BarChart, Share } from 'lucide-react';
import TikTok from '../icons/TikTokIcon';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { generateDummyProfileData } from '../../utils/dummyDataGenerator';
import { useAppContext } from '../../contexts/AppContext';

// Import charts from recharts
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line,
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend
} from 'recharts';

const SocialCard = ({ platform, profileData, onDisconnect }) => {
  const { setSocialData } = useAppContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [isUpdating, setIsUpdating] = useState(false);
  const [recentPostsVisible, setRecentPostsVisible] = useState(false);
  
  // Platform-specific icons
  const platformIcons = {
    instagram: <Instagram className="h-6 w-6 text-pink-500 mr-2" />,
    twitter: <Twitter className="h-6 w-6 text-blue-400 mr-2" />,
    tiktok: <TikTok className="h-6 w-6 text-black mr-2" />,
    linkedin: <Linkedin className="h-6 w-6 text-blue-600 mr-2" />
  };
  
  // Platform-specific colors
  const platformColors = {
    instagram: ['#E1306C', '#833AB4', '#405DE6', '#FCAF45'],
    twitter: ['#1DA1F2', '#14171A', '#657786', '#AAB8C2'],
    tiktok: ['#000000', '#25F4EE', '#FE2C55', '#8A8A8A'],
    linkedin: ['#0077B5', '#0073B1', '#004B7C', '#00A0DC']
  };
  
  // Platform-specific terms
  const platformTerms = {
    instagram: {
      likes: 'Likes',
      comments: 'Comments',
      shares: 'Saves',
      metric1: 'Followers',
      metric2: 'Avg. Likes',
      metric3: 'Avg. Comments'
    },
    twitter: {
      likes: 'Likes',
      comments: 'Replies',
      shares: 'Retweets',
      metric1: 'Followers',
      metric2: 'Avg. Likes',
      metric3: 'Avg. Retweets'
    },
    tiktok: {
      likes: 'Likes',
      comments: 'Comments',
      shares: 'Shares',
      metric1: 'Followers',
      metric2: 'Avg. Likes',
      metric3: 'Avg. Views'
    },
    linkedin: {
      likes: 'Reactions',
      comments: 'Comments',
      shares: 'Shares',
      metric1: 'Connections',
      metric2: 'Avg. Reactions',
      metric3: 'Avg. Comments'
    }
  };
  
  // Get platform-specific values
  const colors = platformColors[platform] || platformColors.instagram;
  const terms = platformTerms[platform] || platformTerms.instagram;
  const platformIcon = platformIcons[platform] || platformIcons.instagram;
  const platformUrl = {
    instagram: `https://instagram.com/${profileData.username}`,
    twitter: `https://x.com/${profileData.username}`,
    tiktok: `https://tiktok.com/@${profileData.username}`,
    linkedin: `https://linkedin.com/in/${profileData.username}`
  }[platform];
  
  // Format numbers with K, M, etc.
  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    
    // Make sure num is a number
    const numValue = Number(num);
    if (isNaN(numValue)) return '0';
    
    if (numValue >= 1000000) {
      return (numValue / 1000000).toFixed(1) + 'M';
    }
    if (numValue >= 1000) {
      return (numValue / 1000).toFixed(1) + 'K';
    }
    return numValue.toString();
  };

  // Calculate engagement rate
  const engagementRate = () => {
    if (!profileData.followers || profileData.followers === 0) return 0;
    
    const avgLikes = profileData.avgLikes || 0;
    const avgComments = profileData.avgComments || 0;
    
    return ((avgLikes + avgComments) / profileData.followers) * 100;
  };
  
  // Prepare engagement data for line chart
  const prepareEngagementData = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = [];
    
    if (profileData.monthlyEngagement) {
      for (const [month, values] of Object.entries(profileData.monthlyEngagement)) {
        // Skip months with no data
        if (values.likes === 0 && values.comments === 0) continue;
        
        // Get month index from key
        const monthIndex = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(month);
        if (monthIndex !== -1) {
          data.push({
            month: monthNames[monthIndex],
            likes: values.likes || 0,
            comments: values.comments || 0,
            total: (values.likes || 0) + (values.comments || 0)
          });
        }
      }
    }
    
    // If we have no data, add some placeholder months
    if (data.length === 0) {
      const currentMonth = new Date().getMonth();
      // Add current month and previous 5 months
      for (let i = 0; i < 6; i++) {
        const monthIndex = (currentMonth - i + 12) % 12; // Wrap around to previous year if needed
        data.unshift({
          month: monthNames[monthIndex],
          likes: 0,
          comments: 0,
          total: 0
        });
      }
    }
    
    // Sort by month
    return data.sort((a, b) => {
      return monthNames.indexOf(a.month) - monthNames.indexOf(b.month);
    });
  };
  
  // Content type distribution for pie chart
  const contentTypeData = [
    { name: 'Photos', value: profileData.contentDistribution?.photos || 0 },
    { name: 'Videos', value: profileData.contentDistribution?.videos || 0 },
    { name: platform === 'twitter' ? 'Threads' : platform === 'linkedin' ? 'Articles' : 'Carousels', 
      value: profileData.contentDistribution?.carousels || 0 }
  ].filter(item => item.value > 0); // Remove zero items
  
  // Handle refresh/update profile data
  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    
    setTimeout(() => {
      // Generate new dummy data
      const updatedData = generateDummyProfileData(platform, profileData.username);
      
      // Update state with refreshed data
      setSocialData(prev => ({
        ...prev,
        [platform]: updatedData
      }));
      
      setIsUpdating(false);
    }, 1000);
  };
  
  return (
    <div className="social-card">
      {/* Profile Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <div className={`bg-gradient-to-tr ${platform === 'instagram' ? 'from-yellow-400 via-pink-500 to-purple-500' : 
                           platform === 'twitter' ? 'from-blue-400 to-blue-600' :
                           platform === 'tiktok' ? 'from-black via-pink-500 to-teal-400' :
                           'from-blue-500 to-blue-700'} p-0.5 rounded-full`}>
            <div className="bg-white p-1 rounded-full">
              <img 
                src={profileData.profilePicture} 
                alt={profileData.username} 
                className="w-12 h-12 rounded-full object-cover"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${profileData.username}&background=random&color=fff`;
                }}
              />
            </div>
          </div>
          
          <div className="ml-3">
            <h3 className="font-semibold">{platform === 'instagram' || platform === 'tiktok' ? '@' : ''}{profileData.username}</h3>
            <a 
              href={platformUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`text-xs ${
                platform === 'instagram' ? 'text-pink-500' : 
                platform === 'twitter' ? 'text-blue-400' :
                platform === 'tiktok' ? 'text-black' :
                'text-blue-600'
              } flex items-center`}
            >
              {platformIcon}
              View Profile
            </a>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {/* <Button 
            size="sm" 
            variant="outline" 
            className="flex items-center text-gray-600"
            onClick={handleUpdateProfile}
            disabled={isUpdating}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isUpdating ? 'animate-spin' : ''}`} />
            {isUpdating ? 'Updating...' : 'Update'}
          </Button> */}
          
          <Button 
            size="sm" 
            variant="outline" 
            className="flex items-center text-red-500 hover:text-red-600 hover:border-red-300"
            onClick={onDisconnect}
          >
            <X className="h-4 w-4 mr-1" />
            Disconnect
          </Button>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-3 rounded-lg text-center">
          <Users className="h-5 w-5 text-blue-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{formatNumber(profileData.followers || 0)}</p>
          <p className="text-xs text-gray-500">{terms.metric1}</p>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg text-center">
          <Heart className="h-5 w-5 text-red-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{formatNumber(profileData.avgLikes || 0)}</p>
          <p className="text-xs text-gray-500">{terms.metric2}</p>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg text-center">
          <MessageCircle className="h-5 w-5 text-purple-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{formatNumber(profileData.avgComments || 0)}</p>
          <p className="text-xs text-gray-500">{terms.metric3}</p>
        </div>
      </div>
      
      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-purple-700 mb-2">Profile Stats</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Engagement Rate</p>
                <p className="text-xl font-semibold">{engagementRate().toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Posts</p>
                <p className="text-xl font-semibold">{profileData.posts || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Following</p>
                <p className="text-xl font-semibold">{formatNumber(profileData.following || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Update</p>
                <p className="text-sm font-semibold">
                  {profileData.lastUpdated ? 
                    new Date(profileData.lastUpdated).toLocaleDateString() : 
                    'Not available'}
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Engagement Summary</h4>
            <ResponsiveContainer width="100%" height={200}>
              <RechartsBarChart
                data={[
                  { name: terms.likes, value: profileData.avgLikes || 0 },
                  { name: terms.comments, value: profileData.avgComments || 0 },
                  { name: terms.shares, value: profileData.avgShares || 0 }
                ]}
                margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill={colors[0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Recent posts toggle */}
          <div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setRecentPostsVisible(!recentPostsVisible)}
              className="w-full"
            >
              {recentPostsVisible ? 'Hide Recent Posts' : 'Show Recent Posts'}
            </Button>
          </div>
          
          {/* Recent posts grid */}
          {recentPostsVisible && profileData.recentPosts && profileData.recentPosts.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Recent Posts</h4>
              <div className="grid grid-cols-3 gap-2">
                {profileData.recentPosts.map((post, index) => (
                  <a 
                    key={index} 
                    href={post.url || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="relative group"
                  >
                    <div className="aspect-square bg-gray-100 rounded overflow-hidden">
                      <img 
                        src={post.thumbnailUrl} 
                        alt={post.caption?.substring(0, 20) || `${platform} post`} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/api/placeholder/144/144';
                        }}
                      />
                      {post.type === 'Video' && (
                        <div className="absolute top-2 right-2">
                          <Play className="h-4 w-4 text-white" fill="white" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex flex-col items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex items-center text-white text-xs">
                          <Heart className="h-3 w-3 mr-1" fill="white" />
                          <span>{formatNumber(post.likes)}</span>
                        </div>
                        <div className="flex items-center text-white text-xs mt-1">
                          <MessageCircle className="h-3 w-3 mr-1" fill="white" />
                          <span>{formatNumber(post.comments)}</span>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'engagement' && (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Engagement Over Time</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={prepareEngagementData()}
                margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="likes" stroke={colors[0]} name={terms.likes} />
                <Line type="monotone" dataKey="comments" stroke={colors[1]} name={terms.comments} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-700 mb-2">Engagement Insights</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="inline-block w-3 h-3 bg-pink-500 rounded-full mt-1 mr-2"></span>
                <span>Your engagement rate is {engagementRate().toFixed(2)}%, which is 
                {engagementRate() > 3 ? ' above' : ' below'} the industry average of 3%.</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-3 h-3 bg-purple-500 rounded-full mt-1 mr-2"></span>
                <span>Your average {terms.likes.toLowerCase()} per post ({formatNumber(profileData.avgLikes || 0)}) represents 
                {profileData.followers ? ((profileData.avgLikes || 0) / profileData.followers * 100).toFixed(2) : '0'}% of your {terms.metric1.toLowerCase()}.</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mt-1 mr-2"></span>
                <span>{terms.comments} per post average ({formatNumber(profileData.avgComments || 0)}) indicates 
                {profileData.avgComments > 50 ? ' strong' : ' moderate'} audience interaction.</span>
              </li>
            </ul>
          </div>
        </div>
      )}
      
      {activeTab === 'content' && (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Content Type Distribution</h4>
            <div className="flex justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={contentTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {contentTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-pink-50 p-4 rounded-lg">
            <h4 className="font-medium text-pink-700 mb-2">Content Insights</h4>
            <ul className="space-y-2 text-sm">
              {profileData.contentDistribution?.photos > 0 && (
                <li className="flex items-start">
                  <span className="inline-block w-3 h-3 bg-pink-500 rounded-full mt-1 mr-2"></span>
                  <span>Photos make up {profileData.contentDistribution.photos}% of your content, with an average of {' '}
                  {profileData.photoEngagement?.avgLikes ? formatNumber(profileData.photoEngagement.avgLikes) : 'N/A'} {terms.likes.toLowerCase()} per photo.</span>
                </li>
              )}
              
              {profileData.contentDistribution?.videos > 0 && (
                <li className="flex items-start">
                  <span className="inline-block w-3 h-3 bg-purple-500 rounded-full mt-1 mr-2"></span>
                  <span>Videos represent {profileData.contentDistribution.videos}% of your content, with an average of {' '}
                  {profileData.videoEngagement?.avgViews ? formatNumber(profileData.videoEngagement.avgViews) : 'N/A'} views per video.</span>
                </li>
              )}
              
              {profileData.contentDistribution?.carousels > 0 && (
                <li className="flex items-start">
                  <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mt-1 mr-2"></span>
                  <span>
                    {platform === 'twitter' ? 'Threads' : platform === 'linkedin' ? 'Articles' : 'Carousel posts'} make up {profileData.contentDistribution.carousels}% of your content and typically get 
                    {profileData.contentDistribution.carousels > 30 ? ' higher' : ' similar'} engagement than single posts.
                  </span>
                </li>
              )}
              
              <li className="flex items-start">
                <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mt-1 mr-2"></span>
                <span>
                  {(() => {
                    // Determine highest performing content type
                    let highestType = "Photos";
                    let highestEngagement = profileData.photoEngagement?.avgLikes || 0;
                    
                    if ((profileData.videoEngagement?.avgLikes || 0) > highestEngagement) {
                      highestType = "Videos";
                      highestEngagement = profileData.videoEngagement.avgLikes;
                    }
                    
                    if (platform === 'twitter' && highestType === 'Photos') {
                      highestType = 'Image posts';
                    } else if (platform === 'linkedin' && highestType === 'Photos') {
                      highestType = 'Image updates';
                    }
                    
                    return `${highestType} currently have the highest engagement among your content types.`;
                  })()}
                </span>
              </li>
            </ul>
          </div>
          
          {/* Additional analytical insights */}
          <div className="mt-4">
            <h4 className="font-medium mb-2">Post Timing Analysis</h4>
            <p className="text-sm text-gray-600">
              Based on your recent posts, the optimal posting times appear to be:
            </p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-sm font-medium">Best Day</p>
                <p className="text-sm">{profileData.bestPostingDay || 'Wednesday'}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-sm font-medium">Best Time</p>
                <p className="text-sm">{profileData.bestPostingTime || '6:00 PM - 9:00 PM'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Profile bio at the bottom */}
      {profileData.bio && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium mb-1">{platform.charAt(0).toUpperCase() + platform.slice(1)} Bio</h4>
          <p className="text-sm text-gray-600 whitespace-pre-line">{profileData.bio}</p>
        </div>
      )}
      
      {/* Last updated timestamp */}
      <div className="mt-4 text-xs text-gray-500 text-right">
        Last updated: {profileData.lastUpdated ? 
          new Date(profileData.lastUpdated).toLocaleString() : 
          'Never'}
      </div>
    </div>
  );
};

export default SocialCard;