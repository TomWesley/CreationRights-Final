// src/services/metadataExtraction.js

/**
 * Generate a unique Creation Rights ID
 * Format: CR-TIMESTAMP-RANDOM
 * @returns {string} A unique Creation Rights ID
 */
export const generateCreationRightsId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `CR-${timestamp}-${random}`;
};

/**
 * Map creation type to metadata category
 * @param {string} type - The creation type (e.g., 'Image', 'Text', etc.)
 * @returns {string} The corresponding metadata category
 */
export const mapTypeToMetadataCategory = (type) => {
  if (!type) return 'Unknown';
  
  const typeLower = type.toLowerCase();
  
  switch (typeLower) {
    case 'image':
    case 'photography':
      return 'Photography';
    case 'text':
    case 'literature':
    case 'writing':
      return 'Literature';
    case 'music':
    case 'audio':
    case 'sound':
      return 'Audio';
    case 'video':
    case 'film':
      return 'Video';
    case 'software':
    case 'code':
      return 'Software';
    default:
      return 'Other';
  }
};

/**
 * Extract metadata fields based on file type
 * @param {File} file - The uploaded file
 * @returns {Object} Extracted metadata
 */
export const extractMetadataFromFile = async (file) => {
  if (!file) return {};
  
  const metadata = {
    creationRightsId: generateCreationRightsId(),
    fileSize: file.size,
    fileName: file.name,
    fileType: file.type
  };
  
  // Determine category based on file mimetype
  if (file.type.startsWith('image/')) {
    metadata.category = 'Photography';
    
    // For images, we could potentially extract EXIF data here
    // This would require additional libraries
    
  } else if (file.type.startsWith('audio/')) {
    metadata.category = 'Audio';
    
    // For audio files, we could extract ID3 tags or other metadata
    
  } else if (file.type.startsWith('video/')) {
    metadata.category = 'Video';
    
  } else if (file.type.includes('pdf') || 
            file.type.includes('word') || 
            file.type.includes('text')) {
    metadata.category = 'Literature';
  }
  
  return metadata;
};

/**
 * Generate default metadata structure based on category
 * @param {string} category - The metadata category
 * @returns {Object} Default metadata structure
 */
export const getDefaultMetadataStructure = (category) => {
  const creationRightsId = generateCreationRightsId();
  
  switch (category) {
    case 'Photography':
      return {
        category: 'Photography',
        creationRightsId,
        photographer: '',
        createdDate: new Date().toISOString().split('T')[0],
        style: '',
        dimensions: '',
        collection: '',
        location: '',
        equipment: '',
        rightsHolders: ''
      };
      
    case 'Audio':
      return {
        category: 'Audio',
        creationRightsId,
        artist: '',
        releaseDate: '',
        recordingDate: '',
        duration: '',
        label: '',
        genre: '',
        producer: '',
        rightsHolders: ''
      };
      
    case 'Literature':
      return {
        category: 'Literature',
        creationRightsId,
        author: '',
        publisher: '',
        releaseDate: '',
        genre: '',
        language: '',
        pageCount: '',
        rightsHolders: ''
      };
      
    case 'Video':
      return {
        category: 'Video',
        creationRightsId,
        creator: '',
        releaseDate: '',
        recordingDate: '',
        duration: '',
        studio: '',
        genre: '',
        rightsHolders: ''
      };
      
    default:
      return {
        category: category || 'Other',
        creationRightsId,
        creator: '',
        createdDate: new Date().toISOString().split('T')[0],
        rightsHolders: ''
      };
  }
};