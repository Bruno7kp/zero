import React from 'react';
import { Popover, ActionIcon, Button } from '@mantine/core';
import { Calendar } from '@mantine/dates';
import dayjs from 'dayjs';
import { IconCalendar, IconListNumbers } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface WeekPickerProps {
  inputValue: Date | null;
  locale: string;
  weeks: string[];
  onSelect: (weekStr: string) => void;
  disabled?: boolean;
}

export const WeekPicker: React.FC<WeekPickerProps> = ({ inputValue, locale, weeks, onSelect, disabled }) => {
  const [opened, setOpened] = React.useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const handleViewAllWeeks = () => {
    setOpened(false);
    navigate('/charts/weeks');
  };

  return (
    <Popover
      position="bottom"
      shadow="md"
      withArrow
      middlewares={{ flip: true, shift: true }}
      opened={opened}
      onChange={setOpened}
    >
      <Popover.Target>
        <ActionIcon
          variant={inputValue ? 'filled' : 'default'}
          color="blue"
          size="lg"
          m="xs"
          onClick={() => { if (!disabled) setOpened(o => !o); }}
          disabled={disabled}
        >
          <IconCalendar size={20} />
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown p={0} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Calendar
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
                    onSelect(dateStr);
                    setOpened(false);
                  }
                : undefined,
            } as any;
          }}
        />
        <Button
          fullWidth
          variant="light"
          leftSection={<IconListNumbers size={16} />}
          onClick={handleViewAllWeeks}
          style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
        >
          {t('charts.viewAllWeeks')}
        </Button>
      </Popover.Dropdown>
    </Popover>
  );
};

export default WeekPicker;
