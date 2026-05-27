import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { router } from 'expo-router';
import { clienteSupabase } from '@/lib/supabase';
import { usarAutenticacao } from '@/store/autenticacao';

type Agendamento = {
  id: string;
  data: string;
  horario: string;
  status: 'pendente' | 'confirmado' | 'cancelado';
  motivo: string;
  motivo_recusa?: string;
};

export default function MeusAgendamentos() {
  const { usuario } = usarAutenticacao();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (usuario) {
      carregarAgendamentos();
    }
  }, [usuario]);

  const carregarAgendamentos = async () => {
    if (!usuario) return;

    try {
      const { data, error } = await clienteSupabase
        .from('agendamentos')
        .select('id, data, horario, status, motivo, motivo_recusa')
        .eq('cliente_id', usuario.id)
        .order('data', { ascending: true })
        .order('horario', { ascending: true });

      if (error) throw error;
      setAgendamentos(data || []);
    } catch (erro: any) {
      console.error('Erro ao carregar agendamentos:', erro);
      Alert.alert('Erro', 'Não foi possível carregar seus agendamentos.');
    } finally {
      setCarregando(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    carregarAgendamentos();
  };

  const cancelarAgendamento = async (id: string) => {
    Alert.alert(
      'Cancelar Agendamento',
      'Tem certeza que deseja cancelar este agendamento?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await clienteSupabase
                .from('agendamentos')
                .update({ 
                  status: 'cancelado',
                  motivo: 'Cancelado pelo cliente'
                })
                .eq('id', id);

              if (error) throw error;

              Alert.alert('Cancelado', 'Agendamento cancelado com sucesso.');
              carregarAgendamentos();
            } catch (erro) {
              console.error('Erro ao cancelar:', erro);
              Alert.alert('Erro', 'Não foi possível cancelar.');
            }
          }
        }
      ]
    );
  };

  const reagendarAgendamento = async (agendamento: Agendamento) => {
    Alert.alert(
      'Reagendar Consulta',
      `O agendamento do dia ${new Date(agendamento.data).toLocaleDateString('pt-BR')} às ${agendamento.horario} será cancelado e você poderá escolher nova data e horário. Deseja continuar?`,
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Reagendar',
          onPress: async () => {
            try {
              const { error } = await clienteSupabase
                .from('agendamentos')
                .update({ 
                  status: 'cancelado',
                  motivo: `Reagendado pelo cliente - Motivo original: ${agendamento.motivo}`
                })
                .eq('id', agendamento.id);

              if (error) throw error;

              setAgendamentos(prev => 
                prev.map(ag => 
                  ag.id === agendamento.id 
                    ? { ...ag, status: 'cancelado', motivo: 'Reagendado pelo cliente' }
                    : ag
                )
              );

              router.push('/(cliente)/agendamento');
              
            } catch (erro) {
              console.error('Erro ao reagendar:', erro);
              Alert.alert('Erro', 'Não foi possível reagendar. Tente novamente.');
            }
          }
        }
      ]
    );
  };

  const formatarData = (dataString: string) => {
    const data = new Date(dataString + 'T00:00:00');
    return data.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pendente':
        return { 
          texto: '⏳ Pendente', 
          cor: '#ffc107', 
          fundo: '#fff3cd',
          descricao: 'Aguardando confirmação do advogado'
        };
      case 'confirmado':
        return { 
          texto: '✅ Confirmado', 
          cor: '#28a745', 
          fundo: '#d4edda',
          descricao: 'Consulta confirmada'
        };
      case 'cancelado':
        return { 
          texto: '❌ Cancelado', 
          cor: '#dc3545', 
          fundo: '#f8d7da',
          descricao: 'Consulta cancelada'
        };
      default:
        return { texto: status, cor: '#666', fundo: '#f0f0f0', descricao: '' };
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
        <Text style={styles.balanca}>⚖️</Text>
        <Text style={styles.nomeAdvocacia}>J Silva</Text>
        <Text style={styles.subtitulo}>ADVOCACIA</Text>
        <Text style={styles.titulo}>Meus Agendamentos</Text>
      </View>

      <View style={styles.conteudo}>
        <TouchableOpacity 
          style={styles.botaoNovoTopo}
          onPress={() => router.push('/(cliente)/agendamento')}
        >
          <Text style={styles.textoBotaoNovo}>+ Agendar Nova Consulta</Text>
        </TouchableOpacity>

        {agendamentos.length === 0 ? (
          <View style={styles.vazio}>
            <Text style={styles.emojiVazio}>📭</Text>
            <Text style={styles.textoVazio}>Nenhum agendamento encontrado</Text>
            <Text style={styles.subtextoVazio}>
              Você ainda não tem consultas agendadas.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.secaoTitulo}>
              {agendamentos.length} Agendamento{agendamentos.length !== 1 ? 's' : ''}
            </Text>
            
            {agendamentos.map((ag) => {
              const statusInfo = getStatusInfo(ag.status);
              
              return (
                <View key={ag.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.fundo }]}>
                      <Text style={[styles.statusText, { color: statusInfo.cor }]}>
                        {statusInfo.texto}
                      </Text>
                    </View>
                    {statusInfo.descricao ? (
                      <Text style={styles.statusDescricao}>{statusInfo.descricao}</Text>
                    ) : null}
                  </View>
                  
                  <View style={styles.infoContainer}>
                    <View style={styles.infoLinha}>
                      <Text style={styles.infoIcon}>📅</Text>
                      <Text style={styles.infoTexto}>{formatarData(ag.data)}</Text>
                    </View>
                    
                    <View style={styles.infoLinha}>
                      <Text style={styles.infoIcon}>⏰</Text>
                      <Text style={styles.infoTexto}>{ag.horario}</Text>
                    </View>
                    
                    {ag.motivo && ag.status !== 'cancelado' && (
                      <View style={styles.motivoContainer}>
                        <Text style={styles.motivoLabel}>💬 Motivo:</Text>
                        <Text style={styles.motivoTexto}>{ag.motivo}</Text>
                      </View>
                    )}

                    {ag.status === 'cancelado' && ag.motivo_recusa && (
                      <View style={styles.motivoRecusaContainer}>
                        <Text style={styles.motivoRecusaLabel}>⚠️ Motivo da recusa:</Text>
                        <Text style={styles.motivoRecusaTexto}>{ag.motivo_recusa}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardFooter}>
                    {ag.status === 'pendente' && (
                      <View style={styles.avisoPendente}>
                        <Text style={styles.textoAviso}>
                          Aguardando confirmação do advogado.
                        </Text>
                      </View>
                    )}

                    {(ag.status === 'pendente' || ag.status === 'cancelado') && (
                      <View style={styles.botoesAcao}>
                        <TouchableOpacity 
                          style={styles.botaoReagendar}
                          onPress={() => reagendarAgendamento(ag)}
                        >
                          <Text style={styles.textoBotaoReagendar}>🔄 Reagendar</Text>
                        </TouchableOpacity>
                        
                        {ag.status !== 'cancelado' && (
                          <TouchableOpacity 
                            style={styles.botaoCancelar}
                            onPress={() => cancelarAgendamento(ag.id)}
                          >
                            <Text style={styles.textoBotaoCancelar}>❌ Cancelar</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </>
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
  secaoTitulo: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  botaoNovoTopo: { backgroundColor: '#d4af37', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  textoBotaoNovo: { color: '#4a0e0e', fontWeight: 'bold', fontSize: 16 },
  vazio: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emojiVazio: { fontSize: 64, marginBottom: 16 },
  textoVazio: { fontSize: 20, fontWeight: 'bold', color: '#666', marginBottom: 8, textAlign: 'center' },
  subtextoVazio: { fontSize: 14, color: '#999', textAlign: 'center', marginBottom: 24 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2, borderLeftWidth: 4, borderLeftColor: '#d4af37' },
  cardHeader: { marginBottom: 12 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 4 },
  statusText: { fontSize: 14, fontWeight: 'bold' },
  statusDescricao: { fontSize: 12, color: '#666', fontStyle: 'italic' },
  infoContainer: { gap: 8 },
  infoLinha: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoIcon: { fontSize: 16 },
  infoTexto: { fontSize: 14, color: '#333', flex: 1 },
  motivoContainer: { marginTop: 8, padding: 8, backgroundColor: '#f8f9fa', borderRadius: 6 },
  motivoLabel: { fontSize: 12, color: '#666', fontWeight: '600', marginBottom: 4 },
  motivoTexto: { fontSize: 14, color: '#4a0e0e', fontStyle: 'italic' },
  motivoRecusaContainer: { 
    marginTop: 8, 
    padding: 10, 
    backgroundColor: '#f8d7da', 
    borderRadius: 8, 
    borderLeftWidth: 4, 
    borderLeftColor: '#dc3545' 
  },
  motivoRecusaLabel: { 
    fontSize: 12, 
    color: '#721c24', 
    fontWeight: '600', 
    marginBottom: 4 
  },
  motivoRecusaTexto: { 
    fontSize: 14, 
    color: '#721c24', 
    fontStyle: 'italic' 
  },
  cardFooter: { marginTop: 12, gap: 10 },
  avisoPendente: { padding: 10, backgroundColor: '#fff3cd', borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#ffc107' },
  textoAviso: { fontSize: 13, color: '#856404' },
  botoesAcao: { flexDirection: 'row', gap: 10 },
  botaoReagendar: { flex: 1, backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#d4af37' },
  textoBotaoReagendar: { color: '#4a0e0e', fontWeight: '600', fontSize: 14 },
  botaoCancelar: { flex: 1, backgroundColor: '#fee', padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#dc3545' },
  textoBotaoCancelar: { color: '#dc3545', fontWeight: '600', fontSize: 14 },
});