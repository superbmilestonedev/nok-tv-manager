import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  pinHash: text("pin_hash").notNull(),
  email: text("email").default(""),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const folders = sqliteTable("folders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  emoji: text("emoji").notNull().default("\u{1F414}"), // 🐔
  pinHash: text("pin_hash").notNull().default(""), // hashed 4-digit exit PIN
  pinPlain: text("pin_plain").notNull().default("0000"), // stored for admin display
  sortOrder: integer("sort_order").notNull().default(0),
  isExcluded: integer("is_excluded", { mode: "boolean" })
    .notNull()
    .default(false),
  version: integer("version").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const media = sqliteTable("media", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  folderId: integer("folder_id")
    .notNull()
    .references(() => folders.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  type: text("type", { enum: ["image", "video"] }).notNull(),
  size: integer("size").notNull().default(0),
  storagePath: text("storage_path").notNull(),
  thumbnailPath: text("thumbnail_path"),
  checksum: text("checksum"), // SHA-256
  sortOrder: integer("sort_order").notNull().default(0),
  width: integer("width"),
  height: integer("height"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const apiKeys = sqliteTable("api_keys", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull(),
  lastUsed: integer("last_used", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;
export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
