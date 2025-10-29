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
  "#D1A980",
  "#98A1BC",
  "#FFDCDC",
  "#FFE4B5",
  "#687FE5",
  "#A3D2CA",
  "#FFE156",
  "#6A0572",
  "#AB83A1",
  "#FF6F91",
  "#FF9671",
  "#FFC75F",
  "#D65DB1",
  "#845EC2",
  "#008F7A",
  "#4B4453",
  "#2C73D2",
  "#16DB93",
  "#F9F871",
  "#FF9671",
  "#FFC75F",
  "#D65DB1",
  "#845EC2",
  "#008F7A",
  "#4B4453",
  "#2C73D2",
  "#16DB93",
  "#F9F871",
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

// --- NEW: helpers to produce glassmorphism styles from a base hex color ---
const hexToRgb = (hex: string) => {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return { r, g, b };
};

const rgba = (hex: string, alpha: number) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getReadableTextColor = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#0b1724" : "#f8fafc";
};

/**
 * getGlassForString - returns background, border and text colors for a glass tag
 */
export const getGlassForString = (value: string | null | undefined) => {
  const base = getColorForString(value);
  const background = rgba(base, 0.16); // soft translucent fill
  const border = rgba(base, 0.32); // visible translucent border
  const text = getReadableTextColor(base);
  return { base, background, border, text };
};