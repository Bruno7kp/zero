import React, { useState } from 'react';
import { Box, Flex } from '@mantine/core';
import { StatsSidebar } from './StatsSidebar';
import { useIsMobile } from '../../hooks/useIsMobile';

interface StatsLayoutProps {
    children: React.ReactNode;
}

export const StatsLayout: React.FC<StatsLayoutProps> = ({ children }) => {
    const isMobile = useIsMobile();
    const [collapsed, setCollapsed] = useState(isMobile);

    return (
        <Flex direction={{ base: 'column', md: 'row' }} gap={0}>
            <Box 
                style={{ 
                    width: collapsed ? (isMobile ? '100%' : '60px') : (isMobile ? '100%' : '250px'),
                    transition: 'width 0.3s ease',
                    flexShrink: 0
                }}
            >
                <StatsSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
            </Box>
            <Box style={{ flex: 1, minWidth: 0 }}>
                {children}
            </Box>
        </Flex>
    );
};
