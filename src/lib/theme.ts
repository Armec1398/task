export const COLORS = {
  // پس‌زمینه‌های پاستیلی آبی
  bg: '#e8f1fd',
  surface: '#ffffff',
  surfaceAlt: '#dbeafe',

  // آبی اصلی (primary) - آبی پاستیلی غنی
  primary: '#3b82f6',
  primarySoft: '#d3e4ff',
  primaryText: '#ffffff',

  // متن‌ها
  text: '#1e2a3a',
  textMuted: '#64748b',

  // مرزها
  border: '#cfe0f7',

  // وضعیت
  success: '#34d399',
  successSoft: '#d1fae5',
  danger: '#fb7185',
  dangerSoft: '#ffe4e6',
  warning: '#fbbf24',
  warningSoft: '#fef3c7',

  // دسته‌بندی‌ها (طیف پاستیلی آبی/فیروزه‌ای/بنفش)
  cat: {
    blue: '#60a5fa',
    sky: '#38bdf8',
    mint: '#34d399',
    teal: '#2dd4bf',
    lavender: '#a78bfa',
    ice: '#7dd3fc',
    periwinkle: '#818cf8',
    aqua: '#22d3ee',
    denim: '#3b82f6',
    powder: '#93c5fd',
  } as Record<string, string>,
};

export const priorityConfig: Record<string, { label: string; bg: string; text: string }> = {
  high: { label: 'زیاد', bg: '#ffe4e6', text: '#e11d48' },
  medium: { label: 'متوسط', bg: '#fef3c7', text: '#d97706' },
  low: { label: 'کم', bg: '#d1fae5', text: '#059669' },
};

export const CATEGORY_COLORS = [
  'blue', 'sky', 'mint', 'teal', 'lavender', 'ice', 'periwinkle', 'aqua', 'denim', 'powder',
];

export function catColor(name: string): string {
  return COLORS.cat[name] || COLORS.primarySoft;
}
