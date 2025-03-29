// src/components/shared/MetadataForm.jsx - Updated version

import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { generateMetadataFormSchema } from '../../services/metadataExtraction';
import { useAppContext } from '../../contexts/AppContext';

const MetadataForm = ({ contentType, initialMetadata, onSave, onCancel }) => {
  const [formFields, setFormFields] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [missingRequiredFields, setMissingRequiredFields] = useState([]);
  const { currentUser } = useAppContext();

  // Initialize form fields and values
  useEffect(() => {
    // Generate form schema based on content type
    const schema = generateMetadataFormSchema(contentType, initialMetadata);
    setFormFields(schema);
    
    // Initialize form values with initial metadata
    const initialValues = {};
    schema.forEach(field => {
      initialValues[field.key] = field.value || '';
    });
    
    // Add created by and creator email if not already present
    if (currentUser && currentUser.email) {
      if (!initialValues.rightsHolders) {
        initialValues.rightsHolders = currentUser.name || currentUser.email;
      }
      
      // For photos, set photographer if not set
      if (contentType === 'Photography' && !initialValues.photographer) {
        initialValues.photographer = currentUser.name || currentUser.email;
      }
      
      // For audio, set artist if not set
      if (contentType === 'Audio' && !initialValues.artist) {
        initialValues.artist = currentUser.name || currentUser.email;
      }
      
      // For video, set creator if not set
      if (contentType === 'Video' && !initialValues.creator) {
        initialValues.creator = currentUser.name || currentUser.email;
      }
      
      // For literature, set author if not set
      if (contentType === 'Literature' && !initialValues.author) {
        initialValues.author = currentUser.name || currentUser.email;
      }
    }
    
    setFormValues(initialValues);
  }, [contentType, initialMetadata, currentUser]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field from missing required fields if it now has a value
    if (value && missingRequiredFields.includes(name)) {
      setMissingRequiredFields(prev => prev.filter(field => field !== name));
    }
  };

  // Validate form and submit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check for all fields - making all metadata entries mandatory
    const missing = formFields
  // Only check for required fields
      .filter(field => field.required && !formValues[field.key] && !field.auto)
      .map(field => field.key);
    
    if (missing.length > 0) {
      setMissingRequiredFields(missing);
      return;
    }
    
    // Call onSave with the completed metadata
    onSave(formValues);
  };

  // Render form fields based on schema
  const renderField = (field) => {
    const isMissing = missingRequiredFields.includes(field.key);
    
    return (
      <div key={field.key} className="mb-4">
        <Label 
          htmlFor={field.key} 
          className={`${isMissing ? 'text-red-500' : ''} ${field.required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ""}`}
        >
          {field.label}
        </Label>
        
        {field.auto ? (
          <div className="p-2 bg-gray-100 rounded border mt-1">
            {formValues[field.key] || 'Auto-generated'}
          </div>
        ) : field.type === 'textarea' ? (
          <Textarea
            id={field.key}
            name={field.key}
            value={formValues[field.key] || ''}
            onChange={handleInputChange}
            className={`mt-1 ${isMissing ? 'border-red-500' : ''}`}
            disabled={field.disabled}
          />
        ) : (
          <Input
            id={field.key}
            name={field.key}
            type={field.type || 'text'}
            value={formValues[field.key] || ''}
            onChange={handleInputChange}
            className={`mt-1 ${isMissing ? 'border-red-500' : ''}`}
            disabled={field.disabled}
          />
        )}
        
        {isMissing && (
          <p className="text-red-500 text-xs mt-1">This field is required</p>
        )}
      </div>
    );
  };

  return (
    <div className="metadata-form">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{initialMetadata.category || contentType} Metadata</h2>
        <p className="text-sm text-gray-500">
          All fields are required for complete documentation of your {initialMetadata.category || contentType.toLowerCase()}
        </p>
      </div>
      
      {missingRequiredFields.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Please fill out all required fields</p>
            <p className="text-sm">All fields are required for proper documentation</p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-2">
          {formFields.map(renderField)}
        </div>
        
        <div className="flex justify-between mt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            Save Metadata
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MetadataForm;