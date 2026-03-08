import { NextResponse } from "next/server";
import { getAllTodos, createTodo } from "@/lib/db";

export async function GET() {
  try {
    const todos = getAllTodos();
    return NextResponse.json(todos);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch todos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = (body?.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    const todo = createTodo(title);
    return NextResponse.json(todo, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create todo" }, { status: 500 });
  }
}
