'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
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


const passwordFormSchema = z.object({
  currentAdminPassword: z.string().optional(),
  newAdminPassword: z.string().optional(),
  currentAberturaPassword: z.string().optional(),
  newAberturaPassword: z.string().optional(),
}).refine(data => {
    if (data.currentAdminPassword && !data.newAdminPassword) return false;
    if (!data.currentAdminPassword && data.newAdminPassword) return false;
    return true;
}, {
    message: "Preencha a senha atual e a nova senha para alterar.",
    path: ['newAdminPassword']
}).refine(data => {
    if (data.currentAberturaPassword && !data.newAberturaPassword) return false;
    if (!data.currentAberturaPassword && data.newAberturaPassword) return false;
    return true;
}, {
    message: "Preencha a senha atual e a nova senha para alterar.",
    path: ['newAberturaPassword']
});


export default function SettingsPage() {
  const { can, login } = useAuth();
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

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentAdminPassword: '',
      newAdminPassword: '',
      currentAberturaPassword: '',
      newAberturaPassword: '',
    },
  });

  useEffect(() => {
    if (!can('manage:settings')) {
      router.push('/');
    }
  }, [can, router]);
  

  const onPasswordSubmit = (values: z.infer<typeof passwordFormSchema>) => {
    let changed = false;
    if (values.currentAdminPassword && values.newAdminPassword) {
        if (login('admin', values.currentAdminPassword)) {
            // In a real app, this would be a secure backend call
            // For now, we just show a toast and can't actually change it
             toast({title: "Função não implementada", description: "A alteração de senha de admin requer um backend seguro."});
             changed = true;
        }
    }
    if (values.currentAberturaPassword && values.newAberturaPassword) {
        if(login('abertura', values.currentAberturaPassword)) {
            toast({title: "Função não implementada", description: "A alteração de senha de abertura requer um backend seguro."});
            changed = true;
        }
    }
    if(!changed) {
        passwordForm.setError('root', { message: 'Nenhuma alteração foi feita.'})
    }
  };
  
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
      toast({ title: 'Erro ao exportar', description: 'Não foi possível gerar o arquivo de backup.', variant: 'destructive'});
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

        toast({ title: 'Importação Concluída!', description: 'Os dados foram restaurados com sucesso. A página será recarregada.'});
        
        setTimeout(() => {
            window.location.reload();
        }, 2000);

    } catch (error) {
        console.error(error);
        toast({ title: 'Erro na Importação', description: 'O arquivo de backup é inválido ou está corrompido.', variant: 'destructive'});
        setIsImporting(false);
    } finally {
        setBackupFileToImport(null);
    }
  };

  const handleClearConfirm = async () => {
    setIsClearAlertOpen(false);
    setIsClearing(true);
    try {
        await clearAllData();
        toast({ title: 'Dados Apagados!', description: 'Todos os dados foram removidos com sucesso. A página será recarregada.'});
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    } catch (error) {
        console.error(error);
        toast({ title: 'Erro ao Limpar Dados', description: 'Não foi possível apagar os dados.', variant: 'destructive'});
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
            <CardTitle>Gerenciamento de Senhas</CardTitle>
            <CardDescription>
             Altere as senhas para os perfis de Admin e Abertura. Esta função está desativada na versão Firebase.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-8">
                <div className="space-y-4">
                    <h3 className="font-semibold">Perfil Administrador</h3>
                     <FormField
                        control={passwordForm.control}
                        name="currentAdminPassword"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Senha Atual</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="Digite a senha atual de admin" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                    control={passwordForm.control}
                    name="newAdminPassword"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nova Senha de Administrador</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="Digite a nova senha de admin" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>

                <Separator />
                
                <div className="space-y-4">
                     <h3 className="font-semibold">Perfil Abertura</h3>
                    <FormField
                    control={passwordForm.control}
                    name="currentAberturaPassword"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Senha Atual</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="Digite a senha atual de abertura" {...field} />
                        </FormControl>
                         <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={passwordForm.control}
                    name="newAberturaPassword"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nova Senha de Abertura</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="Digite a nova senha de abertura" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>

                {passwordForm.formState.errors.root && (
                    <p className="text-sm font-medium text-destructive">{passwordForm.formState.errors.root.message}</p>
                )}

                <div className="flex justify-end">
                    <Button type="submit">
                        Salvar Alterações de Senha
                    </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
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
