import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const allUsers = await db
      .select({ username: users.username })
      .from(users);

    return NextResponse.json(allUsers.map((u) => u.username));
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
