// src/components/shared/WatermarkedImage.jsx

import React, { useState } from 'react';
import PropTypes from 'prop-types';

const WatermarkedImage = ({ 
  src, 
  alt, 
  className = '', 
  watermarkSrc = '/images/watermark.png', 
  watermarkOpacity = 0.3, 
  watermarkSize = 40, 
  watermarkPattern = true,
  getProxiedImageUrl = null, 
  currentUser = null
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Process the image URL if a proxy function is provided
  const processedSrc = getProxiedImageUrl && currentUser && currentUser.email 
    ? getProxiedImageUrl(src, currentUser.email) 
    : src;
  
  const containerStyle = {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
  };
  
  const imageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    msUserSelect: 'none',
  };
  
  // Get pattern style for watermark
  const getPatternStyle = () => {
    return {
      position: 'absolute',
      top: 14,
      left:20,
      width: '75%',
      height: '75%',
      backgroundImage: `url(${watermarkSrc})`,
      backgroundSize: `${watermarkSize}%`,
      backgroundRepeat: 'space',
      pointerEvents: 'none',
      opacity: watermarkOpacity,
      transform: 'rotate(-20deg)',
    };
  };
  
  // Get single watermark style
  const getSingleWatermarkStyle = () => {
    return {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: `${watermarkSize}%`,
      maxWidth: '150px',
      height: 'auto',
      opacity: watermarkOpacity,
      pointerEvents: 'none',
    };
  };
  
  const handleLoad = () => {
    setImageLoaded(true);
  };

  return (
    <div style={containerStyle} className={className}>
      <img 
        src={processedSrc} 
        alt={alt} 
        style={imageStyle} 
        onLoad={handleLoad}
        onContextMenu={(e) => e.preventDefault()} 
        draggable="false"
      />
      
      {imageLoaded && (
        watermarkPattern ? (
          <div style={getPatternStyle()} />
        ) : (
          <img 
            src={watermarkSrc} 
            alt="Watermark" 
            style={getSingleWatermarkStyle()} 
          />
        )
      )}
    </div>
  );
};

WatermarkedImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string,
  className: PropTypes.string,
  watermarkSrc: PropTypes.string,
  watermarkOpacity: PropTypes.number,
  watermarkSize: PropTypes.number,
  watermarkPattern: PropTypes.bool,
  getProxiedImageUrl: PropTypes.func,
  currentUser: PropTypes.object
};

export default WatermarkedImage;