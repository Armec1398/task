import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useArmakStore } from '../lib/store';
import {
  getMonthCalendarDays, isToday, isSameJalaaliDate,
  PERSIAN_MONTHS, PERSIAN_WEEK_DAYS_SHORT,
  formatJalaaliDate, timestampToJalaali, formatTime,
  jalaaliMonthLength, todayJalaali,
} from '../lib/jalali';
import { ChevronRight, ChevronLeft, Check, Edit3, Trash2 } from 'lucide-react-native';
import { COLORS, catColor } from '../lib/theme';

export default function CalendarView() {
  const today = todayJalaali();
  const [viewYear, setViewYear] = useState(today.jy);
  const [viewMonth, setViewMonth] = useState(today.jm);
  const [selectedDay, setSelectedDay] = useState<{ jy: number; jm: number; jd: number } | null>(null);

  const { tasks, categories, completeTask, uncompleteTask, removeTask, openTaskForm, openTaskDetail } = useArmakStore();

  const calendarDays = useMemo(() => getMonthCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const goPrev = () => {
    let m = viewMonth - 1, y = viewYear;
    if (m < 1) { m = 12; y--; }
    setViewMonth(m); setViewYear(y); setSelectedDay(null);
  };
  const goNext = () => {
    let m = viewMonth + 1, y = viewYear;
    if (m > 12) { m = 1; y++; }
    setViewMonth(m); setViewYear(y); setSelectedDay(null);
  };

  const tasksByDate = useMemo(() => {
    const map = new Map<string, typeof tasks>();
    tasks.forEach(task => {
      const { jy, jm, jd } = timestampToJalaali(task.deadline);
      const key = `${jy}-${jm}-${jd}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    });
    return map;
  }, [tasks]);

  const selectedTasks = selectedDay
    ? tasks.filter(t => {
        const { jy, jm, jd } = timestampToJalaali(t.deadline);
        return isSameJalaaliDate({ jy, jm, jd }, selectedDay);
      })
    : [];

  return (
    <View style={{ padding: 16, gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: COLORS.border }}>
        <TouchableOpacity onPress={goNext} style={{ padding: 8 }}>
          <ChevronRight size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text }}>
          {PERSIAN_MONTHS[viewMonth - 1]} {viewYear}
        </Text>
        <TouchableOpacity onPress={goPrev} style={{ padding: 8 }}>
          <ChevronLeft size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={{ backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
          {PERSIAN_WEEK_DAYS_SHORT.map((d, i) => (
            <View key={i} style={{ flex: 1, paddingVertical: 8, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.textMuted }}>{d}</Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {calendarDays.map((day, i) => {
            const key = `${day.jy}-${day.jm}-${day.jd}`;
            const dayTasks = tasksByDate.get(key) || [];
            const tClass = isToday(day.jy, day.jm, day.jd);
            const isSel = selectedDay && isSameJalaaliDate(day, selectedDay);
            const hasIncomplete = dayTasks.some(t => !t.isCompleted);
            const hasCompleted = dayTasks.some(t => t.isCompleted);

            return (
              <TouchableOpacity
                key={i}
                onPress={() => setSelectedDay(isSel ? null : day)}
                style={{
                  width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center',
                  borderRightWidth: (i % 7 !== 6) ? 1 : 0, borderBottomWidth: 1,
                  borderColor: `${COLORS.border}80`,
                  backgroundColor: isSel ? COLORS.primarySoft : (tClass ? COLORS.primarySoft : 'transparent'),
                  opacity: day.isCurrentMonth ? 1 : 0.4,
                }}
              >
                <View style={{
                  width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: tClass ? COLORS.primary : 'transparent',
                }}>
                  <Text style={{ fontSize: 12, color: tClass ? '#fff' : COLORS.text, fontWeight: tClass ? '700' : '400' }}>{day.jd}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
                  {hasIncomplete && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.danger }} />}
                  {hasCompleted && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.success }} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {selectedDay && (
        <View style={{ backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text }}>
              {formatJalaaliDate(selectedDay.jy, selectedDay.jm, selectedDay.jd)}
            </Text>
            <Text style={{ fontSize: 12, color: COLORS.textMuted }}>{selectedTasks.length} تسک</Text>
          </View>
          {selectedTasks.length === 0 ? (
            <Text style={{ fontSize: 12, color: COLORS.textMuted, textAlign: 'center', paddingVertical: 16 }}>تسکی برای این روز نیست</Text>
          ) : (
            selectedTasks.map(task => {
              const cat = categories.find(c => c.id === task.categoryId);
              return (
                <View key={task.id} style={{ padding: 10, borderRadius: 12, borderWidth: 1, borderColor: `${COLORS.border}80`, backgroundColor: COLORS.surfaceAlt, opacity: task.isCompleted ? 0.6 : 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => task.isCompleted ? uncompleteTask(task.id) : completeTask(task.id)}
                    style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center', borderColor: task.isCompleted ? COLORS.success : COLORS.primary, backgroundColor: task.isCompleted ? COLORS.success : 'transparent' }}
                  >
                    {task.isCompleted && <Check size={11} color="#fff" />}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => openTaskDetail(task)} style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ flex: 1, fontSize: 13, color: task.isCompleted ? COLORS.textMuted : COLORS.text, textDecorationLine: task.isCompleted ? 'line-through' : 'none' }}>{task.title}</Text>
                      {cat && (
                        <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: `${catColor(cat.color)}66` }}>
                          <Text style={{ fontSize: 10, color: COLORS.text }}>{cat.name}</Text>
                        </View>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                      <Text style={{ fontSize: 11, color: COLORS.textMuted }}>{formatTime(task.deadline)}</Text>
                      {task.description ? <Text style={{ fontSize: 11, color: COLORS.textMuted, flex: 1 }} numberOfLines={1}>{task.description}</Text> : null}
                    </View>
                  </TouchableOpacity>
                  {!task.isCompleted && (
                    <View style={{ flexDirection: 'row', gap: 2 }}>
                      <TouchableOpacity onPress={() => openTaskForm(task)} style={{ padding: 4 }}>
                        <Edit3 size={13} color={COLORS.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => removeTask(task.id)} style={{ padding: 4 }}>
                        <Trash2 size={13} color={COLORS.danger} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}
