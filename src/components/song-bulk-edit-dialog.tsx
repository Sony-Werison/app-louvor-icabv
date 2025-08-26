
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Song, SongCategory } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';

const songCategories: SongCategory[] = ['Louvor', 'Hino', 'Infantil'];

const formSchema = z.object({
  category: z.enum(songCategories).optional(),
  artist: z.string().optional(),
  key: z.string().optional(),
  isNew: z.enum(['true', 'false']).optional(),
  deleteChords: z.boolean().optional(),
}).refine(data => !!data.category || !!data.artist || !!data.key || !!data.isNew || data.deleteChords, {
  message: 'Pelo menos um campo deve ser preenchido ou marcado para salvar.',
  path: ['category'], 
});

export type BulkEditData = Partial<Pick<Song, 'category' | 'artist' | 'key' | 'chords' | 'isNew'>>;

interface SongBulkEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: BulkEditData) => void;
  songCount: number;
}

export function SongBulkEditDialog({
  isOpen,
  onOpenChange,
  onSave,
  songCount,
}: SongBulkEditDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        artist: '',
        key: '',
        deleteChords: false,
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const dataToSave: BulkEditData = {};
    if (values.category) dataToSave.category = values.category;
    if (values.artist) dataToSave.artist = values.artist;
    if (values.key) dataToSave.key = values.key;
    if (values.deleteChords) dataToSave.chords = '';
    if (values.isNew) dataToSave.isNew = values.isNew === 'true';
    onSave(dataToSave);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Músicas em Massa</DialogTitle>
          <DialogDescription>
            Altere as propriedades das {songCount} músicas selecionadas. Deixe um campo em branco para não alterar seu valor.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
             <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Manter categoria atual" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {songCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <Input placeholder="Manter artista atual" {...field} />
                  </FormControl>
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
                    <Input placeholder="Manter tom atual" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="isNew"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Música Nova</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Manter valor atual" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="true">Sim</SelectItem>
                        <SelectItem value="false">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deleteChords"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Excluir Cifras
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />


            <FormMessage>
                {form.formState.errors.category?.message}
            </FormMessage>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
