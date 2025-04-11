// server/index.js 

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
  origin: '*', // In production, replace with your actual domain
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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


// Create file upload endpoint
app.post('/api/users/:userId/upload', upload.single('file'), async (req, res) => {
  // Define a structured logger that writes directly to stdout
  const log = (level, message, data = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message: message,
      data: data
    };
    
    // Write directly to stdout to ensure Cloud Run captures it
    process.stdout.write(JSON.stringify(logEntry) + '\n');
  };

  try {
    // Log basic request info
    log('info', 'Upload endpoint called', { 
      userId: req.params.userId,
      contentType: req.get('Content-Type'),
      contentLength: req.get('Content-Length')
    });

    if (!req.file) {
      log('error', 'No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const userId = req.params.userId;
    const file = req.file;
    const contentType = file.mimetype;
    const creationRightsId = req.body.creationRightsId || `CR-${Date.now()}`;
    
    log('info', 'File details received', {
      fileSize: file.size,
      fileName: file.originalname,
      fileMimetype: contentType,
      creationRightsId: creationRightsId
    });
    
    // Check if storage is initialized
    if (!storage) {
      log('error', 'Storage is not initialized');
      return res.status(500).json({ error: 'Cloud storage not available' });
    }
    
    try {
      // Get bucket reference
      const bucket = storage.bucket(BUCKET_NAME);
      log('info', 'Using storage bucket', { bucketName: BUCKET_NAME });
      
      // Path for the file
      const gcsFilePath = `Creations/${userId}/${creationRightsId}/${file.originalname}`;
      log('info', 'Target path determined', { path: gcsFilePath });
      
      // Test bucket access
      try {
        log('info', 'Testing bucket access');
        const [files] = await bucket.getFiles({ maxResults: 1 });
        log('info', 'Bucket access successful', { filesFound: files.length });
      } catch (bucketError) {
        log('error', 'Bucket access test failed', {
          errorMessage: bucketError.message,
          errorCode: bucketError.code,
          errorName: bucketError.name,
          stackTrace: bucketError.stack
        });
        
        return res.status(500).json({ 
          error: 'Failed to access storage bucket', 
          details: bucketError.message,
          code: bucketError.code || 'unknown'
        });
      }
      
      // Create file reference
      const gcsFile = bucket.file(gcsFilePath);
      log('info', 'Created file reference');
      
      // Create write stream
      log('info', 'Creating write stream');
      const stream = gcsFile.createWriteStream({
        metadata: {
          contentType: contentType,
          cacheControl: 'public, max-age=86400'
        },
        resumable: false
      });
      
      // Stream promise with detailed error reporting
      const streamPromise = new Promise((resolve, reject) => {
        stream.on('error', (err) => {
          log('error', 'Stream encountered error', {
            errorMessage: err.message,
            errorCode: err.code,
            errorName: err.name,
            stackTrace: err.stack
          });
          reject(err);
        });
        
        stream.on('finish', () => {
          log('info', 'Stream finished successfully');
          resolve();
        });
      });
      
      // Log before writing buffer
      log('info', 'Writing buffer to stream', { 
        bufferLength: file.buffer.length,
        bufferExists: !!file.buffer
      });
      
      // Write buffer to stream
      stream.end(file.buffer);
      
      // Wait for stream to complete
      log('info', 'Waiting for stream promise to resolve');
      await streamPromise;
      log('info', 'Stream promise resolved - file upload completed');
      
      // Generate public URL
      const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${gcsFilePath}`;
      log('info', 'Generated public URL', { url: publicUrl });
      
      // Return success response
      log('info', 'Returning success response');
      return res.status(200).json({
        success: true,
        file: {
          originalName: file.originalname,
          mimetype: contentType,
          size: file.size,
          creationRightsId,
          gcsUrl: publicUrl,
          url: publicUrl
        }
      });
    } catch (uploadError) {
      // Log detailed upload error
      log('error', 'Creation upload process failed', {
        errorMessage: uploadError.message,
        errorCode: uploadError.code || 'unknown',
        errorName: uploadError.name,
        stackTrace: uploadError.stack,
        // Additional context for debugging
        userId: userId,
        fileName: file?.originalname || 'unknown',
        fileSize: file?.size || 0
      });
      
      return res.status(500).json({ 
        error: 'Upload failed',
        message: uploadError.message,
        code: uploadError.code || 'unknown'
      });
    }
  } catch (error) {
    // Log main handler errors
    log('error', 'Main handler caught exception', {
      errorMessage: error.message,
      errorStack: error.stack,
      errorName: error.name,
      errorCode: error.code
    });
    
    res.status(500).json({ 
      error: 'Server error',
      message: error.message,
      code: error.code || 'unknown'
    });
  }
});
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
        
        // Use a consistent naming pattern for user profile photos
        const extension = path.extname(file.originalname) || '.jpg';
        const gcsFilePath = `ProfilePhotos/${userId}${extension}`;
        console.log(`Uploading profile photo to: ${gcsFilePath}`);
        
        // Create a file in the bucket
        const gcsFile = bucket.file(gcsFilePath);
        
        // Create a write stream
        const stream = gcsFile.createWriteStream({
          metadata: {
            contentType: file.mimetype,
            cacheControl: 'private, max-age=86400'  // 1 day cache, private
          },
          resumable: false  // For small files, this is faster
        });
        
        // Handle errors and completion
        const streamPromise = new Promise((resolve, reject) => {
          stream.on('error', (err) => {
            console.error('Error uploading profile photo to GCS:', err);
            reject(err);
          });
          
          stream.on('finish', async () => {
            try {
              // Get the file metadata to confirm upload
              const [metadata] = await gcsFile.getMetadata();
              console.log(`Upload successful, size: ${metadata.size} bytes, type: ${metadata.contentType}`);
              
              // Generate the proxy URL - this URL will never expire
              const proxyUrl = `${req.protocol}://${req.get('host')}/api/users/${userId}/profile-photo`;
              
              fileInfo.proxyUrl = proxyUrl;
              fileInfo.path = gcsFilePath;
              
              resolve();
            } catch (metaErr) {
              console.error('Error getting file metadata:', metaErr);
              reject(metaErr);
            }
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

// Delete user profile photo endpoint - updated for server proxy approach
app.delete('/api/users/:userId/profile-photo', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`Deleting profile photo for user ${userId}...`);
    
    if (!storage) {
      console.error('Storage client not initialized');
      return res.status(500).json({ error: 'Storage service unavailable' });
    }
    
    const bucket = storage.bucket(BUCKET_NAME);
    
    // Check for profile photo with various extensions
    const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    let photoPath = null;
    let photoFile = null;
    
    // Try to find the user's profile photo
    for (const ext of extensions) {
      const path = `ProfilePhotos/${userId}.${ext}`;
      console.log(`Checking for profile photo at: ${path}`);
      
      const file = bucket.file(path);
      const [exists] = await file.exists();
      
      if (exists) {
        photoPath = path;
        photoFile = file;
        console.log(`Found profile photo to delete at: ${path}`);
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
      
      res.status(200).json({ 
        success: true, 
        message: 'Profile photo deleted successfully',
        photoPath
      });
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
// Get user profile photo
/**
 * Profile photo proxy endpoint - streams photos directly from GCS
 * This provides a consistent URL that never expires
 */
app.get('/api/users/:userId/profile-photo', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    console.log(`Fetching profile photo for user ${userId}...`);
    
    // Check if GCS is initialized
    if (!storage) {
      console.error('Storage client not initialized');
      return res.status(500).json({ error: 'Storage service unavailable' });
    }
    
    const bucket = storage.bucket(BUCKET_NAME);
    
    // Check for profile photo with various extensions
    const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    let photoFile = null;
    let photoPath = null;
    
    // Try to find the user's profile photo
    for (const ext of extensions) {
      const path = `ProfilePhotos/${userId}.${ext}`;
      console.log(`Checking for profile photo at: ${path}`);
      
      const file = bucket.file(path);
      const [exists] = await file.exists();
      
      if (exists) {
        photoFile = file;
        photoPath = path;
        console.log(`Found profile photo at: ${path}`);
        break;
      }
    }
    
    if (!photoFile) {
      console.log(`No profile photo found for user ${userId}`);
      return res.status(404).json({ 
        error: 'Profile photo not found',
        message: 'No profile photo has been uploaded for this user'
      });
    }
    
    // Get the file's metadata to set the correct content type
    const [metadata] = await photoFile.getMetadata();
    res.setHeader('Content-Type', metadata.contentType);
    
    // Add cache control headers for better performance
    // Cache for 1 day in browser, but allow revalidation
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
    photoFile.createReadStream()
      .on('error', (err) => {
        console.error('Error streaming profile photo:', err);
        // Only send error if headers haven't been sent yet
        if (!res.headersSent) {
          res.status(500).json({
            error: 'Error retrieving profile photo',
            message: err.message
          });
        } else {
          // Otherwise just close the connection
          res.end();
        }
      })
      .pipe(res);
      
  } catch (error) {
    console.error('Error in profile photo proxy:', error);
    // Check if headers have been sent before attempting to send error response
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Error retrieving profile photo',
        message: error.message
      });
    } else {
      res.end();
    }
  }
});

// Add a simpler endpoint to get user profile photo URL
// Get profile photo URL endpoint
app.get('/api/users/:userId/profile-photo-url', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const bucket = storage.bucket(BUCKET_NAME);
    
    // Check for profile photo with various extensions
    const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    let photoPath = null;
    
    // Try user-specific photo
    for (const ext of extensions) {
      const path = `ProfilePhotos/${userId}.${ext}`;
      console.log(`Checking for profile photo at: ${path}`);
      
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



