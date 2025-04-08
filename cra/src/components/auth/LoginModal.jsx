import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';

const LoginModal = () => {
  const { 
    showLoginModal, 
    setShowLoginModal, 
    handleLogin, 
    handleSignup,
    loginCredentials, 
    handleLoginInput,
    isLoading
  } = useAppContext();

  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    accountType: 'creator'
  });
  const [errors, setErrors] = useState({});

  // Handle signup form input
  const handleSignupInput = (e) => {
    const { name, value } = e.target;
    setSignupData({
      ...signupData,
      [name]: value
    });
    
    // Clear related error
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  // Validate signup form
  const validateSignup = () => {
    const newErrors = {};
    
    if (!signupData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(signupData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!signupData.password) {
      newErrors.password = 'Password is required';
    } else if (signupData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (signupData.password !== signupData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!signupData.name) {
      newErrors.name = 'Name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle signup form submission
  const submitSignup = async (e) => {
    e.preventDefault();
    
    if (!validateSignup()) {
      return;
    }
    
    try {
      const success = await handleSignup(signupData);
      if (success) {
        // The modal will be closed by the signup handler on success
      }
    } catch (error) {
      console.error('Signup error:', error);
      setErrors({
        ...errors,
        general: error.message
      });
    }
  };

  if (!showLoginModal) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="login-modal bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="login-title">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h2>
          <button 
            onClick={() => setShowLoginModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {mode === 'login' ? (
          /* Login Form */
          <form onSubmit={handleLogin} className="login-form p-4">
            <div>
              <label htmlFor="email" className="block font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={loginCredentials.email}
                onChange={handleLoginInput}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={loginCredentials.password}
                onChange={handleLoginInput}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div>
              <label htmlFor="accountType" className="block font-medium text-gray-700 mb-1">
                Account Type
              </label>
              <select
                id="accountType"
                name="accountType"
                value={loginCredentials.accountType}
                onChange={handleLoginInput}
                className="account-type-select w-full"
              >
                <option value="creator">Creator</option>
                <option value="agency">Agency</option>
              </select>
            </div>
            
            <button
              type="submit"
              className="login-button mt-4"
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
            
            <div className="login-footer mt-4 text-sm">
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-blue-600 hover:underline"
              >
                Don't have an account? Sign Up
              </button>
            </div>
          </form>
        ) : (
          /* Signup Form */
          <form onSubmit={submitSignup} className="login-form p-4">
            <div>
              <label htmlFor="signup-email" className="block font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="signup-email"
                name="email"
                value={signupData.email}
                onChange={handleSignupInput}
                className={`w-full px-3 py-2 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            
            <div>
              <label htmlFor="signup-name" className="block font-medium text-gray-700 mb-1 mt-3">
                Full Name
              </label>
              <input
                type="text"
                id="signup-name"
                name="name"
                value={signupData.name}
                onChange={handleSignupInput}
                className={`w-full px-3 py-2 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            
            <div>
              <label htmlFor="signup-password" className="block font-medium text-gray-700 mb-1 mt-3">
                Password
              </label>
              <input
                type="password"
                id="signup-password"
                name="password"
                value={signupData.password}
                onChange={handleSignupInput}
                className={`w-full px-3 py-2 border rounded-md ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
            
            <div>
              <label htmlFor="signup-confirm-password" className="block font-medium text-gray-700 mb-1 mt-3">
                Confirm Password
              </label>
              <input
                type="password"
                id="signup-confirm-password"
                name="confirmPassword"
                value={signupData.confirmPassword}
                onChange={handleSignupInput}
                className={`w-full px-3 py-2 border rounded-md ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>
            
            <div>
              <label htmlFor="signup-account-type" className="block font-medium text-gray-700 mb-1 mt-3">
                Account Type
              </label>
              <select
                id="signup-account-type"
                name="accountType"
                value={signupData.accountType}
                onChange={handleSignupInput}
                className="account-type-select w-full"
              >
                <option value="creator">Creator</option>
                <option value="agency">Agency</option>
              </select>
            </div>
            
            {errors.general && (
              <div className="bg-red-50 text-red-600 p-3 rounded mt-4">
                {errors.general}
              </div>
            )}
            
            <button
              type="submit"
              className="login-button mt-4"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
            
            <div className="login-footer mt-4 text-sm">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-blue-600 hover:underline"
              >
                Already have an account? Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginModal;