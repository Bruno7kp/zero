import React from 'react';
import { Badge } from '@mantine/core';

interface AllKillBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const AllKillBadge: React.FC<AllKillBadgeProps> = ({ size = 'sm' }) => {
  return (
    <Badge variant="filled" size={size}>
      All-Kill
    </Badge>
  );
};

export default AllKillBadge;
