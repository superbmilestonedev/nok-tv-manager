// src/lib/brand.ts — THE ONLY FILE TO CHANGE for a new brand
// All brand-specific values live here. No "Nok" strings anywhere else.

export const brand = {
  name: "Nok",
  tagline: "TV Manager",
  defaultEmoji: "\u{1F414}", // 🐔
  emojiOptions: [
    "\u{1F414}", // 🐔
    "\u{1F357}", // 🍗
    "\u{1F423}", // 🐣
    "\u{1F95A}", // 🥚
    "\u{1FAB9}", // 🪺
    "\u{1F413}", // 🐓
    "\u{1F356}", // 🍖
    "\u{1F425}", // 🐥
    // General options
    "\u{1F4F7}", // 📷
    "\u{1F3AC}", // 🎬
    "\u{2B50}",  // ⭐
    "\u{1F381}", // 🎁
    "\u{1F389}", // 🎉
    "\u{1F4BC}", // 💼
    "\u{1F3E0}", // 🏠
    "\u{2764}\u{FE0F}", // ❤️
  ],
  colors: {
    primary: "#e63946",
    primaryDark: "#c1121f",
    accent: "#f4a261",
    success: "#22c55e",
    warning: "#f59e0b",
  },
} as const;

export type Brand = typeof brand;
