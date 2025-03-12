// src/components/pages/MetadataEditPage.jsx

import React from 'react';
import { Check } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import MetadataEditor from '../shared/MetadataEditor';
import { useAppContext } from '../../contexts/AppContext';

const MetadataEditPage = () => {
  const { 
    setActiveView, 
    currentCreation, 
    creations,
    setCreations
  } = useAppContext();
  
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  // Handle save of updated metadata
  const handleMetadataSave = (updates) => {
    // Update the creation with new metadata and folder
    const updatedCreations = creations.map(creation => 
      creation.id === currentCreation.id 
        ? { ...creation, metadata: updates.metadata, folderId: updates.folderId }
        : creation
    );
    
    setCreations(updatedCreations);
    
    // Show success state
    setSaveSuccess(true);
    
    // Redirect back to creations list after a short delay
    setTimeout(() => {
      setActiveView('myCreations');
    }, 1500);
  };

  // Render success state
  const renderSuccessState = () => {
    return (
      <div className="text-center py-8">
        <div className="bg-green-100 text-green-700 rounded-full p-4 inline-flex mb-4">
          <Check className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Metadata Updated!</h2>
        <p className="mb-6">Your changes have been saved successfully.</p>
      </div>
    );
  };

  return (
    <div className="metadata-edit-page">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {saveSuccess ? 'Update Complete' : 'Edit Metadata'}
        </h1>
        {!saveSuccess && (
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
          {saveSuccess ? renderSuccessState() : (
            <MetadataEditor 
              creation={currentCreation}
              onSave={handleMetadataSave}
              onCancel={() => setActiveView('myCreations')}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MetadataEditPage;