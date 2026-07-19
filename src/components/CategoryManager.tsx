import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Switch } from 'react-native';
import { useArmakStore } from '../lib/store';
import { Plus, Edit3, Trash2, Check, X, Bell } from 'lucide-react-native';
import { COLORS, CATEGORY_COLORS, catColor } from '../lib/theme';

export function CategoryManager() {
  const { categories, createCategory, editCategory, removeCategory } = useArmakStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>('blue');

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (editingId) { await editCategory(editingId, name.trim(), color); setEditingId(null); }
    else { await createCategory(name.trim(), color); }
    setName(''); setColor('blue'); setShowAdd(false);
  };

  const startEdit = (cat: { id: string; name: string; color: string }) => {
    setEditingId(cat.id); setName(cat.name); setColor(cat.color); setShowAdd(true);
  };
  const cancel = () => { setEditingId(null); setName(''); setColor('blue'); setShowAdd(false); };

  return (
    <View style={{ backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text }}>دسته‌بندی‌ها</Text>
        {!showAdd && (
          <TouchableOpacity onPress={() => { setShowAdd(true); setEditingId(null); setName(''); setColor('blue'); }} style={{ padding: 6 }}>
            <Plus size={18} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>

      {showAdd && (
        <View style={{ backgroundColor: COLORS.surfaceAlt, borderRadius: 12, padding: 12, marginBottom: 12, gap: 10 }}>
          <TextInput
            value={name} onChangeText={setName} placeholder="نام دسته‌بندی"
            placeholderTextColor={COLORS.textMuted}
            style={{ backgroundColor: COLORS.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, textAlign: 'right' }}
            autoFocus
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORY_COLORS.map(c => (
              <TouchableOpacity key={c} onPress={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: catColor(c), borderWidth: color === c ? 3 : 0, borderColor: COLORS.primary }} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={handleSubmit} style={{ flex: 1, backgroundColor: COLORS.primary, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Check size={14} color="#fff" />
              <Text style={{ fontSize: 12, color: '#fff', fontWeight: '700' }}>{editingId ? 'ذخیره' : 'افزودن'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={cancel} style={{ padding: 10 }}>
              <X size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {categories.length === 0 ? (
        <Text style={{ fontSize: 12, color: COLORS.textMuted, textAlign: 'center', paddingVertical: 8 }}>هنوز دسته‌بندی‌ای نساختی</Text>
      ) : (
        <View style={{ gap: 6 }}>
          {categories.map(cat => (
            <View key={cat.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderRadius: 10 }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: catColor(cat.color) }} />
              <Text style={{ flex: 1, fontSize: 13, color: COLORS.text }}>{cat.name}</Text>
              <TouchableOpacity onPress={() => startEdit(cat)} style={{ padding: 4 }}>
                <Edit3 size={14} color={COLORS.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeCategory(cat.id)} style={{ padding: 4 }}>
                <Trash2 size={14} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// یه توضیح کوچک: نوتیفیکیشن لوکال توی RN نیاز به کتابخانه جدا داره (expo-notifications)
// اینجا فعلاً به صورت تنظیم ساده نشون داده میشه. برای نسخه کامل می‌تونیم اضافه کنیم.
export function NotificationSetting() {
  const [enabled, setEnabled] = useState(false);
  return (
    <View style={{ backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Bell size={16} color={COLORS.primary} />
        <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text }}>نوتیفیکیشن</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
        <Text style={{ fontSize: 13, color: COLORS.text }}>فعال‌سازی یادآوری</Text>
        <Switch value={enabled} onValueChange={setEnabled} trackColor={{ true: COLORS.primary, false: COLORS.border }} thumbColor="#fff" />
      </View>
      <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 6 }}>
        (برای نوتیفیکیشن واقعی، نصب expo-notifications لازمه)
      </Text>
    </View>
  );
}
