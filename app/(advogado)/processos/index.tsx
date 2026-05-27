import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { clienteSupabase } from '@/lib/supabase';

type Processo = {
  id: string;
  numero: string;
  cliente_id: string;
  area: string;
  status: string;
  descricao: string;
  created_at: string;
  perfis?: { nome: string };
  duvidas_pendentes: number;
};

export default function ProcessosAdvogado() {
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    carregarProcessos();
  }, []);

  const carregarProcessos = async () => {
    try {
      console.log('📥 Buscando processos...');
      
      const { data: processosData, error } = await clienteSupabase
        .from('processos')
        .select(`
          *,
          perfis:cliente_id (nome)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('✅ Processos encontrados:', processosData?.length || 0);

      const processosList = processosData || [];

      if (processosList.length > 0) {
        const processoIds = processosList.map(p => p.id);
        console.log('🔍 IDs dos processos:', processoIds);
        
        
        const { data: duvidasData, error: duvidasError } = await clienteSupabase
          .from('duvidas_processo')
          .select('processo_id, resposta, status')
          .in('processo_id', processoIds);

        
        const duvidasPendentes = duvidasData?.filter(d => 
          d.resposta === null || d.resposta === '' || d.resposta === undefined
        ) || [];

        console.log('📋 Dúvidas pendentes encontradas:', duvidasPendentes.length);
        console.log('📊 Detalhes das dúvidas pendentes:', duvidasPendentes);
        
        if (duvidasError) {
          console.error('❌ Erro ao buscar dúvidas:', duvidasError);
        }

        // Conta dúvidas por processo
        const contagemMap = new Map<string, number>();
        duvidasPendentes.forEach(d => {
          const atual = contagemMap.get(d.processo_id) || 0;
          contagemMap.set(d.processo_id, atual + 1);
        });

        console.log('📈 Contagem por processo:', Object.fromEntries(contagemMap));

        
        const processosComContagem: Processo[] = processosList.map(p => ({
          id: p.id,
          numero: p.numero,
          cliente_id: p.cliente_id,
          area: p.area,
          status: p.status,
          descricao: p.descricao,
          created_at: p.created_at,
          perfis: p.perfis,
          duvidas_pendentes: contagemMap.get(p.id) ?? 0,
        }));

        setProcessos(processosComContagem);
      } else {
        setProcessos([]);
      }

    } catch (erro: any) {
      console.error('❌ Erro ao carregar processos:', erro);
      Alert.alert('Erro', 'Não foi possível carregar os processos.');
    } finally {
      console.log('🏁 Finalizou carregarProcessos');
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

  const abrirGerenciamento = (processoId: string) => {
    
    router.push({
      pathname: '/(advogado)/processos/[id]',
      params: { id: processoId },
    });
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
        <Text style={styles.balanca}>⚖️</Text>
        <Text style={styles.nomeAdvocacia}>J Silva</Text>
        <Text style={styles.subtitulo}>ADVOCACIA</Text>
        <Text style={styles.titulo}>Processos</Text>
      </View>

      <View style={styles.conteudo}>
        <TouchableOpacity 
          style={styles.botaoNovo}
          onPress={() => router.push('/(advogado)/novo-processo')}
        >
          <Text style={styles.textoBotaoNovo}>+ Novo Processo</Text>
        </TouchableOpacity>

        <Text style={styles.secaoTitulo}>
          {processos.length} Processo{processos.length !== 1 ? 's' : ''}
        </Text>
        
        {processos.length === 0 ? (
          <View style={styles.vazio}>
            <Text style={styles.emojiVazio}>📁</Text>
            <Text style={styles.textoVazio}>Nenhum processo cadastrado</Text>
          </View>
        ) : (
          processos.map((proc) => (
            <TouchableOpacity 
              key={proc.id} 
              style={styles.card}
              onPress={() => abrirGerenciamento(proc.id)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.numeroProcesso}>{proc.numero}</Text>
                <View style={styles.headerDireita}>
                   {proc.duvidas_pendentes > 0 && (
                    <View style={styles.badgeDuvidas}>
                      <Text style={styles.textoBadgeDuvidas}>{proc.duvidas_pendentes}</Text>
                    </View>
                  )}
                  <View style={[styles.statusBadge, styles.statusAtivo]}>
                     <Text style={styles.statusTexto}>{proc.status}</Text>
                  </View>
                </View>
              </View>
              
              <Text style={styles.info}>👤 {proc.perfis?.nome || 'Cliente'}</Text>
              <Text style={styles.info}>⚖️ {proc.area}</Text>
              <Text style={styles.info}>📅 Criado em: {formatarData(proc.created_at)}</Text>
              
              <View style={styles.verMais}>
                <Text style={styles.verMaisTexto}>Gerenciar →</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#4a0e0e' },
  header: { backgroundColor: '#4a0e0e', padding: 24, paddingTop: 60, alignItems: 'center', paddingBottom: 32 },
  voltar: { position: 'absolute', top: 60, left: 24, padding: 8 },
  voltarTexto: { color: '#d4af37', fontSize: 16, fontWeight: '600' },
  balanca: { fontSize: 60, marginBottom: 12 },
  nomeAdvocacia: { fontSize: 32, fontWeight: 'bold', color: '#d4af37' },
  subtitulo: { fontSize: 14, color: '#d4af37', letterSpacing: 6, marginTop: 4, marginBottom: 20 },
  titulo: { fontSize: 24, color: '#fff', fontWeight: 'bold' },
  conteudo: { padding: 16 },
  botaoNovo: { backgroundColor: '#d4af37', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  textoBotaoNovo: { color: '#4a0e0e', fontWeight: 'bold', fontSize: 16 },
  secaoTitulo: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  vazio: { alignItems: 'center', marginTop: 60 },
  emojiVazio: { fontSize: 64, marginBottom: 16 },
  textoVazio: { fontSize: 16, color: '#999', textAlign: 'center' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2, borderLeftWidth: 4, borderLeftColor: '#4a0e0e' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  numeroProcesso: { fontSize: 16, fontWeight: 'bold', color: '#4a0e0e', flex: 1 },
  headerDireita: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badgeDuvidas: { 
    backgroundColor: '#dc3545', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBadgeDuvidas: { 
    color: '#fff', 
    fontSize: 12, 
    fontWeight: 'bold' 
  },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusAtivo: { backgroundColor: '#d4edda' },
  statusTexto: { fontSize: 12, fontWeight: 'bold', color: '#155724' }, // ✅ Nome correto
  info: { fontSize: 14, color: '#555', marginBottom: 4 },
  verMais: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  verMaisTexto: { color: '#d4af37', fontWeight: '600', fontSize: 14 },
});