import { create } from 'zustand';
import { clienteSupabase } from '@/lib/supabase';
import { router } from 'expo-router';

interface EstadoAutenticacao {
  usuario: any | null;
  perfil: 'cliente' | 'advogado' | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
  atualizarSessao: (sessao: any) => Promise<void>;
}

export const usarAutenticacao = create<EstadoAutenticacao>((definir) => ({
  usuario: null,
  perfil: null,
  carregando: true,
  atualizarSessao: async (sessao) => {
    if (!sessao?.user) {
      definir({ usuario: null, perfil: null, carregando: false });
      return;
    }
    definir({ usuario: sessao.user, carregando: true });
    try {
      const { data: perfilData } = await clienteSupabase
        .from('perfis')
        .select('perfil')
        .eq('id', sessao.user.id)
        .single();
      definir({ 
        usuario: sessao.user, 
        perfil: perfilData?.perfil || 'cliente', 
        carregando: false 
      });
    } catch (erro) {
      console.error('Erro ao buscar perfil na atualização de sessão:', erro);
      definir({ 
        usuario: sessao.user, 
        perfil: 'cliente', 
        carregando: false 
      });
    }
  },
  entrar: async (email, senha) => {
    definir({ carregando: true });
    const { data, error } = await clienteSupabase.auth.signInWithPassword({ email, password: senha });
    if (error) {
      definir({ carregando: false });
      throw error;
    }
    if (data.user) {
      const { data: perfilData } = await clienteSupabase
        .from('perfis')
        .select('perfil')
        .eq('id', data.user.id)
        .single();
      definir({ 
        usuario: data.user, 
        perfil: perfilData?.perfil || 'cliente', 
        carregando: false 
      });
    }
  },
  sair: async () => {
    await clienteSupabase.auth.signOut();
    router.replace('/(autenticacao)/login');
  },
}));