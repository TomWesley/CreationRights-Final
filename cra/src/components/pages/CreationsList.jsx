// src/components/pages/CreationsList.jsx

import React, { useState } from 'react';
import { Plus, FolderPlus, Search, AlertCircle, Youtube, Upload } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import CreationCard from '../shared/CreationCard';
import { useAppContext } from '../../contexts/AppContext';

const CreationsList = () => {
  const { 
    currentFolder, 
    breadcrumbs, 
    searchQuery, 
    setSearchQuery,
    activeTab,
    setActiveTab,
    navigateToFolder,
    setActiveView,
    setShowNewFolderModal,
    getFilteredCreations
  } = useAppContext();
  
  const [showImportDropdown, setShowImportDropdown] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'draft', or 'published'
  
  const filteredCreations = getFilteredCreations().filter(creation => {
    // Apply status filter
    if (statusFilter !== 'all') {
      return creation.status === statusFilter;
    }
    return true;
  });
  
  return (
    <div className="creations-view">
      <div className="creations-header">
        <div>
          <h1 className="creations-title">
            {currentFolder ? currentFolder.name : 'All Creations'}
          </h1>
          
          {/* Breadcrumb navigation */}
          {breadcrumbs.length > 0 && (
            <nav className="breadcrumb-nav">
              <ol className="breadcrumb-list">
                <li>
                  <button 
                    onClick={() => navigateToFolder(null)}
                    className="breadcrumb-root"
                  >
                    Root
                  </button>
                </li>
                {breadcrumbs.slice(0, -1).map((folder) => (
                  <li key={folder.id} className="breadcrumb-item">
                    <span className="breadcrumb-separator">/</span>
                    <button 
                      onClick={() => navigateToFolder(folder)}
                      className="breadcrumb-link"
                    >
                      {folder.name}
                    </button>
                  </li>
                ))}
                {breadcrumbs.length > 0 && (
                  <li className="breadcrumb-item">
                    <span className="breadcrumb-separator">/</span>
                    <span className="breadcrumb-current">{breadcrumbs[breadcrumbs.length - 1].name}</span>
                  </li>
                )}
              </ol>
            </nav>
          )}
        </div>
        
        <div className="creations-actions">
          <div className="search-container">
            <Search className="search-icon" />
            <Input
              placeholder="Search creations..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <Button 
              onClick={() => setShowImportDropdown(!showImportDropdown)} 
              className="new-creation-button"
            >
              <Plus className="button-icon" /> Add Creation
            </Button>
            
            {showImportDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 border">
                <div className="py-1">
                  <button
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    onClick={() => {
                      setActiveView('fileUpload');
                      setShowImportDropdown(false);
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </button>
                  <button
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    onClick={() => {
                      setActiveView('youtubeImport');
                      setShowImportDropdown(false);
                    }}
                  >
                    <Youtube className="w-4 h-4 mr-2" />
                    Import from YouTube
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <Button variant="outline" onClick={() => setShowNewFolderModal(true)} className="new-folder-button">
            <FolderPlus className="button-icon" /> New Folder
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="tabs-header">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="image">Images</TabsTrigger>
                <TabsTrigger value="text">Text</TabsTrigger>
                <TabsTrigger value="music">Music</TabsTrigger>
                <TabsTrigger value="video">Video</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex items-center gap-2">
              <select 
                className="bg-gray-100 border border-gray-300 text-gray-700 text-sm rounded-md px-2 py-1"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCreations.length === 0 ? (
            <div className="empty-state">
              <AlertCircle className="empty-icon" />
              <p className="empty-title">No creations found</p>
              <p className="empty-message">
                {searchQuery 
                  ? "Try adjusting your search query" 
                  : "Add your first creation or create a new folder"}
              </p>
              <div className="empty-actions">
                <Button variant="outline" onClick={() => setActiveView('fileUpload')}>
                  <Upload className="button-icon" /> Upload File
                </Button>
                <Button variant="outline" onClick={() => setActiveView('youtubeImport')}>
                  <Youtube className="button-icon" /> Import from YouTube
                </Button>
                <Button variant="outline" onClick={() => setShowNewFolderModal(true)}>
                  <FolderPlus className="button-icon" /> New Folder
                </Button>
              </div>
            </div>
          ) : (
            <div className="creation-list">
              {filteredCreations.map(creation => (
                <CreationCard key={creation.id} creation={creation} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreationsList;