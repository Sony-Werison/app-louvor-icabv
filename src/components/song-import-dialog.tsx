
'use client';

import { useState } from 'react';
import type { Song, SongCategory } from '@/types';
import Papa from 'papaparse';
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
import { CheckCircle, UploadCloud, FileDiff } from 'lucide-react';

interface SongImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (songs: Song[]) => void;
  existingSongs: Song[];
}

type ParsedSong = Omit<Song, 'id' | 'key' | 'category'> & { category: string };

const requiredHeaders = ['title', 'artist', 'category', 'timesPlayedQuarterly', 'timesPlayedTotal'];

export function SongImportDialog({ isOpen, onOpenChange, onSave, existingSongs }: SongImportDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [songsToCreate, setSongsToCreate] = useState<Song[]>([]);
    const [songsToUpdate, setSongsToUpdate] = useState<Song[]>([]);
    const [isProcessed, setIsProcessed] = useState(false);
    const { toast } = useToast();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setFile(event.target.files[0]);
            setIsProcessed(false);
            setSongsToCreate([]);
            setSongsToUpdate([]);
        }
    };

    const processFile = () => {
        if (!file) {
            toast({ title: 'Nenhum arquivo selecionado', variant: 'destructive' });
            return;
        }

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (result) => {
                const headers = result.meta.fields || [];
                const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

                if (missingHeaders.length > 0) {
                    toast({
                        title: 'Cabeçalhos ausentes no CSV',
                        description: `O arquivo precisa ter as seguintes colunas: ${missingHeaders.join(', ')}`,
                        variant: 'destructive'
                    });
                    return;
                }
                
                const data = result.data as ParsedSong[];
                const existingTitles = new Set(existingSongs.map(s => s.title.toLowerCase()));
                const toCreate: Song[] = [];
                const toUpdate: Song[] = [];

                data.forEach(parsedSong => {
                    const songData: Song = {
                        ...parsedSong,
                        id: '', // será gerado no contexto
                        key: parsedSong.key || 'N/A', 
                        category: parsedSong.category as SongCategory,
                        timesPlayedQuarterly: Number(parsedSong.timesPlayedQuarterly) || 0,
                        timesPlayedTotal: Number(parsedSong.timesPlayedTotal) || 0,
                    };
                    
                    if (existingTitles.has(songData.title.toLowerCase())) {
                        toUpdate.push(songData);
                    } else {
                        toCreate.push(songData);
                        existingTitles.add(songData.title.toLowerCase()); // Evitar duplicatas no mesmo lote
                    }
                });

                setSongsToCreate(toCreate);
                setSongsToUpdate(toUpdate);
                setIsProcessed(true);
                toast({ title: "Arquivo processado!", description: `Pronto para importar ${toCreate.length + toUpdate.length} músicas.`});

            },
            error: (error) => {
                toast({ title: 'Erro ao processar o arquivo', description: error.message, variant: 'destructive' });
            }
        });
    };
    
    const handleFinalSave = () => {
        const allSongs = [...songsToCreate, ...songsToUpdate];
        onSave(allSongs);
        toast({ title: 'Importação bem-sucedida!', description: `${allSongs.length} músicas foram importadas/atualizadas.` });
        onOpenChange(false);
    };

    const resetState = () => {
        setFile(null);
        setIsProcessed(false);
        setSongsToCreate([]);
        setSongsToUpdate([]);
    }

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            resetState();
        }
        onOpenChange(open);
    }

  return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Músicas via CSV</DialogTitle>
            <DialogDescription>
                Selecione um arquivo CSV com as colunas: title, artist, category, timesPlayedQuarterly, timesPlayedTotal.
            </DialogDescription>
          </DialogHeader>
          
          {!isProcessed ? (
            <div className="space-y-4 py-4">
                <Input type="file" accept=".csv" onChange={handleFileChange} />
                {file && <p className="text-sm text-muted-foreground">Arquivo selecionado: {file.name}</p>}
            </div>
          ) : (
            <div className="py-4 space-y-4">
                {songsToCreate.length > 0 && (
                    <Alert>
                        <AlertTitle className="flex items-center gap-2">
                            <UploadCloud className="h-5 w-5 text-green-500"/>
                            Músicas a Criar ({songsToCreate.length})
                        </AlertTitle>
                        <AlertDescription>
                            <ScrollArea className="max-h-24 border rounded-md p-2 mt-2">
                                <ul className="text-xs space-y-1">
                                    {songsToCreate.map((song, i) => <li key={i} className="truncate">{song.title}</li>)}
                                </ul>
                            </ScrollArea>
                        </AlertDescription>
                    </Alert>
                )}
                {songsToUpdate.length > 0 && (
                     <Alert>
                        <AlertTitle className="flex items-center gap-2">
                            <FileDiff className="h-5 w-5 text-blue-500"/>
                            Músicas a Atualizar ({songsToUpdate.length})
                        </AlertTitle>
                        <AlertDescription>
                             <ScrollArea className="max-h-24 border rounded-md p-2 mt-2">
                                <ul className="text-xs space-y-1">
                                    {songsToUpdate.map((song, i) => <li key={i} className="truncate">{song.title}</li>)}
                                </ul>
                            </ScrollArea>
                        </AlertDescription>
                    </Alert>
                )}
                 {songsToCreate.length === 0 && songsToUpdate.length === 0 && (
                     <Alert variant="destructive">
                        <AlertTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5"/>
                            Nenhuma Alteração
                        </AlertTitle>
                        <AlertDescription>
                            Não foram encontradas músicas novas para criar ou dados de frequência para atualizar.
                        </AlertDescription>
                    </Alert>
                 )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            {isProcessed ? (
                <Button onClick={handleFinalSave} disabled={songsToCreate.length === 0 && songsToUpdate.length === 0}>
                    Confirmar Importação
                </Button>
            ) : (
                <Button onClick={processFile} disabled={!file}>Processar</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}
