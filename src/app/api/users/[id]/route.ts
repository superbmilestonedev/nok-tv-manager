import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { updateUserSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

// PATCH /api/users/[id] — update user
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID." }, { status: 400 });
    }

    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid update data." }, { status: 400 });
    }

    const existing = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    if (!existing) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    let newPin: string | null = null;

    if (parsed.data.username !== undefined) {
      // Check duplicate
      const dup = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.username, parsed.data.username!),
      });
      if (dup && dup.id !== userId) {
        return NextResponse.json(
          { error: "That username is already taken." },
          { status: 409 }
        );
      }
      updates.username = parsed.data.username;
    }

    if (parsed.data.email !== undefined) {
      updates.email = parsed.data.email;
    }

    if (parsed.data.pin) {
      // Set custom PIN
      newPin = parsed.data.pin;
      updates.pinHash = await hash(newPin, 10);
    } else if (parsed.data.resetPin) {
      // Generate new sequential PIN
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(users);
      const count = countResult[0]?.count ?? 0;
      newPin = (count + 100).toString().padStart(6, "0");
      updates.pinHash = await hash(newPin, 10);
    }

    if (Object.keys(updates).length === 0 && !newPin) {
      return NextResponse.json({ success: true, message: "Nothing to update." });
    }

    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
      });

    return NextResponse.json({
      ...updated,
      ...(newPin ? { newPin } : {}),
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    return NextResponse.json({ error: "Couldn't update user." }, { status: 500 });
  }
}

// DELETE /api/users/[id] — delete user
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();

    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID." }, { status: 400 });
    }

    // Prevent self-deletion
    if (session.userId === userId) {
      return NextResponse.json(
        { error: "You can't delete your own account." },
        { status: 400 }
      );
    }

    const existing = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    if (!existing) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof Error && e.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    return NextResponse.json({ error: "Couldn't delete user." }, { status: 500 });
  }
}
