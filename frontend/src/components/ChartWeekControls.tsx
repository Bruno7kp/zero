import React, { useState } from 'react';
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


interface ChartWeekControlsProps {
	chart: any;
	week?: string;
	type: string;
	onChange: (week: string, type: string) => void;
	view: 'table' | 'grid' | 'list';
	setView: (v: 'table' | 'grid' | 'list') => void;
}

export const ChartWeekControls: React.FC<ChartWeekControlsProps> = ({ chart, week, type, onChange, view, setView }) => {
	const { t, i18n } = useTranslation();
	const reduxLanguage = useSelector((state: any) => state.i18n.language);
	React.useEffect(() => {
		if (i18n.language !== reduxLanguage) {
			i18n.changeLanguage(reduxLanguage);
		}
	}, [reduxLanguage, i18n]);
	const localeMapping: Record<string, string> = { 'pt': 'pt-br' };
	const locale = localeMapping[i18n.language] || i18n.language;
	// Semanas válidas para navegação
	const weeks = getClosedChartWeeks(chart.start_date, chart.day_of_week, chart.timezone);
	const { prev, next } = getPrevNextWeek(weeks, week);
	const handlePrev = () => {
		if (prev) onChange(prev, type);
	};
	const handleNext = () => {
		if (next) onChange(next, type);
	};

	// Valor do input: sempre o início da semana selecionada no timezone do chart
	const inputValue = week ? dayjs(week).toDate() : null;
	const [popoverOpened, setPopoverOpened] = useState(false);
	const cutoffType = type === 'track' ? 'music_cutoff' : `${type}_cutoff`;
	const cutoff = (chart as any)[cutoffType] !== undefined ? (chart as any)[cutoffType] : 100;
	const topType = `charts.${type}sTop`;

	return (
		<Flex gap="md" align="center" wrap="wrap" mb="md" justify="space-between">
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
				onChange={v => v && onChange(week || '', v)}
				data={chartTypes.map(({ value, icon }) => ({ label: icon, value }))}
				size="sm"
				withItemsBorders={false}
			/>
			{/* Centro: navegação de semana */}
			<Flex gap="xs" align="center">
				<Button onClick={handlePrev} size="xs" variant="subtle" px={6} disabled={!prev}><IconArrowLeft size={18} /></Button>
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
							onClick={() => setPopoverOpened((o) => !o)}
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
				<Button onClick={handleNext} size="xs" variant="subtle" px={6} disabled={!next}><IconArrowRight size={18} /></Button>
			</Flex>

			{/* Direita: seleção de visualização + botão de colunas */}
			<Flex gap="xs" align="center">
				{/* Botão de colunas, só mostra se for tabela */}
				   {view === 'table' && <ChartWeekTableColumnsMenu />}
				<SegmentedControl
					value={view}
					onChange={v => setView(v as any)}
					data={[
						{ label: (<Center><IconTable size={18} /></Center>), value: 'table' },
						{ label: (<Center><IconLayoutGrid size={18} /></Center>), value: 'grid' },
						{ label: (<Center><IconList size={18} /></Center>), value: 'list' },
					]}
					size="sm"
					withItemsBorders={false}
				/>
			</Flex>
		</Flex>
	);
};
