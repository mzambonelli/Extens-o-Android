import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { clienteSupabase } from '@/lib/supabase';
import { usarAutenticacao } from '@/store/autenticacao';

type Processo = {
  id: string;
  numero: string;
  vara: string;
  status: string;
  created_at: string;
};

export default function ListaProcessosCliente() {
  const { usuario } = usarAutenticacao();
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (usuario?.id) {
      carregarProcessos();
    }
  }, [usuario]);

  const carregarProcessos = async () => {
    if (!usuario?.id) return;

    try {
      const { data, error } = await clienteSupabase
        .from('processos')
        .select('*')
        .eq('cliente_id', usuario.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProcessos(data || []);
    } catch (erro) {
      console.error('Erro ao carregar processos:', erro);
    } finally {
      setCarregando(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    carregarProcessos();
  };

  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'em andamento':
        return { bg: '#e3f2fd', text: '#1565c0' };
      case 'aguardando despacho':
        return { bg: '#fff3cd', text: '#856404' };
      case 'concluso':
        return { bg: '#e8f5e9', text: '#2e7d32' };
      case 'arquivado':
        return { bg: '#f5f5f5', text: '#757575' };
      default:
        return { bg: '#fff3cd', text: '#856404' };
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
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#d4af37" />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.voltar}>
          <Text style={styles.voltarTexto}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.balanca}>📋</Text>
        <Text style={styles.nomeAdvocacia}>J Silva</Text>
        <Text style={styles.subtitulo}>ADVOCACIA</Text>
        <Text style={styles.titulo}>Meus Processos</Text>
      </View>

      <View style={styles.conteudo}>
        <Text style={styles.subtituloLista}>
          {processos.length} Processo{processos.length !== 1 ? 's' : ''}
        </Text>

        {processos.length === 0 ? (
          <View style={styles.vazio}>
            <Text style={styles.emojiVazio}>📁</Text>
            <Text style={styles.textoVazio}>Nenhum processo encontrado</Text>
            <Text style={styles.subtextoVazio}>
              Seus processos aparecerão aqui quando o advogado cadastrá-los.
            </Text>
          </View>
        ) : (
          processos.map((proc) => {
            const statusStyle = getStatusColor(proc.status);
            return (
              <TouchableOpacity 
                key={proc.id} 
                style={styles.card}
                onPress={() => router.push(`/(cliente)/meus-processos/${proc.id}` as any)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.numeroProcesso}>{proc.numero}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusTexto, { color: statusStyle.text }]}>
                      {proc.status}
                    </Text>
                  </View>
                </View>
                
                {proc.vara && (
                  <Text style={styles.info}>⚖️ {proc.vara}</Text>
                )}
                
                <Text style={styles.info}>📅 Cadastrado em: {formatarData(proc.created_at)}</Text>
                
                <View style={styles.verMais}>
                  <Text style={styles.verMaisTexto}>Ver detalhes →</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#4a0e0e', padding: 24, paddingTop: 60, alignItems: 'center', paddingBottom: 30 },
  voltar: { position: 'absolute', top: 60, left: 24, padding: 8 },
  voltarTexto: { color: '#d4af37', fontSize: 16, fontWeight: '600' },
  balanca: { fontSize: 50, marginBottom: 10 },
  nomeAdvocacia: { fontSize: 28, fontWeight: 'bold', color: '#d4af37' },
  subtitulo: { fontSize: 14, color: '#d4af37', letterSpacing: 6, marginBottom: 12 },
  titulo: { fontSize: 22, color: '#fff', fontWeight: 'bold' },
  conteudo: { padding: 16 },
  subtituloLista: { fontSize: 16, fontWeight: '600', color: '#666', marginBottom: 16 },
  vazio: { alignItems: 'center', marginTop: 80 },
  emojiVazio: { fontSize: 64, marginBottom: 16 },
  textoVazio: { fontSize: 18, fontWeight: '600', color: '#666', marginBottom: 8 },
  subtextoVazio: { fontSize: 14, color: '#999', textAlign: 'center', paddingHorizontal: 40 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2, borderLeftWidth: 4, borderLeftColor: '#d4af37' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  numeroProcesso: { fontSize: 16, fontWeight: 'bold', color: '#4a0e0e', flex: 1, marginRight: 12 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusTexto: { fontSize: 12, fontWeight: 'bold' },
  info: { fontSize: 14, color: '#666', marginBottom: 6 },
  verMais: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  verMaisTexto: { color: '#d4af37', fontWeight: '600', fontSize: 14 },
});