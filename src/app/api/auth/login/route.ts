import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid username or PIN format." },
        { status: 400 }
      );
    }

    const { username, pin } = parsed.data;

    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (!user) {
      return NextResponse.json(
        { error: "That username and PIN didn't match. Try again." },
        { status: 401 }
      );
    }

    const pinValid = await compare(pin, user.pinHash);
    if (!pinValid) {
      return NextResponse.json(
        { error: "That username and PIN didn't match. Try again." },
        { status: 401 }
      );
    }

    // Set session
    const session = await getSession();
    session.userId = user.id;
    session.username = user.username;
    session.isAdmin = user.isAdmin;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({
      success: true,
      user: {
        username: user.username,
        isAdmin: user.isAdmin,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Something didn't work on our end. Try again." },
      { status: 500 }
    );
  }
}
