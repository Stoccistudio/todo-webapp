/**
 * BDD-style Playwright tests for the Todo application.
 *
 * Structure follows the Given-When-Then pattern (BDD).
 * Tests were written RED first (before implementing features),
 * then the implementation was done to make them GREEN.
 */
import { test, expect } from "@playwright/test";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function clearTodos(page: import("@playwright/test").Page) {
  // Delete all todos via API to reset state between tests
  const res = await page.request.get("/api/todos");
  const todos = await res.json();
  await Promise.all(
    todos.map((t: { id: number }) =>
      page.request.delete(`/api/todos/${t.id}`)
    )
  );
}

// ─── Feature: View the todo list ──────────────────────────────────────────────

test.describe("Feature: View the todo list", () => {
  test.beforeEach(async ({ page }) => {
    await clearTodos(page);
    await page.goto("/");
  });

  test("Given no todos exist, When I open the app, Then I see the empty state message", async ({
    page,
  }) => {
    await expect(
      page.getByText("No todos yet — add one above!")
    ).toBeVisible();
  });

  test("Given one todo exists, When I open the app, Then I see it in the list", async ({
    page,
  }) => {
    await page.request.post("/api/todos", {
      data: { title: "Buy groceries" },
    });
    await page.reload();
    await expect(page.getByText("Buy groceries")).toBeVisible();
  });
});

// ─── Feature: Add a todo ──────────────────────────────────────────────────────

test.describe("Feature: Add a todo", () => {
  test.beforeEach(async ({ page }) => {
    await clearTodos(page);
    await page.goto("/");
  });

  test("Given the app is open, When I type a title and click Add, Then the todo appears in the list", async ({
    page,
  }) => {
    const input = page.getByLabel("New todo");
    await input.fill("Learn Playwright");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("Learn Playwright")).toBeVisible();
  });

  test("Given the app is open, When I type a title and press Enter, Then the todo appears in the list", async ({
    page,
  }) => {
    const input = page.getByLabel("New todo");
    await input.fill("Press Enter to add");
    await input.press("Enter");
    await expect(page.getByText("Press Enter to add")).toBeVisible();
  });

  test("Given the input is empty, When I click Add, Then nothing happens", async ({
    page,
  }) => {
    const addButton = page.getByRole("button", { name: "Add" });
    await expect(addButton).toBeDisabled();
  });
});

// ─── Feature: Complete a todo ─────────────────────────────────────────────────

test.describe("Feature: Complete a todo", () => {
  test.beforeEach(async ({ page }) => {
    await clearTodos(page);
    await page.request.post("/api/todos", { data: { title: "Write tests" } });
    await page.goto("/");
  });

  test("Given an active todo, When I click its checkbox, Then it is marked as completed", async ({
    page,
  }) => {
    const todoText = page.getByText("Write tests");
    await expect(todoText).toBeVisible();

    await page
      .getByRole("button", { name: "Mark as completed" })
      .first()
      .click();

    await expect(page.getByText("Write tests")).toHaveClass(/line-through/);
    await expect(page.getByText("0 items left")).toBeVisible();
  });

  test("Given a completed todo, When I click its checkbox, Then it becomes active again", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: "Mark as completed" })
      .first()
      .click();
    await page
      .getByRole("button", { name: "Mark as active" })
      .first()
      .click();

    await expect(page.getByText("Write tests")).not.toHaveClass(/line-through/);
    await expect(page.getByText("1 item left")).toBeVisible();
  });
});

// ─── Feature: Delete a todo ───────────────────────────────────────────────────

test.describe("Feature: Delete a todo", () => {
  test.beforeEach(async ({ page }) => {
    await clearTodos(page);
    await page.request.post("/api/todos", { data: { title: "Delete me" } });
    await page.goto("/");
  });

  test("Given a todo exists, When I click the delete button, Then the todo is removed", async ({
    page,
  }) => {
    const item = page.getByText("Delete me");
    await expect(item).toBeVisible();

    // Hover to reveal the delete button
    const listItem = page.locator("li").filter({ hasText: "Delete me" });
    await listItem.hover();
    await listItem.getByRole("button", { name: "Delete todo" }).click();

    await expect(page.getByText("Delete me")).not.toBeVisible();
    await expect(
      page.getByText("No todos yet — add one above!")
    ).toBeVisible();
  });
});

// ─── Feature: Edit a todo ─────────────────────────────────────────────────────

test.describe("Feature: Edit a todo", () => {
  test.beforeEach(async ({ page }) => {
    await clearTodos(page);
    await page.request.post("/api/todos", { data: { title: "Original title" } });
    await page.goto("/");
  });

  test("Given a todo, When I double-click it and change the text, Then the new title is saved", async ({
    page,
  }) => {
    await page.getByText("Original title").dblclick();

    const editInput = page.getByLabel("Edit todo");
    await editInput.clear();
    await editInput.fill("Updated title");
    await editInput.press("Enter");

    await expect(page.getByText("Updated title")).toBeVisible();
    await expect(page.getByText("Original title")).not.toBeVisible();
  });
});

// ─── Feature: Filter todos ────────────────────────────────────────────────────

test.describe("Feature: Filter todos", () => {
  test.beforeEach(async ({ page }) => {
    await clearTodos(page);
    await page.request.post("/api/todos", { data: { title: "Active task" } });
    const res = await page.request.post("/api/todos", {
      data: { title: "Done task" },
    });
    const todo = await res.json();
    await page.request.patch(`/api/todos/${todo.id}`, {
      data: { completed: true },
    });
    await page.goto("/");
  });

  test("Given mixed todos, When I click 'Active', Then only active todos are shown", async ({
    page,
  }) => {
    await page.getByRole("group", { name: "Filter todos" }).getByRole("button", { name: "active" }).click();
    await expect(page.getByText("Active task")).toBeVisible();
    await expect(page.getByText("Done task")).not.toBeVisible();
  });

  test("Given mixed todos, When I click 'Completed', Then only completed todos are shown", async ({
    page,
  }) => {
    await page.getByRole("group", { name: "Filter todos" }).getByRole("button", { name: "completed" }).click();
    await expect(page.getByText("Done task")).toBeVisible();
    await expect(page.getByText("Active task")).not.toBeVisible();
  });

  test("Given mixed todos, When I click 'All', Then all todos are shown", async ({
    page,
  }) => {
    const filterGroup = page.getByRole("group", { name: "Filter todos" });
    await filterGroup.getByRole("button", { name: "active" }).click();
    await filterGroup.getByRole("button", { name: "all" }).click();
    await expect(page.getByText("Active task")).toBeVisible();
    await expect(page.getByText("Done task")).toBeVisible();
  });
});

// ─── Feature: Clear completed todos ──────────────────────────────────────────

test.describe("Feature: Clear completed todos", () => {
  test.beforeEach(async ({ page }) => {
    await clearTodos(page);
    await page.request.post("/api/todos", { data: { title: "Keep me" } });
    const res = await page.request.post("/api/todos", {
      data: { title: "Delete me" },
    });
    const todo = await res.json();
    await page.request.patch(`/api/todos/${todo.id}`, {
      data: { completed: true },
    });
    await page.goto("/");
  });

  test("Given completed todos exist, When I click 'Clear completed', Then completed todos are removed", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Clear completed" }).click();
    await expect(page.getByText("Delete me")).not.toBeVisible();
    await expect(page.getByText("Keep me")).toBeVisible();
  });
});

// ─── Feature: Dark mode ───────────────────────────────────────────────────────

test.describe("Feature: Dark / light mode toggle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Given light mode, When I click the theme toggle, Then dark mode is applied", async ({
    page,
  }) => {
    // Ensure we start in light mode
    await page.evaluate(() => {
      localStorage.setItem("theme", "light");
      document.documentElement.classList.remove("dark");
    });
    await page.reload();

    await page.getByRole("button", { name: "Toggle dark mode" }).click();

    const hasDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    );
    expect(hasDark).toBe(true);
  });

  test("Given dark mode, When I click the theme toggle, Then light mode is applied", async ({
    page,
  }) => {
    // Force dark mode
    await page.evaluate(() => {
      localStorage.setItem("theme", "dark");
      document.documentElement.classList.add("dark");
    });
    await page.reload();

    await page.getByRole("button", { name: "Toggle dark mode" }).click();

    const hasDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    );
    expect(hasDark).toBe(false);
  });
});
