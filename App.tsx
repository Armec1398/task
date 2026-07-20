import { useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, TextProps, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Plus, Bell } from 'lucide-react-native';
import { useArmakStore } from './src/lib/store';
import { initDB } from './src/lib/localDB';
import { formatRelativeTime } from './src/lib/jalali';
import BottomNav from './src/components/BottomNav';
import TaskList from './src/components/TaskList';
import TaskForm from './src/components/TaskForm';
import TaskDetail from './src/components/TaskDetail';
import CalendarView from './src/components/CalendarView';
import ReportsPage from './src/components/ReportsPage';
import SettingsPage from './src/components/SettingsPage';
import { COLORS } from './src/lib/theme';
import { prepareAppearance, FONT } from './src/lib/appearance';
import { setupNotifications, updatePersistentNotification } from './src/lib/notifications';

const TITLES: Record<string, string> = {
  tasks: 'تسک‌ها',
  calendar: 'تقویم',
  reports: 'گزارش',
  settings: 'تنظیمات',
};

(Text as any).defaultProps = (Text as any).defaultProps || {};
(Text as any).defaultProps.style = [{ fontFamily: FONT.regular }, (Text as any).defaultProps.style];

export default function App() {
  const { activeTab, loadAll, isLoading, nearestTask, openTaskForm, tasks } = useArmakStore();
  useEffect(() => {
    initDB();
    loadAll();
    prepareAppearance();
    setupNotifications();
  }, []);
  useEffect(() => {
    updatePersistentNotification(tasks);
  }, [tasks]);
  const pendingCount = tasks.filter(t => !t.isCompleted && !t.parentId).length;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar style="dark" />
      {nearestTask && !nearestTask.isCompleted && activeTab === 'tasks' && (
        <View style={{ backgroundColor: COLORS.primarySoft, paddingTop: 12, paddingHorizontal: 16, paddingBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, maxWidth: 480, alignSelf: 'center', width: '100%' }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary + '33', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={14} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, color: COLORS.textMuted }}>نزدیک‌ترین ددلاین</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text }} numberOfLines={1}>{nearestTask.title}</Text>
              <Text style={{ fontSize: 11, color: COLORS.primary, fontWeight: '600', marginTop: 2 }}>{formatRelativeTime(nearestTask.deadline)}</Text>
            </View>
          </View>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.text }}>{TITLES[activeTab]}</Text>
          {activeTab === 'tasks' && (
            <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{pendingCount} تسک در انتظار انجام</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>{isLoading ? <ActivityIndicator color={COLORS.primary} /> : <>
          {activeTab === 'tasks' && <TaskList />}
          {activeTab === 'calendar' && <CalendarView />}
          {activeTab === 'reports' && <ReportsPage />}
          {activeTab === 'settings' && <SettingsPage />}
        </>}</View>
      </View>
      {activeTab === 'tasks' && (
        <TouchableOpacity onPress={() => openTaskForm()} style={{ position: 'absolute', bottom: 84, alignSelf: 'center', width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6 }}>
          <Plus size={26} color="#fff" />
        </TouchableOpacity>
      )}
      <TaskForm />
      <TaskDetail />
      <BottomNav />
    </SafeAreaView>
  );
}
