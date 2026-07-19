export const COLORS = {
  // پس‌زمینه‌های پاستیلی آبی
  bg: '#eef4fb',
  surface: '#ffffff',
  surfaceAlt: '#e3edfa',

  // آبی اصلی (primary)
  primary: '#5b8def',
  primarySoft: '#dbe7fb',
  primaryText: '#ffffff',

  // متن‌ها
  text: '#27364a',
  textMuted: '#7a8aa3',

  // مرزها
  border: '#dde6f2',

  // وضعیت
  success: '#7fd1ae',
  successSoft: '#d9f5ea',
  danger: '#f08a8a',
  dangerSoft: '#fbe0e0',
  warning: '#f3c969',
  warningSoft: '#fbf0d4',

  // دسته‌بندی‌ها (طیف پاستیلی آبی/فیروزه‌ای)
  cat: {
    blue: '#9ec5ff',
    sky: '#a7def0',
    mint: '#a8e6cf',
    teal: '#9fe0dc',
    lavender: '#c3bcf7',
    ice: '#bfe3f5',
    periwinkle: '#b3c4fb',
    aqua: '#9fe8e0',
    denim: '#7fa8e6',
    powder: '#cfe2fb',
  } as Record<string, string>,
};

export const priorityConfig: Record<string, { label: string; bg: string; text: string }> = {
  high: { label: 'زیاد', bg: '#fbe0e0', text: '#c05454' },
  medium: { label: 'متوسط', bg: '#fbf0d4', text: '#b08923' },
  low: { label: 'کم', bg: '#d9f5ea', text: '#3f9c7a' },
};

export const CATEGORY_COLORS = [
  'blue', 'sky', 'mint', 'teal', 'lavender', 'ice', 'periwinkle', 'aqua', 'denim', 'powder',
];

export function catColor(name: string): string {
  return COLORS.cat[name] || COLORS.primarySoft;
}
