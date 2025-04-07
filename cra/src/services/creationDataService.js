// src/services/creationDataService.js
import mockCreations from '../data/mockCreations';

/**
 * Service for managing creation data
 */

/**
 * Get all creations without filtering by user
 * @returns {Array} Array of all creations
 */
export const getAllCreations = () => {
  // Return the mock data for now
  return mockCreations;
};

/**
 * Get published creations (for public/agency view)
 * @returns {Array} Array of published creations
 */
export const getPublishedCreations = () => {
  return mockCreations.filter(creation => creation.status === 'published');
};

/**
 * Get creations for a specific user
 * @param {string} userEmail - User's email
 * @returns {Array} Array of creations for the user
 */
export const getUserCreations = (userEmail) => {
  // For now, return all mockCreations as if they belong to the current user
  // This can be modified later when the backend is working
  return mockCreations;
};

/**
 * Get creation by ID
 * @param {string} creationId - Creation ID
 * @returns {Object|null} Creation object or null if not found
 */
export const getCreationById = (creationId) => {
  return mockCreations.find(creation => creation.id === creationId) || null;
};

/**
 * Filter creations by type
 * @param {Array} creations - Array of creations
 * @param {string} type - Type to filter by
 * @returns {Array} Filtered creations
 */
export const filterCreationsByType = (creations, type) => {
  if (!type || type === 'all') {
    return creations;
  }
  return creations.filter(creation => 
    creation.type.toLowerCase() === type.toLowerCase()
  );
};

/**
 * Search creations by query
 * @param {Array} creations - Array of creations
 * @param {string} query - Search query
 * @returns {Array} Filtered creations
 */
export const searchCreations = (creations, query) => {
  if (!query) {
    return creations;
  }
  
  const lowercaseQuery = query.toLowerCase();
  return creations.filter(creation => 
    (creation.title && creation.title.toLowerCase().includes(lowercaseQuery)) ||
    (creation.notes && creation.notes.toLowerCase().includes(lowercaseQuery)) ||
    (creation.rights && creation.rights.toLowerCase().includes(lowercaseQuery)) ||
    (creation.tags && creation.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)))
  );
};

/**
 * Format price for display
 * @param {string|number} price - Price to format
 * @returns {string} Formatted price
 */
export const formatPrice = (price) => {
  if (!price) return '';
  
  // Convert to number if it's a string
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  // Format with 2 decimal places and thousands separator
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numPrice);
};

/**
 * Get appropriate icon name for a creation type
 * @param {string} type - Creation type
 * @returns {string} Icon name
 */
export const getCreationTypeIcon = (type) => {
  const lowerType = (type || '').toLowerCase();
  
  switch (lowerType) {
    case 'image':
    case 'photography':
      return 'image';
    case 'music':
    case 'audio':
      return 'music';
    case 'video':
      return 'video';
    case 'text':
    case 'literature':
      return 'file-text';
    case 'software':
      return 'code';
    default:
      return 'file';
  }
};

/**
 * Get appropriate color for a creation type
 * @param {string} type - Creation type
 * @returns {string} Color class
 */
export const getCreationTypeColor = (type) => {
  const lowerType = (type || '').toLowerCase();
  
  switch (lowerType) {
    case 'image':
    case 'photography':
      return 'text-blue-500';
    case 'music':
    case 'audio':
      return 'text-purple-500';
    case 'video':
      return 'text-red-500';
    case 'text':
    case 'literature':
      return 'text-green-500';
    case 'software':
      return 'text-gray-500';
    default:
      return 'text-gray-500';
  }
};

export default {
  getAllCreations,
  getPublishedCreations,
  getUserCreations,
  getCreationById,
  filterCreationsByType,
  searchCreations,
  formatPrice,
  getCreationTypeIcon,
  getCreationTypeColor
};