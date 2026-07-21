import { Platform } from 'react-native';
import { type Task } from './localDB';
import { timestampToJalaali, formatJalaaliDate, formatTime } from './jalali';

let nfAvailable = true;

function nf() {
  if (!nfAvailable) return null;
  try {
    return require('expo-notifications');
  } catch {
    nfAvailable = false;
    return null;
  }
}

export async function setupNotifications(): Promise<boolean> {
  const N = nf();
  if (!N) return false;
  try {
    const { status } = await N.getPermissionsAsync();
    if (status !== 'granted') {
      const r = await N.requestPermissionsAsync();
      if (r.status !== 'granted') return false;
    }
    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync('tasks', { name: 'یادآوری تسک‌ها', importance: N.AndroidImportance?.MAX || 4, lockscreenVisibility: 1 });
      await N.setNotificationChannelAsync('persistent', { name: 'نزدیک‌ترین تسک', importance: N.AndroidImportance?.LOW || 2, lockscreenVisibility: 1 });
    }
    return true;
  } catch {
    nfAvailable = false;
    return false;
  }
}

function nearestPending(tasks: Task[]): Task | null {
  const now = Date.now();
  const pending = tasks.filter(t => !t.isCompleted && t.deadline >= now).sort((a, b) => a.deadline - b.deadline);
  return pending[0] || null;
}

export async function updatePersistentNotification(tasks: Task[]): Promise<void> {
  const N = nf();
  if (!N) return;
  try {
    await N.dismissNotificationAsync('persistent-task' as any);
  } catch {}
  const task = nearestPending(tasks);
  if (!task) return;
  const { jy, jm, jd } = timestampToJalaali(task.deadline);
  await N.presentNotificationAsync(
    { title: 'نزدیک‌ترین تسک', body: `${task.title} — ${formatJalaaliDate(jy, jm, jd)} ساعت ${formatTime(task.deadline)}`,
      ...(Platform.OS === 'android' ? { android: { channelId: 'persistent' } as any } : {}) },
    { identifier: 'persistent-task' } as any,
  );
}

export async function scheduleReminder(task: Task): Promise<void> {
  const N = nf();
  if (!N) return;
  try {
    const seconds = Math.max(1, Math.floor((task.deadline - Date.now()) / 1000));
    if (seconds > 60 * 60 * 24 * 30) return;
    await N.scheduleNotificationAsync({
      content: { title: 'یادآوری تسک', body: task.title, ...(Platform.OS === 'android' ? { channelId: 'tasks' } : {}) },
      trigger: { type: 'timeInterval', seconds, repeats: false } as any,
    });
  } catch {}
}

export function isNotificationsAvailable(): boolean {
  return nfAvailable;
}
