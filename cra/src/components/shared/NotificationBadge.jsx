import React from 'react';

const NotificationBadge = ({ count }) => {
  if (!count || count <= 0) return null;
  
  return (
    <span className="absolute -top-1 -right-1 flex items-center justify-center bg-red-500 text-white rounded-full text-xs w-4 h-4">
      {count > 9 ? '9+' : count}
    </span>
  );
};

export default NotificationBadge;