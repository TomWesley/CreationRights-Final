import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

const StatCard = ({ title, value, icon: Icon }) => {
  return (
    <Card>
      <CardHeader className="stats-header">
        <CardTitle className="stats-title">
          {Icon && <Icon className="stats-icon" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="stats-value">{value}</p>
      </CardContent>
    </Card>
  );
};

export default StatCard;