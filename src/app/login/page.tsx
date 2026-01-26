
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AppLogo } from '@/components/app-logo';
import { cn } from '@/lib/utils';


const formSchema = z.object({
  password: z.string().min(1, { message: "A senha é obrigatória." }),
});

type FormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
    const { login, user } = useAuth();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            password: '',
        }
    });
    
    useEffect(() => {
        if(user) {
            router.push('/');
        }
    }, [user, router]);

    const onSubmit = async (values: FormValues) => {
        setIsSubmitting(true);
        const { success } = await login(values.password);
        if(success) {
            router.push('/');
        } else {
            form.setError('root', { message: 'Senha inválida.' });
        }
        setIsSubmitting(false);
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <AppLogo />
                    </div>
                    <CardTitle>Acesso ao Painel</CardTitle>
                    <CardDescription>Use sua senha para entrar</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                             <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Senha</FormLabel>
                                    <FormControl>
                                        <Input
                                          type="password"
                                          placeholder="********"
                                          {...field}
                                          className={cn(form.formState.errors.root && "border-destructive focus-visible:ring-destructive")}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            {form.formState.errors.root && (
                                <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                variant={form.formState.errors.root ? 'destructive' : 'default'}
                                disabled={isSubmitting}
                            >
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Entrar
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}
