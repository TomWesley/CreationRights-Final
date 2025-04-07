// src/components/layout/AppSidebar.jsx - Updated to handle My Creations

import React, { useState, useEffect } from 'react';
import { Home, FileText, Users, Settings, MessageSquare, Search, UserCheck, Instagram } from 'lucide-react';
import FolderStructure from '../shared/FolderStructure';
import { useAppContext } from '../../contexts/AppContext';
import NotificationBadge from '../shared/NotificationBadge';

const AppSidebar = () => {
  const { 
    userType, 
    isMobileMenuOpen, 
    setIsMobileMenuOpen,
    activeView,
    setActiveView,
    setCurrentFolder,
    setBreadcrumbs,
    currentUser
  } = useAppContext();
  
  const isAgency = userType === 'agency';
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/+$/, '');

  // Fetch unread message count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!currentUser?.email) return;
      
      try {
        const response = await fetch(`${API_URL}/api/chats/${currentUser.email}`);
        if (!response.ok) return;
        
        const chats = await response.json();
        let count = 0;
        
        // For each chat, count unread messages from other users
        for (const chat of chats) {
          if (chat.messages) {
            count += chat.messages.filter(msg => 
              !msg.read && msg.sender !== currentUser.email
            ).length;
          }
        }
        
        setUnreadMessageCount(count);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };
    
    // Fetch initially
    fetchUnreadCount();
    
    // Set up interval to check periodically
    const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [currentUser, API_URL]);
  
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
            
            {/* Social Media Nav Item */}
            <div>
              <button
                className={`nav-item ${activeView === 'socialMedia' ? 'nav-active' : ''}`}
                onClick={() => {
                  setActiveView('socialMedia');
                  setIsMobileMenuOpen(false);
                }}
              >
                <Instagram className="nav-icon" />
                Social Media
              </button>
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
            
            {/* Messages button */}
            <div>
              <button
                className={`nav-item ${activeView === 'messages' ? 'nav-active' : ''}`}
                onClick={() => {
                  setActiveView('messages');
                  setIsMobileMenuOpen(false);
                }}
              >
                <div className="relative">
                  <MessageSquare className="nav-icon" />
                  <NotificationBadge count={unreadMessageCount} />
                </div>
                Messages
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