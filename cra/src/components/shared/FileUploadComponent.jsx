// src/components/shared/FileUploadComponent.jsx

import React, { useState, useRef } from 'react';
import { Upload, File, X, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useAppContext } from '../../contexts/AppContext';
import { uploadFile, getFilePreviewUrl } from '../../services/fileUpload';

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

  // Process the file
  const handleFile = async (selectedFile) => {
    setFile(selectedFile);
    setIsProcessing(true);
    setError('');
    setUploadProgress(0);
    
    try {
      // Determine file type
      const fileType = getFileType(selectedFile);
      
      // Create file preview URL for immediate display
      const previewUrl = getFilePreviewUrl(selectedFile);
      
      // Extract metadata from file
      const metadata = await extractMetadata(selectedFile, fileType);
      
      // Upload the file to the server if the user is authenticated
      let uploadedFileInfo = null;
      if (currentUser && currentUser.email) {
        try {
          const uploadResult = await uploadFile(currentUser.email, selectedFile);
          uploadedFileInfo = uploadResult.file;
          setUploadProgress(100);
        } catch (uploadError) {
          console.error('Error uploading file:', uploadError);
          // Continue with local file handling if upload fails
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
        ...metadata
      };
      
      // Add server file info if available
      if (uploadedFileInfo) {
        creationData.fileUrl = uploadedFileInfo.url;
        creationData.gcsUrl = uploadedFileInfo.gcsUrl;
        creationData.originalName = uploadedFileInfo.originalName;
      }
      
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

  // Extract metadata from file
  const extractMetadata = async (file, fileType) => {
    const metadata = {};
    
    switch (fileType) {
      case 'Image':
        // Extract image dimensions
        try {
          const dimensions = await getImageDimensions(file);
          metadata.dimensions = dimensions;
        } catch (error) {
          console.error('Error getting image dimensions:', error);
        }
        break;
        
      case 'Music':
      case 'Video':
        // Duration could be extracted here with more advanced libraries
        // For now, we'll just note the file type
        metadata.format = file.type;
        break;
        
      case 'Text':
        // For text files, we could extract preview content
        if (file.type === 'text/plain' || file.type === 'text/markdown') {
          try {
            const textPreview = await readTextFilePreview(file);
            metadata.textPreview = textPreview;
          } catch (error) {
            console.error('Error reading text file:', error);
          }
        }
        break;
        
      default:
        // No specific metadata for other types
        break;
    }
    
    return metadata;
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

  // Clear selected file
  const clearFile = () => {
    setFile(null);
    setUploadProgress(0);
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUploadComponent;