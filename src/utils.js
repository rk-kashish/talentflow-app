import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// This is the standard Shadcn/UI utility function.
// The App.jsx file I provided has this built-in,
// but you'll use this file when you refactor.
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
