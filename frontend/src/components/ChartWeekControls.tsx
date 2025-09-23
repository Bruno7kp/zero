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
import { Button, SegmentedControl, Flex } from '@mantine/core';
import { ChartWeekTableColumnsMenu } from './ChartWeekTable';
import { Calendar } from '@mantine/dates';
import { Popover, ActionIcon } from '@mantine/core';
import { IconCalendar } from '@tabler/icons-react';
import { IconMicrophone, IconDisc, IconMusic, IconTable, IconLayoutGrid, IconList, IconArrowLeft, IconArrowRight } from '@tabler/icons-react';

const chartTypes = [
  { label: '', value: 'artist', icon: <IconMicrophone size={18} /> },
  { label: '', value: 'album', icon: <IconDisc size={18} /> },
  { label: '', value: 'track', icon: <IconMusic size={18} /> },
];


interface ChartWeekControlsProps {
  chart: any;
  week?: string;
  type: string;
  onChange: (week: string, type: string) => void;
  view: 'table' | 'grid' | 'list';
  setView: (v: 'table' | 'grid' | 'list') => void;
  columns: any[];
  toggleColumn: (key: string) => void;
}

function getDay(date: string) {
  const day = dayjs(date).day();
  return day === 0 ? 6 : day - 1;
}

function startOfWeek(date: string) {
  return dayjs(date)
    .subtract(getDay(date) + 1, 'day')
    .toDate();
}

function endOfWeek(date: string) {
  return dayjs(date)
    .add(6 - getDay(date), 'day')
    .endOf('day')
    .toDate();
}


// Retorna o início da semana (YYYY-MM-DD) para um dia, dado o day_of_week
function getWeekStart(date: string, dayOfWeek: number) {
  const d = dayjs(date);
  const diff = (d.day() - dayOfWeek + 7) % 7;
  return d.subtract(diff, 'day').format('YYYY-MM-DD');
}

// Retorna o fim da semana (YYYY-MM-DD) para um dia, dado o day_of_week
function getWeekEnd(date: string, dayOfWeek: number) {
  const start = dayjs(getWeekStart(date, dayOfWeek));
  return start.add(6, 'day').format('YYYY-MM-DD');
}

// Verifica se date está no range da semana de value (ambos YYYY-MM-DD)
function isInWeekRange(date: string, value: string | null, dayOfWeek: number) {
  if (!value) return false;
  const weekStart = getWeekStart(value, dayOfWeek);
  const weekEnd = getWeekEnd(value, dayOfWeek);
  return dayjs(date).isSame(weekStart) || dayjs(date).isSame(weekEnd) || (dayjs(date).isAfter(weekStart) && dayjs(date).isBefore(weekEnd));
}

export const ChartWeekControls: React.FC<ChartWeekControlsProps> = ({ chart, week, type, onChange, view, setView, columns, toggleColumn }) => {
  const { i18n } = useTranslation();
  const localeMapping: Record<string, string> = { 'pt': 'pt-br' };
  const locale = localeMapping[i18n.language] || i18n.language;
  const [hovered, setHovered] = useState<string | null>(null);
  // Semanas válidas para navegação
  const weeks = getClosedChartWeeks(chart.start_date, chart.day_of_week, chart.timezone);
  const { prev, next } = getPrevNextWeek(weeks, week);
  const handlePrev = () => {
    if (prev) onChange(prev, type);
  };
  const handleNext = () => {
    if (next) onChange(next, type);
  };
  // Função para saber se uma data está na lista de semanas válidas



  // Para destacar a semana selecionada
  const getWeekRange = (date: Date) => {
    const d = dayjs(date).tz(chart.timezone).startOf('day');
    const start = d.subtract((d.day() - chart.day_of_week + 7) % 7, 'day');
    return [start.toDate(), start.add(6, 'day').toDate()];
  };

  // Valor do input: sempre o início da semana selecionada no timezone do chart
  const inputValue = week ? dayjs(week).toDate() : null;
  const [popoverOpened, setPopoverOpened] = useState(false);

  return (
    <Flex gap="md" align="center" wrap="wrap" mb="md" justify="space-between">
        {/* Texto do período da semana selecionada, centralizado, em linha separada, abaixo dos controles */}
      {inputValue && (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
          <span style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>
            {(() => {
              const start = dayjs(inputValue);
              const end = start.add(6, 'day');
              const chartStart = dayjs(chart.start_date);
              const weekNum = Math.floor(start.diff(chartStart, 'day') / 7) + 1;
              return `${start.format('YYYY-MM-DD')} - ${end.format('YYYY-MM-DD')} (Semana ${weekNum})`;
            })()}
          </span>
        </div>
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
              value={inputValue}
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
            {/* Texto do período da semana */}
            {inputValue && (
              <div style={{ fontSize: 12, color: '#666', marginTop: 8, textAlign: 'center' }}>
                {(() => {
                  const start = dayjs(inputValue);
                  const end = start.add(6, 'day');
                  // Calcular número da semana desde o start_date do chart
                  const chartStart = dayjs(chart.start_date);
                  const weekNum = Math.floor(start.diff(chartStart, 'day') / 7) + 1;
                  return `${start.format('YYYY-MM-DD')} - ${end.format('YYYY-MM-DD')} (Semana ${weekNum})`;
                })()}
              </div>
            )}
          </Popover.Dropdown>
        </Popover>
        <Button onClick={handleNext} size="xs" variant="subtle" px={6} disabled={!next}><IconArrowRight size={18} /></Button>
      </Flex>
      
      {/* Direita: seleção de visualização + botão de colunas */}
      <Flex gap="xs" align="center">
        {/* Botão de colunas, só mostra se for tabela */}
        {view === 'table' && <ChartWeekTableColumnsMenu columns={columns} toggleColumn={toggleColumn} />}
        <SegmentedControl
          value={view}
          onChange={v => setView(v as any)}
          data={[
            { label: <IconTable size={18} />, value: 'table' },
            { label: <IconLayoutGrid size={18} />, value: 'grid' },
            { label: <IconList size={18} />, value: 'list' },
          ]}
          size="sm"
          withItemsBorders={false}
        />
      </Flex>
    </Flex>
  );
};
