
'use server';

import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';

export async function uploadAvatar(formData: FormData): Promise<{ url?: string; error?: string }> {
  const file = formData.get('file') as File;

  if (!file || file.size === 0) {
    return { error: 'Nenhum arquivo selecionado.' };
  }

  const filename = `${nanoid()}.${file.type.split('/')[1]}`;

  try {
    const blob = await put(filename, file, {
      access: 'public',
      contentType: file.type,
    });
    return { url: blob.url };
  } catch (error: any) {
    return { error: `Falha no upload: ${error.message}` };
  }
}
