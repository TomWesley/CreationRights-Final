// src/components/pages/FileUploadPage.jsx

import React, { useState, useRef } from 'react';
import { ArrowLeft, Upload, Check, X, AlertCircle, DollarSign, Info } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useAppContext } from '../../contexts/AppContext';

import { 
  uploadFile, 
  saveCreationMetadata, 
  generateCreationRightsId 
} from '../../services/fileUploadService';

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

// Function to map file type to category
const mapTypeToCategory = (fileType) => {
  switch (fileType.toLowerCase()) {
    case 'image':
      return 'Photography';
    case 'music':
      return 'Audio';
    case 'text':
      return 'Literature';
    case 'video':
      return 'Video';
    default:
      return fileType;
  }
};

// Generate a unique creation rights ID
// const generateCreationRightsId = () => {
//   return `CR-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
// };

const FileUploadPage = () => {
  const { setActiveView, setCurrentCreation, currentUser } = useAppContext();
  
  // State for file selection and upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle', 'uploading', 'success', 'error'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  
  // State for metadata fields
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [dateCreated, setDateCreated] = useState(new Date().toISOString().split('T')[0]);
  const [rights, setRights] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  
  // State for licensing
  const [showLicensingInfo, setShowLicensingInfo] = useState(false);
  const [licensingCost, setLicensingCost] = useState('');
  
  // Reference for file input
  const fileInputRef = useRef(null);
  
  // Generate a unique creation rights ID for this upload
  const [creationRightsId] = useState(generateCreationRightsId());
  
  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
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
      handleFileSelection(e.target.files[0]);
    }
  };

  // Process the file selection
  const handleFileSelection = (file) => {
    setSelectedFile(file);
    
    // Create file preview URL
    const previewUrl = URL.createObjectURL(file);
    setFilePreview(previewUrl);
    
    // Set default title from filename (without extension)
    const fileName = file.name.split('.');
    fileName.pop(); // Remove extension
    setTitle(fileName.join('.'));
    
    // Set file type based on mime type
    const mimeType = file.type.toLowerCase();
    const fileType = fileTypeMappings[mimeType] || 
                   (mimeType.startsWith('image/') ? 'Image' : 
                    mimeType.startsWith('audio/') ? 'Music' :
                    mimeType.startsWith('video/') ? 'Video' :
                    mimeType.startsWith('text/') ? 'Text' : 'Other');
    setType(fileType);
    
    // Add file type as a default tag
    setTags([fileType.toLowerCase()]);
    
    // Reset error state
    setErrorMessage('');
    setUploadStatus('idle');
  };

  // Handle tag input
  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim().toLowerCase())) {
        setTags([...tags, tagInput.trim().toLowerCase()]);
      }
      setTagInput('');
    }
  };

  // Remove a tag
  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  // Handle licensing cost change
  const handleLicensingCostChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and a single decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setLicensingCost(value);
    }
  };

  // Clear selected file
  const clearFile = () => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setSelectedFile(null);
    setFilePreview(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    setErrorMessage('');
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setErrorMessage('Please select a file to upload');
      return;
    }
    
    setUploadStatus('uploading');
    setUploadProgress(10);
    
    try {
      // Create metadata object
      const metadata = {
        category: mapTypeToCategory(type),
        creationRightsId: creationRightsId
      };
      
      // Add extra metadata based on file type
      if (type === 'Image' || type === 'Photography') {
        // For images, we might add dimensions later
      } else if (type === 'Video') {
        // For videos, we might add duration later
      } else if (type === 'Music' || type === 'Audio') {
        // For audio, we might add duration later
      }
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('creationRightsId', creationRightsId);
      
      // Set up API URL
      const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
      const sanitizedUserId = currentUser.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
      
      // Upload the file
      setUploadProgress(30);
      console.log(`Uploading file to ${API_URL}/api/users/${sanitizedUserId}/upload`);
      
      const response = await fetch(`${API_URL}/api/users/${sanitizedUserId}/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Upload result:', result);
      
      setUploadProgress(70);
      
      // Create creation object with file data
      const creationData = {
        id: creationRightsId,
        title: title,
        type: type,
        dateCreated: dateCreated,
        rights: rights,
        notes: notes,
        licensingCost: licensingCost || null,
        tags: tags,
        fileSize: formatFileSize(selectedFile.size),
        fileType: selectedFile.type,
        fileName: selectedFile.name,
        filePreviewUrl: filePreview,
        status: 'draft', // Start as draft
        metadata: metadata
      };
      
      // Add server file info if available
      if (result.file) {
        creationData.fileUrl = result.file.gcsUrl || result.file.url;
        if (result.file.gcsUrl) {
          creationData.gcsUrl = result.file.gcsUrl;
        }
        creationData.originalName = result.file.originalName;
      }
      
      // Save metadata JSON to GCS
      const metadataResponse = await fetch(`${API_URL}/api/users/${sanitizedUserId}/creations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([creationData]) // API expects an array
      });
      
      if (!metadataResponse.ok) {
        throw new Error('Failed to save metadata');
      }
      
      setUploadProgress(100);
      setUploadStatus('success');
      
      // Set the current creation and navigate to the metadata completion page
      setCurrentCreation(creationData);
      
      // After a brief delay, navigate to the creations list
      setTimeout(() => {
        setActiveView('myCreations');
      }, 1500);
      
    } catch (error) {
      console.error('Upload error:', error);
      setErrorMessage(error.message || 'Error uploading file');
      setUploadStatus('error');
    }
  };

  // Render the appropriate view based on upload status
  const renderContent = () => {
    if (uploadStatus === 'success') {
      return (
        <div className="text-center py-8">
          <div className="bg-green-100 text-green-700 rounded-full p-4 inline-flex mb-4">
            <Check className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold mb-4">File Uploaded Successfully!</h2>
          <p className="mb-6">Your creation has been saved. Redirecting to your creations...</p>
        </div>
      );
    }
    
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Area */}
        {!selectedFile ? (
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
              <Button type="button" onClick={handleFileSelect} className="mt-2">
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
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-md flex items-center justify-center mr-3">
                <Upload className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                
                {uploadStatus === 'uploading' && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
              <button 
                type="button" 
                onClick={clearFile} 
                className="text-gray-400 hover:text-gray-600"
                disabled={uploadStatus === 'uploading'}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {uploadStatus === 'error' && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">Upload Failed</p>
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              </div>
            )}
            
            {/* File Preview */}
            {filePreview && selectedFile && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                {selectedFile.type.startsWith('image/') ? (
                  <img 
                    src={filePreview} 
                    alt="Preview" 
                    className="max-h-48 rounded-md border border-gray-200 object-contain"
                  />
                ) : selectedFile.type.startsWith('video/') ? (
                  <video 
                    src={filePreview} 
                    controls 
                    className="max-h-48 rounded-md w-full"
                  />
                ) : selectedFile.type.startsWith('audio/') ? (
                  <audio 
                    src={filePreview} 
                    controls 
                    className="w-full mt-2"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="text-sm">Preview not available for this file type</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Creation Metadata Form */}
        {selectedFile && (
          <div className="space-y-4 border-t pt-4 mt-4">
            <h3 className="text-lg font-medium">Creation Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title of your creation"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="type">Type *</Label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2"
                  required
                >
                  <option value="">Select type</option>
                  <option value="Image">Image</option>
                  <option value="Music">Music</option>
                  <option value="Video">Video</option>
                  <option value="Text">Text</option>
                  <option value="Software">Software</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="dateCreated">Date Created</Label>
                <Input
                  id="dateCreated"
                  type="date"
                  value={dateCreated}
                  onChange={(e) => setDateCreated(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="tags">Tags</Label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {tags.map(tag => (
                    <div 
                      key={tag} 
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <Input
                  id="tagInput"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="Add tags (press Enter after each tag)"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="rights">Rights Information</Label>
              <Textarea
                id="rights"
                value={rights}
                onChange={(e) => setRights(e.target.value)}
                placeholder="Copyright details, licensing terms, etc."
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional information about your creation"
                rows={3}
              />
            </div>
            
            {/* Licensing Cost Section */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <Label className="flex items-center">
                  <span className="mr-1">Licensing Information</span>
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => window.alert("Set a standard licensing cost or leave empty to allow custom pricing via email contact.")}
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </Label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowLicensingInfo(!showLicensingInfo)}
                  className="text-blue-600"
                >
                  {showLicensingInfo ? 'Remove Licensing Cost' : 'Add Licensing Cost'}
                </Button>
              </div>
              
              {showLicensingInfo && (
                <div className="p-4 bg-blue-50 rounded-md border border-blue-100">
                  <Label htmlFor="licensingCost" className="flex items-center text-blue-700 mb-2">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Standard Licensing Cost
                  </Label>
                  <div className="flex items-center">
                    <span className="text-lg font-medium mr-2">$</span>
                    <Input 
                      id="licensingCost"
                      value={licensingCost}
                      onChange={handleLicensingCostChange}
                      placeholder="0.00"
                      className="w-40"
                    />
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    Set a standard licensing cost or leave empty to allow custom pricing via email contact.
                  </p>
                </div>
              )}
            </div>
            
            <div className="hidden">
              <Label htmlFor="creationRightsId">Creation Rights ID</Label>
              <Input
                id="creationRightsId"
                value={creationRightsId}
                readOnly
              />
            </div>
            
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveView('myCreations')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={uploadStatus === 'uploading'}
                className={uploadStatus === 'uploading' ? 'opacity-70 cursor-not-allowed' : ''}
              >
                {uploadStatus === 'uploading' ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </span>
                ) : 'Upload Creation'}
              </Button>
            </div>
          </div>
        )}
      </form>
    );
  };

  return (
    <div className="file-upload-page">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Upload Creation</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setActiveView('myCreations')}
        >
          Cancel
        </Button>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default FileUploadPage;