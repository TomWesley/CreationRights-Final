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
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  }
});



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
      
      // Handle errors and completion
      // After successful upload, generate the public URL
        const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${gcsFilePath}`;
        fileInfo.gcsUrl = publicUrl;
        fileInfo.url = publicUrl;
        console.log(`File uploaded successfully: ${publicUrl}`);
      

      // Also save a metadata file for this upload in the same folder
      const uploadMetadata = {
        creationRightsId,
        originalName: file.originalname,
        contentType,
        size: file.size,
        uploadDate: new Date().toISOString(),
        uploadedBy: userId,
        gcsUrl: fileInfo.gcsUrl,
        url: fileInfo.url
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