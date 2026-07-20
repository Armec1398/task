import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, ScrollView } from 'react-native';
import { useArmakStore } from '../lib/store';
import { type Priority, type DeadlineType } from '../lib/localDB';
import { toJalaali, jalaaliToTimestamp, formatJalaaliDate, jalaaliMonthLength, todayJalaali } from '../lib/jalali';
import { X, Plus } from 'lucide-react-native';
import { COLORS, priorityConfig, CATEGORY_COLORS, catColor, FONT } from '../lib/theme';
import CalendarPicker from './CalendarPicker';
import ClockPicker from './ClockPicker';

const WEEK_DAYS = [
  { id: 0, label: 'شنبه' }, { id: 1, label: 'یکشنبه' }, { id: 2, label: 'دوشنبه' },
  { id: 3, label: 'سه‌شنبه' }, { id: 4, label: 'چهارشنبه' }, { id: 5, label: 'پنجشنبه' }, { id: 6, label: 'جمعه' },
];

export default function TaskForm() {
  const { isTaskFormOpen, closeTaskForm, editingTask, categories, createTask, editTask } = useArmakStore();

  const today = todayJalaali();
  const todayKey = `${today.jy}-${today.jm}-${today.jd}`;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [deadlineType, setDeadlineType] = useState<DeadlineType>('once');
  const [recurringDays, setRecurringDays] = useState(1);
  const [weekDays, setWeekDays] = useState<number[]>([]);
  const [jy, setJy] = useState(today.jy);
  const [jm, setJm] = useState(today.jm);
  const [jd, setJd] = useState(today.jd);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);

  // پر کردن فرم با مقادیر قبلی هنگام باز شدن (ادر یا ایجاد)
  useEffect(() => {
    if (!isTaskFormOpen) return;
    const j = editingTask ? toJalaali(new Date(editingTask.deadline)) : today;
    const d = editingTask ? new Date(editingTask.deadline) : new Date();
    setTitle(editingTask?.title || '');
    setDescription(editingTask?.description || '');
    setCategoryId(editingTask?.categoryId || '');
    setPriority(editingTask?.priority || 'medium');
    setDeadlineType(editingTask?.deadlineType || 'once');
    setRecurringDays(editingTask?.deadlineType === 'daily' ? (editingTask.recurringInterval || 1) : 1);
    setWeekDays(editingTask?.deadlineType === 'weekly'
      ? Array.from({ length: 7 }, (_, i) => i).filter(i => (editingTask.recurringInterval & (1 << i)))
      : []);
    setJy(j.jy); setJm(j.jm); setJd(j.jd);
    setHour(d.getHours()); setMinute(d.getMinutes());
  }, [isTaskFormOpen, editingTask, todayKey]);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    const deadline = jalaaliToTimestamp(jy, jm, jd, hour, minute);
    let rec = 0;
    if (deadlineType === 'daily') rec = recurringDays;
    else if (deadlineType === 'weekly') weekDays.forEach(d => { rec |= (1 << d); });

    const payload = {
      title: title.trim(), description: description.trim(),
      categoryId: categoryId || null, priority, deadlineType, deadline, recurringInterval: rec,
    };
    if (editingTask) await editTask({ id: editingTask.id, ...payload });
    else await createTask(payload);
    closeTaskForm();
  };

  return (
    <Modal visible={isTaskFormOpen} animationType="slide" onRequestClose={closeTaskForm}>
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 48 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text }}>
            {editingTask ? 'ویرایش تسک' : 'تسک جدید'}
          </Text>
          <TouchableOpacity onPress={closeTaskForm} style={{ padding: 4 }}>
            <X size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <Field label="عنوان تسک *">
            <TextInput
              value={title} onChangeText={setTitle} placeholder="مثلاً: نوشتن مقاله"
              placeholderTextColor={COLORS.textMuted}
              style={inputStyle}
            />
          </Field>

          <Field label="توضیحات">
            <TextInput
              value={description} onChangeText={setDescription} placeholder="جزئیات بیشتر..."
              placeholderTextColor={COLORS.textMuted} style={[inputStyle, { height: 72 }]} multiline
            />
          </Field>

          <Field label="دسته‌بندی">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Pill label="بدون دسته" active={!categoryId} onPress={() => setCategoryId('')} />
              {categories.map(cat => (
                <Pill key={cat.id} label={cat.name} color={catColor(cat.color)} active={cat.id === categoryId} onPress={() => setCategoryId(cat.id)} />
              ))}
            </View>
          </Field>

          <Field label="اولویت">
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['high', 'medium', 'low'] as Priority[]).map(p => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPriority(p)}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                    backgroundColor: priority === p ? priorityConfig[p].bg : COLORS.surfaceAlt,
                    borderWidth: priority === p ? 2 : 0, borderColor: priorityConfig[p].text,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: priorityConfig[p].text }}>{priorityConfig[p].label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <Field label="نوع ددلاین">
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['once', 'daily', 'weekly'] as DeadlineType[]).map(t => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setDeadlineType(t)}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                    backgroundColor: deadlineType === t ? COLORS.primary : COLORS.surfaceAlt,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: deadlineType === t ? '#fff' : COLORS.text }}>
                    {t === 'once' ? 'یک‌بار' : t === 'daily' ? 'روزانه' : 'هفتگی'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          {deadlineType === 'daily' && (
            <Field label="هر چند روز یکبار؟">
              <TextInput
                value={String(recurringDays)} onChangeText={v => setRecurringDays(Math.max(1, parseInt(v) || 1))}
                keyboardType="number-pad" style={[inputStyle, { width: 100, textAlign: 'center' }]}
              />
            </Field>
          )}

          {deadlineType === 'weekly' && (
            <Field label="روزهای تکرار">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {WEEK_DAYS.map(day => {
                  const sel = weekDays.includes(day.id);
                  return (
                    <TouchableOpacity
                      key={day.id} onPress={() => setWeekDays(sel ? weekDays.filter(d => d !== day.id) : [...weekDays, day.id])}
                      style={{
                        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                        backgroundColor: sel ? COLORS.primary : COLORS.surfaceAlt,
                      }}
                    >
                      <Text style={{ fontSize: 12, color: sel ? '#fff' : COLORS.text }}>{day.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Field>
          )}

          <Field label="تاریخ ددلاین (شمسی)">
            <CalendarPicker value={{ jy, jm, jd }} onChange={(v) => { setJy(v.jy); setJm(v.jm); setJd(v.jd); }} />
            <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 6, textAlign: 'center' }}>{formatJalaaliDate(jy, jm, jd)}</Text>
          </Field>

          <Field label="ساعت">
            <View style={{ alignItems: 'center' }}>
              <ClockPicker hour={hour} minute={minute} onChange={(h, m) => { setHour(h); setMinute(m); }} />
            </View>
          </Field>

          <TouchableOpacity
            onPress={handleSubmit} disabled={!title.trim()}
            style={{
              backgroundColor: title.trim() ? COLORS.primary : COLORS.surfaceAlt,
              paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8,
            }}
          >
            <Text style={{ color: title.trim() ? '#fff' : COLORS.textMuted, fontWeight: '700' }}>
              {editingTask ? 'ذخیره تغییرات' : 'افزودن تسک'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const inputStyle = {
  backgroundColor: COLORS.surface,
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 14,
  color: COLORS.text,
  borderWidth: 1,
  borderColor: COLORS.border,
  textAlign: 'right' as const,
  fontFamily: FONT.regular,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8 }}>{label}</Text>
      {children}
    </View>
  );
}

function Pill({ label, active, onPress, color }: { label: string; active: boolean; onPress: () => void; color?: string }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
        backgroundColor: active ? COLORS.primary : (color ? `${color}55` : COLORS.surfaceAlt),
      }}
    >
      <Text style={{ fontSize: 12, color: active ? '#fff' : COLORS.text, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}
