// server/index.js - Updated with improved GCS folder structure

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer');
const fs = require('fs');
const instagramService = require('./services/instagramService');
const uploadHandler = require('./routes/uploadHandler');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: '*', // In production, you should restrict this
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'X-Content-Type-Options'],
  credentials: true,
  maxAge: 86400 // 1 day in seconds
};

// Apply CORS middleware

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use('/api/users', uploadHandler);

// Add explicit handler for OPTIONS requests
app.options('*', cors(corsOptions));

// Add an explicit CORS preflight handler for the upload endpoint
app.options('/api/users/:userId/upload', cors(corsOptions));

// For debugging CORS issues, add this middleware before your routes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Request headers:', req.headers);
  
  // Set CORS headers for all responses
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  next();
});


// Initialize Google Cloud Storage
let storage;
try {
  storage = new Storage({
    keyFilename: process.env.GCS_KEY_FILE || path.join(__dirname, 'key.json')
  });
} catch (error) {
  console.error('Failed to initialize Google Cloud Storage:', error);
}

// Configuration
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'creation-rights-app';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}


// Add middleware to handle HTML responses
app.use((req, res, next) => {
  // Store the original send method
  const originalSend = res.send;
  
  // Override the send method
  res.send = function(body) {
    // Check if the response is HTML and we're not explicitly requesting HTML
    const isHTML = typeof body === 'string' && 
                  (body.trim().startsWith('<!DOCTYPE') || 
                   body.trim().startsWith('<html'));
    
    const wantsJSON = req.headers.accept && 
                      req.headers.accept.includes('application/json');
    
    // If it's HTML but the client wants JSON, convert it to a JSON error
    if (isHTML && wantsJSON) {
      console.error('Attempted to send HTML to a JSON client. Converting to JSON error.');
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'The server encountered an unexpected condition that prevented it from fulfilling the request.'
      });
      return;
    }
    
    // Otherwise, use the original send method
    return originalSend.call(this, body);
  };
  
  next();
});


// Instagram API endpoint
// Add Instagram API endpoint
// Instagram API endpoint using the existing Apify integration
app.get('/api/instagram/:username', async (req, res) => {
  try {
    // Set JSON response type explicitly to avoid HTML responses
    res.setHeader('Content-Type', 'application/json');
    
    const { username } = req.params;
    
    // Normalize the username (remove @ if present)
    const normalizedUsername = username.startsWith('@') ? username.substring(1) : username;
    
    console.log(`Processing Instagram request for username: ${normalizedUsername}`);
    
    // Set a longer timeout for the request to avoid abrupt disconnections
    req.setTimeout(60000); // 1 minute timeout (reduced from 2 minutes)
    
    // Explicitly wrap the Instagram service call in a try-catch block
    try {
      // Use the existing instagramService that leverages Apify
      const profileData = await instagramService.fetchInstagramProfile(normalizedUsername);
      
      // Validate the response to ensure we have profile data
      if (!profileData || typeof profileData !== 'object') {
        return res.status(404).json({
          error: 'Profile not found',
          message: 'No Instagram profile found for this username. The account may not exist or may be private.'
        });
      }
      
      console.log(`Successfully fetched Instagram profile for ${normalizedUsername}`);
      
      // Return the profile data as JSON
      return res.json(profileData);
    } catch (fetchError) {
      console.error('Error fetching Instagram profile:', fetchError);
      
      // Return a proper JSON error response
      return res.status(500).json({
        error: 'Instagram API Error',
        message: fetchError.message || 'Failed to fetch Instagram profile. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Error handling Instagram request:', error);
    
    // Ensure we always return JSON, even for unexpected errors
    return res.status(500).json({ 
      error: 'Unexpected Error',
      message: error.message || 'An unexpected error occurred while processing your request. Please try again later.'
    });
  }
});

// Add Instagram post conversion endpoint
app.post('/api/instagram/convert', async (req, res) => {
  try {
    const { posts, userId } = req.body;
    
    if (!posts || !Array.isArray(posts)) {
      return res.status(400).json({ error: 'Posts are required and must be an array' });
    }
    
    const creations = posts.map(post => instagramService.convertPostToCreation(post));
    
    res.status(200).json(creations);
  } catch (error) {
    console.error('Error converting Instagram posts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add this to server/index.js

// Endpoint to fetch users by type
app.get('/api/users', async (req, res) => {
  console.log("here")
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    
    // List all files in the users directory
    const [files] = await bucket.getFiles({ prefix: 'users/' });
    
    // Filter for user profile files
    const userInfoFiles = files.filter(file => file.name.endsWith('/profile/info.json'));
    console.log(userInfoFiles)
    // Array to store user data
    const users = [];
    
    // Process each user file
    for (const file of userInfoFiles) {
      try {
        // Download and parse the user data
        const [content] = await file.download();
        const userData = JSON.parse(content.toString());
        
        // Get username from file path (users/username/profile/info.json)
        const pathParts = file.name.split('/');
        const username = pathParts[1];
        
        // Add the user data to the array
        users.push({
          ...userData,
          id: username, // Use the username as ID
          status: 'active' // Default status
        });
      } catch (err) {
        console.error(`Error processing user file ${file.name}:`, err);
      }
    }
    
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});
// Configure multer for file uploads
const multerStorage = multer.memoryStorage(); // Use memory storage instead of disk


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

// Helper function to sanitize email for use in filenames
const sanitizeEmail = (email) => {
  if (!email) return '';
  const sanitized = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
  console.log(`Sanitizing email: ${email} => ${sanitized}`);
  return sanitized;
};

// Helper function to handle storage operations
const handleStorageOperation = async (operation) => {
  try {
    return await operation();
  } catch (error) {
    console.error('Storage operation failed:', error);
    throw error;
  }
};

// Routes
app.get('/api/health', (req, next) => {
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  // Continue to next middleware
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Make sure the uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Using bucket name: ${BUCKET_NAME}`);
});

// User data endpoints
// Update this in server/index.js

app.post('/api/admin/fix-user-folders', async (req, res) => {
  try {
    // Check for admin authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    // Use a simple token validation for admin access
    // In production, use a proper authentication system
    if (token !== process.env.ADMIN_TOKEN) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    if (!storage) {
      return res.status(500).json({ error: 'Storage not initialized' });
    }
    
    // Get all users by listing user profile directories
    const bucket = storage.bucket(BUCKET_NAME);
    const [files] = await bucket.getFiles({ prefix: 'users/' });
    
    // Extract unique user IDs from file paths
    const userIds = new Set();
    files.forEach(file => {
      const pathParts = file.name.split('/');
      if (pathParts.length >= 2) {
        userIds.add(pathParts[1]);
      }
    });
    
    console.log(`Found ${userIds.size} users. Fixing folder structure...`);
    
    // Process each user
    const results = {
      totalUsers: userIds.size,
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: []
    };
    
    for (const userId of userIds) {
      try {
        results.processed++;
        
        // Skip empty user IDs and special folders
        if (!userId || userId === '.keep' || userId.startsWith('.')) {
          continue;
        }
        
        // Ensure the user folder structure
        const success = await ensureUserFolderStructure(userId);
        
        // Ensure creations metadata
        if (success) {
          await ensureCreationsMetadata(userId);
          results.succeeded++;
        } else {
          results.failed++;
          results.errors.push(`Failed to fix structure for user ${userId}`);
        }
      } catch (userError) {
        results.failed++;
        results.errors.push(`Error processing user ${userId}: ${userError.message}`);
        console.error(`Error fixing user ${userId}:`, userError);
      }
    }
    
    console.log(`Fixed folder structure for ${results.succeeded} users`);
    res.status(200).json(results);
  } catch (error) {
    console.error('Error fixing user folders:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = req.body;
    
    console.log(`Saving user data for user ${userId}...`);
    console.log('Path params:', req.params);
    console.log('Request body:', JSON.stringify(userData).substring(0, 200) + '...');
    
    // Ensure the user has the proper folder structure
    await ensureUserFolderStructure(userId);
    
    // Ensure the user has an empty creations metadata file if it doesn't exist
    await ensureCreationsMetadata(userId);
    
    await handleStorageOperation(async () => {
      const bucket = storage.bucket(BUCKET_NAME);
      
      // The correct path to the info.json file for this user
      const filePath = `users/${userId}/profile/info.json`;
      console.log(`Saving to path: ${filePath}`);
      
      const file = bucket.file(filePath);
      
      await file.save(JSON.stringify(userData), {
        contentType: 'application/json',
        metadata: {
          cacheControl: 'private, max-age=0'
        }
      });
      
      console.log(`Successfully saved user data to ${filePath}`);
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving user data:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`Loading user data for ${userId}...`);
    console.log('Path params:', req.params);
    
    const userData = await handleStorageOperation(async () => {
      const bucket = storage.bucket(BUCKET_NAME);
      
      // The correct path to the info.json file for this user
      const filePath = `users/${userId}/profile/info.json`;
      console.log(`Loading from path: ${filePath}`);
      
      const file = bucket.file(filePath);
      
      const [exists] = await file.exists();
      if (!exists) {
        console.log(`File does not exist: ${filePath}`);
        return null;
      }
      
      const [content] = await file.download();
      console.log(`Successfully loaded user data from ${filePath}`);
      return JSON.parse(content.toString());
    });
    
    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json(userData);
  } catch (error) {
    console.error('Error loading user data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Folders endpoints
app.post('/api/users/:userId/folders', async (req, res) => {
  try {
    const { userId } = req.params;
    const folders = req.body;
    
    console.log(`Saving folders for user ${userId}...`);
    
    await handleStorageOperation(async () => {
      const bucket = storage.bucket(BUCKET_NAME);
      const file = bucket.file(`users/${userId}/profile/folders.json`);
      
      await file.save(JSON.stringify(folders), {
        contentType: 'application/json'
      });
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving folders:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:userId/folders', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const folders = await handleStorageOperation(async () => {
      const bucket = storage.bucket(BUCKET_NAME);
      const file = bucket.file(`users/${userId}/profile/folders.json`);
      
      const [exists] = await file.exists();
      if (!exists) return null;
      
      const [content] = await file.download();
      return JSON.parse(content.toString());
    });
    
    if (!folders) {
      return res.status(404).json({ error: 'Folders not found' });
    }
    
    res.status(200).json(folders);
  } catch (error) {
    console.error('Error loading folders:', error);
    res.status(500).json({ error: error.message });
  }
});

// Creations endpoints
app.post('/api/users/:userId/creations', async (req, res) => {
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
    
    // Ensure the user has proper folder structure
    await ensureUserFolderStructure(userId);
    
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
    // This can be useful for granular access and backup purposes
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

// Updated loadCreations function for server/index.js
app.get('/api/users/:userId/creations', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure the user has proper folder structure
    await ensureUserFolderStructure(userId);
    
    const bucket = storage.bucket(BUCKET_NAME);
    const metadataPath = `users/${userId}/creations/metadata/all.json`;
    
    console.log(`Loading creations from ${metadataPath}`);
    
    // Check if the file exists
    const [exists] = await bucket.file(metadataPath).exists();
    
    if (!exists) {
      console.log(`No creations file found at ${metadataPath}, initializing with empty array`);
      // Initialize with empty array
      await ensureCreationsMetadata(userId);
      return res.status(200).json([]);
    }
    
    // Get the file contents
    const [content] = await bucket.file(metadataPath).download();
    
    let creations;
    try {
      creations = JSON.parse(content.toString());
      
      // Validate that it's an array
      if (!Array.isArray(creations)) {
        console.error(`Creations file contains non-array data: ${typeof creations}`);
        creations = [];
      }
      
      console.log(`Loaded ${creations.length} creations for user ${userId}`);
    } catch (parseError) {
      console.error(`Error parsing creations file: ${parseError.message}`);
      creations = [];
    }
    
    // Return the creations array
    res.status(200).json(creations);
  } catch (error) {
    console.error('Error loading creations:', error);
    res.status(500).json({ 
      error: 'Failed to load creations',
      message: error.message 
    });
  }
});
// For thumbnails and previews for video/audio content
app.post('/api/users/:userId/creation-thumbnail', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const userId = req.params.userId;
    const file = req.file;
    const contentType = file.mimetype;
    const creationRightsId = req.body.creationRightsId || `CR-${Date.now()}`;
    
    // Only allow image files for thumbnails
    if (!file.mimetype.startsWith('image/')) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Only image files are allowed for thumbnails' });
    }
    
    // Create file info object
    const fileInfo = {
      originalName: file.originalname,
      filename: file.filename,
      mimetype: contentType,
      size: file.size,
      path: file.path,
      creationRightsId: creationRightsId
    };
    
    // Upload to Google Cloud Storage
    if (storage) {
      try {
        const bucket = storage.bucket(BUCKET_NAME);
        const gcsFilePath = `users/${userId}/creations/assets/${creationRightsId}/thumbnail.${path.extname(file.filename).substring(1)}`;
        
        await bucket.upload(file.path, {
          destination: gcsFilePath,
          metadata: {
            contentType: contentType,
            cacheControl: 'no-cache, max-age=0'
          },
          public: true
        });
        
        const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${gcsFilePath}`;
        fileInfo.gcsUrl = publicUrl;
        fileInfo.url = publicUrl;
        
        fs.unlinkSync(file.path);
      } catch (error) {
        console.error('Error uploading thumbnail to GCS:', error);
        const localUrl = `/uploads/${userId}/thumbnails/${file.filename}`;
        fileInfo.url = localUrl;
      }
    } else {
      const localUrl = `/uploads/${userId}/thumbnails/${file.filename}`;
      fileInfo.url = localUrl;
    }
    
    res.status(200).json({
      success: true,
      file: fileInfo
    });
  } catch (error) {
    console.error('Thumbnail upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload endpoint for creation assets
// Update the upload endpoint in server/index.js

// Upload endpoint for creation assets - updated with folder structure check
app.post('/api/users/:userId/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const userId = req.params.userId;
    const file = req.file; // This is now in memory, not on disk
    const contentType = file.mimetype;
    
    console.log(`Processing upload for user: ${userId}`);
    console.log(`File details: name=${file.originalname}, size=${file.size}, type=${contentType}`);
    
    // Ensure the user has proper folder structure
    await ensureUserFolderStructure(userId);
    
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
    
    // Ensure assetFolderPath exists first
    const bucket = storage.bucket(BUCKET_NAME);
    const assetFolderPath = `users/${userId}/creations/assets/${creationRightsId}`;
    
    // Create the asset folder structure
    try {
      console.log(`Creating asset folder structure: ${assetFolderPath}`);
      await bucket.file(`${assetFolderPath}/.keep`).save('', {
        contentType: 'text/plain'
      });
    } catch (folderError) {
      console.error(`Error creating asset folder: ${folderError.message}`);
      // Continue as the file upload might still succeed
    }
    
    // Upload the file to Google Cloud Storage
    try {
      const gcsFilePath = `${assetFolderPath}/${file.originalname}`;
      console.log(`Uploading file to: ${gcsFilePath}`);
      
      const gcsFile = bucket.file(gcsFilePath);
      
      // Create a writable stream to GCS
      const stream = gcsFile.createWriteStream({
        metadata: {
          contentType: contentType,
          cacheControl: 'no-cache, max-age=0'
        },
        resumable: false, // For small files, this is faster
        public: true
      });
      
      // Handle errors and completion
      const streamPromise = new Promise((resolve, reject) => {
        stream.on('error', (err) => {
          console.error(`Stream error uploading ${file.originalname}:`, err);
          reject(err);
        });
        
        stream.on('finish', () => {
          // Get the public URL
          const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${gcsFilePath}`;
          fileInfo.gcsUrl = publicUrl;
          fileInfo.url = publicUrl;
          console.log(`File uploaded successfully: ${publicUrl}`);
          resolve();
        });
      });
      
      // Write the buffer to the stream
      stream.end(file.buffer);
      
      // Wait for the stream to finish
      await streamPromise;
      
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
        const metadataPath = `${assetFolderPath}/upload-metadata.json`;
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
// Add this to server/index.js

// Proxy endpoint for GCS images
app.get('/api/images/:userId/:objectPath(*)', async (req, res) => {
  try {
    const { userId, objectPath } = req.params;
    const gcsPath = `users/${userId}/${objectPath}`;
    
    console.log(`Proxying request for GCS object: ${gcsPath}`);
    
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(gcsPath);
    
    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).send('Image not found');
    }
    
    // Get the file's metadata to set the correct content type
    const [metadata] = await file.getMetadata();
    res.setHeader('Content-Type', metadata.contentType);
    
    // Stream the file directly to the response
    file.createReadStream()
      .on('error', (err) => {
        console.error('Error streaming file:', err);
        res.status(500).send('Error retrieving image');
      })
      .pipe(res);
      
  } catch (error) {
    console.error('Error fetching image from GCS:', error);
    res.status(500).send('Error retrieving image');
  }
});
// Profile photo upload endpoint
// Get user profile photo
// Update this endpoint in server/index.js

// Profile photo upload endpoint
app.post('/api/users/:userId/profile-photo', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const userId = req.params.userId;
    const file = req.file;
    
    // Only allow image files for profile photos
    if (!file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'Only image files are allowed for profile photos' });
    }
    
    // Create file info object
    const fileInfo = {
      originalName: file.originalname,
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    };
    
    // Upload to Google Cloud Storage
    if (storage) {
      try {
        const bucket = storage.bucket(BUCKET_NAME);
        
        // Use the correct file path for profile photos that matches where you're looking for them
        const gcsFilePath = `users/${userId}/profile/photo${path.extname(file.originalname)}`;
        console.log(`Uploading profile photo to: ${gcsFilePath}`);
        
        // Create a file in the bucket
        const gcsFile = bucket.file(gcsFilePath);
        
        // Create a write stream
        const stream = gcsFile.createWriteStream({
          metadata: {
            contentType: file.mimetype,
            cacheControl: 'no-cache, max-age=0'
          }
        });
        
        // Handle errors and completion
        const streamPromise = new Promise((resolve, reject) => {
          stream.on('error', (err) => {
            console.error('Error uploading profile photo to GCS:', err);
            reject(err);
          });
          
          stream.on('finish', () => {
            // Generate public URL
            const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${gcsFilePath}`;
            fileInfo.gcsUrl = publicUrl;
            fileInfo.url = publicUrl;
            resolve();
          });
        });
        
        // Write the buffer to the stream
        stream.end(file.buffer);
        
        // Wait for the stream to finish
        await streamPromise;
        
        // Update user data with the new profile photo URL
        try {
          const userInfoFile = bucket.file(`users/${userId}/profile/info.json`);
          const [exists] = await userInfoFile.exists();
          
          if (exists) {
            const [content] = await userInfoFile.download();
            const userData = JSON.parse(content.toString());
            
            // Update the photo URL
            userData.photoUrl = fileInfo.gcsUrl;
            
            // Save the updated user data
            await userInfoFile.save(JSON.stringify(userData), {
              contentType: 'application/json'
            });
          }
        } catch (error) {
          console.error('Error updating user data with profile photo:', error);
        }
      } catch (gcsError) {
        console.error('Error uploading profile photo to GCS:', gcsError);
        return res.status(500).json({ error: 'Failed to upload to cloud storage: ' + gcsError.message });
      }
    } else {
      // No GCS available
      return res.status(500).json({ error: 'Cloud storage not available' });
    }
    
    res.status(200).json({
      success: true,
      file: fileInfo
    });
  } catch (error) {
    console.error('Profile photo upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user profile photo - this is the missing endpoint
app.get('/api/users/:userId/profile-photo', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`Getting profile photo for user ${userId}...`);
    
    const bucket = storage.bucket(BUCKET_NAME);
    
    // Check for profile photo with various extensions
    const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    let photoPath = null;
    let photoFile = null;
    
    for (const ext of extensions) {
      // This path should match where the profile photo is uploaded to
      const path = `users/${userId}/profile/photo.${ext}`;
      console.log(`Checking for profile photo at: ${path}`);
      
      const file = bucket.file(path);
      const [exists] = await file.exists();
      
      if (exists) {
        photoPath = path;
        photoFile = file;
        console.log(`Found profile photo at: ${path}`);
        break;
      }
    }
    
    if (!photoPath) {
      console.log(`No profile photo found for user ${userId}`);
      return res.status(404).json({ 
        error: 'Profile photo not found',
        message: 'No profile photo has been uploaded for this user'
      });
    }
    
    // Get the file's metadata to set the correct content type
    const [metadata] = await photoFile.getMetadata();
    res.setHeader('Content-Type', metadata.contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Stream the file directly to the response
    photoFile.createReadStream()
      .on('error', (err) => {
        console.error('Error streaming profile photo:', err);
        res.status(500).send('Error retrieving profile photo');
      })
      .pipe(res);
      
  } catch (error) {
    console.error('Error fetching profile photo from GCS:', error);
    res.status(500).json({ 
      error: 'Error retrieving profile photo',
      message: error.message
    });
  }
});

// Add a simpler endpoint to get user profile photo URL
app.get('/api/users/:userId/profile-photo-url', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const bucket = storage.bucket(BUCKET_NAME);
    
    // Check for profile photo with various extensions
    const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    let photoPath = null;
    
    for (const ext of extensions) {
      const path = `users/${userId}/profile/photo.${ext}`;
      const file = bucket.file(path);
      const [exists] = await file.exists();
      
      if (exists) {
        photoPath = path;
        break;
      }
    }
    
    if (!photoPath) {
      console.log(`No profile photo found for user ${userId}`);
      return res.status(404).json({ 
        error: 'Profile photo not found'
      });
    }
    
    // Return the public URL
    const photoUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${photoPath}`;
    
    res.status(200).json({ 
      photoUrl: photoUrl,
      path: photoPath
    });
      
  } catch (error) {
    console.error('Error getting profile photo URL:', error);
    res.status(500).json({ 
      error: 'Error retrieving profile photo URL',
      message: error.message
    });
  }
});

app.get('/api/debug/bucket/:path(*)', async (req, res) => {
  try {
    // Check if admin authorization is provided
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    // Use a simple token validation for debugging
    // In production, use a proper authentication system
    if (token !== process.env.DEBUG_TOKEN) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    if (!storage) {
      return res.status(500).json({ error: 'Storage not initialized' });
    }
    
    const path = req.params.path || '';
    const bucket = storage.bucket(BUCKET_NAME);
    
    // List files in the specified path
    console.log(`Listing files in bucket path: ${path}`);
    const [files] = await bucket.getFiles({ prefix: path });
    
    const fileList = files.map(file => ({
      name: file.name,
      size: file.metadata.size,
      updated: file.metadata.updated,
      contentType: file.metadata.contentType
    }));
    
    res.status(200).json({
      bucket: BUCKET_NAME,
      path: path,
      files: fileList
    });
  } catch (error) {
    console.error('Error checking bucket contents:', error);
    res.status(500).json({ error: error.message });
  }
});

// DEBUG: Endpoint to check file contents - REMOVE IN PRODUCTION
app.get('/api/debug/file/:path(*)', async (req, res) => {
  try {
    // Check if admin authorization is provided
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    // Use a simple token validation for debugging
    if (token !== process.env.DEBUG_TOKEN) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    if (!storage) {
      return res.status(500).json({ error: 'Storage not initialized' });
    }
    
    const path = req.params.path || '';
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(path);
    
    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Download file contents
    const [content] = await file.download();
    
    // Get file metadata
    const [metadata] = await file.getMetadata();
    
    // Try to parse JSON if content type is JSON
    let parsedContent = null;
    if (metadata.contentType === 'application/json') {
      try {
        parsedContent = JSON.parse(content.toString());
      } catch (parseError) {
        console.error('Error parsing JSON file:', parseError);
      }
    }
    
    res.status(200).json({
      bucket: BUCKET_NAME,
      path: path,
      metadata: metadata,
      content: parsedContent || content.toString()
    });
  } catch (error) {
    console.error('Error checking file contents:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add these routes to server/index.js

// User search endpoint
app.get('/api/users/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const bucket = storage.bucket(BUCKET_NAME);
    
    // List all files in the users directory
    const [files] = await bucket.getFiles({ prefix: 'users/' });
    
    // Filter for user profile files
    const userInfoFiles = files.filter(file => file.name.endsWith('/profile/info.json'));
    
    // Array to store user data
    const users = [];
    
    // Process each user file
    for (const file of userInfoFiles) {
      try {
        // Download and parse the user data
        const [content] = await file.download();
        const userData = JSON.parse(content.toString());
        
        // Get username from file path (users/username/profile/info.json)
        const pathParts = file.name.split('/');
        const username = pathParts[1];
        
        // Check if user matches search query (name or email)
        const userEmail = userData.email || username;
        const userName = userData.name || username.split('@')[0];
        
        if (
          userEmail.toLowerCase().includes(query.toLowerCase()) ||
          userName.toLowerCase().includes(query.toLowerCase())
        ) {
          // Add the user data to the array
          users.push({
            email: userEmail,
            name: userName,
            // Include other non-sensitive fields
            photoUrl: userData.photoUrl,
            location: userData.location,
            specialties: userData.specialties || []
          });
        }
      } catch (err) {
        console.error(`Error processing user file ${file.name}:`, err);
      }
    }
    
    res.status(200).json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Chat endpoints
// Get all chats for a user
app.get('/api/chats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const sanitizedUserId = sanitizeEmail(userId);
    
    const bucket = storage.bucket(BUCKET_NAME);
    const chatsDirPath = `users/${sanitizedUserId}/chats`;
    
    // Check if chats directory exists
    const [filesExists] = await bucket.getFiles({ 
      prefix: chatsDirPath,
      maxResults: 1
    });
    
    if (!filesExists || filesExists.length === 0) {
      // No chats directory yet, return empty array
      return res.status(200).json([]);
    }
    
    // List all chat files
    const [files] = await bucket.getFiles({ prefix: chatsDirPath });
    const chatInfoFiles = files.filter(file => file.name.endsWith('info.json'));
    
    const chats = [];
    
    // Process each chat file
    for (const file of chatInfoFiles) {
      try {
        const [content] = await file.download();
        let chatData;
        
        try {
          chatData = JSON.parse(content.toString());
        } catch (parseError) {
          console.error(`Error parsing chat info for ${file.name}:`, parseError);
          continue; // Skip this chat if we can't parse it
        }
        
        // Only include chats where the user is a participant
        if (chatData.participants && chatData.participants.some(p => 
          p.email === userId || p.email.toLowerCase() === userId.toLowerCase()
        )) {
          // Get messages to count unread
          const messagesPath = file.name.replace('info.json', 'messages.json');
          let messages = [];
          
          try {
            const [messagesContent] = await bucket.file(messagesPath).download();
            messages = JSON.parse(messagesContent.toString());
            
            // Ensure messages is always an array
            if (!Array.isArray(messages)) {
              console.warn(`Messages for chat ${chatData.id} is not an array`);
              messages = [];
            }
            
            // Include messages in chat data for convenience
            chatData.messages = messages;
            
            // Update lastMessage and lastMessageTime if not set but messages exist
            if (messages.length > 0 && (!chatData.lastMessage || !chatData.lastMessageTime)) {
              const lastMsg = messages[messages.length - 1];
              chatData.lastMessage = lastMsg.content;
              chatData.lastMessageTime = lastMsg.timestamp;
              
              // Update the info.json file with this info
              await bucket.file(file.name).save(
                JSON.stringify(chatData),
                { contentType: 'application/json' }
              );
            }
          } catch (msgError) {
            console.error(`Error loading messages for chat ${chatData.id}:`, msgError);
            chatData.messages = [];
          }
          
          chats.push(chatData);
        }
      } catch (err) {
        console.error(`Error processing chat file ${file.name}:`, err);
      }
    }
    
    // Sort chats by last message time (most recent first)
    chats.sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return timeB - timeA;
    });
    
    res.status(200).json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new chat
// Create a new chat
app.post('/api/chats', async (req, res) => {
  try {
    const { participants } = req.body;
    
    if (!participants || participants.length < 2) {
      return res.status(400).json({ error: 'At least two participants are required' });
    }
    
    const chatId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const chatData = {
      id: chatId,
      participants,
      created: new Date().toISOString(),
      lastMessage: '',
      lastMessageTime: null
    };
    
    console.log(`Creating new chat ${chatId} with participants:`, participants);
    
    const bucket = storage.bucket(BUCKET_NAME);
    
    // Save chat info for each participant
    for (const participant of participants) {
      const sanitizedUserId = sanitizeEmail(participant.email);
      const chatPath = `users/${sanitizedUserId}/chats/${chatId}`;
      const chatInfoPath = `${chatPath}/info.json`;
      const messagesPath = `${chatPath}/messages.json`;
      
      console.log(`Saving chat info to ${chatInfoPath}`);
      
      // Check if directory exists, if not create it
      try {
        // Check if parent directory exists
        const dirExists = await bucket.file(`users/${sanitizedUserId}/chats/`).exists();
        if (!dirExists[0]) {
          // Create an empty file to ensure directory exists
          await bucket.file(`users/${sanitizedUserId}/chats/.keep`).save('');
          console.log(`Created chat directory for user ${sanitizedUserId}`);
        }
      } catch (dirError) {
        console.error(`Error checking/creating directory for ${sanitizedUserId}:`, dirError);
        // Continue anyway, the file operation might still succeed
      }
      
      // Create info.json file
      try {
        await bucket.file(chatInfoPath).save(
          JSON.stringify(chatData),
          { contentType: 'application/json' }
        );
        console.log(`Saved chat info to ${chatInfoPath}`);
      } catch (infoError) {
        console.error(`Error saving chat info for ${sanitizedUserId}:`, infoError);
        throw infoError;
      }
      
      // Create empty messages.json file
      try {
        await bucket.file(messagesPath).save(
          JSON.stringify([]),
          { contentType: 'application/json' }
        );
        console.log(`Saved empty messages to ${messagesPath}`);
      } catch (msgError) {
        console.error(`Error saving empty messages for ${sanitizedUserId}:`, msgError);
        throw msgError;
      }
    }
    
    res.status(201).json(chatData);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get chat messages
app.get('/api/chats/:userId/:chatId/messages', async (req, res) => {
  try {
    const { userId, chatId } = req.params;
    const sanitizedUserId = sanitizeEmail(userId);
    
    const bucket = storage.bucket(BUCKET_NAME);
    const messagesPath = `users/${sanitizedUserId}/chats/${chatId}/messages.json`;
    
    // Check if messages file exists
    const [exists] = await bucket.file(messagesPath).exists();
    
    if (!exists) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    // Get messages
    const [content] = await bucket.file(messagesPath).download();
    
    // Parse the messages and ensure it's an array
    let messages;
    try {
      messages = JSON.parse(content.toString());
      // Ensure messages is always an array
      if (!Array.isArray(messages)) {
        console.warn(`Messages for chat ${chatId} is not an array:`, messages);
        messages = [];
      }
    } catch (parseError) {
      console.error(`Error parsing messages for chat ${chatId}:`, parseError);
      messages = [];
    }
    
    // Sort messages by timestamp
    messages.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeA - timeB;
    });
    
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send a message
app.post('/api/chats/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { sender, content, timestamp } = req.body;
    
    if (!sender || !content) {
      return res.status(400).json({ error: 'Sender and content are required' });
    }
    
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const message = {
      id: messageId,
      sender,
      content,
      timestamp: timestamp || new Date().toISOString(),
      read: false
    };
    
    const bucket = storage.bucket(BUCKET_NAME);
    
    // First, get the chat info to find all participants
    const sanitizedSender = sanitizeEmail(sender);
    const chatInfoPath = `users/${sanitizedSender}/chats/${chatId}/info.json`;
    
    // Check if chat info exists
    const [chatInfoExists] = await bucket.file(chatInfoPath).exists();
    
    if (!chatInfoExists) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    // Get chat info
    const [chatInfoContent] = await bucket.file(chatInfoPath).download();
    let chatInfo;
    
    try {
      chatInfo = JSON.parse(chatInfoContent.toString());
    } catch (parseError) {
      console.error(`Error parsing chat info for ${chatId}:`, parseError);
      return res.status(500).json({ error: 'Invalid chat data' });
    }
    
    // Validate sender is a participant
    if (!chatInfo.participants || !chatInfo.participants.some(p => 
      p.email === sender || p.email.toLowerCase() === sender.toLowerCase()
    )) {
      return res.status(403).json({ error: 'Sender is not a participant in this chat' });
    }
    
    // Update last message info
    chatInfo.lastMessage = content;
    chatInfo.lastMessageTime = message.timestamp;
    
    // For each participant, update messages and chat info
    for (const participant of chatInfo.participants) {
      const sanitizedParticipantId = sanitizeEmail(participant.email);
      const participantMessagesPath = `users/${sanitizedParticipantId}/chats/${chatId}/messages.json`;
      const participantChatInfoPath = `users/${sanitizedParticipantId}/chats/${chatId}/info.json`;
      
      // Get current messages
      let currentMessages = [];
      try {
        // Check if file exists first
        const [messagesExists] = await bucket.file(participantMessagesPath).exists();
        
        if (messagesExists) {
          const [messagesContent] = await bucket.file(participantMessagesPath).download();
          try {
            currentMessages = JSON.parse(messagesContent.toString());
            
            // Ensure messages is always an array
            if (!Array.isArray(currentMessages)) {
              console.warn(`Messages for ${participantMessagesPath} is not an array`);
              currentMessages = [];
            }
          } catch (parseError) {
            console.error(`Error parsing messages for ${participantMessagesPath}:`, parseError);
            currentMessages = [];
          }
        }
      } catch (err) {
        console.error(`Error getting messages for ${participant.email}:`, err);
        // If file doesn't exist, we'll create it with the new message
      }
      
      // Add new message
      currentMessages.push({
        ...message,
        // Mark as read if sent by this participant
        read: participant.email === sender
      });
      
      // Save updated messages
      await bucket.file(participantMessagesPath).save(
        JSON.stringify(currentMessages),
        { contentType: 'application/json' }
      );
      
      // Update chat info
      await bucket.file(participantChatInfoPath).save(
        JSON.stringify(chatInfo),
        { contentType: 'application/json' }
      );
    }
    
    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/files/check/:userId/:creationRightsId', async (req, res) => {
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

// Mark messages as read
app.post('/api/chats/:userId/:chatId/read', async (req, res) => {
  try {
    const { userId, chatId } = req.params;
    const sanitizedUserId = sanitizeEmail(userId);
    
    const bucket = storage.bucket(BUCKET_NAME);
    const messagesPath = `users/${sanitizedUserId}/chats/${chatId}/messages.json`;
    
    // Check if messages file exists
    const [exists] = await bucket.file(messagesPath).exists();
    
    if (!exists) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    // Get messages
    const [content] = await bucket.file(messagesPath).download();
    const messages = JSON.parse(content.toString());
    
    // Mark all messages from other participants as read
    const updatedMessages = messages.map(message => {
      if (message.sender !== userId && !message.read) {
        return { ...message, read: true };
      }
      return message;
    });
    
    // Save updated messages
    await bucket.file(messagesPath).save(
      JSON.stringify(updatedMessages),
      { contentType: 'application/json' }
    );
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add these endpoints to server/index.js (or update if they already exist)

// Get Instagram profile data
app.get('/api/users/:userId/social-profiles/instagram', async (req, res) => {
  try {
    const { userId } = req.params;
    const sanitizedUserId = sanitizeEmail(userId);
    
    const bucket = storage.bucket(BUCKET_NAME);
    const filePath = `users/${sanitizedUserId}/profile/social/instagram.json`;
    
    // Check if file exists
    const [exists] = await bucket.file(filePath).exists();
    if (!exists) {
      return res.status(404).json({ error: 'Instagram profile not found' });
    }
    
    // Get the profile data
    const [content] = await bucket.file(filePath).download();
    let profileData;
    
    try {
      profileData = JSON.parse(content.toString());
    } catch (parseError) {
      console.error('Error parsing Instagram profile data:', parseError);
      return res.status(500).json({ error: 'Invalid profile data format' });
    }
    
    res.status(200).json(profileData);
  } catch (error) {
    console.error('Error getting Instagram profile:', error);
    res.status(500).json({ error: error.message });
  }
});
/**
 * Ensures a user has the proper folder structure in Google Cloud Storage
 * @param {string} userId - The sanitized user ID
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
const ensureUserFolderStructure = async (userId) => {
  try {
    if (!storage) {
      console.error('Storage not initialized');
      return false;
    }
    
    const bucket = storage.bucket(BUCKET_NAME);
    const folderStructure = [
      `users/${userId}/.keep`,
      `users/${userId}/profile/.keep`,
      `users/${userId}/chats/.keep`,
      `users/${userId}/creations/.keep`,
      `users/${userId}/creations/assets/.keep`,
      `users/${userId}/creations/metadata/.keep`
    ];
    
    console.log(`Ensuring folder structure for user ${userId}...`);
    
    // Create all directories in parallel
    await Promise.all(folderStructure.map(async (path) => {
      try {
        const [exists] = await bucket.file(path).exists();
        if (!exists) {
          await bucket.file(path).save('', {
            metadata: {
              contentType: 'text/plain'
            }
          });
          console.log(`Created: ${path}`);
        }
      } catch (error) {
        console.error(`Error creating ${path}:`, error);
      }
    }));
    
    return true;
  } catch (error) {
    console.error('Error ensuring user folder structure:', error);
    return false;
  }
};
const ensureCreationsMetadata = async (userId) => {
  try {
    if (!storage) {
      console.error('Storage not initialized');
      return false;
    }
    
    const bucket = storage.bucket(BUCKET_NAME);
    const metadataPath = `users/${userId}/creations/metadata/all.json`;
    
    const [exists] = await bucket.file(metadataPath).exists();
    if (!exists) {
      await bucket.file(metadataPath).save(JSON.stringify([]), {
        contentType: 'application/json'
      });
      console.log(`Created empty creations metadata for user ${userId}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring creations metadata:', error);
    return false;
  }
};

app.get('/api/diagnostics/upload/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if we can reach the user folder
    if (!storage) {
      return res.status(500).json({ 
        error: 'Storage not initialized',
        environment: {
          BUCKET_NAME,
          NODE_ENV: process.env.NODE_ENV,
          storageAvailable: !!storage
        }
      });
    }
    
    // Check endpoints
    const endpointInfo = {
      uploadEndpoint: `/api/users/${userId}/upload`,
      method: 'POST',
      contentType: 'multipart/form-data',
      routeRegistration: true,
      userExists: false,
      folderExists: false
    };
    
    // Check if user folder exists
    try {
      const bucket = storage.bucket(BUCKET_NAME);
      const [files] = await bucket.getFiles({ prefix: `users/${userId}/`, maxResults: 1 });
      endpointInfo.userExists = files.length > 0;
      
      // Check specific creations folder
      const [creationFiles] = await bucket.getFiles({ 
        prefix: `users/${userId}/creations/`, 
        maxResults: 1 
      });
      endpointInfo.folderExists = creationFiles.length > 0;
      
      // If folders don't exist, try to create them
      if (!endpointInfo.folderExists) {
        await ensureUserFolderStructure(userId);
        endpointInfo.folderCreationAttempted = true;
        
        // Check again
        const [newFiles] = await bucket.getFiles({ 
          prefix: `users/${userId}/creations/`, 
          maxResults: 1 
        });
        endpointInfo.folderExistsAfterCreation = newFiles.length > 0;
      }
    } catch (error) {
      endpointInfo.folderCheckError = error.message;
    }
    
    // Return diagnostic info
    res.status(200).json({
      userId,
      timestamp: new Date().toISOString(),
      endpointInfo,
      server: {
        nodejs: process.version,
        platform: process.platform
      }
    });
  } catch (error) {
    console.error('Error in upload diagnostics:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:userId/diagnostics/folders', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!storage) {
      return res.status(500).json({ error: 'Storage not initialized' });
    }
    
    // Define critical paths that should exist
    const criticalPaths = [
      `users/${userId}/profile/`,
      `users/${userId}/creations/`,
      `users/${userId}/creations/metadata/`,
      `users/${userId}/creations/assets/`
    ];
    
    const bucket = storage.bucket(BUCKET_NAME);
    
    // List all files in the user's directory
    const [files] = await bucket.getFiles({ prefix: `users/${userId}/` });
    
    // Extract directory paths from files
    const existingPaths = new Set();
    files.forEach(file => {
      const path = file.name.split('/').slice(0, -1).join('/') + '/';
      existingPaths.add(path);
    });
    
    // Check critical paths
    const pathStatus = {};
    criticalPaths.forEach(path => {
      pathStatus[path] = existingPaths.has(path);
    });
    
    // Check specific files
    const fileStatus = {
      'profile/info.json': false,
      'creations/metadata/all.json': false
    };
    
    files.forEach(file => {
      Object.keys(fileStatus).forEach(targetFilePath => {
        if (file.name === `users/${userId}/${targetFilePath}`) {
          fileStatus[targetFilePath] = true;
        }
      });
    });
    
    // Attempt to fix any missing structure
    if (Object.values(pathStatus).some(status => !status) || 
        Object.values(fileStatus).some(status => !status)) {
      console.log(`Found missing folders/files for user ${userId}. Attempting to fix...`);
      await ensureUserFolderStructure(userId);
      await ensureCreationsMetadata(userId);
    }
    
    res.status(200).json({
      userId,
      timestamp: new Date().toISOString(),
      pathStatus,
      fileStatus,
      attempted_fix: Object.values(pathStatus).some(status => !status) || 
                      Object.values(fileStatus).some(status => !status)
    });
  } catch (error) {
    console.error('Error running folder diagnostics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save Instagram profile data
app.post('/api/users/:userId/social-profiles/instagram', async (req, res) => {
  try {
    const { userId } = req.params;
    const profileData = req.body;
    
    if (!profileData || !profileData.username) {
      return res.status(400).json({ error: 'Invalid profile data - username is required' });
    }
    
    const sanitizedUserId = sanitizeEmail(userId);
    
    // Save to Google Cloud Storage
    const bucket = storage.bucket(BUCKET_NAME);
    
    // Create directory structure if it doesn't exist
    try {
      await bucket.file(`users/${sanitizedUserId}/profile/social/.keep`).save('');
    } catch (dirError) {
      console.error(`Error ensuring directory structure: ${dirError}`);
      // Continue anyway as the file save might still work
    }
    
    // Add a timestamp to the data
    const dataToSave = {
      ...profileData,
      lastUpdated: new Date().toISOString()
    };
    
    // Save the profile data
    const filePath = `users/${sanitizedUserId}/profile/social/instagram.json`;
    await bucket.file(filePath).save(JSON.stringify(dataToSave), {
      contentType: 'application/json',
      metadata: {
        cacheControl: 'private, max-age=0'
      }
    });
    
    // Update the user's main profile data to include reference to social profiles
    try {
      const userInfoFile = bucket.file(`users/${sanitizedUserId}/profile/info.json`);
      const [exists] = await userInfoFile.exists();
      
      if (exists) {
        const [content] = await userInfoFile.download();
        let userData;
        
        try {
          userData = JSON.parse(content.toString());
        } catch (parseError) {
          console.error('Error parsing user data:', parseError);
          userData = {}; // Start with empty object if parse fails
        }
        
        // Add social profiles data to user info
        if (!userData.socialProfiles) {
          userData.socialProfiles = {};
        }
        
        // Just store a reference, not the full data
        userData.socialProfiles.instagram = {
          username: profileData.username,
          lastUpdated: new Date().toISOString()
        };
        
        // Save updated user info
        await userInfoFile.save(JSON.stringify(userData), {
          contentType: 'application/json'
        });
      }
    } catch (userUpdateError) {
      console.error('Error updating user info with Instagram profile reference:', userUpdateError);
      // Continue as this is non-critical
    }
    
    // Return success with the saved data
    res.status(200).json({
      success: true,
      data: dataToSave
    });
  } catch (error) {
    console.error('Error saving Instagram profile:', error);
    res.status(500).json({ error: error.message });
  }
});