// src/components/pages/AgencyDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { useAppContext } from '../../contexts/AppContext';
import { 
  FileText, ImageIcon, Music, Video, Code, 
  Users, Star, Clock, FileCheck, UserCheck, 
  BarChart3, Loader2, Calendar, Zap, CreditCard,
  Scroll
} from 'lucide-react';

// Mock data for licenses
const MOCK_LICENSES = [
  {
    id: 'lic-001',
    creationId: 'cr-001',
    title: 'Mountain Landscape Photo Series',
    artist: 'Jane Cooper',
    artistId: 'user-001',
    type: 'image',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba',
    acquired: '2025-03-15',
    expires: '2026-03-15',
    status: 'active',
    usageScope: 'Commercial - Digital Media Only'
  },
  {
    id: 'lic-002',
    creationId: 'cr-002',
    title: 'Urban Beats Vol. 2',
    artist: 'Marcus Reid',
    artistId: 'user-002',
    type: 'music',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d',
    acquired: '2025-04-01',
    expires: '2025-10-01', 
    status: 'active',
    usageScope: 'Commercial - All Media'
  },
  {
    id: 'lic-003',
    creationId: 'cr-003',
    title: 'Spring Fashion Collection Photos',
    artist: 'Elena Santos',
    artistId: 'user-003',
    type: 'image',
    thumbnailUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f',
    acquired: '2025-02-20',
    expires: '2025-08-20',
    status: 'active',
    usageScope: 'Commercial - Print Only'
  },
  {
    id: 'lic-004',
    creationId: 'cr-004',
    title: 'Product Promo Video Template',
    artist: 'David Chen',
    artistId: 'user-004',
    type: 'video',
    thumbnailUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279',
    acquired: '2025-01-10',
    expires: '2025-07-10',
    status: 'expiring-soon',
    usageScope: 'Commercial - Digital Media Only'
  }
];

// Mock data for favorite artists
const MOCK_FAVORITE_ARTISTS = [
  {
    id: 'user-001',
    name: 'Jane Cooper',
    bio: 'Wildlife and landscape photographer based in Colorado',
    photoUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
    rating: 4.9,
    creationCount: 87,
    licensesSold: 213,
    specialties: ['Photography', 'Nature', 'Wildlife']
  },
  {
    id: 'user-002',
    name: 'Marcus Reid',
    bio: 'Music producer specializing in hip-hop and electronic beats',
    photoUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
    rating: 4.7,
    creationCount: 124,
    licensesSold: 456,
    specialties: ['Music', 'Hip-Hop', 'Electronic']
  },
  {
    id: 'user-003',
    name: 'Elena Santos',
    bio: 'Fashion photographer with over 10 years of industry experience',
    photoUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
    rating: 4.8,
    creationCount: 203,
    licensesSold: 178,
    specialties: ['Photography', 'Fashion', 'Commercial']
  }
];

// Mock data for recent activity
const MOCK_RECENT_ACTIVITY = [
  {
    id: 'act-001',
    type: 'license_acquired',
    title: 'License acquired for "Mountain Landscape Photo Series"',
    timestamp: '2025-03-15T14:30:00Z',
    details: {
      creationId: 'cr-001',
      licenseId: 'lic-001',
      artist: 'Jane Cooper'
    }
  },
  {
    id: 'act-002',
    type: 'artist_favorited',
    title: 'Added Marcus Reid to favorites',
    timestamp: '2025-03-12T09:15:00Z',
    details: {
      artistId: 'user-002',
      artist: 'Marcus Reid'
    }
  },
  {
    id: 'act-003',
    type: 'license_expiring',
    title: 'License for "Product Promo Video Template" expiring soon',
    timestamp: '2025-03-10T16:45:00Z',
    details: {
      creationId: 'cr-004',
      licenseId: 'lic-004',
      expiryDate: '2025-07-10',
      artist: 'David Chen'
    }
  },
  {
    id: 'act-004',
    type: 'creation_viewed',
    title: 'Viewed "Spring Fashion Collection Photos"',
    timestamp: '2025-03-08T11:20:00Z',
    details: {
      creationId: 'cr-003',
      artist: 'Elena Santos'
    }
  }
];

// Mock data for analytics
const MOCK_ANALYTICS = {
  totalLicenses: 32,
  activeLicenses: 28,
  expiringLicenses: 4,
  favoriteArtists: 12,
  totalSpent: 8750,
  licensesByType: {
    image: 16,
    video: 8,
    music: 6,
    text: 2
  }
};

const AgencyDashboard = () => {
  const { 
    currentUser,
    setActiveView,
    isLoading,
    setIsLoading
  } = useAppContext();
  
  const [licenses, setLicenses] = useState([]);
  const [favoriteArtists, setFavoriteArtists] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      setDashboardLoading(true);
      
      try {
        // In a real app, we would fetch from Firebase here
        // For now, use mock data with a small delay to simulate loading
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setLicenses(MOCK_LICENSES);
        setFavoriteArtists(MOCK_FAVORITE_ARTISTS);
        setRecentActivity(MOCK_RECENT_ACTIVITY);
        setAnalytics(MOCK_ANALYTICS);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setDashboardLoading(false);
      }
    };
    
    loadDashboardData();
  }, [currentUser]);
  
  // Get icon for creation type
  const getCreationTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'image':
        return <ImageIcon className="creation-type-icon image-icon" />;
      case 'text':
        return <FileText className="creation-type-icon text-icon" />;
      case 'music':
        return <Music className="creation-type-icon music-icon" />;
      case 'video':
        return <Video className="creation-type-icon video-icon" />;
      case 'software':
        return <Code className="creation-type-icon software-icon" />;
      default:
        return <FileText className="creation-type-icon default-icon" />;
    }
  };
  
  // Format date to a more readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Calculate days until expiration
  const getDaysUntilExpiration = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = Math.abs(expiry - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  // Get activity icon based on activity type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'license_acquired':
        return <Scroll className="h-4 w-4 text-green-500" />;
      case 'artist_favorited':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'license_expiring':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'creation_viewed':
        return <ImageIcon className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Format relative time for activity feed
  const getRelativeTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 30) {
      const diffWeeks = Math.floor(diffDays / 7);
      return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
    } else {
      return formatDate(timestamp);
    }
  };
  
  // Render loading state
  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard agency-dashboard">
      <div className="grid grid-cols-1 gap-6">
        {/* Welcome and summary section */}
        <div className="welcome-section bg-white rounded-lg p-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl font-bold">
                Welcome back, {currentUser?.name || 'Agency'}
              </h1>
              <p className="text-gray-600 mt-1">
                Here's what's happening with your licensed content
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <Button 
                onClick={() => setActiveView('allCreations')}
                className="bg-gray-600 hover:bg-gray-700"
              >
                Browse Content
              </Button>
              <Button 
                variant="outline"
                onClick={() => setActiveView('creators')}
              >
                Find Creators
              </Button>
            </div>
          </div>
        </div>
        
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Active Licenses</p>
                  <h3 className="text-2xl font-bold">{analytics.activeLicenses}</h3>
                </div>
                <Scroll className="h-8 w-8 text-blue-500" />
              </div>
              <div className="mt-2">
                <p className="text-xs text-orange-500">
                  {analytics.expiringLicenses} expiring soon
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Favorite Creators</p>
                  <h3 className="text-2xl font-bold">{analytics.favoriteArtists}</h3>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="mt-2">
                <p className="text-xs text-green-500">
                  4 new additions this month
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Spent</p>
                  <h3 className="text-2xl font-bold">${analytics.totalSpent.toLocaleString()}</h3>
                </div>
                <CreditCard className="h-8 w-8 text-green-500" />
              </div>
              <div className="mt-2">
                <p className="text-xs text-gray-500">
                  This year
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">License Usage</p>
                  <h3 className="text-2xl font-bold">78%</h3>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
              <div className="mt-2">
                <p className="text-xs text-blue-500">
                  Above industry average
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main dashboard content in tabs */}
        <Tabs defaultValue="licenses" className="w-full">
          <TabsList className="w-full flex justify-start bg-white shadow-sm mb-6">
            <TabsTrigger value="licenses" className="flex-1 md:flex-none py-2 px-4">
              <Scroll className="h-4 w-4 mr-2" />
              Licensed Content
            </TabsTrigger>
            <TabsTrigger value="creators" className="flex-1 md:flex-none py-2 px-4">
              <Star className="h-4 w-4 mr-2" />
              Favorite Creators
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex-1 md:flex-none py-2 px-4">
              <Clock className="h-4 w-4 mr-2" />
              Recent Activity
            </TabsTrigger>
          </TabsList>
          
          {/* Licenses Tab */}
          <TabsContent value="licenses" className="mt-0">
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Your Licensed Content</h2>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveView('licenses')}
                  >
                    View All Licenses
                  </Button>
                </div>
                
                <div className="licenses-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {licenses.map(license => (
                    <Card key={license.id} className="overflow-hidden hover:shadow-md transition-shadow duration-200">
                      <div className="relative">
                        {/* Thumbnail */}
                        <div className="h-48 bg-gray-200 relative">
                          {license.thumbnailUrl ? (
                            <img 
                              src={license.thumbnailUrl} 
                              alt={license.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {getCreationTypeIcon(license.type)}
                            </div>
                          )}
                          
                          {/* License status badge */}
                          <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                            license.status === 'active' ? 'bg-green-100 text-green-800' :
                            license.status === 'expiring-soon' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {license.status === 'active' ? 'Active' : 
                             license.status === 'expiring-soon' ? 'Expiring Soon' : 
                             license.status}
                          </div>
                          
                          {/* Type icon */}
                          <div className="absolute top-2 left-2 bg-white rounded-full p-1 shadow-sm">
                            {getCreationTypeIcon(license.type)}
                          </div>
                        </div>
                        
                        <CardContent className="p-4">
                          <h3 className="font-medium text-sm truncate">{license.title}</h3>
                          <p className="text-xs text-gray-500 mt-1">By {license.artist}</p>
                          
                          <div className="mt-3 flex flex-col space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Acquired:</span>
                              <span>{formatDate(license.acquired)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Expires:</span>
                              <span className={license.status === 'expiring-soon' ? 'text-orange-500 font-medium' : ''}>
                                {formatDate(license.expires)} 
                                {license.status === 'expiring-soon' && 
                                 ` (${getDaysUntilExpiration(license.expires)} days)`}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs mt-1">
                              <span className="text-gray-500">Usage:</span>
                              <span className="font-medium">{license.usageScope}</span>
                            </div>
                          </div>
                        </CardContent>
                        
                        <CardFooter className="px-4 py-3 bg-gray-50 flex justify-between">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          <Button variant="ghost" size="sm">
                            Renew
                          </Button>
                        </CardFooter>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Favorite Creators Tab */}
          <TabsContent value="creators" className="mt-0">
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Your Favorite Creators</h2>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveView('creators')}
                  >
                    View All Creators
                  </Button>
                </div>
                
                <div className="creators-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {favoriteArtists.map(artist => (
                    <Card key={artist.id} className="overflow-hidden hover:shadow-md transition-shadow duration-200">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          {/* Artist Photo */}
                          <div className="relative">
                            {artist.photoUrl ? (
                              <img 
                                src={artist.photoUrl} 
                                alt={artist.name}
                                className="w-16 h-16 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-xl">
                                {artist.name.charAt(0)}
                              </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-1">
                              <Star className="h-3 w-3 text-white" />
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="font-medium text-sm">{artist.name}</h3>
                            <div className="flex items-center mt-1">
                              <Star className="h-3 w-3 text-yellow-500 fill-current" />
                              <span className="text-xs ml-1">{artist.rating}</span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-600 mt-3 line-clamp-2">{artist.bio}</p>
                        
                        {/* Artist stats */}
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <div className="bg-gray-50 rounded p-2 text-center">
                            <span className="block text-sm font-medium">{artist.creationCount}</span>
                            <span className="block text-xs text-gray-500">Creations</span>
                          </div>
                          <div className="bg-gray-50 rounded p-2 text-center">
                            <span className="block text-sm font-medium">{artist.licensesSold}</span>
                            <span className="block text-xs text-gray-500">Licenses Sold</span>
                          </div>
                        </div>
                        
                        {/* Specialties */}
                        <div className="mt-3 flex flex-wrap gap-1">
                          {artist.specialties.map((specialty, index) => (
                            <span key={index} className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                      
                      <CardFooter className="px-4 py-3 bg-gray-50 flex justify-between">
                        <Button variant="outline" size="sm">
                          View Profile
                        </Button>
                        <Button variant="ghost" size="sm">
                          Message
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Recent Activity Tab */}
          <TabsContent value="activity" className="mt-0">
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold">Recent Activity</h2>
                </div>
                
                <div className="p-4">
                  <div className="activity-timeline">
                    {recentActivity.map((activity, index) => (
                      <div key={activity.id} className="activity-item flex mb-4 last:mb-0">
                        {/* Timeline connector */}
                        <div className="timeline-connector mr-4 relative">
                          <div className="activity-icon p-2 rounded-full bg-blue-50 z-10 relative">
                            {getActivityIcon(activity.type)}
                          </div>
                          {index < recentActivity.length - 1 && (
                            <div className="absolute top-8 bottom-0 left-1/2 w-px bg-gray-200 -translate-x-1/2"></div>
                          )}
                        </div>
                        
                        {/* Activity content */}
                        <div className="activity-content flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-sm font-medium">{activity.title}</h4>
                              <p className="text-xs text-gray-500 mt-1">
                                {activity.type === 'license_acquired' && `From ${activity.details.artist}`}
                                {activity.type === 'artist_favorited' && `Artist: ${activity.details.artist}`}
                                {activity.type === 'license_expiring' && `Expires on ${formatDate(activity.details.expiryDate)}`}
                                {activity.type === 'creation_viewed' && `By ${activity.details.artist}`}
                              </p>
                            </div>
                            <span className="text-xs text-gray-400">
                              {getRelativeTime(activity.timestamp)}
                            </span>
                          </div>
                          
                          {/* Action buttons for specific activity types */}
                          {activity.type === 'license_expiring' && (
                            <div className="mt-2">
                              <Button variant="outline" size="sm" className="text-xs h-8">
                                Renew License
                              </Button>
                            </div>
                          )}
                          
                          {activity.type === 'license_acquired' && (
                            <div className="mt-2">
                              <Button variant="outline" size="sm" className="text-xs h-8">
                                View License
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Quick Actions Section */}
        <div className="quick-actions bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col items-center justify-center"
              onClick={() => setActiveView('allCreations')}
            >
              <div className="p-2 rounded-full bg-blue-50 mb-2">
                <Scroll className="h-5 w-5 text-blue-500" />
              </div>
              <span className="text-sm">Acquire License</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col items-center justify-center"
              onClick={() => setActiveView('creators')}
            >
              <div className="p-2 rounded-full bg-purple-50 mb-2">
                <UserCheck className="h-5 w-5 text-purple-500" />
              </div>
              <span className="text-sm">Find Creators</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col items-center justify-center"
              onClick={() => setActiveView('licenses')}
            >
              <div className="p-2 rounded-full bg-orange-50 mb-2">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <span className="text-sm">Review Licenses</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col items-center justify-center"
              onClick={() => setActiveView('settings')}
            >
              <div className="p-2 rounded-full bg-green-50 mb-2">
                <Zap className="h-5 w-5 text-green-500" />
              </div>
              <span className="text-sm">Update Settings</span>
            </Button>
          </div>
        </div>
        
        {/* Upcoming Renewals Calendar */}
        <div className="upcoming-renewals bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Upcoming License Renewals</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setActiveView('licenses')}
              className="text-blue-600"
            >
              View All
            </Button>
          </div>
          
          <div className="p-4">
            <div className="renewals-timeline">
              {licenses
                .filter(license => license.status === 'expiring-soon')
                .map(license => (
                  <div key={license.id} className="renewal-item flex items-center p-3 border-b border-gray-100 last:border-0">
                    <div className="mr-4 p-2 rounded-full bg-orange-50">
                      <Calendar className="h-5 w-5 text-orange-500" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h4 className="text-sm font-medium">{license.title}</h4>
                          <p className="text-xs text-gray-500">By {license.artist}</p>
                        </div>
                        
                        <div className="mt-2 sm:mt-0 flex items-center">
                          <div className="bg-orange-50 px-2 py-1 rounded text-xs text-orange-600 font-medium">
                            Expires {formatDate(license.expires)}
                          </div>
                          <span className="ml-2 text-xs text-gray-500">
                            ({getDaysUntilExpiration(license.expires)} days)
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex space-x-2">
                        <Button size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700">
                          Renew License
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              
              {licenses.filter(license => license.status === 'expiring-soon').length === 0 && (
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">No upcoming renewals at this time.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Recommended Content */}
        <div className="recommended-content bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold">Recommended for You</h2>
            <p className="text-xs text-gray-500 mt-1">
              Based on your licensing history and favorited creators
            </p>
          </div>
          
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Just showing a few sample recommended items */}
            <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
              <div className="h-40 bg-gray-200 relative">
                <img 
                  src="https://images.unsplash.com/photo-1518640467707-6811f4a6ab73" 
                  alt="Abstract Art Collection"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-white rounded-full p-1 shadow-sm">
                  {getCreationTypeIcon('image')}
                </div>
              </div>
              
              <CardContent className="p-3">
                <h3 className="font-medium text-sm truncate">Abstract Art Collection</h3>
                <p className="text-xs text-gray-500">By Alex Morgan</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-blue-600">$490 / year</span>
                  <Button variant="ghost" size="sm" className="h-7 p-0">
                    <Star className="h-4 w-4 text-gray-400 hover:text-yellow-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
              <div className="h-40 bg-gray-200 relative">
                <img 
                  src="https://images.unsplash.com/photo-1484704849700-f032a568e944" 
                  alt="Urban Sounds Collection"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-white rounded-full p-1 shadow-sm">
                  {getCreationTypeIcon('music')}
                </div>
              </div>
              
              <CardContent className="p-3">
                <h3 className="font-medium text-sm truncate">Urban Sounds Collection</h3>
                <p className="text-xs text-gray-500">By Sound Masters</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-blue-600">$320 / year</span>
                  <Button variant="ghost" size="sm" className="h-7 p-0">
                    <Star className="h-4 w-4 text-gray-400 hover:text-yellow-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
              <div className="h-40 bg-gray-200 relative">
                <img 
                  src="https://images.unsplash.com/photo-1558655146-9f40138edfeb" 
                  alt="Product Mockup Templates"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-white rounded-full p-1 shadow-sm">
                  {getCreationTypeIcon('image')}
                </div>
              </div>
              
              <CardContent className="p-3">
                <h3 className="font-medium text-sm truncate">Product Mockup Templates</h3>
                <p className="text-xs text-gray-500">By Design Hub</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-blue-600">$250 / year</span>
                  <Button variant="ghost" size="sm" className="h-7 p-0">
                    <Star className="h-4 w-4 text-gray-400 hover:text-yellow-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
              <div className="h-40 bg-gray-200 relative">
                <img 
                  src="https://images.unsplash.com/photo-1536240478700-b869070f9279" 
                  alt="Corporate Video Backgrounds"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-white rounded-full p-1 shadow-sm">
                  {getCreationTypeIcon('video')}
                </div>
              </div>
              
              <CardContent className="p-3">
                <h3 className="font-medium text-sm truncate">Corporate Video Backgrounds</h3>
                <p className="text-xs text-gray-500">By VideoLab Studios</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-blue-600">$410 / year</span>
                  <Button variant="ghost" size="sm" className="h-7 p-0">
                    <Star className="h-4 w-4 text-gray-400 hover:text-yellow-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="p-4 border-t border-gray-100 text-center">
            <Button 
              variant="outline"
              onClick={() => setActiveView('allCreations')}
            >
              View More Recommendations
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgencyDashboard;