// src/components/pages/EditCreation.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar, Loader2 } from 'lucide-react';
import { useToast } from '../ui/use-toast';
import { useAppContext } from '../../contexts/AppContext';

const EditCreation = () => {
  const { 
    currentUser, 
    setActiveView, 
    setIsLoading, 
    handleSubmit, 
    currentCreation,
    resetForm
  } = useAppContext();
  
  const { toast } = useToast();
  
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
  const [status, setStatus] = useState('draft');
  const [filePreview, setFilePreview] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Initialize form with current creation data
  useEffect(() => {
    if (currentCreation && currentCreation.id) {
      const metadata = currentCreation.metadata || {};
      
      // Set basic fields
      setTitle(currentCreation.title || '');
      setDescription(currentCreation.notes || '');
      setRights(currentCreation.rights || '');
      setLicensingCost(currentCreation.licensingCost?.toString() || '');
      setStatus(currentCreation.status || 'draft');
      
      // Set tags
      if (Array.isArray(currentCreation.tags)) {
        setTags(currentCreation.tags.join(', '));
      }
      
      // Set metadata fields
      setPhotographer(metadata.photographer || '');
      setStyle(metadata.style || '');
      setCreatedDate(metadata.createdDate || currentCreation.dateCreated || '');
      setCollection(metadata.collection || '');
      setRightsHolder(metadata.rightsHolders || '');
      
      // Set preview
      if (currentCreation.thumbnailUrl || currentCreation.fileUrl) {
        setFilePreview(currentCreation.thumbnailUrl || currentCreation.fileUrl);
      }
    }
  }, [currentCreation]);

  // Handle form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentCreation || !currentCreation.id) {
      toast({
        title: "Error",
        description: "No creation selected for editing",
        variant: "destructive"
      });
      return;
    }
    
    if (!title || !rightsHolder) {
      toast({
        title: "Missing required fields",
        description: "Please fill out all required fields",
        variant: "destructive"
      });
      return;
    }
    
    setIsUpdating(true);
    setIsLoading(true);
    
    try {
      // Process tags
      const tagArray = tags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      // Prepare updated creation object
      const updatedCreation = {
        ...currentCreation,
        title,
        rights,
        notes: description,
        licensingCost: licensingCost !== '' ? parseFloat(licensingCost) : null,
        tags: tagArray,
        status,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.email,
        metadata: {
          ...currentCreation.metadata,
          photographer,
          style,
          createdDate,
          collection,
          rightsHolders: rightsHolder,
          lastModified: new Date().toISOString()
        }
      };
      
      // Save to Firestore via AppContext
      const success = await handleSubmit(updatedCreation);
      
      if (success) {
        toast({
          title: "Creation updated",
          description: "Your creation has been updated successfully",
          variant: "default"
        });
        
        // Navigate back to creations list
        setActiveView('myCreations');
      }
    } catch (error) {
      console.error("Form submission error:", error);
      
      toast({
        title: "Update failed",
        description: error.message || "Failed to update creation",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
      setIsLoading(false);
    }
  };

  // Cancel and go back
  const handleCancel = () => {
    resetForm();
    setActiveView('myCreations');
  };

  return (
    <div className="edit-creation">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Creation</h1>
        <p className="text-gray-500">Update metadata and details for your work</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Creation Details</CardTitle>
          <CardDescription>
            Update the details about your work. Fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFormSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filePreview && (
                <div className="col-span-2 flex justify-center">
                  <div className="relative max-w-md">
                    <img 
                      src={filePreview} 
                      alt="Preview" 
                      className="max-h-60 rounded-md object-contain border border-gray-200"
                    />
                  </div>
                </div>
              )}
              
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
                <Label htmlFor="photographer">Creator/Photographer *</Label>
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
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
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
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUpdating || !title || !rightsHolder}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Updating...
                  </>
                ) : "Update Creation"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditCreation;