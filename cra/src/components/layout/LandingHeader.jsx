// src/components/layout/EnhancedLandingHeader.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { ChevronDown, Menu, X } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';


const LandingHeader = () => {
  const { setShowRegisterFlow, setShowLoginModal } = useAppContext();

  const [resourcesDropdownOpen, setResourcesDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Refs for dropdown handling
  const resourcesDropdownRef = useRef(null);
  
  // Toggle resources dropdown
  const toggleResourcesDropdown = () => {
    setResourcesDropdownOpen(!resourcesDropdownOpen);
  };
  
  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  // Close mobile menu
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (resourcesDropdownRef.current && !resourcesDropdownRef.current.contains(event.target)) {
        setResourcesDropdownOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [mobileMenuOpen]);
  
  return (
    <header className="landing-header">
      <div className="header-content">
        <div className="logo-container">
          <img src="/images/watermark.png" alt="Creation Rights Logo" className="logo" />
          {/* <span className="app-title">Creation Rights</span> */}
        </div>
        {/* Desktop Navigation Links */}
        <div className="lpNav">
        <nav className="hidden md:flex space-x-4">
            <a href="#" className="nav-link text-gray-700 hover:text-blue-600 font-medium">
              Marketplace
            </a>
            
            {/* Resources Dropdown */}
            <div className="relative" ref={resourcesDropdownRef}>
              <button 
                className="nav-link text-gray-700 hover:text-blue-600 font-medium flex items-center"
                onClick={toggleResourcesDropdown}
              >
                Resources
                <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${resourcesDropdownOpen ? 'transform rotate-180' : ''}`} />
              </button>
              
              {resourcesDropdownOpen && (
                <div className="dropdown-menu absolute top-full left-0 mt-1 bg-white shadow-md rounded-md py-1 w-48 z-10">
                  <a 
                    href="https://creationrights.com/news/" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setResourcesDropdownOpen(false)}
                  >
                    News
                  </a>
                  <a 
                    href="https://creationrights.com/frequently-asked-questions/" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setResourcesDropdownOpen(false)}
                  >
                    FAQ
                  </a>
                </div>
              )}
            </div>
            
            <a href="https://creationrights.com/about-us/" className="nav-link text-gray-700 hover:text-blue-600 font-medium">
              About
            </a>
          </nav>
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