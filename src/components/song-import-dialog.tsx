
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { CheckCircle, XCircle } from 'lucide-react';

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
    const [parsedSongs, setParsedSongs] = useState<ParsedSong[]>([]);
    const [conflicts, setConflicts] = useState<ParsedSong[]>([]);
    const [songsToImport, setSongsToImport] = useState<Song[]>([]);
    const [isConflictAlertOpen, setIsConflictAlertOpen] = useState(false);
    const { toast } = useToast();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setFile(event.target.files[0]);
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
                setParsedSongs(data);

                const existingTitles = new Set(existingSongs.map(s => s.title.toLowerCase()));
                const newConflicts = data.filter(s => existingTitles.has(s.title.toLowerCase()));

                if (newConflicts.length > 0) {
                    setConflicts(newConflicts);
                    setIsConflictAlertOpen(true);
                } else {
                    prepareAndSave(data, []);
                }
            },
            error: (error) => {
                toast({ title: 'Erro ao processar o arquivo', description: error.message, variant: 'destructive' });
            }
        });
    };
    
    const prepareAndSave = (allSongs: ParsedSong[], songsToOverwrite: ParsedSong[]) => {
        const overwriteTitles = new Set(songsToOverwrite.map(s => s.title.toLowerCase()));
        
        const finalSongs = allSongs
            .filter(song => {
                const isConflict = conflicts.some(c => c.title.toLowerCase() === song.title.toLowerCase());
                return !isConflict || overwriteTitles.has(song.title.toLowerCase());
            })
            .map(s => ({
                ...s,
                key: 'N/A', // Key is not in CSV
                category: s.category as SongCategory, // Assuming category is valid
                timesPlayedQuarterly: Number(s.timesPlayedQuarterly) || 0,
                timesPlayedTotal: Number(s.timesPlayedTotal) || 0,
            }));
        
        const nonConflictSongs = allSongs
             .filter(song => !conflicts.some(c => c.title.toLowerCase() === song.title.toLowerCase()));
        
        setSongsToImport([...nonConflictSongs, ...songsToOverwrite].map(s => ({
                ...s,
                id: '', // Will be generated in context
                key: 'N/A', 
                category: s.category as SongCategory,
                timesPlayedQuarterly: Number(s.timesPlayedQuarterly) || 0,
                timesPlayedTotal: Number(s.timesPlayedTotal) || 0,
        })));
    };

    const handleConfirmOverwrite = () => {
        prepareAndSave(parsedSongs, conflicts);
        setIsConflictAlertOpen(false);
    };

    const handleDeclineOverwrite = () => {
        prepareAndSave(parsedSongs, []);
        setIsConflictAlertOpen(false);
    };

    const handleFinalSave = () => {
        onSave(songsToImport);
        toast({ title: 'Importação bem-sucedida!', description: `${songsToImport.length} músicas foram importadas/atualizadas.` });
        onOpenChange(false);
    };


  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Músicas via CSV</DialogTitle>
            <DialogDescription>
                Selecione um arquivo CSV com as colunas: title, artist, category, timesPlayedQuarterly, timesPlayedTotal.
            </DialogDescription>
          </DialogHeader>
          
          {songsToImport.length === 0 ? (
            <div className="space-y-4 py-4">
                <Input type="file" accept=".csv" onChange={handleFileChange} />
                {file && <p className="text-sm text-muted-foreground">Arquivo selecionado: {file.name}</p>}
            </div>
          ) : (
            <div className="py-4">
                <Alert>
                    <AlertTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500"/>
                        Pronto para Importar
                    </AlertTitle>
                    <AlertDescription>
                        <p className="mb-2">{songsToImport.length} músicas serão importadas ou atualizadas.</p>
                        <ScrollArea className="max-h-60 border rounded-md p-2">
                            <ul className="text-xs space-y-1">
                                {songsToImport.map((song, i) => <li key={i} className="truncate">{song.title}</li>)}
                            </ul>
                        </ScrollArea>
                    </AlertDescription>
                </Alert>
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
      
      {isConflictAlertOpen && (
          <AlertDialog open={isConflictAlertOpen} onOpenChange={setIsConflictAlertOpen}>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>Conflitos Encontrados</AlertDialogTitle>
                      <AlertDialogDescription>
                          Encontramos {conflicts.length} música(s) no CSV que já existem na sua biblioteca. Deseja sobrescrever os dados de frequência (trimestral e total)?
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                   <ScrollArea className="max-h-40 border rounded-md p-2">
                        <ul className="text-sm space-y-1">
                            {conflicts.map((song, i) => <li key={i}>{song.title}</li>)}
                        </ul>
                    </ScrollArea>
                  <AlertDialogFooter>
                      <AlertDialogCancel onClick={handleDeclineOverwrite}>Não, manter existentes</AlertDialogCancel>
                      <AlertDialogAction onClick={handleConfirmOverwrite}>Sim, sobrescrever</AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
      )}
    </>
  );
}
