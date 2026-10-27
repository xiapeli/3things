export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(iso: string, days: number): string {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function mondayOf(date: Date): string {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  return toISODate(result);
}

export function currentWeekStart(): string {
  return mondayOf(new Date());
}

export function shiftWeek(weekStart: string, weeks: number): string {
  return addDays(weekStart, weeks * 7);
}

export function weekEnd(weekStart: string): string {
  return addDays(weekStart, 6);
}

export function formatDayMonth(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}

export function formatFullDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export function weekLabel(weekStart: string): string {
  return `${formatDayMonth(weekStart)} - ${formatDayMonth(weekEnd(weekStart))}`;
}

export function isCurrentWeek(weekStart: string): boolean {
  return weekStart === currentWeekStart();
}

export function dateTimeToDate(isoDateTime: string): string {
  return isoDateTime.slice(0, 10);
}
