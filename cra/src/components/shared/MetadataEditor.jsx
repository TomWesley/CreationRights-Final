// src/components/shared/MetadataEditor.jsx

import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { generateMetadataFormSchema } from '../../services/metadataExtraction';
import { useAppContext } from '../../contexts/AppContext';

const MetadataEditor = ({ creation, onSave, onCancel }) => {
  const [formFields, setFormFields] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [selectedFolder, setSelectedFolder] = useState(creation.folderId || '');
  const [missingRequiredFields, setMissingRequiredFields] = useState([]);
  const { currentUser, folders, buildBreadcrumbs } = useAppContext();

  // Initialize form fields and values
  useEffect(() => {
    if (!creation || !creation.metadata) {
      return;
    }

    // Generate form schema based on content type
    const contentType = creation.type;
    const schema = generateMetadataFormSchema(contentType, creation.metadata);
    setFormFields(schema);
    
    // Initialize form values with current metadata
    const initialValues = { ...creation.metadata };
    
    setFormValues(initialValues);
    setSelectedFolder(creation.folderId || '');
  }, [creation]);

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

  const handleFolderChange = (e) => {
    setSelectedFolder(e.target.value);
  };

  // Validate form and submit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check for required fields
    const missing = formFields
      .filter(field => field.required && !formValues[field.key])
      .map(field => field.key);
    
    if (missing.length > 0) {
      setMissingRequiredFields(missing);
      return;
    }
    
    // Call onSave with the completed metadata and folder
    onSave({
      metadata: formValues,
      folderId: selectedFolder
    });
  };

  // Render form fields based on schema
  const renderField = (field) => {
    const isMissing = missingRequiredFields.includes(field.key);
    
    return (
      <div key={field.key} className="mb-4">
        <Label 
          htmlFor={field.key} 
          className={`${isMissing ? 'text-red-500' : ''} ${field.required ? 'after:content-["*"] after:ml-0.5 after:text-red-500' : ''}`}
        >
          {field.label}
        </Label>
        
        {field.auto ? (
          <div className="p-2 bg-gray-100 rounded border mt-1">
            {formValues[field.key] || 'Auto-generated'}
          </div>
        ) : field.type === 'textarea' ? (
          <textarea
            id={field.key}
            name={field.key}
            value={formValues[field.key] || ''}
            onChange={handleInputChange}
            className={`mt-1 w-full rounded-md border p-2 ${isMissing ? 'border-red-500' : 'border-gray-300'}`}
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

  if (!creation || !creation.metadata) {
    return <div>No metadata available for this creation.</div>;
  }

  return (
    <div className="metadata-editor">
      <Card>
        <CardHeader>
          <CardTitle>Edit Metadata & Folder</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <Label htmlFor="folder">Folder</Label>
              <select
                id="folder"
                name="folder"
                value={selectedFolder}
                onChange={handleFolderChange}
                className="w-full rounded-md border border-gray-300 p-2 mt-1"
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

            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {creation.metadata.category || creation.type} Metadata
              </h3>
            </div>

            <div className="space-y-4">
              {formFields.map(renderField)}
            </div>

            <div className="flex justify-between mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetadataEditor;