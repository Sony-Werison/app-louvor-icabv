
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Role } from '@/types';

interface LoginDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    roleToLogin: Role;
}

const roleDisplayNames: Record<Role, string> = {
    admin: 'Admin',
    abertura: 'Abertura',
    viewer: 'Visualização'
}


export function LoginDialog({ isOpen, onOpenChange, roleToLogin }: LoginDialogProps) {
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleLogin = () => {
    const success = login(roleToLogin, password);
    if (!success) {
      setError('Senha incorreta. Tente novamente.');
      toast({
        title: 'Falha no Login',
        description: 'A senha fornecida está incorreta.',
        variant: 'destructive',
      });
    } else {
      setError('');
      onOpenChange(false); // Close dialog on successful login
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
        setPassword('');
        setError('');
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Acesso Restrito</DialogTitle>
          <DialogDescription>
            Para acessar o perfil de {roleDisplayNames[roleToLogin]}, por favor, insira a senha.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Digite a senha"
                autoFocus
              />
            </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <Button onClick={handleLogin}>Entrar</Button>
      </DialogContent>
    </Dialog>
  );
}
