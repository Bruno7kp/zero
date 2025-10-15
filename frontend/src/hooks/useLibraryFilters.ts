import { useState, useEffect, useMemo } from 'react';

type LibraryType = 'artist' | 'album' | 'track';
type ViewMode = 'table' | 'grid';

export const useLibraryFilters = () => {
    // Load preferences from localStorage
    const [selectedType, setSelectedType] = useState<LibraryType>(() => {
        try {
            const saved = localStorage.getItem('libraryType');
            return (saved === 'artist' || saved === 'album' || saved === 'track') ? saved : 'artist';
        } catch {
            return 'artist';
        }
    });

    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        try {
            const saved = localStorage.getItem('libraryViewMode');
            return (saved === 'table' || saved === 'grid') ? saved : 'grid'; // Default to grid since table is removed
        } catch {
            return 'grid';
        }
    });

    const [itemsPerPage, setItemsPerPage] = useState<number>(() => {
        try {
            const saved = localStorage.getItem('libraryItemsPerPage');
            return saved ? parseInt(saved, 10) : 25;
        } catch {
            return 25;
        }
    });

    const [search, setSearch] = useState<string>(() => {
        try {
            const saved = localStorage.getItem('librarySearch');
            return saved || '';
        } catch {
            return '';
        }
    });

    const [badgeStyle, setBadgeStyle] = useState<'glass' | 'solid'>(() => {
        try {
            const saved = localStorage.getItem('libraryBadgeStyle');
            return (saved === 'glass' || saved === 'solid') ? saved : 'glass';
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
        try {
            const saved = localStorage.getItem('libraryVisibleColumns');
            return saved ? JSON.parse(saved) : {
                points: true,
                peak: true,
                weeks: true,
                sales: false,
                cert: false,
            };
        } catch {
            return {
                points: true,
                peak: true,
                weeks: true,
                sales: false,
                cert: false,
            };
        }
    });

    const [page, setPage] = useState(1);

    const [showGridPlays, setShowGridPlays] = useState<boolean>(() => {
        try {
            const saved = localStorage.getItem('libraryShowGridPlays');
            return saved ? JSON.parse(saved) : true; // Default to true
        } catch {
            return true;
        }
    });

    // Save preferences to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('libraryType', selectedType);
        } catch (e) {
            console.error('Failed to save library type:', e);
        }
    }, [selectedType]);

    useEffect(() => {
        try {
            localStorage.setItem('libraryViewMode', viewMode);
        } catch (e) {
            console.error('Failed to save view mode:', e);
        }
    }, [viewMode]);

    useEffect(() => {
        try {
            localStorage.setItem('libraryItemsPerPage', String(itemsPerPage));
        } catch (e) {
            console.error('Failed to save items per page:', e);
        }
    }, [itemsPerPage]);

    useEffect(() => {
        try {
            localStorage.setItem('librarySearch', search);
        } catch (e) {
            console.error('Failed to save search:', e);
        }
    }, [search]);

    useEffect(() => {
        try {
            localStorage.setItem('libraryBadgeStyle', badgeStyle);
        } catch (e) {
            console.error('Failed to save badge style:', e);
        }
    }, [badgeStyle]);

    useEffect(() => {
        try {
            localStorage.setItem('libraryVisibleColumns', JSON.stringify(visibleColumns));
        } catch (e) {
            console.error('Failed to save visible columns:', e);
        }
    }, [visibleColumns]);

    useEffect(() => {
        try {
            localStorage.setItem('libraryShowGridPlays', JSON.stringify(showGridPlays));
        } catch (e) {
            console.error('Failed to save show grid plays:', e);
        }
    }, [showGridPlays]);

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
        page,
        setPage,
        stats,
    };
};