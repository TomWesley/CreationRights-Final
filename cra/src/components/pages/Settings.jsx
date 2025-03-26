import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { User, Save, Check, Loader2 } from 'lucide-react';
import ProfilePhotoUpload from '../shared/ProfilePhotoUpload';
import { useAppContext } from '../../contexts/AppContext';
import { uploadProfilePhoto } from '../../services/fileUpload';
import { saveUserData } from '../../services/api';

const Settings = () => {
  const { currentUser, setCurrentUser } = useAppContext();
  const [profileSaved, setProfileSaved] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    bio: currentUser?.bio || '',
    website: currentUser?.website || '',
    location: currentUser?.location || '',
    photoUrl: currentUser?.photoUrl || null
  });
  const [photoFile, setPhotoFile] = useState(null);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle photo change
  const handlePhotoChange = (file, url) => {
    setPhotoFile(file);
    setProfileData(prev => ({
      ...prev,
      photoUrl: url
    }));
    
    console.log('Photo changed:', { file, url });
  };

  // Log the current photo URL for debugging
  useEffect(() => {
    if (currentUser?.photoUrl) {
      console.log('Current user photo URL:', currentUser.photoUrl);
      
      // Test if the URL is valid and accessible
      const img = new Image();
      img.onload = () => console.log('Image loaded successfully');
      img.onerror = () => console.error('Failed to load image from URL:', currentUser.photoUrl);
      img.src = currentUser.photoUrl;
    }
  }, [currentUser?.photoUrl]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsUploading(true);
    
    try {
      let photoUrlToSave = profileData.photoUrl;
      
      // If there's a new photo file, upload it to Google Cloud Storage
      if (photoFile) {
        try {
          photoUrlToSave = await uploadProfilePhoto(currentUser.email, photoFile);
          console.log('Photo uploaded successfully:', photoUrlToSave);
          
          // Verify the URL is accessible
          const isValid = await isImageUrlValid(photoUrlToSave);
          if (!isValid) {
            console.warn('Uploaded image URL may not be accessible:', photoUrlToSave);
          }
        } catch (photoError) {
          console.error('Error uploading photo:', photoError);
          // Continue with the local URL if upload fails
        }
      }
      
      // Create updated user object
      const updatedUser = {
        ...currentUser,
        name: profileData.name,
        bio: profileData.bio,
        website: profileData.website,
        location: profileData.location,
        photoUrl: photoUrlToSave
      };
      
      // Save directly using the API
      await saveUserData(updatedUser.email, updatedUser);
      
      // Update local state (in context)
      setCurrentUser(updatedUser);
      
      // Update auth state in localStorage
      const authState = {
        isAuthenticated: true,
        userType: currentUser.userType || 'creator',
        currentUser: updatedUser,
        timestamp: new Date().getTime()
      };
      localStorage.setItem('authState', JSON.stringify(authState));
      
      // Show success message
      setProfileSaved(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setProfileSaved(false);
      }, 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Helper function to check if an image URL is valid
  const isImageUrlValid = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

  return (
    <div className="settings-view">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
      
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
            
            <div className="flex items-center justify-between">
              <Button type="submit" className="save-profile-button" disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
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
      
      <Card className="settings-card">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="password-settings">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" />
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" />
            </div>
            <Button className="password-button">Update Password</Button>
          </div>
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
    </div>
  );
};

export default Settings;