import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function convertGoogleDriveUrl(url: string): string {
  if (!url) return url;
  
  // Google Drive Files (PDF, Images, etc.)
  if (url.includes('drive.google.com')) {
    const match = url.match(/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/open\?id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      const fileId = match[1];
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
  }

  // Google Docs
  if (url.includes('docs.google.com/document/d/')) {
    const match = url.match(/document\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      const docId = match[1];
      return `https://docs.google.com/document/d/${docId}/preview`;
    }
  }
  
  return url;
}
