import Database from "better-sqlite3";
import path from "path";

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    const isTest = process.env.NODE_ENV === "test";
    const dbPath = isTest ? ":memory:" : path.join(process.cwd(), "todos.db");
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  }
  return db;
}

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
}

interface TodoRow {
  id: number;
  title: string;
  completed: number;
  created_at: string;
}

function mapRow(row: TodoRow): Todo {
  return { ...row, completed: row.completed === 1 };
}

export function getAllTodos(): Todo[] {
  const rows = getDb()
    .prepare("SELECT * FROM todos ORDER BY created_at DESC")
    .all() as TodoRow[];
  return rows.map(mapRow);
}

export function createTodo(title: string): Todo {
  const stmt = getDb().prepare(
    "INSERT INTO todos (title) VALUES (?) RETURNING *"
  );
  const row = stmt.get(title) as TodoRow;
  return mapRow(row);
}

export function updateTodo(
  id: number,
  data: Partial<Pick<Todo, "title" | "completed">>
): Todo | null {
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (data.title !== undefined) {
    fields.push("title = ?");
    values.push(data.title);
  }
  if (data.completed !== undefined) {
    fields.push("completed = ?");
    values.push(data.completed ? 1 : 0);
  }

  if (fields.length === 0) return null;
  values.push(id);

  const stmt = getDb().prepare(
    `UPDATE todos SET ${fields.join(", ")} WHERE id = ? RETURNING *`
  );
  const row = stmt.get(...values) as TodoRow | undefined;
  return row ? mapRow(row) : null;
}

export function deleteTodo(id: number): boolean {
  const result = getDb().prepare("DELETE FROM todos WHERE id = ?").run(id);
  return result.changes > 0;
}

export function clearAllTodos(): void {
  getDb().exec("DELETE FROM todos");
}

/** Reset DB singleton – for tests only */
export function resetDb(): void {
  if (db) {
    db.close();
    db = null as unknown as Database.Database;
  }
}
