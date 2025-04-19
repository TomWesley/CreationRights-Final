// src/components/pages/CreatorMyPage.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { useAppContext } from '../../contexts/AppContext';
import { FileText, ImageIcon, Music, Video, Code, Instagram, Twitter, Linkedin, Loader2 } from 'lucide-react';
import TikTok from '../icons/TikTokIcon';
import ProfilePhoto from '../shared/ProfilePhoto';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';

// Navigation tabs
const TABS = ["Home", "Collections", "Market", "Members", "About"];

const CreatorMyPage = () => {
  const { 
    currentUser,
    setActiveView,
    setIsLoading
  } = useAppContext();
  
  // State for active tab
  const [activeTab, setActiveTab] = useState("Home");
  const [profileData, setProfileData] = useState({
    name: '',
    bio: '',
    socialLinks: {}
  });
  
  // Local state for creations
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Load user profile data and creations
  useEffect(() => {
    if (currentUser) {
      setProfileData({
        name: currentUser.name || currentUser.email?.split('@')[0] || 'User',
        bio: currentUser.bio || 'No bio available',
        photoUrl: currentUser.photoUrl,
        socialLinks: currentUser.socialLinks || {}
      });
      
      // Fetch creations directly from Firestore
      const fetchCreations = async () => {
        setLoading(true);
        
        try {
          if (!currentUser.uid) {
            console.error("No user ID available");
            setLoading(false);
            return;
          }
          
          const creationsRef = collection(db, 'users', currentUser.uid, 'creations');
          const creationsQuery = query(
            creationsRef, 
            orderBy('dateCreated', 'desc'),
            limit(50)
          );
          
          const snapshot = await getDocs(creationsQuery);
          
          const userCreations = [];
          snapshot.forEach(doc => {
            userCreations.push({
              id: doc.id,
              ...doc.data()
            });
          });
          
          console.log(`Loaded ${userCreations.length} creations for MyPage`);
          setCreations(userCreations);
        } catch (error) {
          console.error('Error fetching creations for MyPage:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchCreations();
    }
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
  
  // Check if social link exists and return the href
  const getSocialLink = (platform, username) => {
    if (!username) return null;
    
    switch (platform) {
      case 'instagram':
        return `https://instagram.com/${username.replace('@', '')}`;
      case 'twitter':
        return `https://twitter.com/${username.replace('@', '')}`;
      case 'tiktok':
        return `https://tiktok.com/@${username.replace('@', '')}`;
      case 'linkedin':
        return `https://linkedin.com/in/${username.replace('@', '')}`;
      default:
        return null;
    }
  };
  
  // Render social media icons based on user's profiles
  const renderSocialIcons = () => {
    const { socialLinks } = profileData;
    if (!socialLinks) return null;
    
    return (
      <div className="flex space-x-3 mt-2">
        {socialLinks.instagram && (
          <a href={getSocialLink('instagram', socialLinks.instagram)} target="_blank" rel="noopener noreferrer">
            <Instagram className="h-5 w-5 text-pink-500 hover:text-pink-600" />
          </a>
        )}
        {socialLinks.twitter && (
          <a href={getSocialLink('twitter', socialLinks.twitter)} target="_blank" rel="noopener noreferrer">
            <Twitter className="h-5 w-5 text-blue-400 hover:text-blue-500" />
          </a>
        )}
        {socialLinks.tiktok && (
          <a href={getSocialLink('tiktok', socialLinks.tiktok)} target="_blank" rel="noopener noreferrer">
            <TikTok className="h-5 w-5 text-black hover:text-gray-800" />
          </a>
        )}
        {socialLinks.linkedin && (
          <a href={getSocialLink('linkedin', socialLinks.linkedin)} target="_blank" rel="noopener noreferrer">
            <Linkedin className="h-5 w-5 text-blue-600 hover:text-blue-700" />
          </a>
        )}
      </div>
    );
  };
  
  // Render creation cards
  const renderCreations = () => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading your creations...</p>
        </div>
      );
    }
    
    if (!creations || creations.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">No creations yet.</p>
          <Button 
            className="mt-4"
            onClick={() => setActiveView('uploadCreation')}
          >
            Upload Your First Creation
          </Button>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
        {creations.map(creation => (
          <div key={creation.id} className="creation-card-container">
            <Card className="creation-tile hover:shadow-md transition-shadow duration-200 overflow-hidden">
              <div className="relative">
                {/* Thumbnail Image */}
                <div className="creation-thumbnail">
                  {creation.thumbnailUrl || creation.fileUrl ? (
                    <img 
                      src={creation.thumbnailUrl || creation.fileUrl} 
                      alt={creation.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-t-lg">
                      {getCreationTypeIcon(creation.type)}
                    </div>
                  )}
                  
                  {/* Type Icon */}
                  <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm">
                    {getCreationTypeIcon(creation.type)}
                  </div>
                </div>
                
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm truncate">{creation.title}</h3>
                  <p className="text-xs text-gray-500">
                    {profileData.name}
                  </p>
                </CardContent>
              </div>
            </Card>
          </div>
        ))}
      </div>
    );
  };
  
  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {   
        
      case "Collections":
        return (
          <>
            {renderCreations()}
            
          </>
        );
      case "Home":
      case "Market":
      case "Members":
      case "About":
        return (
          <div className="bg-white rounded-lg p-6 mt-4">
            <p className="text-gray-500 text-center">
              {activeTab} content will be available soon.
            </p>
          </div>
        );
      default:
        return renderCreations();
    }
  };
  
  return (
    <div className="creator-my-page">
      {/* Profile Header */}
      <div className="profile-header flex flex-col md:flex-row items-start md:items-center mb-6 bg-white rounded-lg p-6 shadow-sm">
        <div className="profile-photo-container mr-6 mb-4 md:mb-0">
          {/* Custom implementation of profile photo to ensure size control */}
          {profileData.photoUrl ? (
            <img 
              src={profileData.photoUrl} 
              alt={profileData.name} 
              className="user-avatar"
            />
          ) : (
            <div 
              className="user-avatar flex items-center justify-center bg-gray-200 text-gray-700 font-bold text-2xl"
            >
              {profileData.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}
        </div>
        
        <div className="profile-info flex-grow">
          <h1 className="text-2xl font-bold">{profileData.name}</h1>
          <p className="text-gray-600 mt-1 max-w-2xl">
            {profileData.bio}
          </p>
          
          {/* Social Media Icons */}
          {renderSocialIcons()}
        </div>
        
        <div className="mt-4 md:mt-0">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setActiveView('settings')}
          >
            Edit Profile
          </Button>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="nav-tabs">
        <div className="nav-tabs-container">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`nav-tab-button ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      
      {/* Tab Content */}
      {renderContent()}
    </div>
  );
};

export default CreatorMyPage;