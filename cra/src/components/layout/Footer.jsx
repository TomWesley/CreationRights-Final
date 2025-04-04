import React from 'react';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <div className="footer-logo">
            <img src="/crlogo.svg" alt="Creation Rights Logo" className="footer-logo-img" />
            
          </div>
          <p className="footer-copyright">Copyright © 2025</p>
        </div>
        <div className="footer-links">
          <a href="#" className="footer-link">About</a>
          <a href="#" className="footer-link">Contact</a>
          <a href="#" className="footer-link">Privacy</a>
          <a href="#" className="footer-link">Terms</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;