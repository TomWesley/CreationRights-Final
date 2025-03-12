import React from 'react';
import { Button } from '../ui/button';
import { useAppContext } from '../../contexts/AppContext';

const LandingHeader = () => {
  const { setShowLoginModal } = useAppContext();
  
  return (
    <header className="landing-header">
      <div className="header-content">
        <div className="logo-container">
          <img src="/crlogo.svg" alt="Creation Rights Logo" className="logo" />
          <span className="app-title">Creation Rights</span>
        </div>
        <Button onClick={() => setShowLoginModal(true)} className="signin-button">Sign In</Button>
      </div>
    </header>
  );
};

export default LandingHeader;