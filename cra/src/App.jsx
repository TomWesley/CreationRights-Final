// src/App.jsx
import React from 'react';
import { AppProvider, useAppContext } from './contexts/AppContext';
import LandingPage from './components/pages/LandingPage';
import AppHeader from './components/layout/AppHeader';
import AppSidebar from './components/layout/AppSidebar';
import CreatorDashboard from './components/pages/CreatorDashboard';
import AgencyDashboard from './components/pages/AgencyDashboard';
import CreationsList from './components/pages/CreationsList';
import CreationForm from './components/pages/CreationForm';
import CreatorManagement from './components/pages/CreatorManagement';
import Settings from './components/pages/Settings';
import NewFolderModal from './components/shared/NewFolderModal';
import LoadingIndicator from './components/shared/LoadingIndicator';
import YouTubeImport from './components/pages/YouTubeImport';
import FileUploadPage from './components/pages/FileUploadPage';
import MetadataCompletionPage from './components/pages/MetadataCompletionPage';
import MetadataEditPage from './components/pages/MetadataEditPage';
import './CreationRightsApp.css';

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
      case 'myCreations':
        return <CreationsList />;
      case 'newCreation':
      case 'editCreation':
        return <CreationForm />;
      case 'youtubeImport':
        return <YouTubeImport />;
      case 'fileUpload':
        return <FileUploadPage />;
      case 'metadataCompletion':
        return <MetadataCompletionPage />;
      case 'creators':
        return userType === 'agency' ? <CreatorManagement /> : <CreatorDashboard />;
      case 'settings':
        return <Settings />;
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