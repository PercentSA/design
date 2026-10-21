import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// The token radii and shadow (rounded-card, shadow-overlay) are not t-shirt sizes; tell tailwind-merge.
const twMerge = extendTailwindMerge({ extend: { theme: { radius: ["field", "card", "panel", "pill"], shadow: ["overlay"] } } });

/** Join class names; later Tailwind utilities win over earlier ones (`cn("px-2", "px-4")` → `px-4`). */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
