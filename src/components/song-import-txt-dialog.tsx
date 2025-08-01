
'use client';

import { useState } from 'react';
import type { Song, SongCategory } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { UploadCloud, FileDiff, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

export type ParsedTxtSong = Omit<Song, 'id'>;
const songCategories: SongCategory[] = ['Louvor', 'Hino', 'Infantil'];

interface SongImportTxtDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { toCreate: ParsedTxtSong[], toUpdate: ParsedTxtSong[]}) => void;
  existingSongs: Song[];
}


export function SongImportTxtDialog({ isOpen, onOpenChange, onSave, existingSongs }: SongImportTxtDialogProps) {
    const [files, setFiles] = useState<FileList | null>(null);
    const [songsToCreate, setSongsToCreate] = useState<ParsedTxtSong[]>([]);
    const [songsToUpdate, setSongsToUpdate] = useState<ParsedTxtSong[]>([]);
    const [conflicts, setConflicts] = useState<string[]>([]);
    const [category, setCategory] = useState<SongCategory>('Louvor');
    const { toast } = useToast();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFiles(event.target.files);
            setSongsToCreate([]);
            setSongsToUpdate([]);
            setConflicts([]);
        }
    };

    const processFiles = () => {
        if (!files || files.length === 0) {
            toast({ title: 'Nenhum arquivo selecionado', variant: 'destructive' });
            return;
        }

        const toCreate: ParsedTxtSong[] = [];
        const toUpdate: ParsedTxtSong[] = [];
        const newConflicts: string[] = [];
        const processedTitles = new Set<string>();

        Array.from(files).forEach((file, fileIndex) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                if (!content) return;

                const titleMatch = content.match(/^(?:Título|Title):\s*(.*)/im);
                const artistMatch = content.match(/^(?:Artista|Artist):\s*(.*)/im);

                const title = titleMatch?.[1]?.trim() || file.name.replace(/\.txt$/i, '');
                const artist = artistMatch?.[1]?.trim() || 'Desconhecido';
                
                if (!title || processedTitles.has(title.toLowerCase())) return;

                const body = content
                    .replace(/^(?:Título|Title|Artista|Artist|Key|Category):.*$/gim, '')
                    .trim();

                const songData: ParsedTxtSong = {
                    title,
                    artist,
                    key: 'N/A', // O Tom pode ser editado depois
                    category: category, // Usa a categoria selecionada no diálogo
                    chords: body, // Salva o corpo completo com cifras
                    lyrics: body.replace(/\[[^\]]+\]/g, ''), // Salva uma versão sem cifras para a letra
                };

                const existingSong = existingSongs.find(
                    s => s.title.toLowerCase() === title.toLowerCase() && s.artist.toLowerCase() === artist.toLowerCase()
                );

                if (existingSong) {
                    toUpdate.push(songData);
                } else {
                    const alreadyInCreateList = toCreate.some(s => s.title.toLowerCase() === title.toLowerCase());
                    if (alreadyInCreateList) {
                        newConflicts.push(title);
                    } else {
                        toCreate.push(songData);
                    }
                }
                processedTitles.add(title.toLowerCase());
                

                if (fileIndex === files.length - 1) {
                    setSongsToCreate(toCreate);
                    setSongsToUpdate(toUpdate);
                    setConflicts(newConflicts);
                    
                    const total = toCreate.length + toUpdate.length;
                    if (total > 0) {
                        toast({ title: 'Arquivos processados!', description: `Pronto para importar/atualizar ${total} música(s).` });
                    } else {
                         toast({ title: 'Nenhuma música nova encontrada', description: `Nenhuma música para criar ou atualizar.`, variant: 'default' });
                    }
                }
            };
            reader.onerror = () => {
                toast({ title: `Erro ao ler o arquivo ${file.name}`, variant: 'destructive' });
            };
            reader.readAsText(file);
        });
    };

    const handleFinalSave = () => {
        onSave({ toCreate: songsToCreate, toUpdate: songsToUpdate });
        const total = songsToCreate.length + songsToUpdate.length;
        toast({ title: 'Importação bem-sucedida!', description: `${total} música(s) foram processada(s).` });
        onOpenChange(false);
    };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Músicas via TXT</DialogTitle>
          <DialogDescription>
              Selecione um ou mais arquivos .txt. O arquivo deve ter "Título:" e "Artista:". Se a música já existir, a letra será atualizada.
          </DialogDescription>
        </DialogHeader>
        
        {songsToCreate.length === 0 && songsToUpdate.length === 0 && conflicts.length === 0 ? (
          <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category-select">Categoria para Novas Músicas</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as SongCategory)}>
                    <SelectTrigger id="category-select">
                        <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                    {songCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="file-upload">Arquivos TXT</Label>
                <Input id="file-upload" type="file" accept=".txt" onChange={handleFileChange} multiple />
                {files && <p className="text-sm text-muted-foreground">{files.length} arquivo(s) selecionado(s).</p>}
              </div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
              {songsToCreate.length > 0 && (
                <Alert variant="default">
                    <AlertTitle className="flex items-center gap-2">
                        <UploadCloud className="h-5 w-5 text-green-500"/>
                        Músicas a Criar ({songsToCreate.length})
                    </AlertTitle>
                    <AlertDescription>
                        <ScrollArea className="max-h-20 border rounded-md p-2 mt-2">
                            <ul className="text-xs space-y-1">
                                {songsToCreate.map((song, i) => <li key={i} className="truncate">{song.title}</li>)}
                            </ul>
                        </ScrollArea>
                    </AlertDescription>
                </Alert>
              )}
               {songsToUpdate.length > 0 && (
                <Alert variant="default">
                    <AlertTitle className="flex items-center gap-2">
                        <FileDiff className="h-5 w-5 text-blue-500"/>
                        Músicas a Atualizar ({songsToUpdate.length})
                    </AlertTitle>
                    <AlertDescription>
                        <ScrollArea className="max-h-20 border rounded-md p-2 mt-2">
                            <ul className="text-xs space-y-1">
                                {songsToUpdate.map((song, i) => <li key={i} className="truncate">{song.title}</li>)}
                            </ul>
                        </ScrollArea>
                    </AlertDescription>
                </Alert>
              )}
               {conflicts.length > 0 && (
                <Alert variant="destructive">
                    <AlertTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5"/>
                        Conflitos Encontrados
                    </AlertTitle>
                    <AlertDescription>
                        <p className="mb-2">{conflicts.length} música(s) com títulos duplicados no lote de importação foram ignoradas:</p>
                        <ScrollArea className="max-h-20 border rounded-md p-2">
                            <ul className="text-xs space-y-1">
                                {conflicts.map((title, i) => <li key={i} className="truncate">{title}</li>)}
                            </ul>
                        </ScrollArea>
                    </AlertDescription>
                </Alert>
              )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {songsToCreate.length > 0 || songsToUpdate.length > 0 || conflicts.length > 0 ? (
              <Button onClick={handleFinalSave} disabled={songsToCreate.length === 0 && songsToUpdate.length === 0}>
                Salvar Alterações
              </Button>
          ) : (
              <Button onClick={processFiles} disabled={!files}>Processar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
