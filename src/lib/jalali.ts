import * as jalaali from 'jalaali-js';

export const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

export const PERSIAN_WEEK_DAYS_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

export const PERSIAN_WEEK_DAYS_FULL = [
  'شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'
];

export function toJalaali(date: Date): { jy: number; jm: number; jd: number } {
  return jalaali.toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function toGregorian(jy: number, jm: number, jd: number): Date {
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd);
  return new Date(gy, gm - 1, gd);
}

export function jalaaliMonthLength(jy: number, jm: number): number {
  return jalaali.jalaaliMonthLength(jy, jm);
}

export function todayJalaali(): { jy: number; jm: number; jd: number } {
  return toJalaali(new Date());
}

export function formatJalaaliDate(jy: number, jm: number, jd: number): string {
  return `${jd} ${PERSIAN_MONTHS[jm - 1]} ${jy}`;
}

export function formatJalaaliShort(jy: number, jm: number, jd: number): string {
  return `${jd} ${PERSIAN_MONTHS[jm - 1]}`;
}

export function getJalaaliDayOfWeek(jy: number, jm: number, jd: number): number {
  const greg = toGregorian(jy, jm, jd);
  const day = greg.getDay();
  return day === 6 ? 0 : day + 1;
}

export function getMonthCalendarDays(
  jy: number,
  jm: number
): Array<{ jy: number; jm: number; jd: number; isCurrentMonth: boolean }> {
  const days: Array<{ jy: number; jm: number; jd: number; isCurrentMonth: boolean }> = [];
  const monthLength = jalaaliMonthLength(jy, jm);
  const firstDayWeek = getJalaaliDayOfWeek(jy, jm, 1);

  let prevJm = jm - 1;
  let prevJy = jy;
  if (prevJm < 1) { prevJm = 12; prevJy--; }
  const prevMonthLength = jalaaliMonthLength(prevJy, prevJm);

  for (let i = firstDayWeek - 1; i >= 0; i--) {
    days.push({ jy: prevJy, jm: prevJm, jd: prevMonthLength - i, isCurrentMonth: false });
  }

  for (let d = 1; d <= monthLength; d++) {
    days.push({ jy, jm, jd: d, isCurrentMonth: true });
  }

  const remaining = 42 - days.length;
  let nextJm = jm + 1;
  let nextJy = jy;
  if (nextJm > 12) { nextJm = 1; nextJy++; }
  for (let d = 1; d <= remaining; d++) {
    days.push({ jy: nextJy, jm: nextJm, jd: d, isCurrentMonth: false });
  }

  return days;
}

export function isToday(jy: number, jm: number, jd: number): boolean {
  const today = todayJalaali();
  return jy === today.jy && jm === today.jm && jd === today.jd;
}

export function timestampToJalaali(ts: number): { jy: number; jm: number; jd: number } {
  return toJalaali(new Date(ts));
}

export function jalaaliToTimestamp(
  jy: number,
  jm: number,
  jd: number,
  hour: number = 0,
  minute: number = 0
): number {
  const greg = toGregorian(jy, jm, jd);
  return new Date(greg.getFullYear(), greg.getMonth(), greg.getDate(), hour, minute).getTime();
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function formatRelativeTime(deadline: number): string {
  const now = Date.now();
  const diff = deadline - now;
  const absDiff = Math.abs(diff);
  const minutes = Math.floor(absDiff / 60000);
  const hours = Math.floor(absDiff / 3600000);
  const days = Math.floor(absDiff / 86400000);

  if (diff < 0) {
    if (minutes < 1) return 'همین الان!';
    if (minutes < 60) return `${minutes} دقیقه پیش`;
    if (hours < 24) return `${hours} ساعت پیش`;
    return `${days} روز پیش`;
  } else {
    if (minutes < 1) return 'همین الان!';
    if (minutes < 60) return `${minutes} دقیقه مانده`;
    if (hours < 24) return `${hours} ساعت مانده`;
    return `${days} روز مانده`;
  }
}

export function isSameJalaaliDate(
  a: { jy: number; jm: number; jd: number },
  b: { jy: number; jm: number; jd: number }
): boolean {
  return a.jy === b.jy && a.jm === b.jm && a.jd === b.jd;
}
