import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Function to get a consistent color for a string value ---
const PALETTE = [
  "#BDD8E9", // Light Blue
  "#7BBDE8", // Sky Blue
  "#6EA2B3", // Cadet Blue
  "#4E8EA2", // Steel Blue
  "#49769F", // Darker Steel Blue
  "#0A4174", // Dark Blue
  "#001D39", // Very Dark Blue
];

// A simple hashing function to get a consistent index from a string
const stringToHash = (str: string): number => {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

export const getColorForString = (
  value: string | null | undefined
): string => {
  if (!value) {
    return "#E2E8F0"; // A neutral default color for empty values (slate-200)
  }
  const hash = stringToHash(value);
  const index = hash % PALETTE.length;
  return PALETTE[index];
};