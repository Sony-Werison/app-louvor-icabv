
'use client';

import { useState } from 'react';
import type { Song } from '@/types';
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
import { CheckCircle, UploadCloud, FileDiff, AlertCircle } from 'lucide-react';

interface SongImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (songs: Song[]) => void;
  existingSongs: Song[];
}

type ParsedSong = Omit<Song, 'id' | 'key' | 'category'> & { category: string };

const requiredHeaders = ['title', 'timesPlayedQuarterly', 'timesPlayedTotal'];

export function SongImportDialog({ isOpen, onOpenChange, onSave, existingSongs }: SongImportDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [songsToUpdate, setSongsToUpdate] = useState<Song[]>([]);
    const [songsNotFound, setSongsNotFound] = useState<ParsedSong[]>([]);
    const [isProcessed, setIsProcessed] = useState(false);
    const { toast } = useToast();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setFile(event.target.files[0]);
            setIsProcessed(false);
            setSongsToUpdate([]);
            setSongsNotFound([]);
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
                const toUpdate: Song[] = [];
                const notFound: ParsedSong[] = [];

                data.forEach(parsedSong => {
                    const existingSong = existingSongs.find(
                        s => s.title.toLowerCase() === parsedSong.title.toLowerCase()
                    );
                    
                    if (existingSong) {
                        toUpdate.push({
                           ...existingSong,
                           timesPlayedQuarterly: Number(parsedSong.timesPlayedQuarterly) || existingSong.timesPlayedQuarterly || 0,
                           timesPlayedTotal: Number(parsedSong.timesPlayedTotal) || existingSong.timesPlayedTotal || 0,
                        });
                    } else {
                        notFound.push(parsedSong);
                    }
                });

                setSongsToUpdate(toUpdate);
                setSongsNotFound(notFound);
                setIsProcessed(true);
                toast({ title: "Arquivo processado!", description: `Pronto para atualizar ${toUpdate.length} música(s).`});

            },
            error: (error) => {
                toast({ title: 'Erro ao processar o arquivo', description: error.message, variant: 'destructive' });
            }
        });
    };
    
    const handleFinalSave = () => {
        onSave(songsToUpdate);
        toast({ title: 'Importação bem-sucedida!', description: `${songsToUpdate.length} músicas foram atualizadas.` });
        onOpenChange(false);
    };

    const resetState = () => {
        setFile(null);
        setIsProcessed(false);
        setSongsToUpdate([]);
        setSongsNotFound([]);
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
            <DialogTitle>Atualizar Frequência via CSV</DialogTitle>
            <DialogDescription>
                Selecione um arquivo CSV com as colunas: title, timesPlayedQuarterly, timesPlayedTotal. Apenas músicas existentes serão atualizadas.
            </DialogDescription>
          </DialogHeader>
          
          {!isProcessed ? (
            <div className="space-y-4 py-4">
                <Input type="file" accept=".csv" onChange={handleFileChange} />
                {file && <p className="text-sm text-muted-foreground">Arquivo selecionado: {file.name}</p>}
            </div>
          ) : (
            <div className="py-4 space-y-4">
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
                {songsNotFound.length > 0 && (
                     <Alert variant="destructive">
                        <AlertTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5"/>
                            Músicas não encontradas ({songsNotFound.length})
                        </AlertTitle>
                        <AlertDescription>
                             <ScrollArea className="max-h-24 border rounded-md p-2 mt-2">
                                <ul className="text-xs space-y-1">
                                    {songsNotFound.map((song, i) => <li key={i} className="truncate">{song.title}</li>)}
                                </ul>
                            </ScrollArea>
                        </AlertDescription>
                    </Alert>
                )}
                 {songsToUpdate.length === 0 && songsNotFound.length === 0 && (
                     <Alert>
                        <AlertTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5"/>
                            Nenhuma Alteração
                        </AlertTitle>
                        <AlertDescription>
                            Não foram encontradas músicas correspondentes no arquivo para atualizar.
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
                <Button onClick={handleFinalSave} disabled={songsToUpdate.length === 0}>
                    Confirmar Atualização
                </Button>
            ) : (
                <Button onClick={processFile} disabled={!file}>Processar</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}
