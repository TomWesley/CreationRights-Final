// src/components/layout/AppHeader.jsx

import React, { useState, useEffect } from 'react';
import { LogOut, Menu, MessageSquare } from 'lucide-react';
import { Button } from '../ui/button';
import { useAppContext } from '../../contexts/AppContext';
import ProfilePhoto from '../shared/ProfilePhoto';
import NotificationBadge from '../shared/NotificationBadge';

const AppHeader = () => {
  const { 
    currentUser, 
    userType, 
    isMobileMenuOpen, 
    setIsMobileMenuOpen,
    handleLogout,
    setActiveView
  } = useAppContext();
  
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
  }, [currentUser]);
  
  // Format the email for display
  const formatDisplayName = (email) => {
    if (!email) return 'User';
    
    // If it's a simple username without domain, just return it
    if (!email.includes('@')) return email;
    
    // Otherwise, get the part before @ and capitalize first letter
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  };
  
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-left">
          <button 
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="menu-icon" />
          </button>
          
          <div className="app-brand">
            <img src="/crlogo.svg" alt="Creation Rights Logo" className="app-logo" />
          </div>
        </div>
        
        <div className="header-right">
          {/* Add Messages Button Here */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveView('messages')}
            className="mr-2 relative"
          >
            <MessageSquare className="h-5 w-5" />
            <NotificationBadge count={unreadMessageCount} />
          </Button>
          
          <div className="user-info flex items-center cursor-pointer" onClick={() => setActiveView('profile')}>
            <div className="mr-2">
              <ProfilePhoto 
                email={currentUser?.email}
                name={currentUser?.name || formatDisplayName(currentUser?.email)}
                size="sm"
                clickable
              />
            </div>
            
            <div>
              <span className="flex items-center">
                <span className="user-name">{currentUser?.name || formatDisplayName(currentUser?.email)}</span>
              </span>
              <span className="user-email text-xs text-gray-400 block">
                {currentUser?.email}
              </span>
            </div>
            <span className="user-type ml-2">
              {userType === 'creator' ? 'Creator' : 'Agency'}
            </span>
          </div>
          
          <Button variant="ghost" size="sm" onClick={handleLogout} className="logout-button">
            <LogOut className="logout-icon" />
            <span className="logout-text">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;