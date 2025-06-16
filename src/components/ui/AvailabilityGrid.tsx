'use client';
import { useState } from 'react';

import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import {
  Calendar,
  dateFnsLocalizer,
  Views,
  SlotInfo,
  Event,
} from 'react-big-calendar';
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addDays,
  setHours,
  setMinutes,
  startOfDay,
} from 'date-fns';


interface Props {
  startDate: Date;
  days: number;
  initialSelected?: Set<string>;
  onChange?: (slots: Set<string>) => void;
}

type AvailabilityEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
};
const locales = {
  'en-US': enUS,
};
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export default function AvailabilityGrid({ startDate, days, initialSelected, onChange }: Props) {
  const [currentDate, setCurrentDate] = useState(startDate);
  const [events, setEvents] = useState<AvailabilityEvent[]>(() => {
    if (!initialSelected) return [];
    return Array.from(initialSelected).map((iso) => {
      const start = new Date(iso);
      return {
        id: iso,
        title: 'Available',
        start,
        end: new Date(start.getTime() + 30 * 60000),
      };
    });
  });

  const minTime = setHours(setMinutes(startOfDay(new Date()), 0), 8);
  const maxTime = setHours(setMinutes(startOfDay(new Date()), 0), 20);
  const maxDate = addDays(startDate, days - 1);

  const handleSelectSlot = ({ start, end }: SlotInfo) => {
    const startRounded = setMinutes(start, start.getMinutes() < 30 ? 0 : 30);
    const endRounded = setMinutes(end, end.getMinutes() < 30 ? 0 : 30);

    const next = [...events];
    for (let d = new Date(startRounded); d < endRounded; d = new Date(d.getTime() + 30 * 60000)) {
      const slot = new Date(d.setSeconds(0, 0));
      const iso = slot.toISOString();
      const idx = next.findIndex((e) => e.id === iso);
      if (idx >= 0) {
        next.splice(idx, 1);
      } else {
        next.push({
          id: iso,
          title: 'Available',
          start: new Date(iso),
          end: new Date(new Date(iso).getTime() + 30 * 60000),
        });
      }
    }

    setEvents(next);
    onChange?.(new Set(next.map((e) => e.start.toISOString())));
  };

  const handleNavigate = (date: Date) => {
    const weekStart = startOfWeek(date);
    const weekEnd = addDays(weekStart, 6);
    let newDate = weekStart;
    if (weekStart < startDate) newDate = startDate;
    else if (weekEnd > maxDate) newDate = addDays(maxDate, -6);
    setCurrentDate(newDate);
  };

  const eventStyleGetter = () => ({
    className: 'bg-indigo-500 border-none text-white text-xs rounded',
  });

  return (
    <Calendar
      localizer={localizer}
      events={events}
      defaultView={Views.WEEK}
      view={Views.WEEK}
      date={currentDate}
      onNavigate={handleNavigate}
      min={minTime}
      max={maxTime}
      step={30}
      timeslots={1}
      selectable
      onSelectSlot={handleSelectSlot}
      eventPropGetter={eventStyleGetter}
      style={{ height: 500 }}
    />
  );
}