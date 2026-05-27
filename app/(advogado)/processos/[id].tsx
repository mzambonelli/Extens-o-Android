import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { clienteSupabase } from '@/lib/supabase';

type Duvida = { id: string; pergunta: string; resposta: string | null; cliente_id: string };
type Processo = { id: string; numero: string; vara: string; status: string };

export default function GerenciarProcessoAdvogado() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [processo, setProcesso] = useState<Processo | null>(null);
  const [duvidas, setDuvidas] = useState<Duvida[]>([]);
  const [respostaAtual, setRespostaAtual] = useState({ id: '', texto: '' });
  const [novoStatus, setNovoStatus] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => { if (id) carregarDados(); }, [id]);

  const carregarDados = async () => {
    try {
      const { data: proc } = await clienteSupabase.from('processos').select('*').eq('id', id).single();
      const { data: duv } = await clienteSupabase.from('duvidas_processo').select('id, pergunta, resposta, cliente_id').eq('processo_id', id).order('created_at', { ascending: true });
      setProcesso(proc);
      setNovoStatus(proc?.status || '');
      setDuvidas(duv || []);
    } catch (err) { console.error(err); }
    finally { setCarregando(false); }
  };

  const atualizarStatus = async () => {
    setSalvando(true);
    try {
      await clienteSupabase.from('processos').update({ status: novoStatus }).eq('id', id);
      setProcesso(prev => prev ? { ...prev, status: novoStatus } : null);
      Alert.alert('Sucesso', 'Status atualizado!');
    } catch (err) { Alert.alert('Erro', 'Falha ao atualizar.'); }
    finally { setSalvando(false); }
  };

  const responderDuvida = async (duvidaId: string) => {
    if (!respostaAtual.texto.trim()) return Alert.alert('Atenção', 'Digite a resposta.');
    setSalvando(true);
    try {
      await clienteSupabase.from('duvidas_processo').update({ resposta: respostaAtual.texto.trim(), status: 'respondida' }).eq('id', duvidaId);
      setRespostaAtual({ id: '', texto: '' });
      carregarDados();
      Alert.alert('Respondido!', 'Cliente notificado.');
    } catch (err) { Alert.alert('Erro', 'Falha ao responder.'); }
    finally { setSalvando(false); }
  };

  if (carregando) return <View style={styles.center}><ActivityIndicator size="large" color="#d4af37" /></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.botaoVoltar}>
            <Text style={styles.voltarTexto}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.titulo}>Gerenciar Processo</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Processo: {processo?.numero}</Text>
        <Text style={styles.label}>Vara: {processo?.vara || '-'}</Text>
        
        <Text style={[styles.label, { marginTop: 16 }]}>Atualizar Status:</Text>
        <View style={styles.statusOptions}>
          {['Em andamento', 'Aguardando Despacho', 'Concluso', 'Arquivado'].map(opt => (
            <TouchableOpacity 
              key={opt} 
              style={[styles.chip, novoStatus === opt && styles.chipAtivo]} 
              onPress={() => setNovoStatus(opt)}
            >
              <Text style={[styles.chipTexto, novoStatus === opt && styles.chipTextoAtivo]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.botaoSalvar} onPress={atualizarStatus} disabled={salvando}>
          <Text style={styles.textoBotao}>{salvando ? 'Salvando...' : '💾 Salvar Status'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>❓ Dúvidas do Cliente ({duvidas.length})</Text>
        {duvidas.map(d => (
          <View key={d.id} style={styles.itemDuvida}>
            <Text style={styles.pergunta}>❓ {d.pergunta}</Text>
            {d.resposta ? (
              <View style={styles.respostaBox}><Text style={styles.respostaTexto}>✅ {d.resposta}</Text></View>
            ) : (
              <View style={styles.areaResposta}>
                <TextInput 
                  style={styles.inputResposta} 
                  placeholder="Digite sua resposta..." 
                  value={respostaAtual.id === d.id ? respostaAtual.texto : ''}
                  onChangeText={(t) => setRespostaAtual({ id: d.id, texto: t })}
                  multiline
                />
                <TouchableOpacity style={styles.botaoResponder} onPress={() => responderDuvida(d.id)}>
                  <Text style={styles.textoResponder}>📤 Responder</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
        {duvidas.length === 0 && <Text style={styles.vazio}>Nenhuma dúvida pendente.</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#4a0e0e', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  headerContent: { alignItems: 'center' },
  botaoVoltar: { 
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212, 175, 55, 0.2)', // Fundo dourado suave
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12
  },
  voltarTexto: { 
    color: '#d4af37', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  titulo: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  card: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12, elevation: 2 },
  label: { fontSize: 13, color: '#666', marginBottom: 4 },
  statusOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 10 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  chipAtivo: { backgroundColor: '#d4af37', borderColor: '#d4af37' },
  chipTexto: { fontSize: 13, color: '#666' },
  chipTextoAtivo: { color: '#4a0e0e', fontWeight: 'bold' },
  botaoSalvar: { backgroundColor: '#4a0e0e', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  textoBotao: { color: '#d4af37', fontWeight: 'bold' },
  secao: { padding: 16, paddingTop: 0 },
  secaoTitulo: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  itemDuvida: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 10, elevation: 1 },
  pergunta: { fontSize: 15, color: '#4a0e0e', fontWeight: '600', marginBottom: 6 },
  respostaBox: { backgroundColor: '#e8f5e9', padding: 10, borderRadius: 8, marginTop: 4 },
  respostaTexto: { color: '#2e7d32', fontSize: 14 },
  areaResposta: { marginTop: 8 },
  inputResposta: { 
    backgroundColor: '#f9f9f9', 
    padding: 10, 
    borderRadius: 8, 
    fontSize: 14, 
    borderWidth: 1, 
    borderColor: '#ddd',
    minHeight: 60,
    textAlignVertical: 'top'
  },
  botaoResponder: { backgroundColor: '#d4af37', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  textoResponder: { color: '#4a0e0e', fontWeight: 'bold', fontSize: 14 },
  vazio: { textAlign: 'center', color: '#999', marginVertical: 20 },
});