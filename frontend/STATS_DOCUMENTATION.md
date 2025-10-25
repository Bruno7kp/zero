# Stats Section Documentation

## Overview
The stats section provides comprehensive analytics for chart data stored in IndexedDB using Dexie. All statistics are based on the currently selected chart in localStorage.

## Features

### Main Page (`/stats`)
- Home page with preview cards for all available statistics
- Each card links to its respective detailed statistics page
- Clean, card-based layout with hover effects

### Statistics Pages

#### 1. All #Ns (`/stats/rank/:N/:type`)
- Shows all entries that reached a specific rank (e.g., all #1s)
- Displays: Times at rank, Title, Artist, Plays, Sales
- Filters: Year, Type, Position
- Aggregates occurrences per entity

#### 2. Perfect All Kill (`/stats/pak`)
- Displays weeks where an artist reached #1 in all three charts (artist, album, track) simultaneously
- Columns: Week, Artist, Album, Track
- Filters: Year only

#### 3. Most Weeks at #N (`/stats/times_at_rank/:N/:type`)
- Shows entities with the most weeks at a specific position
- Columns: Weeks, Title, Artist
- Filters: Year, Type, Position

#### 4. Longest in Top N (`/stats/times_at_top/:N/:type`)
- Entries with most weeks in top N positions
- Columns: Weeks, Title, Artist
- Filters: Year, Type, Position

#### 5. Highest Weekly Plays (`/stats/plays/:N/:type`)
- Biggest weekly play counts
- Columns: Week, Position, Title, Artist, Plays, Sales
- Filters: Year, Type
- Sales toggle available

#### 6. Strongest Debuts (`/stats/debuts/:N/:type`)
- Best first week performances
- Columns: Week, Position, Title, Artist, Plays, Sales
- Filters: Year, Type
- Sales toggle available

#### 7. Top Point Accumulators (`/stats/points/:type`)
- Highest total points earned across all weeks
- Columns: Title, Artist, Weeks in Chart, Total Points
- Filters: Year, Type

#### 8. Artists with Most #1s (`/stats/times_at_top_by_artist/:N/:type`)
- Artists with most entries at a specific position
- Columns: Artist, Titles at #N, Total Weeks at #N
- Filters: Year, Type, Position
- Sorted by number of unique titles by default

## Components

### StatsLayout
- Main layout wrapper with collapsible sidebar
- Responsive design (mobile-friendly)
- Sidebar collapses on mobile by default

### StatsSidebar
- Navigation for all statistics categories
- Shows active state for current page
- Collapsible with tooltips in collapsed state
- Requires an active chart to display

### StatsFilters
- Reusable filter component
- Year filter: from chart's first year to current year, plus "All Years"
- Type filter: Artist, Album, Track
- Position filter: 1 to chart cutoff for that type
- Conditionally shows/hides filters based on page needs

### StatsTable
- Reusable table component using Mantine DataTable
- Features:
  - Pagination (100 items per page)
  - Sorting on all columns
  - Sales column toggle (hidden by default)
  - Loading states
  - Responsive design

### useStatsData Hook
- Central hook for all data fetching operations
- Functions:
  - `fetchRankData`: Get all entries at a specific rank
  - `fetchPAKData`: Find Perfect All Kill weeks
  - `fetchAggregatedStats`: Aggregate data by entity
  - `fetchPlaysOrDebuts`: Get plays or debut data
  - `fetchArtistAggregatedStats`: Aggregate by artist
- Includes utilities:
  - `calculateSales`: (plays × weightplays) + (points × weightpoints)
  - `calculatePoints`: Based on rank and chart cutoff

## Data Flow

1. User selects a chart (stored in Redux state)
2. Stats pages read activeChartId from Redux
3. useStatsData hook queries IndexedDB via Dexie
4. Data is filtered by year, type, and position
5. Results are aggregated/processed as needed
6. StatsTable displays with pagination and sorting

## Performance Considerations

- All queries use indexed fields for optimal performance
- Pagination limits displayed data to 100 items per page
- Sales calculations are performed only when needed (toggle)
- Data is cached in component state to avoid re-fetching

## Navigation

- Header menu includes "Statistics" link
- Sidebar provides quick navigation between stat types
- Each stat card on home page is clickable
- Chart week links allow navigation to specific weeks
