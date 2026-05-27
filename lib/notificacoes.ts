import { Platform, Alert } from 'react-native';
import * as Device from 'expo-device';

const isExpoGo = !Device.isDevice;

export const configurarNotificacoes = async () => {
  if (isExpoGo) {
    console.log('📱 Notificações em modo desenvolvimento (Expo Go)');
    return;
  }
};

export const registrarTokenPush = async (userId: string): Promise<string | null> => {
  if (isExpoGo) {
    console.log('🔑 [MOCK] Token simulado para:', userId);
    return 'mock-token';
  }
  return null;
};

export const enviarPush = async (token: string | null, titulo: string, corpo: string): Promise<void> => {
  if (isExpoGo || !token) {
    console.log(`🔔 [MOCK] ${titulo}: ${corpo}`);
    return;
  }
};

export const notificarLocal = (titulo: string, corpo: string) => {
  console.log(`🔔 ${titulo} - ${corpo}`);
  if (__DEV__) {
    Alert.alert(titulo, corpo, [{ text: 'OK' }], { cancelable: true });
  }
};