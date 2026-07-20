import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useArmakStore } from '../lib/store';
import { type Task } from '../lib/localDB';
import { formatJalaaliShort, timestampToJalaali, formatTime, formatRelativeTime } from '../lib/jalali';
import { X, Check, Edit3, Trash2, Clock, Calendar as CalIcon, Tag, RotateCw } from 'lucide-react-native';
import { COLORS, priorityConfig, catColor } from '../lib/theme';

const WEEK_DAY_LABELS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

export default function TaskDetail() {
  const {
    detailTask, closeTaskDetail, tasks, categories,
    completeTask, uncompleteTask, removeTask, openTaskForm,
  } = useArmakStore();

  if (!detailTask) return null;

  const isParent = !detailTask.parentId;
  const children = isParent
    ? tasks.filter(t => t.parentId === detailTask.id).sort((a, b) => a.deadline - b.deadline)
    : [];
  const category = categories.find(c => c.id === detailTask.categoryId);
  const pr = priorityConfig[detailTask.priority];

  return (
    <Modal visible={!!detailTask} animationType="slide" onRequestClose={closeTaskDetail}>
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 48 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text, flex: 1, textAlign: 'right' }} numberOfLines={1}>
            {detailTask.title}
          </Text>
          <TouchableOpacity onPress={closeTaskDetail} style={{ padding: 4 }}>
            <X size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          {detailTask.description ? (
            <View style={{ backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.border }}>
              <Text style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 4 }}>توضیحات</Text>
              <Text style={{ fontSize: 14, color: COLORS.text, lineHeight: 22 }}>{detailTask.description}</Text>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Badge icon={<Clock size={12} color={COLORS.textMuted} />} text={formatRelativeTime(detailTask.deadline)} />
            <Badge icon={<CalIcon size={12} color={COLORS.textMuted} />} text={(() => { const { jy, jm, jd } = timestampToJalaali(detailTask.deadline); return `${formatJalaaliShort(jy, jm, jd)} - ${formatTime(detailTask.deadline)}`; })()} />
            <View style={{ backgroundColor: pr.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
              <Text style={{ fontSize: 11, color: pr.text }}>{pr.label}</Text>
            </View>
            {category && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: `${catColor(category.color)}66` }}>
                <Tag size={12} color={COLORS.text} />
                <Text style={{ fontSize: 11, color: COLORS.text }}>{category.name}</Text>
              </View>
            )}
          </View>

          {isParent ? (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <RotateCw size={16} color={COLORS.primary} />
                <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text }}>روزهای تکرار</Text>
              </View>
              {children.length === 0 ? (
                <Text style={{ color: COLORS.textMuted, fontSize: 13 }}>زیر‌تسکی یافت نشد.</Text>
              ) : children.map(child => (
                <OccurrenceRow
                  key={child.id}
                  task={child}
                  onToggle={() => child.isCompleted ? uncompleteTask(child.id) : completeTask(child.id)}
                />
              ))}
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primarySoft, padding: 12, borderRadius: 12 }}>
              <RotateCw size={14} color={COLORS.primary} />
              <Text style={{ fontSize: 13, color: COLORS.primary }}>این یه occurrence از یه تسک تکرارشونده است.</Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <TouchableOpacity
              onPress={() => { closeTaskDetail(); openTaskForm(detailTask); }}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.surfaceAlt, paddingVertical: 14, borderRadius: 12 }}
            >
              <Edit3 size={16} color={COLORS.text} />
              <Text style={{ color: COLORS.text, fontWeight: '600' }}>ویرایش</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { closeTaskDetail(); removeTask(detailTask.id); }}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.dangerSoft, paddingVertical: 14, borderRadius: 12 }}
            >
              <Trash2 size={16} color={COLORS.danger} />
              <Text style={{ color: COLORS.danger, fontWeight: '600' }}>حذف</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.surfaceAlt, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
      {icon}
      <Text style={{ fontSize: 11, color: COLORS.textMuted }}>{text}</Text>
    </View>
  );
}

function OccurrenceRow({ task, onToggle }: { task: Task; onToggle: () => void }) {
  const now = Date.now();
  const overdue = task.deadline < now && !task.isCompleted;
  const { jy, jm, jd } = timestampToJalaali(task.deadline);
  const weekdayIdx = new Date(task.deadline).getDay();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: task.isCompleted ? COLORS.border : (overdue ? COLORS.danger : COLORS.border), opacity: task.isCompleted ? 0.7 : 1 }}>
      <TouchableOpacity
        onPress={onToggle}
        style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', borderColor: task.isCompleted ? COLORS.success : (overdue ? COLORS.danger : COLORS.primary), backgroundColor: task.isCompleted ? COLORS.success : 'transparent' }}
      >
        {task.isCompleted && <Check size={14} color="#fff" />}
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: task.isCompleted ? COLORS.textMuted : COLORS.text, textDecorationLine: task.isCompleted ? 'line-through' : 'none' }}>
          {WEEK_DAY_LABELS[weekdayIdx]}
        </Text>
        <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{formatJalaaliShort(jy, jm, jd)} - {formatTime(task.deadline)}</Text>
      </View>
      {overdue && !task.isCompleted && (
        <Text style={{ fontSize: 11, color: COLORS.danger, fontWeight: '600' }}>عقب‌افتاده</Text>
      )}
    </View>
  );
}
