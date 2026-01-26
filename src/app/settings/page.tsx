
'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
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
import { Loader2 } from 'lucide-react';
import type { BackupData } from '@/types';
import { useSchedule } from '@/context/schedule-context';


export default function SettingsPage() {
  const { can } = useAuth();
  const { exportData, importData, clearAllData } = useSchedule();
  const router = useRouter();
  const { toast } = useToast();

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isImportAlertOpen, setIsImportAlertOpen] = useState(false);
  const [backupFileToImport, setBackupFileToImport] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isClearing, setIsClearing] = useState(false);
  const [isClearAlertOpen, setIsClearAlertOpen] = useState(false);

  useEffect(() => {
    if (!can('manage:settings')) {
      router.push('/');
    }
  }, [can, router]);
  
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportData();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = `backup_louvor_icabv_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      toast({ title: 'Backup exportado com sucesso!' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro ao Exportar', description: 'Não foi possível gerar o backup.', variant: 'destructive'});
    }
    setIsExporting(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBackupFileToImport(file);
      setIsImportAlertOpen(true);
    }
  };

  const handleImportConfirm = async () => {
    if (!backupFileToImport) return;
    setIsImporting(true);
    setIsImportAlertOpen(false);

    try {
        const fileContent = await backupFileToImport.text();
        const backupData = JSON.parse(fileContent) as BackupData;
        await importData(backupData);
    } catch (error) {
        console.error(error);
        toast({ title: 'Erro na Importação', description: 'O arquivo de backup é inválido ou está corrompido.', variant: 'destructive'});
    } finally {
        setIsImporting(false);
        setBackupFileToImport(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClearConfirm = async () => {
    setIsClearAlertOpen(false);
    setIsClearing(true);
    try {
        await clearAllData();
    } catch (error) {
        console.error(error);
        toast({ title: 'Erro ao Limpar Dados', description: 'Ocorreu um erro.', variant: 'destructive'});
    } finally {
        setIsClearing(false);
    }
  };
  
  if (!can('manage:settings')) {
    return null;
  }

  return (
    <>
    <div className="p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-2xl font-headline font-bold">Configurações</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Backup e Restauração</CardTitle>
            <CardDescription>
              Exporte todos os dados da aplicação para um arquivo JSON ou importe um backup para restaurar os dados. 
              Atenção: importar um backup substituirá todos os dados existentes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={handleExport} disabled={isExporting} className="w-full">
                {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Exportar Backup Completo
              </Button>
              <Button onClick={() => fileInputRef.current?.click()} disabled={isImporting} variant="outline" className="w-full">
                {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Importar Backup
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".json"
                onChange={handleFileSelect}
                onClick={(e) => { (e.target as HTMLInputElement).value = ''; }} // Allow re-selecting same file
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle>Zona de Perigo</CardTitle>
            <CardDescription>
              Ações irreversíveis. Use com cuidado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsClearAlertOpen(true)} disabled={isClearing} variant="destructive" className="w-full">
                {isClearing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Limpar Todos os Dados
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
      <AlertDialog open={isImportAlertOpen} onOpenChange={setIsImportAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso substituirá permanentemente
              todos os dados do aplicativo (membros, músicas e escalas) pelos dados
              do arquivo de backup.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBackupFileToImport(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleImportConfirm}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={isClearAlertOpen} onOpenChange={setIsClearAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação é irreversível e excluirá permanentemente
              TODOS os dados da aplicação, incluindo membros, músicas e escalas.
              Recomendamos fazer um backup antes de continuar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClearConfirm}
              className={buttonVariants({ variant: "destructive" })}
            >
                Sim, apagar tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
