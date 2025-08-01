
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
import { CheckCircle, AlertCircle } from 'lucide-react';

interface SongImportTxtDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (songs: Omit<Song, 'id'>[]) => void;
  existingSongs: Song[];
}

type ParsedSong = Omit<Song, 'id'>;

export function SongImportTxtDialog({ isOpen, onOpenChange, onSave, existingSongs }: SongImportTxtDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [songsToImport, setSongsToImport] = useState<ParsedSong[]>([]);
    const [conflicts, setConflicts] = useState<string[]>([]);
    const { toast } = useToast();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setFile(event.target.files[0]);
            setSongsToImport([]);
            setConflicts([]);
        }
    };

    const processFile = () => {
        if (!file) {
            toast({ title: 'Nenhum arquivo selecionado', variant: 'destructive' });
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            if (!content) return;

            const parsed: ParsedSong[] = [];
            const localConflicts: string[] = [];
            const existingTitles = new Set(existingSongs.map(s => s.title.toLowerCase()));

            const titleMatch = content.match(/Title:\s*(.*)/);
            const artistMatch = content.match(/Artist:\s*(.*)/);
            const keyMatch = content.match(/Key:\s*(.*)/);
            const categoryMatch = content.match(/Category:\s*(.*)/);
            
            const title = titleMatch?.[1]?.trim() || file.name.replace('.txt', '');
            const artist = artistMatch?.[1]?.trim() || 'Desconhecido';
            const key = keyMatch?.[1]?.trim() || 'N/A';
            const category = (categoryMatch?.[1]?.trim() as SongCategory) || 'Louvor';
            
            // Remove header lines to get chords/lyrics
            const body = content.replace(/^(Title|Artist|Key|Category):.*$/gm, '').trim();

            if (existingTitles.has(title.toLowerCase())) {
                localConflicts.push(title);
            } else {
                parsed.push({
                    title,
                    artist,
                    key,
                    category,
                    chords: body,
                    lyrics: body.replace(/\[[^\]]+\]/g, ''), // Basic lyric extraction
                });
            }
            
            if (parsed.length === 0 && localConflicts.length > 0) {
                 toast({ title: 'Nenhuma música nova para importar', description: `A música "${localConflicts[0]}" já existe.`, variant: 'default' });
            } else if (parsed.length > 0) {
                 toast({ title: 'Arquivo processado!', description: `Pronto para importar ${parsed.length} música(s).` });
            }

            setSongsToImport(parsed);
            setConflicts(localConflicts);
        };
        reader.onerror = () => {
            toast({ title: 'Erro ao ler o arquivo', variant: 'destructive' });
        };
        reader.readAsText(file);
    };

    const handleFinalSave = () => {
        onSave(songsToImport);
        toast({ title: 'Importação bem-sucedida!', description: `${songsToImport.length} música(s) foram adicionada(s).` });
        onOpenChange(false);
    };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Música via TXT</DialogTitle>
          <DialogDescription>
              Selecione um arquivo .txt. O arquivo deve ter um formato específico para ser importado corretamente.
          </DialogDescription>
        </DialogHeader>
        
        {songsToImport.length === 0 && conflicts.length === 0 ? (
          <div className="space-y-4 py-4">
              <Input type="file" accept=".txt" onChange={handleFileChange} />
              {file && <p className="text-sm text-muted-foreground">Arquivo selecionado: {file.name}</p>}
          </div>
        ) : (
          <div className="py-4 space-y-4">
              {songsToImport.length > 0 && (
                <Alert variant="default">
                    <AlertTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500"/>
                        Pronto para Importar
                    </AlertTitle>
                    <AlertDescription>
                        <p className="mb-2">A seguinte música será adicionada:</p>
                        <ScrollArea className="max-h-20 border rounded-md p-2">
                            <ul className="text-xs space-y-1">
                                {songsToImport.map((song, i) => <li key={i} className="truncate">{song.title}</li>)}
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
                        <p className="mb-2">As seguintes músicas já existem e serão ignoradas:</p>
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
          {songsToImport.length > 0 ? (
              <Button onClick={handleFinalSave}>Salvar</Button>
          ) : (
              <Button onClick={processFile} disabled={!file}>Processar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
