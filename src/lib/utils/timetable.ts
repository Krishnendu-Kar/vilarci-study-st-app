// Weekly timetable built from private batches' schedules
// ({ mon..sun: "05:30 PM - 07:00 PM" | "Closed" }).
import type { Membership, WeekSchedule } from '../api/batches';

export type DayKey = keyof WeekSchedule;

export const DAY_KEYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const DAY_NAMES: Record<DayKey, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

export function todayKey(now = new Date()): DayKey {
  return (['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const)[now.getDay()];
}

/** "05:30 PM" → minutes since midnight; unparseable sorts last. */
export function clockMinutes(label: string): number {
  const m = label.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return 24 * 60;
  let h = Number(m[1]) % 12;
  if (m[3]?.toUpperCase() === 'PM') h += 12;
  return h * 60 + Number(m[2]);
}

export interface ClassSlot {
  day: DayKey;
  start: string;
  end: string;
  startMin: number;
  endMin: number;
  membership: Membership;
}

/** Approved batches' classes grouped by day, each day sorted by start time. */
export function weekClasses(memberships: Membership[]): Record<DayKey, ClassSlot[]> {
  const out = Object.fromEntries(DAY_KEYS.map((d) => [d, [] as ClassSlot[]])) as Record<DayKey, ClassSlot[]>;
  for (const m of memberships) {
    if (m.status !== 'approved') continue;
    for (const d of DAY_KEYS) {
      const v = m.weekly_schedule?.[d];
      if (!v || v.trim().toLowerCase() === 'closed') continue;
      const [start = '', end = ''] = v.split(/\s*[-–]\s*/);
      out[d].push({ day: d, start, end, startMin: clockMinutes(start), endMin: clockMinutes(end), membership: m });
    }
  }
  for (const d of DAY_KEYS) out[d].sort((a, b) => a.startMin - b.startMin);
  return out;
}

/** Days to look at for "next class", starting today. */
export function daysFromToday(now = new Date()): { day: DayKey; offset: number }[] {
  const start = DAY_KEYS.indexOf(todayKey(now));
  return Array.from({ length: 7 }, (_, i) => ({ day: DAY_KEYS[(start + i) % 7], offset: i }));
}
