// src/components/pages/UploadCreation.jsx
import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from 'lucide-react';
import { useToast } from '../ui/use-toast';
import { useAppContext } from '../../contexts/AppContext';
import { storage } from '../../services/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { generateCreationRightsId } from '../../services/metadataExtraction';
import { generateVideoThumbnail } from '../../services/fileUpload';


const UploadCreation = () => {
  const { currentUser, setActiveView, setIsLoading, handleSubmit } = useAppContext();
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  // Form state
  const [title, setTitle] = useState('');
  const [photographer, setPhotographer] = useState('');
  const [style, setStyle] = useState('');
  const [createdDate, setCreatedDate] = useState('');
  const [description, setDescription] = useState('');
  const [collection, setCollection] = useState('');
  const [rightsHolder, setRightsHolder] = useState('');
  const [licensingCost, setLicensingCost] = useState('');
  const [rights, setRights] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Handle file selection

  const uploadWithProgress = (file, userId, creationRightsId, formData) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // If formData is not provided, create it
      if (!formData) {
        formData = new FormData();
        formData.append('file', file);
        formData.append('creationRightsId', creationRightsId);
      }
      
      const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
      xhr.open('POST', `${API_URL}/api/users/${userId}/upload`, true);
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress(progress);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });
      
      xhr.send(formData);
    });
  };
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    // Check if it's an image or video
    if (!selectedFile.type.startsWith('image/') && !selectedFile.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image or video file.",
        variant: "destructive"
      });
      return;
    }
    
    setFile(selectedFile);
    
    // Create a preview URL
    const previewURL = URL.createObjectURL(selectedFile);
    setFilePreview(previewURL);
  };
  

  // Handle form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive"
      });
      return;
    }
    
    if (!title || !photographer || !createdDate || !rightsHolder) {
      toast({
        title: "Missing required fields",
        description: "Please fill out all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    setIsLoading(true);
    
    try {
      // Generate a unique ID for this creation
      const creationRightsId = generateCreationRightsId();
      
      // Check if this is a video file and generate a thumbnail if needed
      let thumbnailDataUrl = null;
      if (file.type.startsWith('video/')) {
        try {
          setUploadProgress(5);
          thumbnailDataUrl = await generateVideoThumbnail(file);
          setUploadProgress(15);
        } catch (thumbnailError) {
          console.error("Error generating video thumbnail:", thumbnailError);
          // Continue without thumbnail
        }
      }
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('creationRightsId', creationRightsId);
      formData.append('userId', currentUser.uid);
      
      // If we have a thumbnail, add it to the form data
      if (thumbnailDataUrl) {
        formData.append('thumbnail', thumbnailDataUrl);
      }
      
      // Upload to server endpoint
      const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
      
      try {
        // Upload with progress tracking
        const uploadResult = await uploadWithProgress(file, currentUser.uid, creationRightsId, formData);
        const fileUrl = `${API_URL}/api/users/${currentUser.uid}/${creationRightsId}/download`;
        
        // Process tags
        const tagArray = tags.split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0);
        
        // Create creation object with metadata
        const newCreation = {
          id: creationRightsId,
          title,
          type: file.type.startsWith('video/') ? "Video" : "Image",
          dateCreated: new Date().toISOString().split('T')[0],
          rights,
          notes: description,
          licensingCost: licensingCost !== '' ? parseFloat(licensingCost) : null,
          tags: tagArray,
          fileUrl: fileUrl, // Use the proxy URL
          thumbnailUrl: file.type.startsWith('video/') ? 
                        `${API_URL}/api/users/${currentUser.uid}/${creationRightsId}/thumbnail` : 
                        fileUrl, // For videos, use a dedicated thumbnail URL
          status: 'draft',
          createdBy: currentUser.email,
          metadata: {
            category: file.type.startsWith('video/') ? "Video" : "Photography",
            creationRightsId,
            photographer,
            createdDate,
            style,
            collection,
            rightsHolders: rightsHolder,
            dimensions: "Original", // This could be determined from the image/video
            uploadedBy: currentUser.email,
            originalGcsUrl: uploadResult.file.gcsUrl || uploadResult.file.url, // Store original URL as backup
          }
        };
        
        // Save to Firestore via AppContext
        const success = await handleSubmit(newCreation);
        if (success) {
          toast({
            title: "Creation uploaded",
            description: "Your creation has been uploaded successfully.",
            variant: "default"
          });
          
          // Make sure we're explicitly redirecting to 'myCreations' view
          setActiveView('myCreations');
        }
      } catch (uploadError) {
        console.error("Upload error:", uploadError);
        toast({
          title: "Upload failed",
          description: uploadError.message || "Failed to upload file. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: error.message || "An error occurred during upload. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setIsLoading(false);
    }
  };
  

  // Cancel and go back
  const handleCancel = () => {
    // Clean up file preview URL
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setActiveView('myCreations');
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="upload-creation">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Upload New Creation</h1>
        <p className="text-gray-500">Upload a new photography work and add metadata</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Creation Details</CardTitle>
          <CardDescription>
            Fill in the details about your work. Fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFormSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <Label htmlFor="file">Image Or Video File (500MB Limit) *</Label>
                <div className="mt-2 flex items-center gap-4">
                <input
                    type="file"
                    id="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,video/*"  // Now allows both images and videos
                  />
                                    <Button 
                    type="button" 
                    onClick={triggerFileInput}
                    variant={filePreview ? "outline" : "default"}
                  >
                    {filePreview ? "Change File" : "Select File"}
                  </Button>
                  {file && (
                    <span className="text-sm text-gray-500">
                      {file.name} ({Math.round(file.size / 1024)} KB)
                    </span>
                  )}
                </div>
                {filePreview && (
  <div className="mt-4 relative">
    {file?.type.startsWith('image/') ? (
      <img 
        src={filePreview} 
        alt="Preview" 
        className="max-h-60 max-w-full rounded-md object-contain border border-gray-200"
      />
    ) : file?.type.startsWith('video/') ? (
      <video 
        src={filePreview} 
        controls
        className="max-h-60 max-w-full rounded-md object-contain border border-gray-200"
      />
    ) : null}
  </div>
)}
                {filePreview && file?.type.startsWith('video/') && (
  <div className="mt-4 relative">
    <video 
      src={filePreview} 
      controls
      className="max-h-60 max-w-full rounded-md object-contain border border-gray-200"
    />
  </div>
)}
                
                {isUploading && (
                  <div className="mt-4">
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Uploading: {Math.round(uploadProgress)}%
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="photographer">Photographer *</Label>
                <Input
                  id="photographer"
                  value={photographer}
                  onChange={(e) => setPhotographer(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="style">Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Portrait">Portrait</SelectItem>
                    <SelectItem value="Landscape">Landscape</SelectItem>
                    <SelectItem value="Wildlife">Wildlife</SelectItem>
                    <SelectItem value="Street">Street</SelectItem>
                    <SelectItem value="Architectural">Architectural</SelectItem>
                    <SelectItem value="Abstract">Abstract</SelectItem>
                    <SelectItem value="Documentary">Documentary</SelectItem>
                    <SelectItem value="Still Life">Still Life</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="createdDate">Created Date *</Label>
                <div className="relative mt-1">
                  <Input
                    id="createdDate"
                    type="date"
                    value={createdDate}
                    onChange={(e) => setCreatedDate(e.target.value)}
                    required
                  />
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>
              
              <div>
                <Label htmlFor="collection">Collection</Label>
                <Input
                  id="collection"
                  value={collection}
                  onChange={(e) => setCollection(e.target.value)}
                  className="mt-1"
                  placeholder="e.g. Urban Landscapes 2025"
                />
              </div>
              
              <div>
                <Label htmlFor="rightsHolder">Rights Holder *</Label>
                <Input
                  id="rightsHolder"
                  value={rightsHolder}
                  onChange={(e) => setRightsHolder(e.target.value)}
                  className="mt-1"
                  placeholder="e.g. Your Name Photography LLC"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="licensingCost">Licensing Cost ($)</Label>
                <Input
                  id="licensingCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={licensingCost}
                  onChange={(e) => setLicensingCost(e.target.value)}
                  className="mt-1"
                  placeholder="e.g. 299.99"
                />
              </div>
              
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="mt-1"
                  placeholder="e.g. landscape, sunset, mountains"
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="rights">Rights Statement</Label>
                <Textarea
                  id="rights"
                  value={rights}
                  onChange={(e) => setRights(e.target.value)}
                  className="mt-1"
                  rows={2}
                  placeholder="e.g. © 2025 John Doe. All rights reserved."
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1"
                  rows={4}
                  placeholder="Describe your work..."
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUploading || !file || !title}
              >
                {isUploading ? "Uploading..." : "Upload Creation"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadCreation;