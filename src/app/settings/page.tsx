
'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { Role } from '@/types';

const formSchema = z.object({
  adminPassword: z.string().min(4, 'A senha deve ter pelo menos 4 caracteres.'),
  dirigentePassword: z.string().min(4, 'A senha deve ter pelo menos 4 caracteres.'),
});

export default function SettingsPage() {
  const { role, can, updatePassword } = useAuth();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      adminPassword: '',
      dirigentePassword: '',
    },
  });

  useEffect(() => {
    if (!can('manage:settings')) {
      router.push('/');
    }
  }, [role, can, router]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const adminSuccess = await updatePassword('admin', values.adminPassword);
    if(adminSuccess) {
        form.resetField('adminPassword');
    }
    const dirigenteSuccess = await updatePassword('dirigente', values.dirigentePassword);
     if(dirigenteSuccess) {
        form.resetField('dirigentePassword');
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
              Altere as senhas para os perfis de Admin e Dirigente. Use senhas fortes para maior segurança.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="adminPassword"
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
                <FormField
                  control={form.control}
                  name="dirigentePassword"
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
