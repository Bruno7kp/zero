// React import not required here as we only return JSX literals in column renderers
import type { DataTableColumn } from 'mantine-datatable';
import type { ChartData } from '../../db/indexedDb';
import { Text } from '@mantine/core';
import { IconArrowsDownUp } from '@tabler/icons-react';
import {
  RankCell,
  PlaysCell,
  PeakCell,
  WeeksCell,
  AltVariationCell,
  AltPlaysVariationCell,
  CertCell,
} from './TableCells';
import NameCell from './NameCell';

export interface BuildTableColumnsArgs {
  filteredColumns: any[];
  t: (k: any) => string;
  showDeltaBadge: boolean;
  showDeltaPlaysBadge: boolean;
  showDeltaPercentPlaysBadge: boolean;
  showImage: boolean;
  statsMap: Record<string, any>;
  clientId: string;
  clientSecret: string;
  imageForceUpdate: Record<string, number>;
  lastImageUrlByEntityId: Record<string, string | null>;
  type: 'artist' | 'album' | 'track' | string;
  badgeStylesRank: any;
  badgeStylesPlays: any;
  showAltVariationRedux: boolean;
  showAltPlaysVariationRedux: boolean;
  playsVariationLocation: 'hidden' | 'under' | 'column';
  playsVariationDisplay: 'hidden' | 'absolute' | 'percent';
  showPeakCount: boolean;
  lastPeakById: Record<string, number | null>;
  lastWeeksById: Record<string, number | null>;
  lastWeeksAtPeakById: Record<string, number | null>;
  altVariation?: (row: ChartData, index: number) => string | number | false | null | undefined;
  chart: any;
  viewSettings?: any;
  scaleSize: (s: 'xs' | 'sm' | 'md' | 'lg' | 'xl') => 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  onNameImageChange?: (row: ChartData) => void;
  onNameImageLoad?: (row: ChartData, url: string) => void;
  nameImageSize?: number;
  showFormulaInsteadOfPlays?: boolean;
  formulaName?: string;
}

export function buildTableColumns(args: BuildTableColumnsArgs): DataTableColumn<ChartData>[] {
  const {
    filteredColumns,
    t,
    showDeltaBadge,
    showDeltaPlaysBadge,
    showDeltaPercentPlaysBadge,
    showImage,
    statsMap,
    clientId,
    clientSecret,
    imageForceUpdate,
    lastImageUrlByEntityId,
    type,
    badgeStylesRank,
    badgeStylesPlays,
    showAltVariationRedux,
    showAltPlaysVariationRedux,
    playsVariationLocation,
    playsVariationDisplay,
    showPeakCount,
    lastPeakById,
    lastWeeksById,
    lastWeeksAtPeakById,
    altVariation,
    chart,
    viewSettings,
    scaleSize,
    onNameImageChange,
    onNameImageLoad,
    nameImageSize,
    showFormulaInsteadOfPlays,
    formulaName,
  } = args;

  const artistMode: 'under' | 'column' = (viewSettings || {}).artistDisplayMode || 'under';

  let built = filteredColumns.map((col: any): DataTableColumn<ChartData> => {
    // Use short label for plays column in table view
    let resolvedTitle =
      col.label != null
        ? typeof col.label === 'string'
          ? col.label.startsWith('charts.')
            ? t(col.label as any)
            : col.label
          : col.label
        : col.labelComplete
        ? t(col.labelComplete)
        : col.key;

    // Override with short version for plays column
    if (col.key === 'plays' && col.label === 'charts.playsLabel') {
      resolvedTitle = t('charts.playsLabelShort');
    }

    const base: Partial<DataTableColumn<ChartData>> = {
      accessor: col.key,
      title: resolvedTitle as any,
      textAlign: col.key === 'name' ? 'left' : 'center',
      width: col.key === 'name' ? undefined : 85,
    } as any;
    if (col.key === 'rank') {
      return {
        ...base,
        render: (row: ChartData) => (
          <RankCell
            row={row}
            showDeltaBadge={!!showDeltaBadge}
            badgeStylesRank={badgeStylesRank}
            scaleSize={scaleSize as any}
          />
        ),
      } as DataTableColumn<ChartData>;
    }
    if (col.key === 'plays') {
      const columnTitle = showFormulaInsteadOfPlays && formulaName ? formulaName : resolvedTitle;
      return {
        ...base,
        title: columnTitle as any,
        render: (row: ChartData) => {
          return (
            <PlaysCell
              row={row}
              showDeltaPlaysBadge={!!showDeltaPlaysBadge}
              showDeltaPercentPlaysBadge={!!showDeltaPercentPlaysBadge}
              playsVariationLocation={playsVariationLocation}
              badgeStylesPlays={badgeStylesPlays}
              scaleSize={scaleSize as any}
              showFormulaInsteadOfPlays={showFormulaInsteadOfPlays}
              chart={chart}
              chartType={type}
            />
          );
        },
      } as DataTableColumn<ChartData>;
    }
    if (col.key === 'name') {
      return {
        ...base,
        render: (row: ChartData) => (
          <NameCell
            row={row}
            showImage={!!showImage}
            artistMode={artistMode}
            type={type === 'artist' || type === 'album' || type === 'track' ? type : 'artist'}
            clientId={clientId}
            clientSecret={clientSecret}
            imageForceUpdate={imageForceUpdate[row.entityId]}
            lastImageUrl={lastImageUrlByEntityId[row.entityId]}
            onImageChange={() => onNameImageChange && onNameImageChange(row)}
            onImageLoad={url => onNameImageLoad && onNameImageLoad(row, url)}
            scaleSize={scaleSize as any}
            imageSize={nameImageSize}
          />
        ),
      } as DataTableColumn<ChartData>;
    }
    if (col.key === 'artist') {
      return {
        ...base,
        title: t('charts.artistLabel') as any,
        accessor: 'artist',
        textAlign: 'left' as const,
        width: undefined,
        render: (row: ChartData) => (
          <Text
            fw={500}
            size={scaleSize('sm')}
            style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}
          >
            {row.artistName || '-'}
          </Text>
        ),
      } as DataTableColumn<ChartData>;
    }
    if (col.key === 'peak') {
      return {
        ...base,
        render: (row: ChartData) => (
          <PeakCell
            stats={statsMap[row.entityId]}
            lastPeak={lastPeakById[row.entityId]}
            lastWeeksAtPeak={lastWeeksAtPeakById[row.entityId]}
            showPeakCount={showPeakCount}
            scaleSize={scaleSize as any}
          />
        ),
      } as DataTableColumn<ChartData>;
    }
    if (col.key === 'totalWeeks') {
      return {
        ...base,
        render: (row: ChartData) => (
          <WeeksCell
            stats={statsMap[row.entityId]}
            lastWeeks={lastWeeksById[row.entityId]}
            scaleSize={scaleSize as any}
          />
        ),
      } as DataTableColumn<ChartData>;
    }
    if (col.key === 'cert') {
      return {
        ...base,
        title: 'Cert.',
        render: (row: ChartData) =>
          type === 'album' || type === 'track' ? (
            <CertCell
              row={row}
              chart={chart}
              type={type as 'album' | 'track'}
              stats={statsMap[row.entityId]}
              scaleSize={scaleSize as any}
            />
          ) : null,
      } as DataTableColumn<ChartData>;
    }
    return {
      ...base,
      render: (row: ChartData) => <Text>{row.id}</Text>,
    } as DataTableColumn<ChartData>;
  });

  if (artistMode === 'column' && type !== 'artist') {
    const hasArtist = built.some((c: any) => (c as any).accessor === 'artist');
    if (!hasArtist) {
      const artistCol: DataTableColumn<ChartData> = {
        accessor: 'artist',
        title: t('charts.artistLabel') as any,
        textAlign: 'left' as const,
        render: (row: ChartData) => (
          <Text
            fw={500}
            style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}
          >
            {row.artistName || '-'}
          </Text>
        ),
      };
      const nameIdx = built.findIndex((c: any) => (c as any).accessor === 'name');
      if (nameIdx !== -1) built.splice(nameIdx + 1, 0, artistCol);
      else built.push(artistCol);
    }
  }

  if (showAltVariationRedux) {
    // Width rules: 65 only when icon + text; 50 for icon-only or text-only
    const treatAsHiddenForWidth =
      badgeStylesRank?.hideLabel && badgeStylesRank?.iconPosition === 'before';
    const isCompact = badgeStylesRank?.iconPosition === 'hidden' || treatAsHiddenForWidth; // compact when text-only or icon-only
    const columnWidth = isCompact ? 50 : 65;

    const altVariationCol: DataTableColumn<ChartData> = {
      accessor: 'altVariation',
      title: <IconArrowsDownUp size={18} stroke={2} style={{ verticalAlign: 'middle' }} />,
      textAlign: 'center',
      width: columnWidth,
      cellsStyle: () => ({ paddingRight: 0, paddingLeft: 0 }),
      render: (row: ChartData, index: number) => (
        <AltVariationCell
          row={row}
          index={index}
          badgeStylesRank={badgeStylesRank}
          altVariation={altVariation}
        />
      ),
    };
    const existingIdx = built.findIndex(
      (c: DataTableColumn<ChartData>) => (c as any).accessor === 'altVariation'
    );
    if (existingIdx !== -1) built[existingIdx] = altVariationCol;
    else {
      const rankIdx = built.findIndex(
        (c: DataTableColumn<ChartData>) => (c as any).accessor === 'rank'
      );
      if (rankIdx !== -1)
        built = [...built.slice(0, rankIdx + 1), altVariationCol, ...built.slice(rankIdx + 1)];
      else built = [altVariationCol, ...built];
    }
  }

  if (showAltPlaysVariationRedux) {
    const altPlaysCol: DataTableColumn<ChartData> = {
      accessor: 'altPlaysVariation',
      title: <IconArrowsDownUp size={18} stroke={2} style={{ verticalAlign: 'middle' }} />,
      textAlign: 'center',
      width: 84,
      cellsStyle: () => ({ paddingRight: 0, paddingLeft: 0 }),
      render: (row: ChartData) => (
        <AltPlaysVariationCell
          row={row}
          badgeStylesPlays={badgeStylesPlays}
          playsVariationDisplay={playsVariationDisplay}
          showFormulaInsteadOfPlays={showFormulaInsteadOfPlays}
          chart={chart}
          chartType={type}
        />
      ),
    };
    const existingIdx = built.findIndex(
      (c: DataTableColumn<ChartData>) => (c as any).accessor === 'altPlaysVariation'
    );
    if (existingIdx !== -1) built[existingIdx] = altPlaysCol;
    else {
      const playsIdx = built.findIndex(
        (c: DataTableColumn<ChartData>) => (c as any).accessor === 'plays'
      );
      if (playsIdx !== -1)
        built = [...built.slice(0, playsIdx + 1), altPlaysCol, ...built.slice(playsIdx + 1)];
      else built = [altPlaysCol, ...built];
    }
  }

  return built;
}

export default buildTableColumns;
