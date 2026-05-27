import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { clienteSupabase } from '@/lib/supabase';

export default function NovoCliente() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [carregando, setCarregando] = useState(false);

  const cadastrarCliente = async () => {
    if (!nome || !email || !senha) {
      return Alert.alert('Atenção', 'Preencha nome, e-mail e senha.');
    }

    setCarregando(true);
    try {
     
      const { data: authData, error: authError } = await clienteSupabase.auth.signUp({
        email,
        password: senha,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Falha ao criar usuário');

      
      const { error: perfilError } = await clienteSupabase
        .from('perfis')
        .insert({
          id: authData.user.id,
          nome,
          email,
          telefone: telefone || null,
          perfil: 'cliente',
        });

      if (perfilError) throw perfilError;

      Alert.alert('Sucesso', 'Cliente cadastrado com sucesso!');
      router.back();
    } catch (erro: any) {
      console.error('Erro ao cadastrar:', erro);
      Alert.alert('Erro', erro.message || 'Falha ao cadastrar cliente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.botaoVoltar}>
          <Text style={styles.voltarTexto}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Novo Cliente</Text>
      </View>

      <View style={styles.conteudo}>
        <Text style={styles.label}>Nome Completo</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ex: João Silva"
          value={nome}
          onChangeText={setNome}
        />

        <Text style={styles.label}>E-mail</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ex: joao@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Telefone</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ex: (11) 98765-4321"
          keyboardType="phone-pad"
          value={telefone}
          onChangeText={setTelefone}
        />

        <Text style={styles.label}>Senha Inicial</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Mínimo 6 caracteres"
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
        />

        <TouchableOpacity 
          style={styles.botaoCadastrar} 
          onPress={cadastrarCliente}
          disabled={carregando}
        >
          <Text style={styles.textoBotao}>
            {carregando ? 'Cadastrando...' : '✅ Cadastrar Cliente'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#4a0e0e', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  botaoVoltar: { alignSelf: 'flex-start', backgroundColor: 'rgba(212, 175, 55, 0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginBottom: 12 },
  voltarTexto: { color: '#d4af37', fontSize: 16, fontWeight: '600' },
  titulo: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  conteudo: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#fff', padding: 14, borderRadius: 8, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
  botaoCadastrar: { backgroundColor: '#d4af37', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  textoBotao: { color: '#4a0e0e', fontWeight: 'bold', fontSize: 16 },
});