import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { type Task } from './localDB';
import { timestampToJalaali, formatJalaaliDate, formatTime } from './jalali';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function setupNotifications(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const r = await Notifications.requestPermissionsAsync();
    if (r.status !== 'granted') return false;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('tasks', {
      name: 'یادآوری تسک‌ها',
      importance: Notifications.AndroidImportance.MAX,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
    await Notifications.setNotificationChannelAsync('persistent', {
      name: 'نزدیک‌ترین تسک',
      importance: Notifications.AndroidImportance.LOW,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
  return true;
}

function nearestPending(tasks: Task[]): Task | null {
  const now = Date.now();
  const pending = tasks
    .filter(t => !t.isCompleted && t.deadline >= now)
    .sort((a, b) => a.deadline - b.deadline);
  return pending[0] || null;
}

export async function updatePersistentNotification(tasks: Task[]): Promise<void> {
  try {
    await Notifications.dismissNotificationAsync('persistent-task');
  } catch {}
  const task = nearestPending(tasks);
  if (!task) return;
  const { jy, jm, jd } = timestampToJalaali(task.deadline);
  await Notifications.presentNotificationAsync(
    {
      title: 'نزدیک‌ترین تسک',
      body: `${task.title} — ${formatJalaaliDate(jy, jm, jd)} ساعت ${formatTime(task.deadline)}`,
      ...(Platform.OS === 'android'
        ? { android: { channelId: 'persistent', sticky: true, autoDismiss: false, color: '#3b82f6' } as any }
        : {}),
    },
    { identifier: 'persistent-task' } as any,
  );
}

export async function scheduleReminder(task: Task): Promise<void> {
  const seconds = Math.max(1, Math.floor((task.deadline - Date.now()) / 1000));
  if (seconds > 60 * 60 * 24 * 30) return; // بیشتر از ۳۰ روز شدول نکن
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'یادآوری تسک',
      body: task.title,
      ...(Platform.OS === 'android' ? { channelId: 'tasks' } : {}),
    },
    trigger: { type: 'timeInterval', seconds, repeats: false } as any,
  });
}
