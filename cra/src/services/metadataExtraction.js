// src/services/metadataExtraction.js

/**
 * Metadata extraction service for different content types
 * Extracts available metadata and prepares fields for user completion
 */

import { v4 as uuidv4 } from 'uuid';

// Define metadata requirements by creation type
export const metadataRequirements = {
  Literature: [
    { key: 'creationRightsId', label: 'CreationRights ID', required: true, auto: true },
    { key: 'title', label: 'Title', required: true, auto: false },
    { key: 'author', label: 'Author', required: true, auto: false },
    { key: 'releaseDate', label: 'Release Date', required: true, auto: false },
    { key: 'publisher', label: 'Publisher', required: false, auto: false },
    { key: 'genre', label: 'Genre', required: false, auto: false },
    { key: 'pageCount', label: 'Page Count', required: false, auto: false },
    { key: 'rightsHolders', label: 'Rights Holders', required: true, auto: false }
  ],
  Audio: [
    { key: 'creationRightsId', label: 'CreationRights ID', required: true, auto: true },
    { key: 'title', label: 'Title', required: true, auto: false },
    { key: 'artist', label: 'Artist', required: true, auto: false },
    { key: 'recordingDate', label: 'Recording Date', required: false, auto: false },
    { key: 'releaseDate', label: 'Release Date', required: true, auto: false },
    { key: 'label', label: 'Label', required: false, auto: false },
    { key: 'genre', label: 'Genre', required: false, auto: false },
    { key: 'duration', label: 'Duration', required: false, auto: true },
    { key: 'producer', label: 'Producer', required: false, auto: false },
    { key: 'rightsHolders', label: 'Rights Holders', required: true, auto: false }
  ],
  Photography: [
    { key: 'creationRightsId', label: 'CreationRights ID', required: true, auto: true },
    { key: 'title', label: 'Title', required: true, auto: false },
    { key: 'photographer', label: 'Photographer', required: true, auto: false },
    { key: 'style', label: 'Style', required: false, auto: false },
    { key: 'description', label: 'Description', required: false, auto: false },
    { key: 'createdDate', label: 'Created Date', required: true, auto: false },
    { key: 'collection', label: 'Collection', required: false, auto: false },
    { key: 'dimensions', label: 'Dimensions', required: false, auto: true },
    { key: 'rightsHolders', label: 'Rights Holders', required: true, auto: false }
  ],
  Video: [
    { key: 'creationRightsId', label: 'CreationRights ID', required: true, auto: true },
    { key: 'title', label: 'Title', required: true, auto: false },
    { key: 'creator', label: 'Creator', required: true, auto: false },
    { key: 'recordingDate', label: 'Recording Date', required: false, auto: false },
    { key: 'releaseDate', label: 'Release Date', required: true, auto: false },
    { key: 'studio', label: 'Studio', required: false, auto: false },
    { key: 'genre', label: 'Genre', required: false, auto: false },
    { key: 'duration', label: 'Duration', required: false, auto: true },
    { key: 'rightsHolders', label: 'Rights Holders', required: true, auto: false }
  ],
  // Map general types to specific metadata categories
  Image: 'Photography',
  Music: 'Audio',
  Text: 'Literature',
  Other: 'Literature',
  Software: 'Literature'
};

/**
 * Map general file type to specific metadata category
 * @param {string} generalType - General file type (Image, Music, Video, Text, etc.)
 * @returns {string} Specific metadata category
 */
export const mapTypeToMetadataCategory = (generalType) => {
  if (metadataRequirements[generalType]) {
    if (typeof metadataRequirements[generalType] === 'string') {
      return metadataRequirements[generalType];
    }
    return generalType;
  }
  return 'Literature'; // Default to Literature if unknown
};

/**
 * Generate a new CreationRights ID
 * @returns {string} Unique ID with CR prefix
 */
export const generateCreationRightsId = () => {
  return 'CR-' + uuidv4().substring(0, 8).toUpperCase();
};

/**
 * Extract metadata from file
 * @param {File} file - File object
 * @param {Object} fileInfo - Basic file information
 * @returns {Promise<Object>} Extracted metadata
 */
export const extractMetadata = async (file, fileInfo) => {
  const metadata = {};
  
  // Determine metadata category based on file type
  const metadataCategory = mapTypeToMetadataCategory(fileInfo.type);
  const requirements = metadataRequirements[metadataCategory];
  
  // Generate a CreationRights ID
  metadata.creationRightsId = generateCreationRightsId();
  
  // Set the category
  metadata.category = metadataCategory;
  
  // Use filename as title by default (without extension)
  if (file.name) {
    const nameParts = file.name.split('.');
    nameParts.pop(); // Remove extension
    metadata.title = nameParts.join('.');
  }
  
  // Extract file-type specific metadata
  switch (metadataCategory) {
    case 'Photography':
      if (fileInfo.dimensions) {
        metadata.dimensions = fileInfo.dimensions;
      }
      
      // Try to extract EXIF data if it's a JPEG or TIFF
      if (file.type === 'image/jpeg' || file.type === 'image/tiff') {
        try {
          const exifData = await extractExifData(file);
          if (exifData.dateTime) metadata.createdDate = exifData.dateTime;
          if (exifData.artist) metadata.photographer = exifData.artist;
        } catch (error) {
          console.error('Error extracting EXIF data:', error);
        }
      }
      break;
      
    case 'Audio':
      if (fileInfo.duration) metadata.duration = fileInfo.duration;
      // Try to extract ID3 tags for MP3s
      if (file.type === 'audio/mpeg') {
        try {
          const id3Data = await extractID3Tags(file);
          if (id3Data.title) metadata.title = id3Data.title;
          if (id3Data.artist) metadata.artist = id3Data.artist;
          if (id3Data.album) metadata.album = id3Data.album;
          if (id3Data.year) metadata.releaseDate = id3Data.year;
          if (id3Data.genre) metadata.genre = id3Data.genre;
        } catch (error) {
          console.error('Error extracting ID3 tags:', error);
        }
      }
      break;
      
    case 'Video':
      if (fileInfo.duration) metadata.duration = fileInfo.duration;
      break;
      
    case 'Literature':
      if (fileInfo.pageCount) metadata.pageCount = fileInfo.pageCount;
      break;
  }
  
  return metadata;
};

/**
 * Extract metadata from YouTube video
 * @param {Object} videoData - YouTube video data
 * @returns {Object} Extracted metadata
 */
export const extractYouTubeMetadata = (videoData) => {
  const metadata = {
    category: 'Video',
    creationRightsId: generateCreationRightsId(),
    title: videoData.title || '',
    creator: videoData.channelTitle || '',
    releaseDate: videoData.publishedAt ? new Date(videoData.publishedAt).toISOString().split('T')[0] : '',
    // YouTube doesn't provide duration in the standard API response
    // We could make an additional API call to get video details including duration
    rightsHolders: videoData.channelTitle || '',
    description: videoData.description || '',
    youtubeId: videoData.id || '',
    youtubeUrl: videoData.sourceUrl || ''
  };
  
  return metadata;
};

/**
 * Generate a metadata form schema for a specific content type
 * @param {string} contentType - Type of content
 * @param {Object} initialData - Any initial metadata already extracted
 * @returns {Array} Form fields with labels, types, and initial values
 */
export const generateMetadataFormSchema = (contentType, initialData = {}) => {
  const metadataCategory = mapTypeToMetadataCategory(contentType);
  const requirements = metadataRequirements[metadataCategory];
  
  return requirements.map(field => ({
    ...field,
    value: initialData[field.key] || '',
    type: getInputTypeForField(field.key)
  }));
};

/**
 * Determine the appropriate input type for each metadata field
 * @param {string} fieldKey - Field key
 * @returns {string} Input type (text, date, number, etc.)
 */
function getInputTypeForField(fieldKey) {
  const dateFields = ['releaseDate', 'recordingDate', 'createdDate'];
  const numberFields = ['pageCount', 'duration'];
  
  if (dateFields.includes(fieldKey)) return 'date';
  if (numberFields.includes(fieldKey)) return 'number';
  
  return 'text';
}

/**
 * Extract EXIF data from image file (placeholder implementation)
 * In a production app, use a proper EXIF library
 */
async function extractExifData(file) {
  // This is a placeholder. In a real implementation, you would use
  // a library like 'exif-js' to extract the data
  return { dateTime: '', artist: '' };
}

/**
 * Extract ID3 tags from MP3 file (placeholder implementation)
 * In a production app, use a proper ID3 library
 */
async function extractID3Tags(file) {
  // This is a placeholder. In a real implementation, you would use
  // a library like 'jsmediatags' to extract the data
  return { title: '', artist: '', album: '', year: '', genre: '' };
}