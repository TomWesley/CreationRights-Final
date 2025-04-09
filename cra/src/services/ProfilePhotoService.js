// src/services/ProfilePhotoService.js
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Upload a profile photo to Google Cloud Storage and update Firestore
 * @param {string} userId - The user's unique ID
 * @param {File} file - The image file to upload
 * @returns {Promise<string>} - A promise that resolves to the download URL
 */
export const uploadProfilePhoto = async (userId, file) => {
  try {
    if (!userId || !file) {
      throw new Error('User ID and file are required');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed for profile photos');
    }

    // Use the existing Node.js server endpoint to upload the photo
    const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
    const formData = new FormData();
    formData.append('file', file);
    
    console.log(`Uploading profile photo for user ${userId} to API endpoint`);
    
    const response = await fetch(`${API_URL}/api/users/${userId}/profile-photo`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Upload failed with status ${response.status}`);
    }
    
    const responseData = await response.json();
    
    if (!responseData.success || !responseData.file || !responseData.file.gcsUrl) {
      throw new Error('Upload response missing required data');
    }
    
    console.log('Upload successful, server response:', responseData);
    
    const photoUrl = responseData.file.gcsUrl;
    const photoPath = determinePhotoPath(userId, file.name);
    
    // Update the user's profile in Firestore with the photo URL
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      photoUrl: photoUrl,
      photoPath: photoPath,
      updatedAt: new Date().toISOString()
    });
    
    return photoUrl;
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    throw error;
  }
};

/**
 * Determine the photo path from user ID and file name
 * To match the server's expected path format
 * @param {string} userId - User ID
 * @param {string} fileName - Original file name
 * @returns {string} - Storage path
 */
const determinePhotoPath = (userId, fileName) => {
  const extension = fileName.split('.').pop();
  return `users/${userId}/profile/photo.${extension}`;
};

/**
 * Delete a user's profile photo
 * @param {string} userId - The user's unique ID
 * @param {string} photoPath - The storage path to the photo
 * @returns {Promise<void>}
 */
export const deleteProfilePhoto = async (userId, photoPath) => {
  try {
    if (!userId || !photoPath) {
      throw new Error('User ID and photo path are required');
    }
    
    // Call server endpoint to delete the photo
    // Note: You may need to implement this endpoint on your server
    const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
    const response = await fetch(`${API_URL}/api/users/${userId}/profile-photo`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Deletion failed with status ${response.status}`);
    }
    
    // Update the user's profile in Firestore
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      photoUrl: null,
      photoPath: null,
      updatedAt: new Date().toISOString()
    });
    
    console.log(`Profile photo deleted for user ${userId}`);
  } catch (error) {
    console.error('Error deleting profile photo:', error);
    throw error;
  }
};

/**
 * Get a random avatar URL for users without a photo
 * @param {string} name - User's name or email to generate a consistent avatar
 * @returns {string} - The URL for a default avatar
 */
export const getDefaultAvatarUrl = (name = '') => {
  // Generate a hash from the name to get a consistent avatar
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Use the hash to get a specific avatar or color
  const avatarId = Math.abs(hash % 10); // 0-9 for 10 different default avatars
  
  // Return a URL to a default avatar image
  // You can replace this with any avatar generation service or your own default images
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=128&background=random&length=2`;
};