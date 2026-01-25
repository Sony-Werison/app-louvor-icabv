'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
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
  const router = useRouter();
  const { toast } = useToast();

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isImportAlertOpen, setIsImportAlertOpen] = useState(false);
  const [backupFileToImport, setBackupFileToImport] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        // In firebase world, this would be a call to a cloud function
        // for now, we just show a toast
        toast({title: "Função não implementada", description: "A alteração de senha de admin requer um backend seguro."});
        changed = true;
    }
    if (values.currentAberturaPassword && values.newAberturaPassword) {
        toast({title: "Função não implementada", description: "A alteração de senha de abertura requer um backend seguro."});
        changed = true;
    }
    if(!changed) {
        passwordForm.setError('root', { message: 'Nenhuma alteração foi feita.'})
    }
  };
  
  const handleExport = async () => {
    setIsExporting(true);
    toast({title: "Função não implementada", description: "Exportação de dados ainda não está disponível com Firebase."});
    setIsExporting(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    toast({title: "Função não implementada", description: "Importação de dados ainda não está disponível com Firebase."});
  };

  const handleImportConfirm = async () => {
     toast({title: "Função não implementada", description: "Importação de dados ainda não está disponível com Firebase."});
  };
  
  if (!can('manage:settings')) {
    return null;
  }

  return (
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
                                <Input type="password" placeholder="Digite a senha atual de admin" {...field} disabled/>
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
                            <Input type="password" placeholder="Digite a nova senha de admin" {...field} disabled/>
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
                            <Input type="password" placeholder="Digite a senha atual de abertura" {...field} disabled/>
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
                            <Input type="password" placeholder="Digite a nova senha de abertura" {...field} disabled/>
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
                    <Button type="submit" disabled={true}>
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
             Esta funcionalidade está temporariamente desativada após a migração para o Firebase.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={handleExport} disabled={true} className="w-full">
                {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Exportar Backup Completo
              </Button>
              <Button onClick={() => fileInputRef.current?.click()} disabled={true} variant="outline" className="w-full">
                {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Importar Backup
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".json"
                onChange={handleFileSelect}
                disabled={true}
              />
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
