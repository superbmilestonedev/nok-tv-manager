import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { hash } from "bcryptjs";
import { users } from "./schema";

async function seed() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    console.error("TURSO_DATABASE_URL is required");
    process.exit(1);
  }

  const client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const db = drizzle(client);

  // Create admin user with PIN "000000"
  const pinHash = await hash("000000", 10);

  await db
    .insert(users)
    .values({
      username: "admin",
      pinHash,
      email: "",
      isAdmin: true,
    })
    .onConflictDoNothing();

  console.log("Seeded admin user (username: admin, PIN: 000000)");

  client.close();
}

seed().catch(console.error);
