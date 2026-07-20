import * as SQLite from 'expo-sqlite';
import { jalaaliToTimestamp } from './jalali';

export interface Category {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export type Priority = 'high' | 'medium' | 'low';
export type DeadlineType = 'once' | 'daily' | 'weekly';

export interface Task {
  id: string;
  parentId: string | null;
  title: string;
  description: string;
  categoryId: string | null;
  priority: Priority;
  deadlineType: DeadlineType;
  deadline: number;
  recurringInterval: number;
  isCompleted: boolean;
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

const db = SQLite.openDatabaseSync('armak-task.db');

export function initDB(): void {
  db.execSync(
    `PRAGMA journal_mode = WAL;
     CREATE TABLE IF NOT EXISTS categories (
       id TEXT PRIMARY KEY NOT NULL,
       name TEXT NOT NULL,
       color TEXT NOT NULL,
       createdAt INTEGER NOT NULL
     );
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY NOT NULL,
        parentId TEXT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        categoryId TEXT,
        priority TEXT NOT NULL,
        deadlineType TEXT NOT NULL,
        deadline INTEGER NOT NULL,
        recurringInterval INTEGER NOT NULL,
        isCompleted INTEGER NOT NULL DEFAULT 0,
        completedAt INTEGER,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_task_deadline ON tasks (deadline);
      CREATE INDEX IF NOT EXISTS idx_task_category ON tasks (categoryId);
      CREATE INDEX IF NOT EXISTS idx_task_completed ON tasks (isCompleted);
      CREATE INDEX IF NOT EXISTS idx_task_parent ON tasks (parentId);`
  );
  addColumnIfMissing('tasks', 'parentId', 'TEXT');
}

function addColumnIfMissing(table: string, column: string, type: string): void {
  const cols = db.getAllSync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!cols.some(c => c.name === column)) {
    db.execSync(`ALTER TABLE ${table} ADD COLUMN ${column} ${type};`);
  }
}

function uid(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {}
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ==================== TASKS ====================

export async function getAllTasks(): Promise<Task[]> {
  const rows = db.getAllSync<Task>('SELECT * FROM tasks');
  return rows.sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.deadline - b.deadline;
  });
}

export async function addTask(
  task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'isCompleted' | 'completedAt'>
): Promise<Task> {
  const newTask: Task = {
    ...task,
    id: uid(),
    isCompleted: false,
    completedAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  db.runSync(
    `INSERT INTO tasks (id, parentId, title, description, categoryId, priority, deadlineType, deadline, recurringInterval, isCompleted, completedAt, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, ?, ?)`,
    [
      newTask.id, newTask.parentId ?? null, newTask.title, newTask.description, newTask.categoryId,
      newTask.priority, newTask.deadlineType, newTask.deadline, newTask.recurringInterval,
      newTask.createdAt, newTask.updatedAt,
    ]
  );
  return newTask;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  const existing = db.getFirstSync<Task>('SELECT * FROM tasks WHERE id = ?', [id]);
  if (!existing) return;
  const merged = { ...existing, ...updates, updatedAt: Date.now() };
  db.runSync(
    `UPDATE tasks SET parentId=?, title=?, description=?, categoryId=?, priority=?, deadlineType=?, deadline=?, recurringInterval=?, isCompleted=?, completedAt=?, updatedAt=? WHERE id=?`,
    [
      merged.parentId ?? null, merged.title, merged.description, merged.categoryId, merged.priority,
      merged.deadlineType, merged.deadline, merged.recurringInterval,
      merged.isCompleted ? 1 : 0, merged.completedAt, merged.updatedAt, id,
    ]
  );
}

export async function deleteTask(id: string): Promise<void> {
  db.runSync('DELETE FROM tasks WHERE id = ?', [id]);
}

export async function markTaskComplete(id: string): Promise<void> {
  await updateTask(id, { isCompleted: true, completedAt: Date.now() });
}

export async function markTaskIncomplete(id: string): Promise<void> {
  await updateTask(id, { isCompleted: false, completedAt: null });
}

export async function getNearestDeadlineTask(): Promise<Task | undefined> {
  const pending = await getPendingTasks();
  const now = Date.now();
  const upcoming = pending
    .filter(t => t.deadline >= now)
    .sort((a, b) => a.deadline - b.deadline);
  return upcoming[0] || pending[0];
}

async function getPendingTasks(): Promise<Task[]> {
  const all = await getAllTasks();
  return all.filter(t => !t.isCompleted);
}

// ==================== CATEGORIES ====================

export async function getAllCategories(): Promise<Category[]> {
  return db.getAllSync<Category>('SELECT * FROM categories');
}

export async function addCategory(category: Omit<Category, 'id' | 'createdAt'>): Promise<Category> {
  const newCat: Category = { ...category, id: uid(), createdAt: Date.now() };
  db.runSync('INSERT INTO categories (id, name, color, createdAt) VALUES (?, ?, ?, ?)', [
    newCat.id, newCat.name, newCat.color, newCat.createdAt,
  ]);
  return newCat;
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<void> {
  const existing = db.getFirstSync<Category>('SELECT * FROM categories WHERE id = ?', [id]);
  if (!existing) return;
  const merged = { ...existing, ...updates };
  db.runSync('UPDATE categories SET name=?, color=? WHERE id=?', [
    merged.name, merged.color, id,
  ]);
}

export async function deleteCategory(id: string): Promise<void> {
  db.runSync('UPDATE tasks SET categoryId=NULL WHERE categoryId=?', [id]);
  db.runSync('DELETE FROM categories WHERE id=?', [id]);
}

// ==================== BACKUP / RESTORE ====================

export interface BackupData {
  tasks: Task[];
  categories: Category[];
  exportedAt: number;
  version: string;
}

export async function exportData(): Promise<BackupData> {
  const [tasks, categories] = await Promise.all([getAllTasks(), getAllCategories()]);
  return { tasks, categories, exportedAt: Date.now(), version: '1.0' };
}

export async function importData(data: BackupData): Promise<void> {
  db.execSync('DELETE FROM tasks; DELETE FROM categories;');
  for (const cat of data.categories) {
    db.runSync('INSERT OR REPLACE INTO categories (id, name, color, createdAt) VALUES (?, ?, ?, ?)', [
      cat.id, cat.name, cat.color, cat.createdAt,
    ]);
  }
  for (const t of data.tasks) {
    db.runSync(
      `INSERT OR REPLACE INTO tasks (id, parentId, title, description, categoryId, priority, deadlineType, deadline, recurringInterval, isCompleted, completedAt, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        t.id, t.parentId ?? null, t.title, t.description, t.categoryId, t.priority, t.deadlineType, t.deadline,
        t.recurringInterval, t.isCompleted ? 1 : 0, t.completedAt, t.createdAt, t.updatedAt,
      ]
    );
  }
}

export async function resetDatabase(): Promise<void> {
  db.execSync('DROP TABLE IF EXISTS tasks; DROP TABLE IF EXISTS categories;');
  initDB();
}

export { jalaaliToTimestamp };
