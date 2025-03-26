// server/index.js

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer');
const fs = require('fs');

// Load environment variables
dotenv.config();


const corsOptions = {
  origin: '*', // In production, you might want to restrict this
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
// Apply CORS middleware with options
app.use(cors(corsOptions));

// Also add an OPTIONS handler for preflight requests
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
const USER_DATA_PREFIX = 'users/';
const FOLDERS_PREFIX = 'folders/';
const CREATIONS_PREFIX = 'creations/';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create user directory if it doesn't exist
    const userId = req.params.userId;
    const userDir = path.join(uploadsDir, userId);
    
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    
    cb(null, userDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

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
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// User data endpoints
app.post('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = req.body;
    
    console.log(`Saving user data for user ${userId}...`);
    
    await handleStorageOperation(async () => {
      const bucket = storage.bucket(BUCKET_NAME);
      const file = bucket.file(`${USER_DATA_PREFIX}${userId}.json`);
      
      await file.save(JSON.stringify(userData), {
        contentType: 'application/json',
        metadata: {
          cacheControl: 'private, max-age=0'
        }
      });
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
    
    const userData = await handleStorageOperation(async () => {
      const bucket = storage.bucket(BUCKET_NAME);
      const file = bucket.file(`${USER_DATA_PREFIX}${userId}.json`);
      
      const [exists] = await file.exists();
      if (!exists) return null;
      
      const [content] = await file.download();
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
      const file = bucket.file(`${FOLDERS_PREFIX}${userId}.json`);
      
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
      const file = bucket.file(`${FOLDERS_PREFIX}${userId}.json`);
      
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
      const file = bucket.file(`${CREATIONS_PREFIX}${userId}.json`);
      
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
      const file = bucket.file(`${CREATIONS_PREFIX}${userId}.json`);
      
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

// Upload endpoint
// Enhanced file handling based on content type
// In server/index.js - Replace or update the file upload endpoint

// In server/index.js - Update the file upload endpoint

// Modify the upload endpoint in server/index.js
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.post('/api/users/:userId/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const userId = req.params.userId;
    const file = req.file;
    const contentType = file.mimetype;
    
    // Get creationRightsId from form data
    const creationRightsId = req.body.creationRightsId || `CR-${Date.now()}`;
    
    console.log(`Processing upload for user ${userId}, file type: ${contentType}, creationRightsId: ${creationRightsId}`);
    console.log('GCS bucket name:', BUCKET_NAME);
    
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
        // Create appropriate path in GCS
        const gcsFilePath = `creationcardassets/${creationRightsId}/${file.filename}`;
        console.log(`Attempting to upload to path: ${gcsFilePath}`);
        
        const bucket = storage.bucket(BUCKET_NAME);
        
        // Upload the file to GCS
        await bucket.upload(file.path, {
          destination: gcsFilePath,
          metadata: {
            contentType: contentType,
            // Set cache control to prevent caching issues
            cacheControl: 'no-cache, max-age=0'
          },
          // Make the file publicly accessible
          public: true
        });
        
        // Get the public URL
        const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${gcsFilePath}`;
        console.log(`File uploaded successfully to GCS: ${publicUrl}`);
        
        // Add URL to the response
        fileInfo.gcsUrl = publicUrl;
        fileInfo.url = publicUrl; // Use GCS URL as primary URL
        
        // Clean up local file after successful upload
        fs.unlinkSync(file.path);
        console.log(`Local file deleted: ${file.path}`);
      } catch (gcsError) {
        console.error('Error uploading to GCS:', gcsError);
        console.error(gcsError.stack);
        // Fall back to local file URL if GCS upload fails
        const localUrl = `/uploads/${userId}/${file.filename}`;
        fileInfo.url = localUrl;
        console.log(`Falling back to local URL: ${localUrl}`);
      }
    } else {
      // If no GCS, use local file path
      const localUrl = `/uploads/${userId}/${file.filename}`;
      fileInfo.url = localUrl;
      console.log(`Using local file URL: ${localUrl}`);
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

// Add endpoint to get all published creations for agency view
app.get('/api/published-creations', async (req, res) => {
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const [files] = await bucket.getFiles({ prefix: CREATIONS_PREFIX });
    
    const allCreations = [];
    
    // Process each file (each user's creations)
    for (const file of files) {
      try {
        const [content] = await file.download();
        const userCreations = JSON.parse(content.toString());
        
        // Filter for published creations only (assuming isPublished flag exists)
        const publishedCreations = userCreations.filter(creation => creation.isPublished);
        
        if (publishedCreations.length > 0) {
          allCreations.push(...publishedCreations);
        }
      } catch (err) {
        console.error(`Error processing file ${file.name}:`, err);
        // Continue with other files even if one fails
      }
    }
    
    res.status(200).json(allCreations);
  } catch (error) {
    console.error('Error loading published creations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to list all files in the bucket
app.get('/api/debug/list-files', async (req, res) => {
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const [files] = await bucket.getFiles();
    
    const fileList = files.map(file => ({
      name: file.name,
      size: file.metadata.size,
      updated: file.metadata.updated,
      timeCreated: file.metadata.timeCreated
    }));
    
    res.status(200).json({
      bucket: BUCKET_NAME,
      totalFiles: fileList.length,
      files: fileList
    });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to view the contents of a specific file
app.get('/api/debug/view-file', async (req, res) => {
  try {
    const { filename } = req.query;
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }
    
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(filename);
    
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const [content] = await file.download();
    const data = JSON.parse(content.toString());
    
    res.status(200).json({
      filename,
      data
    });
  } catch (error) {
    console.error('Error viewing file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to clear a specific file
app.get('/api/debug/clear-file', async (req, res) => {
  try {
    const { filename } = req.query;
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }
    
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(filename);
    
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    await file.delete();
    
    res.status(200).json({
      message: `File ${filename} has been deleted`,
      success: true
    });
  } catch (error) {
    console.error('Error clearing file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint to verify GCS functionality
app.get('/api/test-storage', async (req, res) => {
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file('test.json');
    
    console.log('Testing storage with test.json...');
    
    await file.save(JSON.stringify({ test: 'data', timestamp: new Date().toISOString() }), {
      contentType: 'application/json'
    });
    
    console.log('Test file saved successfully');
    
    res.status(200).json({ success: true, message: 'Test file created in bucket' });
  } catch (error) {
    console.error('Storage test error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users/:userId/profile-photo', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const userId = req.params.userId;
    const file = req.file;
    
    // Only allow image files for profile photos
    if (!file.mimetype.startsWith('image/')) {
      // Clean up the uploaded file
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Only image files are allowed for profile photos' });
    }
    
    // Create file URL
    const fileUrl = `/uploads/${userId}/profile/${file.filename}`;
    
    // Ensure the profile directory exists
    const profileDir = path.join(uploadsDir, userId, 'profile');
    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
    }
    
    // Move the file to the profile directory
    const profilePath = path.join(profileDir, file.filename);
    fs.renameSync(file.path, profilePath);
    
    // Get file metadata
    const fileInfo = {
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      path: profilePath,
      url: fileUrl
    };
    
    // Store in GCS if available
    if (storage) {
      try {
        const bucket = storage.bucket(BUCKET_NAME);
        const gcsFilePath = `profiles/${userId}/${file.filename}`;
        
        // Upload to GCS
        await bucket.upload(profilePath, {
          destination: gcsFilePath,
          metadata: {
            contentType: file.mimetype
          }
        });
        
        // Generate public URL
        fileInfo.gcsUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${gcsFilePath}`;
        
        // Clean up local file after successful upload
        fs.unlinkSync(profilePath);
      } catch (error) {
        console.error('GCS upload error:', error);
        // We'll still return success with the local file info
      }
    }
    
    // Update user data with the new profile photo URL
    try {
      const userDataFile = bucket.file(`${USER_DATA_PREFIX}${userId}.json`);
      const [exists] = await userDataFile.exists();
      
      if (exists) {
        const [content] = await userDataFile.download();
        const userData = JSON.parse(content.toString());
        
        // Update the photo URL
        userData.photoUrl = fileInfo.gcsUrl || fileInfo.url;
        
        // Save the updated user data
        await userDataFile.save(JSON.stringify(userData), {
          contentType: 'application/json'
        });
      }
    } catch (error) {
      console.error('Error updating user data with profile photo:', error);
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
// Serve uploaded files with proper CORS headers
app.use('/uploads', (req, res, next) => {
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