// server/index.js - Updated with improved GCS folder structure

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer');
const fs = require('fs');
const uploadHandler = require('./routes/uploadHandler');
const stripeRoutes = require('./routes/stripeRoutes');

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
app.use('/api', stripeRoutes);

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



// For thumbnails and previews for video/audio conten

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
        const gcsFilePath = `ProfilePhotos/photo${path.extname(file.originalname)}`;
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

// Delete user profile photo
app.delete('/api/users/:userId/profile-photo', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`Deleting profile photo for user ${userId}...`);
    
    const bucket = storage.bucket(BUCKET_NAME);
    
    // Check for profile photo with various extensions
    const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    let photoPath = null;
    let photoFile = null;
    
    for (const ext of extensions) {
      // This path should match where the profile photo is uploaded to
      const path = `ProfilePhotos/photo.${ext}`;
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
    
    // Delete the photo
    try {
      await photoFile.delete();
      console.log(`Deleted profile photo at: ${photoPath}`);
      
      res.status(200).json({ success: true, message: 'Profile photo deleted' });
    } catch (deleteError) {
      console.error('Error deleting profile photo:', deleteError);
      res.status(500).json({ 
        error: 'Error deleting profile photo',
        message: deleteError.message
      });
    }
  } catch (error) {
    console.error('Error handling profile photo deletion:', error);
    res.status(500).json({ 
      error: 'Error handling profile photo deletion',
      message: error.message
    });
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
      const path = `ProfilePhotos/photo.${ext}`;
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
      const path = `ProfilePhotos/photo.${ext}`;
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


