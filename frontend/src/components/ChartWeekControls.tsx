import React, { useState, useEffect } from 'react';
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
import { Button, SegmentedControl, Flex, Center, VisuallyHidden, Text, Title } from '@mantine/core';
import { ChartWeekTableColumnsMenu } from './ChartWeekTable';
import { Calendar } from '@mantine/dates';
import { Popover, ActionIcon } from '@mantine/core';
import { IconCalendar } from '@tabler/icons-react';
import { IconMicrophone, IconDisc, IconMusic, IconTable, IconLayoutGrid, IconList, IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import { useSelector } from 'react-redux';

const chartTypes = [
	{
		value: 'artist', icon: (
			<Center>
				<IconMicrophone size={18} />
				<VisuallyHidden>Artist</VisuallyHidden>
			</Center>
		)
	},
	{
		value: 'album', icon: (
			<Center>
				<IconDisc size={18} />
				<VisuallyHidden>Album</VisuallyHidden>
			</Center>
		)
	},
	{
		value: 'track', icon: (
			<Center>
				<IconMusic size={18} />
				<VisuallyHidden>Track</VisuallyHidden>
			</Center>
		)
	},
];


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
		if (propView && propView !== view) setView(propView);
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
	const isBusy = locked || navLockRef.current;
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
	const [popoverOpened, setPopoverOpened] = useState(false);
	const cutoffType = type === 'track' ? 'music_cutoff' : `${type}_cutoff`;
	const cutoff = (chart as any)[cutoffType] !== undefined ? (chart as any)[cutoffType] : 100;
	const topType = `charts.${type}sTop`;

		return (
			<Flex gap="md" align="center" wrap="wrap" mb="md" justify="space-between" direction={{ base: 'column', sm: 'row' }}>
			{/* Texto do período da semana selecionada, centralizado, em linha separada, abaixo dos controles */}
			{inputValue && (
				<Flex direction="column" justify="center" align="center" style={{ width: '100%' }}>
                    <Title order={2}>{t(topType, {cutoff})}</Title>
                    <Title order={5}>{chart.name}</Title>
					<Text fw={600} size="sm">
						{(() => {
							const start = dayjs(inputValue);
							const end = start.add(6, 'day');
							const chartStart = dayjs(chart.start_date);
							const weekNum = Math.floor(start.diff(chartStart, 'day') / 7) + 1;
							return `${start.format('YYYY-MM-DD')} - ${end.format('YYYY-MM-DD')} (Semana ${weekNum})`;
						})()}
					</Text>
				</Flex>
			)}
			{/* Esquerda: seleção de tipo */}
			<SegmentedControl
				value={type}
				onChange={v => { if (!v || isBusy) return; triggerChange(week || '', v); }}
				data={chartTypes.map(({ value, icon }) => ({ label: icon, value, disabled: isBusy }))}
				size="sm"
				withItemsBorders={false}
				disabled={isBusy}
			/>
			{/* Centro: navegação de semana */}
			<Flex gap="xs" align="center">
				<Button onClick={handlePrev} size="xs" variant="subtle" px={6} disabled={!prev || isBusy}><IconArrowLeft size={18} /></Button>
				<Popover
					position="bottom"
					shadow="md"
					withArrow
					middlewares={{ flip: true, shift: true }}
					opened={popoverOpened}
					onChange={setPopoverOpened}
				>
					<Popover.Target>
						<ActionIcon
							variant={inputValue ? 'filled' : 'default'}
							color="blue"
							size="lg"
							onClick={() => { setPopoverOpened((o) => !o); }}
						>
							<IconCalendar size={20} />
						</ActionIcon>
					</Popover.Target>
					<Popover.Dropdown p={0} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
						<Calendar
							locale={locale}
							withCellSpacing={false}
							getDayProps={(date) => {
								const dateStr = dayjs(date).format('YYYY-MM-DD');
								const isEnabled = weeks.includes(dateStr);
								const isSelected = !!inputValue && dayjs(inputValue).isSame(date, 'day');
								return {
									disabled: !isEnabled,
									selected: isSelected,
									onClick: isEnabled
										? () => {
											onChange(dateStr, type);
											setPopoverOpened(false);
										}
										: undefined,
								};
							}}
						/>
					</Popover.Dropdown>
				</Popover>
				<Button onClick={handleNext} size="xs" variant="subtle" px={6} disabled={!next || isBusy}><IconArrowRight size={18} /></Button>
			</Flex>

			{/* Direita: seleção de visualização + botão de colunas */}
			<Flex gap="xs" align="center">
				   {/* Botão de colunas, agora respeita viewType */}
				   <ChartWeekTableColumnsMenu viewType={view} />
				<SegmentedControl
					value={view}
					onChange={v => { handleSetView(v as 'table' | 'grid' | 'list'); }}
					data={[
						{ label: (<Center><IconTable size={18} /></Center>), value: 'table' },
						{ label: (<Center><IconList size={18} /></Center>), value: 'list' },
						{ label: (<Center><IconLayoutGrid size={18} /></Center>), value: 'grid' },
					]}
					size="sm"
					withItemsBorders={false}
				/>
			</Flex>
		</Flex>
	);
};
