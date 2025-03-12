// src/components/pages/FileUploadPage.jsx

import React, { useState } from 'react';
import { ArrowLeft, Upload, Check } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import FileUploadComponent from '../shared/FileUploadComponent';
import { useAppContext } from '../../contexts/AppContext';
import { extractMetadata } from '../../services/metadataExtraction';

const FileUploadPage = () => {
  const { setActiveView, setCurrentCreation, setEditMode } = useAppContext();
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // Handle when a file is processed successfully
  const handleFileProcessed = async (creationData, fileObject) => {
    try {
      // Extract metadata from the file
      const metadata = await extractMetadata(fileObject, creationData);
      
      // Set the current creation with the file data and metadata
      setCurrentCreation({
        ...creationData,
        // Add the initial metadata
        metadata,
        // Add the file object to store temporarily
        // This would be removed before saving to database
        _fileObject: fileObject
      });
      
      // Set edit mode to false since this is a new creation
      setEditMode(false);
      
      // Show success and then automatically redirect
      setUploadSuccess(true);
      
      // After a brief delay, navigate to the metadata completion page
      setTimeout(() => {
        setActiveView('metadataCompletion');
      }, 1000);
    } catch (error) {
      console.error('Error processing file metadata:', error);
      // Continue with basic file info if metadata extraction fails
      setCurrentCreation({
        ...creationData,
        _fileObject: fileObject
      });
      
      setUploadSuccess(true);
      setTimeout(() => {
        setActiveView('metadataCompletion');
      }, 1000);
    }
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
          {uploadSuccess ? (
            <div className="text-center py-8">
              <div className="bg-green-100 text-green-700 rounded-full p-4 inline-flex mb-4">
                <Check className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold mb-4">File Uploaded!</h2>
              <p className="mb-6">Redirecting to metadata form...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="bg-blue-100 inline-flex rounded-full p-4 mb-4">
                  <Upload className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold">Upload Your Creation</h2>
                <p className="text-gray-600 mb-6">
                  Drag and drop a file or click to browse
                </p>
              </div>
              
              <FileUploadComponent 
                onFileProcessed={handleFileProcessed} 
              />
              
              <div className="bg-yellow-50 p-4 rounded-md text-sm">
                <h3 className="font-medium text-yellow-800 mb-1">Notes:</h3>
                <ul className="list-disc pl-5 text-yellow-700">
                  <li>Files will be categorized based on their type</li>
                  <li>You'll be prompted to add metadata on the next screen</li>
                  <li>Supported file types include images, audio, video, and documents</li>
                </ul>
              </div>
              
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setActiveView('myCreations')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FileUploadPage;