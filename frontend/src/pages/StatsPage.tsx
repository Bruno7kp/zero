import React from 'react';
import { Container } from '@mantine/core';
import { StatsLayout } from '../components/stats-section/StatsLayout';
import { StatsHomePage } from '../components/stats-section/StatsHomePage';

export const StatsPage: React.FC = () => {
    return (
        <StatsLayout>
            <Container size="xl" px="xs">
                <StatsHomePage />
            </Container>
        </StatsLayout>
    );
};

export default StatsPage;
