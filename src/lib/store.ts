import { create } from 'zustand';
import {
  getAllTasks, getAllCategories, addTask as dbAddTask,
  updateTask as dbUpdateTask, deleteTask as dbDeleteTask,
  markTaskComplete as dbMarkComplete, markTaskIncomplete as dbMarkIncomplete,
  addCategory as dbAddCategory, updateCategory as dbUpdateCategory,
  deleteCategory as dbDeleteCategory, exportData, importData,
  getNearestDeadlineTask,
  type Task, type Category, type Priority, type DeadlineType,
} from './localDB';
import { timestampToJalaali } from './jalali';

export type TabType = 'tasks' | 'calendar' | 'reports' | 'settings';

interface ArmakStore {
  tasks: Task[];
  categories: Category[];
  activeTab: TabType;
  selectedDate: { jy: number; jm: number; jd: number } | null;
  nearestTask: Task | null;
  isLoading: boolean;
  editingTask: Task | null;
  isTaskFormOpen: boolean;
  isCategoryFormOpen: boolean;
  editingCategory: Category | null;
  detailTask: Task | null;
  filterCategory: string | null;

  setActiveTab: (tab: TabType) => void;
  setSelectedDate: (date: { jy: number; jm: number; jd: number } | null) => void;
  setFilterCategory: (catId: string | null) => void;
  loadAll: () => Promise<void>;

  createTask: (data: {
    title: string; description: string; categoryId: string | null;
    priority: Priority; deadlineType: DeadlineType; deadline: number; recurringInterval: number;
    parentId?: string | null;
  }) => Promise<void>;
  editTask: (data: {
    id: string; title: string; description: string; categoryId: string | null;
    priority: Priority; deadlineType: DeadlineType; deadline: number; recurringInterval: number;
  }) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  uncompleteTask: (id: string) => Promise<void>;
  openTaskForm: (task?: Task) => void;
  closeTaskForm: () => void;

  createCategory: (name: string, color: string) => Promise<void>;
  editCategory: (id: string, name: string, color: string) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  openCategoryForm: (cat?: Category) => void;
  closeCategoryForm: () => void;

  backupData: () => Promise<string>;
  restoreData: (json: string) => Promise<void>;

  getTasksForDate: (jy: number, jm: number, jd: number) => Task[];
  getCategoryById: (id: string) => Category | undefined;
  getTaskTree: () => { parent: Task; children: Task[] }[];
  openTaskDetail: (task: Task) => void;
  closeTaskDetail: () => void;
  refreshNearestTask: () => Promise<void>;
}

export const useArmakStore = create<ArmakStore>((set, get) => ({
  tasks: [],
  categories: [],
  activeTab: 'tasks',
  selectedDate: null,
  nearestTask: null,
  isLoading: true,
  editingTask: null,
  isTaskFormOpen: false,
  isCategoryFormOpen: false,
  editingCategory: null,
  detailTask: null,
  filterCategory: null,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setFilterCategory: (catId) => set({ filterCategory: catId }),

  loadAll: async () => {
    set({ isLoading: true });
    const [tasks, categories, nearest] = await Promise.all([
      getAllTasks(), getAllCategories(), getNearestDeadlineTask(),
    ]);
    set({ tasks, categories, nearestTask: nearest || null, isLoading: false });
  },

  createTask: async (data) => {
    if (data.deadlineType === 'weekly' && data.recurringInterval > 0) {
      const bitmask = data.recurringInterval;
      const base = new Date(data.deadline);
      const h = base.getHours();
      const m = base.getMinutes();
      const createdIds: string[] = [];
      for (let d = 0; d < 7; d++) {
        if (!(bitmask & (1 << d))) continue;
        const targetDay = d === 6 ? 0 : d + 1;
        let diff = targetDay - new Date().getDay();
        if (diff < 0) diff += 7;
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + diff);
        nextDate.setHours(h, m, 0, 0);
        const sub = await dbAddTask({
          title: data.title, description: data.description, categoryId: data.categoryId,
          priority: data.priority, deadlineType: data.deadlineType, deadline: nextDate.getTime(),
          recurringInterval: data.recurringInterval, parentId: null,
        });
        createdIds.push(sub.id);
      }
      // همه occurrenceها رو به اولی (والد) لینک کن
      if (createdIds.length > 0) {
        const parentId = createdIds[0];
        for (const cid of createdIds) {
          await dbUpdateTask(cid, { parentId });
        }
      }
    } else {
      await dbAddTask({
        title: data.title, description: data.description, categoryId: data.categoryId,
        priority: data.priority, deadlineType: data.deadlineType, deadline: data.deadline,
        recurringInterval: data.recurringInterval, parentId: data.parentId ?? null,
      });
    }
    await get().loadAll();
  },

  editTask: async (data) => {
    await dbUpdateTask(data.id, data);
    await get().loadAll();
  },

  removeTask: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;
    if (task.parentId) {
      await dbDeleteTask(id);
    } else {
      const children = get().tasks.filter(t => t.parentId === id);
      for (const c of children) await dbDeleteTask(c.id);
      await dbDeleteTask(id);
    }
    await get().loadAll();
  },

  completeTask: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;
    await dbMarkComplete(id);

    if (task.parentId) {
      // این یه occurrence (زیر‌تسک) هست؛ فقط خودش علامت می‌خوره.
    } else {
      // این والد هست (مثلاً هفتگی)؛ همه occurrenceهای زیرش رو هم کامل کن.
      const children = get().tasks.filter(t => t.parentId === id && !t.isCompleted);
      for (const c of children) await dbMarkComplete(c.id);
    }
    await get().loadAll();
  },

  uncompleteTask: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;
    await dbMarkIncomplete(id);
    await get().loadAll();
  },

  openTaskForm: (task) => set({ editingTask: task || null, isTaskFormOpen: true }),
  closeTaskForm: () => set({ isTaskFormOpen: false, editingTask: null }),

  createCategory: async (name, color) => {
    await dbAddCategory({ name, color });
    await get().loadAll();
  },

  editCategory: async (id, name, color) => {
    await dbUpdateCategory(id, { name, color });
    await get().loadAll();
  },

  removeCategory: async (id) => {
    await dbDeleteCategory(id);
    await get().loadAll();
  },

  openCategoryForm: (cat) => set({ editingCategory: cat || null, isCategoryFormOpen: true }),
  closeCategoryForm: () => set({ isCategoryFormOpen: false, editingCategory: null }),

  backupData: async () => {
    const data = await exportData();
    return JSON.stringify(data, null, 2);
  },

  restoreData: async (json) => {
    const data = JSON.parse(json);
    await importData(data);
    await get().loadAll();
  },

  getTasksForDate: (jy, jm, jd) => {
    const tasks = get().tasks;
    return tasks.filter(task => {
      const { jy: tj, jm: tm, jd: td } = timestampToJalaali(task.deadline);
      if (tj !== jy || tm !== jm || td !== jd) return false;
      if (task.deadlineType === 'once') return true;
      if (!task.isCompleted) return true;
      return false;
    });
  },

  getCategoryById: (id) => get().categories.find(c => c.id === id),

  getTaskTree: () => {
    const tasks = get().tasks;
    const parents = tasks.filter(t => !t.parentId);
    const tree = parents.map(parent => ({
      parent,
      children: tasks
        .filter(t => t.parentId === parent.id)
        .sort((a, b) => a.deadline - b.deadline),
    }));
    return tree;
  },

  openTaskDetail: (task) => set({ detailTask: task }),
  closeTaskDetail: () => set({ detailTask: null }),

  refreshNearestTask: async () => {
    const nearest = await getNearestDeadlineTask();
    set({ nearestTask: nearest || null });
  },
}));
