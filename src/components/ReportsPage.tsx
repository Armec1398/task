import { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useArmakStore } from '../lib/store';
import { timestampToJalaali, formatJalaaliDate, todayJalaali, jalaaliMonthLength, PERSIAN_MONTHS, toGregorian } from '../lib/jalali';
import { Download, ChevronDown } from 'lucide-react-native';
import { COLORS, catColor } from '../lib/theme';

function toTimestamp(jy: number, jm: number, jd: number): number {
  const g = toGregorian(jy, jm, jd);
  return new Date(g.getFullYear(), g.getMonth(), g.getDate()).getTime();
}

export default function ReportsPage() {
  const { tasks, categories } = useArmakStore();
  const today = todayJalaali();

  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<{ jy: number; jm: number; jd: number }>({ jy: today.jy, jm: today.jm, jd: 1 });
  const [toDate, setToDate] = useState<{ jy: number; jm: number; jd: number }>({ jy: today.jy, jm: today.jm, jd: jalaaliMonthLength(today.jy, today.jm) });
  const [showCatFilter, setShowCatFilter] = useState(false);

  const fromTs = toTimestamp(fromDate.jy, fromDate.jm, fromDate.jd);
  const toTs = toTimestamp(toDate.jy, toDate.jm, toDate.jd) + 86400000 - 1;

  const completed = useMemo(() =>
    tasks.filter(t => t.isCompleted && t.completedAt != null && t.completedAt >= fromTs && t.completedAt <= toTs)
  , [tasks, fromTs, toTs]);

  const filtered = useMemo(() =>
    filterCat ? completed.filter(t => (t.categoryId || '__none__') === filterCat) : completed
  , [completed, filterCat]);

  const byCategory = useMemo(() => {
    const map = new Map<string, { name: string; color: string; tasks: typeof filtered }>();
    filtered.forEach(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      const id = t.categoryId || '__none__';
      const name = cat?.name || 'بدون دسته';
      const color = cat?.color || 'mint';
      if (!map.has(id)) map.set(id, { name, color, tasks: [] });
      map.get(id)!.tasks.push(t);
    });
    return Array.from(map.values()).sort((a, b) => b.tasks.length - a.tasks.length);
  }, [filtered, categories]);

  const total = filtered.length;
  const high = filtered.filter(t => t.priority === 'high').length;
  const recurring = filtered.filter(t => t.deadlineType !== 'once').length;

  const exportCsv = () => {
    const rows = [['عنوان', 'تاریخ انجام', 'دسته', 'اولویت']];
    filtered.forEach(t => {
      const d = timestampToJalaali(t.completedAt || t.deadline);
      const cat = categories.find(c => c.id === t.categoryId);
      rows.push([t.title, formatJalaaliDate(d.jy, d.jm, d.jd), cat?.name || 'بدون دسته', t.priority]);
    });
    const csv = '﻿' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    try {
      const { Clipboard } = require('react-native');
      Clipboard.setString(csv);
    } catch {}
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      {/* فیلترها */}
      <View style={{ backgroundColor: COLORS.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORS.border, gap: 12 }}>
        <TouchableOpacity onPress={() => setShowCatFilter(s => !s)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text }}>
            دسته‌بندی: {filterCat ? (categories.find(c => c.id === filterCat)?.name || '؟') : 'همه'}
          </Text>
          <ChevronDown size={16} color={COLORS.textMuted} style={{ transform: [{ rotate: showCatFilter ? '180deg' : '0deg' }] } as any} />
        </TouchableOpacity>
        {showCatFilter && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <FilterChip label="همه" active={!filterCat} onPress={() => setFilterCat(null)} />
            {categories.map(cat => (
              <FilterChip key={cat.id} label={cat.name} color={catColor(cat.color)} active={filterCat === cat.id} onPress={() => setFilterCat(cat.id)} />
            ))}
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <DateField label="از" value={fromDate} onChange={setFromDate} />
          <DateField label="تا" value={toDate} onChange={setToDate} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <StatCard value={total} label="انجام‌شده" bg={COLORS.primarySoft} color={COLORS.primary} />
        <StatCard value={high} label="اولویت زیاد" bg={COLORS.dangerSoft} color={COLORS.danger} />
        <StatCard value={recurring} label="تکراری" bg={COLORS.successSoft} color={COLORS.success} />
      </View>

      {total > 0 && (
        <TouchableOpacity onPress={exportCsv} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.primarySoft, paddingVertical: 12, borderRadius: 12 }}>
          <Download size={14} color={COLORS.primary} />
          <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: '600' }}>خروجی اکسل (CSV)</Text>
        </TouchableOpacity>
      )}

      {byCategory.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <Text style={{ fontSize: 13, color: COLORS.textMuted }}>توی این بازه تسک انجام‌شده‌ای نیست</Text>
        </View>
      ) : byCategory.map(group => (
        <View key={group.name} style={{ backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: catColor(group.color) }} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text }}>{group.name}</Text>
            <Text style={{ fontSize: 12, color: COLORS.textMuted, marginLeft: 'auto' }}>{group.tasks.length} تسک</Text>
          </View>
          {group.tasks.map(task => {
            const d = timestampToJalaali(task.completedAt || task.deadline);
            return (
              <View key={task.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderTopWidth: 1, borderTopColor: `${COLORS.border}60` }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success }} />
                <Text style={{ flex: 1, fontSize: 12, color: COLORS.text }} numberOfLines={1}>{task.title}</Text>
                <Text style={{ fontSize: 11, color: COLORS.textMuted }}>{formatJalaaliDate(d.jy, d.jm, d.jd)}</Text>
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

function FilterChip({ label, active, onPress, color }: { label: string; active: boolean; onPress: () => void; color?: string }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: active ? COLORS.primary : (color ? `${color}55` : COLORS.surfaceAlt) }}>
      <Text style={{ fontSize: 11, color: active ? '#fff' : COLORS.text, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}

function DateField({ label, value, onChange }: { label: string; value: { jy: number; jm: number; jd: number }; onChange: (v: { jy: number; jm: number; jd: number }) => void }) {
  const today = todayJalaali();
  const years = Array.from({ length: 5 }, (_, i) => today.jy - 2 + i);
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 4, backgroundColor: COLORS.surfaceAlt, borderRadius: 10, padding: 6 }}>
        <PickerMini items={years} value={value.jy} onChange={(v: number) => onChange({ ...value, jy: v })} />
        <PickerMini items={Array.from({ length: 12 }, (_, i) => i + 1)} labels={PERSIAN_MONTHS} value={value.jm} onChange={(v: number) => onChange({ ...value, jm: v })} />
        <PickerMini items={Array.from({ length: jalaaliMonthLength(value.jy, value.jm) }, (_, i) => i + 1)} value={value.jd} onChange={(v: number) => onChange({ ...value, jd: v })} />
      </View>
    </View>
  );
}

function PickerMini({ items, value, onChange, labels }: { items: number[]; value: number; onChange: (v: number) => void; labels?: string[] }) {
  const { Picker } = require('@react-native-picker/picker');
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border }}>
      <Picker selectedValue={value} onValueChange={(v: number) => onChange(v)} style={{ color: COLORS.text }} itemStyle={{ color: COLORS.text }}>
        {items.map(i => <Picker.Item key={i} label={labels ? labels[i - 1] : String(i)} value={i} />)}
      </Picker>
    </View>
  );
}

function StatCard({ value, label, bg, color }: { value: number; label: string; bg: string; color: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: bg, borderRadius: 16, padding: 14, alignItems: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: '800', color }}>{value}</Text>
      <Text style={{ fontSize: 11, color, marginTop: 4 }}>{label}</Text>
    </View>
  );
}
