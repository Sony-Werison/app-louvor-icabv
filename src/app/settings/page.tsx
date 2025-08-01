
'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as FormDesc } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  currentAdminPassword: z.string().optional(),
  newAdminPassword: z.string().optional(),
  currentDirigentePassword: z.string().optional(),
  newDirigentePassword: z.string().optional(),
}).refine(data => {
    if (data.currentAdminPassword && !data.newAdminPassword) return false;
    if (!data.currentAdminPassword && data.newAdminPassword) return false;
    return true;
}, {
    message: "Preencha a senha atual e a nova senha para alterar.",
    path: ['newAdminPassword']
}).refine(data => {
    if (data.currentDirigentePassword && !data.newDirigentePassword) return false;
    if (!data.currentDirigentePassword && data.newDirigentePassword) return false;
    return true;
}, {
    message: "Preencha a senha atual e a nova senha para alterar.",
    path: ['newDirigentePassword']
});


export default function SettingsPage() {
  const { role, can, updatePassword } = useAuth();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentAdminPassword: '',
      newAdminPassword: '',
      currentDirigentePassword: '',
      newDirigentePassword: '',
    },
  });

  useEffect(() => {
    if (!can('manage:settings')) {
      router.push('/');
    }
  }, [role, can, router]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    let changed = false;
    if (values.currentAdminPassword && values.newAdminPassword) {
        const adminSuccess = await updatePassword('admin', values.currentAdminPassword, values.newAdminPassword);
        if(adminSuccess) {
            form.resetField('currentAdminPassword');
            form.resetField('newAdminPassword');
            changed = true;
        }
    }
    if (values.currentDirigentePassword && values.newDirigentePassword) {
        const dirigenteSuccess = await updatePassword('dirigente', values.currentDirigentePassword, values.newDirigentePassword);
        if(dirigenteSuccess) {
            form.resetField('currentDirigentePassword');
            form.resetField('newDirigentePassword');
            changed = true;
        }
    }
    if(!changed) {
        form.setError('root', { message: 'Nenhuma alteração foi feita. Verifique as senhas atuais.'})
    }
  };
  
  if (!can('manage:settings')) {
    return null;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-headline font-bold mb-4">Configurações</h1>
        <Card>
          <CardHeader>
            <CardTitle>Gerenciamento de Senhas</CardTitle>
            <CardDescription>
              Altere as senhas para os perfis de Admin e Dirigente. Preencha os campos apenas do perfil que deseja alterar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-4">
                    <h3 className="font-semibold">Perfil Administrador</h3>
                     <FormField
                        control={form.control}
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
                    control={form.control}
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
                     <h3 className="font-semibold">Perfil Dirigente</h3>
                    <FormField
                    control={form.control}
                    name="currentDirigentePassword"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Senha Atual</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="Digite a senha atual de dirigente" {...field} />
                        </FormControl>
                         <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="newDirigentePassword"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nova Senha de Dirigente</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="Digite a nova senha de dirigente" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>

                {form.formState.errors.root && (
                    <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
                )}

                <div className="flex justify-end">
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        Salvar Alterações
                    </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
