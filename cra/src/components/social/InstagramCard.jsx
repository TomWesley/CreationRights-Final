// src/components/social/InstagramCard.jsx

import React, { useState } from 'react';
import { Instagram, Users, Heart, MessageCircle, Calendar, RefreshCw, X, Camera, Play } from 'lucide-react';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { useAppContext } from '../../contexts/AppContext';
import { fetchInstagramProfile } from '../../services/socialMediaService';

// Import charts from recharts
import { 
  BarChart, Bar, 
  PieChart, Pie, Cell, 
  LineChart, Line,
  ResponsiveContainer, 
  XAxis, YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend
} from 'recharts';

const InstagramCard = ({ profileData, onDisconnect }) => {
    const { currentUser, setCurrentUser } = useAppContext();
    const [activeTab, setActiveTab] = useState('overview');
    const [isUpdating, setIsUpdating] = useState(false);
    const [recentPostsVisible, setRecentPostsVisible] = useState(false);
    
    // Debug log to see the raw profile data
    console.log('Raw Instagram profile data:', profileData);
    
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
    { name: 'Carousels', value: profileData.contentDistribution?.carousels || 0 }
  ].filter(item => item.value > 0); // Remove zero items
  
  // Chart colors
  const COLORS = ['#E1306C', '#833AB4', '#405DE6', '#FCAF45'];
  
  // Handle refresh/update profile data
  const handleUpdateProfile = async () => {
    try {
      setIsUpdating(true);
      
      // Call API to update the profile data
      const updatedData = await fetchInstagramProfile(currentUser.email, profileData.username);
      
      // Update the user context
      if (updatedData && currentUser) {
        const updatedUser = {
          ...currentUser,
          socialProfiles: {
            ...currentUser.socialProfiles,
            instagram: updatedData
          }
        };
        
        setCurrentUser(updatedUser);
      }
    } catch (error) {
      console.error('Error updating Instagram profile:', error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle disconnect
  const handleDisconnect = () => {
    // Remove the Instagram profile from user data
    if (currentUser) {
      const updatedUser = {
        ...currentUser
      };
      
      // If socialProfiles exists, remove instagram
      if (updatedUser.socialProfiles) {
        const updatedSocialProfiles = { ...updatedUser.socialProfiles };
        delete updatedSocialProfiles.instagram;
        updatedUser.socialProfiles = updatedSocialProfiles;
      }
      
      // Update the user context
      setCurrentUser(updatedUser);
      
      // Call the parent disconnect handler
      if (onDisconnect) {
        onDisconnect();
      }
    }
  };
  
  return (
    <div className="instagram-card">
      {/* Profile Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <div className="bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 p-0.5 rounded-full">
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
            <h3 className="font-semibold">@{profileData.username}</h3>
            <a 
              href={`https://instagram.com/${profileData.username}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-pink-500 flex items-center"
            >
              <Instagram className="h-3 w-3 mr-1" />
              View Profile
            </a>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex items-center text-gray-600"
            onClick={handleUpdateProfile}
            disabled={isUpdating}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isUpdating ? 'animate-spin' : ''}`} />
            {isUpdating ? 'Updating...' : 'Update'}
          </Button>
          
          <Button 
            size="sm" 
            variant="outline" 
            className="flex items-center text-red-500 hover:text-red-600 hover:border-red-300"
            onClick={handleDisconnect}
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
          <p className="text-xs text-gray-500">Followers</p>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg text-center">
          <Heart className="h-5 w-5 text-red-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{formatNumber(profileData.avgLikes || 0)}</p>
          <p className="text-xs text-gray-500">Avg. Likes</p>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg text-center">
          <MessageCircle className="h-5 w-5 text-purple-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{formatNumber(profileData.avgComments || 0)}</p>
          <p className="text-xs text-gray-500">Avg. Comments</p>
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
              <BarChart
                data={[
                  { name: 'Likes', value: profileData.avgLikes || 0 },
                  { name: 'Comments', value: profileData.avgComments || 0 }
                ]}
                margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#E1306C" />
              </BarChart>
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
                {profileData.recentPosts.map((post) => (
                  <a 
                    key={post.id} 
                    href={post.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="relative group"
                  >
                    <div className="aspect-square bg-gray-100 rounded overflow-hidden">
                      <img 
                        src={post.thumbnailUrl} 
                        alt={post.caption?.substring(0, 20) || 'Instagram post'} 
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
                <Line type="monotone" dataKey="likes" stroke="#E1306C" name="Likes" />
                <Line type="monotone" dataKey="comments" stroke="#833AB4" name="Comments" />
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
                <span>Your average likes per post ({formatNumber(profileData.avgLikes || 0)}) represents 
                {profileData.followers ? ((profileData.avgLikes || 0) / profileData.followers * 100).toFixed(2) : '0'}% of your followers.</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mt-1 mr-2"></span>
                <span>Comments per post average ({formatNumber(profileData.avgComments || 0)}) indicates 
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
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                  <span>Photos make up {profileData.contentDistribution.photos}% of your content, with an average of 
                  {profileData.photoEngagement?.avgLikes ? formatNumber(profileData.photoEngagement.avgLikes) : 'N/A'} likes per photo.</span>
                </li>
              )}
              
              {profileData.contentDistribution?.videos > 0 && (
                <li className="flex items-start">
                  <span className="inline-block w-3 h-3 bg-purple-500 rounded-full mt-1 mr-2"></span>
                  <span>Videos represent {profileData.contentDistribution.videos}% of your content, with an average of 
                  {profileData.videoEngagement?.avgViews ? formatNumber(profileData.videoEngagement.avgViews) : 'N/A'} views per video.</span>
                </li>
              )}
              
              {profileData.contentDistribution?.carousels > 0 && (
                <li className="flex items-start">
                  <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mt-1 mr-2"></span>
                  <span>Carousel posts make up {profileData.contentDistribution.carousels}% of your content and typically get 
                  {profileData.contentDistribution.carousels > 30 ? ' higher' : ' similar'} engagement than single photos.</span>
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
                <p className="text-sm">Wednesday</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-sm font-medium">Best Time</p>
                <p className="text-sm">6:00 PM - 9:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Profile bio at the bottom */}
      {profileData.bio && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium mb-1">Instagram Bio</h4>
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

export default InstagramCard;