import { useState, useEffect, useMemo } from 'react';
import * as storage from '../utils/storage';
import { KEYS, LEGACY_KEYS } from '../constants/storageKeys';

type LibraryType = 'artist' | 'album' | 'track';
type ViewMode = 'table' | 'grid';

export const useLibraryFilters = () => {
    // Load preferences from localStorage
    const [selectedType, setSelectedType] = useState<LibraryType>(() => {
        try {
            const saved = storage.get(KEYS.LIBRARY_TYPE, [LEGACY_KEYS.LIBRARY_TYPE]);
            return (saved === 'artist' || saved === 'album' || saved === 'track') ? (saved as LibraryType) : 'artist';
        } catch {
            return 'artist';
        }
    });

    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        try {
            const saved = storage.get(KEYS.LIBRARY_VIEW_MODE, [LEGACY_KEYS.LIBRARY_VIEW_MODE]);
            return (saved === 'table' || saved === 'grid') ? (saved as ViewMode) : 'grid'; // Default to grid since table is removed
        } catch {
            return 'grid';
        }
    });

    const [itemsPerPage, setItemsPerPage] = useState<number>(() => {
        try {
            const saved = storage.get(KEYS.LIBRARY_ITEMS_PER_PAGE, [LEGACY_KEYS.LIBRARY_ITEMS_PER_PAGE]);
            return saved ? parseInt(saved, 10) : 25;
        } catch {
            return 25;
        }
    });

    const [search, setSearch] = useState<string>(() => {
        try {
            const saved = storage.get(KEYS.LIBRARY_SEARCH, [LEGACY_KEYS.LIBRARY_SEARCH]);
            return saved || '';
        } catch {
            return '';
        }
    });

    const [badgeStyle, setBadgeStyle] = useState<'glass' | 'solid'>(() => {
        try {
            const saved = storage.get(KEYS.LIBRARY_BADGE_STYLE, [LEGACY_KEYS.LIBRARY_BADGE_STYLE]);
            return (saved === 'glass' || saved === 'solid') ? (saved as 'glass' | 'solid') : 'glass';
        } catch {
            return 'glass';
        }
    });

    const [visibleColumns, setVisibleColumns] = useState<{
        points: boolean;
        peak: boolean;
        weeks: boolean;
        sales: boolean;
        cert: boolean;
    }>(() => {
        const defaultVisible = {
            points: true,
            peak: true,
            weeks: true,
            sales: false,
            cert: false,
        };
        try {
            const saved = storage.getJson<{ points: boolean; peak: boolean; weeks: boolean; sales: boolean; cert: boolean }>(
                KEYS.LIBRARY_VISIBLE_COLUMNS,
                [LEGACY_KEYS.LIBRARY_VISIBLE_COLUMNS]
            );
            return saved ? saved : defaultVisible;
        } catch {
            return defaultVisible;
        }
    });

    const [page, setPage] = useState(1);

    const [showGridPlays, setShowGridPlays] = useState<boolean>(() => {
        try {
            const saved = storage.getJson<boolean>(KEYS.LIBRARY_SHOW_GRID_PLAYS, [LEGACY_KEYS.LIBRARY_SHOW_GRID_PLAYS]);
            return saved !== null ? saved : true; // Default to true
        } catch {
            return true;
        }
    });

    const [showGridPeak, setShowGridPeak] = useState<boolean>(() => {
        try {
            const saved = storage.getJson<boolean>(KEYS.LIBRARY_SHOW_GRID_PEAK, [LEGACY_KEYS.LIBRARY_SHOW_GRID_PEAK]);
            return saved !== null ? saved : true; // Default to true
        } catch {
            return true;
        }
    });

    const [showGridPosition, setShowGridPosition] = useState<boolean>(() => {
        try {
            const saved = storage.getJson<boolean>(KEYS.LIBRARY_SHOW_GRID_POSITION, [LEGACY_KEYS.LIBRARY_SHOW_GRID_POSITION]);
            return saved !== null ? saved : false; // Default to false
        } catch {
            return false;
        }
    });

    // Save preferences to localStorage
    useEffect(() => {
        try {
            storage.set(KEYS.LIBRARY_TYPE, selectedType);
        } catch (e) {
            console.error('Failed to save library type:', e);
        }
    }, [selectedType]);

    useEffect(() => {
        try {
            storage.set(KEYS.LIBRARY_VIEW_MODE, viewMode);
        } catch (e) {
            console.error('Failed to save view mode:', e);
        }
    }, [viewMode]);

    useEffect(() => {
        try {
            storage.set(KEYS.LIBRARY_ITEMS_PER_PAGE, String(itemsPerPage));
        } catch (e) {
            console.error('Failed to save items per page:', e);
        }
    }, [itemsPerPage]);

    useEffect(() => {
        try {
            storage.set(KEYS.LIBRARY_SEARCH, search);
        } catch (e) {
            console.error('Failed to save search:', e);
        }
    }, [search]);

    useEffect(() => {
        try {
            storage.set(KEYS.LIBRARY_BADGE_STYLE, badgeStyle);
        } catch (e) {
            console.error('Failed to save badge style:', e);
        }
    }, [badgeStyle]);

    useEffect(() => {
        try {
            storage.setJson(KEYS.LIBRARY_VISIBLE_COLUMNS, visibleColumns);
        } catch (e) {
            console.error('Failed to save visible columns:', e);
        }
    }, [visibleColumns]);

    useEffect(() => {
        try {
            storage.setJson(KEYS.LIBRARY_SHOW_GRID_PLAYS, showGridPlays);
        } catch (e) {
            console.error('Failed to save show grid plays:', e);
        }
    }, [showGridPlays]);

    useEffect(() => {
        try {
            storage.setJson(KEYS.LIBRARY_SHOW_GRID_PEAK, showGridPeak);
        } catch (e) {
            console.error('Failed to save show grid peak:', e);
        }
    }, [showGridPeak]);

    useEffect(() => {
        try {
            storage.setJson(KEYS.LIBRARY_SHOW_GRID_POSITION, showGridPosition);
        } catch (e) {
            console.error('Failed to save show grid position:', e);
        }
    }, [showGridPosition]);

    // Reset page when type or search changes - handled by components using this hook

    // Calculate stats for header
    const stats = useMemo(() => {
        // This will be calculated in the component using the data from useLibraryData
        return { total: 0, number1s: 0, inChart: 0 };
    }, []);

    return {
        selectedType,
        setSelectedType,
        viewMode,
        setViewMode,
        itemsPerPage,
        setItemsPerPage,
        search,
        setSearch,
        badgeStyle,
        setBadgeStyle,
        visibleColumns,
        setVisibleColumns,
        showGridPlays,
        setShowGridPlays,
        showGridPeak,
        setShowGridPeak,
        showGridPosition,
        setShowGridPosition,
        page,
        setPage,
        stats,
    };
};
