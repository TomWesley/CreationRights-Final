// Improve the ProfilePhotoUpload.jsx component
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '../ui/button';
import { getProxiedImageUrl } from '../../services/fileUpload';
import { useAppContext } from '../../contexts/AppContext';

const ProfilePhotoUpload = ({ currentPhoto, onPhotoChange }) => {
  const { currentUser } = useAppContext();
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  
  // Initialize preview when component mounts or currentPhoto changes
  useEffect(() => {
    if (currentPhoto) {
      // Use proxied URL for GCS images
      const proxiedUrl = currentUser && currentUser.email ? 
        getProxiedImageUrl(currentPhoto, currentUser.email) : currentPhoto;
      setPreviewUrl(proxiedUrl);
    }
    
    // Cleanup function to avoid memory leaks
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [currentPhoto, currentUser]);

  // Handle file selection via button
  const handleFileSelect = () => {
    fileInputRef.current.click();
  };

  // Handle file upload
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Handle file processing
  const handleFile = (file) => {
    // Check if it's an image file
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, etc.)');
      return;
    }
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    
    // If there was a previous preview, revoke it to prevent memory leaks
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setPreviewUrl(url);
    
    // Call the callback with the new file
    onPhotoChange(file, url);
    
    console.log('Photo selected:', { file, url });
  };

  // Handle removing the photo
  const handleRemovePhoto = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setPreviewUrl(null);
    onPhotoChange(null, null);
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="profile-photo-upload">
      {!previewUrl ? (
        <div 
          className={`w-40 h-40 rounded-full border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
            isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={handleFileSelect}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Camera className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">Add Photo</p>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>
      ) : (
        <div className="relative">
          <img 
            src={previewUrl} 
            alt="Profile" 
            className="w-40 h-40 rounded-full object-cover border border-gray-200"
            onError={(e) => {
              console.error("Profile image failed to load:", previewUrl);
              // If the image fails to load, show a placeholder
              e.target.style.display = 'none';
              const parent = e.target.parentElement;
              const placeholder = document.createElement('div');
              placeholder.className = "w-40 h-40 rounded-full bg-gray-200 flex items-center justify-center";
              placeholder.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-8 w-8 text-gray-400"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
              parent.appendChild(placeholder);
            }}
          />
          <button 
            type="button"
            className="absolute bottom-0 right-0 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
            onClick={handleRemovePhoto}
          >
            <X className="h-4 w-4" />
          </button>
          <button 
            type="button"
            className="absolute bottom-0 left-0 bg-blue-500 text-white p-1 rounded-full hover:bg-blue-600 transition-colors"
            onClick={handleFileSelect}
          >
            <Camera className="h-4 w-4" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>
      )}
      <p className="text-xs text-gray-500 mt-2 text-center">
        Click or drag & drop to upload
      </p>
    </div>
  );
};

export default ProfilePhotoUpload;