import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { clienteSupabase } from '@/lib/supabase';

type Cliente = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
};

export default function ClientesAdvogado() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    try {
      const { data, error } = await clienteSupabase
        .from('perfis')
        .select('id, nome, email, telefone')
        .eq('perfil', 'cliente')
        .order('nome', { ascending: true });

      if (error) throw error;
      setClientes(data || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível carregar os clientes.');
    } finally {
      setCarregando(false);
    }
  };

  const abrirNovoProcesso = (clienteId: string) => {
    router.push({
      pathname: '/(advogado)/novo-processo',
      params: { cliente_id: clienteId },
    });
  };

  const renderItem = ({ item }: { item: Cliente }) => (
    <TouchableOpacity style={styles.clienteCard}>
      <View style={styles.clienteHeader}>
        <Text style={styles.clienteNome}>{item.nome}</Text>
      </View>
      {item.email && <Text style={styles.clienteInfo}>{item.email}</Text>}
      {item.telefone && <Text style={styles.clienteInfo}>{item.telefone}</Text>}
      
      <TouchableOpacity 
        style={styles.botaoProcesso}
        onPress={() => abrirNovoProcesso(item.id)}
      >
        <Text style={styles.botaoProcessoTexto}>+ Novo Processo</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

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
        <TouchableOpacity onPress={() => router.back()} style={styles.voltar}>
          <Text style={styles.voltarTexto}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.balanca}>⚖️</Text>
        <Text style={styles.nomeAdvocacia}>J Silva</Text>
        <Text style={styles.subtitulo}>ADVOCACIA</Text>
        <Text style={styles.titulo}>Clientes</Text>
      </View>

      <View style={styles.conteudo}>
        <FlatList
          data={clientes}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ListEmptyComponent={
            <Text style={styles.vazio}>Nenhum cliente cadastrado.</Text>
          }
        />
        
        <TouchableOpacity 
          style={styles.botaoNovo}
          onPress={() => router.push('/(advogado)/novo-cliente')}
        >
          <Text style={styles.botaoNovoTexto}>+ Novo Cliente</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#4a0e0e', padding: 24, paddingTop: 60, alignItems: 'center', paddingBottom: 32 },
  voltar: { position: 'absolute', top: 60, left: 24, padding: 8 },
  voltarTexto: { color: '#d4af37', fontSize: 16, fontWeight: '600' },
  balanca: { fontSize: 60, marginBottom: 12 },
  nomeAdvocacia: { fontSize: 32, fontWeight: 'bold', color: '#d4af37' },
  subtitulo: { fontSize: 14, color: '#d4af37', letterSpacing: 6, marginTop: 4, marginBottom: 20 },
  titulo: { fontSize: 24, color: '#fff', fontWeight: 'bold' },
  conteudo: { padding: 16 },
  clienteCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  clienteHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  clienteNome: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  clienteInfo: { fontSize: 14, color: '#666', marginTop: 4 },
  botaoProcesso: { backgroundColor: '#f0f0f0', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  botaoProcessoTexto: { color: '#4a0e0e', fontSize: 14, fontWeight: '600' },
  botaoNovo: { backgroundColor: '#d4af37', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  botaoNovoTexto: { color: '#4a0e0e', fontSize: 16, fontWeight: 'bold' },
  vazio: { textAlign: 'center', color: '#999', padding: 20, fontStyle: 'italic' },
});