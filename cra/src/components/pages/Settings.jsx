import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Save, Check, Loader2, X, Plus } from 'lucide-react';
import ProfilePhotoUpload from '../shared/ProfilePhotoUpload';
import { useAppContext } from '../../contexts/AppContext';
import { updateUserProfile } from '../../services/firebase';

const Settings = () => {
  const { currentUser, updateUserProfile: updateUserInContext } = useAppContext();
  const [profileSaved, setProfileSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Initialize with empty data
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    bio: '',
    website: '',
    location: '',
    photoUrl: null,
    photoPath: null,
    contentTypes: [],
    status: 'active',
    socialLinks: {}
  });
  
  const [newContentType, setNewContentType] = useState('');

  // Content type options
  const contentTypeOptions = ['Photography', 'Illustration', 'Video', 'Audio', 'Mixed Media', 'Text', 'Digital Art', '3D', 'Animation'];

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser) {
        console.error("No user available in context");
        setIsLoading(false);
        return;
      }
      
      try {
        console.log(`Loading user data for ${currentUser.email}...`);
        
        // Set profile data from currentUser object (which comes from Firestore)
        setProfileData({
          name: currentUser?.name || '',
          email: currentUser?.email || '',
          bio: currentUser?.bio || '',
          website: currentUser?.website || '',
          location: currentUser?.location || '',
          photoUrl: currentUser?.photoUrl || null,
          photoPath: currentUser?.photoPath || null,
          contentTypes: currentUser?.contentTypes || [],
          status: currentUser?.status || 'active',
          socialLinks: currentUser?.socialLinks || {}
        });
      } catch (err) {
        console.error("Error setting up profile data:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, [currentUser]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle photo change
  const handlePhotoChange = (file, photoUrl) => {
    setProfileData(prev => ({
      ...prev,
      photoUrl: photoUrl
    }));
    console.log('Photo changed:', { file, photoUrl });
  };

  // Handle adding a content type
  const handleAddContentType = () => {
    if (newContentType && !profileData.contentTypes.includes(newContentType)) {
      setProfileData(prev => ({
        ...prev,
        contentTypes: [...prev.contentTypes, newContentType]
      }));
      setNewContentType('');
    }
  };

  // Handle removing a content type
  const handleRemoveContentType = (contentType) => {
    setProfileData(prev => ({
      ...prev,
      contentTypes: prev.contentTypes.filter(c => c !== contentType)
    }));
  };

  // Handle social link changes
  const handleSocialLinkChange = (platform, value) => {
    setProfileData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
  };

  // Handle form submission - updated for Firebase
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsLoading(true);
    
    try {
      // Create a complete user data object with all profile fields
      const completeUserData = {
        // Basic user info
        name: profileData.name || currentUser.name || currentUser.email.split('@')[0],
        userType: currentUser.userType || 'creator',
        
        // Profile data from the form
        email: currentUser.email,
        bio: profileData.bio || '',
        website: profileData.website || '',
        location: profileData.location || '',
        photoUrl: profileData.photoUrl || null,
        photoPath: profileData.photoPath || null,
        contentTypes: profileData.contentTypes || [],
        socialLinks: profileData.socialLinks || {},
        
        // Timestamps
        updatedAt: new Date().toISOString(),
        
        // Status
        status: profileData.status || 'active'
      };
      
      console.log("Saving complete user data to Firestore:", completeUserData);
      
      // Save to Firestore
      await updateUserProfile(currentUser.uid, completeUserData);
      
      // Also update the user in context
      await updateUserInContext(completeUserData);
      
      // Show success message
      setProfileSaved(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setProfileSaved(false);
      }, 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again. Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="settings-view">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
      
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading profile data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-6 mb-6">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Profile</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      ) : (
        <>
          <Card className="settings-card mb-6">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-shrink-0">
                    <ProfilePhotoUpload 
                      currentPhoto={profileData.photoUrl}
                      photoPath={profileData.photoPath}
                      onPhotoChange={handlePhotoChange}
                    />
                  </div>
                  
                  <div className="flex-grow space-y-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input 
                        id="name" 
                        name="name" 
                        value={profileData.name} 
                        onChange={handleInputChange}
                        placeholder="Your name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        name="email" 
                        value={profileData.email} 
                        disabled
                        className="bg-gray-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                    
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input 
                        id="location" 
                        name="location" 
                        value={profileData.location} 
                        onChange={handleInputChange}
                        placeholder="City, Country"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input 
                        id="website" 
                        name="website" 
                        value={profileData.website} 
                        onChange={handleInputChange}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea 
                    id="bio" 
                    name="bio" 
                    value={profileData.bio} 
                    onChange={handleInputChange}
                    placeholder="Tell others about yourself and your creative work..."
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your bio will be visible to collaborators and agencies
                  </p>
                </div>

                {/* Content Types Section */}
                <div className="border p-4 rounded-md">
                  <Label className="text-lg font-medium mb-2 block">Content Types</Label>
                  <p className="text-sm text-gray-500 mb-3">Select the types of content you create</p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {profileData.contentTypes.map((contentType, index) => (
                      <div key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center">
                        <span>{contentType}</span>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveContentType(contentType)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <select
                      value={newContentType}
                      onChange={(e) => setNewContentType(e.target.value)}
                      className="flex-grow rounded-md border border-gray-300 p-2"
                    >
                      <option value="">Select a content type</option>
                      {contentTypeOptions.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <Button 
                      type="button" 
                      onClick={handleAddContentType}
                      disabled={!newContentType}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                </div>
                
                {/* Social Media Links */}
                <div className="border p-4 rounded-md">
                  <Label className="text-lg font-medium mb-2 block">Social Media</Label>
                  <p className="text-sm text-gray-500 mb-3">Connect your social profiles</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input 
                        id="instagram" 
                        value={profileData.socialLinks?.instagram || ''} 
                        onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                        placeholder="Your Instagram handle"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="twitter">Twitter</Label>
                      <Input 
                        id="twitter" 
                        value={profileData.socialLinks?.twitter || ''} 
                        onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                        placeholder="Your Twitter handle"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="behance">Behance</Label>
                      <Input 
                        id="behance" 
                        value={profileData.socialLinks?.behance || ''} 
                        onChange={(e) => handleSocialLinkChange('behance', e.target.value)}
                        placeholder="Your Behance URL"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <Input 
                        id="linkedin" 
                        value={profileData.socialLinks?.linkedin || ''} 
                        onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                        placeholder="Your LinkedIn URL"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Button type="submit" className="save-profile-button" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  
                  {profileSaved && (
                    <div className="flex items-center text-green-600">
                      <Check className="h-4 w-4 mr-1" />
                      <span>Profile updated successfully</span>
                    </div>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
          
          <Card className="settings-card mt-6">
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Profile Visibility</h3>
                    <p className="text-sm text-gray-500">Control who can see your profile information</p>
                  </div>
                  <select className="rounded border border-gray-300 px-3 py-2">
                    <option value="public">Public</option>
                    <option value="connections">Connections Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-gray-500">Receive emails about new messages and updates</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Agency Contact Permissions</h3>
                    <p className="text-sm text-gray-500">Allow agencies to contact you with opportunities</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Settings;