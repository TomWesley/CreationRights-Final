// src/components/shared/ProfilePhoto.jsx

import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { getDirectProfilePhotoUrl } from '../../services/api';

/**
 * Reusable component for displaying user profile photos
 * @param {Object} props
 * @param {string} props.email - User's email for fetching the photo
 * @param {string} props.name - User's name for alt text
 * @param {string} props.size - Size of the photo ('sm', 'md', 'lg')
 * @param {boolean} props.clickable - Whether the photo is clickable
 * @param {function} props.onClick - Click handler function
 */
const ProfilePhoto = ({ 
  email, 
  name, 
  size = 'md', 
  clickable = false, 
  onClick = null 
}) => {
  const [photoError, setPhotoError] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(null);
  
  // Size classes
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
    xl: 'w-32 h-32'
  };
  
  // Icon sizes
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-10 w-10',
    xl: 'h-16 w-16'
  };
  
  const sizeClass = sizes[size] || sizes.md;
  const iconSize = iconSizes[size] || iconSizes.md;
  
  // Set up profile photo
  useEffect(() => {
    if (email) {
      // Use the direct photo endpoint
      const directUrl = getDirectProfilePhotoUrl(email);
      setPhotoUrl(directUrl);
      setPhotoError(false);
    } else {
      setPhotoUrl(null);
    }
  }, [email]);
  
  const containerClasses = `
    ${sizeClass} 
    rounded-full 
    bg-gray-200 
    overflow-hidden 
    flex-shrink-0
    ${clickable ? 'cursor-pointer hover:opacity-90' : ''}
    border border-gray-200
  `;
  
  return (
    <div 
      className={containerClasses}
      onClick={clickable && onClick ? onClick : undefined}
    >
      {photoUrl && !photoError ? (
        <img 
          src={photoUrl} 
          alt={name || 'User'}
          className="w-full h-full object-cover"
          onError={() => setPhotoError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <User className={`${iconSize} text-gray-500`} />
        </div>
      )}
    </div>
  );
};

export default ProfilePhoto;