import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { clienteSupabase } from '@/lib/supabase';
import { usarAutenticacao } from '@/store/autenticacao';

export default function PerfilCliente() {
  const { usuario } = usarAutenticacao();
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  
  
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  
  
  const [mostrarCampoSenha, setMostrarCampoSenha] = useState(false);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');

  useEffect(() => {
    if (usuario?.id) {
      carregarDados();
    }
  }, [usuario]);

  const carregarDados = async () => {
    try {
      const { data, error } = await clienteSupabase
        .from('perfis')
        .select('nome, telefone')
        .eq('id', usuario?.id)
        .single();

      if (data) {
        setNome(data.nome || '');
        setTelefone(data.telefone || '');
      }
    } catch (erro) {
      console.error('Erro ao carregar perfil:', erro);
    } finally {
      setCarregando(false);
    }
  };

  const salvarPerfil = async () => {
    if (!nome.trim()) {
      return Alert.alert('Atenção', 'O nome é obrigatório.');
    }

    setSalvando(true);
    try {
      const { error } = await clienteSupabase
        .from('perfis')
        .update({ nome, telefone })
        .eq('id', usuario?.id);

      if (error) throw error;
      Alert.alert('Sucesso', 'Perfil atualizado!');
    } catch (erro: any) {
      Alert.alert('Erro', 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const alterarSenha = async () => {
    if (novaSenha.length < 6) {
      return Alert.alert('Atenção', 'A senha deve ter no mínimo 6 caracteres.');
    }
    if (novaSenha !== confirmaSenha) {
      return Alert.alert('Erro', 'As senhas não coincidem.');
    }

    setSalvando(true);
    try {
      const { error } = await clienteSupabase.auth.updateUser({
        password: novaSenha
      });

      if (error) throw error;
      
      Alert.alert('Sucesso', 'Senha alterada com sucesso!');
      setMostrarCampoSenha(false);
      setNovaSenha('');
      setConfirmaSenha('');
    } catch (erro: any) {
      Alert.alert('Erro', erro.message || 'Não foi possível alterar a senha.');
    } finally {
      setSalvando(false);
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
        <TouchableOpacity onPress={() => router.back()} style={styles.voltar}>
          <Text style={styles.voltarTexto}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.balanca}>👤</Text>
        <Text style={styles.titulo}>Meu Perfil</Text>
      </View>

      <View style={styles.conteudo}>
        <View style={styles.card}>
          <Text style={styles.label}>Nome Completo</Text>
          <TextInput 
            style={styles.input} 
            value={nome} 
            onChangeText={setNome} 
            placeholder="Seu nome"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Telefone</Text>
          <TextInput 
            style={styles.input} 
            value={telefone} 
            onChangeText={setTelefone} 
            placeholder="(00) 00000-0000"
            keyboardType="phone-pad"
          />
        </View>

        <TouchableOpacity 
          style={styles.botaoSalvar} 
          onPress={salvarPerfil}
          disabled={salvando}
        >
          <Text style={styles.textoBotao}>
            {salvando ? 'Salvando...' : '💾 Salvar Alterações'}
          </Text>
        </TouchableOpacity>

        <View style={styles.divisor} />

        <TouchableOpacity 
          style={styles.linkSenha} 
          onPress={() => setMostrarCampoSenha(!mostrarCampoSenha)}
        >
          <Text style={styles.textoLinkSenha}>
            {mostrarCampoSenha ? '🔒 Ocultar Alterar Senha' : '🔑 Alterar Senha'}
          </Text>
        </TouchableOpacity>

        {mostrarCampoSenha && (
          <View style={styles.cardSenha}>
            <Text style={styles.label}>Nova Senha</Text>
            <TextInput 
              style={styles.input} 
              value={novaSenha} 
              onChangeText={setNovaSenha} 
              placeholder="••••••"
              secureTextEntry
            />

            <Text style={styles.label}>Confirmar Senha</Text>
            <TextInput 
              style={styles.input} 
              value={confirmaSenha} 
              onChangeText={setConfirmaSenha} 
              placeholder="••••••"
              secureTextEntry
            />

            <TouchableOpacity 
              style={[styles.botaoSenha, { backgroundColor: '#4a0e0e' }]} 
              onPress={alterarSenha}
              disabled={salvando}
            >
              <Text style={styles.textoBotao}>
                {salvando ? 'Alterando...' : 'Atualizar Senha'}
              </Text>
            </TouchableOpacity>
          </View>
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
  balanca: { fontSize: 60, marginBottom: 12 },
  titulo: { fontSize: 24, color: '#fff', fontWeight: 'bold' },
  conteudo: { padding: 20 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16 },
  label: { fontSize: 14, color: '#666', marginBottom: 8 },
  input: { backgroundColor: '#f9f9f9', borderRadius: 8, padding: 12, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
  botaoSalvar: { backgroundColor: '#d4af37', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  textoBotao: { color: '#4a0e0e', fontWeight: 'bold', fontSize: 16 },
  divisor: { height: 1, backgroundColor: '#ddd', marginVertical: 20 },
  linkSenha: { alignItems: 'center', marginBottom: 16 },
  textoLinkSenha: { color: '#4a0e0e', fontSize: 16, fontWeight: '600', textDecorationLine: 'underline' },
  cardSenha: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#d4af37' },
  botaoSenha: { marginTop: 16, padding: 12, borderRadius: 8, alignItems: 'center' },
});