import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useArmakStore } from '../lib/store';
import { CategoryManager, NotificationSetting } from './CategoryManager';
import { Download, Upload } from 'lucide-react-native';
import { COLORS } from '../lib/theme';
import * as DocumentPicker from 'expo-document-picker';

export default function SettingsPage() {
  const { backupData, restoreData, resetDatabase } = useArmakStore();

  const handleBackup = async () => {
    const json = await backupData();
    // کپی به کلیپ‌بورد (ساده‌ترین راه بدون فایل‌سیستم پیچیده)
    const { Clipboard } = require('react-native');
    Clipboard.setString(json);
    Alert.alert('پشتیبان‌گیری', 'داده‌ها در کلیپ‌بورد کپی شد. می‌تونی جایی ذخیره‌شون کنی.');
  };

  const handleRestore = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
      if (res.canceled || !res.assets?.length) return;
      const { readFileSync } = require('fs');
      const text = readFileSync(res.assets[0].uri, 'utf8');
      await restoreData(text);
      Alert.alert('بازیابی', 'با موفقیت انجام شد!');
    } catch (e) {
      Alert.alert('خطا', 'فایل نامعتبر است');
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 24 }}>
      <NotificationSetting />
      <CategoryManager />

      <View style={{ backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Download size={16} color={COLORS.primary} />
          <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text }}>پشتیبان‌گیری</Text>
        </View>
        <Text style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 12 }}>
          برای انتقال به گوشی دیگه، خروجی بگیر و توی گوشی جدید بازیابی کن.
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={handleBackup} style={{ flex: 1, backgroundColor: COLORS.surfaceAlt, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Download size={14} color={COLORS.primary} />
            <Text style={{ fontSize: 12, color: COLORS.primary }}>خروجی</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRestore} style={{ flex: 1, backgroundColor: COLORS.surfaceAlt, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Upload size={14} color={COLORS.primary} />
            <Text style={{ fontSize: 12, color: COLORS.primary }}>بازیابی</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => Alert.alert('ریست دیتابیس', 'همه تسک‌ها و دسته‌بندی‌ها پاک میشن. ادامه می‌دی؟', [
          { text: 'انصراف', style: 'cancel' },
          { text: 'ریست کن', style: 'destructive', onPress: async () => { await resetDatabase(); Alert.alert('انجام شد', 'دیتابیس ریست شد.'); } },
        ])}
        style={{ backgroundColor: COLORS.dangerSoft, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
      >
        <Text style={{ color: COLORS.danger, fontWeight: '700' }}>ریست دیتابیس (پاک کردن همه)</Text>
      </TouchableOpacity>

      <View style={{ alignItems: 'center', paddingVertical: 16 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textMuted }}>آرمک تسک</Text>
        <Text style={{ fontSize: 11, color: COLORS.textMuted }}>نسخه ۱.۰.۰</Text>
      </View>
    </ScrollView>
  );
}
