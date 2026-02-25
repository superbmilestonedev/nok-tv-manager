import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    return NextResponse.json({ isLoggedIn: false });
  }

  return NextResponse.json({
    isLoggedIn: true,
    user: {
      userId: session.userId,
      username: session.username,
      isAdmin: session.isAdmin,
    },
  });
}
