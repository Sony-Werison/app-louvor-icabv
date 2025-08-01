
'use client';

import { useState } from 'react';
import type { Song } from '@/types';
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
    const [files, setFiles] = useState<FileList | null>(null);
    const [songsToImport, setSongsToImport] = useState<ParsedSong[]>([]);
    const [conflicts, setConflicts] = useState<string[]>([]);
    const { toast } = useToast();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFiles(event.target.files);
            setSongsToImport([]);
            setConflicts([]);
        }
    };

    const processFiles = () => {
        if (!files || files.length === 0) {
            toast({ title: 'Nenhum arquivo selecionado', variant: 'destructive' });
            return;
        }

        const parsed: ParsedSong[] = [];
        const localConflicts: string[] = [];
        const existingTitles = new Set(existingSongs.map(s => s.title.toLowerCase()));

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                if (!content) return;

                const titleMatch = content.match(/^(?:Título|Title):\s*(.*)/im);
                const artistMatch = content.match(/^(?:Artista|Artist):\s*(.*)/im);

                const title = titleMatch?.[1]?.trim() || file.name.replace(/\.txt$/i, '');
                const artist = artistMatch?.[1]?.trim() || 'Desconhecido';
                
                if (!title) return;

                // Remove header lines to get chords/lyrics
                const body = content
                    .replace(/^(?:Título|Title|Artista|Artist|Key|Category):.*$/gim, '')
                    .trim();

                if (existingTitles.has(title.toLowerCase())) {
                    localConflicts.push(title);
                } else {
                    parsed.push({
                        title,
                        artist,
                        key: 'N/A', // Key is not in this new format
                        category: 'Louvor', // Default category
                        chords: body,
                        lyrics: body.replace(/\[[^\]]+\]/g, ''), // Basic lyric extraction
                    });
                     existingTitles.add(title.toLowerCase()); // Avoid duplicate imports from the same batch
                }

                // Update state after the last file is read
                if (file === files[files.length - 1]) {
                    if (parsed.length === 0 && localConflicts.length > 0) {
                        toast({ title: 'Nenhuma música nova para importar', description: `Todas as ${localConflicts.length} músicas encontradas já existem.`, variant: 'default' });
                    } else if (parsed.length > 0) {
                        toast({ title: 'Arquivos processados!', description: `Pronto para importar ${parsed.length} música(s).` });
                    }
                    setSongsToImport(parsed);
                    setConflicts(localConflicts);
                }
            };
            reader.onerror = () => {
                toast({ title: `Erro ao ler o arquivo ${file.name}`, variant: 'destructive' });
            };
            reader.readAsText(file);
        });
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
          <DialogTitle>Importar Músicas via TXT</DialogTitle>
          <DialogDescription>
              Selecione um ou mais arquivos .txt. Cada arquivo deve conter "Título:" e "Artista:" nas primeiras linhas.
          </DialogDescription>
        </DialogHeader>
        
        {songsToImport.length === 0 && conflicts.length === 0 ? (
          <div className="space-y-4 py-4">
              <Input type="file" accept=".txt" onChange={handleFileChange} multiple />
              {files && <p className="text-sm text-muted-foreground">{files.length} arquivo(s) selecionado(s).</p>}
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
                        <p className="mb-2">{songsToImport.length} música(s) serão adicionadas:</p>
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
                        <p className="mb-2">{conflicts.length} música(s) já existem e serão ignoradas:</p>
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
          {songsToImport.length > 0 || conflicts.length > 0 ? (
              <Button onClick={handleFinalSave} disabled={songsToImport.length === 0}>
                Salvar {songsToImport.length > 0 ? songsToImport.length : ''} Música(s)
              </Button>
          ) : (
              <Button onClick={processFiles} disabled={!files}>Processar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
