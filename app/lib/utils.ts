import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
