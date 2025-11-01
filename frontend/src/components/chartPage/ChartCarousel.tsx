import { useEffect, useMemo, useRef, lazy, Suspense, useState } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import { Carousel } from '@mantine/carousel';
import { Box, Skeleton } from '@mantine/core';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../store';
import type { ChartData } from '../../db/indexedDb';
import { db } from '../../db/indexedDb';
import { computeWeekDeltas, fetchChartData, fetchStatsMapIncremental } from '../../store/charts';
import type { SlideKind } from './SlideCard';
const SlideCard = lazy(() => import('./SlideCard'));

interface ChartCarouselProps {
  chart: any | null;
  week?: string;
  type: 'artist' | 'album' | 'track' | string;
  clientId: string;
  clientSecret: string;
}

// SlideCard moved to separate component with i18n support

function ChartCarousel({ chart, week, type, clientId, clientSecret }: ChartCarouselProps) {
  const autoplay = useRef(Autoplay({ delay: 10000 }));
  const dispatch = useDispatch<AppDispatch>();
  const rows: ChartData[] = useSelector((s: any) => (s.charts.data || []) as ChartData[]);
  const statsMap = useSelector((s: any) => s.charts.statsMap || {});
  const [artistTop1Count, setArtistTop1Count] = useState<number | null>(null);

  // Ensure data and deltas for current week are calculated
  useEffect(() => {
    if (!chart?.id || !week || !type) return;
    dispatch(fetchChartData({ chartId: String(chart.id), chartType: String(type), week }));
  }, [chart?.id, week, type, dispatch]);
  useEffect(() => {
    if (!chart?.id || !week || !type) return;
    if (!rows.length) return;
    dispatch(computeWeekDeltas({ chartId: String(chart.id), chartType: String(type), week, rows }));
  }, [chart?.id, week, type, rows, dispatch]);
  useEffect(() => {
    if (!chart?.id || !week || !type) return;
    if (!rows.length) return;
    // We need totals (weeks on chart) for the visible entities
    const wants = rows.length > 0;
    if (!wants) return;
    const anyMissing = rows.some(r => !statsMap[r.entityId] || !statsMap[r.entityId]?.totals);
    if (anyMissing) {
      // Defer a bit to avoid contention during initial render
      const id = setTimeout(() => {
        dispatch(
          fetchStatsMapIncremental({
            chartId: String(chart.id),
            chartType: String(type),
            data: rows,
            week,
          })
        );
      }, 500);
      return () => clearTimeout(id);
    }
  }, [chart?.id, week, type, rows, statsMap, dispatch]);

  const weekRows = useMemo(() => rows.filter(r => r.week === week), [rows, week]);

  const top1 = useMemo(() => weekRows.find(r => r.rank === 1) || null, [weekRows]);
  const biggestDebut = useMemo(() => {
    const debuts = weekRows.filter(r => r.deltaRank === 'NEW');
    if (!debuts.length) return null;
    return debuts.slice().sort((a, b) => a.rank - b.rank)[0];
  }, [weekRows]);
  const biggestClimb = useMemo(() => {
    const climbs = weekRows.filter(
      r => typeof r.deltaRank === 'number' && (r.deltaRank as number) > 0
    ) as Array<ChartData & { deltaRank: number }>;
    if (!climbs.length) return null;
    climbs.sort((a, b) => b.deltaRank - a.deltaRank || a.rank - b.rank);
    return climbs[0];
  }, [weekRows]);
  const biggestReentry = useMemo(() => {
    const re = weekRows.filter(r => r.deltaRank === 'RE');
    if (!re.length) return null;
    return re.slice().sort((a, b) => a.rank - b.rank)[0];
  }, [weekRows]);
  const mostWeeks = useMemo(() => {
    let best: ChartData | null = null;
    let bestWeeks = -1;
    for (const r of weekRows) {
      const st = statsMap[r.entityId];
      const weeksOn = st?.totals?.withinCutoff ?? null;
      if (typeof weeksOn === 'number' && weeksOn > bestWeeks) {
        bestWeeks = weeksOn;
        best = r;
      }
    }
    return best;
  }, [weekRows, statsMap]);

  const slides: Array<{ kind: SlideKind; row: ChartData }> = useMemo(() => {
    const arr: Array<{ kind: SlideKind; row: ChartData }> = [];
    if (top1) arr.push({ kind: 'top1', row: top1 });
    // Remove separate total_top1s slide; combined into the top1 slide content
    if (biggestDebut) arr.push({ kind: 'debut', row: biggestDebut });
    if (biggestClimb) arr.push({ kind: 'climb', row: biggestClimb });
    if (biggestReentry) arr.push({ kind: 'reentry', row: biggestReentry });
    if (mostWeeks) arr.push({ kind: 'weeks', row: mostWeeks });
    return arr;
  }, [top1, biggestDebut, biggestClimb, biggestReentry, mostWeeks]);

  // Compute how many distinct albums/tracks this artist has taken to #1 historically in this chart
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!chart?.id || !top1 || !(type === 'album' || type === 'track')) {
        if (!cancelled) setArtistTop1Count(null);
        return;
      }
      try {
        // Fetch all rows for this chart/type to compute distinct #1s by artist
        const all = await db.charts_data
          .where(['chartId', 'chartType'])
          .equals([String(chart.id), String(type)])
          .toArray();
        if (cancelled) return;
        const artistName = top1.artistName;
        const currentEntityId = top1.entityId;

        // Find the first week this specific entity reached #1
        let firstWeekAtNumber1: string | null = null;
        for (const r of all) {
          if (r.entityId === currentEntityId && r.rank === 1) {
            if (!firstWeekAtNumber1 || r.week < firstWeekAtNumber1) {
              firstWeekAtNumber1 = r.week;
            }
          }
        }

        // Now count how many distinct entities by this artist reached #1 BEFORE that first week
        const seen = new Set<string>();
        if (firstWeekAtNumber1) {
          for (const r of all) {
            // Only count #1s that occurred BEFORE the first week of the current entity
            if (r.week < firstWeekAtNumber1 && r.rank === 1 && r.artistName === artistName) {
              seen.add(r.entityId);
            }
          }
        }

        // The count is the number of previous #1s + 1 (this one)
        setArtistTop1Count(seen.size + 1);
      } catch {
        if (!cancelled) setArtistTop1Count(null);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [chart?.id, top1, type, week]);

  const renderPlaceholder = () => (
    <div
      style={{ height: 200, display: 'flex', width: '100%', maxWidth: '100%', overflow: 'hidden' }}
    >
      <Box style={{ height: '100%', width: '100%' }}>
        <Skeleton height="100%" radius="md" />
      </Box>
    </div>
  );

  // Keep reserved height to avoid layout jumping when week changes
  if (!chart || !week || !type) return renderPlaceholder();

  // If there are no highlights for the selected week yet, show a skeleton with the same height
  if (slides.length === 0) return renderPlaceholder();

  return (
    <div
      style={{ height: 200, display: 'flex', width: '100%', maxWidth: '100%', overflow: 'hidden' }}
    >
      <Carousel
        withIndicators
        height="100%"
        style={{ flex: 1, width: '100%', maxWidth: '100%', overflow: 'hidden' }}
        plugins={[autoplay.current]}
        onMouseEnter={autoplay.current.stop}
        onMouseLeave={() => autoplay.current.play()}
        slideSize="100%"
        emblaOptions={{ loop: true, containScroll: 'trimSnaps', align: 'start' }}
      >
        {slides.map(({ kind, row }) => (
          <Carousel.Slide key={`${kind}:${row.entityId}`}>
            <Suspense
              fallback={
                <Box style={{ height: '100%', width: '100%' }}>
                  <Skeleton height="100%" radius="md" />
                </Box>
              }
            >
              <SlideCard
                row={row}
                kind={kind}
                chartType={type}
                clientId={clientId}
                clientSecret={clientSecret}
                // For the combined top1 slide, include artist total #1s when applicable
                stats={
                  kind === 'top1' && (type === 'album' || type === 'track')
                    ? {
                        ...(statsMap[row.entityId] || {}),
                        peak: {
                          ...(statsMap[row.entityId]?.peak || {}),
                          totalTop1s: artistTop1Count ?? undefined,
                        },
                      }
                    : statsMap[row.entityId]
                }
              />
            </Suspense>
          </Carousel.Slide>
        ))}
      </Carousel>
    </div>
  );
}

export default ChartCarousel;
