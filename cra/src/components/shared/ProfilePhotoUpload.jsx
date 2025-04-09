// src/components/shared/ProfilePhotoUpload.jsx
import React, { useState, useRef } from 'react';
import { Camera, X, Upload, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import ProfilePhoto from './ProfilePhoto';
import { uploadProfilePhoto, deleteProfilePhoto } from '../../services/ProfilePhotoService';
import { useAppContext } from '../../contexts/AppContext';

/**
 * Component for uploading and managing a user's profile photo
 * @param {Object} props
 * @param {string} props.currentPhoto - Current photo URL
 * @param {function} props.onPhotoChange - Callback when photo changes
 * @param {string} props.photoPath - Storage path for current photo (for deletion)
 */
const ProfilePhotoUpload = ({ currentPhoto, onPhotoChange, photoPath }) => {
  const { currentUser } = useAppContext();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentPhoto || '');
  const fileInputRef = useRef(null);
  
  // Handle file selection
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, etc.)');
      return;
    }
    
    // Display preview immediately for better UX
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    // Start upload if we have a user
    if (currentUser?.uid) {
      try {
        setIsUploading(true);
        
        // Upload to Google Cloud Storage via our backend API
        const photoUrl = await uploadProfilePhoto(currentUser.uid, file);
        
        // Call the callback with the new URL
        if (onPhotoChange) {
          onPhotoChange(file, photoUrl);
        }
        
        // Clean up object URL
        URL.revokeObjectURL(objectUrl);
        
        // Update preview to real URL
        setPreviewUrl(photoUrl);
      } catch (error) {
        console.error('Error uploading photo:', error);
        alert('Failed to upload photo. Please try again. Error: ' + error.message);
        
        // Revert to previous photo on error
        setPreviewUrl(currentPhoto || '');
      } finally {
        setIsUploading(false);
      }
    }
  };
  
  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };
  
  // Handle photo deletion
  const handleDeletePhoto = async () => {
    if (!currentUser?.uid || !photoPath) return;
    
    if (window.confirm('Are you sure you want to remove your profile photo?')) {
      try {
        setIsDeleting(true);
        
        // Delete from storage
        await deleteProfilePhoto(currentUser.uid, photoPath);
        
        // Clear preview
        setPreviewUrl('');
        
        // Call the callback
        if (onPhotoChange) {
          onPhotoChange(null, null);
        }
      } catch (error) {
        console.error('Error deleting photo:', error);
        alert('Failed to delete photo. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* Profile photo display */}
        <ProfilePhoto 
          email={currentUser?.email}
          name={currentUser?.name}
          photoUrl={previewUrl}
          size="xl"
        />
        
        {/* Overlay buttons for actions */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-40 rounded-full">
          {isUploading || isDeleting ? (
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          ) : (
            <>
              <Button 
                size="sm" 
                variant="ghost" 
                className="rounded-full p-1 bg-white bg-opacity-80 hover:bg-opacity-100"
                onClick={handleUploadClick}
              >
                <Camera className="h-4 w-4 text-gray-700" />
              </Button>
              
              {previewUrl && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="rounded-full p-1 bg-white bg-opacity-80 hover:bg-opacity-100 ml-2"
                  onClick={handleDeletePhoto}
                >
                  <X className="h-4 w-4 text-gray-700" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Label below photo */}
      <p className="text-xs text-gray-500 mt-2">
        {previewUrl ? 'Change photo' : 'Add profile photo'}
      </p>
      
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*" 
        className="hidden" 
        onChange={handleFileChange}
      />
      
      {/* Explicit upload button (alternative to overlay) */}
      <Button 
        variant="outline" 
        size="sm" 
        className="mt-3"
        onClick={handleUploadClick}
        disabled={isUploading || isDeleting}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Upload Photo
          </>
        )}
      </Button>
    </div>
  );
};

export default ProfilePhotoUpload;