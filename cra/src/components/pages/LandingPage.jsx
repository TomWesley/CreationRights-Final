// src/components/pages/LandingPage.jsx - Updated for the new auth flow

import React from 'react';
import { FileText, Users, BarChart2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import LandingHeader from '../layout/LandingHeader';
import Footer from '../layout/Footer';
import LoginModal from '../auth/LoginModal';
import RegisterFlow from '../auth/RegisterFlow';
import { useAppContext } from '../../contexts/AppContext';

const LandingPage = () => {
  const { 
    showLoginModal, 
    setShowLoginModal, 
    showRegisterFlow, 
    setShowRegisterFlow 
  } = useAppContext();
  
  return (
    <div className="landing-container">
      <LandingHeader />
      
      <main className="landing-main">
        <div className="landing-content">
          <div className="hero-section">
            <h1 className="hero-title">
              Protect Your Creative Works
            </h1>
            <p className="hero-subtitle">
              Easily manage, track, and secure your intellectual property rights
              across all your creative endeavors.
            </p>
            <div className="hero-actions">
              <Button size="lg" onClick={() => setShowRegisterFlow(true)} className="get-started-button">
                Sign Up
              </Button>
              <Button size="lg" variant="outline" className="learn-more-button">
                Learn More
              </Button>
            </div>
          </div>
          
          {/* Feature highlights */}
          <div className="features-section">
            <Card className="feature-card">
              <CardHeader>
                <CardTitle className="feature-title">
                  <FileText className="feature-icon" />
                  Organize Your Creations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>Sell your works to licensing agencies with minimal effort.</p>
              </CardContent>
            </Card>
            
            <Card className="feature-card">
              <CardHeader>
                <CardTitle className="feature-title">
                  <Users className="feature-icon" />
                  Creator & Agency Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>Whether you're an individual creator or an agency, our platform adapts to your specific needs.</p>
              </CardContent>
            </Card>
            
            <Card className="feature-card">
              <CardHeader>
                <CardTitle className="feature-title">
                  <BarChart2 className="feature-icon" />
                  Track Your Rights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>Never lose track of your intellectual property rights with comprehensive details for each creation.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
      
      {/* Authentication modals */}
      {showLoginModal && <LoginModal />}
      {showRegisterFlow && <RegisterFlow />}
    </div>
  );
};

export default LandingPage;