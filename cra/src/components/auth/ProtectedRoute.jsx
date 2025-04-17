import React, { useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';

/**
 * A wrapper component that protects routes from unauthenticated access
 * Redirects to landing page if user is not authenticated
 */
const ProtectedRoute = ({ children }) => {
  const { currentUser, isLoading } = useAppContext();

  useEffect(() => {
    // If authentication check is complete and no user is found
    if (!isLoading && !currentUser) {
      console.log("Protected route: No authenticated user found, redirecting to landing");
      window.location.href = '/';
    }
  }, [currentUser, isLoading]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, render the protected content
  return currentUser ? children : null;
};

export default ProtectedRoute;