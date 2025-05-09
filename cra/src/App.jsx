// src/App.jsx - Modified to bypass loading state and improve dashboard rendering

import React from 'react';
import { AppProvider, useAppContext } from './contexts/AppContext';
import LandingPage from './components/pages/LandingPage';
import AppHeader from './components/layout/AppHeader';
import AppSidebar from './components/layout/AppSidebar';
import CreatorDashboard from './components/pages/CreatorDashboard';
import AgencyDashboard from './components/pages/AgencyDashboard';
import AllCreationsList from './components/pages/AllCreationsList';
import MyCreationsList from './components/pages/MyCreationsList';
import ArtistsList from './components/pages/ArtistsList';
import CreatorManagement from './components/pages/CreatorManagement';
import Settings from './components/pages/Settings';
import NewFolderModal from './components/shared/NewFolderModal';
import LoadingIndicator from './components/shared/LoadingIndicator';
import UploadCreation from './components/pages/UploadCreation';
import TeamPage from './components/pages/TeamPage';
import NetworkPage from './components/pages/NetworkPage';
import SocialMediaPage from './components/pages/SocialMediaPage';
import LicensesPage from './components/pages/LicensesPage';
import ChatPage from './components/pages/ChatPage';
import Footer from './components/layout/Footer';
import { ToastProvider } from './components/ui/use-toast';
import { Toaster } from './components/ui/toaster';
import EditCreation from './components/pages/EditCreation';
import './CreationRightsApp.css';

const AppContent = () => {
  const { 
    isAuthenticated, 
    userType,
    activeView,
    showNewFolderModal,
    isLoading
  } = useAppContext();
  
  // MODIFIED: No longer check isLoading for problematic pages
  // This bypasses the loading screen for all pages
  
  // If not authenticated, show landing page
  if (!isAuthenticated) {
    return <LandingPage />;
  }
  
  // Simple content rendering without route protection
  const renderContent = () => {
    // Debug - log current view being rendered
    console.log(`Rendering view: ${activeView} for ${userType}`);
    
    switch (activeView) {
      case 'dashboard':
        // MODIFIED: Use separate dashboard components based on user type
        return userType === 'agency' ? <AgencyDashboard /> : <CreatorDashboard />;
      
      // Creator-specific views
      case 'myCreations':
        return <MyCreationsList />;
      
      case 'uploadCreation':
        return <UploadCreation />;

      case 'editCreation':
        return <EditCreation />;
      
      // Social Media page - available for all user types
      case 'socialMedia':
        return <SocialMediaPage />;

      // Add the licenses case
      case 'licenses':
        return <LicensesPage />;
        
      // Agency-specific views
      case 'allCreations':
        return <AllCreationsList />;
      
      case 'creators':
        // MODIFIED: Make the distinction clearer
        return userType === 'agency' ? <ArtistsList /> : <CreatorManagement />;
      
      // Common views
      case 'team':
        return <TeamPage />;
      
      case 'network':
        return <NetworkPage />;
      
      case 'settings':
        return <Settings />;
  
      case 'messages':
        return <ChatPage />;
      
      default:
        // MODIFIED: Fallback to appropriate dashboard
        return userType === 'agency' ? <AgencyDashboard /> : <CreatorDashboard />;
    }
  };
  
  return (
    <div className="app-layout">
      {/* <AppHeader /> */}
      
      <div className="app-content">
        <AppSidebar />
        
        <main className="main-content">
          <div className="content-container">
            {renderContent()}
          </div>
        </main>
      </div>
      
      {/* <Footer /> */}
      <Toaster />
    </div>
  );
};

const App = () => {
  return (
    <AppProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AppProvider>
  );
};

export default App;