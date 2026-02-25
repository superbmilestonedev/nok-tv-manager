import { NextResponse } from "next/server";
import { asc, sql } from "drizzle-orm";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { createUserSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

// GET /api/users — list all users (admin only)
export async function GET() {
  try {
    await requireAdmin();

    const result = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(asc(users.id));

    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof Error && e.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    return NextResponse.json({ error: "Couldn't load users." }, { status: 500 });
  }
}

// POST /api/users — create new user (admin only)
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid user data. Username must be letters, numbers, or underscores." },
        { status: 400 }
      );
    }

    const { username, email, isAdmin } = parsed.data;

    // Check duplicate
    const existing = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.username, username),
    });
    if (existing) {
      return NextResponse.json(
        { error: "That username is already taken." },
        { status: 409 }
      );
    }

    // Generate sequential PIN
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    const userCount = countResult[0]?.count ?? 0;
    const pinNumber = (userCount + 1).toString().padStart(6, "0");
    const pinHash = await hash(pinNumber, 10);

    const [user] = await db
      .insert(users)
      .values({
        username,
        pinHash,
        email: email || "",
        isAdmin: isAdmin || false,
      })
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
      });

    return NextResponse.json(
      {
        ...user,
        generatedPin: pinNumber, // Show once to admin
      },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof Error && e.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    return NextResponse.json({ error: "Couldn't create user." }, { status: 500 });
  }
}
