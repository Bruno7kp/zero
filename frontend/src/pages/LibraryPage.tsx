import React, { useMemo } from 'react';
import { Container, Text, Flex, Loader, Center } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { LibraryFilters } from '../components/library/LibraryFilters';
import { LibraryStats } from '../components/library/LibraryStats';
import { LibraryTableView } from '../components/library/LibraryTableView';
import { LibraryGridView } from '../components/library/LibraryGridView';
import { useLibraryData } from '../hooks/useLibraryData';
import { useLibraryFilters } from '../hooks/useLibraryFilters';
import CreateHeader from '../components/createChart/CreateHeader';

export interface LibraryItem {
  name: string;
  artistName?: string;
  peak: number;
  weeks: number;
  timesAtPeak?: number;
  points: number;
  playcount?: number;
  sales?: number;
  image?: string;
  certification?: string;
  entityId?: string;
}

export const LibraryPage: React.FC = () => {
  const { t } = useTranslation();
  const charts = useSelector((state: any) => state.charts.charts);
  const activeChartId = useSelector((state: any) => state.charts.activeChartId);
  const chart = useMemo(
    () => charts.find((c: any) => c.id === activeChartId) || null,
    [charts, activeChartId]
  );

  const {
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
  } = useLibraryFilters();

  const { loading, libraryData, totalItems, number1s, inChart } = useLibraryData(
    chart,
    selectedType,
    search,
    itemsPerPage,
    page
  );

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [selectedType, search, itemsPerPage, setPage]);

  // Calculate stats for header
  const stats = useMemo(() => {
    // When searching, use libraryData length
    if (search.trim() !== '') {
      return { total: totalItems, number1s, inChart };
    }

    // When not searching, use totalItems from API
    return { total: totalItems, number1s, inChart };
  }, [totalItems, search, number1s, inChart]);

  // Paginate data - for search, data is already paginated in fetch
  const paginatedData = useMemo(() => {
    return libraryData;
  }, [libraryData]);

  const totalPages =
    search.trim() !== ''
      ? Math.ceil(totalItems / itemsPerPage)
      : Math.ceil(totalItems / itemsPerPage);

  if (!chart) {
    return (
      <Container size="lg" py="xl">
        <Center>
          <Text>{t('errors.selectActiveChart')}</Text>
        </Center>
      </Container>
    );
  }

  return (
    <Container className="noPaddingMobile">
      <CreateHeader pageTitle={t('library.title')} />
      <Flex direction="column" gap="md">
        <LibraryFilters
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          viewMode={viewMode}
          setViewMode={setViewMode}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          search={search}
          setSearch={setSearch}
          badgeStyle={badgeStyle}
          setBadgeStyle={setBadgeStyle}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          showGridPlays={showGridPlays}
          setShowGridPlays={setShowGridPlays}
          showGridPeak={showGridPeak}
          setShowGridPeak={setShowGridPeak}
          showGridPosition={showGridPosition}
          setShowGridPosition={setShowGridPosition}
          chart={chart}
        />

        <LibraryStats
          type={selectedType}
          total={stats.total}
          number1s={stats.number1s}
          inChart={stats.inChart}
        />

        {loading ? (
          <Center py="xl">
            <Flex direction="column" align="center" gap="md">
              <Loader size="xl" />
              <Text>{t('library.loading')}</Text>
            </Flex>
          </Center>
        ) : (
          <>
            {search.trim() !== '' && libraryData.length === 0 ? (
              <Center py="xl">
                <Text>{t('library.noItemsFound')}</Text>
              </Center>
            ) : (
              <>
                {viewMode === 'table' ? (
                  <LibraryTableView
                    items={paginatedData}
                    type={selectedType}
                    page={page}
                    setPage={setPage}
                    totalPages={totalPages}
                    chart={chart}
                    itemsPerPage={itemsPerPage}
                    visibleColumns={visibleColumns}
                  />
                ) : (
                  <LibraryGridView
                    items={paginatedData}
                    type={selectedType}
                    page={page}
                    setPage={setPage}
                    totalPages={totalPages}
                    chart={chart}
                    badgeStyle={badgeStyle}
                    showGridPlays={showGridPlays}
                    showGridPeak={showGridPeak}
                    showGridPosition={showGridPosition}
                    itemsPerPage={itemsPerPage}
                  />
                )}
              </>
            )}
          </>
        )}
      </Flex>
    </Container>
  );
};

export default LibraryPage;
