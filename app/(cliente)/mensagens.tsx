import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { clienteSupabase } from '@/lib/supabase';
import { usarAutenticacao } from '@/store/autenticacao';

type Mensagem = {
  id: string;
  mensagem: string;
  remetente: string;
  lida: boolean;
  created_at: string;
  perfil_cliente?: {
    nome: string;
  };
};

export default function MensagensCliente() {
  const { usuario } = usarAutenticacao();
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  
  
  const NOME_ADVOGADO = 'Dr. Jose Aparecido da Silva';

    useEffect(() => {
    console.log('🔍 Sessão do usuário:', usuario);
    
    if (usuario?.id) {
      carregarMensagens();
      
          const intervalo = setInterval(() => {
        carregarMensagens();
      }, 5000);

      return () => {
        clearInterval(intervalo);
      };
    } else {
      setCarregando(false);
    }
  }, [usuario?.id]);

  const carregarMensagens = async () => {
    if (!usuario?.id) return;
    
    try {
            const { data, error } = await clienteSupabase
        .from('mensagens')
        .select(`
          *,
          perfil_cliente:perfis!cliente_id(nome)
        `)
        .eq('cliente_id', usuario.id) 
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setMensagens(data || []);
    } catch (erro: any) {
      console.error('❌ Erro ao carregar:', erro);
      if (carregando) {
        Alert.alert('Erro', 'Não foi possível carregar as mensagens.');
      }
    } finally {
      setCarregando(false);
    }
  };

  const enviarMensagem = async () => {
    if (!usuario?.id || !novaMensagem.trim()) {
      Alert.alert('Atenção', 'Digite uma mensagem para enviar.');
      return;
    }

    setEnviando(true);

    try {
      const { error } = await clienteSupabase
        .from('mensagens')
        .insert({
          cliente_id: usuario.id,  
          remetente: 'cliente',
          mensagem: novaMensagem.trim(),
          lida: false,
        });

      if (error) throw error;

      setNovaMensagem('');
      carregarMensagens(); 
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
        <Text style={styles.textoLoading}>Carregando conversa...</Text>
      </View>
    );
  }

  if (!usuario?.id) {
    return (
      <View style={styles.center}>
        <Text style={styles.textoErro}>Sessão não encontrada</Text>
        <TouchableOpacity style={styles.botaoVoltar} onPress={() => router.replace('/(autenticacao)/login')}>
          <Text style={styles.textoBotaoVoltar}>Fazer Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.voltar}>
          <Text style={styles.voltarTexto}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.balanca}>💬</Text>
        <Text style={styles.nomeAdvocacia}>J Silva</Text>
        <Text style={styles.subtitulo}>ADVOCACIA</Text>
        <Text style={styles.titulo}>Fale com o Advogado</Text>
      </View>

      {/* Lista de Mensagens */}
      <ScrollView 
        style={styles.listaContainer}
        contentContainerStyle={styles.listaConteudo}
        showsVerticalScrollIndicator={false}
      >
        {mensagens.length === 0 ? (
          <View style={styles.vazio}>
            <Text style={styles.emojiVazio}>📭</Text>
            <Text style={styles.textoVazio}>Nenhuma mensagem ainda</Text>
            <Text style={styles.subtextoVazio}>Envie a primeira mensagem!</Text>
          </View>
        ) : (
          mensagens.map((msg) => {
            
            const ehCliente = msg.remetente === 'cliente';
            const nomeRemetente = ehCliente 
              ? msg.perfil_cliente?.nome || 'Você'
              : NOME_ADVOGADO;  

            return (
              <View
                key={msg.id}
                style={[
                  styles.bolhaMensagem,
                  ehCliente ? styles.bolhaCliente : styles.bolhaAdvogado,
                ]}
              >
                 <Text style={[styles.nomeRemetente, ehCliente && styles.nomeCliente]}>
                  {nomeRemetente}
                </Text>
                
                <Text style={[styles.textoMensagem, ehCliente && styles.textoCliente]}>
                  {msg.mensagem}
                </Text>
                
                <View style={styles.rodapeMensagem}>
                  <Text style={[styles.dataMensagem, ehCliente && styles.dataCliente]}>
                    {formatarData(msg.created_at)}
                  </Text>
                                    {ehCliente && !msg.lida && (
                    <Text style={styles.statusNaoLida}>• Não lida</Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Área de Input */}
      <View style={styles.areaEnvio}>
        <TextInput
          style={styles.inputMensagem}
          placeholder="Digite sua mensagem..."
          placeholderTextColor="#999"
          value={novaMensagem}
          onChangeText={setNovaMensagem}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.botaoEnviar, (enviando || !novaMensagem.trim()) && styles.botaoDesativado]}
          onPress={enviarMensagem}
          disabled={enviando || !novaMensagem.trim()}
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  textoLoading: { color: '#666', marginTop: 12, fontSize: 14 },
  textoErro: { color: '#d32f2f', fontSize: 16, fontWeight: '600', marginBottom: 16 },
  botaoVoltar: { backgroundColor: '#d4af37', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  textoBotaoVoltar: { color: '#4a0e0e', fontWeight: 'bold', fontSize: 14 },
  
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
  textoVazio: { fontSize: 16, fontWeight: '600', color: '#666', marginBottom: 4 },
  subtextoVazio: { fontSize: 14, color: '#999', textAlign: 'center' },
  
  bolhaMensagem: { maxWidth: '85%', padding: 12, borderRadius: 16, marginBottom: 12 },
  bolhaCliente: { backgroundColor: '#d4af37', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bolhaAdvogado: { backgroundColor: '#fff', alignSelf: 'flex-start', borderBottomLeftRadius: 4, elevation: 1 },
  
  
  nomeRemetente: {
    fontSize: 11, 
    fontWeight: 'bold',
    color: '#6b5b0e',
    marginBottom: 4,
  },
  nomeCliente: {
    color: '#4a0e0e',
    textAlign: 'right',
  },
  
  textoMensagem: { fontSize: 15, color: '#333', lineHeight: 20 },
  textoCliente: { color: '#4a0e0e' },
  rodapeMensagem: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4, gap: 6 },
  dataMensagem: { fontSize: 10, color: '#999' },
  dataCliente: { color: '#6b5b0e' },
  statusNaoLida: { fontSize: 10, color: '#6b5b0e', fontWeight: '600' },
  
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