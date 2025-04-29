// server/routes/uploadHandler.js

const express = require('express');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs');

// Create router
const router = express.Router();

// Configuration
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'creation-rights-app';

// Initialize Google Cloud Storage
let storage;
try {
  storage = new Storage({
    keyFilename: process.env.GCS_KEY_FILE || path.join(__dirname, '../key.json')
  });
} catch (error) {
  console.error('Failed to initialize Google Cloud Storage:', error);
}

// Configure multer for file uploads
const multerStorage = multer.memoryStorage(); // Use memory storage

// File filter for allowed file types
const fileFilter = (req, file, cb) => {
  // Allow these file types
  const allowedTypes = [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    // Documents
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'text/markdown',
    // Audio
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/x-m4a',
    // Video
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, documents, audio, and video files are allowed.'), false);
  }
};

const upload = multer({ 
    storage: multerStorage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 2000 * 1024 * 1024 // Increase to 100MB (from 50MB)
    }
  });

// Add this to server/routes/uploadHandler.js

/**
 * Process video thumbnail from upload request
 * @param {Object} req - Express request object
 * @param {Object} file - Uploaded file object
 * @param {string} userId - User ID
 * @param {string} creationRightsId - Creation Rights ID
 * @returns {Promise<string|null>} - Thumbnail URL or null if not available
 */
const processVideoThumbnail = async (req, file, userId, creationRightsId) => {
    // Check if there's a thumbnail in the request
    if (req.body.thumbnail) {
      try {
        console.log('Client provided thumbnail found, processing...');
        
        // The thumbnail will be a data URL, convert it to a buffer
        const base64Data = req.body.thumbnail.replace(/^data:image\/jpeg;base64,/, '');
        const thumbnailBuffer = Buffer.from(base64Data, 'base64');
        
        // Save the thumbnail to GCS
        const bucket = storage.bucket(BUCKET_NAME);
        const thumbnailPath = `Creations/${userId}/${creationRightsId}/thumbnail.jpg`;
        
        await bucket.file(thumbnailPath).save(thumbnailBuffer, {
          contentType: 'image/jpeg',
          metadata: {
            contentType: 'image/jpeg',
            cacheControl: 'public, max-age=86400'
          }
        });
        
        console.log(`Saved video thumbnail to ${thumbnailPath}`);
        
        // Return the thumbnail URL
        return `https://storage.googleapis.com/${BUCKET_NAME}/${thumbnailPath}`;
      } catch (error) {
        console.error('Error processing video thumbnail:', error);
        return null;
      }
    }
    
    // If no thumbnail in request, use a placeholder
    console.log('No client thumbnail found, using placeholder');
    const placeholderPath = path.join(__dirname, '../public/video-placeholder.jpg');
    
    if (fs.existsSync(placeholderPath)) {
      try {
        const thumbnailBuffer = fs.readFileSync(placeholderPath);
        const thumbnailPath = `Creations/${userId}/${creationRightsId}/thumbnail.jpg`;
        const bucket = storage.bucket(BUCKET_NAME);
        
        await bucket.file(thumbnailPath).save(thumbnailBuffer, {
          contentType: 'image/jpeg',
          metadata: {
            contentType: 'image/jpeg',
            cacheControl: 'public, max-age=86400'
          }
        });
        
        console.log(`Saved placeholder thumbnail to ${thumbnailPath}`);
        return `https://storage.googleapis.com/${BUCKET_NAME}/${thumbnailPath}`;
      } catch (error) {
        console.error('Error saving placeholder thumbnail:', error);
        return null;
      }
    }
    
    return null;
  };

// File upload endpoint
router.post('/:userId/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      const userId = req.params.userId;
      const file = req.file; // This is now in memory, not on disk
      const contentType = file.mimetype;
      
      console.log(`Processing upload for user: ${userId}`);
      console.log(`File details: name=${file.originalname}, size=${file.size}, type=${contentType}`);
      
      // Get creationRightsId from form data (or generate a new one)
      const creationRightsId = req.body.creationRightsId || `CR-${Date.now()}`;
      console.log(`Using creationRightsId: ${creationRightsId}`);
  
      // Create file info object
      const fileInfo = {
        originalName: file.originalname,
        filename: file.originalname, // Use original name since we don't have a disk filename
        mimetype: contentType,
        size: file.size,
        creationRightsId: creationRightsId
      };
      
      // Upload the file to Google Cloud Storage
      try {
        const bucket = storage.bucket(BUCKET_NAME);
        const gcsFilePath = `Creations/${userId}/${creationRightsId}/file`;
        console.log(`Uploading file to: ${gcsFilePath}`);
        
        const gcsFile = bucket.file(gcsFilePath);
        
        // Create a writable stream to GCS
        await gcsFile.save(file.buffer, {
          contentType: contentType,
          metadata: {
            contentType: contentType,
            cacheControl: 'no-cache, max-age=0'
          }
        });
        
        // After successful upload, generate the public URL
        const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${gcsFilePath}`;
        fileInfo.gcsUrl = publicUrl;
        fileInfo.url = publicUrl;
        console.log(`File uploaded successfully: ${publicUrl}`);
        
        // Process video thumbnail if this is a video
        if (contentType.startsWith('video/')) {
          console.log('Processing video thumbnail...');
          
          // Use the processVideoThumbnail helper function
          const thumbnailUrl = await processVideoThumbnail(req, file, userId, creationRightsId);
          
          if (thumbnailUrl) {
            fileInfo.thumbnailUrl = thumbnailUrl;
            console.log(`Video thumbnail URL: ${thumbnailUrl}`);
          }
        }
  
        // Also save a metadata file for this upload in the same folder
        const uploadMetadata = {
          creationRightsId,
          originalName: file.originalname,
          contentType,
          size: file.size,
          uploadDate: new Date().toISOString(),
          uploadedBy: userId,
          gcsUrl: fileInfo.gcsUrl,
          url: fileInfo.url,
          thumbnailUrl: fileInfo.thumbnailUrl
        };
        
        try {
          const metadataPath = `Creations/${userId}/${creationRightsId}/upload-metadata.json`;
          await bucket.file(metadataPath).save(
            JSON.stringify(uploadMetadata, null, 2),
            { contentType: 'application/json' }
          );
          console.log(`Saved upload metadata to ${metadataPath}`);
        } catch (metadataError) {
          console.error('Error saving upload metadata:', metadataError);
          // Continue as this is not critical
        }
      } catch (gcsError) {
        console.error('Error uploading to GCS:', gcsError);
        return res.status(500).json({ 
          error: 'Failed to upload to cloud storage',
          message: gcsError.message,
          details: gcsError.stack
        });
      }
      
      // Return success with file info
      res.status(200).json({
        success: true,
        file: fileInfo
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ 
        error: 'File upload failed',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

// Save creation metadata endpoint
router.post('/:userId/creations', async (req, res) => {
  try {
    const { userId } = req.params;
    const creations = req.body;
    
    if (!Array.isArray(creations)) {
      return res.status(400).json({ 
        error: 'Invalid data format',
        message: 'Creations must be an array'
      });
    }
    
    console.log(`Saving ${creations.length} creations for user ${userId}...`);
   
    
    // Add detailed logging to see what's happening
    const bucket = storage.bucket(BUCKET_NAME);
    const metadataPath = `users/${userId}/creations/metadata/all.json`;
    
    // Check if file exists before saving
    const [exists] = await bucket.file(metadataPath).exists();
    console.log(`Metadata file exists: ${exists}`);
    
    if (exists) {
      console.log(`Updating existing metadata file at ${metadataPath}`);
    } else {
      console.log(`Creating new metadata file at ${metadataPath}`);
    }
    
    // Save the creations array with pretty formatting for easier debugging
    await bucket.file(metadataPath).save(
      JSON.stringify(creations, null, 2), // Use pretty formatting
      {
        contentType: 'application/json',
        metadata: {
          contentType: 'application/json',
          cacheControl: 'no-cache, max-age=0'
        }
      }
    );
    
    console.log(`Successfully saved ${creations.length} creations to ${metadataPath}`);
    
    // Additionally, create individual metadata files for each creation
    for (const creation of creations) {
      if (!creation.id) {
        console.warn('Creation missing ID, skipping individual metadata file');
        continue;
      }
      
      const creationId = creation.id;
      // Extract a creation rights ID if it exists in the metadata
      const creationRightsId = creation.metadata?.creationRightsId || 
                              creationId.startsWith('CR-') ? creationId : null;
                              
      if (creationRightsId) {
        const individualMetadataPath = 
          `users/${userId}/creations/assets/${creationRightsId}/metadata.json`;
        
        console.log(`Saving individual metadata for creation ${creationId} at ${individualMetadataPath}`);
        
        try {
          await bucket.file(individualMetadataPath).save(
            JSON.stringify(creation, null, 2),
            { contentType: 'application/json' }
          );
        } catch (metadataError) {
          console.error(`Error saving individual metadata for creation ${creationId}:`, metadataError);
          // Continue with the main operation even if this fails
        }
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Saved ${creations.length} creations successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving creations:', error);
    res.status(500).json({ 
      error: 'Failed to save creations',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

router.get('/:userId/:creationRightsId/download', async (req, res) => {
    try {
      const { userId, creationRightsId } = req.params;
      
      if (!storage) {
        return res.status(500).json({ error: 'Storage not initialized' });
      }
      
      console.log(`Fetching creation file for user ${userId}, creationRightsId ${creationRightsId}`);
      
      const bucket = storage.bucket(BUCKET_NAME);
      
      // First, try to locate the file in the primary location structure
      const primaryPath = `Creations/${userId}/${creationRightsId}`;
      
      // List all files in this path to find the actual file (not metadata)
      const [files] = await bucket.getFiles({ prefix: primaryPath });
      
      // Filter out metadata files
      const contentFiles = files.filter(file => 
        !file.name.endsWith('metadata.json') && 
        !file.name.endsWith('upload-metadata.json')
      );
      
      if (contentFiles.length === 0) {
        console.log(`No content files found in ${primaryPath}`);
        return res.status(404).json({ error: 'Creation file not found' });
      }
      
      // Use the first content file found
      const file = contentFiles[0];
      console.log(`Found creation file: ${file.name}`);
      
      // Get the file's metadata to set the correct content type
      const [metadata] = await file.getMetadata();
      res.setHeader('Content-Type', metadata.contentType || 'application/octet-stream');
      
      // Add cache control headers for better performance
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600');
      
      // Add ETag for caching
      if (metadata.etag) {
        res.setHeader('ETag', metadata.etag);
      }
      
      // Handle conditional requests (If-None-Match)
      const clientEtag = req.headers['if-none-match'];
      if (clientEtag && metadata.etag && clientEtag === metadata.etag) {
        return res.status(304).end(); // Not Modified
      }
      
      // Stream the file directly to the response
      file.createReadStream()
        .on('error', (err) => {
          console.error('Error streaming creation file:', err);
          if (!res.headersSent) {
            res.status(500).json({
              error: 'Error retrieving creation file',
              message: err.message
            });
          } else {
            res.end();
          }
        })
        .pipe(res);
    } catch (error) {
      console.error('Error in creation file download:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Error retrieving creation file',
          message: error.message
        });
      } else {
        res.end();
      }
    }
  });

  router.get('/:userId/:creationRightsId/thumbnail', async (req, res) => {
    try {
      const { userId, creationRightsId } = req.params;
      
      if (!storage) {
        return res.status(500).json({ error: 'Storage not initialized' });
      }
      
      const bucket = storage.bucket(BUCKET_NAME);
      
      // Check for a dedicated thumbnail
      const thumbnailPath = `Creations/${userId}/${creationRightsId}/thumbnail.jpg`;
      const [thumbnailExists] = await bucket.file(thumbnailPath).exists();
      
      if (thumbnailExists) {
        // Serve the dedicated thumbnail
        const thumbnailFile = bucket.file(thumbnailPath);
        
        // Get the file's metadata to set the correct content type
        const [metadata] = await thumbnailFile.getMetadata();
        res.setHeader('Content-Type', metadata.contentType || 'image/jpeg');
        
        // Stream the thumbnail file to the response
        thumbnailFile.createReadStream()
          .on('error', (err) => {
            console.error('Error streaming thumbnail:', err);
            // Fallback to placeholder if streaming fails
            serveDefaultPlaceholder();
          })
          .pipe(res);
          
        return;
      }
      
      // Fallback to placeholder
      serveDefaultPlaceholder();
      
      function serveDefaultPlaceholder() {
        // Use a placeholder image
        const placeholderPath = path.join(__dirname, '../public/video-placeholder.jpg');
        
        if (fs.existsSync(placeholderPath)) {
          res.setHeader('Content-Type', 'image/jpeg');
          fs.createReadStream(placeholderPath).pipe(res);
          return;
        }
        
        // If all else fails, send a 404
        res.status(404).send('Thumbnail not found');
      }
    } catch (error) {
      console.error('Error serving thumbnail:', error);
      res.status(500).send('Error serving thumbnail');
    }
  });
  

  router.get('/:userId/:creationRightsId/thumbnail', async (req, res) => {
    try {
      const { userId, creationRightsId } = req.params;
      
      if (!storage) {
        return res.status(500).json({ error: 'Storage not initialized' });
      }
      
      console.log(`Fetching thumbnail for user ${userId}, creationRightsId ${creationRightsId}`);
      
      const bucket = storage.bucket(BUCKET_NAME);
      
      // Check for a dedicated thumbnail
      const thumbnailPath = `Creations/${userId}/${creationRightsId}/thumbnail.jpg`;
      const [thumbnailExists] = await bucket.file(thumbnailPath).exists();
      
      if (thumbnailExists) {
        // Serve the dedicated thumbnail
        console.log(`Serving dedicated thumbnail: ${thumbnailPath}`);
        const thumbnailFile = bucket.file(thumbnailPath);
        
        // Get the file's metadata to set the correct content type
        const [metadata] = await thumbnailFile.getMetadata();
        res.setHeader('Content-Type', metadata.contentType || 'image/jpeg');
        
        // Add cache control headers for better performance
        res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600');
        
        // Stream the thumbnail file to the response
        thumbnailFile.createReadStream()
          .on('error', (err) => {
            console.error('Error streaming thumbnail:', err);
            if (!res.headersSent) {
              res.status(500).json({
                error: 'Error retrieving thumbnail',
                message: err.message
              });
            } else {
              res.end();
            }
          })
          .pipe(res);
        return;
      }
      
      // If no dedicated thumbnail exists, try to use a placeholder
      try {
        // Use a placeholder image
        const placeholderPath = path.join(__dirname, '../public/video-placeholder.jpg');
        
        if (fs.existsSync(placeholderPath)) {
          console.log(`Serving placeholder thumbnail from: ${placeholderPath}`);
          res.setHeader('Content-Type', 'image/jpeg');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          
          fs.createReadStream(placeholderPath).pipe(res);
          return;
        }
      } catch (placeholderError) {
        console.error('Error serving placeholder:', placeholderError);
      }
      
      // If we get here, we don't have a thumbnail or a placeholder
      res.status(404).json({ 
        error: 'Thumbnail not found',
        message: 'No thumbnail is available for this video'
      });
    } catch (error) {
      console.error('Error in thumbnail retrieval:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Error retrieving thumbnail',
          message: error.message
        });
      } else {
        res.end();
      }
    }
  });
/**
 * Generate a signed URL for direct upload to Google Cloud Storage
 * @param {string} userId - User ID (email)
 * @param {string} creationRightsId - Creation Rights ID
 * @param {string} contentType - MIME type of the file
 * @param {number} maxSizeBytes - Maximum allowed file size in bytes
 * @returns {Object} - Object containing the signed URL and file metadata
 */
async function generateSignedUploadUrl(userId, creationRightsId, contentType, maxSizeBytes = 1024 * 1024 * 500) {
    try {
      const storage = new Storage({
        keyFilename: process.env.GCS_KEY_FILE || path.join(__dirname, '../key.json')
      });
      
      const bucket = storage.bucket(BUCKET_NAME);
      const filePath = `Creations/${userId}/${creationRightsId}/file`;
      const file = bucket.file(filePath);
      
      const options = {
        version: 'v4',
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType: contentType,
        headers: {
          'Content-Type': contentType,
          'Content-Length': maxSizeBytes.toString(),
          'x-goog-meta-my-header': 'custom metadata'
        },
        conditions: [
          ['content-length-range', 0, maxSizeBytes]
        ]
      };
      
      const [signedUrl] = await file.getSignedUrl(options);
      
      // Also create a metadata file to track this upload
      const metadataPath = `Creations/${userId}/${creationRightsId}/upload-metadata.json`;
      const metadata = {
        creationRightsId,
        contentType,
        status: 'pending',
        maxSize: maxSizeBytes,
        generatedAt: new Date().toISOString(),
        gcsPath: filePath,
        gcsUrl: `https://storage.googleapis.com/${BUCKET_NAME}/${filePath}`
      };
      
      await bucket.file(metadataPath).save(
        JSON.stringify(metadata, null, 2),
        { contentType: 'application/json' }
      );
      
      return {
        signedUrl,
        fileInfo: {
          creationRightsId,
          gcsUrl: metadata.gcsUrl,
          contentType,
          status: 'pending'
        }
      };
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw error;
    }
  }
  
  // Add a route to generate signed URLs
  router.post('/:userId/generate-upload-url', async (req, res) => {
    try {
      const { userId } = req.params;
      const { contentType, fileSize, creationRightsId = `CR-${Date.now()}` } = req.body;
      
      if (!contentType) {
        return res.status(400).json({ error: 'Content type is required' });
      }
      
      // Generate a signed URL for direct upload
      const result = await generateSignedUploadUrl(
        userId,
        creationRightsId,
        contentType,
        fileSize || 1024 * 1024 * 500 // Default 500MB if not specified
      );
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error handling signed URL request:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Add a route to confirm that upload was completed
  router.post('/:userId/:creationRightsId/confirm-upload', async (req, res) => {
    try {
      const { userId, creationRightsId } = req.params;
      const { metadata } = req.body; // Additional metadata about the file
      
      const storage = new Storage({
        keyFilename: process.env.GCS_KEY_FILE || path.join(__dirname, '../key.json')
      });
      
      const bucket = storage.bucket(BUCKET_NAME);
      const filePath = `Creations/${userId}/${creationRightsId}/file`;
      const file = bucket.file(filePath);
      
      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        return res.status(404).json({ error: 'File not found. Upload may have failed.' });
      }
      
      // Get file metadata
      const [fileMetadata] = await file.getMetadata();
      
      // For videos, generate a thumbnail
      let thumbnailUrl = null;
      if (fileMetadata.contentType.startsWith('video/')) {
        try {
          // Since we can't generate the thumbnail on the server without additional libraries,
          // we'll use a placeholder or expect the client to upload a thumbnail separately
          const placeholderPath = path.join(__dirname, '../public/video-placeholder.jpg');
          
          if (fs.existsSync(placeholderPath)) {
            const thumbnailBuffer = fs.readFileSync(placeholderPath);
            const thumbnailPath = `Creations/${userId}/${creationRightsId}/thumbnail.jpg`;
            
            await bucket.file(thumbnailPath).save(thumbnailBuffer, {
              contentType: 'image/jpeg',
              metadata: {
                contentType: 'image/jpeg',
                cacheControl: 'public, max-age=86400'
              }
            });
            
            thumbnailUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${thumbnailPath}`;
          }
        } catch (thumbnailError) {
          console.error('Error creating thumbnail:', thumbnailError);
          // Continue without thumbnail
        }
      }
      
      // Update metadata
      const metadataPath = `Creations/${userId}/${creationRightsId}/upload-metadata.json`;
      const updatedMetadata = {
        ...metadata,
        creationRightsId,
        contentType: fileMetadata.contentType,
        size: parseInt(fileMetadata.size, 10),
        status: 'completed',
        uploadedAt: new Date().toISOString(),
        gcsUrl: `https://storage.googleapis.com/${BUCKET_NAME}/${filePath}`,
        thumbnailUrl
      };
      
      await bucket.file(metadataPath).save(
        JSON.stringify(updatedMetadata, null, 2),
        { contentType: 'application/json' }
      );
      
      res.status(200).json({
        success: true,
        file: {
          creationRightsId,
          gcsUrl: updatedMetadata.gcsUrl,
          contentType: fileMetadata.contentType,
          size: parseInt(fileMetadata.size, 10),
          thumbnailUrl
        }
      });
    } catch (error) {
      console.error('Error confirming upload:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // 2. Now let's add a route to handle thumbnail uploads for videos
  router.post('/:userId/:creationRightsId/upload-thumbnail', upload.single('thumbnail'), async (req, res) => {
    try {
      const { userId, creationRightsId } = req.params;
      
      if (!req.file) {
        return res.status(400).json({ error: 'No thumbnail uploaded' });
      }
      
      const thumbnailFile = req.file;
      
      // Only allow image files for thumbnails
      if (!thumbnailFile.mimetype.startsWith('image/')) {
        return res.status(400).json({ error: 'Only image files are allowed for thumbnails' });
      }
      
      const storage = new Storage({
        keyFilename: process.env.GCS_KEY_FILE || path.join(__dirname, '../key.json')
      });
      
      const bucket = storage.bucket(BUCKET_NAME);
      const thumbnailPath = `Creations/${userId}/${creationRightsId}/thumbnail.jpg`;
      
      // Upload thumbnail
      await bucket.file(thumbnailPath).save(thumbnailFile.buffer, {
        contentType: thumbnailFile.mimetype,
        metadata: {
          contentType: thumbnailFile.mimetype,
          cacheControl: 'public, max-age=86400'
        }
      });
      
      const thumbnailUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${thumbnailPath}`;
      
      // Update metadata to include thumbnail URL
      try {
        const metadataPath = `Creations/${userId}/${creationRightsId}/upload-metadata.json`;
        const [exists] = await bucket.file(metadataPath).exists();
        
        if (exists) {
          const [metadataContent] = await bucket.file(metadataPath).download();
          const metadata = JSON.parse(metadataContent.toString());
          
          metadata.thumbnailUrl = thumbnailUrl;
          
          await bucket.file(metadataPath).save(
            JSON.stringify(metadata, null, 2),
            { contentType: 'application/json' }
          );
        }
      } catch (metadataError) {
        console.error('Error updating metadata with thumbnail:', metadataError);
        // Continue anyway since we have the thumbnail
      }
      
      res.status(200).json({
        success: true,
        thumbnailUrl
      });
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      res.status(500).json({ error: error.message });
    }
  });

// Endpoint to check if a file exists in GCS
router.get('/files/check/:userId/:creationRightsId', async (req, res) => {
  try {
    const { userId, creationRightsId } = req.params;
    
    if (!storage) {
      return res.status(500).json({ error: 'Storage not initialized' });
    }
    
    console.log(`Checking files for creationRightsId=${creationRightsId}`);
    
    const bucket = storage.bucket(BUCKET_NAME);
    const basePath = `users/${userId}/creations/assets/${creationRightsId}`;
    
    // List all files in this path
    const [files] = await bucket.getFiles({ prefix: basePath });
    
    // Map files to objects with relevant info
    const fileList = files.map(file => ({
      name: file.name,
      path: file.name.replace(`${basePath}/`, ''),
      size: file.metadata.size || 'unknown',
      contentType: file.metadata.contentType || 'unknown',
      timeCreated: file.metadata.timeCreated || 'unknown'
    }));
    
    // Also check for overall creations metadata
    const metadataPath = `users/${userId}/creations/metadata/all.json`;
    const [metadataExists] = await bucket.file(metadataPath).exists();
    
    let creationsCount = 0;
    let creationFound = false;
    
    if (metadataExists) {
      try {
        const [content] = await bucket.file(metadataPath).download();
        const creations = JSON.parse(content.toString());
        
        if (Array.isArray(creations)) {
          creationsCount = creations.length;
          // Check if this creationRightsId exists in the metadata
          creationFound = creations.some(creation => 
            creation.metadata?.creationRightsId === creationRightsId ||
            creation.id === creationRightsId
          );
        }
      } catch (metadataError) {
        console.error('Error checking metadata:', metadataError);
      }
    }
    
    res.status(200).json({
      userId,
      creationRightsId,
      files: fileList,
      fileCount: fileList.length,
      metadataExists,
      creationsCount,
      creationFound,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking files:', error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;