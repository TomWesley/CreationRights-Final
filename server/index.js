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


// Load environment variables
dotenv.config();

const corsOptions = {
  origin: '*', // In production, you should restrict this
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'X-Content-Type-Options'],
  credentials: true,
  maxAge: 86400 // 1 day in seconds
};

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Configure middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(bodyParser.json());

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
app.get('/api/instagram/:username', async (req, res) => {
  try {
    // Set JSON response type explicitly
    res.setHeader('Content-Type', 'application/json');
    
    const { username } = req.params;
    
    // Normalize the username (remove @ if present)
    const normalizedUsername = username.startsWith('@') ? username.substring(1) : username;
    
    console.log(`Processing Instagram request for username: ${normalizedUsername}`);
    
    // Set a longer timeout for the request to avoid abrupt disconnections
    req.setTimeout(120000); // 2 minute timeout
    
    // Attempt to fetch posts
    let posts;
    try {
      posts = await instagramService.fetchInstagramPosts(normalizedUsername);
    } catch (fetchError) {
      console.error('Error fetching Instagram posts:', fetchError);
      // Send a proper JSON error response, not HTML
      return res.status(500).json({
        error: 'Instagram API Error',
        message: fetchError.message || 'Failed to fetch Instagram posts. Please try again later.'
      });
    }
    
    // Check that we actually got valid data
    if (!posts || !Array.isArray(posts)) {
      console.error('Invalid posts data returned:', posts);
      return res.status(500).json({
        error: 'Invalid response from Instagram service',
        message: 'Failed to retrieve posts data. Please try again later.'
      });
    }
    
    // Send the response as JSON (this is important!)
    return res.json(posts);
  } catch (error) {
    console.error('Error handling Instagram request:', error);
    // Provide a more user-friendly error message
    return res.status(500).json({ 
      error: error.message,
      message: 'Failed to fetch Instagram posts. The account may be private or Instagram may be limiting requests. Please try again in a few minutes.'
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
app.post('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = req.body;
    
    console.log(`Saving user data for user ${userId}...`);
    console.log('Path params:', req.params);
    console.log('Request body:', JSON.stringify(userData).substring(0, 200) + '...');
    
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
    
    console.log(`Saving creations for user ${userId}...`);
    
    await handleStorageOperation(async () => {
      const bucket = storage.bucket(BUCKET_NAME);
      const file = bucket.file(`users/${userId}/creations/metadata/all.json`);
      
      await file.save(JSON.stringify(creations), {
        contentType: 'application/json'
      });
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving creations:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:userId/creations', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const creations = await handleStorageOperation(async () => {
      const bucket = storage.bucket(BUCKET_NAME);
      const file = bucket.file(`users/${userId}/creations/metadata/all.json`);
      
      const [exists] = await file.exists();
      if (!exists) return null;
      
      const [content] = await file.download();
      return JSON.parse(content.toString());
    });
    
    if (!creations) {
      return res.status(404).json({ error: 'Creations not found' });
    }
    
    res.status(200).json(creations);
  } catch (error) {
    console.error('Error loading creations:', error);
    res.status(500).json({ error: error.message });
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
app.post('/api/users/:userId/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const userId = req.params.userId;
    const file = req.file; // This is now in memory, not on disk
    const contentType = file.mimetype;
    
    // Get creationRightsId from form data
    const creationRightsId = req.body.creationRightsId || `CR-${Date.now()}`;
    
    // Create file info object
    const fileInfo = {
      originalName: file.originalname,
      filename: file.originalname, // Use original name since we don't have a disk filename
      mimetype: contentType,
      size: file.size,
      creationRightsId: creationRightsId
    };
    
    // Upload to Google Cloud Storage
    if (storage) {
      try {
        const gcsFilePath = `users/${userId}/creations/assets/${creationRightsId}/${file.originalname}`;
        const bucket = storage.bucket(BUCKET_NAME);
        const gcsFile = bucket.file(gcsFilePath);
        
        // Create a writable stream to GCS
        const stream = gcsFile.createWriteStream({
          metadata: {
            contentType: contentType,
            cacheControl: 'no-cache, max-age=0'
          },
          public: true
        });
        
        // Handle errors and completion
        const streamPromise = new Promise((resolve, reject) => {
          stream.on('error', (err) => {
            reject(err);
          });
          
          stream.on('finish', () => {
            // Get the public URL
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
        
        console.log(`File uploaded successfully to GCS: ${fileInfo.gcsUrl}`);
      } catch (gcsError) {
        console.error('Error uploading to GCS:', gcsError);
        // Handle error but no local file to fall back to
        return res.status(500).json({ error: 'Failed to upload to cloud storage' });
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
    console.error('File upload error:', error);
    res.status(500).json({ error: error.message });
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
      const path = `users/${userId}/profile/photo.${ext}`;
      const file = bucket.file(path);
      const [exists] = await file.exists();
      
      if (exists) {
        photoPath = path;
        photoFile = file;
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