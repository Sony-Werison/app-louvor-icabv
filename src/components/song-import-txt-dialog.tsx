
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
import { UploadCloud, FileDiff, AlertCircle, ChevronsUpDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

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
    const [category, setCategory] = useState<SongCategory>('Louvor');
    const [isProcessed, setIsProcessed] = useState(false);
    
    // State to hold the parsed songs
    const [potentialCreates, setPotentialCreates] = useState<ParsedTxtSong[]>([]);
    const [potentialUpdates, setPotentialUpdates] = useState<ParsedTxtSong[]>([]);
    const [conflicts, setConflicts] = useState<string[]>([]);
    
    // State for user selections
    const [selectedToCreate, setSelectedToCreate] = useState<string[]>([]);
    const [selectedToUpdate, setSelectedToUpdate] = useState<string[]>([]);

    const { toast } = useToast();

    const resetState = () => {
        setFiles(null);
        setCategory('Louvor');
        setIsProcessed(false);
        setPotentialCreates([]);
        setPotentialUpdates([]);
        setConflicts([]);
        setSelectedToCreate([]);
        setSelectedToUpdate([]);
    };
    
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            resetState();
        }
        onOpenChange(open);
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFiles(event.target.files);
            if (isProcessed) {
              resetState();
              setFiles(event.target.files);
            }
        }
    };

    const processFiles = () => {
        if (!files || files.length === 0) {
            toast({ title: 'Nenhum arquivo selecionado', variant: 'destructive' });
            return;
        }

        const creates: ParsedTxtSong[] = [];
        const updates: ParsedTxtSong[] = [];
        const newConflicts: string[] = [];
        const processedTitles = new Set<string>();
        let filesProcessed = 0;

        Array.from(files).forEach((file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                if (!content) return;

                const titleMatch = content.match(/^(?:Título|Title):\s*(.*)/im);
                const artistMatch = content.match(/^(?:Artista|Artist):\s*(.*)/im);

                const title = titleMatch?.[1]?.trim() || file.name.replace(/\.txt$/i, '');
                const artist = artistMatch?.[1]?.trim() || 'Desconhecido';
                
                if (!title || processedTitles.has(title.toLowerCase())) {
                    if (title) newConflicts.push(title);
                    return;
                }

                const body = content
                    .replace(/^(?:Título|Title|Artista|Artist|Key|Category):.*$/gim, '')
                    .trim();

                const songData: ParsedTxtSong = {
                    title,
                    artist,
                    key: 'N/A', 
                    category: category,
                    chords: '',
                    lyrics: body,
                };
                
                processedTitles.add(title.toLowerCase());

                const existingSong = existingSongs.find(
                    s => s.title.toLowerCase() === title.toLowerCase() && s.artist.toLowerCase() === artist.toLowerCase()
                );

                if (existingSong) {
                    updates.push(songData);
                } else {
                    creates.push(songData);
                }

                filesProcessed++;
                if (filesProcessed === files.length) {
                    setPotentialCreates(creates);
                    setPotentialUpdates(updates);
                    setConflicts(newConflicts);
                    setIsProcessed(true);

                    // Pre-select all by default
                    setSelectedToCreate(creates.map(s => s.title));
                    setSelectedToUpdate(updates.map(s => s.title));

                    const total = creates.length + updates.length;
                    if (total > 0) {
                        toast({ title: 'Arquivos processados!', description: `Revise e selecione as músicas para importar.` });
                    } else {
                         toast({ title: 'Nenhuma música nova encontrada', description: `Nenhuma música para criar ou atualizar.`, variant: 'default' });
                    }
                }
            };
            reader.onerror = () => {
                toast({ title: `Erro ao ler o arquivo ${file.name}`, variant: 'destructive' });
            };
            reader.readAsText(file, "UTF-8");
        });
    };

    const handleFinalSave = () => {
        const toCreate = potentialCreates.filter(s => selectedToCreate.includes(s.title));
        const toUpdate = potentialUpdates.filter(s => selectedToUpdate.includes(s.title));
        onSave({ toCreate, toUpdate });
        const total = toCreate.length + toUpdate.length;
        toast({ title: 'Importação bem-sucedida!', description: `${total} música(s) foram processada(s).` });
        onOpenChange(false);
    };

    const toggleSelection = (list: 'create' | 'update', title: string) => {
        const setter = list === 'create' ? setSelectedToCreate : setSelectedToUpdate;
        setter(prev => prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]);
    }
    
    const toggleSelectAll = (list: 'create' | 'update') => {
        const source = list === 'create' ? potentialCreates : potentialUpdates;
        const selected = list === 'create' ? selectedToCreate : selectedToUpdate;
        const setter = list === 'create' ? setSelectedToCreate : setSelectedToUpdate;

        if (selected.length === source.length) {
            setter([]); // Deselect all
        } else {
            setter(source.map(s => s.title)); // Select all
        }
    }

    const renderSongList = (songs: ParsedTxtSong[], type: 'create' | 'update') => {
        const selected = type === 'create' ? selectedToCreate : selectedToUpdate;
        const allSelected = songs.length > 0 && selected.length === songs.length;
        const isIndeterminate = selected.length > 0 && !allSelected;

        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                     <Checkbox 
                        id={`select-all-${type}`}
                        checked={allSelected || isIndeterminate}
                        onCheckedChange={() => toggleSelectAll(type)}
                        data-state={isIndeterminate ? 'indeterminate' : (allSelected ? 'checked' : 'unchecked')}
                    />
                    <Label htmlFor={`select-all-${type}`} className="text-sm font-medium">
                        Selecionar Todos ({selected.length}/{songs.length})
                    </Label>
                </div>
                <ScrollArea className="h-40 border rounded-md">
                    <div className="p-2 space-y-1">
                    {songs.map((song) => (
                        <div key={song.title} className="flex items-center gap-3 p-2 rounded hover:bg-muted/30">
                            <Checkbox 
                                id={`${type}-${song.title}`}
                                checked={selected.includes(song.title)}
                                onCheckedChange={() => toggleSelection(type, song.title)}
                            />
                            <Label htmlFor={`${type}-${song.title}`} className="flex flex-col cursor-pointer">
                                <span className="font-medium">{song.title}</span>
                                <span className="text-xs text-muted-foreground">{song.artist}</span>
                            </Label>
                        </div>
                    ))}
                    </div>
                </ScrollArea>
            </div>
        )
    }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Importar Músicas via TXT</DialogTitle>
           {!isProcessed ? (
            <DialogDescription>
                Selecione um ou mais arquivos .txt. O título e artista serão lidos do conteúdo. Se a música já existir, a letra será atualizada.
            </DialogDescription>
           ) : (
            <DialogDescription>
                Revise as listas abaixo e selecione quais músicas você deseja criar ou atualizar.
            </DialogDescription>
           )}
        </DialogHeader>
        
        {!isProcessed ? (
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
          <div className="py-2 space-y-4">
              <Accordion type="multiple" defaultValue={['create', 'update', 'conflicts']} className="w-full">
                {potentialCreates.length > 0 && (
                    <AccordionItem value="create">
                        <AccordionTrigger>
                            <div className="flex items-center gap-2">
                                <UploadCloud className="h-5 w-5 text-green-500"/>
                                <span>Novas Músicas ({potentialCreates.length})</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            {renderSongList(potentialCreates, 'create')}
                        </AccordionContent>
                    </AccordionItem>
                )}
                {potentialUpdates.length > 0 && (
                     <AccordionItem value="update">
                        <AccordionTrigger>
                            <div className="flex items-center gap-2">
                                <FileDiff className="h-5 w-5 text-blue-500"/>
                                <span>Atualizar Letras ({potentialUpdates.length})</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            {renderSongList(potentialUpdates, 'update')}
                        </AccordionContent>
                    </AccordionItem>
                )}
                {conflicts.length > 0 && (
                     <AccordionItem value="conflicts">
                        <AccordionTrigger>
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-destructive"/>
                                <span>Conflitos ({conflicts.length})</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                           <AlertDescription>
                                <p className="mb-2 text-sm">As seguintes músicas foram ignoradas por terem títulos duplicados no lote de importação:</p>
                                <ScrollArea className="max-h-20 border rounded-md p-2">
                                    <ul className="text-xs space-y-1">
                                        {conflicts.map((title, i) => <li key={i} className="truncate">{title}</li>)}
                                    </ul>
                                </ScrollArea>
                            </AlertDescription>
                        </AccordionContent>
                    </AccordionItem>
                )}
              </Accordion>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleOpenChange.bind(null, false)}>
            Cancelar
          </Button>
          {!isProcessed ? (
              <Button onClick={processFiles} disabled={!files}>Processar</Button>
          ) : (
             <Button onClick={handleFinalSave} disabled={selectedToCreate.length === 0 && selectedToUpdate.length === 0}>
                Importar Selecionadas ({selectedToCreate.length + selectedToUpdate.length})
              </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
