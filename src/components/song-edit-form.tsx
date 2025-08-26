
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Song, SongCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAutoPairing } from '@/hooks/use-auto-pairing';
import { useRef } from 'react';
import { Checkbox } from './ui/checkbox';

const songCategories: SongCategory[] = ['Louvor', 'Hino', 'Infantil'];

const formSchema = z.object({
  title: z.string().min(2, { message: 'O título deve ter pelo menos 2 caracteres.' }),
  artist: z.string().optional(),
  key: z.string().optional(),
  category: z.enum(songCategories, { required_error: 'Selecione uma categoria.' }),
  lyrics: z.string().optional(),
  chords: z.string().optional(),
  isNew: z.boolean().optional(),
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
      category: song.category || 'Louvor',
      lyrics: song.lyrics || '',
      chords: song.chords || '',
      isNew: song.isNew || false,
    },
  });

  const chordsTextareaRef = useRef<HTMLTextAreaElement>(null);
  const { handleKeyDown } = useAutoPairing(chordsTextareaRef);

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
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="lg:col-span-2">
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {songCategories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
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
            
            <div className="grid md:grid-cols-2 gap-6">
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
                <FormField
                    control={form.control}
                    name="isNew"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-start gap-4 rounded-lg border p-3 mt-4 h-14">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                             <div className="space-y-0.5">
                                <FormLabel>Música Nova</FormLabel>
                            </div>
                        </FormItem>
                    )}
                />
            </div>

            <FormField
              control={form.control}
              name="chords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cifras</FormLabel>
                  <FormControl>
                    <Textarea 
                      className="font-code" 
                      rows={15} 
                      {...field} 
                      ref={chordsTextareaRef} 
                      onKeyDown={handleKeyDown} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex flex-col sm:flex-row justify-end gap-2">
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
