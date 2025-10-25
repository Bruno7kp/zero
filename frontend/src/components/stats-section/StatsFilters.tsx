import React, { useMemo } from 'react';
import { Group, Select, NumberInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

interface StatsFiltersProps {
    year: string;
    type: string;
    position?: number;
    onYearChange: (year: string) => void;
    onTypeChange: (type: string) => void;
    onPositionChange?: (position: number) => void;
    showPosition?: boolean;
    showType?: boolean;
}

export const StatsFilters: React.FC<StatsFiltersProps> = ({
    year,
    type,
    position,
    onYearChange,
    onTypeChange,
    onPositionChange,
    showPosition = false,
    showType = true
}) => {
    const { t } = useTranslation();
    const chart = useSelector((state: any) => {
        const charts = state.charts.charts;
        const activeChartId = state.charts.activeChartId;
        return charts.find((c: any) => c.id === activeChartId) || null;
    });

    // Get year range from chart's first year to current year
    const yearOptions = useMemo(() => {
        if (!chart || !chart.year) return [{ value: 'all', label: t('stats.allYears', { defaultValue: 'All Years' }) }];
        
        const currentYear = new Date().getFullYear();
        const firstYear = parseInt(chart.year);
        const years = [{ value: 'all', label: t('stats.allYears', { defaultValue: 'All Years' }) }];
        
        for (let y = currentYear; y >= firstYear; y--) {
            years.push({ value: String(y), label: String(y) });
        }
        
        return years;
    }, [chart, t]);

    const typeOptions = [
        { value: 'artist', label: t('charts.artist', { defaultValue: 'Artist' }) },
        { value: 'album', label: t('charts.album', { defaultValue: 'Album' }) },
        { value: 'track', label: t('charts.track', { defaultValue: 'Track' }) }
    ];

    // Get cutoff for the selected type
    const getCutoff = () => {
        if (!chart) return 100;
        if (type === 'artist') return chart.artist_cutoff || 100;
        if (type === 'album') return chart.album_cutoff || 100;
        if (type === 'track') return chart.music_cutoff || 100;
        return 100;
    };

    return (
        <Group gap="md" mb="md">
            <Select
                label={t('stats.year', { defaultValue: 'Year' })}
                value={year}
                onChange={(value) => onYearChange(value || 'all')}
                data={yearOptions}
                style={{ minWidth: 150 }}
            />
            
            {showType && (
                <Select
                    label={t('stats.type', { defaultValue: 'Type' })}
                    value={type}
                    onChange={(value) => onTypeChange(value || 'artist')}
                    data={typeOptions}
                    style={{ minWidth: 150 }}
                />
            )}
            
            {showPosition && onPositionChange && position !== undefined && (
                <NumberInput
                    label={t('stats.position', { defaultValue: 'Position' })}
                    value={position}
                    onChange={(value) => onPositionChange(Number(value) || 1)}
                    min={1}
                    max={getCutoff()}
                    style={{ minWidth: 120 }}
                />
            )}
        </Group>
    );
};
