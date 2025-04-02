// Updated Settings.jsx with enhanced profile fields and data loading fixes
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { User, Save, Check, Loader2, X, Plus } from 'lucide-react';
import ProfilePhotoUpload from '../shared/ProfilePhotoUpload';
import { useAppContext } from '../../contexts/AppContext';
import { uploadProfilePhoto, saveUserData, loadUserData } from '../../services/api';
import { getProxiedImageUrl } from '../../services/fileUpload';

const Settings = () => {
  const { currentUser, setCurrentUser } = useAppContext();
  const [profileSaved, setProfileSaved] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start with loading state
  const [error, setError] = useState(null);
  
  // Initialize with empty data
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    bio: '',
    website: '',
    location: '',
    photoUrl: null,
    specialties: [],
    contentTypes: [],
    status: 'active',
    socialLinks: {},
    education: [],
    exhibitions: [],
    awards: []
  });
  
  const [photoFile, setPhotoFile] = useState(null);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newContentType, setNewContentType] = useState('');
  const [newEducation, setNewEducation] = useState({ institution: '', degree: '', year: '' });
  const [newExhibition, setNewExhibition] = useState({ title: '', venue: '', year: '' });
  const [newAward, setNewAward] = useState({ title: '', year: '', issuer: '' });

  // Content type options
  const contentTypeOptions = ['Photography', 'Illustration', 'Video', 'Audio', 'Mixed Media', 'Text', 'Digital Art', '3D', 'Animation'];
  
  // Specialty options - grouped by content type
  const specialtyOptions = {
    Photography: ['Portrait', 'Landscape', 'Product', 'Fashion', 'Event', 'Documentary', 'Street', 'Wildlife', 'Architectural'],
    Illustration: ['Character Design', 'Concept Art', 'Editorial', 'Book', 'Comic', 'Fantasy', 'Fashion'],
    Video: ['Short Film', 'Music Video', 'Documentary', 'Commercial', 'Experimental', 'Animation'],
    Audio: ['Music Production', 'Sound Design', 'Podcasting', 'Voice Over', 'Composition'],
    'Mixed Media': ['Collage', 'Installation', 'Performance', 'Interactive'],
    Text: ['Copywriting', 'Journalism', 'Creative Writing', 'Poetry', 'Script Writing'],
    'Digital Art': ['UI/UX', 'NFT', 'Generative Art', 'Graphic Design', 'Motion Graphics'],
    '3D': ['Modeling', 'Texturing', 'Animation', 'Rendering', 'Game Assets'],
    Animation: ['2D Animation', '3D Animation', 'Motion Graphics', 'Stop Motion', 'Character Animation']
  };

  // Load user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser?.email) {
        console.error("No user email available in context");
        setIsLoading(false);
        return;
      }
      
      try {
        console.log(`Fetching user data for ${currentUser.email}...`);
        // Use the loadUserData function from api.js instead of direct fetch
        const userData = await loadUserData(currentUser.email);
        
        if (!userData) {
          throw new Error('Failed to load user data or user data not found');
        }
        
        console.log("User data loaded:", userData);
        
        // Update profile data state
        setProfileData({
          name: userData?.name || '',
          email: userData?.email || '',
          bio: userData?.bio || '',
          website: userData?.website || '',
          location: userData?.location || '',
          photoUrl: userData?.photoUrl || null,
          specialties: userData?.specialties || [],
          contentTypes: userData?.contentTypes || [],
          status: userData?.status || 'active',
          socialLinks: userData?.socialLinks || {},
          education: userData?.education || [],
          exhibitions: userData?.exhibitions || [],
          awards: userData?.awards || []
        });
        
        // Update global context if needed
        if (JSON.stringify(userData) !== JSON.stringify(currentUser)) {
          setCurrentUser(userData);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [currentUser?.email, setCurrentUser]);

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

  // Handle adding a specialty
  const handleAddSpecialty = () => {
    if (newSpecialty && !profileData.specialties.includes(newSpecialty)) {
      setProfileData(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty]
      }));
      setNewSpecialty('');
    }
  };

  // Handle removing a specialty
  const handleRemoveSpecialty = (specialty) => {
    setProfileData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }));
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

  // Handle adding education
  const handleAddEducation = () => {
    if (newEducation.institution && newEducation.degree) {
      setProfileData(prev => ({
        ...prev,
        education: [...prev.education, newEducation]
      }));
      setNewEducation({ institution: '', degree: '', year: '' });
    }
  };

  // Handle removing education
  const handleRemoveEducation = (index) => {
    setProfileData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  // Handle adding exhibition
  const handleAddExhibition = () => {
    if (newExhibition.title && newExhibition.venue) {
      setProfileData(prev => ({
        ...prev,
        exhibitions: [...prev.exhibitions, newExhibition]
      }));
      setNewExhibition({ title: '', venue: '', year: '' });
    }
  };

  // Handle removing exhibition
  const handleRemoveExhibition = (index) => {
    setProfileData(prev => ({
      ...prev,
      exhibitions: prev.exhibitions.filter((_, i) => i !== index)
    }));
  };

  // Handle adding award
  const handleAddAward = () => {
    if (newAward.title) {
      setProfileData(prev => ({
        ...prev,
        awards: [...prev.awards, newAward]
      }));
      setNewAward({ title: '', year: '', issuer: '' });
    }
  };

  // Handle removing award
  const handleRemoveAward = (index) => {
    setProfileData(prev => ({
      ...prev,
      awards: prev.awards.filter((_, i) => i !== index)
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsLoading(true);
    setIsUploading(true);
    
    try {
      let photoUrlToSave = profileData.photoUrl;
      
      // If there's a new photo file, upload it
      if (photoFile) {
        try {
          console.log("Uploading profile photo...");
          photoUrlToSave = await uploadProfilePhoto(currentUser.email, photoFile);
          console.log('Photo uploaded successfully:', photoUrlToSave);
        } catch (photoError) {
          console.error('Error uploading photo:', photoError);
          // Continue with the local URL if upload fails
        }
      }
      
      // Create updated user object with the new photo URL
      const updatedUser = {
        ...profileData,  // Use profileData as the base (it has all the form data)
        email: currentUser.email,  // Ensure email is set correctly
        photoUrl: photoUrlToSave,
        // Add any other data from currentUser that isn't in profileData but should be preserved
        userType: currentUser.userType || 'creator',
        createdAt: currentUser.createdAt || new Date().toISOString()
      };
      
      console.log("Saving user data:", updatedUser);
      
      // Save using the saveUserData function from api.js
      const saved = await saveUserData(updatedUser.email, updatedUser);
      
      if (!saved) {
        throw new Error('Failed to save user data');
      }
      
      // Update local state (in context)
      setCurrentUser(updatedUser);
      
      // Update auth state in localStorage
      const authState = {
        isAuthenticated: true,
        userType: updatedUser.userType || 'creator',
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
      alert('Failed to update profile. Please try again. Error: ' + error.message);
    } finally {
      setIsLoading(false);
      setIsUploading(false);
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
                
                {/* Specialties Section */}
                <div className="border p-4 rounded-md">
                  <Label className="text-lg font-medium mb-2 block">Specialties</Label>
                  <p className="text-sm text-gray-500 mb-3">Add your specific skills and specialties</p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {profileData.specialties.map((specialty, index) => (
                      <div key={index} className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full flex items-center">
                        <span>{specialty}</span>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveSpecialty(specialty)}
                          className="ml-1 text-purple-600 hover:text-purple-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <select
                      value={newSpecialty}
                      onChange={(e) => setNewSpecialty(e.target.value)}
                      className="flex-grow rounded-md border border-gray-300 p-2"
                    >
                      <option value="">Select a specialty</option>
                      {profileData.contentTypes.length > 0 ? (
                        profileData.contentTypes.map(contentType => (
                          <optgroup key={contentType} label={contentType}>
                            {specialtyOptions[contentType]?.map(specialty => (
                              <option key={specialty} value={specialty}>{specialty}</option>
                            ))}
                          </optgroup>
                        ))
                      ) : (
                        <option value="" disabled>Please select content types first</option>
                      )}
                    </select>
                    <Button 
                      type="button" 
                      onClick={handleAddSpecialty}
                      disabled={!newSpecialty}
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

                {/* Education Section */}
                <div className="border p-4 rounded-md">
                  <Label className="text-lg font-medium mb-2 block">Education</Label>
                  <p className="text-sm text-gray-500 mb-3">Add your educational background</p>
                  
                  {profileData.education.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {profileData.education.map((edu, index) => (
                        <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
                          <div>
                            <p className="font-medium">{edu.institution}</p>
                            <p className="text-sm text-gray-600">{edu.degree} {edu.year ? `(${edu.year})` : ''}</p>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveEducation(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-1">
                      <Input 
                        placeholder="Institution"
                        value={newEducation.institution}
                        onChange={(e) => setNewEducation({...newEducation, institution: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-1">
                      <Input 
                        placeholder="Degree/Field of Study"
                        value={newEducation.degree}
                        onChange={(e) => setNewEducation({...newEducation, degree: e.target.value})}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Year"
                        value={newEducation.year}
                        onChange={(e) => setNewEducation({...newEducation, year: e.target.value})}
                      />
                      <Button 
                        type="button" 
                        onClick={handleAddEducation}
                        disabled={!newEducation.institution || !newEducation.degree}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Exhibitions/Shows Section */}
                <div className="border p-4 rounded-md">
                  <Label className="text-lg font-medium mb-2 block">Exhibitions & Shows</Label>
                  <p className="text-sm text-gray-500 mb-3">Add your past exhibitions, shows or featured work</p>
                  
                  {profileData.exhibitions.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {profileData.exhibitions.map((exhibition, index) => (
                        <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
                          <div>
                            <p className="font-medium">{exhibition.title}</p>
                            <p className="text-sm text-gray-600">{exhibition.venue} {exhibition.year ? `(${exhibition.year})` : ''}</p>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveExhibition(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-1">
                      <Input 
                        placeholder="Exhibition/Show Title"
                        value={newExhibition.title}
                        onChange={(e) => setNewExhibition({...newExhibition, title: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-1">
                      <Input 
                        placeholder="Venue/Gallery"
                        value={newExhibition.venue}
                        onChange={(e) => setNewExhibition({...newExhibition, venue: e.target.value})}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Year"
                        value={newExhibition.year}
                        onChange={(e) => setNewExhibition({...newExhibition, year: e.target.value})}
                      />
                      <Button 
                        type="button" 
                        onClick={handleAddExhibition}
                        disabled={!newExhibition.title || !newExhibition.venue}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Awards Section */}
                <div className="border p-4 rounded-md">
                  <Label className="text-lg font-medium mb-2 block">Awards & Recognition</Label>
                  <p className="text-sm text-gray-500 mb-3">Add awards, grants or other recognition you've received</p>
                  
                  {profileData.awards.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {profileData.awards.map((award, index) => (
                        <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
                          <div>
                            <p className="font-medium">{award.title}</p>
                            <p className="text-sm text-gray-600">{award.issuer} {award.year ? `(${award.year})` : ''}</p>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveAward(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-1">
                      <Input 
                        placeholder="Award/Recognition Title"
                        value={newAward.title}
                        onChange={(e) => setNewAward({...newAward, title: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-1">
                      <Input 
                        placeholder="Issuing Organization"
                        value={newAward.issuer}
                        onChange={(e) => setNewAward({...newAward, issuer: e.target.value})}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Year"
                        value={newAward.year}
                        onChange={(e) => setNewAward({...newAward, year: e.target.value})}
                      />
                      <Button 
                        type="button" 
                        onClick={handleAddAward}
                        disabled={!newAward.title}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Button type="submit" className="save-profile-button" disabled={isUploading || isLoading}>
                    {isUploading ? (
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