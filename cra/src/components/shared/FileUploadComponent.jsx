// Improved FileUploadComponent.jsx

import React, { useState, useRef } from 'react';
import { Upload, File, X, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useAppContext } from '../../contexts/AppContext';
import { uploadFile, getFilePreviewUrl, extractUrlFromText, generateVideoThumbnail, getAudioMetadata } from '../../services/fileUpload';
import { generateCreationRightsId } from '../../services/metadataExtraction';

const FileUploadComponent = ({ onFileProcessed }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  
  const { currentUser } = useAppContext();

  // File types mapping
  const fileTypeMappings = {
    // Images
    'image/jpeg': 'Image',
    'image/png': 'Image',
    'image/gif': 'Image',
    'image/webp': 'Image',
    'image/svg+xml': 'Image',
    
    // Audio
    'audio/mpeg': 'Music',
    'audio/wav': 'Music',
    'audio/ogg': 'Music',
    'audio/flac': 'Music',
    'audio/x-m4a': 'Music',
    
    // Video
    'video/mp4': 'Video',
    'video/webm': 'Video',
    'video/ogg': 'Video',
    'video/quicktime': 'Video',
    
    // Text
    'text/plain': 'Text',
    'text/html': 'Text',
    'text/markdown': 'Text',
    
    // Documents
    'application/pdf': 'Text',
    'application/msword': 'Text',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Text',
    
    // Code
    'application/json': 'Software',
    'text/javascript': 'Software',
    'text/css': 'Software',
    'application/xml': 'Software',
    'text/x-python': 'Software',
    'text/x-java': 'Software',
    
    // Other
    'application/zip': 'Other',
    'application/x-rar-compressed': 'Other'
  };

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Handle file selection via button
  const handleFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  // Helper function to convert data URL to Blob
  const dataURLToBlob = (dataURL) => {
    const parts = dataURL.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    
    return new Blob([uInt8Array], { type: contentType });
  };

  

  // Process the file
  const handleFile = async (selectedFile) => {
    setFile(selectedFile);
    setIsProcessing(true);
    setError('');
    setUploadProgress(0);
    
    try {
      // Determine file type
      const fileType = getFileType(selectedFile);
      
      console.log(`Processing ${fileType} file: ${selectedFile.name}`);
      
      // Create file preview URL for immediate display
      const previewUrl = getFilePreviewUrl(selectedFile);
      
      // Generate a CreationRights ID early in the process
      const creationRightsId = generateCreationRightsId();
      console.log(`Generated CreationRights ID: ${creationRightsId}`);
      
      // Initialize metadata and capture file info
      const metadata = {
        category: mapTypeToMetadataCategory(fileType),
        creationRightsId: creationRightsId
      };
      
      console.log('Initial metadata:', metadata);
      
      // Process based on file type
      if (fileType === 'Image' || fileType === 'Photography') {
        // For images, extract dimensions
        try {
          const dimensions = await getImageDimensions(selectedFile);
          metadata.dimensions = dimensions;
        } catch (error) {
          console.error('Error getting image dimensions:', error);
        }
      } 
      else if (fileType === 'Video') {
        // For videos, generate a thumbnail
        try {
          console.log('Generating video thumbnail...');
          const thumbnailDataUrl = await generateVideoThumbnail(selectedFile);
          
          // Convert data URL to blob for upload
          const thumbnailBlob = dataURLToBlob(thumbnailDataUrl);
          const thumbnailFile = new File(
            [thumbnailBlob], 
            `thumb_${creationRightsId}.jpg`, 
            { type: 'image/jpeg' }
          );
          
          // Upload thumbnail with the same creationRightsId
          if (currentUser && currentUser.email) {
            const thumbnailResult = await uploadFile(currentUser.email, thumbnailFile, creationRightsId);
            metadata.thumbnailUrl = thumbnailResult.file.gcsUrl || thumbnailResult.file.url;
            console.log('Thumbnail uploaded:', metadata.thumbnailUrl);
          } else {
            // If not logged in, store the data URL temporarily
            metadata.thumbnailUrl = thumbnailDataUrl;
          }
        } catch (error) {
          console.error('Error generating video thumbnail:', error);
        }
      } 
      else if (fileType === 'Music' || fileType === 'Audio') {
        // For audio, get duration and other metadata
        try {
          console.log('Extracting audio metadata...');
          const audioMetadata = await getAudioMetadata(selectedFile);
          Object.assign(metadata, audioMetadata);
        } catch (error) {
          console.error('Error extracting audio metadata:', error);
        }
      }
      else if (fileType === 'Text' || fileType === 'Literature') {
        // For text files, extract preview and look for URLs
        if (selectedFile.type === 'text/plain' || selectedFile.type === 'text/markdown') {
          try {
            const textPreview = await readTextFilePreview(selectedFile);
            metadata.textPreview = textPreview;
            
            // Look for URLs in the text
            const sourceUrl = extractUrlFromText(textPreview);
            if (sourceUrl) {
              metadata.sourceUrl = sourceUrl;
            }
          } catch (error) {
            console.error('Error reading text file:', error);
          }
        }
      }
      
      // Upload the file to the server if the user is authenticated
      let uploadedFileInfo = null;
    if (currentUser && currentUser.email) {
      try {
        console.log('Uploading file to server with creationRightsId:', creationRightsId);
        console.log('User email:', currentUser.email);
        setUploadProgress(10); // Show some initial progress
        
        // Perform the upload with retries
        const uploadResult = await retryWithBackoff(
          async () => uploadFile(currentUser.email, selectedFile, creationRightsId),
          3,  // max retries
          1000 // initial delay in ms
        );
        
        if (!uploadResult || !uploadResult.file) {
          throw new Error('Upload failed - no file info returned');
        }
        
        uploadedFileInfo = uploadResult.file;
        console.log('Upload result:', uploadedFileInfo);
        setUploadProgress(100);
        
        // Verify the uploaded file exists in the bucket
        try {
          console.log('Verifying file in storage...');
          const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
          const sanitizedUserId = currentUser.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
          
          const verifyResponse = await fetch(
            `${API_URL}/api/files/check/${sanitizedUserId}/${creationRightsId}`
          );
          
          if (verifyResponse.ok) {
            const verifyResult = await verifyResponse.json();
            console.log('File verification result:', verifyResult);
            
            if (verifyResult.fileCount === 0) {
              console.warn('Warning: File was uploaded but not found in verification');
            } else {
              console.log(`Verification successful: ${verifyResult.fileCount} files found`);
            }
          }
        } catch (verifyError) {
          console.error('Error verifying file:', verifyError);
          // Continue even if verification fails
        }
      } catch (uploadError) {
        console.error('Error uploading file:', uploadError);
        setError(`Upload failed: ${uploadError.message}`);
        // If upload fails, we can still continue with the local file preview
      }
    }
      
      // Create creation object with file data
      const creationData = {
        title: selectedFile.name.split('.')[0], // Filename without extension
        type: fileType,
        dateCreated: new Date().toISOString().split('T')[0],
        rights: '',
        notes: '',
        folderId: '',
        tags: [fileType.toLowerCase()],
        fileSize: formatFileSize(selectedFile.size),
        fileType: selectedFile.type,
        fileName: selectedFile.name,
        filePreviewUrl: previewUrl,
        metadata: metadata  // Include metadata object
      };
      
      // Add server file info if available
      if (uploadedFileInfo) {
        creationData.fileUrl = uploadedFileInfo.gcsUrl || uploadedFileInfo.url;
        if (uploadedFileInfo.gcsUrl) {
          creationData.gcsUrl = uploadedFileInfo.gcsUrl;
        }
        creationData.originalName = uploadedFileInfo.originalName;
      }
      
      console.log('Final creation data:', creationData);
      
      // Call callback with processed data
      onFileProcessed(creationData, selectedFile);
      
    } catch (error) {
      console.error('Error processing file:', error);
      setError('Error processing file: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Determine content type based on file mimetype
  const getFileType = (file) => {
    const mimeType = file.type.toLowerCase();
    
    // Check for specific mapping
    if (fileTypeMappings[mimeType]) {
      return fileTypeMappings[mimeType];
    }
    
    // Check for generic type
    if (mimeType.startsWith('image/')) return 'Image';
    if (mimeType.startsWith('audio/')) return 'Music';
    if (mimeType.startsWith('video/')) return 'Video';
    if (mimeType.startsWith('text/')) return 'Text';
    
    return 'Other';
  };

  // Get image dimensions
  const getImageDimensions = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve(`${img.width}x${img.height}`);
        URL.revokeObjectURL(img.src); // Clean up
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  // Read text file preview (first few lines)
  const readTextFilePreview = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        // Get first 200 characters as preview
        const preview = content.substring(0, 200) + (content.length > 200 ? '...' : '');
        resolve(preview);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  // Helper function to map file types to metadata categories
  const mapTypeToMetadataCategory = (fileType) => {
    switch (fileType.toLowerCase()) {
      case 'image': return 'Photography';
      case 'music': return 'Audio';
      case 'text': return 'Literature';
      case 'video': return 'Video';
      default: return fileType;
    }
  };

  // Clear selected file
  const clearFile = () => {
    setFile(null);
    setUploadProgress(0);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="file-upload-container w-full">
      {!file ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            <Upload className="h-12 w-12 text-gray-400" />
            <div>
              <p className="text-lg font-medium text-gray-700">Drag & drop a file here</p>
              <p className="text-sm text-gray-500">or</p>
            </div>
            <Button onClick={handleFileSelect} className="mt-2">
              Browse Files
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              className="hidden"
            />
            <p className="text-xs text-gray-500 mt-2">
              Supports images, audio, video, text, and other file types
            </p>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-center">
            <File className="h-10 w-10 text-blue-500 mr-3" />
            <div className="flex-1">
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
              
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
              
              {uploadProgress === 100 && (
                <p className="text-xs text-green-500 mt-1">Upload complete</p>
              )}
            </div>
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            ) : (
              <button onClick={clearFile} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm mt-2">
              {error}
              <div className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleFile(file)}
                  className="text-red-600 hover:text-red-800"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUploadComponent;