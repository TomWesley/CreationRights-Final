// src/components/pages/CreationForm.jsx

import React, { useState, useEffect } from 'react';
import { X, FileText, ImageIcon, Music, Video, Code, File, DollarSign, Info } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { useAppContext } from '../../contexts/AppContext';

const CreationForm = () => {
  const { 
    editMode, 
    currentCreation, 
    currentFolder, 
    breadcrumbs,
    folders,
    handleInputChange,
    handleTagInput,
    removeTag,
    resetForm,
    handleSubmit,
    buildBreadcrumbs,
    setActiveView
  } = useAppContext();
  
  const [filePreview, setFilePreview] = useState(null);
  const [showLicensingInfo, setShowLicensingInfo] = useState(false);
  
  const creationTypes = ['Image', 'Text', 'Music', 'Video', 'Software', 'Other'];
  
  // Initialize file preview when currentCreation changes
  useEffect(() => {
    // Check if we have a file preview URL
    if (currentCreation.filePreviewUrl) {
      setFilePreview({
        url: currentCreation.filePreviewUrl,
        type: currentCreation.type
      });
    } else {
      setFilePreview(null);
    }
    
    // Set licensing info visibility based on whether licensing cost exists
    setShowLicensingInfo(!!currentCreation.licensingCost);
    
    // Clean up function to revoke object URLs
    return () => {
      if (currentCreation.filePreviewUrl) {
        URL.revokeObjectURL(currentCreation.filePreviewUrl);
      }
    };
  }, [currentCreation]);
  
  // Handle licensing cost change
  const handleLicensingCostChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and a single decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      handleInputChange({
        target: {
          name: 'licensingCost',
          value: value
        }
      });
    }
  };
  
  // Toggle licensing info visibility
  const toggleLicensingInfo = () => {
    setShowLicensingInfo(!showLicensingInfo);
    if (!showLicensingInfo && !currentCreation.licensingCost) {
      // Reset licensing cost when hiding the section
      handleInputChange({
        target: {
          name: 'licensingCost',
          value: ''
        }
      });
    }
  };
  
  // Render file preview based on type
  const renderFilePreview = () => {
    if (!filePreview) return null;
    
    switch (filePreview.type) {
      case 'Image':
        return (
          <div className="mb-4">
            <img 
              src={filePreview.url} 
              alt="Preview" 
              className="max-h-64 max-w-full rounded-md object-contain"
            />
            {currentCreation.dimensions && (
              <p className="text-xs text-gray-500 mt-1">
                Dimensions: {currentCreation.dimensions}
              </p>
            )}
          </div>
        );
        
      case 'Video':
        return (
          <div className="mb-4">
            <video 
              src={filePreview.url} 
              controls 
              className="max-h-64 max-w-full rounded-md"
            />
          </div>
        );
        
      case 'Music':
        return (
          <div className="mb-4">
            <audio 
              src={filePreview.url} 
              controls 
              className="w-full"
            />
          </div>
        );
        
      case 'Text':
        return (
          <div className="mb-4 p-3 bg-gray-50 rounded-md border max-h-64 overflow-auto">
            {currentCreation.textPreview ? (
              <pre className="text-sm whitespace-pre-wrap">{currentCreation.textPreview}</pre>
            ) : (
              <div className="flex items-center text-gray-500">
                <FileText className="h-5 w-5 mr-2" />
                Text file: {currentCreation.fileName}
              </div>
            )}
          </div>
        );
        
      default:
        return (
          <div className="mb-4 p-3 bg-gray-50 rounded-md border flex items-center">
            <File className="h-5 w-5 mr-2 text-blue-500" />
            <div>
              <p>{currentCreation.fileName}</p>
              <p className="text-xs text-gray-500">{currentCreation.fileSize}</p>
            </div>
          </div>
        );
    }
  };
  
  // Get icon based on creation type
  const getTypeIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'image':
        return <ImageIcon className="h-5 w-5 mr-2 text-blue-500" />;
      case 'text':
        return <FileText className="h-5 w-5 mr-2 text-green-500" />;
      case 'music':
        return <Music className="h-5 w-5 mr-2 text-purple-500" />;
      case 'video':
        return <Video className="h-5 w-5 mr-2 text-red-500" />;
      case 'software':
        return <Code className="h-5 w-5 mr-2 text-gray-500" />;
      default:
        return <File className="h-5 w-5 mr-2 text-gray-500" />;
    }
  };
  
  return (
    <div className="creation-form-container">
      <div className="form-header">
        <h1 className="form-title">
          {editMode ? 'Edit Creation' : 'New Creation'}
        </h1>
        {currentFolder && (
          <p className="folder-path">
            In folder: {breadcrumbs.map(f => f.name).join(' / ')}
            {breadcrumbs.length > 0 && ' / '}
            {currentFolder.name}
          </p>
        )}
      </div>
      
      <Card>
        <CardContent className="creation-form-content">
          {renderFilePreview()}
          
          <form onSubmit={handleSubmit} className="creation-form">
            <div className="form-grid">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input 
                  id="title"
                  name="title"
                  value={currentCreation.title}
                  onChange={handleInputChange}
                  placeholder="Title of your creation"
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Type *</Label>
                <div className="flex items-center">
                  <select
                    id="type"
                    name="type"
                    value={currentCreation.type}
                    onChange={handleInputChange}
                    className="type-select"
                    required
                  >
                    <option value="">Select a type</option>
                    {creationTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {currentCreation.type && (
                    <span className="ml-2">{getTypeIcon(currentCreation.type)}</span>
                  )}
                </div>
                {currentCreation.fileSize && (
                  <p className="text-xs text-gray-500 mt-1">File size: {currentCreation.fileSize}</p>
                )}
              </div>

              <div>
                <Label htmlFor="dateCreated">Date Created</Label>
                <Input 
                  id="dateCreated"
                  name="dateCreated"
                  type="date"
                  value={currentCreation.dateCreated}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label htmlFor="folderId">Folder</Label>
                <select
                  id="folderId"
                  name="folderId"
                  value={currentCreation.folderId}
                  onChange={handleInputChange}
                  className="folder-select"
                >
                  <option value="">Root (No Folder)</option>
                  {folders.map(folder => (
                    <option key={folder.id} value={folder.id}>
                      {buildBreadcrumbs(folder.id).map(f => f.name).join(' / ')}
                      {buildBreadcrumbs(folder.id).length > 0 ? ' / ' : ''}
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="rights">Rights Information</Label>
              <Textarea 
                id="rights"
                name="rights"
                value={currentCreation.rights}
                onChange={handleInputChange}
                placeholder="Copyright details, licensing terms, etc."
                rows={3}
                className="rights-textarea"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes"
                name="notes"
                value={currentCreation.notes}
                onChange={handleInputChange}
                placeholder="Additional information about your creation"
                rows={3}
                className="notes-textarea"
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags</Label>
              <div className="tags-container">
                {currentCreation.tags.map(tag => (
                  <div 
                    key={tag} 
                    className="tag-item"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="tag-remove"
                    >
                      <X className="tag-remove-icon" />
                    </button>
                  </div>
                ))}
              </div>
              <Input 
                id="tags"
                placeholder="Add tags (press Enter after each tag)"
                onKeyDown={handleTagInput}
                className="tags-input"
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
                  onClick={toggleLicensingInfo}
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
                      name="licensingCost"
                      value={currentCreation.licensingCost || ''}
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

            <div className="form-actions">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  resetForm();
                  setActiveView('myCreations');
                }}
                className="cancel-button"
              >
                Cancel
              </Button>
              <Button type="submit" className="submit-button">
                {editMode ? 'Update Creation' : 'Create'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreationForm;