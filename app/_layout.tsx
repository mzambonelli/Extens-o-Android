import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { usarAutenticacao } from '@/store/autenticacao';
import { clienteSupabase } from '@/lib/supabase';

export default function RootLayout() {
  const { atualizarSessao } = usarAutenticacao();

  useEffect(() => {
    
    clienteSupabase.auth.getSession().then(({ data: { session } }) => {
      atualizarSessao(session);
    });

    
    const { data: { subscription } } = clienteSupabase.auth.onAuthStateChange(async (event, session) => {
      atualizarSessao(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}