// server/index.js - Updated with improved GCS folder structure

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

// Add this to server/index.js
const instagramService = require('./services/instagramService');

// Instagram API endpoint
app.get('/api/instagram/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const posts = await instagramService.fetchInstagramPosts(username);
    res.status(200).json(posts);
  } catch (error) {
    console.error('Error handling Instagram request:', error);
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
app.post('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = req.body;
    
    console.log(`Saving user data for user ${userId}...`);
    
    await handleStorageOperation(async () => {
      const bucket = storage.bucket(BUCKET_NAME);
      const file = bucket.file(`users/${userId}/profile/info.json`);
      
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
      const file = bucket.file(`users/${userId}/profile/info.json`);
      
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
      // Clean up the uploaded file
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Only image files are allowed for profile photos' });
    }
    
    // Create file info object
    const fileInfo = {
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path
    };
    
    // Upload to Google Cloud Storage
    if (storage) {
      try {
        const bucket = storage.bucket(BUCKET_NAME);
        const gcsFilePath = `users/${userId}/profile/photo.${path.extname(file.filename).substring(1)}`;
        
        // Upload to GCS
        await bucket.upload(file.path, {
          destination: gcsFilePath,
          metadata: {
            contentType: file.mimetype,
            cacheControl: 'no-cache, max-age=0'
          },
          public: true
        });
        
        // Generate public URL
        const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${gcsFilePath}`;
        fileInfo.gcsUrl = publicUrl;
        fileInfo.url = publicUrl;
        
        // Clean up local file after successful upload
        fs.unlinkSync(file.path);
        
        // Update user data with the new profile photo URL
        try {
          const userInfoFile = bucket.file(`users/${userId}/profile/info.json`);
          const [exists] = await userInfoFile.exists();
          
          if (exists) {
            const [content] = await userInfoFile.download();
            const userData = JSON.parse(content.toString());
            
            // Update the photo URL
            userData.photoUrl = publicUrl;
            
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
        // Fall back to local file URL if GCS upload fails
        const localUrl = `/uploads/${userId}/profile/${file.filename}`;
        fileInfo.url = localUrl;
      }
    } else {
      // If no GCS, use local file path
      const localUrl = `/uploads/${userId}/profile/${file.filename}`;
      fileInfo.url = localUrl;
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