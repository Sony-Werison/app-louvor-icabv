
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Role, PasswordSet } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';

interface AuthContextType {
  user: { email: string } | null;
  role: Role;
  isLoading: boolean;
  passwords: PasswordSet;
  can: (permission: Permission) => boolean;
  login: (password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updatePasswords: (newPasswords: PasswordSet) => Promise<void>;
  shareMessage: string;
  reminderMessage: string;
  updateReminderMessage: (newMessage: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type Permission = 'edit:schedule' | 'edit:members' | 'edit:songs' | 'manage:playlists' | 'manage:settings';

const rolePermissions: Record<Role, Permission[]> = {
  admin: ['edit:schedule', 'edit:members', 'edit:songs', 'manage:playlists', 'manage:settings'],
  abertura: ['manage:playlists'],
  viewer: [],
};

const defaultPasswords: PasswordSet = {
  admin: 'admin123',
  abertura: 'abertura123',
};

const defaultReminderMessage = `Olá, [NOME]! Essa é uma mensagem automática para lembrar que você está escalado para a abertura de [PERIODO].

Para montar o repertório, siga estes passos:
1. Acesse o app: https://app-louvor-icabv.vercel.app/schedule
2. No canto superior, clique em "Visualização" e troque para o perfil "Abertura" (senha: [SENHA]).
3. No menu aberturas, procure a sua escala da semana e clique em "Gerenciar".
4. Após salvar sua lista, você pode clicar no botão "Compartilhar" para enviar suas músicas.

Não se esqueça de mandar o quanto antes ao grupo de louvor. Obrigado!`;


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [role, setRole] = useState<Role>('viewer');
  const [isLoading, setIsLoading] = useState(true);
  const [passwords, setPasswords] = useState<PasswordSet>(defaultPasswords);
  const [reminderMessage, setReminderMessage] = useState(defaultReminderMessage);
  const { toast } = useToast();

  const shareMessage = "Paz do Senhor, segue o repertório para [PERIODO] ([DATA]). Deus abençoe!";

  const fetchSettings = useCallback(async () => {
    if (!supabase) {
      // Fallback to localStorage if Supabase is not configured
      const storedPasswords = localStorage.getItem('appPasswords');
      const storedReminderMessage = localStorage.getItem('reminderMessage');
      if (storedPasswords) setPasswords(JSON.parse(storedPasswords));
      if (storedReminderMessage) setReminderMessage(storedReminderMessage);
      return;
    }

    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 'settings')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "exact-single-row-not-found"
      toast({ title: 'Erro ao carregar configurações', description: 'Não foi possível buscar as senhas e mensagens do banco de dados.', variant: 'destructive' });
      console.error('Error fetching settings:', error);
      return;
    }

    if (data) {
      setPasswords(data.passwords);
      setReminderMessage(data.reminder_message);
    } else {
      // No settings found, so let's insert the default ones.
      const { error: insertError } = await supabase
        .from('app_settings')
        .insert({
          id: 'settings',
          passwords: defaultPasswords,
          reminder_message: defaultReminderMessage,
        });

      if (insertError) {
        toast({ title: 'Erro ao inicializar configurações', description: `Verifique se a tabela 'app_settings' existe e se as permissões (RLS) estão corretas. Erro: ${insertError.message}`, variant: 'destructive' });
        console.error('Error inserting default settings:', insertError);
      }
    }
  }, [toast]);

  useEffect(() => {
    setIsLoading(true);
    fetchSettings();

    try {
        const storedRole = localStorage.getItem('userRole') as Role;
        const storedUser = localStorage.getItem('user');
        
        if (storedRole && storedUser && ['admin', 'abertura', 'viewer'].includes(storedRole)) {
            setRole(storedRole);
            setUser(JSON.parse(storedUser));
        }
    } catch (e) {
        // Could be running on server or localStorage is disabled
    } finally {
        setIsLoading(false);
    }
  }, [fetchSettings]);


  const login = async (password: string):Promise<{ success: boolean; error?: string }> => {
    let loggedInRole: Role | null = null;
    if (password === passwords.admin) {
        loggedInRole = 'admin';
    } else if (password === passwords.abertura) {
        loggedInRole = 'abertura';
    }

    if (loggedInRole) {
        const userObject = { email: loggedInRole };
        setUser(userObject);
        setRole(loggedInRole);
        localStorage.setItem('userRole', loggedInRole);
        localStorage.setItem('user', JSON.stringify(userObject));
        toast({ title: 'Login bem-sucedido!'});
        return { success: true };
    }
    
    return { success: false, error: 'Senha inválida' };
  };
  
  const logout = async () => {
    setUser(null);
    setRole('viewer');
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
  }

  const updatePasswords = async (newPasswords: PasswordSet) => {
    if (!supabase) {
      setPasswords(newPasswords);
      localStorage.setItem('appPasswords', JSON.stringify(newPasswords));
      toast({ title: 'Senhas salvas localmente (sem DB)!' });
      return;
    }

    const { data, error } = await supabase
      .from('app_settings')
      .update({ passwords: newPasswords })
      .eq('id', 'settings')
      .select()
      .single();
      
    if (error || !data) {
        toast({ title: 'Erro ao atualizar senhas', description: 'Verifique as permissões (RLS) da tabela `app_settings`.', variant: 'destructive' });
        console.error('Error updating passwords:', error);
    } else {
        toast({ title: 'Senhas atualizadas com sucesso!' });
        setPasswords(data.passwords);
    }
  };
  
  const updateReminderMessage = async (newMessage: string) => {
    if (!supabase) {
      setReminderMessage(newMessage);
      localStorage.setItem('reminderMessage', newMessage);
      toast({ title: 'Mensagem salva localmente (sem DB)!' });
      return;
    }

    const { data, error } = await supabase
      .from('app_settings')
      .update({ reminder_message: newMessage })
      .eq('id', 'settings')
      .select()
      .single();

    if (error || !data) {
        toast({ title: 'Erro ao atualizar mensagem', description: 'Verifique as permissões (RLS) da tabela `app_settings`.', variant: 'destructive' });
        console.error('Error updating reminder message:', error);
    } else {
        toast({ title: 'Mensagem de lembrete atualizada!' });
        setReminderMessage(data.reminder_message);
    }
  };

  const can = useCallback((permission: Permission) => {
    return rolePermissions[role].includes(permission);
  }, [role]);


  const value: AuthContextType = {
      user,
      role,
      isLoading,
      passwords,
      can,
      login,
      logout,
      updatePasswords,
      shareMessage,
      reminderMessage,
      updateReminderMessage,
  };

  return (
    <AuthContext.Provider value={value}>
      {isLoading ? (
          <div className="flex items-center justify-center h-screen bg-background">
              <p className="text-muted-foreground">Carregando...</p>
          </div>
      ) : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
