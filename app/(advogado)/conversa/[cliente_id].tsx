import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { clienteSupabase } from '@/lib/supabase';

type Mensagem = {
  id: string;
  cliente_id: string;
  mensagem: string;
  remetente: string;
  lida: boolean;
  created_at: string;
  perfil_cliente?: {
    nome: string;
  };
};

export default function ConversaAdvogado() {
  const { cliente_id } = useLocalSearchParams<{ cliente_id: string }>();
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaResposta, setNovaResposta] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [clienteNome, setClienteNome] = useState('');
  
  const NOME_ADVOGADO = 'Dr. Jose Aparecido da Silva';

  useEffect(() => {
    if (cliente_id) {
      carregarConversa();
      
      const intervalo = setInterval(() => {
        carregarConversa();
      }, 5000);

      return () => {
        clearInterval(intervalo);
      };
    }
  }, [cliente_id]);

   const carregarConversa = async () => {
    try {
      console.log('📥 Carregando conversa...', cliente_id);
      
    
      const { data: msgsData, error: msgsError } = await clienteSupabase
        .from('mensagens')
        .select(`
          *,
          perfil_cliente:perfis!cliente_id(nome)
        `)
        .eq('cliente_id', cliente_id)
        .order('created_at', { ascending: true });

      if (msgsError) throw msgsError;

      console.log('✅ Mensagens encontradas:', msgsData?.length || 0);

      const { data: clienteData } = await clienteSupabase
        .from('perfis')
        .select('nome')
        .eq('id', cliente_id)
        .single();

      setClienteNome(clienteData?.nome || 'Cliente');

      
      const mensagensNaoLidas = msgsData?.filter(m => !m.lida && m.remetente === 'cliente') || [];
      
      if (mensagensNaoLidas.length > 0) {
        console.log('📝 Marcando', mensagensNaoLidas.length, 'mensagens como lidas...');
        
       
        const idsNaoLidas = mensagensNaoLidas.map(m => m.id);
        
        const { error: updateError, data: updateData } = await clienteSupabase
          .from('mensagens')
          .update({ lida: true })
          .in('id', idsNaoLidas)
          .select('id, lida'); 

        if (updateError) {
          console.error('❌ Erro ao marcar como lida:', updateError);
        } else {
          console.log('✅ Atualizadas:', updateData?.length, 'mensagens');
        }
      } else {
        console.log('ℹ️ Nenhuma mensagem nova pra marcar como lida');
      }

      const mensagensAtualizadas = msgsData?.map(m => ({
        ...m,
        lida: m.remetente === 'cliente' ? true : m.lida,
      })) || [];

      console.log('📊 Estado atualizado:', mensagensAtualizadas.length, 'mensagens');
      setMensagens(mensagensAtualizadas);

    } catch (erro) {
      console.error('❌ Erro ao carregar conversa:', erro);
      if (carregando) {
        Alert.alert('Erro', 'Não foi possível carregar a conversa.');
      }
    } finally {
      setCarregando(false);
    }
  };

  const enviarResposta = async () => {
    if (!novaResposta.trim()) {
      Alert.alert('Atenção', 'Digite uma resposta.');
      return;
    }

    setEnviando(true);

    try {
      const { error } = await clienteSupabase
        .from('mensagens')
        .insert({
          cliente_id: cliente_id,
          remetente: 'advogado',
          mensagem: novaResposta.trim(),
          lida: false,
        });

      if (error) throw error;

      setNovaResposta('');
      carregarConversa();
    } catch (erro: any) {
      console.error('Erro ao enviar:', erro);
      Alert.alert('Erro', 'Não foi possível enviar.');
    } finally {
      setEnviando(false);
    }
  };

  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
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
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.voltar}>
          <Text style={styles.voltarTexto}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.balanca}>💬</Text>
        <Text style={styles.nomeAdvocacia}>J Silva</Text>
        <Text style={styles.subtitulo}>ADVOCACIA</Text>
        <Text style={styles.titulo}>Conversa com {clienteNome}</Text>
      </View>

      <ScrollView 
        style={styles.listaContainer}
        contentContainerStyle={styles.listaConteudo}
      >
        {mensagens.length === 0 ? (
          <View style={styles.vazio}>
            <Text style={styles.emojiVazio}>📭</Text>
            <Text style={styles.textoVazio}>Nenhuma mensagem</Text>
          </View>
        ) : (
          mensagens.map((msg) => {
            const ehAdvogado = msg.remetente === 'advogado';
            const nomeRemetente = ehAdvogado 
              ? NOME_ADVOGADO
              : msg.perfil_cliente?.nome || 'Cliente';

            return (
              <View
                key={msg.id}
                style={[
                  styles.bolhaMensagem,
                  ehAdvogado ? styles.bolhaAdvogado : styles.bolhaCliente,
                ]}
              >
                <Text style={styles.nomeRemetente}>
                  {nomeRemetente}
                </Text>
                
                <Text style={[styles.textoMensagem, ehAdvogado && styles.textoAdvogado]}>
                  {msg.mensagem}
                </Text>
                
                <Text style={[styles.dataMensagem, ehAdvogado && styles.dataAdvogado]}>
                  {formatarData(msg.created_at)}
                  {!msg.lida && msg.remetente === 'cliente' && ' • Não lida'}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={styles.areaEnvio}>
        <TextInput
          style={styles.inputMensagem}
          placeholder="Digite sua resposta..."
          placeholderTextColor="#999"
          value={novaResposta}
          onChangeText={setNovaResposta}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.botaoEnviar, enviando && styles.botaoDesativado]}
          onPress={enviarResposta}
          disabled={enviando || !novaResposta.trim()}
        >
          {enviando ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.textoBotaoEnviar}>Enviar</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#4a0e0e' },
  header: { backgroundColor: '#4a0e0e', padding: 24, paddingTop: 60, alignItems: 'center', paddingBottom: 20 },
  voltar: { position: 'absolute', top: 60, left: 24, padding: 8 },
  voltarTexto: { color: '#d4af37', fontSize: 16, fontWeight: '600' },
  balanca: { fontSize: 50, marginBottom: 8 },
  nomeAdvocacia: { fontSize: 28, fontWeight: 'bold', color: '#d4af37' },
  subtitulo: { fontSize: 14, color: '#d4af37', letterSpacing: 6, marginBottom: 12 },
  titulo: { fontSize: 20, color: '#fff', fontWeight: '600' },
  listaContainer: { flex: 1 },
  listaConteudo: { padding: 16, paddingBottom: 8 },
  vazio: { alignItems: 'center', marginTop: 60 },
  emojiVazio: { fontSize: 64, marginBottom: 12 },
  textoVazio: { fontSize: 16, color: '#999' },
  bolhaMensagem: { maxWidth: '85%', padding: 12, borderRadius: 16, marginBottom: 12 },
  bolhaAdvogado: { backgroundColor: '#d4af37', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bolhaCliente: { backgroundColor: '#fff', alignSelf: 'flex-start', borderBottomLeftRadius: 4, elevation: 1 },
  nomeRemetente: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#6b5b0e',
    marginBottom: 4,
  },
  textoMensagem: { fontSize: 15, color: '#333', lineHeight: 20 },
  textoAdvogado: { color: '#4a0e0e' },
  dataMensagem: { fontSize: 10, color: '#999', marginTop: 4 },
  dataAdvogado: { color: '#6b5b0e', textAlign: 'right' },
  areaEnvio: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 8,
  },
  inputMensagem: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    maxHeight: 100,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#f9f9f9',
    borderRadius: 20,
  },
  botaoEnviar: {
    backgroundColor: '#d4af37',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoDesativado: { backgroundColor: '#ccc' },
  textoBotaoEnviar: { color: '#4a0e0e', fontWeight: 'bold', fontSize: 14 },
});