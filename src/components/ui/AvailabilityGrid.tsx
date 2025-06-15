"use client";
import { useState } from "react";
import {
  Calendar,
  Views,
  dateFnsLocalizer,
  SlotInfo,
} from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addDays,
  addMinutes,
  isBefore,
  isAfter,
  startOfDay,
  endOfDay,
} from "date-fns";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";

interface Props {
  startDate: Date;
  days: number;
  initialSelected?: Set<string>;
  onChange?: (slots: Set<string>) => void;
}

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date()),
  getDay,
  locales,
});

export default function AvailabilityGrid({
  startDate,
  days,
  initialSelected,
  onChange,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialSelected)
  );
  const [currentDate, setCurrentDate] = useState(startDate);

  const maxDate = addDays(startDate, days - 1);

  const events = Array.from(selected).map((iso) => {
    const start = new Date(iso);
    return {
      start,
      end: addMinutes(start, 30),
      title: "Available",
    };
  });

  const updateSelected = (set: Set<string>) => {
    setSelected(set);
    onChange?.(new Set(set));
  };

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    const next = new Set(selected);
    slotInfo.slots.forEach((d) => {
      const iso = d.toISOString();
      if (next.has(iso)) next.delete(iso);
      else next.add(iso);
    });
    updateSelected(next);
  };

  const handleNavigate = (date: Date) => {
    if (isBefore(date, startDate)) date = startDate;
    if (isAfter(date, maxDate)) date = maxDate;
    setCurrentDate(date);
  };

  return (
    <div style={{ height: 500 }}>
      <Calendar
        localizer={localizer}
        events={events}
        selectable
        onSelectSlot={handleSelectSlot}
        defaultView={Views.WEEK}
        views={[Views.WEEK]}
        step={30}
        timeslots={1}
        date={currentDate}
        onNavigate={handleNavigate}
        min={startOfDay(startDate)}
        max={endOfDay(maxDate)}
        defaultDate={startDate}
      />
    </div>
  );
}
