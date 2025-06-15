'use client';
import { useState } from 'react';

interface Props {
  startDate: Date;
  days: number;
  initialSelected?: Set<string>;
  onChange?: (slots: Set<string>) => void;
}

export default function AvailabilityGrid({ startDate, days, initialSelected, onChange }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const [last, setLast] = useState<string | null>(null);

  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 8 PM

  const allSlots = (): string[] => {
    const slots: string[] = [];
    for (let d = 0; d < days; d++) {
      for (const h of hours) {
        const base = new Date(startDate);
        base.setDate(base.getDate() + d);
        base.setHours(h, 0, 0, 0);
        slots.push(base.toISOString());
        const half = new Date(base);
        half.setMinutes(30);
        slots.push(half.toISOString());
      }
    }
    return slots;
  };

  const slotsArray = allSlots();

  const updateSelected = (set: Set<string>) => {
    setSelected(set);
    onChange?.(new Set(set));
  };

  const toggleSlot = (slot: string) => {
    const next = new Set(selected);
    if (next.has(slot)) next.delete(slot); else next.add(slot);
    updateSelected(next);
  };

  const handleClick = (slot: string, e: React.MouseEvent<HTMLButtonElement>) => {
    if (e.shiftKey && last) {
      const startIdx = slotsArray.indexOf(last);
      const endIdx = slotsArray.indexOf(slot);
      if (startIdx !== -1 && endIdx !== -1) {
        const [s, eIdx] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
        const range = slotsArray.slice(s, eIdx + 1);
        const next = new Set(selected);
        range.forEach(id => next.add(id));
        updateSelected(next);
      }
    } else {
      toggleSlot(slot);
    }
    setLast(slot);
  };

  const daysArr = Array.from({ length: days }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <table className="border-collapse text-center text-xs">
      <thead>
        <tr>
          <th className="w-16"></th>
          {daysArr.map(d => (
            <th key={d.toISOString()} className="px-1 font-semibold">
              {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {hours.map(hour => (
          <tr key={hour}>
            <td className="pr-1 whitespace-nowrap">
              {new Date(new Date().setHours(hour,0,0,0)).toLocaleTimeString([], {hour:'numeric',hour12:true})}
            </td>
            {daysArr.map(day => {
              const base = new Date(day);
              base.setHours(hour,0,0,0);
              const id1 = base.toISOString();
              const half = new Date(base);
              half.setMinutes(30);
              const id2 = half.toISOString();
              const s1 = selected.has(id1);
              const s2 = selected.has(id2);
              return (
                <>
                  <td key={id1} className="p-0.5">
                    <button onClick={(e)=>handleClick(id1,e)} className={`w-5 h-5 border ${s1 ? 'bg-indigo-500' : 'bg-white'}`}></button>
                  </td>
                  <td key={id2} className="p-0.5">
                    <button onClick={(e)=>handleClick(id2,e)} className={`w-5 h-5 border ${s2 ? 'bg-indigo-500' : 'bg-white'}`}></button>
                  </td>
                </>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
