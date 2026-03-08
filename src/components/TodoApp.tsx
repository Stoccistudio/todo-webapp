"use client";

import { useEffect, useState } from "react";

interface Todo {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
}

type Filter = "all" | "active" | "completed";

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return stored === "dark" || (!stored && prefersDark) ? "dark" : "light";
  });

  // ── Load theme ─────────────────────────────────────────────

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  // ── Fetch todos ─────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/todos")
      .then((r) => r.json())
      .then((data) => {
        setTodos(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── Add todo ─────────────────────────────────────────────────
  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = input.trim();
    if (!title) return;
    const res = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (res.ok) {
      const todo: Todo = await res.json();
      setTodos((prev) => [todo, ...prev]);
      setInput("");
    }
  };

  // ── Toggle complete ───────────────────────────────────────────
  const toggleTodo = async (todo: Todo) => {
    const res = await fetch(`/api/todos/${todo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !todo.completed }),
    });
    if (res.ok) {
      const updated: Todo = await res.json();
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    }
  };

  // ── Save edit ─────────────────────────────────────────────────
  const saveEdit = async (id: number) => {
    const title = editValue.trim();
    if (!title) return;
    const res = await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (res.ok) {
      const updated: Todo = await res.json();
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    }
    setEditingId(null);
  };

  // ── Delete ────────────────────────────────────────────────────
  const deleteTodo = async (id: number) => {
    const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTodos((prev) => prev.filter((t) => t.id !== id));
    }
  };

  // ── Clear completed ───────────────────────────────────────────
  const clearCompleted = async () => {
    const completed = todos.filter((t) => t.completed);
    await Promise.all(
      completed.map((t) => fetch(`/api/todos/${t.id}`, { method: "DELETE" }))
    );
    setTodos((prev) => prev.filter((t) => !t.completed));
  };

  // ── Derived data ──────────────────────────────────────────────
  const filtered = todos.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  const activeCount = todos.filter((t) => !t.completed).length;
  const hasCompleted = todos.some((t) => t.completed);

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-10 sm:py-16">
      {/* Header */}
      <header className="w-full max-w-lg flex items-center justify-between mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-widest uppercase text-indigo-600 dark:text-indigo-400">
          Todos
        </h1>
        <button
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
        >
          {theme === "dark" ? (
            /* sun icon */
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-9h-1M4.34 12H3m15.07-6.07-.71.71M6.34 17.66l-.71.71M17.66 17.66l.71.71M6.34 6.34l.71.71M12 7a5 5 0 100 10A5 5 0 0012 7z" />
            </svg>
          ) : (
            /* moon icon */
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          )}
        </button>
      </header>

      {/* Add todo form */}
      <form onSubmit={addTodo} className="w-full max-w-lg mb-4">
        <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-2xl shadow-md p-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What needs to be done?"
            aria-label="New todo"
            className="flex-1 px-3 py-2 bg-transparent outline-none text-base placeholder-gray-400 dark:placeholder-gray-500"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-indigo-900 text-white font-semibold rounded-xl transition-colors"
          >
            Add
          </button>
        </div>
      </form>

      {/* Todo list card */}
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
        {loading ? (
          <p className="text-center py-10 text-gray-400">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-center py-10 text-gray-400 dark:text-gray-500">
            {filter === "all" ? "No todos yet — add one above!" : `No ${filter} todos.`}
          </p>
        ) : (
          <ul role="list">
            {filtered.map((todo, idx) => (
              <li
                key={todo.id}
                className={`flex items-center gap-3 px-4 py-3 ${
                  idx !== filtered.length - 1
                    ? "border-b border-gray-100 dark:border-gray-700"
                    : ""
                } group`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleTodo(todo)}
                  aria-label={todo.completed ? "Mark as active" : "Mark as completed"}
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    todo.completed
                      ? "bg-indigo-500 border-indigo-500"
                      : "border-gray-300 dark:border-gray-600 hover:border-indigo-400"
                  }`}
                >
                  {todo.completed && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586l-3.293-3.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>

                {/* Title / Edit */}
                {editingId === todo.id ? (
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => saveEdit(todo.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(todo.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    aria-label="Edit todo"
                    className="flex-1 bg-transparent outline-none border-b-2 border-indigo-400 py-0.5 text-base"
                  />
                ) : (
                  <span
                    onDoubleClick={() => {
                      setEditingId(todo.id);
                      setEditValue(todo.title);
                    }}
                    className={`flex-1 text-base cursor-pointer select-none ${
                      todo.completed ? "line-through text-gray-400 dark:text-gray-500" : ""
                    }`}
                  >
                    {todo.title}
                  </span>
                )}

                {/* Delete */}
                <button
                  onClick={() => deleteTodo(todo.id)}
                  aria-label="Delete todo"
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Footer */}
        {todos.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
            <span>{activeCount} item{activeCount !== 1 ? "s" : ""} left</span>

            {/* Filters */}
            <div className="flex gap-1" role="group" aria-label="Filter todos">
              {(["all", "active", "completed"] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2 py-0.5 rounded capitalize transition-colors ${
                    filter === f
                      ? "border border-indigo-400 text-indigo-600 dark:text-indigo-400"
                      : "hover:text-gray-700 dark:hover:text-gray-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {hasCompleted && (
              <button
                onClick={clearCompleted}
                className="hover:text-red-500 transition-colors"
              >
                Clear completed
              </button>
            )}
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-gray-400 dark:text-gray-600">
        Double-click a todo to edit it
      </p>
    </div>
  );
}
