import React, { useEffect } from 'react';
import { flushSync } from 'react-dom';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { useTranslation } from 'react-i18next';
import 'dayjs/locale/pt-br';
dayjs.extend(utc);
dayjs.extend(timezone);
import { getClosedChartWeeks } from '../utils/chartWeekUtils';
import { getPrevNextWeek } from '../utils/chartWeekNav';
import { Button, Flex, Grid } from '@mantine/core';
import { ChartWeekColumnsDrawer } from './ChartWeekColumnsDrawer';
// calendar moved into WeekPicker component
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { ChartWeekEditModal } from './ChartWeekEditModal';
import { useIsMobile } from '../hooks/useIsMobile';
import SettingsMenu from './chartControls/SettingsMenu';
import WeekHeader from './chartControls/WeekHeader';
import { TypeControl, ViewControl } from './chartControls/TypeAndViewControls';
import WeekPicker from './chartControls/WeekPicker';

// chartTypes moved into TypeControl


type ChartWeekControlsProps = {
	chart: any;
	week?: string;
	type: string;
	onChange: (week: string, type: string) => void;
	view?: 'table' | 'grid' | 'list';
	setView?: (v: 'table' | 'grid' | 'list') => void;
};

export const ChartWeekControls: React.FC<ChartWeekControlsProps> = ({ chart, week, type, onChange, view: propView, setView: propSetView }) => {
	const { t, i18n } = useTranslation();
	const reduxLanguage = useSelector((state: any) => state.i18n.language);
	React.useEffect(() => {
		if (i18n.language !== reduxLanguage) {
			i18n.changeLanguage(reduxLanguage);
		}
	}, [reduxLanguage, i18n]);

	// Persistência do tipo de visualização
	const VIEW_KEY = 'chartWeekView';
	const [view, setView] = React.useState<'table' | 'grid' | 'list'>(() => {
		const saved = typeof window !== 'undefined' ? localStorage.getItem(VIEW_KEY) : null;
		return (saved === 'table' || saved === 'grid' || saved === 'list') ? saved : 'table';
	});

	// Se receber props controladas, sincroniza o estado local
	useEffect(() => {
		if (propView && propView !== view) {
			requestAnimationFrame(() => setView(propView));
		}
	}, [propView, view]);

	const handleSetView = (v: 'table' | 'grid' | 'list') => {
		setView(v);
		localStorage.setItem(VIEW_KEY, v);
		if (propSetView) propSetView(v);
	};
	const localeMapping: Record<string, string> = { 'pt': 'pt-br' };
	const locale = localeMapping[i18n.language] || i18n.language;
	// Semanas válidas para navegação
	const weeks = getClosedChartWeeks(chart.start_date, chart.day_of_week, chart.timezone);
	const { prev, next } = getPrevNextWeek(weeks, week);
	// Bloqueio simplificado: sempre trava 2000ms após clique de navegação/tipo
	const [locked, setLocked] = React.useState(false);
	const navLockRef = React.useRef(false);
	const timerRef = React.useRef<number | null>(null);
	const FIXED_LOCK_MS = 1500; // 1.5s conforme solicitado
	// Avoid reading refs during render; locked mirrors the nav lock state
	const isBusy = locked;
	const clearLock = () => {
		if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
		navLockRef.current = false;
		setLocked(false);
	};
	React.useEffect(() => () => clearLock(), []);
	const triggerChange = (nextWeek: string, nextType: string) => {
		if (navLockRef.current || locked) return;
		flushSync(() => { navLockRef.current = true; setLocked(true); });
		if (timerRef.current) clearTimeout(timerRef.current);
		timerRef.current = window.setTimeout(() => { clearLock(); }, FIXED_LOCK_MS);
		requestAnimationFrame(() => onChange(nextWeek, nextType));
	};

	const handlePrev = () => {
		if (!prev || isBusy) return;
		triggerChange(prev, type);
	};
	const handleNext = () => {
		if (!next || isBusy) return;
		triggerChange(next, type);
	};

	// Valor do input: sempre o início da semana selecionada no timezone do chart
	const inputValue = week ? dayjs(week).toDate() : null;
	// Calcula o número da semana se inputValue existir
	let weekNum: number | null = null;
	if (inputValue) {
		const start = dayjs(inputValue);
		const chartStart = dayjs(chart.start_date);
		weekNum = Math.floor(start.diff(chartStart, 'day') / 7) + 1;
	}
	const topType = `charts.${type}sTop`;
	const [editOpened, setEditOpened] = React.useState(false);
	// Control drawer open from dropdown menu
	const [drawerOpened, setDrawerOpened] = React.useState(false);
	const isMobile = useIsMobile();

	// Shared settings menu (opens the columns drawer; on mobile also offers view switching)
	const settingsMenu = (
		<SettingsMenu
			t={t as any}
			week={week}
			isBusy={isBusy}
			isMobile={isMobile}
			onOpenDrawer={() => setDrawerOpened(true)}
			onOpenEdit={() => setEditOpened(true)}
			onSetView={handleSetView}
		/>
	);

	return (
		<>
		<Grid>
			{/* Texto do período da semana selecionada, centralizado, em linha separada, abaixo dos controles */}
			{inputValue && (
				<WeekHeader inputValue={inputValue} topLabel={t(topType, { week: weekNum })} />
			)}
			{/* Esquerda: seleção de tipo */}
			<Grid.Col span={{ base: 6, sm: 4 }}>
				<Flex
					align="center"
					justify={{ base: 'center', sm: 'flex-start' }}
					w="100%"
				>
					{/* Mobile: show settings menu before the type segmented control */}
					{isMobile && settingsMenu}
					<TypeControl type={type} isBusy={isBusy} onChangeType={(v) => triggerChange(week || '', v)} />
					{/* Drawer control hidden trigger, controlled open */}
					<ChartWeekColumnsDrawer viewType={view} opened={drawerOpened} onOpenedChange={setDrawerOpened} hideTrigger />
				</Flex>
			</Grid.Col>
			{/* Centro: navegação de semana */}
			<Grid.Col span={{ base: 6, sm: 4 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				<Button onClick={handlePrev} size="xs" variant="subtle" px={6} disabled={!prev || isBusy}><IconArrowLeft size={18} /></Button>
				<WeekPicker
					inputValue={inputValue}
					locale={locale}
					weeks={weeks}
					onSelect={(dateStr) => onChange(dateStr, type)}
					disabled={isBusy}
				/>
				<Button onClick={handleNext} size="xs" variant="subtle" px={6} disabled={!next || isBusy}><IconArrowRight size={18} /></Button>
			</Grid.Col>

			{/* Direita: seleção de visualização (desktop) */}
			{!isMobile && (
			<Grid.Col span={{ base: 4, sm: 4 }}>
				<Flex
					align="center"
					justify={{ base: 'center', sm: 'flex-end' }}
					w="100%"
					style={{ minHeight: 40 }}
				>
					<ViewControl view={view} onSetView={handleSetView} />
					{/* Desktop: show settings menu at the end, after the view segmented control */}
					{!isMobile && settingsMenu}
				</Flex>
			</Grid.Col>
			)}
		</Grid>
		<ChartWeekEditModal opened={editOpened} onClose={() => setEditOpened(false)} chart={chart} week={week} type={type as any} />
		</>
	);
};
