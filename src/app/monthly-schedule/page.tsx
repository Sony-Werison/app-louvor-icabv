
'use client';
import { useState, useMemo, useRef, useCallback } from 'react';
import { useSchedule } from '@/context/schedule-context';
import { MonthlyScheduleView } from '@/components/monthly-schedule-view';
import type { MonthlySchedule } from '@/types';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight, Download, Loader2, Eye } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ptBR } from 'date-fns/locale';
import { addMonths, format, startOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import * as htmlToImage from 'html-to-image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export default function MonthlySchedulePage() {
    const { monthlySchedules, addSchedule, members, scheduleColumns } = useSchedule();
    const [currentMonth, setCurrentMonth] = useState<Date | null>(new Date());
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const { toast } = useToast();
    const { can } = useAuth();
    
    const [isExporting, setIsExporting] = useState(false);
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [selectedMonthsForExport, setSelectedMonthsForExport] = useState<string[]>([]);
    
    const exportRef = useRef<HTMLDivElement>(null);

    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        monthlySchedules.forEach(schedule => {
            months.add(format(schedule.date, 'yyyy-MM'));
        });
        return Array.from(months).sort();
    }, [monthlySchedules]);
    
    const exportSchedules = useMemo(() => {
        return monthlySchedules.filter(schedule => {
            const monthYear = format(schedule.date, 'yyyy-MM');
            return selectedMonthsForExport.includes(monthYear);
        });
    }, [monthlySchedules, selectedMonthsForExport]);
    
    const groupedExportSchedules = useMemo(() => 
        exportSchedules.reduce((acc, schedule) => {
            const monthYear = format(schedule.date, 'yyyy-MM');
            if (!acc[monthYear]) {
                acc[monthYear] = [];
            }
            acc[monthYear].push(schedule);
            return acc;
        }, {} as Record<string, MonthlySchedule[]>)
    , [exportSchedules]);


    const handleExport = useCallback(async () => {
        if (selectedMonthsForExport.length === 0) {
            toast({ title: 'Nenhum mês selecionado', description: 'Selecione pelo menos um mês para exportar.', variant: 'destructive'});
            return;
        }

        setIsExporting(true);
        setIsExportDialogOpen(false);
        toast({ title: 'Preparando exportação...', description: 'Aguarde enquanto a imagem da escala é gerada.' });

        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (!exportRef.current) {
                 throw new Error("Elemento de exportação não encontrado.");
            }
            
            const dataUrl = await htmlToImage.toPng(exportRef.current, { 
                quality: 1,
                pixelRatio: 1.5,
                backgroundColor: '#121212',
                skipFonts: true,
            });
            const link = document.createElement('a');
            const monthNames = selectedMonthsForExport.map(m => format(new Date(`${m}-02`), 'MMMM', { locale: ptBR })).join('_');
            link.download = `escala_louvor_${monthNames}.png`;
            link.href = dataUrl;
            link.click();
            toast({ title: 'Exportação Concluída!', description: 'A imagem da escala foi baixada.' });
        } catch (error) {
            console.error('oops, something went wrong!', error);
            toast({ title: 'Erro na Exportação', description: 'Não foi possível gerar a imagem da escala.', variant: 'destructive'});
        } finally {
            setIsExporting(false);
            // Don't reset selection so user can view it
            // setSelectedMonthsForExport([]);
        }
    }, [toast, selectedMonthsForExport]);
    
    const handleView = () => {
         if (selectedMonthsForExport.length === 0) {
            toast({ title: 'Nenhum mês selecionado', description: 'Selecione pelo menos um mês para visualizar.', variant: 'destructive'});
            return;
        }
        setIsExportDialogOpen(false);
        setIsViewDialogOpen(true);
    }

    if (!currentMonth) {
        return null;
    }

    const navigateMonths = (amount: number) => {
        setCurrentMonth(prevMonth => prevMonth ? addMonths(prevMonth, amount) : null);
    };

    const handleAddDate = (date: Date | undefined) => {
        if (date) {
            const dateExists = monthlySchedules.some(
                schedule => startOfDay(schedule.date).getTime() === startOfDay(date).getTime()
            );

            if (dateExists) {
                toast({
                    title: 'Data Duplicada',
                    description: 'Esta data já existe na escala.',
                    variant: 'destructive',
                });
                return;
            }

            addSchedule(date);
            setIsCalendarOpen(false);
            setCurrentMonth(date);
        }
    };
    
    const filteredSchedules = monthlySchedules.filter(
        schedule => schedule.date.getMonth() === currentMonth.getMonth() &&
                    schedule.date.getFullYear() === currentMonth.getFullYear()
    );
    
    const ExportableView = ({ isForDialog = false }: { isForDialog?: boolean}) => (
        <div className="space-y-8">
            {Object.entries(groupedExportSchedules).sort(([a], [b]) => a.localeCompare(b)).map(([month, schedules]) => (
                <div key={month}>
                     <h2 className="text-3xl font-bold text-center mb-6 capitalize text-foreground">
                        Escala - {format(new Date(`${month}-02`), 'MMMM yyyy', { locale: ptBR })}
                    </h2>
                    <MonthlyScheduleView 
                        schedules={schedules}
                        members={members}
                        columns={scheduleColumns}
                        isExporting={true}
                        isForDialog={isForDialog}
                    />
                </div>
            ))}
        </div>
    );


    return (
        <>
        <div className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 sm:mb-8 gap-4">
                <div className="flex items-center gap-2 sm:gap-4 justify-between">
                    <Button variant="outline" size="icon" onClick={() => navigateMonths(-1)}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-xl sm:text-2xl font-headline font-bold text-center w-48 sm:w-64 capitalize">
                        {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                    </h2>
                    <Button variant="outline" size="icon" onClick={() => navigateMonths(1)}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="w-full" onClick={() => setIsExportDialogOpen(true)}>
                        <Download className="mr-2 h-4 w-4" />
                        Escala Completa
                    </Button>
                    {can('edit:schedule') && (
                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                            <PopoverTrigger asChild>
                                <Button size="sm" className="sm:size-auto w-full sm:w-auto">
                                    <Plus className="mr-2" />
                                    Adicionar Data
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    onSelect={handleAddDate}
                                    locale={ptBR}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </div>
            <MonthlyScheduleView 
                schedules={filteredSchedules}
                members={members}
                columns={scheduleColumns}
            />
        </div>

        {/* Export Dialog */}
        <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Visualizar ou Exportar Escala Completa</DialogTitle>
                    <DialogDescription>
                        Selecione os meses que você deseja incluir na ação.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label className="font-semibold">Meses Disponíveis</Label>
                        <div className="space-y-2 mt-2">
                            {availableMonths.map(month => (
                                <div key={month} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`month-${month}`}
                                        checked={selectedMonthsForExport.includes(month)}
                                        onCheckedChange={(checked) => {
                                            setSelectedMonthsForExport(prev => 
                                                checked ? [...prev, month] : prev.filter(m => m !== month)
                                            )
                                        }}
                                    />
                                    <Label htmlFor={`month-${month}`} className="capitalize font-normal">
                                        {format(new Date(`${month}-02`), 'MMMM yyyy', { locale: ptBR })}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleView} disabled={selectedMonthsForExport.length === 0}>
                        <Eye className="mr-2 h-4 w-4"/>
                        Visualizar
                    </Button>
                    <Button onClick={handleExport} disabled={selectedMonthsForExport.length === 0 || isExporting}>
                        {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4"/>}
                        {isExporting ? 'Exportando...' : 'Exportar PNG'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        {/* View Dialog */}
         <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-6xl">
              <DialogHeader>
                  <DialogTitle>Visualização da Escala</DialogTitle>
                  <DialogDescription>
                    Visualização da escala completa para os meses selecionados.
                  </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh] p-1">
                  <div className="p-4 bg-background text-foreground">
                     <ExportableView isForDialog={true} />
                  </div>
              </ScrollArea>
          </DialogContent>
      </Dialog>


        {/* Hidden element for export */}
        {(isExporting || isViewDialogOpen) && (
             <div className={cn("fixed top-0 left-0 -z-50 opacity-0 dark w-[1200px]", isViewDialogOpen && "hidden")}>
                <div ref={exportRef} className="p-8 bg-background">
                    <ExportableView />
                </div>
            </div>
        )}

        </>
    );
}

    

    
