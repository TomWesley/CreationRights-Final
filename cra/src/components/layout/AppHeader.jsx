// src/components/layout/AppHeader.jsx

import React from 'react';
import { LogOut, Menu } from 'lucide-react';
import { Button } from '../ui/button';
import { useAppContext } from '../../contexts/AppContext';
import ProfilePhoto from '../shared/ProfilePhoto';

const AppHeader = () => {
  const { 
    currentUser, 
    userType, 
    isMobileMenuOpen, 
    setIsMobileMenuOpen,
    handleLogout,
    setActiveView
  } = useAppContext();
  
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