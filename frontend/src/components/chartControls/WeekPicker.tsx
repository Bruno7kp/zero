import React from 'react';
import { Popover, ActionIcon } from '@mantine/core';
import { Calendar } from '@mantine/dates';
import dayjs from 'dayjs';
import { IconCalendar } from '@tabler/icons-react';

interface WeekPickerProps {
  inputValue: Date | null;
  locale: string;
  weeks: string[];
  onSelect: (weekStr: string) => void;
  disabled?: boolean;
}

export const WeekPicker: React.FC<WeekPickerProps> = ({ inputValue, locale, weeks, onSelect, disabled }) => {
  const [opened, setOpened] = React.useState(false);
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
      </Popover.Dropdown>
    </Popover>
  );
};

export default WeekPicker;
