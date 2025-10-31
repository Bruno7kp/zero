import { useEffect, useMemo, useState } from 'react';

export function useStableDisplayedData(
  data: any[],
  week?: string,
  type?: string,
  chartId?: string | number
) {
  const [displayedData, setDisplayedData] = useState<any[]>(data);
  // Track last non-empty dataset to avoid flicker without reading refs during render
  const [lastNonEmptyDisplayedData, setLastNonEmptyDisplayedData] = useState<any[]>(
    Array.isArray(data) && data.length ? data : []
  );
  const [displayedKey, setDisplayedKey] = useState<string | null>(null);
  const [switchHoldUntil, setSwitchHoldUntil] = useState<number | null>(null);
  const currentKey = useMemo(
    () => `${chartId || 'x'}|${type || 'n/a'}|${week || 'n/a'}`,
    [chartId, type, week]
  );

  const isDeltasReady = useMemo(() => {
    return (rows: any[], targetWeek?: string) => {
      if (!Array.isArray(rows) || !rows.length || !targetWeek) return false;
      const cur = rows.filter((r: any) => r.week === targetWeek);
      if (!cur.length) return false;
      let ready = 0;
      for (const r of cur) {
        const d = (r as any).deltaRank;
        if (d !== undefined && d !== null && d !== '-') ready++;
      }
      return ready >= Math.ceil(cur.length * 0.9);
    };
  }, []);

  useEffect(() => {
    if (!Array.isArray(data) || data.length === 0) return; // keep previous
    const sameKey = displayedKey === currentKey;
    const ready = isDeltasReady(data as any[], week);
    if (!sameKey) {
      if (ready) {
        requestAnimationFrame(() => {
          setDisplayedData(data);
          setLastNonEmptyDisplayedData(data);
          setDisplayedKey(currentKey);
          setSwitchHoldUntil(null);
        });
      } else {
        if (!switchHoldUntil) {
          requestAnimationFrame(() => setSwitchHoldUntil(Date.now() + 450));
        }
      }
    } else {
      if (ready) {
        requestAnimationFrame(() => {
          setDisplayedData(data);
          setLastNonEmptyDisplayedData(data);
        });
      }
    }
  }, [data, week, type, chartId, displayedKey, currentKey, isDeltasReady, switchHoldUntil]);

  useEffect(() => {
    if (!switchHoldUntil) return;
    const id = setInterval(() => {
      const ready = isDeltasReady(data as any[], week);
      if (ready || Date.now() >= switchHoldUntil) {
        if (Array.isArray(data) && data.length) {
          requestAnimationFrame(() => {
            setDisplayedData(data);
            setLastNonEmptyDisplayedData(data);
            setDisplayedKey(currentKey);
          });
        }
        requestAnimationFrame(() => setSwitchHoldUntil(null));
      }
    }, 60);
    return () => clearInterval(id);
  }, [switchHoldUntil, data, week, isDeltasReady, currentKey]);

  const safeDisplayedData =
    displayedData && displayedData.length > 0 ? displayedData : lastNonEmptyDisplayedData;
  return { safeDisplayedData };
}
