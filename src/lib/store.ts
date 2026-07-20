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
  filterCategory: string | null;

  setActiveTab: (tab: TabType) => void;
  setSelectedDate: (date: { jy: number; jm: number; jd: number } | null) => void;
  setFilterCategory: (catId: string | null) => void;
  loadAll: () => Promise<void>;

  createTask: (data: {
    title: string; description: string; categoryId: string | null;
    priority: Priority; deadlineType: DeadlineType; deadline: number; recurringInterval: number;
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
    await dbAddTask(data);
    await get().loadAll();
  },

  editTask: async (data) => {
    await dbUpdateTask(data.id, data);
    await get().loadAll();
  },

  removeTask: async (id) => {
    await dbDeleteTask(id);
    await get().loadAll();
  },

  completeTask: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;
    await dbMarkComplete(id);

    if (task.deadlineType === 'daily' && task.recurringInterval > 0) {
      const nextDeadline = task.deadline + (task.recurringInterval * 86400000);
      await dbAddTask({
        title: task.title, description: task.description,
        categoryId: task.categoryId, priority: task.priority,
        deadlineType: 'daily', deadline: nextDeadline, recurringInterval: task.recurringInterval,
      });
    } else if (task.deadlineType === 'weekly') {
      const bitmask = task.recurringInterval;
      const today = new Date();
      const h = new Date(task.deadline).getHours();
      const m = new Date(task.deadline).getMinutes();
      let bestDiff = Infinity;
      for (let d = 0; d < 7; d++) {
        if (!(bitmask & (1 << d))) continue;
        const targetDay = d === 6 ? 0 : d + 1;
        let diff = targetDay - today.getDay();
        if (diff <= 0) diff += 7;
        if (diff < bestDiff) bestDiff = diff;
      }
      if (bestDiff !== Infinity) {
        const nextDate = new Date(today.getTime() + bestDiff * 86400000);
        nextDate.setHours(h, m, 0, 0);
        await dbAddTask({
          title: task.title, description: task.description,
          categoryId: task.categoryId, priority: task.priority,
          deadlineType: 'weekly', deadline: nextDate.getTime(), recurringInterval: bitmask,
        });
      }
    }
    await get().loadAll();
  },

  uncompleteTask: async (id) => {
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

  refreshNearestTask: async () => {
    const nearest = await getNearestDeadlineTask();
    set({ nearestTask: nearest || null });
  },
}));
