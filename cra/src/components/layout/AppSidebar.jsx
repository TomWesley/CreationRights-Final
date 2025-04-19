// src/components/layout/AppSidebar.jsx - Updated with MyPage and Add Creation button

import React, { useState, useEffect } from 'react';
import { Home, FileText, Users, Settings, MessageSquare, Search, UserCheck, Instagram, DollarSign, Plus } from 'lucide-react';

import { useAppContext } from '../../contexts/AppContext';
import NotificationBadge from '../shared/NotificationBadge';
import { getUnreadMessagesCount } from '../../services/firestoreChat';
import ProfilePhoto from '../shared/ProfilePhoto';
import { Button } from '../ui/button';
import { LogOut } from 'lucide-react';

const AppSidebar = () => {
  const { 
    userType, 
    isMobileMenuOpen, 
    setIsMobileMenuOpen,
    activeView,
    setActiveView,
    currentUser,
    handleLogout
  } = useAppContext();
  
  const isAgency = userType === 'agency';
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  
  const formatDisplayName = (email) => {
    if (!email) return 'User';
    
    // If it's a simple username without domain, just return it
    if (!email.includes('@')) return email;
    
    // Otherwise, get the part before @ and capitalize first letter
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  };
  
  // Fetch unread message count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!currentUser?.email) return;
      
      try {
        const count = await getUnreadMessagesCount(currentUser.email);
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
  }, [currentUser]);

  // Navigate to upload creation page
  const navigateToUpload = () => {
    setActiveView('uploadCreation');
    setIsMobileMenuOpen(false);
  };
  
  return (
    <>
      <aside className={`app-sidebar ${isMobileMenuOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="sidebar-content">
          <img src="/images/watermark.png" alt="Creation Rights Logo" className="sb-logo" />
          
          {/* Add Creation Button */}
          <Button 
            variant="default" 
            className="add-creation-button"
            onClick={navigateToUpload}
          >
            <Plus className="add-icon" /> Add Creation
          </Button>
          
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
                My Page
              </button>
            </div>
            
            <div className="nav-group">
              <button
                className={`nav-item ${activeView === 'myCreations' || activeView === 'allCreations' ? 'nav-active' : ''}`}
                onClick={() => {
                  setActiveView(isAgency ? 'allCreations' : 'myCreations');
                  setIsMobileMenuOpen(false);
                }}
              >
                <FileText className="nav-icon" />
                {isAgency ? 'Creations' : 'My Creations'}
              </button>
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
                className={`nav-item ${activeView === 'licenses' ? 'nav-active' : ''}`}
                onClick={() => {
                  setActiveView('licenses');
                  setIsMobileMenuOpen(false);
                }}
              >
                <DollarSign className="nav-icon" />
                {userType === 'creator' ? 'Licenses Sold' : 'Licenses'}
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
          
          {/* User profile section - now positioned at bottom of sidebar */}
          <div className="sidebar-profile flex items-center cursor-pointer" onClick={() => setActiveView('settings')}>
            <div className="mr-2">
              <ProfilePhoto 
                email={currentUser?.email}
                name={currentUser?.name || formatDisplayName(currentUser?.email)}
                photoUrl={currentUser?.photoUrl}
                userId={currentUser?.uid}
                size="sm"
                clickable
              />
            </div>
            
            <div>
              <span className="flex items-center">
                <span className="user-name">{currentUser?.name || formatDisplayName(currentUser?.email)}</span>
                <span className="user-type ml-2">
                  {userType === 'creator' ? 'Creator' : 'Agency'}
                </span>
              </span>
              
              <span className="user-email text-xs text-gray-400 block">
                {currentUser?.email}
              </span>
            </div>
            
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="logout-button">
            <LogOut className="logout-icon" />
            <span className="logout-text">Sign Out</span>
          </Button>
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