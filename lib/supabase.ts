import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const clienteSupabase = createClient(
  process.env.EXPO_PUBLIC_URL_SUPABASE!,
  process.env.EXPO_PUBLIC_CHAVE_ANON_SUPABASE!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);