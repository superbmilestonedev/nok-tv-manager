import { z } from "zod/v4";

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required").max(50),
  pin: z.string().min(4, "PIN must be at least 4 digits").max(8),
});

export const createFolderSchema = z.object({
  name: z
    .string()
    .min(1, "Folder name is required")
    .max(100)
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Only letters, numbers, spaces, hyphens, and underscores"),
});

export const updateFolderSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9\s\-_]+$/)
    .optional(),
  emoji: z.string().max(10).optional(),
  pin: z.string().length(4, "Exit PIN must be 4 digits").regex(/^\d+$/).optional(),
  isExcluded: z.boolean().optional(),
});

export const createUserSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
  email: z.string().email().optional().or(z.literal("")),
  isAdmin: z.boolean().optional(),
});

export const updateUserSchema = z.object({
  username: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  email: z.string().email().optional().or(z.literal("")),
  resetPin: z.boolean().optional(),
});

export const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.number(),
      sortOrder: z.number(),
    })
  ),
});
