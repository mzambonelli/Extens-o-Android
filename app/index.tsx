import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { usarAutenticacao } from '@/store/autenticacao';

export default function RouteIndex() {
  const { usuario, perfil, carregando } = usarAutenticacao();

  useEffect(() => {
       if (!carregando) {
      if (!usuario) {
                router.replace('/(autenticacao)/login');
      } else {
                if (perfil === 'advogado') {
          router.replace('/(advogado)/' as any);
        } else {
          router.replace('/(cliente)/' as any);
        }
      }
    }
  }, [usuario, perfil, carregando]);
  
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#d4af37" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4a0e0e', 
    justifyContent: 'center',
    alignItems: 'center',
  },
});
