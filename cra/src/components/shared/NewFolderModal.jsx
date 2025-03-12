import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useAppContext } from '../../contexts/AppContext';

const NewFolderModal = () => {
  const { 
    currentFolder, 
    newFolderName, 
    setNewFolderName, 
    createFolder, 
    setShowNewFolderModal 
  } = useAppContext();
  
  return (
    <div className="modal-overlay">
      <Card className="folder-modal">
        <CardHeader>
          <CardTitle>Create New Folder</CardTitle>
          <CardDescription>
            {currentFolder 
              ? `Creating a subfolder in ${currentFolder.name}` 
              : 'Creating a root folder'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="folder-form">
            <div>
              <Label htmlFor="folderName">Folder Name</Label>
              <Input
                id="folderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                autoFocus
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="folder-modal-footer">
          <Button variant="ghost" onClick={() => setShowNewFolderModal(false)}>
            Cancel
          </Button>
          <Button onClick={createFolder}>
            Create Folder
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default NewFolderModal;