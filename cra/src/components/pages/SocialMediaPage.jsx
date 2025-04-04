// src/components/pages/SocialMediaPage.jsx

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Instagram, Twitter, Linkedin, Loader2, AlertCircle, Check } from 'lucide-react';
import TikTok from '../icons/TikTokIcon';
import SocialCard from '../social/SocialCard';
import { generateDummyProfileData } from '../../utils/dummyDataGenerator';

// Local storage keys - using more specific names to avoid conflicts
const STORAGE_KEY = 'socialMediaDashboard';

// Helper functions for working with localStorage
const saveToLocalStorage = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log('Saved to localStorage:', data);
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

const loadFromLocalStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsedData = JSON.parse(data);
      console.log('Loaded from localStorage:', parsedData);
      return parsedData;
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
  }
  return null;
};

// Create initial state by checking localStorage first
const getInitialState = () => {
  const savedData = loadFromLocalStorage();
  
  if (savedData) {
    return {
      socialData: savedData.profiles || {
        instagram: null,
        twitter: null,
        tiktok: null,
        linkedin: null
      },
      usernames: savedData.usernames || {
        instagram: '',
        twitter: '',
        tiktok: '',
        linkedin: ''
      },
      usernameMap: savedData.usernameMap || {
        instagram: {},
        twitter: {},
        tiktok: {},
        linkedin: {}
      }
    };
  }
  
  // Default initial state if nothing in localStorage
  return {
    socialData: {
      instagram: null,
      twitter: null,
      tiktok: null,
      linkedin: null
    },
    usernames: {
      instagram: '',
      twitter: '',
      tiktok: '',
      linkedin: ''
    },
    usernameMap: {
      instagram: {},
      twitter: {},
      tiktok: {},
      linkedin: {}
    }
  };
};

// Self-contained component with direct localStorage access
const SocialMediaPage = () => {
  // Initialize state from localStorage if available
  const initialState = getInitialState();
  
  // Local state for social media data
  const [socialData, setSocialData] = useState(initialState.socialData);
  const [usernames, setUsernames] = useState(initialState.usernames);
  const [usernameMap, setUsernameMap] = useState(initialState.usernameMap);
  
  // UI state
  const [loading, setLoading] = useState({
    instagram: false,
    twitter: false,
    tiktok: false,
    linkedin: false
  });
  const [errors, setErrors] = useState({
    instagram: null,
    twitter: null,
    tiktok: null,
    linkedin: null
  });
  const [success, setSuccess] = useState({
    instagram: false,
    twitter: false,
    tiktok: false,
    linkedin: false
  });
  
  // Save state to localStorage whenever relevant parts change
  useEffect(() => {
    const dataToSave = {
      profiles: socialData,
      usernames: usernames,
      usernameMap: usernameMap
    };
    
    saveToLocalStorage(dataToSave);
  }, [socialData, usernames, usernameMap]);
  
  // Log the current state on mount to debug
  useEffect(() => {
    console.log('Component mounted with state:', {
      socialData,
      usernames,
      usernameMap
    });
  }, []);

  const handleInputChange = (platform, value) => {
    const newUsernames = {
      ...usernames,
      [platform]: value
    };
    
    setUsernames(newUsernames);
    
    // Clear any error when user types
    if (errors[platform]) {
      setErrors(prev => ({
        ...prev,
        [platform]: null
      }));
    }
  };

  const handleConnectProfile = (platform, e) => {
    e.preventDefault();
    
    if (!usernames[platform].trim()) {
      setErrors(prev => ({
        ...prev,
        [platform]: `Please enter a ${platform} username`
      }));
      return;
    }
    
    // Set loading state
    setLoading(prev => ({
      ...prev,
      [platform]: true
    }));
    
    // Clear any previous errors
    setErrors(prev => ({
      ...prev,
      [platform]: null
    }));
    
    // Normalize the username (remove @ if present)
    const normalizedUsername = usernames[platform].startsWith('@') 
      ? usernames[platform].substring(1) 
      : usernames[platform];
    
    // Use setTimeout to simulate API delay
    setTimeout(() => {
      let profileData;
      
      // Check if we already have data for this username in our map
      if (usernameMap[platform] && usernameMap[platform][normalizedUsername]) {
        // Use existing data
        profileData = usernameMap[platform][normalizedUsername];
        console.log(`Using existing data for ${platform} profile: ${normalizedUsername}`, profileData);
      } else {
        // Generate new dummy data
        profileData = generateDummyProfileData(platform, normalizedUsername);
        
        // Update the username map
        const newUsernameMap = {
          ...usernameMap,
          [platform]: {
            ...usernameMap[platform],
            [normalizedUsername]: profileData
          }
        };
        
        setUsernameMap(newUsernameMap);
        console.log(`Generated new data for ${platform} profile: ${normalizedUsername}`, profileData);
      }
      
      // Update social data for this platform
      const newSocialData = {
        ...socialData,
        [platform]: profileData
      };
      
    //   setSocialData(newSocialData);
      
      // Show success message
      setSuccess(prev => ({
        ...prev,
        [platform]: true
      }));
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(prev => ({
          ...prev,
          [platform]: false
        }));
      }, 3000);
      
      // Set loading to false
      setLoading(prev => ({
        ...prev,
        [platform]: false
      }));
      
      // Save everything to localStorage immediately
      saveToLocalStorage({
        profiles: newSocialData,
        usernames: usernames,
        usernameMap: usernameMap[platform] && usernameMap[platform][normalizedUsername] 
          ? usernameMap
          : {
              ...usernameMap,
              [platform]: {
                ...usernameMap[platform],
                [normalizedUsername]: profileData
              }
            }
      });
    }, 1000);
  };

  const handleDisconnect = (platform) => {
    // Clear the data for this platform
    const newSocialData = {
      ...socialData,
      [platform]: null
    };
    
    // setSocialData(newSocialData);
    
    // Clear the username
    const newUsernames = {
      ...usernames,
      [platform]: ''
    };
    
    setUsernames(newUsernames);
    
    // Save to localStorage immediately
    saveToLocalStorage({
      profiles: newSocialData,
      usernames: newUsernames,
      usernameMap: usernameMap
    });
  };
  
  const handleUpdateProfile = (platform, username) => {
    // Generate fresh data
    const updatedData = generateDummyProfileData(platform, username);
    
    // Update the username map
    const newUsernameMap = {
      ...usernameMap,
      [platform]: {
        ...usernameMap[platform],
        [username]: updatedData
      }
    };
    
    setUsernameMap(newUsernameMap);
    
    // Update the profile data
    const newSocialData = {
      ...socialData,
      [platform]: updatedData
    };
    
    // setSocialData(newSocialData);
    
    // Save to localStorage immediately
    saveToLocalStorage({
      profiles: newSocialData,
      usernames: usernames,
      usernameMap: newUsernameMap
    });
    
    return updatedData;
  };

  // Platform configuration for rendering cards
  const platforms = [
    {
      id: 'instagram',
      name: 'Instagram',
      icon: <Instagram className="h-6 w-6 text-pink-500 mr-2" />,
      placeholderText: 'Enter username without the @ symbol',
      color: 'pink'
    },
    {
      id: 'twitter',
      name: 'X',
      icon: <Twitter className="h-6 w-6 text-blue-400 mr-2" />,
      placeholderText: 'Enter X username without the @ symbol',
      color: 'blue'
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: <TikTok className="h-6 w-6 text-black mr-2" />,
      placeholderText: 'Enter TikTok username',
      color: 'black'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: <Linkedin className="h-6 w-6 text-blue-600 mr-2" />,
      placeholderText: 'Enter LinkedIn username',
      color: 'blue'
    }
  ];

  return (
    <div className="social-media-page">
      <h1 className="text-2xl font-bold mb-6">Social Media Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {platforms.map(platform => (
          <Card key={platform.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center">
                {platform.icon}
                <CardTitle>{platform.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {!socialData[platform.id] ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Connect your {platform.name} profile to analyze your audience engagement metrics and content performance.
                  </p>
                  
                  <form onSubmit={(e) => handleConnectProfile(platform.id, e)} className="space-y-3">
                    <div>
                      <Label htmlFor={`${platform.id}-username`}>{platform.name} Username</Label>
                      <div className="flex mt-1">
                        <Input
                          id={`${platform.id}-username`}
                          placeholder="username"
                          value={usernames[platform.id]}
                          onChange={(e) => handleInputChange(platform.id, e.target.value)}
                          className="flex-grow"
                        />
                        <Button 
                          type="submit" 
                          className="ml-2" 
                          disabled={loading[platform.id]}
                        >
                          {loading[platform.id] ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Loading...
                            </>
                          ) : 'Connect'}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {platform.placeholderText}
                      </p>
                    </div>
                    
                    {errors[platform.id] && (
                      <div className="flex items-start bg-red-50 text-red-600 p-3 rounded-md">
                        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                        <p className="text-sm">{errors[platform.id]}</p>
                      </div>
                    )}
                    
                    {success[platform.id] && (
                      <div className="flex items-center bg-green-50 text-green-600 p-3 rounded-md">
                        <Check className="h-5 w-5 mr-2" />
                        <p className="text-sm">{platform.name} profile connected successfully!</p>
                      </div>
                    )}
                  </form>
                </div>
              ) : (
                <SocialCard 
                  platform={platform.id}
                  profileData={socialData[platform.id]} 
                  onDisconnect={() => handleDisconnect(platform.id)}
                  onUpdate={() => handleUpdateProfile(platform.id, socialData[platform.id].username)}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h3 className="text-sm font-medium text-blue-700 mb-2">About Social Media Analytics</h3>
        <p className="text-sm text-blue-600">
          This analytics dashboard helps you understand your social media performance across platforms. 
          Connect your profiles to analyze engagement rates, content performance, and audience demographics.
          This data can help you refine your content strategy and understand what resonates with your audience.
        </p>
      </div>
    </div>
  );
};

export default SocialMediaPage;