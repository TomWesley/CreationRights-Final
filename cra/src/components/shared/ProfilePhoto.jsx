// src/components/shared/ProfilePhoto.jsx
import React, { useState, useEffect } from 'react';
import { getDefaultAvatarUrl, getProfilePhotoProxyUrl } from '../../services/ProfilePhotoService';

/**
 * Component to display a user's profile photo or default avatar
 * @param {Object} props
 * @param {string} props.email - User's email (for default avatar generation)
 * @param {string} props.name - User's name (for default avatar generation)
 * @param {string} props.photoUrl - URL to the user's profile photo (optional)
 * @param {string} props.userId - User's ID (optional, used if photoUrl not provided)
 * @param {string} props.size - Size of the photo: "xs", "sm", "md", "lg", "xl" (default: "md")
 * @param {boolean} props.clickable - Whether the photo should have a clickable style
 * @param {function} props.onClick - Click handler for the photo
 */
const ProfilePhoto = ({ 
  email, 
  name, 
  photoUrl, 
  userId,
  size = "md", 
  clickable = false,
  onClick
}) => {
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState(false);
  
  // Determine size class based on the size prop
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };
  
  // Set the image URL on mount and when props change
  useEffect(() => {
    setError(false);
    
    // Add a cache-busting query parameter to prevent stale images
    const cacheBuster = `?t=${Date.now()}`;
    
    if (photoUrl) {
      // Use the provided photo URL if available
      console.log(`Using provided photoUrl: ${photoUrl}`);
      
      // Add cache buster only if it's not already a URL with query params
      setImageUrl(photoUrl + (photoUrl.includes('?') ? '&cb=' : '?cb=') + Date.now());
    } else if (userId) {
      // If we have a userId but no photoUrl, use the proxy endpoint
      console.log(`Using proxy URL for userId: ${userId}`);
      setImageUrl(getProfilePhotoProxyUrl(userId) + cacheBuster);
    } else if (email) {
      // Try to extract userId from email
      // This assumes userId is derived from email in your system
      const extractedUserId = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
      
      if (extractedUserId) {
        console.log(`Using proxy URL for extracted userId: ${extractedUserId}`);
        setImageUrl(getProfilePhotoProxyUrl(extractedUserId) + cacheBuster);
      } else {
        // Fall back to default avatar
        console.log(`Using default avatar for email: ${email}`);
        setImageUrl(getDefaultAvatarUrl(name || email));
      }
    } else {
      // Generate a default avatar URL based on the user's name
      const identifier = name || '';
      console.log(`Using default avatar for name: ${identifier}`);
      setImageUrl(getDefaultAvatarUrl(identifier));
    }
  }, [photoUrl, name, email, userId]);
  
  // Handle image loading errors
  const handleError = () => {
    console.log(`Error loading image from: ${imageUrl}`);
    setError(true);
    // Fall back to default avatar
    const identifier = name || email || '';
    setImageUrl(getDefaultAvatarUrl(identifier));
  };
  
  // Generate initials for fallback display
  const getInitials = () => {
    if (name) {
      // Extract initials from name
      const nameParts = name.split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      } else if (name.length > 0) {
        return name[0].toUpperCase();
      }
    } else if (email) {
      // Use first letter of email
      return email[0].toUpperCase();
    }
    return '?';
  };
  
  return (
    <div 
      className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-gray-700 ${clickable ? 'cursor-pointer hover:opacity-80' : ''}`}
      onClick={onClick}
    >
      {imageUrl && !error ? (
        <img 
          src={imageUrl} 
          alt={`${name || email || 'User'}'s profile`}
          className="w-full h-full object-cover"
          onError={handleError}
        />
      ) : (
        <span className="font-bold text-sm">{getInitials()}</span>
      )}
    </div>
  );
};

export default ProfilePhoto;