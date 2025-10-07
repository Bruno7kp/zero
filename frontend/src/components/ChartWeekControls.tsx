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
import { Button, SegmentedControl, Flex, Center, VisuallyHidden, Text, Title, Grid, Menu, ActionIcon } from '@mantine/core';
import { ChartWeekColumnsDrawer } from './ChartWeekColumnsDrawer';
import { Calendar } from '@mantine/dates';
import { Popover } from '@mantine/core';
import { IconCalendar } from '@tabler/icons-react';
import { IconMicrophone, IconDisc, IconMusic, IconTable, IconLayoutGrid, IconList, IconArrowLeft, IconArrowRight, IconSettings, IconPencil } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { ChartWeekEditModal } from './ChartWeekEditModal';
import { useIsMobile } from '../hooks/useIsMobile';

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
	// Calcula o número da semana se inputValue existir
	let weekNum: number | null = null;
	if (inputValue) {
		const start = dayjs(inputValue);
		const chartStart = dayjs(chart.start_date);
		weekNum = Math.floor(start.diff(chartStart, 'day') / 7) + 1;
	}
	const [popoverOpened, setPopoverOpened] = useState(false);
	const topType = `charts.${type}sTop`;
	const [editOpened, setEditOpened] = React.useState(false);
	// Control drawer open from dropdown menu
	const [drawerOpened, setDrawerOpened] = React.useState(false);
	const isMobile = useIsMobile();

	// Shared settings menu (opens the columns drawer; on mobile also offers view switching)
	const settingsMenu = (
		<Menu withinPortal position="bottom" shadow="md" withArrow>
			<Menu.Target>
				<ActionIcon variant="subtle" aria-label="Opções" ml={0} my="xs">
					<IconSettings size={18} />
				</ActionIcon>
			</Menu.Target>
			<Menu.Dropdown>
				<Menu.Item leftSection={<IconSettings size={16} />} onClick={() => setDrawerOpened(true)}>
					{t('charts.columnsConfig')}
				</Menu.Item>
				<Menu.Item leftSection={<IconPencil size={16} />} disabled={!week || isBusy} onClick={() => setEditOpened(true)}>
					{t('common.edit')}
				</Menu.Item>
				{isMobile && (
					<>
						<Menu.Divider />
						<Menu.Label>{t('charts.view')}</Menu.Label>
						<Menu.Item leftSection={<IconTable size={16} />} onClick={() => handleSetView('table')}>
							{t('charts.tableView')}
						</Menu.Item>
						<Menu.Item leftSection={<IconList size={16} />} onClick={() => handleSetView('list')}>
							{t('charts.listView')}
						</Menu.Item>
						<Menu.Item leftSection={<IconLayoutGrid size={16} />} onClick={() => handleSetView('grid')}>
							{t('charts.gridView')}
						</Menu.Item>
					</>
				)}
			</Menu.Dropdown>
		</Menu>
	);

	return (
		<>
		<Grid>
			{/* Texto do período da semana selecionada, centralizado, em linha separada, abaixo dos controles */}
			{inputValue && (
				<Grid.Col span={12} ta="center">
					<Title order={2}>
						{t(topType, { week: weekNum })}
					</Title>
					<Text fw={600} size="sm">
						{(() => {
							const start = dayjs(inputValue);
							const end = start.add(6, 'day');
							return `${start.format('YYYY.MM.DD')} - ${end.format('YYYY.MM.DD')}`;
						})()}
					</Text>
				</Grid.Col>
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
					<SegmentedControl
						value={type}
						onChange={v => { if (!v || isBusy) return; triggerChange(week || '', v); }}
						data={chartTypes.map(({ value, icon }) => ({ label: icon, value, disabled: isBusy }))}
						size="sm"
						my="xs"
						withItemsBorders={false}
						disabled={isBusy}
					/>
					{/* Drawer control hidden trigger, controlled open */}
					<ChartWeekColumnsDrawer viewType={view} opened={drawerOpened} onOpenedChange={setDrawerOpened} hideTrigger />
				</Flex>
			</Grid.Col>
			{/* Centro: navegação de semana */}
			<Grid.Col span={{ base: 6, sm: 4 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
							m="xs"
							onClick={() => { setPopoverOpened((o) => !o); }}
						>
							<IconCalendar size={20} />
						</ActionIcon>
					</Popover.Target>
					<Popover.Dropdown p={0} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
						<Calendar
							// Força o calendário a montar no mês da semana selecionada
							key={inputValue ? dayjs(inputValue).format('YYYY-MM') : 'no-week'}
							locale={locale}
							defaultDate={inputValue || undefined}
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
					<SegmentedControl
							value={view}
							onChange={v => { handleSetView(v as 'table' | 'grid' | 'list'); }}
							data={[
								{ label: (<Center><IconTable size={18} /></Center>), value: 'table' },
								{ label: (<Center><IconList size={18} /></Center>), value: 'list' },
								{ label: (<Center><IconLayoutGrid size={18} /></Center>), value: 'grid' },
							]}
							size="sm"
							my="xs"
							withItemsBorders={false}
						/>
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
