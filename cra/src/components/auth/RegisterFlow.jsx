// src/components/auth/RegisterFlow.jsx

import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, Mail, User, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAppContext } from '../../contexts/AppContext';

// Social media icons
import GoogleIcon from '../icons/GoogleIcon';
import FacebookIcon from '../icons/FacebookIcon';
import AppleIcon from '../icons/AppleIcon';
import InstagramIcon from '../icons/InstagramIcon';
import TwitterIcon from '../icons/TwitterIcon';
import YoutubeIcon from '../icons/YoutubeIcon';
import TikTokIcon from '../icons/TikTokIcon';

const RegisterFlow = () => {
  const { 
    showRegisterFlow, 
    setShowRegisterFlow, 
    handleSignup, 
    isLoading 
  } = useAppContext();
  
  // Steps: 1 = email, 2 = username, 3 = social media
  const [step, setStep] = useState(1);
  
  // Registration data
  const [registerData, setRegisterData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    accountType: 'creator', // Default to creator
    socialMedia: {
      instagram: '',
      twitter: '',
      youtube: '',
      tiktok: ''
    }
  });
  
  // Error state
  const [errors, setErrors] = useState({});
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // For nested properties like socialMedia.instagram
      const [parent, child] = name.split('.');
      setRegisterData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      // For direct properties
      setRegisterData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear related error
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  // Validate email step
  const validateEmailStep = () => {
    const newErrors = {};
    
    if (!registerData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(registerData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Validate username step
  const validateUsernameStep = () => {
    const newErrors = {};
    
    if (!registerData.username) {
      newErrors.username = 'Username is required';
    } else if (registerData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    // Simple password validation
    if (registerData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (registerData.password !== registerData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Go to next step
  const goToNextStep = () => {
    if (step === 1 && validateEmailStep()) {
      setStep(2);
    } else if (step === 2 && validateUsernameStep()) {
      setStep(3);
    }
  };
  
  // Go to previous step
  const goToPreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  // Handle sign up with social
  const handleSocialSignup = (provider) => {
    console.log(`Sign up with ${provider}`);
    // Implement social sign up logic here
  };
  
  // Handle final form submission
  const handleSubmit = async () => {
    try {
      // Prepare complete signup data
      const signupData = {
        email: registerData.email,
        password: registerData.password,
        name: registerData.username,
        accountType: registerData.accountType,
        socialLinks: {
          instagram: registerData.socialMedia.instagram,
          twitter: registerData.socialMedia.twitter,
          youtube: registerData.socialMedia.youtube,
          tiktok: registerData.socialMedia.tiktok
        }
      };
      
      // Call the signup handler from context
      const success = await handleSignup(signupData);
      
      if (success) {
        // Registration successful, modal will be closed by the handler
        console.log('Registration successful!');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({
        ...errors,
        general: error.message
      });
    }
  };
  
  // Handle skip social step and complete registration
  const handleSkipAndComplete = () => {
    handleSubmit();
  };
  
  if (!showRegisterFlow) {
    return null;
  }
  
  return (
    <div className="modal-overlay">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="relative p-6 border-b flex justify-center items-center">
          <img src="/images/crlogo.svg" alt="Creation Rights Logo" className="h-8 w-auto" />
          
          <button 
            onClick={() => setShowRegisterFlow(false)}
            className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Step indicator */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-6">
            <div className={`flex flex-col items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                <Mail className="h-4 w-4" />
              </div>
              <span className="text-xs mt-1">Email</span>
            </div>
            
            <div className={`w-16 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            
            <div className={`flex flex-col items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                <User className="h-4 w-4" />
              </div>
              <span className="text-xs mt-1">Profile</span>
            </div>
            
            <div className={`w-16 h-0.5 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            
            <div className={`flex flex-col items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                <Check className="h-4 w-4" />
              </div>
              <span className="text-xs mt-1">Social</span>
            </div>
          </div>
        </div>
        
        {/* Form steps */}
        <div className="p-6">
          {step === 1 && (
            <>
              <h2 className="text-xl font-bold text-center mb-6">Create an account</h2>
              
              <div className="mb-6">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={registerData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              
              <div className="mb-6">
                <Label htmlFor="accountType">Account Type</Label>
                <select
                  id="accountType"
                  name="accountType"
                  value={registerData.accountType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="creator">Creator</option>
                  <option value="agency">Agency</option>
                </select>
              </div>
              
              <Button 
                onClick={goToNextStep} 
                className="w-full mb-6"
              >
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <div className="relative flex items-center justify-center mb-6">
                <div className="border-t border-gray-300 w-full absolute"></div>
                <span className="bg-white px-2 z-10 text-sm text-gray-500">or continue with</span>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mb-6">
                <Button 
                  variant="outline" 
                  className="flex justify-center items-center"
                  onClick={() => handleSocialSignup('google')}
                >
                  <GoogleIcon className="h-5 w-5" />
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex justify-center items-center"
                  onClick={() => handleSocialSignup('facebook')}
                >
                  <FacebookIcon className="h-5 w-5" />
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex justify-center items-center"
                  onClick={() => handleSocialSignup('apple')}
                >
                  <AppleIcon className="h-5 w-5" />
                </Button>
              </div>
              
              <p className="text-xs text-center text-gray-500">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>
            </>
          )}
          
          {step === 2 && (
            <>
              <h2 className="text-xl font-bold text-center mb-6">Claim your creator name</h2>
              
              <div className="mb-4">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={registerData.username}
                  onChange={handleInputChange}
                  placeholder="Choose a username"
                  className={errors.username ? 'border-red-500' : ''}
                />
                {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
              </div>
              
              <div className="mb-4">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={registerData.password}
                  onChange={handleInputChange}
                  placeholder="Create a password"
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
              
              <div className="mb-6">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={registerData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={goToPreviousStep}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                
                <Button 
                  onClick={goToNextStep}
                  className="flex-1"
                >
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
          
          {step === 3 && (
            <>
              <h2 className="text-xl font-bold text-center mb-6">Connect your social accounts</h2>
              <p className="text-center text-gray-500 mb-6">
                Link your social media accounts to enhance your profile (optional)
              </p>
              
              <div className="grid grid-cols-1 gap-4 mb-6">
                <div className="border rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer">
                  <div className="flex items-center mb-2">
                    <InstagramIcon className="h-5 w-5 mr-2 text-pink-500" />
                    <Label htmlFor="instagram" className="cursor-pointer">Instagram</Label>
                  </div>
                  <Input
                    id="instagram"
                    name="socialMedia.instagram"
                    type="text"
                    value={registerData.socialMedia.instagram}
                    onChange={handleInputChange}
                    placeholder="Your Instagram handle"
                  />
                </div>
                
                <div className="border rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer">
                  <div className="flex items-center mb-2">
                    <TwitterIcon className="h-5 w-5 mr-2 text-blue-400" />
                    <Label htmlFor="twitter" className="cursor-pointer">Twitter</Label>
                  </div>
                  <Input
                    id="twitter"
                    name="socialMedia.twitter"
                    type="text"
                    value={registerData.socialMedia.twitter}
                    onChange={handleInputChange}
                    placeholder="Your Twitter handle"
                  />
                </div>
                
                <div className="border rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer">
                  <div className="flex items-center mb-2">
                    <YoutubeIcon className="h-5 w-5 mr-2 text-red-500" />
                    <Label htmlFor="youtube" className="cursor-pointer">YouTube</Label>
                  </div>
                  <Input
                    id="youtube"
                    name="socialMedia.youtube"
                    type="text"
                    value={registerData.socialMedia.youtube}
                    onChange={handleInputChange}
                    placeholder="Your YouTube channel"
                  />
                </div>
                
                <div className="border rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer">
                  <div className="flex items-center mb-2">
                    <TikTokIcon className="h-5 w-5 mr-2" />
                    <Label htmlFor="tiktok" className="cursor-pointer">TikTok</Label>
                  </div>
                  <Input
                    id="tiktok"
                    name="socialMedia.tiktok"
                    type="text"
                    value={registerData.socialMedia.tiktok}
                    onChange={handleInputChange}
                    placeholder="Your TikTok handle"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={goToPreviousStep}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                
                <Button 
                  onClick={handleSubmit}
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Account...' : 'Complete Setup'}
                </Button>
              </div>
              
              <div className="text-center mt-4">
                <button 
                  onClick={handleSkipAndComplete}
                  className="text-sm text-blue-600 hover:underline"
                  disabled={isLoading}
                >
                  Skip this step
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterFlow;