import { NextResponse } from "next/server";
import { updateTodo, deleteTodo } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const body = await request.json();
    const data: { title?: string; completed?: boolean } = {};
    if (typeof body.title === "string") data.title = body.title.trim();
    if (typeof body.completed === "boolean") data.completed = body.completed;

    const todo = updateTodo(numId, data);
    if (!todo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }
    return NextResponse.json(todo);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update todo" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const deleted = deleteTodo(numId);
    if (!deleted) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete todo" }, { status: 500 });
  }
}
