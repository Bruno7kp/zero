import React from 'react';
import { Flex } from '@mantine/core';
import { SpotifyImageWithModal } from '../SpotifyImageWithModal';
import { useSelector } from 'react-redux';

interface StatsImageCellProps {
    entityId: string;
    name: string;
    artistName: string;
    type: 'artist' | 'album' | 'track';
}

export const StatsImageCell: React.FC<StatsImageCellProps> = ({
    entityId,
    name,
    artistName,
    type
}) => {
    const chart = useSelector((state: any) => {
        const charts = state.charts.charts;
        const activeChartId = state.charts.activeChartId;
        return charts.find((c: any) => c.id === activeChartId) || null;
    });

    const clientId = chart?.spotify_client_id || '';
    const clientSecret = chart?.spotify_client_secret || '';

    return (
        <Flex
            justify="center"
            align="center"
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
        >
            <SpotifyImageWithModal
                entityId={entityId}
                name={name}
                artistName={artistName}
                type={type}
                clientId={clientId}
                clientSecret={clientSecret}
                width={40}
                height={40}
                borderRadius={6}
                style={{ minWidth: 40, maxWidth: 40 }}
                onImageChange={() => {}}
                onImageLoad={() => {}}
            />
        </Flex>
    );
};
