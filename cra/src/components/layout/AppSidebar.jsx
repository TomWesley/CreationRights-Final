// src/components/layout/AppSidebar.jsx

import React from 'react';
import { Home, FileText, Users, Settings, MessageSquare, Search, UserCheck } from 'lucide-react';
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
  
  const isAgency = userType === 'agency';
  
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
                className={`nav-item ${activeView === 'myCreations' || activeView === 'allCreations' ? 'nav-active' : ''}`}
                onClick={() => {
                  setCurrentFolder(null);
                  setBreadcrumbs([]);
                  setActiveView(isAgency ? 'allCreations' : 'myCreations');
                  setIsMobileMenuOpen(false);
                }}
              >
                <FileText className="nav-icon" />
                {isAgency ? 'Creations' : 'My Creations'}
              </button>
              
              {!isAgency && (
                <div className="folder-tree">
                  <FolderStructure />
                </div>
              )}
            </div>
            
            <div>
              <button
                className={`nav-item ${activeView === 'team' ? 'nav-active' : ''}`}
                onClick={() => {
                  setActiveView('team');
                  setIsMobileMenuOpen(false);
                }}
              >
                <Users className="nav-icon" />
                Team
              </button>
            </div>
            
            <div>
              <button
                className={`nav-item ${activeView === 'network' ? 'nav-active' : ''}`}
                onClick={() => {
                  setActiveView('network');
                  setIsMobileMenuOpen(false);
                }}
              >
                <MessageSquare className="nav-icon" />
                Network
              </button>
            </div>
            
            {isAgency && (
              <div>
                <button
                  className={`nav-item ${activeView === 'creators' ? 'nav-active' : ''}`}
                  onClick={() => {
                    setActiveView('creators');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <UserCheck className="nav-icon" />
                  Artists
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