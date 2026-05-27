import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl, Platform, Modal, TextInput } from 'react-native';
import { router } from 'expo-router';
import { clienteSupabase } from '@/lib/supabase';

type Agendamento = {
  id: string;
  cliente_id: string;
  data: string;
  horario: string;
  status: 'pendente' | 'confirmado' | 'cancelado';
  motivo: string;
  motivo_recusa?: string;
  perfis?: { nome: string; email: string };
};

export default function AgendaAdvogado() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processandoId, setProcessandoId] = useState<string | null>(null);
  const [modalRecusaVisivel, setModalRecusaVisivel] = useState(false);
  const [agendamentoParaRecusar, setAgendamentoParaRecusar] = useState<string | null>(null);
  const [motivoRecusa, setMotivoRecusa] = useState('');

  useEffect(() => {
    carregarAgendamentos();
  }, []);

  const carregarAgendamentos = async () => {
    try {
      const { data: { user } } = await clienteSupabase.auth.getUser();

      const { data, error } = await clienteSupabase
        .from('agendamentos')
        .select(`
          *,
          perfis:cliente_id (nome, email)
        `)
        .order('data', { ascending: true })
        .order('horario', { ascending: true });

      if (error) throw error;
      setAgendamentos(data || []);
    } catch (erro: any) {
      console.error('Erro ao carregar agenda:', erro);
      Alert.alert('Erro', 'Não foi possível carregar a agenda.');
    } finally {
      setCarregando(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    carregarAgendamentos();
  };

  const confirmarAgendamento = async (id: string) => {
    setProcessandoId(id);

    try {
      const { data: { user } } = await clienteSupabase.auth.getUser();
      if (!user) {
        Alert.alert('Erro', 'Você precisa estar logado para realizar esta ação.');
        setProcessandoId(null);
        return;
      }

      const { data: resultado, error } = await clienteSupabase
        .from('agendamentos')
        .update({ status: 'confirmado' })
        .eq('id', id)
        .select();

      if (error) throw error;

      if (!resultado || resultado.length === 0) {
        Alert.alert('Atenção', 'O registro não foi atualizado.');
        setProcessandoId(null);
        return;
      }

      Alert.alert('Sucesso', 'Agendamento confirmado!');
      await carregarAgendamentos();
      
    } catch (erro: any) {
      console.error('Erro ao confirmar:', erro);
      Alert.alert('Erro', erro.message || 'Não foi possível confirmar.');
    } finally {
      setProcessandoId(null);
    }
  };

  const abrirModalRecusa = (id: string) => {
    setAgendamentoParaRecusar(id);
    setMotivoRecusa('');
    setModalRecusaVisivel(true);
  };

  const confirmarRecusa = async () => {
    if (!motivoRecusa.trim()) {
      Alert.alert('Atenção', 'Por favor, informe o motivo da recusa.');
      return;
    }

    if (!agendamentoParaRecusar) return;

    setProcessandoId(agendamentoParaRecusar);
    setModalRecusaVisivel(false);

    try {
      const { data: { user } } = await clienteSupabase.auth.getUser();
      if (!user) {
        Alert.alert('Erro', 'Você precisa estar logado para realizar esta ação.');
        setProcessandoId(null);
        return;
      }

      const { data: resultado, error } = await clienteSupabase
        .from('agendamentos')
        .update({ 
          status: 'cancelado',
          motivo_recusa: motivoRecusa.trim()
        })
        .eq('id', agendamentoParaRecusar)
        .select();

      if (error) throw error;

      if (!resultado || resultado.length === 0) {
        Alert.alert('Atenção', 'O registro não foi atualizado.');
        setProcessandoId(null);
        return;
      }

      Alert.alert('Recusado', 'Agendamento recusado com sucesso.');
      setAgendamentoParaRecusar(null);
      setMotivoRecusa('');
      await carregarAgendamentos();
      
    } catch (erro: any) {
      console.error('Erro ao recusar:', erro);
      Alert.alert('Erro', erro.message || 'Não foi possível recusar.');
    } finally {
      setProcessandoId(null);
    }
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

  const getTituloPendentes = () => {
    const totalPendentes = agendamentos.filter(a => a.status === 'pendente').length;
    if (totalPendentes === 0) return 'Nenhuma Solicitação Pendente';
    if (totalPendentes === 1) return '1 Solicitação Pendente';
    return `${totalPendentes} Solicitações Pendentes`;
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
        <Text style={styles.titulo}>Agenda de Consultas</Text>
      </View>

      <View style={styles.conteudo}>
        <Text style={styles.secaoTitulo}>
          {getTituloPendentes()}
        </Text>
        
        {agendamentos.length === 0 ? (
          <View style={styles.vazio}>
            <Text style={styles.emojiVazio}>📭</Text>
            <Text style={styles.textoVazio}>Nenhum agendamento encontrado</Text>
            <Text style={styles.subtextoVazio}>
              Os pedidos de consulta aparecerão aqui.
            </Text>
          </View>
        ) : (
          agendamentos.map((ag) => (
            <View key={ag.id} style={[
              styles.card,
              ag.status === 'pendente' && styles.cardPendente,
              ag.status === 'confirmado' && styles.cardConfirmado,
              ag.status === 'cancelado' && styles.cardCancelado
            ]}>
              <View style={styles.cardHeader}>
                <Text style={styles.clienteNome}>{ag.perfis?.nome || 'Cliente'}</Text>
                <View style={[
                  styles.statusBadge,
                  ag.status === 'pendente' && styles.statusPendente,
                  ag.status === 'confirmado' && styles.statusConfirmado,
                  ag.status === 'cancelado' && styles.statusCancelado
                ]}>
                  <Text style={styles.statusTexto}>
                    {ag.status === 'pendente' && '⏳ Pendente'}
                    {ag.status === 'confirmado' && '✅ Confirmado'}
                    {ag.status === 'cancelado' && '❌ Cancelado'}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.info}>📅 {formatarData(ag.data)}</Text>
              <Text style={styles.info}>⏰ {ag.horario}</Text>
              <Text style={styles.info}>📧 {ag.perfis?.email || 'email@cliente.com'}</Text>
              <Text style={styles.motivo}>💬 {ag.motivo}</Text>

              {ag.status === 'cancelado' && ag.motivo_recusa && (
                <View style={styles.motivoRecusaContainer}>
                  <Text style={styles.motivoRecusaLabel}>📝 Motivo da recusa:</Text>
                  <Text style={styles.motivoRecusaTexto}>{ag.motivo_recusa}</Text>
                </View>
              )}

              {ag.status === 'pendente' && (
                <View style={styles.botoes}>
                  {processandoId === ag.id ? (
                    <ActivityIndicator size="small" color="#d4af37" style={{ margin: 12 }} />
                  ) : (
                    <>
                      <TouchableOpacity 
                        style={[styles.botaoAcao, styles.botaoConfirmar]}
                        onPress={() => confirmarAgendamento(ag.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.textoBotao}>✅ Confirmar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.botaoAcao, styles.botaoRecusar]}
                        onPress={() => abrirModalRecusa(ag.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.textoBotao}>❌ Recusar</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </View>
          ))
        )}
      </View>

      <Modal
        visible={modalRecusaVisivel}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalRecusaVisivel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>Recusar Agendamento</Text>
            <Text style={styles.modalSubtitulo}>
              Informe o motivo da recusa para o cliente:
            </Text>
            
            <TextInput
              style={styles.inputMotivo}
              placeholder="Ex: Horário indisponível, Agenda cheia, Fora do horário de atendimento..."
              value={motivoRecusa}
              onChangeText={setMotivoRecusa}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalBotoes}>
              <TouchableOpacity 
                style={[styles.modalBotao, styles.modalBotaoCancelar]}
                onPress={() => setModalRecusaVisivel(false)}
              >
                <Text style={styles.modalBotaoTextoCancelar}>Voltar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBotao, styles.modalBotaoConfirmar]}
                onPress={confirmarRecusa}
              >
                <Text style={styles.modalBotaoTextoConfirmar}>Recusar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  vazio: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emojiVazio: { fontSize: 64, marginBottom: 16 },
  textoVazio: { fontSize: 18, fontWeight: '600', color: '#666', textAlign: 'center', marginBottom: 8 },
  subtextoVazio: { fontSize: 14, color: '#999', textAlign: 'center' },
  card: { 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12, 
    borderLeftWidth: 4,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
      default: { elevation: 3 },
    }),
  },
  cardPendente: { borderLeftColor: '#ffc107' },
  cardConfirmado: { borderLeftColor: '#28a745' },
  cardCancelado: { borderLeftColor: '#dc3545' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  clienteNome: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginLeft: 8 },
  statusPendente: { backgroundColor: '#fff3cd' },
  statusConfirmado: { backgroundColor: '#d4edda' },
  statusCancelado: { backgroundColor: '#f8d7da' },
  statusTexto: { fontSize: 12, fontWeight: 'bold' },
  info: { fontSize: 14, color: '#555', marginBottom: 4 },
  motivo: { fontSize: 14, color: '#4a0e0e', fontStyle: 'italic', marginTop: 8, marginBottom: 12, padding: 8, backgroundColor: '#f8f9fa', borderRadius: 6 },
  botoes: { flexDirection: 'row', marginTop: 8, gap: 8 },
  botaoAcao: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  botaoConfirmar: { backgroundColor: '#28a745' },
  botaoRecusar: { backgroundColor: '#dc3545' },
  textoBotao: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 10 },
      default: { elevation: 10 },
    }),
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitulo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputMotivo: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalBotoes: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBotao: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBotaoCancelar: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  modalBotaoConfirmar: {
    backgroundColor: '#dc3545',
  },
  modalBotaoTextoCancelar: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
  modalBotaoTextoConfirmar: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});