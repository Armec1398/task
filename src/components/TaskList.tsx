import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useArmakStore } from '../lib/store';
import { type Task } from '../lib/localDB';
import {
  formatJalaaliShort, timestampToJalaali, formatRelativeTime, formatTime,
} from '../lib/jalali';
import {
  Check, CheckSquare, Clock, AlertTriangle, ChevronDown, ChevronUp, Trash2, Edit3, Calendar as CalIcon, Tag, RotateCw,
} from 'lucide-react-native';
import { COLORS, priorityConfig, catColor } from '../lib/theme';

function recurringLabel(task: Task): string | null {
  if (task.deadlineType === 'once') return null;
  if (task.deadlineType === 'daily') {
    return task.recurringInterval === 1 ? 'هر روز' : `هر ${task.recurringInterval} روز`;
  }
  return 'هفتگی';
}

type Row =
  | { kind: 'single'; task: Task; category?: { id: string; name: string; color: string }; isOverdue: boolean }
  | { kind: 'child'; task: Task; category?: { id: string; name: string; color: string }; parentTitle: string; isOverdue: boolean };

export default function TaskList() {
  const {
    tasks, categories, filterCategory, setFilterCategory,
    completeTask, uncompleteTask, removeTask, openTaskForm, openTaskDetail,
  } = useArmakStore();
  const [showCompleted, setShowCompleted] = useState(false);
  const now = Date.now();

  const rows = useMemo<Row[]>(() => {
    const catOf = (id: string | null) => categories.find(c => c.id === id);
    const result: Row[] = [];
    for (const t of tasks) {
      const overdue = t.deadline < now && !t.isCompleted;
      if (t.parentId) {
        const parent = tasks.find(p => p.id === t.parentId);
        result.push({ kind: 'child', task: t, category: catOf(t.categoryId), parentTitle: parent?.title || '', isOverdue: overdue });
      } else if (t.deadlineType === 'weekly' || t.deadlineType === 'daily') {
        const children = tasks.filter(c => c.parentId === t.id).sort((a, b) => a.deadline - b.deadline);
        if (children.length > 0) {
          for (const c of children) {
            result.push({ kind: 'child', task: c, category: catOf(c.categoryId), parentTitle: t.title, isOverdue: c.deadline < now && !c.isCompleted });
          }
        } else {
          result.push({ kind: 'single', task: t, category: catOf(t.categoryId), isOverdue: overdue });
        }
      } else {
        result.push({ kind: 'single', task: t, category: catOf(t.categoryId), isOverdue: overdue });
      }
    }
    const filtered = result.filter(r => !filterCategory || r.category?.id === filterCategory);
    filtered.sort((a, b) => a.task.deadline - b.task.deadline);
    return filtered;
  }, [tasks, categories, filterCategory, now]);

  const pendingRows = rows.filter(r => !r.task.isCompleted);
  const completedRows = rows.filter(r => r.task.isCompleted);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      {/* فیلتر دسته‌بندی‌ها */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        <Chip label="همه" active={!filterCategory} onPress={() => setFilterCategory(null)} />
        {categories.map(cat => (
          <Chip
            key={cat.id}
            label={cat.name}
            color={catColor(cat.color)}
            active={cat.id === filterCategory}
            onPress={() => setFilterCategory(cat.id === filterCategory ? null : cat.id)}
          />
        ))}
      </ScrollView>

      {pendingRows.length === 0 && !showCompleted && (
        <View style={{ alignItems: 'center', paddingVertical: 48 }}>
          <CheckSquare size={40} color={COLORS.textMuted} />
          <Text style={{ color: COLORS.textMuted, marginTop: 12 }}>تسکی برای انجام دادن نداری!</Text>
          <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 4 }}>
            از دکمه + پایین یه تسک جدید بساز
          </Text>
        </View>
      )}

      {pendingRows.map(r => r.kind === 'single' ? (
        <TaskCard
          key={r.task.id}
          task={r.task}
          category={r.category}
          isOverdue={r.isOverdue}
          onComplete={() => completeTask(r.task.id)}
          onEdit={() => openTaskForm(r.task)}
          onDelete={() => removeTask(r.task.id)}
          onOpen={() => openTaskDetail(r.task)}
        />
      ) : (
        <View key={r.task.id} style={{ marginRight: 18 }}>
          <SubTaskRow
            task={r.task}
            parentTitle={r.parentTitle}
            category={r.category}
            isOverdue={r.isOverdue}
            onToggle={() => r.task.isCompleted ? uncompleteTask(r.task.id) : completeTask(r.task.id)}
            onOpen={() => openTaskDetail(r.task)}
          />
        </View>
      ))}

      {completedRows.length > 0 && (
        <TouchableOpacity onPress={() => setShowCompleted(!showCompleted)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}>
          {showCompleted ? <ChevronUp size={16} color={COLORS.textMuted} /> : <ChevronDown size={16} color={COLORS.textMuted} />}
          <Text style={{ color: COLORS.textMuted, fontSize: 13 }}>انجام‌شده ({completedRows.length})</Text>
        </TouchableOpacity>
      )}

      {showCompleted && completedRows.map(r => r.kind === 'single' ? (
        <TaskCard
          key={r.task.id}
          task={r.task}
          category={r.category}
          isCompleted
          onComplete={() => uncompleteTask(r.task.id)}
          onEdit={() => openTaskForm(r.task)}
          onDelete={() => removeTask(r.task.id)}
          onOpen={() => openTaskDetail(r.task)}
        />
      ) : (
        <View key={r.task.id} style={{ marginRight: 18 }}>
          <SubTaskRow
            task={r.task}
            parentTitle={r.parentTitle}
            category={r.category}
            isCompleted
            onToggle={() => r.task.isCompleted ? uncompleteTask(r.task.id) : completeTask(r.task.id)}
            onOpen={() => openTaskDetail(r.task)}
          />
        </View>
      ))}
    </ScrollView>
  );
}

function Chip({ label, active, onPress, color }: { label: string; active: boolean; onPress: () => void; color?: string }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
        backgroundColor: active ? COLORS.primary : (color ? `${color}55` : COLORS.surfaceAlt),
      }}
    >
      <Text style={{ fontSize: 12, color: active ? COLORS.primaryText : COLORS.text, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}

function TaskCard({
  task, category, isOverdue, isCompleted, onComplete, onEdit, onDelete, onOpen,
}: {
  task: Task;
  category?: { id: string; name: string; color: string };
  isOverdue?: boolean;
  isCompleted?: boolean;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpen: () => void;
}) {
  const pr = priorityConfig[task.priority];
  const { jy, jm, jd } = timestampToJalaali(task.deadline);
  const rec = recurringLabel(task);

  return (
    <View
      style={{
        borderRadius: 16, padding: 14, borderWidth: 1,
        backgroundColor: isCompleted ? COLORS.surfaceAlt : (isOverdue ? COLORS.dangerSoft : COLORS.surface),
        borderColor: isCompleted ? COLORS.border : (isOverdue ? COLORS.danger : COLORS.border),
        opacity: isCompleted ? 0.7 : 1,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <TouchableOpacity
          onPress={onComplete}
          style={{
            width: 22, height: 22, borderRadius: 11, borderWidth: 2,
            marginTop: 2, alignItems: 'center', justifyContent: 'center',
            borderColor: isCompleted ? COLORS.success : (isOverdue ? COLORS.danger : COLORS.primary),
            backgroundColor: isCompleted ? COLORS.success : 'transparent',
          }}
        >
          {isCompleted && <Check size={12} color="#fff" />}
        </TouchableOpacity>

        <TouchableOpacity onPress={onOpen} style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: isCompleted ? COLORS.textMuted : COLORS.text, textDecorationLine: isCompleted ? 'line-through' : 'none' }}>
              {task.title}
            </Text>
            <View style={{ backgroundColor: pr.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}>
              <Text style={{ fontSize: 10, color: pr.text }}>{pr.label}</Text>
            </View>
            {rec && (
              <View style={{ backgroundColor: COLORS.primarySoft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <RotateCw size={10} color={COLORS.primary} />
                <Text style={{ fontSize: 10, color: COLORS.primary }}>{rec}</Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Clock size={12} color={COLORS.textMuted} />
              <Text style={{ fontSize: 11, color: COLORS.textMuted }}>{formatRelativeTime(task.deadline)}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <CalIcon size={12} color={COLORS.textMuted} />
              <Text style={{ fontSize: 11, color: COLORS.textMuted }}>{formatJalaaliShort(jy, jm, jd)} - {formatTime(task.deadline)}</Text>
            </View>
            {category && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: `${catColor(category.color)}66` }}>
                <Tag size={10} color={COLORS.text} />
                <Text style={{ fontSize: 10, color: COLORS.text }}>{category.name}</Text>
              </View>
            )}
          </View>

          {isOverdue && !isCompleted && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
              <AlertTriangle size={12} color={COLORS.danger} />
              <Text style={{ fontSize: 11, color: COLORS.danger }}>عقب‌افتاده!</Text>
            </View>
          )}
        </TouchableOpacity>

        {!isCompleted && (
          <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            <TouchableOpacity onPress={onEdit} style={{ padding: 6 }}>
              <Edit3 size={14} color={COLORS.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={{ padding: 6 }}>
              <Trash2 size={14} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

function SubTaskRow({
  task, parentTitle, category, isOverdue, isCompleted, onToggle, onOpen,
}: {
  task: Task;
  parentTitle: string;
  category?: { id: string; name: string; color: string };
  isOverdue?: boolean;
  isCompleted?: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const pr = priorityConfig[task.priority];
  const { jy, jm, jd } = timestampToJalaali(task.deadline);
  const WEEK = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
  const weekday = WEEK[new Date(task.deadline).getDay()];

  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 12,
        borderWidth: 1, borderStyle: 'dashed',
        backgroundColor: isCompleted ? COLORS.surfaceAlt : (isOverdue ? COLORS.dangerSoft : COLORS.surface),
        borderColor: isCompleted ? COLORS.border : (isOverdue ? COLORS.danger : COLORS.primary + '55'),
        opacity: isCompleted ? 0.7 : 1,
      }}
    >
      <TouchableOpacity
        onPress={onToggle}
        style={{
          width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center',
          borderColor: isCompleted ? COLORS.success : (isOverdue ? COLORS.danger : COLORS.primary),
          backgroundColor: isCompleted ? COLORS.success : 'transparent',
        }}
      >
        {isCompleted && <Check size={11} color="#fff" />}
      </TouchableOpacity>

      <TouchableOpacity onPress={onOpen} style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: isCompleted ? COLORS.textMuted : COLORS.text, textDecorationLine: isCompleted ? 'line-through' : 'none' }}>
          {parentTitle} · {weekday}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <Text style={{ fontSize: 10, color: COLORS.textMuted }}>{formatJalaaliShort(jy, jm, jd)} - {formatTime(task.deadline)}</Text>
          <View style={{ backgroundColor: pr.bg, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999 }}>
            <Text style={{ fontSize: 9, color: pr.text }}>{pr.label}</Text>
          </View>
          {category && (
            <Text style={{ fontSize: 10, color: COLORS.textMuted }}>#{category.name}</Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}
