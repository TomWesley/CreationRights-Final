// src/components/shared/LoadingIndicator.jsx

import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingIndicator = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="font-medium">Loading...</span>
      </div>
    </div>
  );
};

export default LoadingIndicator;