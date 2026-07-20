import { View, Text, TouchableOpacity } from 'react-native';
import {
  getMonthCalendarDays, isToday, isSameJalaaliDate,
  PERSIAN_MONTHS, PERSIAN_WEEK_DAYS_SHORT, jalaaliMonthLength, todayJalaali,
} from '../lib/jalali';
import { ChevronRight, ChevronLeft } from 'lucide-react-native';
import { COLORS } from '../lib/theme';

export default function CalendarPicker({
  value, onChange,
}: { value: { jy: number; jm: number; jd: number }; onChange: (v: { jy: number; jm: number; jd: number }) => void }) {
  const today = todayJalaali();
  const [viewYear, setViewYear] = useStateInit(value.jy);
  const [viewMonth, setViewMonth] = useStateInit(value.jm);

  const calendarDays = getMonthCalendarDays(viewYear, viewMonth);

  const goPrev = () => {
    let m = viewMonth - 1, y = viewYear;
    if (m < 1) { m = 12; y--; }
    setViewMonth(m); setViewYear(y);
  };
  const goNext = () => {
    let m = viewMonth + 1, y = viewYear;
    if (m > 12) { m = 1; y++; }
    setViewMonth(m); setViewYear(y);
  };

  return (
    <View style={{ backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10 }}>
        <TouchableOpacity onPress={goNext} style={{ padding: 6 }}>
          <ChevronRight size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text }}>
          {PERSIAN_MONTHS[viewMonth - 1]} {viewYear}
        </Text>
        <TouchableOpacity onPress={goPrev} style={{ padding: 6 }}>
          <ChevronLeft size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        {PERSIAN_WEEK_DAYS_SHORT.map((d, i) => (
          <View key={i} style={{ flex: 1, paddingVertical: 6, alignItems: 'center' }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.textMuted }}>{d}</Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {calendarDays.map((day, i) => {
          const tClass = isToday(day.jy, day.jm, day.jd);
          const isSel = isSameJalaaliDate(day, value);
          return (
            <TouchableOpacity
              key={i}
              onPress={() => onChange({ jy: day.jy, jm: day.jm, jd: day.jd })}
              style={{
                width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center',
                borderRightWidth: (i % 7 !== 6) ? 1 : 0, borderBottomWidth: 1,
                borderColor: `${COLORS.border}80`,
                backgroundColor: isSel ? COLORS.primary : (tClass ? COLORS.primarySoft : 'transparent'),
                opacity: day.isCurrentMonth ? 1 : 0.4,
              }}
            >
              <Text style={{ fontSize: 12, color: isSel ? '#fff' : (tClass ? COLORS.primary : COLORS.text), fontWeight: isSel || tClass ? '700' : '400' }}>{day.jd}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

import { useState } from 'react';
function useStateInit<T>(initial: T): [T, (v: T) => void] {
  const [s, setS] = useState<T>(initial);
  return [s, setS];
}
