import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function convertGoogleDriveUrl(url: string): string {
  if (!url || !url.includes('drive.google.com')) {
    return url;
  }
  
  // Regex to find the file ID in various Google Drive URL formats
  const match = url.match(/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/open\?id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    const fileId = match[1];
    // Return preview URL which is more compatible with iframes
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  
  return url;
}
