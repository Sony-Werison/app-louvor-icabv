
'use client';

import { KeyboardEvent, RefObject } from 'react';

const pairs: Record<string, string> = {
  '[': ']',
  '(': ')',
  '"': '"',
  "'": "'",
};

export function useAutoPairing(ref: RefObject<HTMLTextAreaElement>) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const { key } = e;
    const target = e.target as HTMLTextAreaElement;
    const { selectionStart, selectionEnd } = target;

    if (pairs[key]) {
      e.preventDefault();
      
      const start = target.value.substring(0, selectionStart);
      const end = target.value.substring(selectionEnd);
      
      const newText = `${start}${key}${pairs[key]}${end}`;
      target.value = newText;
      
      // Manually update the field value for react-hook-form
      const event = new Event('input', { bubbles: true });
      target.dispatchEvent(event);

      // Move cursor inside the pair
      target.selectionStart = selectionStart + 1;
      target.selectionEnd = selectionStart + 1;
    }
  };

  return { handleKeyDown };
}
