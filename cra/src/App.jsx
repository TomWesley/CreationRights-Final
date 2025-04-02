// src/App.jsx - Updated with Social Media Page
import React from 'react';
import { AppProvider, useAppContext } from './contexts/AppContext';
import LandingPage from './components/pages/LandingPage';
import AppHeader from './components/layout/AppHeader';
import AppSidebar from './components/layout/AppSidebar';
import CreatorDashboard from './components/pages/CreatorDashboard';
import AgencyDashboard from './components/pages/AgencyDashboard';
import CreationsList from './components/pages/CreationsList';
import AllCreationsList from './components/pages/AllCreationsList';
import ArtistsList from './components/pages/ArtistsList';
import CreationForm from './components/pages/CreationForm';
import CreatorManagement from './components/pages/CreatorManagement';
import Settings from './components/pages/Settings';
import NewFolderModal from './components/shared/NewFolderModal';
import LoadingIndicator from './components/shared/LoadingIndicator';
import YouTubeImport from './components/pages/YouTubeImport';
import FileUploadPage from './components/pages/FileUploadPage';
import MetadataCompletionPage from './components/pages/MetadataCompletionPage';
import MetadataEditPage from './components/pages/MetadataEditPage';
import TeamPage from './components/pages/TeamPage';
import NetworkPage from './components/pages/NetworkPage';
import SocialMediaPage from './components/pages/SocialMediaPage';
import './CreationRightsApp.css';
import InstagramImport from './components/pages/InstagramImport';
import ChatPage from './components/pages/ChatPage';

const AppContent = () => {
  const { 
    isAuthenticated, 
    userType,
    activeView,
    showNewFolderModal,
    isLoading
  } = useAppContext();
  
  // If not authenticated, show landing page
  if (!isAuthenticated) {
    return (
      <>
        <LandingPage />
        {isLoading && <LoadingIndicator />}
      </>
    );
  }
  
  // Render the appropriate view based on activeView state
  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return userType === 'creator' ? <CreatorDashboard /> : <AgencyDashboard />;
      
      // Creator-specific views
      case 'myCreations':
        return <CreationsList />;
      case 'newCreation':
        return <CreationForm />;
      case 'editCreation':
        return <MetadataEditPage />;
      case 'youtubeImport':
        return <YouTubeImport />;
      case 'instagramImport':
        return <InstagramImport />;
      case 'fileUpload':
        return <FileUploadPage />;
      case 'metadataCompletion':
        return <MetadataCompletionPage />;
        
      // Social Media page - available for all user types
      case 'socialMedia':
        return <SocialMediaPage />;
        
      // Agency-specific views
      case 'allCreations':
        return <AllCreationsList />;
      case 'creators':
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
        return userType === 'creator' ? <CreatorDashboard /> : <AgencyDashboard />;
    }
  };
  
  return (
    <div className="app-layout">
      <AppHeader />
      
      <div className="app-content">
        <AppSidebar />
        
        <main className="main-content">
          <div className="content-container">
            {renderContent()}
          </div>
        </main>
      </div>
      
      {showNewFolderModal && <NewFolderModal />}
      {isLoading && <LoadingIndicator />}
    </div>
  );
};

const App = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;