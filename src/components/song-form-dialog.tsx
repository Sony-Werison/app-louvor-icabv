
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Song, SongCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { useRef } from 'react';
import { useAutoPairing } from '@/hooks/use-auto-pairing';

const songCategories: SongCategory[] = ['Louvor', 'Hino', 'Infantil'];

const formSchema = z.object({
  title: z.string().min(2, { message: 'O título deve ter pelo menos 2 caracteres.' }),
  artist: z.string().optional(),
  key: z.string().optional(),
  category: z.enum(songCategories, { required_error: 'Selecione uma categoria.' }),
  bpm: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : parseInt(String(val), 10)),
    z.number().min(30).max(300).optional()
  ),
  lyrics: z.string().optional(),
  chords: z.string().optional(),
});

type SongFormData = Omit<Song, 'id'> & { id?: string };

interface SongFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: SongFormData) => void;
  song?: Song | null;
}

export function SongFormDialog({ isOpen, onOpenChange, onSave, song }: SongFormDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: song?.title || '',
      artist: song?.artist || '',
      key: song?.key || '',
      category: song?.category || 'Louvor',
      bpm: song?.bpm || undefined,
      lyrics: song?.lyrics || '',
      chords: song?.chords || '',
    },
  });

  const chordsTextareaRef = useRef<HTMLTextAreaElement>(null);
  const { handleKeyDown } = useAutoPairing(chordsTextareaRef);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onSave(values);
  };

  return (
     <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90dvh] flex flex-col p-0">
            <DialogHeader className="p-6 pb-0">
            <DialogTitle>{song ? 'Editar Música' : 'Nova Música'}</DialogTitle>
             <DialogDescription>
                Preencha os detalhes da música abaixo.
            </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <ScrollArea className="h-full">
                <div className="px-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                            <FormItem className="md:col-span-2">
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
                                <Textarea rows={8} {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                name="bpm"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>BPM (Batidas por Minuto)</FormLabel>
                                    <FormControl>
                                    <Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} />
                                    </FormControl>
                                    <FormMessage />
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
                                  rows={8} 
                                  {...field} 
                                  ref={chordsTextareaRef}
                                  onKeyDown={handleKeyDown}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        
                        <DialogFooter className="sticky bottom-0 -mx-6 px-6 py-4 bg-background border-t">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit">Salvar</Button>
                        </DialogFooter>
                    </form>
                  </Form>
                </div>
              </ScrollArea>
            </div>
        </DialogContent>
    </Dialog>
  );
}
