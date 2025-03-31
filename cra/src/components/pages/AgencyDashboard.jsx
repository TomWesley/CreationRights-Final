import React from 'react';
import CreatorDashboard from './CreatorDashboard';
import CreatorManagement from './CreatorManagement';

import { useAppContext } from '../../contexts/AppContext';

const AgencyDashboard = () => {
  return (
    <div className="dashboard">
      <CreatorDashboard />
      <CreatorManagement />
    </div>
  );
};

export default AgencyDashboard;