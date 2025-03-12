import React from 'react';
import { ChevronDown, ChevronRight, Folder, Trash2 } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';

const FolderStructure = ({ parentId = null, depth = 0 }) => {
  const { 
    folders, 
    currentFolder, 
    expandedFolders,
    toggleFolderExpanded,
    navigateToFolder,
    deleteFolder
  } = useAppContext();
  
  const folderList = folders.filter(folder => folder.parentId === parentId);
  
  if (folderList.length === 0) {
    return null;
  }
  
  return (
    <ul className={`folder-list depth-${depth}`}>
      {folderList.map(folder => {
        const hasChildren = folders.some(f => f.parentId === folder.id);
        const isExpanded = expandedFolders[folder.id];
        
        return (
          <li key={folder.id} className="folder-item">
            <div 
              className={`folder-row ${
                currentFolder && currentFolder.id === folder.id ? 'folder-active' : ''
              }`}
            >
              {hasChildren ? (
                <button
                  onClick={() => toggleFolderExpanded(folder.id)}
                  className="folder-toggle"
                >
                  {isExpanded ? <ChevronDown className="folder-icon-small" /> : <ChevronRight className="folder-icon-small" />}
                </button>
              ) : (
                <span className="folder-toggle-placeholder"></span>
              )}
              
              <Folder className="folder-icon" />
              
              <span 
                onClick={() => navigateToFolder(folder)} 
                className="folder-name"
              >
                {folder.name}
              </span>
              
              {currentFolder && currentFolder.id === folder.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFolder(folder.id);
                  }}
                  className="folder-delete"
                >
                  <Trash2 className="folder-icon-small" />
                </button>
              )}
            </div>
            
            {hasChildren && isExpanded && <FolderStructure parentId={folder.id} depth={depth + 1} />}
          </li>
        );
      })}
    </ul>
  );
};

export default FolderStructure;