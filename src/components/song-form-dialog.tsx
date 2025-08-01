
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

const songCategories: SongCategory[] = ['Louvor', 'Hino', 'Infantil'];

const formSchema = z.object({
  title: z.string().min(2, { message: 'O título deve ter pelo menos 2 caracteres.' }),
  artist: z.string().min(2, { message: 'O nome do artista é obrigatório.' }),
  key: z.string().min(1, { message: 'O tom é obrigatório.' }),
  category: z.enum(songCategories, { required_error: 'Selecione uma categoria.' }),
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
      lyrics: song?.lyrics || '',
      chords: song?.chords || '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onSave(values);
  };

  return (
     <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>{song ? 'Editar Música' : 'Nova Música'}</DialogTitle>
             <DialogDescription>
                Preencha os detalhes da música abaixo.
            </DialogDescription>
            </DialogHeader>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
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

                <FormField
                control={form.control}
                name="chords"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Cifras</FormLabel>
                    <FormControl>
                        <Textarea className="font-code" rows={8} {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button type="submit">Salvar</Button>
                </DialogFooter>
            </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}

