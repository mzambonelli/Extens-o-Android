import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { usarAutenticacao } from '@/store/autenticacao';
import { clienteSupabase } from '@/lib/supabase';

export default function DashboardAdvogado() {
  const { usuario, sair } = usarAutenticacao();
  const [stats, setStats] = useState({ pendentes: 0, processos: 0, clientes: 0 });
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarEstatisticas();
  }, []);

  const carregarEstatisticas = async () => {
    try {
    
      const { count: pendentes } = await clienteSupabase
        .from('agendamentos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente');

      
      const { count: processos } = await clienteSupabase
        .from('processos')
        .select('*', { count: 'exact', head: true });

     
      const { count: clientes } = await clienteSupabase
        .from('perfis')
        .select('*', { count: 'exact', head: true })
        .eq('perfil', 'cliente');

      setStats({
        pendentes: pendentes || 0,
        processos: processos || 0,
        clientes: clientes || 0
      });
    } catch (error) {
      console.error("Erro ao carregar stats:", error);
    } finally {
      setCarregando(false);
    }
  };

  if (carregando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#d4af37" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.balanca}>⚖️</Text>
        <Text style={styles.nomeAdvocacia}>J Silva</Text>
        <Text style={styles.subtitulo}>ADVOCACIA</Text>
        <Text style={styles.nomeUsuario}>
          Olá, Jose Aparecido da Silva
        </Text>
      </View>

      {/* Card de Estatísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.cardStat}>
          <Text style={styles.numeroStat}>{stats.pendentes}</Text>
          <Text style={styles.textoStat}>Agendamentos{'\n'}Pendentes</Text>
        </View>
        <View style={styles.cardStat}>
          <Text style={styles.numeroStat}>{stats.processos}</Text>
          <Text style={styles.textoStat}>Processos{'\n'}Ativos</Text>
        </View>
        <View style={styles.cardStat}>
          <Text style={styles.numeroStat}>{stats.clientes}</Text>
          <Text style={styles.textoStat}>Total{'\n'}Clientes</Text>
        </View>
      </View>

      {/* Menu Principal */}
      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(advogado)/agenda')}>
          <Text style={styles.menuIcon}>📅</Text>
          <View style={styles.menuTexto}>
            <Text style={styles.menuTitulo}>Agenda</Text>
            <Text style={styles.menuDescricao}>Audiências e compromissos</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(advogado)/clientes')}>
          <Text style={styles.menuIcon}>👥</Text>
          <View style={styles.menuTexto}>
            <Text style={styles.menuTitulo}>Clientes</Text>
            <Text style={styles.menuDescricao}>Gerencie seus clientes</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(advogado)/processos')}>
          <Text style={styles.menuIcon}>📋</Text>
          <View style={styles.menuTexto}>
            <Text style={styles.menuTitulo}>Processos</Text>
            <Text style={styles.menuDescricao}>Todos os processos</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(advogado)/mensagens' as any)}>
          <Text style={styles.menuIcon}>💬</Text>
          <View style={styles.menuTexto}>
            <Text style={styles.menuTitulo}>Mensagens</Text>
            <Text style={styles.menuDescricao}>Conversas com clientes</Text>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.botaoSair} onPress={sair}>
        <Text style={styles.textoSair}>🚪 Sair da Conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#4a0e0e' },
  header: { backgroundColor: '#4a0e0e', padding: 24, paddingTop: 60, alignItems: 'center', paddingBottom: 32 },
  balanca: { fontSize: 70, marginBottom: 12 },
  nomeAdvocacia: { fontSize: 38, fontWeight: 'bold', color: '#d4af37' },
  subtitulo: { fontSize: 16, color: '#d4af37', letterSpacing: 6, marginTop: 4, marginBottom: 20 },
  nomeUsuario: { fontSize: 15, color: '#d4af37', fontWeight: '500' },
  
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, marginTop: -20 },
  cardStat: { backgroundColor: '#fff', width: '30%', padding: 12, borderRadius: 12, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  numeroStat: { fontSize: 24, fontWeight: 'bold', color: '#4a0e0e' },
  textoStat: { fontSize: 10, color: '#666', textAlign: 'center', marginTop: 4, lineHeight: 14 },

  menuContainer: { padding: 16 },
  menuItem: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 12, marginBottom: 12, elevation: 2 },
  menuIcon: { fontSize: 32, marginRight: 16 },
  menuTexto: { flex: 1 },
  menuTitulo: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 4 },
  menuDescricao: { fontSize: 14, color: '#666' },
  botaoSair: { backgroundColor: '#d32f2f', margin: 16, padding: 12, borderRadius: 12, alignItems: 'center' },
  textoSair: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});