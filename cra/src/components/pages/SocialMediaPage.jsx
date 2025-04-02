// src/components/pages/SocialMediaPage.jsx

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Instagram, Twitter, Facebook, Youtube, Linkedin, Loader2, AlertCircle, Check } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import InstagramCard from '../social/InstagramCard';
import { fetchInstagramProfile } from '../../services/socialMediaService';

const SocialMediaPage = () => {
  const { currentUser } = useAppContext();
  const [instagramUsername, setInstagramUsername] = useState('');
  const [instagramData, setInstagramData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Load saved Instagram data on component mount
  useEffect(() => {
    if (currentUser?.socialProfiles?.instagram) {
      setInstagramData(currentUser.socialProfiles.instagram);
      setInstagramUsername(currentUser.socialProfiles.instagram.username || '');
    }
  }, [currentUser]);

  const handleFetchInstagramProfile = async (e) => {
    e.preventDefault();
    
    if (!instagramUsername.trim()) {
      setError('Please enter an Instagram username');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Normalize the username (remove @ if present)
      const normalizedUsername = instagramUsername.startsWith('@') 
        ? instagramUsername.substring(1) 
        : instagramUsername;
      
      // Call the service to fetch Instagram profile data
      const profileData = await fetchInstagramProfile(normalizedUsername);
      
      // Update state with profile data
      setInstagramData(profileData);
      
      // Show success message
      setSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error fetching Instagram profile:', error);
      setError(error.message || 'Failed to fetch Instagram profile data. The account may be private or Instagram may be limiting requests. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="social-media-page">
      <h1 className="text-2xl font-bold mb-6">Social Media Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Instagram Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center">
              <Instagram className="h-6 w-6 text-pink-500 mr-2" />
              <CardTitle>Instagram</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {!instagramData ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Connect your Instagram profile to analyze your audience engagement metrics and content performance.
                </p>
                
                <form onSubmit={handleFetchInstagramProfile} className="space-y-3">
                  <div>
                    <Label htmlFor="instagram-username">Instagram Username</Label>
                    <div className="flex mt-1">
                      <Input
                        id="instagram-username"
                        placeholder="username"
                        value={instagramUsername}
                        onChange={(e) => setInstagramUsername(e.target.value)}
                        className="flex-grow"
                      />
                      <Button 
                        type="submit" 
                        className="ml-2" 
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : 'Connect'}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Enter username without the @ symbol
                    </p>
                  </div>
                  
                  {error && (
                    <div className="flex items-start bg-red-50 text-red-600 p-3 rounded-md">
                      <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}
                  
                  {success && (
                    <div className="flex items-center bg-green-50 text-green-600 p-3 rounded-md">
                      <Check className="h-5 w-5 mr-2" />
                      <p className="text-sm">Instagram profile connected successfully!</p>
                    </div>
                  )}
                </form>
              </div>
            ) : (
              <InstagramCard 
                profileData={instagramData} 
                onDisconnect={() => setInstagramData(null)}
              />
            )}
          </CardContent>
        </Card>
        
        {/* Twitter Section - Placeholder for future implementation */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center">
              <Twitter className="h-6 w-6 text-blue-400 mr-2" />
              <CardTitle>Twitter</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <Twitter className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Coming Soon</p>
              <p className="text-sm text-gray-500 mt-1">
                Twitter integration will be available in a future update.
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Placeholders for other platforms */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center">
              <Youtube className="h-6 w-6 text-red-500 mr-2" />
              <CardTitle>YouTube</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <Youtube className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Coming Soon</p>
              <p className="text-sm text-gray-500 mt-1">
                YouTube integration will be available in a future update.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center">
              <Linkedin className="h-6 w-6 text-blue-600 mr-2" />
              <CardTitle>LinkedIn</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <Linkedin className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Coming Soon</p>
              <p className="text-sm text-gray-500 mt-1">
                LinkedIn integration will be available in a future update.
              </p>
            </div>
          </CardContent>
        </Card>
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