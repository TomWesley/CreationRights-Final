// src/components/layout/EnhancedLandingHeader.jsx

import React from 'react';
import { Button } from '../ui/button';
import { useAppContext } from '../../contexts/AppContext';

const LandingHeader = () => {
  const { setShowRegisterFlow, setShowLoginModal } = useAppContext();
  
  return (
    <header className="landing-header">
      <div className="header-content">
        <div className="logo-container">
          <img src="/images/watermark.png" alt="Creation Rights Logo" className="logo" />
          <span className="app-title">Creation Rights</span>
        </div>
        <div className="flex space-x-4">
          <Button 
            variant="outline" 
            onClick={() => setShowLoginModal(true)} 
            className="sign-in-button"
          >
            Sign In
          </Button>
          <Button 
            onClick={() => setShowRegisterFlow(true)} 
            className="signin-button"
          >
            Sign Up
          </Button>
        </div>
      </div>
    </header>
  );
};

export default LandingHeader;