import React from 'react';
import { useParams } from 'react-router-dom';
import { Container, Text, Alert } from '@mantine/core';
import { StatsLayout } from '../components/stats-section/StatsLayout';
import { StatsRankPage } from '../components/stats-section/pages/StatsRankPage';
import { StatsPAKPage } from '../components/stats-section/pages/StatsPAKPage';
import { StatsTimesAtRankPage } from '../components/stats-section/pages/StatsTimesAtRankPage';
import { StatsTimesAtTopPage } from '../components/stats-section/pages/StatsTimesAtTopPage';
import { StatsPlaysPage } from '../components/stats-section/pages/StatsPlaysPage';
import { StatsDebutsPage } from '../components/stats-section/pages/StatsDebutsPage';
import { StatsPointsPage } from '../components/stats-section/pages/StatsPointsPage';
import { StatsTimesAtTopByArtistPage } from '../components/stats-section/pages/StatsTimesAtTopByArtistPage';
import { IconAlertCircle } from '@tabler/icons-react';

export const StatsDetailPage: React.FC = () => {
    const { name, position, type } = useParams<{ name: string; position?: string; type?: string }>();

    const renderStatsPage = () => {
        switch (name) {
            case 'rank':
                return <StatsRankPage position={position} type={type} />;
            case 'pak':
                return <StatsPAKPage />;
            case 'times_at_rank':
                return <StatsTimesAtRankPage position={position} type={type} />;
            case 'times_at_top':
                return <StatsTimesAtTopPage position={position} type={type} />;
            case 'plays':
                return <StatsPlaysPage position={position} type={type} />;
            case 'debuts':
                return <StatsDebutsPage position={position} type={type} />;
            case 'points':
                return <StatsPointsPage type={type} />;
            case 'times_at_top_by_artist':
                return <StatsTimesAtTopByArtistPage position={position} type={type} />;
            default:
                return (
                    <Alert icon={<IconAlertCircle size={16} />} title="Not Found" color="red">
                        <Text>The requested statistic page was not found.</Text>
                    </Alert>
                );
        }
    };

    return (
        <StatsLayout>
            <Container size="xl" px="xs">
                {renderStatsPage()}
            </Container>
        </StatsLayout>
    );
};

export default StatsDetailPage;
