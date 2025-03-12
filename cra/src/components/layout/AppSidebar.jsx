import React from 'react';
import { Home, FileText, Users, Settings } from 'lucide-react';
import FolderStructure from '../shared/FolderStructure';
import { useAppContext } from '../../contexts/AppContext';

const AppSidebar = () => {
  const { 
    userType, 
    isMobileMenuOpen, 
    setIsMobileMenuOpen,
    activeView,
    setActiveView,
    setCurrentFolder,
    setBreadcrumbs
  } = useAppContext();
  
  return (
    <>
      <aside className={`app-sidebar ${isMobileMenuOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="sidebar-content">
          <nav className="sidebar-nav">
            <div>
              <button
                className={`nav-item ${activeView === 'dashboard' ? 'nav-active' : ''}`}
                onClick={() => {
                  setActiveView('dashboard');
                  setIsMobileMenuOpen(false);
                }}
              >
                <Home className="nav-icon" />
                Dashboard
              </button>
            </div>
            
            <div className="nav-group">
              <button
                className={`nav-item ${activeView === 'myCreations' ? 'nav-active' : ''}`}
                onClick={() => {
                  setCurrentFolder(null);
                  setBreadcrumbs([]);
                  setActiveView('myCreations');
                  setIsMobileMenuOpen(false);
                }}
              >
                <FileText className="nav-icon" />
                My Creations
              </button>
              
              <div className="folder-tree">
                <FolderStructure />
              </div>
            </div>
            
            {userType === 'agency' && (
              <div>
                <button
                  className={`nav-item ${activeView === 'creators' ? 'nav-active' : ''}`}
                  onClick={() => {
                    setActiveView('creators');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Users className="nav-icon" />
                  Creators
                </button>
              </div>
            )}
            
            <div>
              <button
                className={`nav-item ${activeView === 'settings' ? 'nav-active' : ''}`}
                onClick={() => {
                  setActiveView('settings');
                  setIsMobileMenuOpen(false);
                }}
              >
                <Settings className="nav-icon" />
                Settings
              </button>
            </div>
          </nav>
        </div>
      </aside>
      
      {/* Mobile overlay to close menu when clicked */}
      {isMobileMenuOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default AppSidebar;