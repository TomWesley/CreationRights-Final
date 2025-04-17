// src/components/auth/EnhancedLoginModal.jsx

import React, { createContext, useState, useEffect, useContext } from 'react';

import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAppContext } from '../../contexts/AppContext';

// Social media icons
import GoogleIcon from '../icons/GoogleIcon';
import FacebookIcon from '../icons/FacebookIcon';
import AppleIcon from '../icons/AppleIcon';

const LoginModal = () => {
  const { 
    showLoginModal, 
    setShowLoginModal, 
    setShowRegisterFlow,
    loginCredentials, 
    handleLoginInput, 
    handleLogin, 
    isLoading 
  } = useAppContext();
  const [loginError, setLoginError] = useState(null);
  
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError(null);
    
    try {
      console.log('Attempting login with:', loginCredentials);
      const success = await handleLogin(e);
      
      if (!success) {
        console.log('Login returned unsuccessful');
        setLoginError("Login failed. Please check your credentials and try again.");
      }
    } catch (error) {
      console.error('Login error caught in modal:', error);
      setLoginError(error.message || "An error occurred during login.");
    }
  };
  // Handle social login
  const handleSocialLogin = (provider) => {
    console.log(`Login with ${provider}`);
    // Implement social login logic here
  };
  
  // Switch to register flow
  const switchToRegister = () => {
    setShowLoginModal(false);
    setShowRegisterFlow(true);
  };
  
  if (!showLoginModal) {
    return null;
  }
  
  return (
    <div className="modal-overlay">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="relative p-6 border-b flex justify-center items-center">
          <img src="/images/watermark.png" alt="Creation Rights Logo" className="h-8 w-auto" />
          
          <button 
            onClick={() => setShowLoginModal(false)}
            className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Login form */}
        <div className="p-6">
          <h2 className="text-xl font-bold text-center mb-6">Sign in to your account</h2>
          
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={loginCredentials.email}
                onChange={handleLoginInput}
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={loginCredentials.password}
                onChange={handleLoginInput}
                placeholder="Enter your password"
              />
              <div className="flex justify-end mt-1">
                <button 
                  type="button"
                  className="text-xs text-blue-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="accountType">Account Type</Label>
              <select
                id="accountType"
                name="accountType"
                value={loginCredentials.accountType}
                onChange={handleLoginInput}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="creator">Creator</option>
                <option value="agency">Agency</option>
              </select>
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          
          <div className="relative flex items-center justify-center my-6">
            <div className="border-t border-gray-300 w-full absolute"></div>
            <span className="bg-white px-2 z-10 text-sm text-gray-500">or continue with</span>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Button 
              variant="outline" 
              className="flex justify-center items-center"
              onClick={() => handleSocialLogin('google')}
            >
              <GoogleIcon className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="outline" 
              className="flex justify-center items-center"
              onClick={() => handleSocialLogin('facebook')}
            >
              <FacebookIcon className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="outline" 
              className="flex justify-center items-center"
              onClick={() => handleSocialLogin('apple')}
            >
              <AppleIcon className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button 
                onClick={switchToRegister}
                className="text-blue-600 hover:underline font-medium"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;