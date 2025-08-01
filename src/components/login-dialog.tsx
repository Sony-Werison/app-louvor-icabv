
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Role } from '@/types';
import { Shield, Users, Eye } from 'lucide-react';
import React from 'react';

const roleIcons: Record<Role, React.ElementType> = {
  admin: Shield,
  dirigente: Users,
  viewer: Eye,
};

const roleLabels: Record<Role, string> = {
  admin: 'Admin',
  dirigente: 'Dirigente',
  viewer: 'Visualização',
};

export function LoginDialog() {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role | ''>('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleLogin = () => {
    if (!selectedRole) {
      setError('Por favor, selecione um perfil.');
      return;
    }
    const success = login(selectedRole, password);
    if (!success) {
      setError('Senha incorreta. Tente novamente.');
      toast({
        title: 'Falha no Login',
        description: 'A senha fornecida está incorreta.',
        variant: 'destructive',
      });
    } else {
      setError('');
      toast({
        title: 'Login Bem-sucedido!',
        description: `Você entrou como ${roleLabels[selectedRole]}.`,
      });
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()} hideCloseButton>
        <DialogHeader>
          <DialogTitle>Bem-vindo!</DialogTitle>
          <DialogDescription>
            Selecione seu perfil de acesso e insira a senha para continuar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="role">Perfil de Acesso</Label>
            <Select onValueChange={(value) => setSelectedRole(value as Role)}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(roleLabels).map((key) => {
                  const roleKey = key as Role;
                  const RoleIcon = roleIcons[roleKey];
                  return (
                    <SelectItem key={roleKey} value={roleKey}>
                      <div className="flex items-center gap-2">
                        <RoleIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{roleLabels[roleKey]}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Digite a senha"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <Button onClick={handleLogin}>Entrar</Button>
      </DialogContent>
    </Dialog>
  );
}

// Extend DialogContent to optionally hide the close button
const DialogContentPrimitive = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { hideCloseButton?: boolean }
>(({ className, children, hideCloseButton, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay />
    <DialogPrimitive.Content
      ref={ref}
      className={className}
      {...props}
    >
      {children}
      {!hideCloseButton && (
        <DialogPrimitive.Close
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));

import * as DialogPrimitive from "@radix-ui/react-dialog"

DialogContentPrimitive.displayName = DialogPrimitive.Content.displayName;
(Dialog as any).Content = DialogContentPrimitive;
