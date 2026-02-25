import { z } from "zod/v4";

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required").max(50),
  pin: z.string().min(1, "PIN is required").max(8),
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
  rotation: z.number().refine((v) => [0, 90, 270].includes(v), "Must be 0, 90, or 270").optional(),
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
  pin: z.string().length(6, "PIN must be exactly 6 digits").regex(/^\d{6}$/, "PIN must be 6 numbers").optional(),
});

export const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.number(),
      sortOrder: z.number(),
    })
  ),
});
