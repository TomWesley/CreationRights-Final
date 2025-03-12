// src/components/pages/MetadataCompletionPage.jsx

import React, { useState, useEffect } from 'react';
import { Check, ArrowLeft, Upload, File, FileText, Image, Music, Video } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import MetadataForm from '../shared/MetadataForm';
import { useAppContext } from '../../contexts/AppContext';

const MetadataCompletionPage = () => {
  const { 
    setActiveView, 
    currentCreation, 
    setCurrentCreation, 
    handleSubmit,
    resetForm
  } = useAppContext();
  
  const [step, setStep] = useState('metadata'); // 'metadata' or 'success'
  const [previewUrl, setPreviewUrl] = useState(null);

  // Initialize preview if available
  useEffect(() => {
    if (currentCreation.filePreviewUrl) {
      setPreviewUrl(currentCreation.filePreviewUrl);
    }
    
    // Clear preview on unmount
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [currentCreation]);
  
  // Get icon based on creation type
  const getTypeIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'image':
      case 'photography':
        return <Image className="h-12 w-12 text-blue-500" />;
      case 'audio':
      case 'music':
        return <Music className="h-12 w-12 text-purple-500" />;
      case 'video':
        return <Video className="h-12 w-12 text-red-500" />;
      case 'text':
      case 'literature':
        return <FileText className="h-12 w-12 text-green-500" />;
      default:
        return <File className="h-12 w-12 text-gray-500" />;
    }
  };
  
  // Handle save of completed metadata
  const handleMetadataSave = (metadata) => {
    // Update current creation with metadata
    const updatedCreation = {
      ...currentCreation,
      metadata: metadata
    };
    
    setCurrentCreation(updatedCreation);
    
    // Submit the form
    const mockEvent = { preventDefault: () => {} };
    handleSubmit(mockEvent);
    
    // Show success state
    setStep('success');
  };
  
  // Render file preview
  const renderFilePreview = () => {
    if (!previewUrl) return null;
    
    switch (currentCreation.type.toLowerCase()) {
      case 'image':
      case 'photography':
        return (
          <div className="mb-4">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="max-h-48 max-w-full rounded-md object-contain mx-auto"
            />
          </div>
        );
        
      case 'video':
        return (
          <div className="mb-4">
            <video 
              src={previewUrl} 
              controls 
              className="max-h-48 max-w-full rounded-md mx-auto"
            />
          </div>
        );
        
      case 'audio':
      case 'music':
        return (
          <div className="mb-4">
            <audio 
              src={previewUrl} 
              controls 
              className="w-full"
            />
          </div>
        );
        
      default:
        return (
          <div className="mb-4 p-3 bg-gray-50 rounded-md border flex items-center justify-center">
            <File className="h-8 w-8 mr-2 text-blue-500" />
            <span>{currentCreation.fileName || 'File preview'}</span>
          </div>
        );
    }
  };
  
  // Render success step
  const renderSuccessStep = () => {
    return (
      <div className="text-center py-8">
        <div className="bg-green-100 text-green-700 rounded-full p-4 inline-flex mb-4">
          <Check className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Creation Saved!</h2>
        <p className="mb-6">
          Your {currentCreation.type.toLowerCase()} has been uploaded and metadata saved successfully.
        </p>
        <div className="flex justify-center gap-4">
          <Button onClick={() => {
            resetForm();
            setActiveView('myCreations');
          }}>
            View My Creations
          </Button>
          <Button variant="outline" onClick={() => {
            resetForm();
            setActiveView('fileUpload');
          }}>
            Upload Another File
          </Button>
        </div>
      </div>
    );
  };
  
  // Render metadata form step
  const renderMetadataStep = () => {
    return (
      <div className="space-y-6">
        <div className="text-center">
          {getTypeIcon(currentCreation.type)}
          <h2 className="text-xl font-bold mt-2">Complete Metadata</h2>
          <p className="text-gray-600 mb-4">
            Please provide additional information about your {currentCreation.type.toLowerCase()}
          </p>
        </div>
        
        {renderFilePreview()}
        
        <div className="file-info mb-4 p-3 bg-gray-50 rounded-md border">
          <div className="flex justify-between">
            <div>
              <p className="font-medium">{currentCreation.title}</p>
              {currentCreation.fileName && (
                <p className="text-sm text-gray-500">{currentCreation.fileName}</p>
              )}
            </div>
            {currentCreation.fileSize && (
              <p className="text-sm text-gray-500">{currentCreation.fileSize}</p>
            )}
          </div>
          {currentCreation.dimensions && (
            <p className="text-xs text-gray-500 mt-1">Dimensions: {currentCreation.dimensions}</p>
          )}
        </div>
        
        <MetadataForm 
          contentType={currentCreation.type} 
          initialMetadata={currentCreation.metadata || {}}
          onSave={handleMetadataSave}
          onCancel={() => setActiveView('myCreations')}
        />
      </div>
    );
  };
  
  return (
    <div className="metadata-completion-page">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {step === 'metadata' ? 'Complete Metadata' : 'Creation Saved'}
        </h1>
        {step === 'metadata' && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setActiveView('myCreations')}
          >
            Cancel
          </Button>
        )}
      </div>
      
      <Card>
        <CardContent className="pt-6">
          {step === 'metadata' ? renderMetadataStep() : renderSuccessStep()}
        </CardContent>
      </Card>
    </div>
  );
};

export default MetadataCompletionPage;