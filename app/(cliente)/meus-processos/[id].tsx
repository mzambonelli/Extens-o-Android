import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { clienteSupabase } from '@/lib/supabase';
import { usarAutenticacao } from '@/store/autenticacao';

type Duvida = { 
  id: string; 
  pergunta: string; 
  resposta: string | null; 
  status: string; 
  created_at: string;
  updated_at?: string;
};

type Processo = { id: string; numero: string; vara: string; status: string; descricao: string };

export default function DetalhesProcessoCliente() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { usuario } = usarAutenticacao();
  
  const [processo, setProcesso] = useState<Processo | null>(null);
  const [duvidas, setDuvidas] = useState<Duvida[]>([]);
  const [novaPergunta, setNovaPergunta] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (id) carregarDados();
  }, [id]);

  const carregarDados = async () => {
    try {
      const { data: procData } = await clienteSupabase.from('processos').select('*').eq('id', id).single();
      const { data: duvData } = await clienteSupabase
        .from('duvidas_processo')
        .select('*')
        .eq('processo_id', id)
        .order('created_at', { ascending: true });
      
      setProcesso(procData);
      setDuvidas(duvData || []);
    } catch (err) { console.error(err); }
    finally { setCarregando(false); }
  };

  const enviarPergunta = async () => {
    if (!novaPergunta.trim() || !usuario?.id) return Alert.alert('Atenção', 'Digite sua dúvida.');
    setEnviando(true);
    try {
      await clienteSupabase.from('duvidas_processo').insert({
        processo_id: id, cliente_id: usuario.id, pergunta: novaPergunta.trim(), status: 'pendente'
      });
      setNovaPergunta('');
      carregarDados();
      Alert.alert('Enviado!', 'Sua dúvida foi enviada para o advogado.');
    } catch (err) { Alert.alert('Erro', 'Não foi possível enviar.'); }
    finally { setEnviando(false); }
  };

  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', { 
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
    });
  };

  if (carregando) return <View style={styles.center}><ActivityIndicator size="large" color="#d4af37" /></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.voltar}>← Voltar</Text></TouchableOpacity>
        <Text style={styles.titulo}>Detalhes do Processo</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Número</Text>
        <Text style={styles.valor}>{processo?.numero}</Text>
        <Text style={styles.label}>Vara</Text>
        <Text style={styles.valor}>{processo?.vara || 'Não informada'}</Text>
        <Text style={styles.label}>Status Atual</Text>
        <View style={styles.statusBadge}><Text style={styles.statusTexto}>{processo?.status}</Text></View>
      </View>

      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>💬 Histórico de Dúvidas ({duvidas.length})</Text>
        
        {duvidas.map((d, index) => (
          <View key={d.id} style={styles.itemDuvida}>
            <View style={styles.headerDuvida}>
              <Text style={styles.numeroDuvida}>#{index + 1}</Text>
              <Text style={styles.dataDuvida}>{formatarData(d.created_at)}</Text>
            </View>
            
            <View style={styles.perguntaBox}>
              <Text style={styles.perguntaLabel}>❓ Sua pergunta:</Text>
              <Text style={styles.perguntaTexto}>{d.pergunta}</Text>
            </View>

            {d.resposta ? (
              <View style={styles.respostaBox}>
                <Text style={styles.respostaLabel}>✅ Resposta do advogado:</Text>
                <Text style={styles.respostaTexto}>{d.resposta}</Text>
                <Text style={styles.dataResposta}>Respondido em: {formatarData(d.updated_at || d.created_at)}</Text>
              </View>
            ) : (
              <View style={styles.pendenteBox}>
                <Text style={styles.pendenteTexto}>⏳ Aguardando resposta do advogado...</Text>
              </View>
            )}
          </View>
        ))}

        {duvidas.length === 0 && (
          <View style={styles.vazio}>
            <Text style={styles.emojiVazio}>💭</Text>
            <Text style={styles.textoVazio}>Nenhuma pergunta registrada ainda</Text>
            <Text style={styles.subtextoVazio}>Envie sua primeira dúvida sobre este processo!</Text>
          </View>
        )}
      </View>

      <View style={styles.areaInput}>
        <Text style={styles.labelInput}>Nova dúvida sobre este processo:</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ex: Qual o próximo passo do processo?" 
          value={novaPergunta} 
          onChangeText={setNovaPergunta} 
          multiline 
        />
        <TouchableOpacity 
          style={[styles.botao, enviando && styles.desativado]} 
          onPress={enviarPergunta} 
          disabled={enviando}
        >
          <Text style={styles.textoBotao}>{enviando ? 'Enviando...' : 'Enviar para o Advogado'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#4a0e0e', padding: 20, paddingTop: 50, alignItems: 'center' },
  voltar: { position: 'absolute', top: 50, left: 20, color: '#d4af37', fontSize: 16, fontWeight: '600' },
  titulo: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 10 },
  card: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12, elevation: 2 },
  label: { fontSize: 12, color: '#666', marginTop: 8 },
  valor: { fontSize: 16, fontWeight: '600', color: '#333' },
  statusBadge: { backgroundColor: '#fff3cd', padding: 8, borderRadius: 8, marginTop: 8, alignSelf: 'flex-start' },
  statusTexto: { color: '#856404', fontWeight: 'bold', fontSize: 14 },
  secao: { padding: 16, paddingTop: 0 },
  secaoTitulo: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  itemDuvida: { backgroundColor: '#fff', padding: 16, borderRadius: 10, marginBottom: 12, elevation: 1 },
  headerDuvida: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  numeroDuvida: { fontSize: 12, fontWeight: 'bold', color: '#d4af37' },
  dataDuvida: { fontSize: 11, color: '#999' },
  perguntaBox: { backgroundColor: '#fff8e1', padding: 12, borderRadius: 8, marginBottom: 8 },
  perguntaLabel: { fontSize: 11, color: '#666', marginBottom: 4 },
  perguntaTexto: { fontSize: 15, color: '#4a0e0e', fontWeight: '500' },
  respostaBox: { backgroundColor: '#e8f5e9', padding: 12, borderRadius: 8, marginTop: 4 },
  respostaLabel: { fontSize: 11, color: '#666', marginBottom: 4 },
  respostaTexto: { fontSize: 14, color: '#2e7d32' },
  dataResposta: { fontSize: 10, color: '#666', marginTop: 4, fontStyle: 'italic' },
  pendenteBox: { backgroundColor: '#f5f5f5', padding: 10, borderRadius: 8, marginTop: 4 },
  pendenteTexto: { fontSize: 12, color: '#999', fontStyle: 'italic' },
  vazio: { alignItems: 'center', marginVertical: 20 },
  emojiVazio: { fontSize: 48, marginBottom: 8 },
  textoVazio: { fontSize: 14, fontWeight: '600', color: '#666' },
  subtextoVazio: { fontSize: 12, color: '#999', textAlign: 'center' },
  areaInput: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee' },
  labelInput: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, fontSize: 15, marginBottom: 10, borderWidth: 1, borderColor: '#ddd', minHeight: 60 },
  botao: { backgroundColor: '#4a0e0e', padding: 14, borderRadius: 8, alignItems: 'center' },
  textoBotao: { color: '#d4af37', fontWeight: 'bold', fontSize: 16 },
  desativado: { backgroundColor: '#999' },
});