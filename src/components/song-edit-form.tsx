'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Song } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const formSchema = z.object({
  title: z.string().min(2, { message: 'O título deve ter pelo menos 2 caracteres.' }),
  artist: z.string().min(2, { message: 'O nome do artista é obrigatório.' }),
  key: z.string().min(1, { message: 'O tom é obrigatório.' }),
  lyrics: z.string().optional(),
  chords: z.string().optional(),
});

interface SongEditFormProps {
  song: Song;
  onSave: (data: Partial<Song>) => void;
  onCancel: () => void;
}

export function SongEditForm({ song, onSave, onCancel }: SongEditFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: song.title || '',
      artist: song.artist || '',
      key: song.key || '',
      lyrics: song.lyrics || '',
      chords: song.chords || '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onSave(values);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline font-bold text-3xl">Editar Música</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="artist"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artista</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tom</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="lyrics"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Letra</FormLabel>
                  <FormControl>
                    <Textarea rows={15} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="chords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cifras</FormLabel>
                  <FormControl>
                    <Textarea className="font-code" rows={15} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Alterações</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
