import { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useArmakStore } from '../lib/store';
import { timestampToJalaali, formatJalaaliDate } from '../lib/jalali';
import { Download } from 'lucide-react-native';
import { COLORS, catColor } from '../lib/theme';

export default function ReportsPage() {
  const { tasks, categories } = useArmakStore();

  const completed = useMemo(() => tasks.filter(t => t.isCompleted), [tasks]);

  const byCategory = useMemo(() => {
    const map = new Map<string, { name: string; color: string; tasks: typeof completed }>();
    completed.forEach(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      const id = t.categoryId || '__none__';
      const name = cat?.name || 'بدون دسته';
      const color = cat?.color || 'mint';
      if (!map.has(id)) map.set(id, { name, color, tasks: [] });
      map.get(id)!.tasks.push(t);
    });
    return Array.from(map.values());
  }, [completed, categories]);

  const total = completed.length;
  const high = completed.filter(t => t.priority === 'high').length;
  const recurring = completed.filter(t => t.deadlineType !== 'once').length;

  const copy = async () => {
    const text = completed
      .map(t => {
        const d = timestampToJalaali(t.deadline);
        return `${t.title} | ${formatJalaaliDate(d.jy, d.jm, d.jd)}`;
      })
      .join('\n');
    try {
      const { Clipboard } = require('react-native');
      Clipboard.setString(text);
    } catch {}
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <StatCard value={total} label="انجام‌شده" bg={COLORS.primarySoft} color={COLORS.primary} />
        <StatCard value={high} label="اولویت زیاد" bg={COLORS.dangerSoft} color={COLORS.danger} />
        <StatCard value={recurring} label="تکراری" bg={COLORS.successSoft} color={COLORS.success} />
      </View>

      {total > 0 && (
        <TouchableOpacityRow onPress={copy}>
          <Download size={14} color={COLORS.primary} />
          <Text style={{ fontSize: 12, color: COLORS.primary }}>کپی لیست انجام‌شده‌ها</Text>
        </TouchableOpacityRow>
      )}

      {byCategory.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <Text style={{ fontSize: 13, color: COLORS.textMuted }}>هنوز کاری انجام نشده</Text>
        </View>
      ) : (
        byCategory.map(group => (
          <View key={group.name} style={{ backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: catColor(group.color) }} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text }}>{group.name}</Text>
              <Text style={{ fontSize: 12, color: COLORS.textMuted, marginLeft: 'auto' }}>{group.tasks.length} تسک</Text>
            </View>
            {group.tasks.map(task => {
              const d = timestampToJalaali(task.deadline);
              return (
                <View key={task.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderTopWidth: 1, borderTopColor: `${COLORS.border}60` }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success }} />
                  <Text style={{ flex: 1, fontSize: 12, color: COLORS.text }} numberOfLines={1}>{task.title}</Text>
                  <Text style={{ fontSize: 11, color: COLORS.textMuted }}>{formatJalaaliDate(d.jy, d.jm, d.jd)}</Text>
                </View>
              );
            })}
          </View>
        ))
      )}
    </ScrollView>
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

function TouchableOpacityRow({ onPress, children }: { onPress: () => void; children: React.ReactNode }) {
  const { TouchableOpacity } = require('react-native');
  return (
    <TouchableOpacity onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.primarySoft, paddingVertical: 10, borderRadius: 12 }}>
      {children}
    </TouchableOpacity>
  );
}
